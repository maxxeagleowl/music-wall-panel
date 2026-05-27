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
import type { SonosAdapter, SonosDiagnostics, SonosRoom, SonosQueueItem, SonosPositionInfo, SonosMediaContext, DiscoveredDevice } from './sonosTypes';

// ── Room name normalization ──────────────────────────────────────────────────

const EXPECTED_ROOMS: readonly string[] = ['Living Room', 'Kitchen', 'Main Bedroom', 'Bathroom'];

function nameToId(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-');
}

// ── Native UPnP helpers ──────────────────────────────────────────────────────

const CONTENT_DIRECTORY  = 'urn:schemas-upnp-org:service:ContentDirectory:1';
const CONTENT_DIR_PATH   = '/MediaServer/ContentDirectory/Control';
const RENDERING_CONTROL  = 'urn:schemas-upnp-org:service:RenderingControl:1';
const RENDERING_PATH    = '/MediaRenderer/RenderingControl/Control';
const AV_TRANSPORT      = 'urn:schemas-upnp-org:service:AVTransport:1';
const AV_PATH           = '/MediaRenderer/AVTransport/Control';

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

// Matches <tag> or <tag attr="..."> — handles namespace tags like dc:title, upnp:artist
function extractXmlValue(xml: string, tag: string): string {
  const escapedTag = tag.replace(/:/g, '\\:');
  const match = xml.match(new RegExp(`<${escapedTag}(?:\\s[^>]*)?>([^<]*)<\\/${escapedTag}>`));
  return match ? decodeXmlEntities(match[1]!) : '';
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

// ── DIDL-Lite queue parsing ──────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function parseTimeSeconds(duration: string): number {
  // Format: "H:MM:SS.mmm" → seconds
  const [hms] = duration.split('.');
  const parts = (hms ?? '').split(':').map(Number);
  if (parts.length === 3) return (parts[0] ?? 0) * 3600 + (parts[1] ?? 0) * 60 + (parts[2] ?? 0);
  if (parts.length === 2) return (parts[0] ?? 0) * 60 + (parts[1] ?? 0);
  return 0;
}

function parseDidlItems(didl: string, deviceIp: string): SonosQueueItem[] {
  const items: SonosQueueItem[] = [];
  const itemRe = /<item\s[^>]*>([\s\S]*?)<\/item>/g;
  let m: RegExpExecArray | null;
  let idx = 0;

  while ((m = itemRe.exec(didl)) !== null) {
    const fullTag = m[0]!;
    const body    = m[1]!;

    const idMatch = /\bid="([^"]*)"/.exec(fullTag);
    const id      = idMatch?.[1] ?? `Q:0/${idx + 1}`;

    const title      = extractXmlValue(body, 'dc:title');
    const artist     = extractXmlValue(body, 'upnp:artist')
                    || extractXmlValue(body, 'r:albumArtist')
                    || extractXmlValue(body, 'dc:creator');
    const albumTitle = extractXmlValue(body, 'upnp:album');

    // albumArtURI may be relative (starts with /) or absolute
    const rawCover = extractXmlValue(body, 'upnp:albumArtURI');
    const coverUrl = rawCover
      ? rawCover.startsWith('http')
        ? rawCover
        : `http://${deviceIp}:1400${rawCover}`
      : null;

    // res element: duration attribute + text content = Sonos URI
    const resMatch = /<res\b[^>]*\bduration="([^"]*)"[^>]*>([^<]*)<\/res>/.exec(body);
    const durationSec = resMatch ? parseTimeSeconds(resMatch[1] ?? '') : 0;
    const uri = resMatch ? (resMatch[2] ?? '').trim() : '';

    items.push({
      id,
      trackIndex: idx++,
      title,
      artist,
      albumTitle,
      durationSeconds: durationSec,
      durationFormatted: formatDuration(durationSec),
      coverUrl,
      uri,
    });
  }

  return items;
}

