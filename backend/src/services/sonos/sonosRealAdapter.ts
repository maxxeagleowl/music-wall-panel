/**
 * Real Sonos adapter using native Node.js UPnP/SSDP.
 *
 * No external library — uses built-in dgram (UDP) for SSDP discovery and
 * built-in http for UPnP SOAP commands. Sonos speakers expose standard
 * UPnP services on port 1400: RenderingControl (volume/mute) and
 * AVTransport (play/pause/next/previous).
 */

import * as dgram from 'dgram';
import * as http from 'http';
import type { SonosAdapter, SonosDiagnostics, SonosRoom, DiscoveredDevice } from './sonosTypes';

// ── Room name normalization ──────────────────────────────────────────────────

const EXPECTED_ROOMS: readonly string[] = ['Living Room', 'Kitchen', 'Main Bedroom', 'Bathroom'];

function nameToId(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-');
}

// ── Native UPnP helpers ──────────────────────────────────────────────────────

const RENDERING_CONTROL = 'urn:schemas-upnp-org:service:RenderingControl:1';
const RENDERING_PATH    = '/MediaRenderer/RenderingControl/Control';
const AV_TRANSPORT      = 'urn:schemas-upnp-org:service:AVTransport:1';
const AV_PATH           = '/MediaRenderer/AVTransport/Control';

function extractXmlValue(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
  return match?.[1] ?? '';
}

function httpGet(url: string, timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { timeout: timeoutMs }, (res) => {
      let data = '';
      res.on('data', (chunk: Buffer) => { data += chunk.toString(); });
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy(new Error(`GET ${url} timed out after ${timeoutMs}ms`));
    });
  });
}

function soapPost(
  ip: string,
  path: string,
  service: string,
  action: string,
  innerBody: string,
  timeoutMs: number,
): Promise<string> {
  const envelope =
    '<?xml version="1.0" encoding="utf-8"?>' +
    '<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"' +
    ' s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">' +
    '<s:Body>' + innerBody + '</s:Body></s:Envelope>';

  const payload = Buffer.from(envelope, 'utf8');

  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: ip,
        port: 1400,
        path,
        method: 'POST',
        timeout: timeoutMs,
        headers: {
          'Content-Type': 'text/xml; charset="utf-8"',
          'Content-Length': payload.length,
          SOAPAction: `"${service}#${action}"`,
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk: Buffer) => { body += chunk.toString(); });
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`SOAP ${action} → HTTP ${res.statusCode}: ${body}`));
          } else {
            resolve(body);
          }
        });
      },
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy(new Error(`SOAP ${action} timed out after ${timeoutMs}ms`));
    });
    req.write(payload);
    req.end();
  });
}

async function getVolume(ip: string, timeoutMs: number): Promise<number> {
  const xml = await soapPost(
    ip, RENDERING_PATH, RENDERING_CONTROL, 'GetVolume',
    `<u:GetVolume xmlns:u="${RENDERING_CONTROL}"><InstanceID>0</InstanceID><Channel>Master</Channel></u:GetVolume>`,
    timeoutMs,
  );
  return parseInt(extractXmlValue(xml, 'CurrentVolume'), 10) || 0;
}

async function setVolumeUPnP(ip: string, volume: number, timeoutMs: number): Promise<void> {
  await soapPost(
    ip, RENDERING_PATH, RENDERING_CONTROL, 'SetVolume',
    `<u:SetVolume xmlns:u="${RENDERING_CONTROL}"><InstanceID>0</InstanceID><Channel>Master</Channel><DesiredVolume>${volume}</DesiredVolume></u:SetVolume>`,
    timeoutMs,
  );
}

async function getMute(ip: string, timeoutMs: number): Promise<boolean> {
  const xml = await soapPost(
    ip, RENDERING_PATH, RENDERING_CONTROL, 'GetMute',
    `<u:GetMute xmlns:u="${RENDERING_CONTROL}"><InstanceID>0</InstanceID><Channel>Master</Channel></u:GetMute>`,
    timeoutMs,
  );
  return extractXmlValue(xml, 'CurrentMute') === '1';
}

async function setMuteUPnP(ip: string, muted: boolean, timeoutMs: number): Promise<void> {
  await soapPost(
    ip, RENDERING_PATH, RENDERING_CONTROL, 'SetMute',
    `<u:SetMute xmlns:u="${RENDERING_CONTROL}"><InstanceID>0</InstanceID><Channel>Master</Channel><DesiredMute>${muted ? 1 : 0}</DesiredMute></u:SetMute>`,
    timeoutMs,
  );
}

async function avTransportAction(ip: string, action: string, innerBody: string, timeoutMs: number): Promise<void> {
  await soapPost(ip, AV_PATH, AV_TRANSPORT, action, innerBody, timeoutMs);
}

// ── SSDP discovery ──────────────────────────────────────────────────────────

