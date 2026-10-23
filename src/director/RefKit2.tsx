import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {backgroundZoom} from './templateMotion';
import {CREAM, INK, PAPER, RED, TEXT_ON_PAPER, clamp, easeInOut, easeOut, formatNumber, paperFilter, paperVeil, textBase, textWidth} from './channelStyle';
import {Badge, DrawnArrow, Reveal, TAG, TAG_BIG, TornPrint, TypeTag} from './RefKit';

/**
 * The reference kit, part 2 (the owner's reference channels, studied frame by frame on 2026-10-22). Same theme as every
 * template: Poppins, the channel colour, one cream; text types in one character per frame; arrows draw themselves.
 */

export const Paper: React.FC<{frame: number}> = ({frame}) => <AbsoluteFill style={{transform: `scale(${1.02 + Math.max(0, frame) * 0.00012})`}}>
  <Img src={staticFile(PAPER)} style={{width: '100%', height: '100%', objectFit: 'cover', filter: paperFilter('brightness(1.09) saturate(.58)')}} />
  <div style={{position: 'absolute', inset: 0, background: paperVeil('rgba(247,243,223,.42)')}} />
</AbsoluteFill>;

const Photo: React.FC<{src: string; position?: string; frame: number; dim?: number}> = ({src, position = '50% 50%', frame, dim = 0}) => <>
  <Img src={staticFile(src)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: position,
    transform: `scale(${backgroundZoom(frame)})`, transformOrigin: position}} />
  {dim > 0 ? <AbsoluteFill style={{background: `rgba(0,0,0,${dim})`}} /> : null}
</>;

/** A print on paper: white border, soft shadow; rises in (from below, out of focus) on its frame. */
const Print: React.FC<{src: string; w: number; h: number; f: number; at: number; style?: React.CSSProperties; fit?: 'cover' | 'contain'; position?: string}> = ({src, w, h, f, at, style, fit = 'cover', position}) => {
  if (f < at) return null;
  const p = interpolate(f, [at, at + 12], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  return <div style={{position: 'absolute', width: w, height: h, background: '#fbf8f0', padding: 10, boxSizing: 'border-box', boxShadow: '0 14px 28px rgba(0,0,0,.28)',
    opacity: Math.min(1, p * 1.4), transform: `translateY(${(1 - p) * 140}px)`, filter: p < 1 ? `blur(${(1 - p) * 6}px)` : undefined, ...style}}>
    <Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: fit, objectPosition: position ?? '50% 50%', display: 'block'}} />
  </div>;
};

