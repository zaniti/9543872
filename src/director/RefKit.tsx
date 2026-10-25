import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {backgroundZoom} from './templateMotion';
import {CREAM, PAPER, RED, RevealText, TEXT_ON_PAPER, TagBox, clamp, easeInOut, easeOut, paperFilter, paperVeil, textBase, textWidth} from './channelStyle';

/**
 * The reference kit (the owner's reference channels, studied frame by frame on 2026-10-22), in the channel's own theme:
 * one font (Poppins), the channel's bar colour, one cream. Every label in these templates behaves the same way:
 * - a tag box appears at its full width (a short, soft pop), then its text types in, one character per frame;
 * - a hand-drawn arrow draws itself from the tag to what it names;
 * - nothing ever says "Source in Description".
 */

const TYPE_STEP = 1; // frames per character (the references type one character per frame at 30 fps)

/** Tag sizes measured on the references (Poppins SemiBold at 1920x1080): a tag naming a place or a person on a picture
 *  is 56 px (Brussels, King Leopold II: an 87 px box); a year tag or a keyword tag is 75 px (1816, Contracts: 116 px). */
export const TAG = 56;
export const TAG_BIG = 75;

/** A plain text in the references' text animation (channelStyle RevealText); `rate` is letters per frame. */
export const Reveal: React.FC<{text: string; f: number; start: number; rate?: number; marks?: {from: number; to: number; at: number; color: string}[]}> = ({text, f, start, rate, marks}) =>
  <RevealText text={text} frame={f} start={start} step={rate ? 1 / rate : undefined} marks={marks} />;

/** Characters shown at frame f of a text that starts typing at `start` (rtl: the last character first). */
export const typed = (text: string, f: number, start: number, rtl = false, step = TYPE_STEP): string => {
  const n = Math.max(0, Math.min(text.length, Math.floor((f - start) / step) + 1));
  return rtl ? text.slice(text.length - n) : text.slice(0, n);
};

/** A tag in the references' tag animation (channelStyle TagBox): the box grows with its letters, each rising in;
 *  its final width is kept from the start, so layouts never move. Years type from the right. */
export const TypeTag: React.FC<{text: string; f: number; start: number; size?: number; rtl?: boolean; color?: string; textColor?: string;
  out?: number; style?: React.CSSProperties; weight?: number}> = ({text, f, start, size = 40, rtl, color = RED, textColor = CREAM, out, style, weight = 600}) =>
  <TagBox text={text} frame={f} start={start} size={size} rtl={rtl} color={color} textColor={textColor} weight={weight} style={style}
    opacity={out === undefined ? 1 : interpolate(f, [out - 6, out], [1, 0], clamp)} />;

/** A hand-drawn curved arrow from (x1,y1) to (x2,y2) in screen pixels; it draws itself over `dur` frames from `start`. */
export const DrawnArrow: React.FC<{x1: number; y1: number; x2: number; y2: number; f: number; start: number; dur?: number; bend?: number; color?: string; width?: number; opacity?: number;
  head?: number}> = ({x1, y1, x2, y2, f, start, dur = 12, bend = 0.35, color = CREAM, width = 5, opacity = 1, head = Math.max(20, width * 4)}) => {
  const p = interpolate(f, [start, start + dur], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  if (p <= 0) return null;
  const mx = (x1 + x2) / 2 - (y2 - y1) * bend, my = (y1 + y2) / 2 + (x2 - x1) * bend; // the curve bows to one side
  const ang = Math.atan2(y2 - my, x2 - mx);
  return <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity, overflow: 'visible'}}>
    <path d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" pathLength={1}
      strokeDasharray={1} strokeDashoffset={1 - p} style={{filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.45))'}} />
    {p >= 0.98 ? <path d={`M ${x2} ${y2} l ${-head * Math.cos(ang - 0.5)} ${-head * Math.sin(ang - 0.5)} M ${x2} ${y2} l ${-head * Math.cos(ang + 0.5)} ${-head * Math.sin(ang + 0.5)}`}
      fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" style={{filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.45))'}} /> : null}
  </svg>;
};

/** The channel's own number mark (not the references' round badge, the owner asked for a calmer one, 2026-10-23):
 *  a thin line in the channel colour draws down, then the number ("01") arrives in cream beside it, top left. */