function discoverSonosIPs(timeoutMs: number): Promise<string[]> {
  return new Promise((resolve) => {
    const socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
    const seen = new Set<string>();

    const M_SEARCH = Buffer.from(
      'M-SEARCH * HTTP/1.1\r\n' +
      'HOST: 239.255.255.250:1900\r\n' +
      'MAN: "ssdp:discover"\r\n' +
      'MX: 1\r\n' +
      'ST: urn:schemas-upnp-org:device:ZonePlayer:1\r\n' +
      '\r\n',
    );

    socket.on('error', (err) => {
      console.warn('[Sonos] SSDP socket error:', err.message);
    });

    socket.on('message', (msg, rinfo) => {
      const str = msg.toString('utf8');
      // Filter to Sonos-specific responses
      if ((str.includes('ZonePlayer') || str.includes('Sonos')) && !seen.has(rinfo.address)) {
        seen.add(rinfo.address);
      }
    });

    socket.bind(0, () => {
      try {
        socket.setBroadcast(true);
        socket.send(M_SEARCH, 0, M_SEARCH.length, 1900, '239.255.255.250');
      } catch (err) {
        console.warn('[Sonos] SSDP send failed:', err);
      }
    });

    setTimeout(() => {
      try { socket.close(); } catch { /* already closed */ }
      resolve(Array.from(seen));
    }, timeoutMs);
  });
}

async function fetchDeviceInfo(
  ip: string,
  timeoutMs: number,
): Promise<{ roomName: string; model: string } | null> {
  try {
    const xml = await httpGet(`http://${ip}:1400/xml/device_description.xml`, timeoutMs);
    const roomName = extractXmlValue(xml, 'roomName');
    const model    = extractXmlValue(xml, 'modelName') || 'Sonos';
    if (!roomName) return null;
    return { roomName, model };
  } catch {
    return null;
  }
}

// ── Real adapter ─────────────────────────────────────────────────────────────

interface DeviceEntry {
  ip: string;
  model: string;
}

export class SonosRealAdapter implements SonosAdapter {
  private devices  = new Map<string, DeviceEntry>(); // key: nameToId(roomName)
  private rooms    = new Map<string, SonosRoom>();    // key: room id
  private discovered: DiscoveredDevice[] = [];
  private lastError: string | null = null;

  private readonly discoveryTimeoutMs: number;
  private readonly commandTimeoutMs: number;
  private readonly primaryRoomId: string;
  private readonly staticIPs: string[];

  constructor() {
    this.discoveryTimeoutMs = Number(process.env.SONOS_DISCOVERY_TIMEOUT) || 8000;
    this.commandTimeoutMs   = Number(process.env.SONOS_COMMAND_TIMEOUT)   || 5000;
    this.primaryRoomId      = process.env.SONOS_PRIMARY_ROOM
      ? nameToId(process.env.SONOS_PRIMARY_ROOM)
      : 'living-room';
    this.staticIPs = (process.env.SONOS_DEVICE_IPS ?? '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
  }

  async initialize(): Promise<void> {
    console.log('[Sonos] Mode: real — starting discovery...');
    try {
      let ips: string[];

      if (this.staticIPs.length > 0) {
        // Static IPs provided — skip SSDP (useful when multicast is blocked)
        console.log('[Sonos] Using static IPs from SONOS_DEVICE_IPS');
        ips = this.staticIPs;
      } else {
        ips = await discoverSonosIPs(this.discoveryTimeoutMs);
        console.log(`[Sonos] SSDP found ${ips.length} candidate IP(s)`);
      }

      // Resolve device info for each candidate IP
      const results = await Promise.all(
        ips.map(async (ip) => {
          const info = await fetchDeviceInfo(ip, 3000);
          return info ? { ip, ...info } : null;
        }),
      );

      for (const r of results) {
        if (!r) continue;
        const id = nameToId(r.roomName);
        this.devices.set(id, { ip: r.ip, model: r.model });
        this.discovered.push({ name: r.roomName, ip: r.ip, model: r.model });
        console.log(`[Sonos]   ✓ ${r.roomName} (${r.model}) @ ${r.ip}`);
      }

      // Build room list based on expected rooms
      this.buildRooms();

      const missing = EXPECTED_ROOMS.filter(n => !this.devices.has(nameToId(n)));
      missing.forEach(n => console.log(`[Sonos]   ⚠ ${n}: not found — marked offline`));

      console.log(`[Sonos] Discovery complete: ${this.devices.size}/${EXPECTED_ROOMS.length} room(s) online`);
    } catch (err) {
      this.lastError = err instanceof Error ? err.message : String(err);
      console.error('[Sonos] Discovery error:', this.lastError);
      this.buildRooms(); // all rooms offline
    }
  }

  private buildRooms(): void {
    for (const name of EXPECTED_ROOMS) {
      const id      = nameToId(name);
      const online  = this.devices.has(id);
      const existing = this.rooms.get(id);
      this.rooms.set(id, {
        id,
        name,
        volume:    existing?.volume  ?? 0,
        muted:     existing?.muted   ?? false,
        groupId:   existing?.groupId ?? null,
        available: online,
      });
    }
  }

  async getRooms(): Promise<SonosRoom[]> {
    // Refresh volume/mute state from live devices
    const updated = await Promise.all(
      Array.from(this.rooms.values()).map(async (room) => {
        const entry = this.devices.get(room.id);
        if (!entry) return room;
        try {
          const [volume, muted] = await Promise.all([
            getVolume(entry.ip, this.commandTimeoutMs),
            getMute(entry.ip, this.commandTimeoutMs),
          ]);
          return { ...room, volume, muted, available: true };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.warn(`[Sonos] ${room.name}: state refresh failed — ${msg}`);
          return { ...room, available: false };
        }
      }),
    );
    updated.forEach(r => this.rooms.set(r.id, r));
    return updated;
  }

  async setVolume(id: string, volume: number): Promise<SonosRoom | null> {
    const room  = this.rooms.get(id);
    if (!room) return null;
    const entry = this.devices.get(id);
    if (!entry) return { ...room, available: false };

    try {
      const v = Math.max(0, Math.min(100, volume));
      await setVolumeUPnP(entry.ip, v, this.commandTimeoutMs);
      const updated = { ...room, volume: v, available: true };
      this.rooms.set(id, updated);
      console.log(`[Sonos] ${room.name}: volume → ${v}`);
      return updated;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[Sonos] ${room.name}: setVolume failed — ${msg}`);
      this.lastError = msg;
      return { ...room, available: false };
    }
  }

  async setMute(id: string, muted: boolean): Promise<SonosRoom | null> {
    const room  = this.rooms.get(id);
    if (!room) return null;
    const entry = this.devices.get(id);
    if (!entry) return { ...room, available: false };

    try {
      await setMuteUPnP(entry.ip, muted, this.commandTimeoutMs);
      const updated = { ...room, muted, available: true };
      this.rooms.set(id, updated);
      console.log(`[Sonos] ${room.name}: mute → ${muted}`);
      return updated;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[Sonos] ${room.name}: setMute failed — ${msg}`);
      this.lastError = msg;
      return { ...room, available: false };
    }
  }