function emptyPositionInfo(): SonosPositionInfo {
  return {
    trackNumber: 0,
    trackDurationSeconds: 0,
    progressSeconds: 0,
    trackUri: '',
    trackTitle: '',
    trackArtist: '',
    trackAlbum: '',
    trackCoverUrl: null,
  };
}

// ── Real adapter ─────────────────────────────────────────────────────────────

interface DeviceEntry {
  ip: string;
  model: string;
}

export class SonosRealAdapter implements SonosAdapter {
  private devices    = new Map<string, DeviceEntry>(); // key: nameToId(roomName)
  private rooms      = new Map<string, SonosRoom>();    // key: room id
  private discovered : DiscoveredDevice[] = [];
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

  private async runDiscovery(): Promise<void> {
    let ips: string[];

    if (this.staticIPs.length > 0) {
      console.log('[Sonos] Using static IPs from SONOS_DEVICE_IPS');
      ips = this.staticIPs;
    } else {
      ips = await discoverSonosIPs(this.discoveryTimeoutMs);
      console.log(`[Sonos] SSDP found ${ips.length} candidate IP(s)`);
    }

    const results = await Promise.all(
      ips.map(async (ip) => {
        const info = await fetchDeviceInfo(ip, 3000);
        return info ? { ip, ...info } : null;
      }),
    );

    this.devices.clear();
    this.discovered = [];

    for (const r of results) {
      if (!r) continue;
      const id = nameToId(r.roomName);
      this.devices.set(id, { ip: r.ip, model: r.model });
      this.discovered.push({ name: r.roomName, ip: r.ip, model: r.model });
      console.log(`[Sonos]   ✓ ${r.roomName} (${r.model}) @ ${r.ip}`);
    }

    this.buildRooms();

    const missing = EXPECTED_ROOMS.filter(n => !this.devices.has(nameToId(n)));
    missing.forEach(n => console.log(`[Sonos]   ⚠ ${n}: not found — marked offline`));
    console.log(`[Sonos] Discovery complete: ${this.devices.size}/${EXPECTED_ROOMS.length} room(s) online`);
  }

