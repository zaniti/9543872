/** Template numbers follow TEMPLATE_CONTRACTS.md; `regular` is R1 and `video` is a selected real shot list. */
export type ClaudeFuggerMode = 'T1' | 'T2' | 'T3' | 'T5' | 'T6' | 'T7' | 'T8' | 'T11' | 'T14' | 'T16' | 'T18' | 'T22' | 'T24' | 'T25' | 'T22b' | 'T11b' | 'T26' | 'T27' | 'T4' | 'T12' | 'T13' | 'T15' | 'T17' | 'T20' | 'regular' | 'video';

export type ClaudeFuggerAsset = {
  src: string;
  /** Regular stills: chosen from source dimensions only. Template layers keep their own framing. */
  layout: 'landscape-cover' | 'aspect-safe' | 'template-card' | 'video';
  aspectRatio: number;
  objectPosition: string;
  /** Zoom anchor (the face) for regular stills. */
  zoomOrigin?: string;
  /** Exact source ranges for a video beat, played back to back. */
  videoRanges?: {trimBefore: number; durationFrames: number}[];
  /** Pre-cut, pre-framed 1920x1080 clips (media engine), played back to back. */
  videoParts?: {src: string; durationFrames: number}[];
};

export type ClaudeFuggerBeat = {
  id: string;
  startFrame: number;
  durationFrames: number;
  mode: ClaudeFuggerMode;
  narration: string;
  text: Record<string, string | number>;
  /** Structured data for list templates (T24 events, T25 rows). */
  data?: Record<string, unknown>;
  assets: ClaudeFuggerAsset[];
};
