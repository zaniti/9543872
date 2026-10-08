import {interpolate} from 'remotion';

/** The measured tag-writing motion from templates 1–3. For label/name text only. */
export const tagCharacterStart = (index:number, length:number, firstFrame:number, spread=22) =>
  firstFrame + Math.round((index / Math.max(1, length - 1)) * spread);

export const tagCharacterRise = (frame:number, start:number, offset=112) =>
  interpolate(frame, [start, start + 4], [offset, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

export const tagCharacterOpacity = (frame:number, start:number) =>
  interpolate(frame, [start, start + 2], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
