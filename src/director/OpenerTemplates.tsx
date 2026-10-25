import React from 'react';
import {AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {CREAM, CRIMSON, RED, TEXT_RED, clamp, revealChar, textBase} from './channelStyle';
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
 *   T1f  locator map   a small printed-atlas map card zooms toward the place, a dot and a hand-drawn ring mark it
 *   T1g  rewind        a big year counter runs back from today and settles on the year; "78 years ago" and the place
 *   T1h  letterbox     black cinema bars close in; the place spaced out in the top bar, the year in the bottom one
 *   T1i  dateline      a news-wire dateline types across a dark strip at the top ("PLACE, REGION — 1 DECEMBER 1948")
 *   T1j  stamp         a rubber stamp in the channel colour lands on the frame: the place and the date, rough ink
 */
type Bg = {background: string; backgroundVideo?: string; backgroundPosition?: string} & TemplateTiming;
const WHITE = CREAM; // one cream for all text (channelStyle)
const PAPER = '#f3ecdb';

/** Letters popping up one after another behind a mask (T1's rhythm: about one letter per frame). */
const Pop: React.FC<{text: string; frame: number; start: number; every?: number; style?: React.CSSProperties}> = ({text, frame, start, every = 1, style}) => (
  <span style={{display: 'inline-flex', overflow: 'hidden', whiteSpace: 'pre', ...style}}>
    {[...text].map((ch, i) => {
      const s = start + i * every;
      return <span key={i} style={revealChar(frame, s)}>
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

// ------------------------------------------------------------------ shared: coordinates

/** "34°59′ S · 138°31′ E" (or "34.98 S, 138.52 E") -> [lat, lon]; null when it can't be read. */
export const parseCoords = (c: string): [number, number] | null => {
  const parts = [...c.matchAll(/(\d+(?:\.\d+)?)\s*°?\s*(?:(\d+(?:\.\d+)?)\s*['′]?)?\s*([NSEW])/gi)];
  if (parts.length < 2) return null;
  const val = (m: RegExpMatchArray) => (Number(m[1]) + (m[2] ? Number(m[2]) / 60 : 0)) * (/[SW]/i.test(m[3]) ? -1 : 1);
  const lat = parts.find((m) => /[NS]/i.test(m[3])), lon = parts.find((m) => /[EW]/i.test(m[3]));
  return lat && lon ? [val(lat), val(lon)] : null;
};

// ------------------------------------------------------------------ T1f: locator map

const MAP_W = 8192, MAP_H = 4096;  // templates/worldmap.jpg, equirectangular

export const LocatorMap: React.FC<Bg & {place: string; year?: string; coords?: string; span?: number}> = ({background, backgroundVideo, backgroundPosition = '50% 50%', place, year = '', coords = '', span = 40, revealShift = 0}) => {
  const clock = useCurrentFrame();
  const f = clock - revealShift;
  const ll = parseCoords(coords) ?? [0, 0];
  const CW = 560, CH = 360;  // the map card
  // the card shows `span` degrees of longitude around the place at first, then pushes in to a third of that
  const zoom = interpolate(f, [4, 40], [1, 2.6], {...clamp, easing: Easing.out(Easing.cubic)});
  const pxPerDeg = (CW / span) * zoom;
  const scale = pxPerDeg / (MAP_W / 360);
  const mx = (ll[1] + 180) / 360 * MAP_W * scale, my = (90 - ll[0]) / 180 * MAP_H * scale;
  const ring = interpolate(f, [26, 44], [0, 1], clamp);
  const r = 26;
  const circ = 2 * Math.PI * r * 1.15;
  return <AbsoluteFill style={{overflow: 'hidden', background: '#111'}}>
    <Background src={background} video={backgroundVideo} position={backgroundPosition} frame={clock} />
    <div style={{position: 'absolute', left: 140, bottom: 150, clipPath: wipe(f, 0, 8)}}>
      <div style={{width: CW, height: CH, position: 'relative', overflow: 'hidden', border: `8px solid ${PAPER}`, boxShadow: '0 10px 28px rgba(0,0,0,.45)',
        backgroundImage: `url(${staticFile('templates/worldmap.jpg')})`, backgroundRepeat: 'no-repeat',
        backgroundSize: `${MAP_W * scale}px ${MAP_H * scale}px`, backgroundPosition: `${CW / 2 - mx}px ${CH / 2 - my}px`}}>
        <svg width={CW} height={CH} style={{position: 'absolute', inset: 0}}>
          {f >= 22 ? <circle cx={CW / 2} cy={CH / 2} r={9} fill={RED} stroke={WHITE} strokeWidth={3} /> : null}
          <circle cx={CW / 2} cy={CH / 2} r={r} fill="none" stroke={RED} strokeWidth={6} strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={circ * (1 - ring)} transform={`rotate(-100 ${CW / 2} ${CH / 2})`} />
        </svg>
      </div>
      <div style={{display: 'flex', alignItems: 'center', gap: 16, marginTop: 18}}>
        <Pop text={place} frame={f} start={30} style={{...textBase, color: WHITE, fontWeight: 700, fontSize: 60, lineHeight: 1,
          textShadow: '0 3px 14px rgba(0,0,0,.6)'}} />
        {year ? <span style={{display: 'inline-flex', background: CRIMSON, borderRadius: 6, padding: '8px 16px', clipPath: wipe(f, 34 + place.length, 40 + place.length)}}>
          <Pop text={year} frame={f} start={36 + place.length} style={{...textBase, color: WHITE, fontWeight: 700, fontSize: 40, lineHeight: 1}} />
        </span> : null}
      </div>
    </div>
  </AbsoluteFill>;
};

// ------------------------------------------------------------------ T1g: rewind

export const Rewind: React.FC<Bg & {place: string; year: string; now?: number; agoLabel?: string}> = ({background, backgroundVideo, backgroundPosition = '50% 50%', place, year, now = new Date().getFullYear(), agoLabel = 'years ago', revealShift = 0}) => {
  const clock = useCurrentFrame();
  const f = clock - revealShift;
  const target = Number(year) || now;
  // runs back fast, then slows and settles (a counter, not a fade)
  const shown = Math.round(interpolate(f, [2, 46], [now, target], {...clamp, easing: Easing.out(Easing.cubic)}));
  const settled = f >= 46;
  return <AbsoluteFill style={{overflow: 'hidden', background: '#111'}}>
    <Background src={background} video={backgroundVideo} position={backgroundPosition} frame={clock} />
    <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(0,0,0,.52) 0%, rgba(0,0,0,.2) 55%, rgba(0,0,0,0) 80%)'}} />
    <div style={{position: 'absolute', left: 140, top: 250, display: 'flex', flexDirection: 'column', alignItems: 'flex-start'}}>
      <div style={{...textBase, color: settled ? WHITE : 'rgba(255,253,247,.86)', fontWeight: 700, fontSize: 280, letterSpacing: -8, lineHeight: .9,
        fontVariantNumeric: 'tabular-nums', textShadow: '0 6px 26px rgba(0,0,0,.45)', opacity: f >= 2 ? 1 : 0}}>{shown}</div>
      <div style={{display: 'flex', alignItems: 'center', gap: 18, marginTop: 24, marginLeft: 10}}>
        <span style={{display: 'inline-flex', background: RED, borderRadius: 8, padding: '16px 28px', clipPath: wipe(f, 48, 58)}}>
          <Pop text={place.toUpperCase()} frame={f} start={52} style={{...textBase, color: WHITE, fontWeight: 700, fontSize: 52, letterSpacing: 4, lineHeight: 1}} />
        </span>
        {now > target ? <Pop text={`${now - target} ${agoLabel}`} frame={f} start={56 + place.length} style={{...textBase, color: WHITE, fontWeight: 700,
          fontSize: 40, letterSpacing: 2, lineHeight: 1, textShadow: '0 3px 12px rgba(0,0,0,.6)'}} /> : null}
      </div>
    </div>
  </AbsoluteFill>;
};

// ------------------------------------------------------------------ T1h: letterbox

export const Letterbox: React.FC<Bg & {place: string; year?: string; region?: string}> = ({background, backgroundVideo, backgroundPosition = '50% 50%', place, year = '', region = '', revealShift = 0}) => {
  const clock = useCurrentFrame();
  const f = clock - revealShift;
  const bar = interpolate(f, [0, 8], [0, 150], clamp);  // straight in, no easing: a hard cinema matte
  const spaced: React.CSSProperties = {...textBase, color: WHITE, fontWeight: 700, letterSpacing: 14, lineHeight: 1};
  return <AbsoluteFill style={{overflow: 'hidden', background: '#111'}}>
    <Background src={background} video={backgroundVideo} position={backgroundPosition} frame={clock} />
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: bar, background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <Pop text={place.toUpperCase()} frame={f} start={10} style={{...spaced, fontSize: 48}} />
    </div>
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: bar, background: '#050505', display: 'flex', alignItems: 'center',
      justifyContent: 'center', gap: 28}}>
      {region ? <Pop text={region.toUpperCase()} frame={f} start={14 + place.length} style={{...spaced, fontSize: 30, color: 'rgba(255,253,247,.75)'}} /> : null}
      {region && year ? <span style={{width: 40, height: 4, background: RED, clipPath: wipe(f, 16 + place.length, 22 + place.length)}} /> : null}
      {year ? <Pop text={year} frame={f} start={18 + place.length} style={{...spaced, fontSize: 42, letterSpacing: 10}} /> : null}
    </div>
  </AbsoluteFill>;
};

// ------------------------------------------------------------------ T1i: dateline

export const Dateline: React.FC<Bg & {place: string; year?: string; date?: string}> = ({background, backgroundVideo, backgroundPosition = '50% 50%', place, year = '', date = '', revealShift = 0}) => {
  const clock = useCurrentFrame();
  const f = clock - revealShift;
  const line = `${place.toUpperCase()} — ${(date || year).toUpperCase()}`;
  const typed = Math.max(0, Math.min(line.length, Math.floor((f - 8) * 1.5)));  // a teleprinter: about 45 letters a second
  const caret = typed < line.length || Math.floor(f / 8) % 2 === 0;
  return <AbsoluteFill style={{overflow: 'hidden', background: '#111'}}>
    <Background src={background} video={backgroundVideo} position={backgroundPosition} frame={clock} />
    <div style={{position: 'absolute', left: 0, right: 0, top: 90, height: 110, background: 'rgba(8,8,8,.78)', clipPath: wipe(f, 0, 8)}}>
      <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: 16, background: RED}} />
      <div style={{position: 'absolute', left: 140, top: 0, bottom: 0, display: 'flex', alignItems: 'center', ...textBase, color: WHITE,
        fontWeight: 700, fontSize: 46, letterSpacing: 5, whiteSpace: 'pre'}}>
        {[...line].map((ch, i) => <span key={i} style={revealChar(f, 8 + i / 1.5)}>{ch === ' ' ? ' ' : ch}</span>)}<span style={{display: 'inline-block', width: 24, height: 46, marginLeft: 6, background: caret && f >= 8 ? TEXT_RED : 'transparent'}} />
      </div>
    </div>
  </AbsoluteFill>;
};

// ------------------------------------------------------------------ T1j: stamp

export const Stamp: React.FC<Bg & {place: string; year?: string; date?: string}> = ({background, backgroundVideo, backgroundPosition = '50% 50%', place, year = '', date = '', revealShift = 0}) => {
  const clock = useCurrentFrame();
  const f = clock - revealShift;
  const hit = 10;  // the frame the stamp lands
  const s = f < hit ? 1.5 : f < hit + 3 ? interpolate(f, [hit, hit + 3], [1.08, 1], clamp) : 1;
  const ink = RED;
  return <AbsoluteFill style={{overflow: 'hidden', background: '#111'}}>
    <Background src={background} video={backgroundVideo} position={backgroundPosition} frame={clock} />
    <svg width={0} height={0} style={{position: 'absolute'}}>
      <filter id="stampInk" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves={2} seed={4} result="n" />
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.3 1.5" result="holes" />
        <feComposite in="SourceGraphic" in2="holes" operator="in" result="inked" />
        <feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves={1} seed={9} result="w" />
        <feDisplacementMap in="inked" in2="w" scale={5} />
      </filter>
    </svg>
    {f >= hit - 2 ? <div style={{position: 'absolute', right: 150, top: 150, transform: `scale(${s})`, transformOrigin: 'center', opacity: f >= hit ? .95 : 0,
      filter: 'url(#stampInk) drop-shadow(0 2px 6px rgba(0,0,0,.25))'}}>
      <div style={{border: `9px solid ${ink}`, padding: 8}}>
        <div style={{border: `3px solid ${ink}`, padding: '18px 40px 16px', textAlign: 'center'}}>
          <div style={{...textBase, color: ink, fontWeight: 700, fontSize: 78, letterSpacing: 6, lineHeight: 1}}>{place.toUpperCase()}</div>
          <div style={{height: 4, background: ink, margin: '14px 0 12px'}} />
          <div style={{...textBase, color: ink, fontWeight: 700, fontSize: 48, letterSpacing: 8, lineHeight: 1}}>{(date || year).toUpperCase()}</div>
        </div>
      </div>
    </div> : null}
  </AbsoluteFill>;
};
