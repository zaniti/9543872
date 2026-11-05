import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {CREAM, FONT, INK, PAPER, RED, textBase} from './channelStyle';

/**
 * The book pack's call to action (the owner, 2026-11-05), drawn over the story while the narrator says it, and the
 * small reminder card at the end of the video. Everything hangs on the narration's words (engine/cta.py finds them in
 * the voice-over): captions rise word by word over the darkened story, "demonetized" cracks, the money rolls to $0.00,
 * the channel paper slides over on "books" and the books come in (pair or one by one, they alternate per video), the
 * bonus book gets its FREE band on "free", a black veil and "LINK IN THE DESCRIPTION" on "link", and everything slides
 * away on "back". Something moves until the story is back.
 */
export type CtaWord = {t: number; e: number; text: string; red?: boolean};
export type CtaMarks = {crack?: number; zero?: number; books: number; free?: number; link: number; back: number};
export type CtaStrings = {linkIn: string; description: string; pinned: string; parts: string[]; bonus: string; free: string; freeBonus: string; linkLine: string};
export type CtaProps = {start: number; end: number; words: CtaWord[]; marks: CtaMarks; covers: string[]; look: 'pair' | 'solo'; strings: CtaStrings};
export type CtaEndProps = {start: number; end: number; covers: string[]; pack: string; strings: CtaStrings; cardAt: number; linkAt: number};

