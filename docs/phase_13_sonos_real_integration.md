# Phase 13 — Sonos Real Integration

## Überblick

Echte lokale Sonos-Steuerung über native UPnP/SSDP — keine externe npm-Abhängigkeit.

---

## Echte Sonos-Raumnamen (dein Netzwerk)

| Sonos-Raumname | Interne Room-ID |
|---|---|
| `Living Room` | `living-room` |
| `Kitchen` | `kitchen` |
| `Main Bedroom` | `main-bedroom` |
| `Bathroom` | `bathroom` |

Die Room-ID wird automatisch aus dem Sonos-Raumnamen generiert (lowercase, Leerzeichen → Bindestrich).  
Mock-Mode verwendet weiterhin die deutschen Namen (Wohnzimmer, Küche, Schlafzimmer, Badezimmer) — unverändert.

---

## Neue Env-Variablen

| Variable | Default | Beschreibung |
|---|---|---|
| `SONOS_MODE` | `mock` | `mock` oder `real` |
| `SONOS_DEVICE_IPS` | _(leer)_ | Komma-getrennte statische IPs (Fallback wenn SSDP blockiert) |
| `SONOS_PRIMARY_ROOM` | `Living Room` | Welcher Raum für Play/Pause/Next/Prev verwendet wird |
| `SONOS_DISCOVERY_TIMEOUT` | `8000` | SSDP Discovery Timeout in ms |
| `SONOS_COMMAND_TIMEOUT` | `5000` | UPnP Command Timeout in ms |

---

## Geänderte Dateien

### Neue Dateien
- `backend/src/services/sonos/sonosTypes.ts` — Shared interfaces (SonosRoom, SonosAdapter, SonosDiagnostics)
- `backend/src/services/sonos/sonosMockAdapter.ts` — Mock-Implementierung (bestehende 4 deutsche Räume)
- `backend/src/services/sonos/sonosRealAdapter.ts` — Echte UPnP-Implementierung via dgram + http
- `backend/src/services/sonos/sonosAdapter.ts` — Factory: wählt Adapter basierend auf SONOS_MODE

### Geänderte Dateien
- `backend/src/services/sonosService.ts` — Thin async facade (delegiert an Adapter)
- `backend/src/routes/sonos.ts` — Async handlers + neuer `/api/sonos/diagnostics` Endpoint
- `backend/src/routes/playback.ts` — Play/Pause/Next/Prev rufen Sonos fire-and-forget auf
- `backend/src/index.ts` — Async startup mit `initializeSonos()`
- `backend/.env.example` — Neue Sonos-Variablen dokumentiert

---

## Neue Endpoints

| Method | Path | Beschreibung |
|---|---|---|
| `GET` | `/api/sonos/diagnostics` | Modus, entdeckte Geräte, gemappte/fehlende Räume, letzter Fehler |

---

## Mock-Modus testen

```bash
# .env: SONOS_MODE=mock (oder Variable weglassen)
cd backend && npm run dev
```

Verhalten: Identisch zu Phase 12. 4 Räume (Wohnzimmer, Küche, Schlafzimmer, Badezimmer). Alle Mock-Daten. Kein Netzwerk-Zugriff.

```bash
curl http://localhost:3001/api/sonos/rooms
curl http://localhost:3001/api/sonos/diagnostics
```

---

## Real-Modus testen

### Voraussetzungen
- Sonos-Lautsprecher im lokalen Netzwerk
- Lautsprecher-Namen in Sonos-App exakt: `Living Room`, `Kitchen`, `Main Bedroom`, `Bathroom`

### .env konfigurieren

```env
SONOS_MODE=real
```

Optional wenn SSDP blockiert ist (z.B. durch VLANs oder Firewall):
```env
SONOS_DEVICE_IPS=192.168.1.100,192.168.1.101,192.168.1.102,192.168.1.103
```

### Starten

```bash
cd backend && npm run dev
```

