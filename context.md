# Music Wall Panel | Frontend Context

## Goal

Build a premium wall mounted touch music interface for a Raspberry Pi with a 15 to 16 inch landscape touch display.

This is NOT a normal web app.

The interface should feel like:
- Bang & Olufsen
- old iTunes Coverflow
- Sonos premium hardware
- Tesla UI
- high end HiFi equipment

The interface runs permanently on a wall mounted touch display in landscape mode.

Target resolution:
- 1920x1200
- 16:10 landscape

The application must use mock data only for now.
No real Spotify or Sonos API connection yet.

The app should already feel fully interactive and polished.

---

# Tech Stack

Use:

- React
- Vite
- TypeScript
- Tailwind CSS
- Framer Motion
- lucide-react

Use component based architecture.

---

# Overall Screen Layout

The entire screen has:
- very dark background
- elegant grey borders
- soft shadows
- subtle glassmorphism
- calm premium appearance
- large touch friendly UI
- no bright colors except album covers

The screen is divided vertically into four areas:

1. Top Selection Bar
2. Large Coverflow Area
3. Now Playing Area
4. Sonos Control Area

The layout proportions are important.

---

# Exact Layout Structure

Use approximately these proportions:

## Top Selection Bar
Height:
~10%

## Coverflow Area
Height:
~52%

## Now Playing Area
Height:
~20%

## Sonos Area
Height:
~18%

The app should almost fully fill the screen with only minimal outer margin.

Use elegant spacing between sections.

---

# Top Selection Bar

The top bar is a horizontal premium navigation bar.

It contains:

- Auswahl
- Playlists
- Favoriten
- Suche

Requirements:

- centered vertically
- elegant typography
- subtle active state
- active item slightly brighter
- touch friendly
- smooth hover/touch animations
- no standard HTML button styling

The bar should look like:
a premium media system selector.

---

# Coverflow Area

This is the visual centerpiece of the app.

The Coverflow area must behave similarly to old Apple iTunes Coverflow.

Requirements:

- horizontal swipe
- smooth inertial movement
- center album large
- side albums smaller
- side albums rotated in 3D
- perspective effect
- smooth scaling
- reflections optional
- subtle floating animation

The Coverflow must feel alive and premium.

Only one album is fully focused at a time.

The centered album should:
- scale larger
- glow slightly
- appear visually dominant

Side albums:
- partially visible
- darker
- rotated
- slightly blurred or faded

---

# Coverflow Interaction

The centered album is interactive.

## Tap Interaction

When tapping the centered album:

The album flips around like a physical card.

Front side:
- album cover

Back side:
- track list

The animation should:
- rotate in 3D
- feel smooth
- feel tactile

The back side should visually feel like:
- a premium vinyl sleeve back side
- dark matte panel

---

# Track List View

The flipped back side contains:

For every track:
- track number
- title
- duration
- three dots menu

Tracks should have:
- hover/touch feedback
- elegant separators
- enough spacing for touch

The three dots menu opens:

- Abspielen
- Als Nächstes
- In Warteschlange
- Details

The menu should appear as:
- floating dark context menu
- blurred background
- soft animation

---

# Drag To Play Interaction

The centered album must be draggable.

Behavior:

- user drags album downward
- the Now Playing section becomes highlighted
- if released over Now Playing:
  - album becomes active
  - playback starts
  - now playing updates
  - progress resets

The drag should:
- feel physical
- slightly scale the album
- follow finger/mouse naturally

If exact drop zone logic becomes difficult:
use lower third screen detection.

---

# Now Playing Area

The Now Playing area is split into three sections horizontally.

## Left Section

Width:
~33%

Contains:
- Artist
- Titel
- Album

Typography:
- large
- elegant
- vertically centered

Layout:
Artist
Titel
Album

Use hierarchy:
- title largest
- artist medium
- album smaller

---

## Center Section

Width:
~33%

Contains:
- current playing album cover

Requirements:
- square cover
- centered
- subtle glow
- soft shadow
- animated if playback active

Optional:
- slow rotation
- breathing animation

---

## Right Section

Width:
~33%

Contains:
- Previous
- Play/Pause
- Next
- Progress bar
- current time
- total time

Buttons:
- large
- touch friendly
- minimalistic

Progress bar:
- smooth animation
- elegant thin line
- draggable scrubber optional

---

# Sonos Area

The Sonos section spans full width at the bottom.

This area contains room cards.

Rooms:
- living room
- kitchen
- bathroom
- main bedromm

Each room card contains:

- room name
- active indicator
- volume slider
- mute button
- group toggle

The room cards should:
- look modular
- dark premium style
- subtle glow if active

Volume sliders:
- large
- horizontal
- touch optimized

---

# Sonos Grouping

Show active grouping visually.

Example:

Aktive Gruppe:
Wohnzimmer + Küche

Optional:
show connection lines or grouped highlight.

---

# Styling Direction

The UI must feel:

- dark
- premium
- tactile
- calm
- cinematic

Use:
- near black background
- subtle transparency
- blurred panels
- grey borders
- elegant spacing
- large album artwork

Avoid:
- colorful UI elements
- bright buttons
- generic dashboard style
- overly minimal flat UI

This should feel like:
a luxury music control surface.

---

# Animations

Use Framer Motion heavily.

Important animations:

- Coverflow movement
- Album hover
- Album scaling
- Album flip
- Context menu
- Dragging
- Play transitions
- Sonos room activation
- Progress bar movement

Animations must be:
- smooth
- premium
- slightly slow and elegant
- not playful

---

# Mock Data

Create:

```text
src/data/mockMusic.ts
```

At least:
- 10 albums
- realistic metadata
- tracks
- durations
- high quality placeholder covers

Create:

```text
src/data/mockSonos.ts
```

With:
- room states
- volume
- grouped states

---

# Component Structure

Create:

```text
src/
  App.tsx
  main.tsx
  index.css

  components/
    TopNav.tsx
    CoverFlow.tsx
    AlbumCard.tsx
    AlbumBackside.tsx
    TrackMenu.tsx
    NowPlaying.tsx
    PlaybackControls.tsx
    ProgressBar.tsx
    SonosPanel.tsx
    SonosRoomCard.tsx

  data/
    mockMusic.ts
    mockSonos.ts

  types/
    music.ts
    sonos.ts
```

---

# State Requirements

Manage:
- selected album
- flipped album
- active navigation
- now playing album
- current track
- playback state
- progress state
- room volume
- mute states
- grouped rooms

Use React state only.

No Redux.

---

# Touch UX Requirements

This app is for a wall mounted touchscreen.

Everything must work comfortably with touch.

Requirements:
- large hitboxes
- no tiny controls
- no hover only interactions
- smooth dragging
- good spacing
- comfortable scrolling
- touch first design

---

# Performance

The app should run smoothly on:
- Raspberry Pi 5
- Chromium Kiosk

Avoid heavy unnecessary rendering.

---

# Final Instruction

Build the FULL frontend prototype directly.

Do not only explain architecture.

Create:
- all files
- all components
- all mock data
- animations
- polished styling

The result should already feel close to a real premium product.

npm run dev
press q + enter to quit