  async initialize(): Promise<void> {
    console.log('[Sonos] Mode: real — starting discovery...');
    // Retry up to 3 times — SSDP multicast can be timing-sensitive on Windows
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await this.runDiscovery();
        if (this.devices.size > 0) return;
        if (attempt < 3) {
          console.log(`[Sonos] No devices found on attempt ${attempt}/3, retrying in 3s...`);
          await new Promise(r => setTimeout(r, 3000));
        }
      } catch (err) {
        this.lastError = err instanceof Error ? err.message : String(err);
        console.error(`[Sonos] Discovery error (attempt ${attempt}/3):`, this.lastError);
        if (attempt < 3) await new Promise(r => setTimeout(r, 3000));
      }
    }
    if (this.devices.size === 0) {
      console.warn('[Sonos] All discovery attempts failed — all rooms offline. Use SONOS_DEVICE_IPS for static config.');
      this.buildRooms();
    }
  }

  async rediscover(): Promise<void> {
    console.log('[Sonos] Manual rediscover triggered...');
    try {
      await this.runDiscovery();
    } catch (err) {
      this.lastError = err instanceof Error ? err.message : String(err);
      console.error('[Sonos] Rediscover error:', this.lastError);
      this.buildRooms();
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

  // ── Position info via AVTransport GetPositionInfo ──────────────────────────

  async getPositionInfo(): Promise<SonosPositionInfo> {
    const device = this.getPrimaryDevice();
    if (!device) {
      console.log('[Sonos] getPositionInfo: no primary device — returning zeros');
      return emptyPositionInfo();
    }

    try {
      const response = await soapPost(
        device.ip, AV_PATH, AV_TRANSPORT, 'GetPositionInfo',
        `<u:GetPositionInfo xmlns:u="${AV_TRANSPORT}"><InstanceID>0</InstanceID></u:GetPositionInfo>`,
        this.commandTimeoutMs,
      );

      const trackStr  = extractXmlValue(response, 'Track');
      const trackDur  = extractXmlValue(response, 'TrackDuration');
      const relTime   = extractXmlValue(response, 'RelTime');
      const trackUri  = extractXmlValue(response, 'TrackURI');
      const rawMeta   = extractXmlValue(response, 'TrackMetaData');

      const trackNumber     = parseInt(trackStr, 10) || 0;
      const durationSeconds = parseTimeSeconds(trackDur);
      const progressSeconds = parseTimeSeconds(relTime);

      // Parse TrackMetaData DIDL-Lite for rich current-track metadata
      let trackTitle = '', trackArtist = '', trackAlbum = '', trackCoverUrl: string | null = null;
      if (rawMeta && rawMeta !== 'NOT_IMPLEMENTED') {
        const decoded = rawMeta
          .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&apos;/g, "'");
        const metaItems = parseDidlItems(decoded, device.ip);
        if (metaItems.length > 0) {
          const first = metaItems[0]!;
          trackTitle   = first.title;
          trackArtist  = first.artist;
          trackAlbum   = first.albumTitle;
          trackCoverUrl = first.coverUrl;
        }
      }

      console.log(
        `[Sonos Position] track=${trackNumber} relTime=${progressSeconds}s ` +
        `duration=${durationSeconds}s uri="${trackUri.slice(0, 60)}"`,
      );

      return { trackNumber, trackDurationSeconds: durationSeconds, progressSeconds, trackUri, trackTitle, trackArtist, trackAlbum, trackCoverUrl };
    } catch (err) {
      console.warn('[Sonos] getPositionInfo failed:', err instanceof Error ? err.message : String(err));
      return emptyPositionInfo();
    }
  }

  // ── Media info via AVTransport GetMediaInfo ───────────────────────────────

  async getMediaInfo(): Promise<SonosMediaContext> {
    const device = this.getPrimaryDevice();
    if (!device) return { contextType: 'unknown', contextId: '', contextUri: '', contextTitle: '' };

    try {
      const response = await soapPost(
        device.ip, AV_PATH, AV_TRANSPORT, 'GetMediaInfo',
        `<u:GetMediaInfo xmlns:u="${AV_TRANSPORT}"><InstanceID>0</InstanceID></u:GetMediaInfo>`,
        this.commandTimeoutMs,
      );

      const rawUri = extractXmlValue(response, 'CurrentURI');
      if (!rawUri) return { contextType: 'unknown', contextId: '', contextUri: '', contextTitle: '' };

      const decoded = decodeURIComponent(rawUri);

      // Extract CurrentURIMetaData using indexOf — more robust than regex for large/unencoded DIDL
      const metaOpen = '<CurrentURIMetaData>';
      const metaClose = '</CurrentURIMetaData>';
      const metaStart = response.indexOf(metaOpen);
      const metaEnd   = response.indexOf(metaClose, metaStart);
      const rawMeta = metaStart !== -1 && metaEnd !== -1
        ? response.slice(metaStart + metaOpen.length, metaEnd)
        : '';

      // Parse playlist context from CurrentURIMetaData DIDL
      // Decode order: &amp; first (handles double-encoded content), then &lt;/&gt;
      let contextTitle = '';
      let contextId = '';
      let isPlaylistContext = false;

      if (rawMeta && rawMeta !== 'NOT_IMPLEMENTED') {
        const decodedMeta = rawMeta
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"').replace(/&apos;/g, "'");

        const upnpClass = extractXmlValue(decodedMeta, 'upnp:class');
        isPlaylistContext = upnpClass.toLowerCase().includes('playlist');

        // Only use dc:title as playlist name when metadata describes a container/playlist
        if (isPlaylistContext) {
          contextTitle = extractXmlValue(decodedMeta, 'dc:title');
        }

        // Also search for Spotify playlist ID anywhere in the decoded metadata
        // (may appear in container id attr as "1006006cspotify:playlist:ID" or encoded)
        if (!contextId) {
          const idMatch = decodedMeta.match(/spotify:playlist:([A-Za-z0-9]+)/)
                       ?? decodedMeta.match(/spotify%3[Aa]playlist%3[Aa]([A-Za-z0-9]+)/);
          if (idMatch) {
            contextId = idMatch[1] ?? '';
            isPlaylistContext = true;
          }
        }

        console.log(
          `[Sonos MediaInfo] meta: class="${upnpClass}" isPlaylist=${isPlaylistContext}` +
          ` title="${contextTitle}" id="${contextId}"`,
        );
      }

      console.log(`[Sonos MediaInfo] CurrentURI="${decoded.slice(0, 120)}"`);

      // Detect context from CurrentURI
      if (decoded.includes('spotify:playlist:')) {
        const after = decoded.split('spotify:playlist:')[1] ?? '';
        const uriId = after.split(/[?&#\s]/)[0] ?? '';
        return { contextType: 'playlist', contextId: contextId || uriId, contextUri: decoded, contextTitle };
      }
      if (decoded.includes('spotify:album:')) {
        const after = decoded.split('spotify:album:')[1] ?? '';
        const uriId = after.split(/[?&#\s]/)[0] ?? '';
        return { contextType: 'album', contextId: uriId, contextUri: decoded, contextTitle };
      }
      if (isPlaylistContext) {
        return { contextType: 'playlist', contextId, contextUri: decoded, contextTitle };
      }
      return { contextType: 'track', contextId: '', contextUri: decoded, contextTitle: '' };
    } catch (err) {
      console.warn('[Sonos] getMediaInfo failed:', err instanceof Error ? err.message : String(err));
      return { contextType: 'unknown', contextId: '', contextUri: '', contextTitle: '' };
    }
  }

  async getTransportInfo(): Promise<{ isPlaying: boolean }> {
    const device = this.getPrimaryDevice();
    if (!device) return { isPlaying: false };
    try {
      const response = await soapPost(
        device.ip, AV_PATH, AV_TRANSPORT, 'GetTransportInfo',
        `<u:GetTransportInfo xmlns:u="${AV_TRANSPORT}"><InstanceID>0</InstanceID></u:GetTransportInfo>`,
        this.commandTimeoutMs,
      );
      const state = extractXmlValue(response, 'CurrentTransportState');
      return { isPlaying: state === 'PLAYING' };
    } catch {
      return { isPlaying: false };
    }
  }

  // ── Queue via UPnP ContentDirectory Browse ────────────────────────────────

  async getQueue(): Promise<SonosQueueItem[]> {
    const device = this.getPrimaryDevice();
    if (!device) {
      console.log('[Sonos] getQueue: no primary device available — returning empty');
      return [];
    }

    const innerBody =
      `<u:Browse xmlns:u="${CONTENT_DIRECTORY}">` +
      `<ObjectID>Q:0</ObjectID>` +
      `<BrowseFlag>BrowseDirectChildren</BrowseFlag>` +
      `<Filter>*</Filter>` +
      `<StartingIndex>0</StartingIndex>` +
      `<RequestedCount>100</RequestedCount>` +
      `<SortCriteria></SortCriteria>` +
      `</u:Browse>`;

    try {
      const response = await soapPost(
        device.ip, CONTENT_DIR_PATH, CONTENT_DIRECTORY, 'Browse', innerBody, this.commandTimeoutMs,
      );

      const rStart = response.indexOf('<Result>');
      const rEnd   = response.indexOf('</Result>');
      if (rStart === -1 || rEnd === -1) {
        console.log('[Sonos] getQueue: no <Result> in Browse response — queue empty');
        return [];
      }

      const encoded = response.slice(rStart + 8, rEnd);
      const didl = encoded
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'");

      const items = parseDidlItems(didl, device.ip);
      console.log(`[Sonos] getQueue: ${items.length} item(s) from "${device.name}" (${device.ip})`);
      return items;
    } catch (err) {
      console.warn('[Sonos] getQueue failed:', err instanceof Error ? err.message : String(err));
      return [];
    }
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
