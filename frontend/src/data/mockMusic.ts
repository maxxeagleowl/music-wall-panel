import type { Album } from '../types/music';

const albumTracks = [
  [
    ['Arrival in Blue', '4:12'],
    ['Glass Horizon', '3:54'],
    ['Slow Current', '5:21'],
    ['After Midnight', '4:47'],
    ['Rooftop Signals', '6:03']
  ],
  [
    ['Silver Rooms', '4:03'],
    ['Late Drive', '3:38'],
    ['Midnight Neon', '5:08'],
    ['Warm Static', '4:11'],
    ['Last Train Home', '4:56']
  ],
  [
    ['Soft Engines', '4:27'],
    ['Field of Echoes', '5:14'],
    ['Northern Light', '3:49'],
    ['Quiet Voltage', '4:33'],
    ['Home Signal', '5:02']
  ],
  [
    ['Open Balcony', '3:57'],
    ['Blue Marble', '4:26'],
    ['Parallel Room', '4:44'],
    ['Hidden Frequency', '5:15'],
    ['Night Glass', '4:19']
  ],
  [
    ['Black Water', '5:08'],
    ['Low Tide', '4:01'],
    ['Paper Moon', '3:55'],
    ['Dim Lantern', '4:29'],
    ['Echo Harbor', '5:33']
  ],
  [
    ['Calm Corridor', '4:18'],
    ['Light Discipline', '3:46'],
    ['Soft Architecture', '5:19'],
    ['Warm Concrete', '4:35'],
    ['Late Reflection', '4:48']
  ],
  [
    ['Hush Mode', '3:59'],
    ['Night Current', '4:22'],
    ['Static Bloom', '5:00'],
    ['Remote Heart', '4:37'],
    ['Rain on Glass', '6:06']
  ],
  [
    ['Velvet Signal', '4:08'],
    ['The Long Fade', '5:11'],
    ['Room Service', '3:42'],
    ['Window Seat', '4:55'],
    ['Afterglow Tape', '4:31']
  ],
  [
    ['Contour', '4:04'],
    ['Soft Landing', '4:58'],
    ['Night Palette', '3:50'],
    ['Gravity Well', '5:16'],
    ['Dimmer Switch', '4:41']
  ],
  [
    ['Warm Circuit', '4:17'],
    ['Neon Silence', '3:53'],
    ['Grey Matter', '4:39'],
    ['Drift Line', '5:05'],
    ['Soft Recall', '4:26']
  ]
] as const;

const albumMeta = [
  ['Aster Lane', 'Nocturne Glass', 2025, 'Ambient / Electronica', 'Late evening focus', 'AN-01', 'linear-gradient(135deg, #4f6e9f 0%, #142033 52%, #07111c 100%)', 'linear-gradient(180deg, rgba(144,176,221,0.28), rgba(7, 17, 28, 0.85))', 'A1'],
  ['Monument', 'Velvet Rooms', 2024, 'Downtempo / Soul', 'Warm low light', 'MN-02', 'linear-gradient(135deg, #7c5f4a 0%, #2d1f1d 44%, #0d0f12 100%)', 'linear-gradient(180deg, rgba(202,168,137,0.28), rgba(13, 15, 18, 0.88))', 'M2'],
  ['Northline', 'Signal Theory', 2025, 'Deep House / Leftfield', 'Driving precision', 'NL-03', 'linear-gradient(135deg, #6d86a8 0%, #1c2a3e 58%, #06080e 100%)', 'linear-gradient(180deg, rgba(165,193,233,0.24), rgba(6, 8, 14, 0.9))', 'N3'],
  ['Kairo', 'Apartment Sea', 2023, 'Indie / Chill', 'Soft city drift', 'KR-04', 'linear-gradient(135deg, #587c86 0%, #1f353d 48%, #060a0b 100%)', 'linear-gradient(180deg, rgba(154,198,205,0.22), rgba(6, 10, 11, 0.9))', 'K4'],
  ['Obsidian', 'Low Tide Archive', 2024, 'Electronica / Jazz', 'Liquid and cinematic', 'OB-05', 'linear-gradient(135deg, #3f445d 0%, #151a25 52%, #05060a 100%)', 'linear-gradient(180deg, rgba(125,132,162,0.22), rgba(5, 6, 10, 0.92))', 'O5'],
  ['Solace', 'Concrete Light', 2025, 'Modern Classical', 'Quiet geometry', 'SL-06', 'linear-gradient(135deg, #707070 0%, #22252c 44%, #090b0d 100%)', 'linear-gradient(180deg, rgba(214,214,214,0.18), rgba(9, 11, 13, 0.9))', 'S6'],
  ['Arc', 'Night Relay', 2024, 'Synthwave / Ambient', 'Muted motion', 'AR-07', 'linear-gradient(135deg, #634f7e 0%, #241c37 46%, #08080f 100%)', 'linear-gradient(180deg, rgba(187,159,232,0.22), rgba(8, 8, 15, 0.9))', 'A7'],
  ['Haven', 'After Hours', 2023, 'Neo Soul / Chill', 'Soft enclosure', 'HV-08', 'linear-gradient(135deg, #6d6a53 0%, #2b271d 46%, #080807 100%)', 'linear-gradient(180deg, rgba(214,208,160,0.18), rgba(8, 8, 7, 0.92))', 'H8'],
  ['Luma', 'Grey Frequency', 2025, 'Experimental Pop', 'Clean and tactile', 'LM-09', 'linear-gradient(135deg, #4f6770 0%, #17232b 49%, #060809 100%)', 'linear-gradient(180deg, rgba(148,180,192,0.2), rgba(6, 8, 9, 0.92))', 'L9'],
  ['Ember', 'Subtle Motion', 2024, 'Organic Electronica', 'Low heat, high polish', 'EB-10', 'linear-gradient(135deg, #7b5f57 0%, #2a1d1b 47%, #080707 100%)', 'linear-gradient(180deg, rgba(219,176,162,0.2), rgba(8, 7, 7, 0.92))', 'E0']
] as const;

export const mockAlbums: Album[] = albumMeta.map(([artist, title, year, genre, mood, label, accent, accentSoft, coverTag], albumIndex) => {
  const tracks = albumTracks[albumIndex].map(([trackTitle, duration], index) => ({
    id: `${label}-t${index + 1}`,
    number: index + 1,
    title: trackTitle,
    duration
  }));

  return {
    id: label,
    artist,
    title,
    year,
    genre,
    mood,
    label,
    accent,
    accentSoft,
    coverTag,
    coverPattern: `repeating-linear-gradient(135deg, rgba(255,255,255,0.08) 0 2px, transparent 2px 18px)`,
    coverText: title.slice(0, 2).toUpperCase(),
    tracks
  };
});

export function getAlbumById(albumId: string) {
  return mockAlbums.find((album) => album.id === albumId) ?? mockAlbums[0];
}