  async setGroup(id: string, groupId: string | null): Promise<SonosRoom | null> {
    const room  = this.rooms.get(id);
    if (!room) return null;
    const entry = this.devices.get(id);

    // Group topology changes via UPnP are complex (delegate URI tricks).
    // Phase 13 tracks group state locally and logs the intent.
    // Full group management is deferred to Phase 14.
    if (entry) {
      const action = groupId === null ? 'leave group' : `join group ${groupId}`;
      console.log(`[Sonos] ${room.name}: ${action} (local state only — full group sync in Phase 14)`);
    }

    const updated = { ...room, groupId, available: entry !== undefined };
    this.rooms.set(id, updated);
    return updated;
  }

  private getPrimaryDevice(): { ip: string; name: string } | null {
    const primary = this.devices.get(this.primaryRoomId);
    if (primary) {
      const name = this.rooms.get(this.primaryRoomId)?.name ?? this.primaryRoomId;
      return { ip: primary.ip, name };
    }
    const firstId = Array.from(this.devices.keys())[0];
    if (!firstId) return null;
    const first = this.devices.get(firstId)!;
    const name = this.rooms.get(firstId)?.name ?? firstId;
    return { ip: first.ip, name };
  }

  private async avTransport(action: string, innerBody: string): Promise<void> {
    const device = this.getPrimaryDevice();
    if (!device) {
      const msg = `${action}: no Sonos device available (primary: ${this.primaryRoomId})`;
      console.error(`[Sonos] transport ✗ | action: ${action} | ${msg}`);
      throw new Error(msg);
    }
    console.log(`[Sonos] transport → | action: ${action} | room: "${device.name}" | ip: ${device.ip}`);
    try {
      await avTransportAction(device.ip, action, innerBody, this.commandTimeoutMs);
      console.log(`[Sonos] transport ✓ | action: ${action} | room: "${device.name}" | ip: ${device.ip}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[Sonos] transport ✗ | action: ${action} | room: "${device.name}" | ip: ${device.ip} | ${msg}`);
      this.lastError = msg;
      throw err;
    }
  }

  async play(): Promise<void> {
    await this.avTransport('Play',
      `<u:Play xmlns:u="${AV_TRANSPORT}"><InstanceID>0</InstanceID><Speed>1</Speed></u:Play>`);
  }

  async pause(): Promise<void> {
    await this.avTransport('Pause',
      `<u:Pause xmlns:u="${AV_TRANSPORT}"><InstanceID>0</InstanceID></u:Pause>`);
  }

  async next(): Promise<void> {
    await this.avTransport('Next',
      `<u:Next xmlns:u="${AV_TRANSPORT}"><InstanceID>0</InstanceID></u:Next>`);
  }

  async previous(): Promise<void> {
    await this.avTransport('Previous',
      `<u:Previous xmlns:u="${AV_TRANSPORT}"><InstanceID>0</InstanceID></u:Previous>`);
  }

  getDiagnostics(): SonosDiagnostics {
    const unavailableRooms = EXPECTED_ROOMS.filter(n => !this.devices.has(nameToId(n)));
    return {
      mode: 'real',
      discoveredDevices: this.discovered,
      mappedRooms: Array.from(this.rooms.values()).filter(r => r.available).map(r => r.name),
      unavailableRooms,
      lastError: this.lastError,
    };
  }
}