export const Badge: React.FC<{text: string; f: number; at?: number}> = ({text, f, at = 0}) => {
  const n = /^\d$/.test(text) ? `0${text}` : text;
  const line = easeOut(f, at, at + 8);
  return <div style={{position: 'absolute', left: 96, top: 86, display: 'flex', alignItems: 'center', gap: 18, filter: 'drop-shadow(0 2px 8px rgba(0,0,0,.5))'}}>
    <div style={{width: 4, height: 58, background: RED, borderRadius: 2, transform: `scaleY(${line})`, transformOrigin: 'top'}} />
    <div style={{...textBase, fontWeight: 600, fontSize: 52, lineHeight: 1, letterSpacing: 3, color: CREAM, whiteSpace: 'pre'}}><RevealText text={n} frame={f} start={at + 5} /></div>
  </div>;
};

/** A deterministic ragged edge: points along a print's outline, the top and bottom torn (the references' polaroids). */
const tornClip = (w: number, h: number, seed: number) => {
  const j = (i: number) => { const v = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453; return v - Math.floor(v); };
  const pts: string[] = [];
  const step = 9;
  for (let x = 0; x <= w; x += step) pts.push(`${x}px ${(j(x) * 4).toFixed(1)}px`);
  for (let y = step; y < h; y += step * 3) pts.push(`${(w - j(y + 500) * 2).toFixed(1)}px ${y}px`);
  for (let x = w; x >= 0; x -= step) pts.push(`${x}px ${(h - j(x + 1000) * 9).toFixed(1)}px`);
  for (let y = h - step; y > 0; y -= step * 3) pts.push(`${(j(y + 1500) * 2).toFixed(1)}px ${y}px`);
  return `polygon(${pts.join(',')})`;
};

/** A polaroid print with torn edges: the photo, and under it a wide margin with the name typed in the channel colour
 *  (the references' name card: Baron Stockmar, Jay Cooke). `w` and `h` are the photo's size. */
export const TornPrint: React.FC<{src: string; w: number; h: number; position?: string; name?: string; nameAt?: number; nameSize?: number; f: number; seed?: number}> = ({src, w, h, position, name, nameAt = 0, nameSize = 38, f, seed = 1}) => {
  const pad = Math.round(w * 0.04), bottom = Math.round(nameSize * 2.6);
  const W = w + 2 * pad, H = h + pad + bottom;
  // a long name shrinks to stay inside the print with a margin (the owner, 2026-10-24: CHRISTOPHER MARLOWE ran past the edges)
  const size = name ? Math.min(nameSize, Math.floor(nameSize * (W - 4 * pad) / Math.max(1, textWidth(name, nameSize, 700)))) : nameSize;
  return <div style={{position: 'relative', width: W, height: H, filter: 'drop-shadow(0 14px 22px rgba(0,0,0,.3))'}}>
    <div style={{position: 'absolute', inset: 0, background: '#f7f4ec', clipPath: tornClip(W, H, seed)}}>
      <Img src={staticFile(src)} style={{position: 'absolute', left: pad, top: pad, width: w, height: h, objectFit: 'cover', objectPosition: position ?? '50% 25%', display: 'block'}} />
      {name ? <div style={{position: 'absolute', left: 0, right: 0, top: pad + h, height: bottom, display: 'flex', alignItems: 'center', justifyContent: 'center',
        ...textBase, fontWeight: 700, fontSize: size, color: TEXT_ON_PAPER, whiteSpace: 'pre'}}>
        <span style={{position: 'relative'}}><span style={{visibility: 'hidden'}}>{name}</span>
          <span style={{position: 'absolute', left: 0, top: 0}}><Reveal text={name} f={f} start={nameAt} /></span></span>
      </div> : null}
    </div>
  </div>;
};

/** A photo or film frame filling the screen with the house slow push-in. */
const Backdrop: React.FC<{src: string; position?: string; frame: number; dim?: number}> = ({src, position = '50% 50%', frame, dim = 0}) => <>
  <Img src={staticFile(src)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: position,
    transform: `scale(${backgroundZoom(frame)})`, transformOrigin: position}} />
  {dim > 0 ? <AbsoluteFill style={{background: `rgba(0,0,0,${dim})`}} /> : null}
</>;

// ------------------------------------------------------------------ T3: year tag (and year range, date, figure)

/**
 * The year (or a date) in a tag at the top right of a photo, typed in (measured: 75 px type, 175 px from the right edge,
 * 100 px from the top). With `yearEnd` the two years sit centred at the top and an arrow draws from the first to the
 * second. With `figure` the photo dims and a large figure in the channel colour types in, centred ("£3 MILLION").
 */
