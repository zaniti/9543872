import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {CRIMSON, RED, clamp, textBase} from './channelStyle';
import {Background} from './VariantTemplates';
import type {TemplateTiming} from './templateMotion';

/**
 * More ways to say "where and when", so videos stop opening the same way (the owner, 2026-10-18: almost every video
 * started with T1). Same plain hand-made language as T1: Arial, flat channel-colour bars, letters that pop up one after
 * another behind a mask (quick, never a soft fade), hard-edged wipes, no tilt. Film or a photo behind, as with T1.
 *   T1b  paper strip   a cream paper strip taped to the picture, the place in ink, the year in a channel-colour block
 *   T1c  lower third   the place in white bottom-left, a channel-colour rule drawn under it, the year at its end
 *   T1d  big year      the year huge on the left, the place on a channel-colour bar under it
 *   T1e  coordinates   the place's coordinates ticking in, the place under them, the year in a small block
 */
type Bg = {background: string; backgroundVideo?: string; backgroundPosition?: string} & TemplateTiming;
const WHITE = '#fffdf7';
const PAPER = '#f3ecdb';

/** Letters popping up one after another behind a mask (T1's rhythm: about one letter per frame). */
const Pop: React.FC<{text: string; frame: number; start: number; every?: number; style?: React.CSSProperties}> = ({text, frame, start, every = 1, style}) => (
  <span style={{display: 'inline-flex', overflow: 'hidden', whiteSpace: 'pre', ...style}}>
    {[...text].map((ch, i) => {
      const s = start + i * every;
      return <span key={i} style={{display: 'inline-block', transform: `translateY(${interpolate(frame, [s, s + 4], [110, 0], clamp)}%)`}}>
        {ch === ' ' ? ' ' : ch}</span>;
    })}
  </span>
);

/** A hard-edged wipe from the left (0 -> 1 between frames a and b). */
const wipe = (frame: number, a: number, b: number) => `inset(0 ${(1 - interpolate(frame, [a, b], [0, 1], clamp)) * 100}% 0 0)`;

// ------------------------------------------------------------------ T1b: paper strip

export const PaperStrip: React.FC<Bg & {place: string; year?: string}> = ({background, backgroundVideo, backgroundPosition = '50% 50%', place, year = '', revealShift = 0}) => {
  const clock = useCurrentFrame();
  const f = clock - revealShift;
  return <AbsoluteFill style={{overflow: 'hidden', background: '#111'}}>
    <Background src={background} video={backgroundVideo} position={backgroundPosition} frame={clock} />
    <div style={{position: 'absolute', left: 150, bottom: 150}}>
     <div style={{display: 'flex', alignItems: 'stretch', clipPath: wipe(f, 6, 16)}}>
      <div style={{background: PAPER, padding: '22px 40px 20px', boxShadow: '0 8px 22px rgba(0,0,0,.38)'}}>
        <Pop text={place.toUpperCase()} frame={f} start={12} style={{...textBase, color: '#17150f', fontWeight: 700, fontSize: 60, letterSpacing: 4, lineHeight: 1}} />
      </div>
      {year ? <div style={{background: CRIMSON, color: WHITE, padding: '22px 26px 20px', display: 'flex', alignItems: 'center'}}>
        <Pop text={year} frame={f} start={14 + place.length} style={{...textBase, fontWeight: 700, fontSize: 56, lineHeight: 1}} />
      </div> : null}
     </div>
      {/* a piece of tape over the left end, there from the first frame like a strip already stuck on */}
      <div style={{position: 'absolute', left: -30, top: -16, width: 96, height: 40, background: 'rgba(236,228,205,.85)',
        boxShadow: '0 1px 3px rgba(0,0,0,.2)', opacity: f >= 6 ? 1 : 0}} />
    </div>
  </AbsoluteFill>;
};

// ------------------------------------------------------------------ T1c: lower third

