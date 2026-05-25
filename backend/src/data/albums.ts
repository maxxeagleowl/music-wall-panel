interface TrackInfo {
  title: string;
  duration: number;
}

export const albumRegistry: Record<string, TrackInfo[]> = {
  'AN-01': [
    { title: 'Arrival in Blue',  duration: 252 },
    { title: 'Glass Horizon',    duration: 234 },
    { title: 'Slow Current',     duration: 321 },
    { title: 'After Midnight',   duration: 287 },
    { title: 'Rooftop Signals',  duration: 363 },
  ],
  'MN-02': [
    { title: 'Silver Rooms',     duration: 243 },
    { title: 'Late Drive',       duration: 218 },
    { title: 'Midnight Neon',    duration: 308 },
    { title: 'Warm Static',      duration: 251 },
    { title: 'Last Train Home',  duration: 296 },
  ],
  'NL-03': [
    { title: 'Soft Engines',     duration: 267 },
    { title: 'Field of Echoes',  duration: 314 },
    { title: 'Northern Light',   duration: 229 },
    { title: 'Quiet Voltage',    duration: 273 },
    { title: 'Home Signal',      duration: 302 },
  ],
  'KR-04': [
    { title: 'Open Balcony',     duration: 237 },
    { title: 'Blue Marble',      duration: 266 },
    { title: 'Parallel Room',    duration: 284 },
    { title: 'Hidden Frequency', duration: 315 },
    { title: 'Night Glass',      duration: 259 },
  ],
  'OB-05': [
    { title: 'Black Water',      duration: 308 },
    { title: 'Low Tide',         duration: 241 },
    { title: 'Paper Moon',       duration: 235 },
    { title: 'Dim Lantern',      duration: 269 },
    { title: 'Echo Harbor',      duration: 333 },
  ],
  'SL-06': [
    { title: 'Calm Corridor',     duration: 258 },
    { title: 'Light Discipline',  duration: 226 },
    { title: 'Soft Architecture', duration: 319 },
    { title: 'Warm Concrete',     duration: 275 },
    { title: 'Late Reflection',   duration: 288 },
  ],
  'AR-07': [
    { title: 'Hush Mode',        duration: 239 },
    { title: 'Night Current',    duration: 262 },
    { title: 'Static Bloom',     duration: 300 },
    { title: 'Remote Heart',     duration: 277 },
    { title: 'Rain on Glass',    duration: 366 },
  ],
  'HV-08': [
    { title: 'Velvet Signal',    duration: 248 },
    { title: 'The Long Fade',    duration: 311 },
    { title: 'Room Service',     duration: 222 },
    { title: 'Window Seat',      duration: 295 },
    { title: 'Afterglow Tape',   duration: 271 },
  ],
  'LM-09': [
    { title: 'Contour',          duration: 244 },
    { title: 'Soft Landing',     duration: 298 },
    { title: 'Night Palette',    duration: 230 },
    { title: 'Gravity Well',     duration: 316 },
    { title: 'Dimmer Switch',    duration: 281 },
  ],
  'EB-10': [
    { title: 'Warm Circuit',     duration: 257 },
    { title: 'Neon Silence',     duration: 233 },
    { title: 'Grey Matter',      duration: 279 },
    { title: 'Drift Line',       duration: 305 },
    { title: 'Soft Recall',      duration: 266 },
  ],
};