export const YearTagRef: React.FC<{background: string; position?: string; year: string; yearEnd?: string; figure?: string; figureAt?: number;
  durationFrames: number; revealShift?: number}> = ({background, position, year, yearEnd, figure, figureAt, durationFrames, revealShift = 0}) => {
  const clock = useCurrentFrame();
  const f = clock - revealShift;
  const t0 = 8;
  // dates are written with a comma after the month: "October, 1975" and "October 24, 1975" (the owner, 2026-10-23)
  year = year.replace(/^([A-Za-z]+\.?)\s+(\d{3,4})$/, '$1, $2').replace(/^([A-Za-z]+\.?\s+\d{1,2})\s+(\d{3,4})$/, '$1, $2');
  const lineStart = t0 + year.length + 6, lineEnd = lineStart + 10;
  const fig = figureAt ?? (yearEnd ? lineEnd + 18 : t0 + year.length + 20);
  const dim = figure ? interpolate(f, [fig - 4, fig + 8], [0, 0.42], clamp) : 0;
  return <AbsoluteFill style={{background: '#0d0d0d', overflow: 'hidden'}}>
    <Backdrop src={background} position={position} frame={clock} dim={dim} />
    {yearEnd ? <div style={{position: 'absolute', top: 100, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
      <TypeTag text={year} f={f} start={t0} size={TAG_BIG} />
      <svg width={470} height={40} style={{overflow: 'visible', filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.45))'}}>
        <line x1={34} y1={20} x2={34 + 396 * easeInOut(f, lineStart, lineEnd)} y2={20} stroke={CREAM} strokeWidth={5} strokeLinecap="round" />
        {f >= lineEnd ? <path d="M 430 20 l -18 -12 M 430 20 l -18 12" stroke={CREAM} strokeWidth={5} strokeLinecap="round" fill="none" /> : null}
      </svg>
      <TypeTag text={yearEnd} f={f} start={lineEnd - 2} size={TAG_BIG} />
    </div> : <div style={{position: 'absolute', top: 100, right: 175}}>
      <TypeTag text={year} f={f} start={t0} size={TAG_BIG} />
    </div>}
    {figure && f >= fig ? <div style={{position: 'absolute', left: 0, right: 0, top: 386, textAlign: 'center', ...textBase, fontWeight: 800, fontSize: 120, letterSpacing: -2, color: RED,
      textShadow: '0 6px 22px rgba(0,0,0,.55)', whiteSpace: 'pre'}}><span style={{position: 'relative'}}><span style={{visibility: 'hidden'}}>{figure}</span>
        <span style={{position: 'absolute', left: 0, top: 0}}><Reveal text={figure} f={f} start={fig} /></span></span></div> : null}
    {void durationFrames}
  </AbsoluteFill>;
};

// ------------------------------------------------------------------ T37: keyword chips

/** Two to five short words in tags along the bottom left of a photo, one after another on their spoken words
 *  (measured: 75 px tags, 102 px from the bottom, 58 px apart, the row centred). With `spots`, place names on the
 *  picture: 56 px tags above small pins. */
export const KeywordChips: React.FC<{background: string; position?: string; words: string[]; at?: number[]; spots?: {x: number; y: number}[]; revealShift?: number}> = ({background, position, words, at = [], spots, revealShift = 0}) => {
  const clock = useCurrentFrame();
  const f = clock - revealShift;
  return <AbsoluteFill style={{background: '#0d0d0d', overflow: 'hidden'}}>
    <Backdrop src={background} position={position} frame={clock} />
    {spots ? words.map((w, i) => {
      // place names on the picture: a small pin on the place, the tag just above it
      const sp = spots[i] ?? {x: 50, y: 50}, t = at[i] ?? 8 + i * 22;
      const z = backgroundZoom(clock);
      const x = ((sp.x / 100) * 1920 - 960) * z + 960, y = ((sp.y / 100) * 1080 - 540) * z + 540;
      return <React.Fragment key={i}>
        <div style={{position: 'absolute', left: x - 9, top: y - 9, width: 18, height: 18, borderRadius: 9, background: CREAM, border: `4px solid ${RED}`, boxSizing: 'border-box',
          transform: `scale(${easeOut(f, t, t + 6)})`, boxShadow: '0 3px 8px rgba(0,0,0,.4)'}} />
        <div style={{position: 'absolute', left: x, top: y - 114, transform: 'translateX(-50%)'}}><TypeTag text={w} f={f} start={t + 3} size={TAG} /></div>
      </React.Fragment>;
    }) : <div style={{position: 'absolute', left: 120, right: 120, bottom: 102, display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 58, alignItems: 'center'}}>
      {/* the finished row is centred on the screen (as the references' full rows are); each word's place is kept from
          the start, so the row never shifts while the words arrive */}
      {words.map((w, i) => {
        const t = at[i] ?? 8 + i * 22;
        return f >= t ? <TypeTag key={i} text={w} f={f} start={t} size={TAG_BIG} />
          : <div key={i} style={{visibility: 'hidden'}}><TypeTag text={w} f={t + 999} start={t} size={TAG_BIG} /></div>;
      })}
    </div>}
  </AbsoluteFill>;
};

// ------------------------------------------------------------------ T36: relationship chain on paper

export type ChainPerson = {src: string; aspect: number; name: string; at: number; position?: string};

/**
 * Portrait prints on the channel's paper, joined by thick hand-drawn arrows (the references, measured: one large torn
 * polaroid at a time, about 530 px wide, its name typed in its bottom margin; the camera travels along the arrow to the
 * next print). Each print drops in on its word, then its name types; the prints sit a little higher or lower in turn.
 */
export const ChainBoard: React.FC<{people: ChainPerson[]; labels?: string[]; revealShift?: number}> = ({people, labels = [], revealShift = 0}) => {
  const clock = useCurrentFrame();
  const f = clock - revealShift;
  const H = 560, gap = 560, nameSize = 38;
  const cards = people.map((p, i) => {
    const w = Math.round(Math.max(400, Math.min(560, H * p.aspect)));
    const pad = Math.round(w * 0.04);
    return {...p, w, W: w + 2 * pad, Hc: H + pad + Math.round(nameSize * 2.6), dy: i % 2 ? 70 : -70};
  });
  let x = 0;
  const xs = cards.map((c) => { const at = x; x += c.W + gap; return at; });
  const cx = (i: number) => xs[i] + cards[i].W / 2, cy = (i: number) => 540 + cards[i].dy;
  // the camera: on the first print, then along to each new one as it arrives
  let camX = cx(0), camY = cy(0);
  cards.forEach((c, i) => {
    if (i === 0) return;
    const p = easeInOut(f, c.at - 14, c.at + 10);
    camX += (cx(i) - camX) * p; camY += (cy(i) - camY) * p;
  });
  return <AbsoluteFill style={{overflow: 'hidden', background: '#d9d3c4'}}>
    <AbsoluteFill style={{transform: `scale(${1.02 + Math.max(0, clock) * 0.00012})`}}>
      <Img src={staticFile(PAPER)} style={{width: '100%', height: '100%', objectFit: 'cover', filter: paperFilter('brightness(1.09) saturate(.58)')}} />
      <div style={{position: 'absolute', inset: 0, background: paperVeil('rgba(247,243,223,.42)')}} />
    </AbsoluteFill>
    <AbsoluteFill style={{transform: `translate(${960 - camX}px, ${540 - camY}px)`}}>
      {cards.map((c, i) => {
        if (f < c.at - 14) return null;
        const drop = interpolate(f, [c.at, c.at + 10], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.4))});
        const prev = cards[i - 1];
        const top = cy(i) - c.Hc / 2;
        return <React.Fragment key={i}>
          {prev ? <DrawnArrow x1={xs[i - 1] + prev.W + 40} y1={cy(i - 1) - 40} x2={xs[i] - 46} y2={cy(i) - 30} f={f} start={c.at - 16} dur={14}
            bend={i % 2 ? -0.22 : 0.22} color="#1b1a17" width={9} head={34} /> : null}
          {f >= c.at ? <div style={{position: 'absolute', left: xs[i], top, opacity: Math.min(1, drop * 1.5), transform: `translateY(${(1 - drop) * -40}px) scale(${0.94 + 0.06 * drop})`}}>
            <TornPrint src={c.src} w={c.w} h={H} position={c.position} name={c.name} nameAt={c.at + 8} nameSize={nameSize} f={f} seed={i + 3} />
            {labels[i] ? <div style={{marginTop: 18, textAlign: 'center'}}><TypeTag text={labels[i]} f={f} start={c.at + 14} size={44} /></div> : null}
          </div> : null}
        </React.Fragment>;
      })}
    </AbsoluteFill>
  </AbsoluteFill>;
};
