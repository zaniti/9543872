import type {CSSProperties} from 'react';

const FRAME_RATIO = 16 / 9;
export const COVER_RATIO_MIN = 1.3;
export const COVER_RATIO_MAX = 2.1;

export type AspectLayout = 'landscape-cover' | 'aspect-safe';

/**
 * The framing selector is deliberately dimension-only. It never branches on
 * whether the file is a person, document, map, coin, painting, or photograph.
 */
export const layoutForAspectRatio = (sourceRatio?: number): AspectLayout => {
  if (!sourceRatio || !Number.isFinite(sourceRatio) || sourceRatio <= 0) {
    return 'landscape-cover';
  }
  return sourceRatio >= COVER_RATIO_MIN && sourceRatio <= COVER_RATIO_MAX
    ? 'landscape-cover'
    : 'aspect-safe';
};

/**
 * Size a complete source inside a 16:9 canvas without relying on browser
 * object-fit behaviour. Narrow sources fill height; ultra-wide sources fill
 * width. The unused axis is reserved for the soft backdrop.
 */
export const safeForegroundFrame = (sourceRatio?: number): CSSProperties => {
  if (!sourceRatio || !Number.isFinite(sourceRatio) || sourceRatio <= 0) {
    return {position: 'absolute', inset: 0};
  }

  if (sourceRatio <= FRAME_RATIO) {
    const width = (sourceRatio / FRAME_RATIO) * 100;
    return {position: 'absolute', left: `${(100 - width) / 2}%`, top: 0, width: `${width}%`, height: '100%'};
  }

  const height = (FRAME_RATIO / sourceRatio) * 100;
  return {position: 'absolute', left: 0, top: `${(100 - height) / 2}%`, width: '100%', height: `${height}%`};
};
