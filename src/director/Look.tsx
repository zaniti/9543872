import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import type {Look as LookSettings} from './channelStyle';

/**
 * The channel's finishing look, over the whole frame (photos, film and text alike), measured on the owner's reference
 * channels and approved by the owner on the crime sample (crime-new-theme-and-filter.mp4, 2026-10-22). Keep it exactly
 * like this: the owner compared a faster ffmpeg copy and preferred this one.
 * - chromatic aberration: red and blue pulled ~2.5 px apart (red left, blue right) over the whole frame, the same on text
 *   and images, the shifted channels slightly softened;
 * - fine moving grain, a printed-canvas dot texture, soft corners and a vignette.
 * Each strength is a channel setting (theme.look); 0 turns that part off. It costs render time (the cloud renderer's
 * parallel chunks absorb it).
 */
export const LookFilter: React.FC<{look: LookSettings; children: React.ReactNode; overlay?: React.ReactNode; overlaySplit?: number}> = ({look, children, overlay, overlaySplit}) => {
  const frame = useCurrentFrame();
  const ab = Math.max(0, Math.min(8, look.aberration ?? 0));
  const grain = Math.max(0, Math.min(1, look.grain ?? 0));
  const vignette = Math.max(0, Math.min(1, look.vignette ?? 0));
  const texture = Math.max(0, Math.min(1, look.texture ?? 0));
  const edgeBlur = Math.max(0, Math.min(1, look.edgeBlur ?? 0));
  const seed = frame % 97; // the grain moves every frame, like film
  return <AbsoluteFill>
    <svg width="0" height="0" style={{position: 'absolute'}}>
      <filter id="look-ca" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
        <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
        <feOffset in="r" dx={ab} dy="0" result="ro" />
        <feGaussianBlur in="ro" stdDeviation="0.7" result="rs" />
        <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
        <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
        <feOffset in="b" dx={-ab} dy="0" result="bo" />
        <feGaussianBlur in="bo" stdDeviation="0.7" result="bs" />
        <feBlend in="rs" in2="g" mode="screen" result="rg" />
        <feBlend in="rg" in2="bs" mode="screen" />
      </filter>
        <filter id="look-ca-label" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
        <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
        <feOffset in="r" dx={overlaySplit ?? ab} dy="0" result="ro" />
        <feGaussianBlur in="ro" stdDeviation="0.7" result="rs" />
        <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
        <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
        <feOffset in="b" dx={-(overlaySplit ?? ab)} dy="0" result="bo" />
        <feGaussianBlur in="bo" stdDeviation="0.7" result="bs" />
        <feBlend in="rs" in2="g" mode="screen" result="rg" />
        <feBlend in="rg" in2="bs" mode="screen" />
      </filter>
      <filter id="look-grain" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={seed} stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
    </svg>
    {/* the frame is enlarged by the shift so the pulled-apart channels never leave a coloured strip at the edges */}
    <AbsoluteFill style={{filter: ab > 0 ? 'url(#look-ca)' : undefined}}>
      <AbsoluteFill style={{transform: ab > 0 ? `scale(${1 + (2 * ab + 2) / 1080})` : undefined}}>{children}</AbsoluteFill>
    </AbsoluteFill>
    {/* the corners soften like an old lens (the centre stays sharp) */}
    {edgeBlur > 0 ? <AbsoluteFill style={{backdropFilter: `blur(${3 * edgeBlur}px)`, WebkitBackdropFilter: `blur(${3 * edgeBlur}px)`,
      maskImage: 'radial-gradient(ellipse at center, transparent 58%, black 100%)', WebkitMaskImage: 'radial-gradient(ellipse at center, transparent 58%, black 100%)'}} /> : null}
    {/* overlay (the No AI label): above the soft corners so it stays sharp, but with the same RGB split, and the texture,
        grain and vignette over it like everything else */}
    {overlay ? <AbsoluteFill style={{filter: (overlaySplit ?? ab) > 0 ? `url(#${overlaySplit === undefined ? 'look-ca' : 'look-ca-label'})` : undefined}}>{overlay}</AbsoluteFill> : null}
    {/* a fine printed-canvas texture over everything, text included */}
    {texture > 0 ? <AbsoluteFill style={{backgroundImage: 'radial-gradient(rgba(255,255,255,.9) 0.8px, transparent 1.3px), radial-gradient(rgba(0,0,0,.9) 0.8px, transparent 1.3px)',
      backgroundSize: '4px 4px, 4px 4px', backgroundPosition: '0 0, 2px 2px', mixBlendMode: 'soft-light', opacity: 0.18 * texture}} /> : null}
    {grain > 0 ? <AbsoluteFill style={{filter: 'url(#look-grain)', mixBlendMode: 'overlay', opacity: 0.35 * grain}} /> : null}
    {vignette > 0 ? <AbsoluteFill style={{background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,${0.55 * vignette}) 100%)`}} /> : null}
  </AbsoluteFill>;
};
