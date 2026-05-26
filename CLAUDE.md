# Music Wall Panel

Premium wandmontiertes Music Control Panel. Ziel: wirkt wie echte Premium-Hardware (B&O, Sonos, Tesla-Ästhetik).

**Runtime-Ziel:** Raspberry Pi 5 + Chromium Kiosk, 1280×800 Touch Display.

---

## Architektur

```
Frontend (React/Vite)
    ↓ HTTP polling 1s / user actions
Backend (Express/Node)
    ↓
Spotify Web API   (Content + Auth + Metadaten)
    ↓ (Phase 13+)
Sonos API         (echtes Playback + Multiroom)
```

**Kernprinzip:** Backend ist Single Source of Truth. Frontend rendert nur und sendet Actions.  
**Kein direktes Spotify im Frontend.** Kein Browser-Audio. Kein Web Playback SDK.

---

## Tech Stack

| Bereich | Stack |
|---------|-------|
| Frontend | React 19, TypeScript, Vite, Tailwind 3, Framer Motion |
| Backend | Node.js, Express, TypeScript, ts-node-dev |
| Playback (aktuell) | Simulated im Backend |
| Playback (Phase 13) | Sonos via Sonos API |
| Musik-Quelle | Spotify Web API (OAuth, Library, Search) |

---

## Projekt starten

```bash
# Backend (Port 3001)
cd backend && npm run dev

# Frontend (Port 5173)
cd frontend && npm run dev
```

Frontend läuft auf http://localhost:5173  
Backend API auf http://localhost:3001

---

## Dateistruktur

```
frontend/src/
  App.tsx                    # Root, State-Koordination, Polling
  components/
    CoverFlow.tsx            # 3D Coverflow mit Inertia/Swipe
    AlbumCard.tsx            # Einzelne Album-Karte mit Flip
    AlbumBackside.tsx        # Tracklist auf Rückseite
    NowPlaying.tsx           # Playback-Bereich links
    PlaybackControls.tsx     # Play/Pause/Skip Controls
    ProgressBar.tsx          # Fortschrittsbalken
    SonosPanel.tsx           # Multiroom UI
    SonosRoomCard.tsx        # Einzelner Raum
    TopNav.tsx               # Navigation (Auswahl/Playlists/Favoriten/Suche)
    SearchOverlay.tsx        # Suchmaske
    SearchResults.tsx        # Suchergebnisse
    TrackMenu.tsx            # Track-Kontextmenü
  api/
    client.ts                # fetch-Wrapper mit Basis-URL
    playbackApi.ts           # /api/now-playing, /api/play, /api/pause etc.
    sonosApi.ts              # /api/sonos/rooms, volume, mute, group
    spotifyApi.ts            # /api/spotify/* (Albums, Playlists, Search)
    spotifyAuthApi.ts        # /api/auth/spotify/status, logout
  hooks/
    useSpotifyLibrary.ts     # Alben + Playlists laden
    useSpotifySearch.ts      # Suche
  types/
    music.ts                 # Album, Track
    sonos.ts                 # SonosRoom
  theme/
    colors.ts                # themeColors, rgba, themeEffects
    musicTheme.ts            # Design-System (Gradients, Glow, Surfaces)
    colorExtraction.ts       # Dynamische Farben aus Cover
  data/
    mockMusic.ts             # Mock-Alben (Fallback wenn Spotify offline)
    mockSonos.ts             # Mock-Räume

backend/src/
  index.ts                   # Express Setup, Port 3001 (async startup mit Sonos init)
  routes/
    playback.ts              # GET /api/now-playing, POST /api/play|pause|next|prev (+ Sonos transport)
    sonos.ts                 # GET /api/sonos/rooms|diagnostics, POST volume/mute/group
    spotify.ts               # GET /api/spotify/albums|playlists|search|devices etc.
    spotifyAuth.ts           # GET /api/auth/spotify/status, /callback, POST /logout
    health.ts                # GET /api/health
  services/
    playbackService.ts       # Simulierter Playback-State + Timing
    sonosService.ts          # Async facade → Sonos Adapter
    sonos/
      sonosTypes.ts          # SonosRoom, SonosAdapter, SonosDiagnostics interfaces
      sonosMockAdapter.ts    # Mock-Implementierung (4 deutsche Räume)
      sonosRealAdapter.ts    # Echter UPnP-Adapter (SSDP + SOAP via dgram/http)
      sonosAdapter.ts        # Factory: wählt Mock/Real per SONOS_MODE env
    spotifyService.ts        # Spotify Web API Calls (mit Access Token)
    spotifyAuthService.ts    # OAuth Flow, Token Refresh
  state/
    mockState.ts             # Playback State (isPlaying, track, progress)
    spotifySession.ts        # Access/Refresh Token Storage
  types/
    spotify.ts               # Spotify API Response Types
  mappers/
    spotifyMapper.ts         # Spotify DTO → internes Album/Track Model
  data/
    albums.ts                # Mock-Alben für Backend

docs/
  phase_13_sonos_real_integration.md  # Env-Vars, Test-Anleitung, Architektur
```

