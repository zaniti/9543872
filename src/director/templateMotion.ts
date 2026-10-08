import {interpolate} from 'remotion';

/** Same push-in rate as R1 regular stills: duration-driven, never stops while the shot is on screen. */
export const ZOOM_PER_SECOND = 0.0205;
export const backgroundZoom = (frame: number, fps = 30) => 1 + (Math.max(0, frame) / fps) * ZOOM_PER_SECOND;

/** Shared optional props for every approved template. */
export type TemplateTiming = {
  /** CSS object-position of the background; also the zoom origin so faces stay in frame. */
  backgroundPosition?: string;
  /** Frames to delay the template's reveals (text, cards, counters) so they land on a spoken word.
   *  The background keeps its own continuous zoom. Negative values start the reveals earlier. */
  revealShift?: number;
};

export const clampAll = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const ease01 = (frame: number, from: number, to: number) => interpolate(frame, [from, to], [0, 1], clampAll);