Beim Start erscheinen im Log:
```
[Sonos] Mode: real — starting discovery...
[Sonos] SSDP found 4 candidate IP(s)
[Sonos]   ✓ Living Room (Sonos Era 100) @ 192.168.1.100
[Sonos]   ✓ Kitchen (Sonos One) @ 192.168.1.101
[Sonos]   ✓ Main Bedroom (Sonos One) @ 192.168.1.102
[Sonos]   ✓ Bathroom (Sonos Roam) @ 192.168.1.103
[Sonos] Discovery complete: 4/4 room(s) online
```

### Diagnostics prüfen

```bash
curl http://localhost:3001/api/sonos/diagnostics
```

Antwort:
```json
{
  "mode": "real",
  "discoveredDevices": [
    { "name": "Living Room",   "ip": "192.168.1.100", "model": "Sonos Era 100" },
    { "name": "Kitchen",       "ip": "192.168.1.101", "model": "Sonos One" },
    { "name": "Main Bedroom",  "ip": "192.168.1.102", "model": "Sonos One" },
    { "name": "Bathroom",      "ip": "192.168.1.103", "model": "Sonos Roam" }
  ],
  "mappedRooms": ["Living Room", "Kitchen", "Main Bedroom", "Bathroom"],
  "unavailableRooms": [],
  "lastError": null
}
```

### Volume testen

```bash
# Wert: 0-100
curl -X POST http://localhost:3001/api/sonos/rooms/living-room/volume \
  -H "Content-Type: application/json" \
  -d '{"volume": 40}'

curl -X POST http://localhost:3001/api/sonos/rooms/main-bedroom/volume \
  -H "Content-Type: application/json" \
  -d '{"volume": 20}'
```

### Mute testen

```bash
curl -X POST http://localhost:3001/api/sonos/rooms/kitchen/mute \
  -H "Content-Type: application/json" \
  -d '{"muted": true}'
```

### Play/Pause testen

```bash
curl -X POST http://localhost:3001/api/play
curl -X POST http://localhost:3001/api/pause
```

---

## Architektur

```
index.ts
  └─ initializeSonos()              reads SONOS_MODE
       ├─ SonosMockAdapter          SONOS_MODE=mock (default)
       └─ SonosRealAdapter          SONOS_MODE=real
            ├─ dgram (UDP/SSDP)     entdeckt Speaker IPs
            ├─ http (UPnP SOAP)     RenderingControl: Volume/Mute
            └─ http (UPnP SOAP)     AVTransport: Play/Pause/Next/Prev

sonosService.ts  (routes importieren dies)
  └─ async facade → getSonosAdapter()

routes/sonos.ts
  ├─ GET  /api/sonos/rooms
  ├─ POST /api/sonos/rooms/:id/volume
  ├─ POST /api/sonos/rooms/:id/mute
  ├─ POST /api/sonos/rooms/:id/group
  └─ GET  /api/sonos/diagnostics

routes/playback.ts
  └─ POST /api/play|pause|next|prev  → Mock-State + Sonos fire-and-forget
```

---

## Bekannte Einschränkungen (Phase 13)

1. **Gruppen-Topologie**: `setGroup()` aktualisiert nur lokalen State. Echter Sonos-Join/Leave via UPnP-DelegateURI ist komplex und deferred auf Phase 14.

2. **Progress-Tracking**: `/api/now-playing` zeigt weiterhin den Mock-Timer-Progress, nicht den echten Sonos-Playback-Fortschritt. Für Phase 14: Sonos AVTransport `GetPositionInfo` pollen.

3. **Spotify-URI-Playback**: Sonos spielt noch keine Spotify-URIs direkt ab. Für Phase 14: `SetAVTransportURI` mit `x-sonos-spotify:` URI.

4. **SSDP auf Windows**: UDP Multicast kann je nach Netzwerkkonfiguration eingeschränkt sein. Fallback: `SONOS_DEVICE_IPS` setzen.

5. **Raumnamen case-sensitive**: Die EXPECTED_ROOMS im Real-Adapter müssen exakt mit den Sonos-Raumnamen übereinstimmen. Aktuell: `Living Room`, `Kitchen`, `Main Bedroom`, `Bathroom`.
