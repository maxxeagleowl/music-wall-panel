export type Track = {
  id: string;
  number: number;
  title: string;
  duration: string;
};

export type Album = {
  id: string;
  artist: string;
  title: string;
  year: number;
  genre: string;
  mood: string;
  label: string;
  accent: string;
  accentSoft: string;
  coverTag: string;
  coverPattern: string;
  coverText: string;
  tracks: Track[];
};