const RATIO = 2182 / 1600;  // the covers' shape (Cover Maker)
const ease = Easing.bezier(0.2, 0, 0, 1);
const prog = (f: number, start: number, len = 14) => interpolate(f, [start, start + len], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
const lin = (f: number, start: number, len: number) => interpolate(f, [start, start + len], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
const cubic = (t: number) => 1 - (1 - t) ** 3;
const RISE = 9;  // a word rises like the name in the person label (T50): up from 0.42 em while it fades in, 9 frames

/** A cover as a hardcover the way Apple Books shows it: rounded corners, the hinge near the spine, a soft light on the
 * board and a soft shadow under the book. */
export const Book: React.FC<{src: string; w: number; style?: React.CSSProperties}> = ({src, w, style}) => {
  const r = Math.max(4, w * 0.014);
  return (
    <div style={{position: 'relative', width: w, height: w * RATIO, borderRadius: `${r * 0.6}px ${r}px ${r}px ${r * 0.6}px`,
      boxShadow: `0 ${w * 0.05}px ${w * 0.09}px rgba(0,0,0,.38), 0 ${w * 0.012}px ${w * 0.02}px rgba(0,0,0,.28)`, ...style}}>
      <div style={{position: 'absolute', inset: 0, borderRadius: 'inherit', overflow: 'hidden'}}>
        <Img src={staticFile(src)} style={{width: '100%', height: '100%', display: 'block'}} />
        <div style={{position: 'absolute', inset: 0, background:
          'linear-gradient(90deg, rgba(0,0,0,.42) 0%, rgba(0,0,0,.12) 0.9%, rgba(255,255,255,.22) 1.6%, rgba(255,255,255,.05) 2.6%, rgba(0,0,0,.30) 3.6%, ' +
          'rgba(0,0,0,.08) 4.6%, rgba(255,255,255,.16) 5.4%, rgba(255,255,255,0) 7.5%)'}} />
        <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(100deg, rgba(255,255,255,.14) 8%, rgba(255,255,255,0) 45%, rgba(0,0,0,0) 80%, rgba(0,0,0,.14) 100%)'}} />
        <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,0) 18%, rgba(0,0,0,0) 85%, rgba(0,0,0,.12))'}} />
        <div style={{position: 'absolute', inset: 0, borderRadius: 'inherit', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.18), inset -1px 0 2px rgba(255,255,255,.18)'}} />
      </div>
    </div>
  );
};

/** A line revealed left to right behind a hard edge. */
const Wipe: React.FC<{start: number; len?: number; children: React.ReactNode}> = ({start, len = 10, children}) => {
  const f = useCurrentFrame();
  return <div style={{clipPath: `inset(-10% ${100 - prog(f, start, len) * 100}% -10% 0)`}}>{children}</div>;
};

const Arrow: React.FC<{start: number; x: number; y: number; h?: number}> = ({start, x, y, h = 90}) => {
  const f = useCurrentFrame();
  const p = lin(f, start, 12);
  const bob = f > start + 14 ? Math.round(Math.sin((f - start) / 5) * 6) : 0;
  return (
    <svg width={60} height={h + 20} style={{position: 'absolute', left: x, top: y + bob}}>
      <path d={`M30,4 L30,${h}`} stroke={RED} strokeWidth={9} strokeLinecap="round" strokeDasharray={h} strokeDashoffset={h * (1 - p)} />
      {p >= 1 && <path d={`M10,${h - 22} L30,${h + 2} L50,${h - 22}`} stroke={RED} strokeWidth={9} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  );
};

/** The jagged line "DEMONETIZED" splits along, its halves parting so the red bar shows through (the owner's pick). */
const JAG = [[0, 52], [9, 44], [19, 57], [31, 46], [42, 60], [55, 45], [67, 58], [79, 47], [90, 55], [100, 49]];
const Crack: React.FC<{text: string; t: number}> = ({text, t}) => {
  const f = useCurrentFrame();
  const c = prog(f, t + 9, 5);
  const line = JAG.map(([x, y]) => `${x}% ${y}%`).join(', ');
  const back = [...JAG].reverse().map(([x, y]) => `${x}% ${y}%`).join(', ');
  const half = (clip: string, dx: number, dy: number) => (
    <span style={{position: 'absolute', left: 0, top: 0, color: CREAM, clipPath: `polygon(${clip})`, transform: `translate(${dx}px, ${dy}px)`}}>{text}</span>
  );
  return (
    <span style={{position: 'relative', display: 'inline-block'}}>
      <span style={{visibility: 'hidden'}}>{text}</span>
      {half(`0% 0%, 100% 0%, ${back}`, -3 * c, -8 * c)}
      {half(`${line}, 100% 100%, 0% 100%`, 3 * c, 7 * c)}
    </span>
  );
};

/** A number counts up to its value as it is spoken (66 on "66"). */
const countUp = (text: string, f: number, t: number) => {
  const m = text.match(/^(\D*)(\d[\d.,]*)(.*)$/);
  if (!m) return text;
  const n = Number(m[2].replace(/[.,]/g, ''));
  return m[1] + Math.round(n * lin(f, t, 9)) + m[3];
};

const Word: React.FC<{w: CtaWord; size: number; color: string; crack?: boolean; count?: boolean}> = ({w, size, color, crack, count}) => {
  const f = useCurrentFrame();
  const e = cubic(lin(f, w.t, RISE));
  const bar = prog(f, w.t + 2, 8) * 100;
  const red = w.red || crack;
  const fs = count ? size * 1.9 : size;  // the offer's number is big, as in the approved version (66 counting up)
  return (
    <span style={{display: 'inline-block', position: 'relative', fontSize: fs, lineHeight: count ? 1 : undefined, marginRight: size * 0.28, whiteSpace: 'nowrap', opacity: e,
      transform: `translateY(${(1 - e) * 0.42}em)`}}>
      {red && <span style={{position: 'absolute', left: -size * 0.14, right: -size * 0.14, top: '8%', bottom: '2%', background: RED, clipPath: `inset(0 ${100 - bar}% 0 0)`, zIndex: -1}} />}
      {crack ? <Crack text={w.text} t={w.t} /> : <span style={{color: red ? CREAM : count ? RED : color}}>{count ? countUp(w.text, f, w.t) : w.text}</span>}
    </span>
  );
};

/** The lines the words are shown in: a clause each (a new line after . , : ; ! ? …), a long clause split evenly in two,
 * and a new line where the link and the way back start. */
const MAX_LINE = 9;
const phrases = (words: CtaWord[], marks: CtaMarks): number[][] => {
  const out: number[][] = [];
  let cur: number[] = [];
  const push = () => {
    if (!cur.length) return;
    if (cur.length > MAX_LINE) {
      const half = Math.ceil(cur.length / 2);
      out.push(cur.slice(0, half), cur.slice(half));
    } else out.push(cur);
    cur = [];
  };
  words.forEach((w, i) => {
    if (i > 0 && (/[.,:;!?…]$/.test(words[i - 1].text) || i === marks.link || i === marks.back)) push();
    cur.push(i);
  });
  push();
  return out;
};

const Caption: React.FC<{idx: number[]; words: CtaWord[]; marks: CtaMarks; size: number; color: string}> = ({idx, words, marks, size, color}) => (
  <div style={{fontWeight: 800, lineHeight: 1.12, textAlign: 'center', maxWidth: 1560, isolation: 'isolate', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'baseline'}}>
    {idx.map((i) => <Word key={i} w={words[i]} size={size} color={color} crack={i === marks.crack} count={/\d/.test(words[i].text) && i >= marks.books} />)}
  </div>
);

/** Under "we don't get a cent": a sum rolls down to $0.00 (its place is kept from the start: the line never jumps). */
const Cents: React.FC<{t: number}> = ({t}) => {
  const f = useCurrentFrame();
  const v = Math.max(0, 4812.37 * (1 - lin(f, t, 14)));
  return <div style={{visibility: f < t ? 'hidden' : 'visible', marginTop: 26, fontWeight: 800, fontSize: 150, color: v === 0 ? RED : CREAM,
    fontVariantNumeric: 'tabular-nums', transform: `scale(${v === 0 ? 1 + 0.12 * (1 - lin(f, t + 14, 5)) : 1})`}}>
    ${v.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>;
};

/** The red band across the bonus book on "free", like a bookshop band. */
const Band: React.FC<{w: number; at: number; text: string}> = ({w, at, text}) => {
  const f = useCurrentFrame();
  const band = prog(f, at, 10) * 100;
  if (band <= 0) return null;
  return <div style={{position: 'absolute', left: 0, right: 0, top: w * RATIO * 0.68, height: w * 0.27, background: RED, clipPath: `inset(0 ${100 - band}% 0 0)`,
    boxShadow: '0 4px 10px rgba(0,0,0,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: CREAM, fontWeight: 800,
    fontSize: w * (text.length > 6 ? 0.125 : 0.17), letterSpacing: 1, whiteSpace: 'nowrap'}}>{text}</div>;
};

/** Pair: the first books rise, the bonus book slides in shortly before "free" and lifts with its band. */
const PairBooks: React.FC<{covers: string[]; books: number; free: number; strings: CtaStrings}> = ({covers, books, free, strings}) => {
  const f = useCurrentFrame();
  const bonus = covers.length >= 3;
  const main = bonus ? covers.slice(0, -1) : covers;
  const W = 390, GAP = 50;
  const aside = bonus ? prog(f, free - 14, 14) : 0;
  const lift = bonus ? prog(f, free - 2, 10) : 0;
  const all = main.length + (bonus ? 1 : 0);
  const left = (n: number) => (1920 - (n * W + (n - 1) * GAP)) / 2;
  return <>{covers.map((c, i) => {
    const isBonus = bonus && i === covers.length - 1;
    const x0 = left(main.length) + i * (W + GAP), x1 = left(all) + i * (W + GAP);
    const x = isBonus ? x1 + (1 - aside) * 900 : x0 + (x1 - x0) * aside;
    const y = isBonus ? 290 - 24 * lift : 290 + (1 - prog(f, books + i * 4, 14)) * 1000;
    return (
      <div key={c} style={{position: 'absolute', left: x, top: y, transform: isBonus ? `scale(${1 + 0.05 * lift})` : undefined}}>
        <Book src={c} w={W} />
        {isBonus && <Band w={W} at={free} text={strings.freeBonus} />}
      </div>
    );
  })}</>;
};

/** One by one: each book alone and big for the same time with its label, then all of them in a row before the link. */
const SoloBooks: React.FC<{covers: string[]; books: number; free: number; link: number; strings: CtaStrings}> = ({covers, books, free, link, strings}) => {
  const f = useCurrentFrame();
  const n = covers.length;
  const bonus = n >= 3;
  const lineUp = link - 8;
  const slot = (lineUp - books) / n;
  const cues = covers.map((_, k) => Math.round(books + k * slot));
  const row = prog(f, lineUp, 12);
  const label = (k: number) => (bonus && k === n - 1 ? strings.bonus : strings.parts[k] ?? '');
  const rowLeft = (1920 - (n * 390 + (n - 1) * 50)) / 2;
  return <>
    {covers.map((c, i) => {
      const inP = prog(f, cues[i] + (i === 0 ? 2 : 0), 12);
      const outP = i < n - 1 ? prog(f, cues[i + 1], 12) : 0;
      const soloX = 420 + (1 - inP) * 1500 - outP * 1500;
      const rowX = rowLeft + i * 440;
      const from = i === n - 1 ? soloX : -1100;
      const x = row > 0 ? from + (rowX - from) * row : soloX;
      const w = 470 - 80 * row;
      return (
        <div key={c} style={{position: 'absolute', left: x, top: 255 + 35 * row}}>
          <Book src={c} w={w} />
          {bonus && i === n - 1 && <Band w={w} at={free} text={strings.free} />}
        </div>
      );
    })}
    {covers.map((_, i) => (f >= cues[i] + 6 && f < (i < n - 1 ? cues[i + 1] : lineUp) ? (
      <div key={i} style={{position: 'absolute', left: 1010, top: 470}}>
        <Wipe start={cues[i] + 6} len={8}><div style={{background: RED, color: CREAM, fontWeight: 800, fontSize: 78, padding: '6px 34px', whiteSpace: 'nowrap'}}>{label(i)}</div></Wipe>
      </div>
    ) : null))}
  </>;
};

/** The whole call to action, from its first word to the way back (frames relative to its Sequence). */
export const CtaOverlay: React.FC<CtaProps> = ({start, words: abs, marks, covers, look, strings}) => {
  const f = useCurrentFrame();
  const words = abs.map((w) => ({...w, t: w.t - start, e: w.e - start}));
  const T = (i: number) => words[Math.min(i, words.length - 1)].t;
  const back = T(marks.back), books = T(marks.books), link = T(marks.link);
  const free = marks.free !== undefined ? T(marks.free) : Math.round((books + link) / 2);
  const veil = lin(f, 0, 5) * 0.74 * (1 - lin(f, back - 2, 6));
  const paperX = 100 - prog(f, books - 2, 14) * 100 - prog(f, back - 4, 14) * 100;
  const all = phrases(words, marks);
  // the clause that names the books moves to the paper whole ("OUR BOOKS ARE HOW YOU KEEP THEM COMING")
  const booksLine = all.findIndex((p) => p.includes(marks.books));
  const story = all.slice(0, booksLine + 1);
  const paper = all.filter((p, k) => k >= booksLine && p[0] < marks.link);
  const current = (list: number[][], until: number) => {
    const k = list.findIndex((p, j) => f >= T(p[0]) - 2 && (j === list.length - 1 ? f < until : f < T(list[j + 1][0]) - 2));
    return k < 0 ? null : list[k];
  };
  const sp = current(story, books + 10);
  const pp = current(paper, link);
  const linkVeil = lin(f, link - 6, 6) * 0.88;
  const descIdx = words.findIndex((w, i) => i >= marks.link && /^descrip/i.test(w.text));  // "description", "descripción"
  const descAt = descIdx >= 0 ? T(descIdx) : link + 12;
  const fill = lin(f, descAt, 30) * 100;
  const pinnedAt = Math.min(back - 20, descAt + 18);
  return (
    <AbsoluteFill style={{...textBase, fontFamily: FONT}}>
      <AbsoluteFill style={{background: `rgba(0,0,0,${veil})`}} />
      {sp && (
        <AbsoluteFill key={sp[0]} style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column', transform: `scale(${1 + (f - T(sp[0])) * 0.0012})`}}>
          <Caption idx={sp} words={words} marks={marks} size={104} color={CREAM} />
          {marks.zero !== undefined && sp.includes(marks.zero) && <Cents t={T(marks.zero)} />}
        </AbsoluteFill>
      )}
      <AbsoluteFill style={{transform: `translateX(${paperX}%)`, background: `url(${staticFile(PAPER)}) center/cover, #ece7d6`, overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 60, height: 190, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
          {pp && <div key={pp[0]}><Caption idx={pp} words={words} marks={marks} size={84} color={INK} /></div>}
        </div>
        <div style={{position: 'absolute', inset: 0, transform: `scale(${1 + Math.max(0, f - books) * 0.0006})`, transformOrigin: '50% 55%'}}>
          {look === 'solo'
            ? <SoloBooks covers={covers} books={books} free={free} link={link} strings={strings} />
            : <PairBooks covers={covers} books={books} free={free} strings={strings} />}
        </div>
        <AbsoluteFill style={{background: `rgba(0,0,0,${linkVeil})`}} />
        {f >= link - 4 && (
          <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column', textAlign: 'center'}}>
            <Wipe start={link - 4} len={8}><div style={{fontWeight: 800, fontSize: 104, color: CREAM, lineHeight: 1.05}}>{strings.linkIn}</div></Wipe>
            <div style={{transform: `scale(${1 + Math.max(0, f - descAt) * 0.0015})`}}><Wipe start={descAt - 3} len={8}>
              <div style={{fontWeight: 800, fontSize: 156, lineHeight: 1.0, padding: '0 8px', backgroundImage: `linear-gradient(90deg, ${RED} ${fill}%, ${CREAM} ${fill}%)`,
                WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', whiteSpace: 'nowrap'}}>{strings.description}</div></Wipe></div>
            <Wipe start={pinnedAt - 4} len={8}><div style={{fontWeight: 600, fontSize: 54, color: CREAM, marginTop: 24}}>{strings.pinned}</div></Wipe>
            <Arrow start={pinnedAt + 2} x={930} y={760} />
          </AbsoluteFill>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** The soft reminder at the end: a small paper card in the lower right over the last shot (no veil): it slides in on
 * "the books", the books rise in it, the pack's name wipes in on its bar, the link line rises word by word, and it
 * slides away after the goodbye. */
export const CtaEndCard: React.FC<CtaEndProps> = ({start, end, covers, pack, strings, cardAt, linkAt}) => {
  const f = useCurrentFrame();
  const inAt = cardAt - start - 4, outAt = end - start - 14;
  const x = (1 - prog(f, inAt, 14) + prog(f, outAt, 14)) * 120;
  const words = strings.linkLine.split(' ');
  const key = words.length - 1;  // "description": the last word, in red
  const l0 = Math.max(inAt + 16, linkAt - start - 6);
  return (
    <AbsoluteFill style={{...textBase, fontFamily: FONT}}>
      <div style={{position: 'absolute', right: 64, bottom: 70, transform: `translateX(${x}%)`, display: 'flex', alignItems: 'center', gap: 30,
        padding: '22px 34px 22px 26px', background: `url(${staticFile(PAPER)}) center/cover, #ece7d6`, boxShadow: '0 14px 34px rgba(0,0,0,.45)', overflow: 'hidden'}}>
        <div style={{display: 'flex', gap: 12}}>
          {covers.map((c, i) => <Book key={c} src={c} w={104} style={{transform: `translateY(${(1 - prog(f, inAt + 8 + i * 4, 12)) * 260}px)`}} />)}
        </div>
        <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
          <Wipe start={inAt + 12} len={10}><div style={{background: RED, color: CREAM, fontWeight: 800, fontSize: 36, padding: '4px 16px', whiteSpace: 'nowrap'}}>{pack}</div></Wipe>
          <div style={{fontWeight: 700, fontSize: 34, color: INK, whiteSpace: 'nowrap'}}>
            {words.map((w, k) => {
              const e = cubic(lin(f, l0 + k * 3, RISE));
              return <span key={k} style={{display: 'inline-block', marginRight: 10, opacity: e, transform: `translateY(${(1 - e) * 0.42}em)`, color: k === key ? RED : INK}}>{w}</span>;
            })}
            <span style={{display: 'inline-block', color: RED, opacity: cubic(lin(f, l0 + words.length * 3 + 2, RISE)),
              transform: `translateY(${(1 - cubic(lin(f, l0 + words.length * 3 + 2, RISE))) * 0.42 + Math.sin(Math.max(0, f - l0 - 20) / 5) * 0.06}em)`}}>↓</span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
