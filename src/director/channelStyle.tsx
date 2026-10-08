import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile} from 'remotion';

/**
 * Channel style tokens. The look stays deliberately plain (Arial, flat red bars, graph paper, real photos):
 * the polish is in spacing, easing and consistency, not in effects.
 */
export const RED = '#aa1533'; // bars only (title, name, year bars, comparison bars)
export const TEXT_RED = '#c8130b'; // red text: headings, numbers, emphasised words (brighter, reads on photos)
export const CRIMSON = '#aa1533'; // year tags only
export const CREAM = '#fffaf2';
export const INK = '#17150f';
export const FONT = 'Arial, Helvetica, sans-serif';
export const PAPER = 'templates/clip6/paper-grid.jpg';

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const easeOut = (frame: number, from: number, to: number) =>
  interpolate(frame, [from, to], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
export const easeInOut = (frame: number, from: number, to: number) =>
  interpolate(frame, [from, to], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});

export const textBase: React.CSSProperties = {fontFamily: FONT, textRendering: 'geometricPrecision', WebkitFontSmoothing: 'antialiased'};

/** Graph-paper ground shared by the paper templates, with the same slow drift every paper template has. */
export const PaperGround: React.FC<{frame: number; paper?: string}> = ({frame, paper = PAPER}) => (
  <AbsoluteFill style={{transform: `scale(${1.02 + Math.max(0, frame) * 0.00012})`}}>
    <Img src={staticFile(paper)} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(1.09) saturate(.58)'}} />
    <div style={{position: 'absolute', inset: 0, background: 'rgba(247,243,223,.42)'}} />
  </AbsoluteFill>
);

/**
 * Flat colour bar that wipes open left-to-right, then its letters rise in one by one behind a mask.
 * The full text is laid out from the first frame, so the bar never changes width while it types.
 */
export const WipeBar: React.FC<{
  text: string; frame: number; start: number; color?: string; fontSize?: number; height?: number;
  padding?: number; letterSpacing?: number; radius?: number; spread?: number; style?: React.CSSProperties;
  /** 'rtl' opens the bar from its right edge and reveals the last character first. */
  direction?: 'ltr' | 'rtl';
  /** Frames for the bar to open and for each character to rise. */
  openFrames?: number; riseFrames?: number;
}> = ({text, frame, start, color = RED, fontSize = 72, height = 115, padding = 32, letterSpacing = 2, radius = 6, spread, style,
  direction = 'ltr', openFrames = 9, riseFrames = 7}) => {
  const open = easeInOut(frame, start, start + openFrames);
  if (open <= 0) return null;
  const chars = [...text];
  const span = spread ?? Math.min(24, 6 + chars.length);
  return <div style={{display: 'inline-flex', alignItems: 'center', height, padding: `0 ${padding}px`, boxSizing: 'border-box',
    background: color, color: CREAM, borderRadius: radius, overflow: 'hidden', whiteSpace: 'pre',
    clipPath: direction === 'rtl' ? `inset(0 0 0 ${(1 - open) * 100}% round ${radius}px)` : `inset(0 ${(1 - open) * 100}% 0 0 round ${radius}px)`, ...textBase, fontWeight: 700, fontSize, letterSpacing, lineHeight: 1, ...style}}>
    {chars.map((c, i) => {
      const order = direction === 'rtl' ? chars.length - 1 - i : i;
      const s = start + Math.round(openFrames * 0.55) + Math.round((order / Math.max(1, chars.length - 1)) * span);
      const p = easeOut(frame, s, s + riseFrames);
      return <span key={i} style={{display: 'inline-block', transform: `translateY(${(1 - p) * 110}%)`, opacity: Math.min(1, p * 1.6)}}>{c === ' ' ? ' ' : c}</span>;
    })}
  </div>;
};

/** Words that rise in one by one behind a mask (used for copy lines). */
export const RiseWords: React.FC<{text: string; frame: number; start: number; gap?: number; color?: string; emphasis?: string; emphasisColor?: string}> = ({text, frame, start, gap = 3, color = 'inherit', emphasis, emphasisColor = TEXT_RED}) => {
  const emph = new Set((emphasis ?? '').split(' ').filter(Boolean));
  return <>{text.split(' ').map((w, i) => {
    const p = easeOut(frame, start + i * gap, start + i * gap + 9);
    return <span key={i} style={{display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom', paddingBottom: '0.08em'}}>
      <span style={{display: 'inline-block', transform: `translateY(${(1 - p) * 105}%)`, opacity: p, color: emph.has(w) ? emphasisColor : color}}>{w}&nbsp;</span>
    </span>;
  })}</>;
};