---

## Wichtige Architekturentscheidungen

**Playback-Ownership:** Backend tickt den Progress-Timer. Frontend pollt `/api/now-playing` alle 1000ms. Frontend hat keinen eigenen Playback-State.

**CoverFlow-Browsing:** Lokaler Frontend-State (kein Backend-Call beim Scrollen). Erst beim Abspielen geht ein Action-Call an das Backend.

**Spotify als Content-Layer:** Spotify liefert Library, Metadaten, Cover, Suche. Spotify spielt NICHT direkt ab (kein Web Playback SDK).

**Sonos als Playback-Engine (Phase 13):** Sonos übernimmt echtes Playback. Sonos-Gruppen-State kommt von Sonos, nicht von Spotify.

**Mapping-Grenze:** Spotify-Raw-Responses verlassen nie das Backend. `spotifyMapper.ts` konvertiert zu `Album`/`Track`. Frontend kennt keine Spotify-Typen.

---

## Aktueller Stand: Phase 13 (abgeschlossen)

- Phase 12: Spotify OAuth, Library, CoverFlow, Suche, Mock-Fallback
- Phase 13: Echte lokale Sonos-Steuerung via nativer UPnP/SSDP (dgram + http — keine neue npm-Dep.)
- Adapter-Architektur: `SonosMockAdapter` (default) / `SonosRealAdapter` (SONOS_MODE=real)
- SSDP-Discovery entdeckt Sonos-Speaker im LAN; optional statische IPs via SONOS_DEVICE_IPS
- Volume und Mute steuern echte Sonos-Geräte über UPnP RenderingControl
- Play/Pause/Next/Prev senden AVTransport-Commands an Sonos (fire-and-forget neben Mock-Timer)
- Neuer Diagnostics-Endpoint: GET /api/sonos/diagnostics
- Mock-Mode verhält sich identisch wie Phase 12

---

## Nächste Phase: Phase 14 | Sonos Vollintegration

- Echte Gruppen-Topologie via ZoneGroupTopology UPnP
- Join/Leave Group via DelegateURI
- Progress-Tracking aus Sonos AVTransport GetPositionInfo statt Mock-Timer
- Spotify-URI Playback an Sonos (x-sonos-spotify: URI Scheme)

---

## Design-Regeln

- Keine hellen Farben. Immer dunkle Oberflächen, Bronze/Gold Akzente.
- Glow-Effekte für aktive Elemente.
- Framer Motion für alle Animationen — kein CSS transition direkt.
- Touch-First: alle Targets min. 44px.
- Kein Text der wie "App" oder "Dashboard" wirkt — Premium Hardware Ästhetik.
- Designreferenzen: Bang & Olufsen, Sonos App, iTunes CoverFlow, Tesla UI.

---

## Wichtige Einschränkungen

- Sonos Devices werden von Spotify Web API **nicht vollständig** als normale Devices behandelt (Queue-Verhalten, Device-Sleep, aktiver State teilweise unzuverlässig).
- Deshalb: Kerndaten für Playback kommen **von Sonos direkt** (Phase 13), nicht vom Spotify Playback State.
- Kein `npm install` ohne Rückfrage — Dependencies sollen minimal bleiben.

---

## Getroffene Entscheidungen