/** A number that counts up from 0 to `to` between frames a and b; the text around it ("$", " MILLION") stays put. */
const count = (to: number, f: number, a: number, b: number) => to * interpolate(f, [a, b], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
const splitFigure = (s: string): [string, number | null, string] => {
  const m = s.match(/^([^0-9]*)([0-9][0-9,.]*)(.*)$/);
  if (!m) return [s, null, ''];
  return [m[1], parseFloat(m[2].replace(/,/g, '')), m[3]];
};
const CountUp: React.FC<{text: string; f: number; at: number; dur?: number}> = ({text, f, at, dur = 26}) => {
  const [pre, n, post] = splitFigure(text);
  if (f < at) return <span style={{visibility: 'hidden'}}>{text}</span>;
  const dec = n === null ? 0 : (text.match(/\.(\d+)/) || [, ''])[1]!.length;
  const v = n === null ? 0 : count(n, f, at, at + dur);
  // the final text holds the place and the counting figure sits on it from the left: nothing moves while it counts
  return <span style={{position: 'relative', display: 'inline-block'}}><span style={{visibility: 'hidden'}}>{text}</span>
    <span style={{position: 'absolute', left: 0, top: 0, whiteSpace: 'pre'}}>{n === null ? <Reveal text={text} f={f} start={at} />
      : <>{pre}{dec ? v.toFixed(dec) : formatNumber(v)}{f >= at + dur ? <Reveal text={post} f={f} start={at + dur} /> : ''}</>}</span></span>;
};

// ------------------------------------------------------------------ T38: then and today

/**
 * A value then and what it is worth today: an optional heading, the first figure types in, a curved arrow draws to the
 * right, the second figure counts up, then a small cream word ("Today"). Over a darkened photo, or on the channel's paper
 * with the object itself (a note, a bond) printed beside the label.
 */
export const ThenToday: React.FC<{background?: string; position?: string; card?: {src: string; aspect: number}; heading?: string; label?: string;
  from: string; to: string; toWord?: string; at?: number[]; revealShift?: number}> = ({background, position, card, heading, label, from, to, toWord = 'TODAY', at = [], revealShift = 0}) => {
  const clock = useCurrentFrame();
  const f = clock - revealShift;
  const t0 = at[0] ?? 10, t1 = at[1] ?? t0 + from.length + 14, onPaper = !background;
  const ink = onPaper ? TEXT_ON_PAPER : RED;
  const big = {...textBase, fontWeight: 800, fontSize: 104, color: ink, whiteSpace: 'pre' as const, lineHeight: 1.1};
  const word = (t: number) => toWord ? <div style={{...textBase, fontWeight: 700, fontSize: 44, color: onPaper ? INK : CREAM, letterSpacing: 2, whiteSpace: 'pre', marginTop: 6}}><Reveal text={toWord} f={f} start={t} /></div> : null;
  if (onPaper && card) {
    // measured on the references: the label large at the top left (119 px), the object under it, the arrow, the value right
    const cw = Math.min(620, 460 * card.aspect), ch = cw / card.aspect;
    return <AbsoluteFill style={{overflow: 'hidden', background: '#d9d3c4'}}>
      <Paper frame={clock} />
      {label ? <div style={{position: 'absolute', left: 170, top: 300, ...textBase, fontWeight: 800, fontSize: 119, lineHeight: 1.1, color: ink, whiteSpace: 'pre'}}><Reveal text={label} f={f} start={t0 - 6} /></div> : null}
      <div style={{position: 'absolute', left: 170, top: label ? 470 : 300, width: cw, height: ch}}><Print src={card.src} w={cw} h={ch} f={f} at={t0 - 10} fit="contain" /></div>
      {from ? <div style={{position: 'absolute', left: 170, top: (label ? 470 : 300) + ch + 20, ...big}}><Reveal text={from} f={f} start={t0} /></div> : null}
      <DrawnArrow x1={850} y1={520} x2={1190} y2={540} f={f} start={t1 - 16} dur={14} bend={-0.35} color={INK} width={6} />
      <div style={{position: 'absolute', left: 1240, top: 470}}>
        <div style={big}><CountUp text={to} f={f} at={t1} /></div>
        {word(t1 + 28)}
      </div>
    </AbsoluteFill>;
  }
  // over a photo (measured): the heading at the top (92 px), the two values low (104 px) with an arrow arching between them
  const rowTop = heading ? 630 : 500;
  return <AbsoluteFill style={{overflow: 'hidden', background: '#111'}}>
    {onPaper ? <Paper frame={clock} /> : <Photo src={background!} position={position} frame={clock} dim={0.62} />}
    {heading ? <div style={{position: 'absolute', top: 190, left: 0, right: 0, textAlign: 'center', ...textBase, fontWeight: 700, fontSize: 92,
      color: onPaper ? INK : CREAM, letterSpacing: 1, opacity: easeOut(f, 0, 10)}}>{heading}</div> : null}
    {label ? <div style={{position: 'absolute', left: 0, width: 860, top: rowTop - 90, textAlign: 'right', ...textBase, fontWeight: 700, fontSize: 56, color: onPaper ? INK : CREAM, whiteSpace: 'pre'}}><Reveal text={label} f={f} start={t0 - 6} /></div> : null}
    {from ? <div style={{position: 'absolute', left: 0, width: 860, top: rowTop, textAlign: 'right', ...big}}><Reveal text={from} f={f} start={t0} /></div> : null}
    <div style={{position: 'absolute', left: 1100, top: rowTop}}>
      <div style={big}><CountUp text={to} f={f} at={t1} /></div>
      {word(t1 + 28)}
    </div>
    <DrawnArrow x1={800} y1={rowTop - 50} x2={1130} y2={rowTop - 50} f={f} start={t1 - 16} dur={14} bend={-0.3} color={onPaper ? INK : CREAM} width={6} />
  </AbsoluteFill>;
};

// ------------------------------------------------------------------ T39: numbered steps

/** How something works, in two to four short steps joined by drawn arrows, over a darkened photo or document. A small
 *  numbered badge sits top left (the part of the explanation: 1, 2, 3...). */
export const NumberedSteps: React.FC<{background: string; position?: string; steps: string[]; at?: number[]; badge?: string; revealShift?: number}> = ({background, position, steps, at = [], badge, revealShift = 0}) => {
  const clock = useCurrentFrame();
  const f = clock - revealShift;
  // a gentle zig-zag: left, right, then back down the middle; arrows run between the words' edges, never through them
  // measured on the references: 92 px capitals, the first two side by side high up, the next ones lower in the middle
  const spots = [[560, 400], [1360, 400], [960, 700], [960, 950]];
  const half = (s: string) => textWidth(s, 92, 800, 1) / 2; // exact half width of a step (92 px Poppins ExtraBold)
  const list = steps.slice(0, 4).map((x) => x.toUpperCase());
  return <AbsoluteFill style={{overflow: 'hidden', background: '#111'}}>
    <Photo src={background} position={position} frame={clock} dim={0.6} />
    {badge ? <Badge text={badge} f={f} /> : null}
    {list.map((s, i) => {
      const t = at[i] ?? 8 + i * 30;
      const [x, y] = spots[i];
      let arrow: React.ReactNode = null;
      if (i > 0) {
        const [px, py] = spots[i - 1];
        // every arrow starts and ends 30 px clear of the words (their exact widths) and bows away from them
        const a = i === 1 ? [px + half(list[0]) + 30, py - 50, x - half(s) - 30, y - 50, -0.3]
          : i === 2 ? [px + Math.min(half(list[1]) * 0.5, 200), py + 62, x + half(s) + 34, y, -0.42]
          : [px - half(list[2]) - 34, py + 10, x - half(s) - 34, y - 6, 0.5];
        arrow = <DrawnArrow x1={a[0]} y1={a[1]} x2={a[2]} y2={a[3]} f={f} start={t - 14} dur={13} bend={a[4]} width={5} />;
      }
      return <React.Fragment key={i}>
        {arrow}
        <div style={{position: 'absolute', left: x - 700, width: 1400, top: y - 46, textAlign: 'center', ...textBase, fontWeight: 800, fontSize: 92, lineHeight: 1, color: CREAM,
          letterSpacing: 1, textShadow: '0 4px 16px rgba(0,0,0,.6)', whiteSpace: 'pre'}}><Reveal text={s} f={f} start={t} /></div>
      </React.Fragment>;
    })}
  </AbsoluteFill>;
};

// ------------------------------------------------------------------ T40: big year

/** A year (or a short figure) huge in the middle while the photos behind it change on its rhythm; the characters
 *  arrive one by one. The opener of a chapter. */
export const BigYearRef: React.FC<{backgrounds: string[]; text: string; at?: number; revealShift?: number; durationFrames: number}> = ({backgrounds, text, at = 8, revealShift = 0, durationFrames}) => {
  const clock = useCurrentFrame();
  const f = clock - revealShift;
  const n = Math.max(1, backgrounds.length);
  // the photos behind change fast, about every 10 frames, cycling through them (the owner, 2026-10-23)
  const per = Math.max(7, Math.min(11, Math.floor(durationFrames / n)));
  const k = Math.floor(Math.max(0, clock) / per) % n;
  const shown = Math.max(0, Math.min(text.length, Math.floor((f - at) / 5) + 1));
  // as large as the frame allows (the references fill about half the height): a long figure goes on two lines, the
  // number huge and its unit under it ("$80" / "MILLION")
  const sp = text.indexOf(' ');
  const rows = text.length > 6 && sp > 0 ? [text.slice(0, sp), text.slice(sp + 1)] : [text];
  const sizes = rows.map((r, i) => Math.round(Math.min(i === 0 ? 560 : 230, 1560 / Math.max(1, r.length * 0.64))));
  const shadow = (s: number) => [2, 4, 6, 8].map((d, i) => `0 ${Math.round((d * s) / 300)}px 0 ${['#c9c3b6', '#b3ad9f', '#9d9789', '#878173'][i]}`).join(', ') + ', 0 18px 36px rgba(0,0,0,.6)';
  let k0 = 0;
  return <AbsoluteFill style={{overflow: 'hidden', background: '#111'}}>
    <Photo src={backgrounds[k]} frame={clock - k * per} dim={0.25} />
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column'}}>
      {rows.map((r, j) => {
        const first = k0; k0 += r.length + 1;
        return <div key={j} style={{position: 'relative', ...textBase, fontWeight: 800, fontSize: sizes[j], letterSpacing: 4, lineHeight: 1, whiteSpace: 'pre', color: CREAM,
          textShadow: shadow(sizes[j])}}>
          <span style={{visibility: 'hidden'}}>{r}</span>
          <span style={{position: 'absolute', left: 0, top: 0}}>{[...r].map((c, i) => <span key={i} style={{opacity: first + i < shown ? 1 : 0,
            display: 'inline-block', transform: `translateY(${first + i < shown ? 0 : 30}px)`}}>{c}</span>)}</span>
        </div>;
      })}
    </AbsoluteFill>
  </AbsoluteFill>;
};

// ------------------------------------------------------------------ T41: figure on paper

/** A picture of the thing (a map, an object) on the channel's paper, a short heading beside it and a figure that counts
 *  up under the heading ("U.S. National Debt / $65 MILLION"). */
export const FigureOnPaper: React.FC<{card: {src: string; aspect: number}; heading: string; figure: string; at?: number[]; revealShift?: number}> = ({card, heading, figure, at = [], revealShift = 0}) => {
  const clock = useCurrentFrame();
  const f = clock - revealShift;
  const w = Math.min(780, 640 * card.aspect), h = w / card.aspect;
  // measured: the heading 80 px, the figure as large as the column allows (up to 190 px), both centred in the column
  const colL = 150 + w + 80, colW = 1920 - 80 - colL;
  const head = Math.min(80, Math.round(colW / Math.max(1, heading.length * 0.56)));
  const fig = Math.min(190, Math.round(colW / Math.max(1, figure.length * 0.66)));
  return <AbsoluteFill style={{overflow: 'hidden', background: '#d9d3c4'}}>
    <Paper frame={clock} />
    <div style={{position: 'absolute', left: 150, top: 540 - h / 2, width: w, height: h}}><Print src={card.src} w={w} h={h} f={f} at={at[0] ?? 0} fit="contain" /></div>
    <div style={{position: 'absolute', left: colL, width: colW, top: 540 - (head * 1.3 + fig * 1.1) / 2, textAlign: 'center'}}>
      <div style={{...textBase, fontWeight: 600, fontSize: head, lineHeight: 1.3, color: INK, whiteSpace: 'pre'}}><Reveal text={heading} f={f} start={at[1] ?? 12} /></div>
      <div style={{...textBase, fontWeight: 800, fontSize: fig, color: TEXT_ON_PAPER, whiteSpace: 'pre', lineHeight: 1.1}}><CountUp text={figure} f={f} at={at[2] ?? 12 + heading.length + 6} /></div>
    </div>
  </AbsoluteFill>;
};

// ------------------------------------------------------------------ T42: between two

/** Two sides (two flags, two countries, two people) at the left and right of the paper, and the thing between them (a
 *  treaty, a loan, a bond) rising in the middle. */
export const BetweenTwo: React.FC<{left: {src: string; aspect: number}; right: {src: string; aspect: number}; middle?: {src: string; aspect: number};
  labels?: string[]; at?: number[]; revealShift?: number}> = ({left, right, middle, labels = [], at = [], revealShift = 0}) => {
  const clock = useCurrentFrame();
  const f = clock - revealShift;
  const side = (img: {src: string; aspect: number}, x: number, t: number, label?: string) => {
    const w = 380, h = Math.min(480, w / img.aspect);
    const p = interpolate(f, [t, t + 10], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
    if (f < t) return null;
    // with a middle picture the sides sit high (it rises between them); with only two, both are centred on the screen
    const cy = middle ? 300 : 540 - 50;
    return <div style={{position: 'absolute', left: x - w / 2, top: cy - h / 2, width: w, opacity: Math.min(1, p * 1.5), filter: p < 1 ? `blur(${(1 - p) * 8}px)` : undefined}}>
      <Img src={staticFile(img.src)} style={{width: w, height: h, objectFit: 'cover', display: 'block', boxShadow: '0 10px 22px rgba(0,0,0,.25)'}} />
      {label ? <div style={{marginTop: 24, textAlign: 'center'}}><TypeTag text={label} f={f} start={t + 8} size={48} /></div> : null}
    </div>;
  };
  const mw = middle ? Math.min(420, 560 * middle.aspect) : 0, mh = middle ? mw / middle.aspect : 0;
  return <AbsoluteFill style={{overflow: 'hidden', background: '#d9d3c4'}}>
    <Paper frame={clock} />
    {side(left, middle ? 360 : 560, at[0] ?? 0, labels[0])}
    {side(right, middle ? 1560 : 1360, at[1] ?? 24, labels[1])}
    {middle ? <div style={{position: 'absolute', left: 960 - mw / 2, top: 560 - mh / 2, width: mw, height: mh}}><Print src={middle.src} w={mw} h={mh} f={f} at={at[2] ?? 50} fit="contain" /></div> : null}
  </AbsoluteFill>;
};

// ------------------------------------------------------------------ T43: bars on paper

export type BarRow = {label: string; value: number; display?: string};

/** Two to four bars on the channel's paper, rising one after another, each value typed above its bar; with two bars a
 *  drawn arrow joins their tops (the rise or the fall). The first bar is in the channel colour, the others dark. */
export const BarsOnPaper: React.FC<{heading?: string; rows: BarRow[]; at?: number[]; revealShift?: number}> = ({heading, rows, at = [], revealShift = 0}) => {
  const clock = useCurrentFrame();
  const f = clock - revealShift;
  // measured on the references: bars 204 px wide on a scale from 150 to 1020 px high, a value axis at the left
  const raw = Math.max(1, ...rows.map((r) => r.value));
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const max = [1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].map((m) => m * mag).find((m) => m >= raw * 1.08) ?? raw;
  const n = rows.length, bw = 204, gap = n === 2 ? 510 : n === 3 ? 300 : 200, base = 1000, top = heading ? 300 : 230;
  const total = n * bw + (n - 1) * gap, x0 = 960 - total / 2 + 60;
  const tops = rows.map((r) => base - (base - top) * (r.value / max));
  const short = (v: number) => v >= 1e9 ? `${+(v / 1e9).toFixed(1)}B` : v >= 1e6 ? `${+(v / 1e6).toFixed(1)}M` : v >= 1e4 ? `${+(v / 1e3).toFixed(1)}K` : formatNumber(+v.toFixed(2));
  const axisX = x0 - 150;
  return <AbsoluteFill style={{overflow: 'hidden', background: '#d9d3c4'}}>
    <Paper frame={clock} />
    {heading ? <div style={{position: 'absolute', top: 70, left: 0, right: 0, textAlign: 'center', ...textBase, fontWeight: 700, fontSize: 60, color: INK, letterSpacing: 1}}><Reveal text={heading} f={f} start={0} /></div> : null}
    <div style={{position: 'absolute', left: axisX, top: top - 30, width: 3, height: base - top + 30, background: INK, opacity: 0.75 * easeOut(f, 0, 10)}} />
    {[0, 1, 2, 3, 4, 5].map((k) => <React.Fragment key={k}>
      <div style={{position: 'absolute', left: axisX - 14, top: base - (base - top) * (k / 5) - 1, width: 14, height: 3, background: INK, opacity: 0.75 * easeOut(f, 0, 10)}} />
      <div style={{position: 'absolute', left: axisX - 190, width: 166, top: base - (base - top) * (k / 5) - 27, textAlign: 'right', ...textBase, fontWeight: 500, fontSize: 38,
        color: INK, opacity: 0.75 * easeOut(f, 2, 12)}}>{short((max * k) / 5)}</div>
    </React.Fragment>)}
    <div style={{position: 'absolute', left: axisX, width: x0 + total + 80 - axisX, top: base, height: 4, background: INK, opacity: 0.8}} />
    {rows.map((r, i) => {
      const t = at[i] ?? 14 + i * 22;
      const p = interpolate(f, [t, t + 18], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
      const h = (base - tops[i]) * p, x = x0 + i * (bw + gap);
      return <React.Fragment key={i}>
        <div style={{position: 'absolute', left: x, width: bw, top: base - h, height: h, background: i === 0 ? RED : '#3d4a3f', boxShadow: '0 8px 18px rgba(0,0,0,.2)'}} />
        <div style={{position: 'absolute', left: x - 100, width: bw + 200, top: tops[i] - 92, textAlign: 'center', ...textBase, fontWeight: 800, fontSize: 60, color: i === 0 ? TEXT_ON_PAPER : INK, whiteSpace: 'pre'}}>
          <Reveal text={r.display ?? formatNumber(r.value)} f={f} start={t + 14} /></div>
        <div style={{position: 'absolute', left: x - 100, width: bw + 200, top: base + 16, textAlign: 'center', ...textBase, fontWeight: 600, fontSize: 38, color: INK, whiteSpace: 'pre'}}><Reveal text={r.label} f={f} start={t} /></div>
      </React.Fragment>;
    })}
    {n === 2 ? <DrawnArrow x1={x0 + bw + 30} y1={tops[0] + 20} x2={x0 + bw + gap - 30} y2={tops[1] - 20} f={f} start={(at[1] ?? 36) + 22} dur={14} bend={0.08} color={INK} width={5} /> : null}
  </AbsoluteFill>;
};

// ------------------------------------------------------------------ T14: percentage on a photo

/** A share: the photo dims, a large percentage counts up in the channel colour, then a tag names what it is
 *  ("Indigenous Rulers"); an optional year tag sits top right. */
export const PercentRef: React.FC<{background: string; position?: string; percent: number; label?: string; year?: string; at?: number; revealShift?: number}> = ({background, position, percent, label, year, at = 8, revealShift = 0}) => {
  const clock = useCurrentFrame();
  const f = clock - revealShift;
  const v = count(percent, f, at, at + 30);
  return <AbsoluteFill style={{overflow: 'hidden', background: '#111'}}>
    <Photo src={background} position={position} frame={clock} dim={interpolate(f, [at - 6, at + 6], [0, 0.5], clamp)} />
    {year ? <div style={{position: 'absolute', top: 100, right: 175}}><TypeTag text={year} f={f} start={0} size={TAG_BIG} /></div> : null}
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column'}}>
      {f >= at ? <div style={{...textBase, fontWeight: 800, fontSize: 148, color: RED, lineHeight: 1, textShadow: '0 8px 28px rgba(0,0,0,.55)', fontVariantNumeric: 'tabular-nums'}}>{Math.round(v)}%</div> : <div style={{height: 148}} />}
      <div style={{marginTop: 44, minHeight: 87}}>{label ? <TypeTag text={label} f={f} start={at + 34} size={TAG} /> : null}</div>
    </AbsoluteFill>
  </AbsoluteFill>;
};

// ------------------------------------------------------------------ T11b: sentence over a photo

/** One sentence over a darkened photo or film, in cream, centred, on one or two lines; the key words (in *stars*) in
 *  the channel colour. The words rise in softly. */
export const SentenceRef: React.FC<{background: string; position?: string; sentence: string; revealShift?: number; keyAt?: (number | null)[]}> = ({background, position, sentence, revealShift = 0, keyAt = []}) => {
  const clock = useCurrentFrame();
  const f = clock - revealShift;
  // the references: the sentence arrives in cream (about half a second), then the key words turn red, letter by letter
  const plain = sentence.replace(/\*/g, '');
  const r = Math.max(1, plain.length / 14), done = 6 + plain.length / r;
  const marks: {from: number; to: number; at: number; color: string}[] = [];
  let pos = 0, nth = 0;
  sentence.split(/(\*[^*]+\*)/).filter(Boolean).forEach((seg) => {
    const len = seg.replace(/\*/g, '').length;
    // each key phrase turns red on the narrator's word when the build knows it (data.keyAt), never before the line is in
    if (seg.startsWith('*')) { marks.push({from: pos, to: pos + len, at: Math.max(done + 4 + 12 * nth, keyAt[nth] ?? -Infinity), color: RED}); nth++; }
    pos += len;
  });
  return <AbsoluteFill style={{overflow: 'hidden', background: '#111'}}>
    <Photo src={background} position={position} frame={clock} dim={0.58} />
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
      <div style={{maxWidth: 1400, textAlign: 'center', ...textBase, fontWeight: 500, fontSize: 64, lineHeight: 1.3, color: CREAM, textShadow: '0 4px 18px rgba(0,0,0,.6)'}}>
        <Reveal text={plain} f={f} start={6} rate={r} marks={marks} />
      </div>
    </AbsoluteFill>
  </AbsoluteFill>;
};

// ------------------------------------------------------------------ T13: document and its words

/** The document itself on the channel's paper (left), the line it says (right, dark), then the figure that matters in
 *  the channel colour, typed under it ("$30,000 Today"). */
export const DocumentQuote: React.FC<{doc: {src: string; aspect: number}; quote: string; figure?: string; at?: number[]; revealShift?: number}> = ({doc, quote, figure, at = [], revealShift = 0}) => {
  const clock = useCurrentFrame();
  const f = clock - revealShift;
  // measured on the references: the document about 750 px high at the left; the quote small (36 px) and centred in the
  // space beside it, the figure under it (68 px SemiBold)
  const w = Math.min(doc.aspect >= 1 ? 760 : 600, 760 * doc.aspect), h = w / doc.aspect;
  const colL = 150 + w + 80;
  return <AbsoluteFill style={{overflow: 'hidden', background: '#d9d3c4'}}>
    <Paper frame={clock} />
    <div style={{position: 'absolute', left: 150, top: 540 - h / 2, width: w, height: h}}><Print src={doc.src} w={w} h={h} f={f} at={at[0] ?? 0} fit="contain" /></div>
    <div style={{position: 'absolute', left: colL, right: 90, top: 360, textAlign: 'center'}}>
      <div style={{...textBase, fontWeight: 500, fontSize: 38, lineHeight: 1.35, color: INK}}><Reveal text={quote} f={f} start={at[1] ?? 10} rate={Math.max(2, quote.length / 12)} /></div>
      {figure ? <div style={{marginTop: 46, ...textBase, fontWeight: 600, fontSize: 68, color: TEXT_ON_PAPER, whiteSpace: 'pre'}}><CountUp text={figure} f={f} at={at[2] ?? 40} /></div> : null}
    </div>
  </AbsoluteFill>;
};

// ------------------------------------------------------------------ T16 / T4: prints on paper

/** Two to four prints (documents, notes, photos) rising onto the channel's paper one after another, each settling where
 *  it belongs (a document, then the notes it created...). */
export const PrintsOnPaper: React.FC<{items: {src: string; aspect: number; position?: string}[]; at?: number[]; layout?: 'row' | 'portrait'; revealShift?: number}> = ({items, at = [], layout = 'row', revealShift = 0}) => {
  const clock = useCurrentFrame();
  const f = clock - revealShift;
  const n = items.length;
  // portrait: the person large on the left, the places and moments of their story appearing at the right
  const portrait = layout === 'portrait';
  // measured on the references: the portrait about 900 px high at the left, the other pictures 490 px wide stacked in a
  // column at the right; in a row, prints up to 700-800 px high
  const small = Math.max(1, n - 1);
  const sh = Math.min(300, (900 - (small - 1) * 30) / small);
  const slots = portrait ? [[460, 540], ...Array.from({length: small}, (_, k) => [1425, 540 - ((small - 1) / 2 - k) * (sh + 30)])]
    : n <= 2 ? [[560, 540], [1360, 540]] : n === 3 ? [[390, 540], [960, 540], [1530, 540]] : [[560, 300], [1360, 300], [560, 780], [1360, 780]];
  return <AbsoluteFill style={{overflow: 'hidden', background: '#d9d3c4'}}>
    <Paper frame={clock} />
    {items.map((it, i) => {
      const H = portrait ? (i === 0 ? 900 : sh) : n <= 2 ? 800 : n === 3 ? 700 : 440;
      const w = Math.min(portrait ? (i === 0 ? 640 : 490) : n <= 2 ? 760 : n === 3 ? 530 : 620, H * it.aspect), h = w / it.aspect;
      const [cx, cy] = slots[i];
      return <div key={i} style={{position: 'absolute', left: cx - w / 2, top: cy - h / 2, width: w, height: h}}>
        <Print src={it.src} w={w} h={h} f={f} at={at[i] ?? i * 26} fit="contain" position={it.position} />
      </div>;
    })}
  </AbsoluteFill>;
};

// ------------------------------------------------------------------ T7: one portrait print

/** A portrait print on the channel's paper with the name typed under it in the channel colour (the references' name card). */
export const PortraitPrint: React.FC<{src: string; aspect: number; position?: string; name: string; revealShift?: number}> = ({src, aspect, position, name, revealShift = 0}) => {
  const clock = useCurrentFrame();
  const f = clock - revealShift;
  // measured on the references: a torn polaroid about 600 x 820 px in the middle, the name typed in its bottom margin
  const h = 700, w = Math.max(460, Math.min(600, h * aspect));
  const p = interpolate(f, [0, 12], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const W = w + 2 * Math.round(w * 0.04), H = h + Math.round(w * 0.04) + Math.round(42 * 2.6);
  return <AbsoluteFill style={{overflow: 'hidden', background: '#d9d3c4'}}>
    <Paper frame={clock} />
    <div style={{position: 'absolute', left: 960 - W / 2, top: 540 - H / 2, opacity: Math.min(1, p * 1.4), transform: `translateY(${(1 - p) * 140}px)`,
      filter: p < 1 ? `blur(${(1 - p) * 6}px)` : undefined}}>
      <TornPrint src={src} w={w} h={h} position={position} name={name} nameAt={12} nameSize={42} f={f} seed={7} />
    </div>
    {void easeInOut}
  </AbsoluteFill>;
};