export const LowerThird: React.FC<Bg & {place: string; year?: string}> = ({background, backgroundVideo, backgroundPosition = '50% 50%', place, year = '', revealShift = 0}) => {
  const clock = useCurrentFrame();
  const f = clock - revealShift;
  const ruleW = Math.max(420, place.length * 44);
  return <AbsoluteFill style={{overflow: 'hidden', background: '#111'}}>
    <Background src={background} video={backgroundVideo} position={backgroundPosition} frame={clock} />
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 420, background: 'linear-gradient(transparent, rgba(0,0,0,.5))'}} />
    <div style={{position: 'absolute', left: 150, bottom: 150}}>
      <Pop text={place} frame={f} start={6} style={{...textBase, color: WHITE, fontWeight: 700, fontSize: 76, lineHeight: 1.05,
        textShadow: '0 3px 14px rgba(0,0,0,.55)'}} />
      <div style={{display: 'flex', alignItems: 'center', gap: 22, marginTop: 18}}>
        <div style={{width: ruleW, height: 8, background: RED, clipPath: wipe(f, 10 + place.length, 24 + place.length)}} />
        {year ? <Pop text={year} frame={f} start={24 + place.length} style={{...textBase, color: WHITE, fontWeight: 700, fontSize: 52,
          lineHeight: 1, textShadow: '0 3px 12px rgba(0,0,0,.55)'}} /> : null}
      </div>
    </div>
  </AbsoluteFill>;
};

// ------------------------------------------------------------------ T1d: big year

export const BigYear: React.FC<Bg & {place: string; year: string}> = ({background, backgroundVideo, backgroundPosition = '50% 50%', place, year, revealShift = 0}) => {
  const clock = useCurrentFrame();
  const f = clock - revealShift;
  return <AbsoluteFill style={{overflow: 'hidden', background: '#111'}}>
    <Background src={background} video={backgroundVideo} position={backgroundPosition} frame={clock} />
    <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(0,0,0,.5) 0%, rgba(0,0,0,.18) 55%, rgba(0,0,0,0) 80%)'}} />
    <div style={{position: 'absolute', left: 140, top: 250, display: 'flex', flexDirection: 'column', alignItems: 'flex-start'}}>
      <Pop text={year} frame={f} start={4} every={3} style={{...textBase, color: WHITE, fontWeight: 700, fontSize: 300, letterSpacing: -8,
        lineHeight: .9, textShadow: '0 6px 26px rgba(0,0,0,.45)'}} />
      <div style={{display: 'inline-flex', marginTop: 26, marginLeft: 12, background: RED, borderRadius: 8, padding: '18px 30px',
        clipPath: wipe(f, 18, 30)}}>
        <Pop text={place.toUpperCase()} frame={f} start={24} style={{...textBase, color: WHITE, fontWeight: 700, fontSize: 56,
          letterSpacing: 4, lineHeight: 1}} />
      </div>
    </div>
  </AbsoluteFill>;
};

// ------------------------------------------------------------------ T1e: coordinates

/** "0°28′ S · 73°08′ W": the digits run up to their value while the line types in. */
const ticking = (coords: string, p: number) => coords.replace(/\d+/g, (d) => String(Math.round(Number(d) * p)).padStart(d.length, '0'));

export const Coordinates: React.FC<Bg & {place: string; year?: string; coords?: string}> = ({background, backgroundVideo, backgroundPosition = '50% 50%', place, year = '', coords = '', revealShift = 0}) => {
  const clock = useCurrentFrame();
  const f = clock - revealShift;
  const p = interpolate(f, [4, 26], [0, 1], clamp);
  const placeAt = coords ? 18 : 6;
  return <AbsoluteFill style={{overflow: 'hidden', background: '#111'}}>
    <Background src={background} video={backgroundVideo} position={backgroundPosition} frame={clock} />
    <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 18% 22%, rgba(0,0,0,.5) 0%, rgba(0,0,0,.2) 40%, rgba(0,0,0,0) 65%)'}} />
    <div style={{position: 'absolute', left: 140, top: 130}}>
      {coords ? <div style={{...textBase, color: WHITE, fontWeight: 700, fontSize: 36, letterSpacing: 6, fontVariantNumeric: 'tabular-nums',
        clipPath: wipe(f, 2, 10), textShadow: '0 2px 10px rgba(0,0,0,.6)'}}>{ticking(coords, p)}</div> : null}
      <div style={{width: 120, height: 6, background: RED, margin: '16px 0 18px', clipPath: wipe(f, placeAt - 6, placeAt)}} />
      <Pop text={place} frame={f} start={placeAt} style={{...textBase, color: WHITE, fontWeight: 700, fontSize: 82, lineHeight: 1,
        textShadow: '0 3px 16px rgba(0,0,0,.55)'}} />
      {year ? <div style={{marginTop: 20}}>
        <span style={{display: 'inline-flex', background: CRIMSON, borderRadius: 6, padding: '10px 18px', clipPath: wipe(f, placeAt + place.length, placeAt + place.length + 8)}}>
          <Pop text={year} frame={f} start={placeAt + place.length + 4} style={{...textBase, color: WHITE, fontWeight: 700, fontSize: 44, lineHeight: 1}} />
        </span></div> : null}
    </div>
  </AbsoluteFill>;
};