| Datum | Entscheidung | Begründung |
|-------|-------------|------------|
| 2026-05 | Spotify ist **nur Content-Quelle**, kein Player | Sonos soll Playback übernehmen — stabiler, kein Browser-Audio, natives Spotify Connect Verhalten, echtes Multiroom |
| 2026-05 | Kein Spotify Web Playback SDK | Raspberry Pi Browser-Audio ist unzuverlässig; Sonos ist die bessere Playback-Engine |
| 2026-05 | Backend als Single Source of Truth für Playback-State | Doppelter State in Frontend + Backend führte zu Inkonsistenzen |
| 2026-05 | Frontend pollt Backend alle 1000ms statt WebSocket | Einfacher, ausreichend für das Use-Case, kein Verbindungs-Overhead |
| 2026-05 | Spotify-Raw-Responses verlassen nie das Backend | Saubere Trennung, Frontend kennt keine Spotify-Typen |

---

## Offene Punkte (Stand: 2026-05-26)

| Priorität | Problem | Details |
|-----------|---------|---------|
| niedrig | **Play-Bug: Neustart beim Quellwechsel** | Wenn neue Musikquelle gewählt wird, startet Progress Bar von vorne — wirkt als würde Track neu starten. Aktuell kein Audio vorhanden zum Bestätigen |
| mittel | **Workaround blockierte Playlists** | Für Playlists ohne Track-Daten (403 von Spotify): beim Runterziehen in NowPlaying soll trotzdem abgespielt werden. NowPlaying soll aktuellen Titel + Album anzeigen (via Spotify `/me/player` Polling statt lokaler Track-Liste). Queue aus Spotify Playback State befüllen. **Noch nicht ausführen — erst planen.** |
| niedrig | **Spotify Quota Extension beantragen** | Fremde öffentliche Playlists geben 403 auf Track-Endpoints — Spotify Policy für Apps im Development Mode. Quota Extension im Developer Dashboard beantragen wenn Projekt weiter reift. Bis dahin: nur eigene Playlists + kollaborative Playlists (als Mitglied) funktionieren. |
| niedrig | **Queue-Farben feintuning** | Andere Queue-Tracks aktuell auf `soft` (0.34) für Titel — ggf. nochmal abstimmen wenn echte Hardware vorliegt. |
| Phase 14 | **Sonos Gruppen-Topologie** | Echter Join/Leave via ZoneGroupTopology UPnP. Aktuell nur lokaler State. |
| Phase 14 | **Progress-Tracking aus Sonos** | `/api/now-playing` zeigt Mock-Timer. Sonos AVTransport `GetPositionInfo` pollen. |
| Phase 14 | **Spotify-URI Playback** | Sonos soll Spotify-URIs direkt abspielen (`x-sonos-spotify:` URI Schema). |
| Phase 14 | **Raumnamen** | Echte Räume: Living Room, Kitchen, Main Bedroom, Bathroom. Ggf. Normalisierung (case-insensitive fuzzy match) verbessern. |

---

## Session-Protokoll

*Nach jeder Session: CLAUDE.md aktualisieren mit was geändert wurde + nach offenen/neuen Punkten fragen.*

| Datum | Was wurde gemacht |
|-------|-------------------|
| 2026-05-25 | CLAUDE.md angelegt, Entscheidungen und offene Punkte erfasst |
| 2026-05-25 | Playlists vollständig gefixt: CoverFlow zeigt Playlists, Tracklist lädt korrekt, NowPlaying zeigt Track-Metadaten (Cover, Artist, Titel) statt Playlist-Daten, Queue funktioniert. Root Cause: Spotify 2024 API Breaking Changes — `tracks`→`items` auf Playlist-Ebene UND `track`→`item` innerhalb der Playlist-Track-Items. Beides in types/spotify.ts und spotifyMapper.ts gefixt mit Fallback für alte + neue API. |
| 2026-05-25 | Weitere Playlist-Fixes: Next/Prev navigiert korrekt durch Playlist-Tracks (Backend-Index nicht mehr für Spotify-Content verwendet), CoverFlow-Flip-Back beim Track-Laden behoben, Fremd-Playlists: Spotify Development Mode sperrt Track-Zugriff mit 403 — Quota Extension nötig (TODO). Scope `playlist-read-collaborative` hinzugefügt. |
| 2026-05-26 | Progress-Reset-Bug gefixt: Beim Einlegen eines Spotify-Albums via Drag wird jetzt `seek(0)` vor `play()` aufgerufen — verhindert dass alter Backend-Progress zurückgeschrieben wird. Nav umgebaut: Reihenfolge Playlists→Zuletzt→Auswahl, "Favoriten" in "Zuletzt" umbenannt, Playlists als Default-Tab. Zuletzt-Tab zeigt jetzt Alben UND Playlists korrekt (Spotify `context`-Feld aus recently-played ausgelesen, URI zu ID aufgelöst). Recently-played Limit 20→50. Zuletzt-Strip unter CoverFlow entfernt. CoverFlow-Flip auf echtes CSS-3D-Card-Flip umgebaut (backface-visibility, keine AnimatePresence-Lücke mehr). Flip-Back via Tipp auf Header-Bereich der Rückseite. Track-Tipp auf Rückseite flippt nicht mehr zurück. |
| 2026-05-26 | Suche vollständig gefixt und interaktiv gemacht. Root Cause: `mapSearchResults` crashte auf null-Einträgen in Spotify Search-Response-Arrays → 502 → Frontend zeigte leer. Fix: null-Filter für alle vier Arrays (albums/tracks/artists/playlists) im Mapper + SpotifySearchResult-Types auf nullable items aktualisiert. Suchresultate jetzt interaktiv: Album-Klick → CoverFlow Auswahl-Tab (auch nicht-gespeicherte Alben via searchInjectedAlbum-State), Track-Klick → sofort spielen + schließen, Playlist-Klick → CoverFlow Playlists-Tab, Künstler-Klick → Suche auf Künstlername verfeinern. albumId zu SearchTrack-Type hinzugefügt (Backend + Frontend). |
| 2026-05-26 | NowPlaying Queue scrollbar + antippbar gemacht: alle verbleibenden Tracks (statt fest 4) in scroll-Container (maxHeight 5.6rem, scrollbar versteckt via negative-margin-clip-Trick). Track-Tipp spielt sofort ab. Auto-Scroll-Back nach 4s Inaktivität. Progress-Reset-Bug gefixt für alle Commands (handlePlayTrack/Next/Previous Spotify-Pfad): fehlende `seek(0)`-Aufrufe vor `play()` ergänzt — Backend-Progress wurde sonst vom Polling zurückgeschrieben. Queue-Farben: andere Tracks auf `soft` (0.34) statt `faint` (0.46). Playlist-Name über Interpreten in NowPlaying (nur bei Playlists, gleiche Schrift/Farbe/Größe wie Interpret, doppelter Abstand). Flip-Auto-Back nach 4s ohne Aktivität. |
| 2026-05-26 | Phase 13: Echte lokale Sonos-Integration implementiert. Adapter-Architektur unter `services/sonos/`: SonosMockAdapter (SONOS_MODE=mock, default) + SonosRealAdapter (SONOS_MODE=real). Real-Adapter nutzt native Node.js `dgram` (SSDP-Discovery) + `http` (UPnP SOAP) — keine neue npm-Abhängigkeit. Volume/Mute via RenderingControl, Play/Pause/Next/Prev via AVTransport. Neue ENV-Vars: SONOS_MODE, SONOS_DEVICE_IPS, SONOS_PRIMARY_ROOM, SONOS_DISCOVERY_TIMEOUT, SONOS_COMMAND_TIMEOUT. Neuer Diagnostics-Endpoint: GET /api/sonos/diagnostics. Frontend-API-Contracts unverändert. Mock-Mode verhält sich identisch zu Phase 12. Echte Raumnamen korrigiert: Main Bedroom (nicht Bedroom). |
| 2026-05-26 | Phase 13 Follow-up: Frontend Sonos UI mit echtem Backend verbunden. Volume/Mute/Group Handler: optimistisches Update sofort + API-Response-Bestätigung (availability sync). Rooms-Polling alle 5s (mit 3s Interaction-Guard gegen Slider-Überschreiben). BackendRoom.available-Feld zu sonosApi.ts + SonosRoom-Type hinzugefügt. mapBackendRoom Helper in App.tsx. previousVolume bleibt über Polls erhalten. |
