import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile} from 'remotion';

/**
 * Channel style tokens. One theme for every template (the owner, 2026-10-22): one font (Poppins), one bar colour, one
 * text colour, one cream. The look stays plain (flat colour bars, paper, real photos):
 * the polish is in spacing, easing and consistency, not in effects.
 */
// Accent colours. These defaults are the channel's own; a job can carry a channel theme (applyTheme) that replaces them.
// They are `let` on purpose: every template reads them at render time, so one call re-themes the whole video.
export let RED = '#aa1533'; // bars only (title, name, year bars, comparison bars)
export let TEXT_RED = '#c8130b'; // red text: headings, numbers, emphasised words (brighter, reads on photos)
export let CRIMSON = '#aa1533'; // year tags only
export let TEXT_ON_PAPER = '#c8130b'; // the text colour where it sits on paper or a white print border (see readableOnPaper)
export const DEFAULT_THEME = {bar: '#aa1533', text: '#c8130b'};
export type Look = {aberration?: number; grain?: number; vignette?: number; texture?: number; edgeBlur?: number; post?: boolean};
export type Theme = {bar?: string; text?: string; paper?: string; oneColour?: boolean; look?: Look};
const HEX = /^#[0-9a-fA-F]{6}$/;
const luminance = (hex: string) => {
  const c = [1, 3, 5].map((k) => parseInt(hex.slice(k, k + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
/** A channel colour that can't be read on paper (e.g. yellow: contrast under 3) is darkened, same hue, until it reads
 * well (4.5). Colours that already read (the default red is 4.8) are kept exactly. Photos and dark boxes keep the
 * colour as chosen. */
export const readableOnPaper = (hex: string, paper = '#ece7d6') => {
  if (contrast(hex, paper) >= 3) return hex;
  const rgb = [1, 3, 5].map((k) => parseInt(hex.slice(k, k + 2), 16));
  for (let f = 0.95; f > 0.05; f -= 0.05) {
    const out = '#' + rgb.map((v) => Math.round(v * f).toString(16).padStart(2, '0')).join('');
    if (contrast(out, paper) >= 4.5) return out;
  }
  return '#17150f';
};
let customText: [number, number, number] | null = null;
// Numbers on screen are written the way the narration's language writes them: 3,500 in English, 3.500 in Spanish (a
// comma there is the decimal mark, so 3,500 reads as three and a half). Grouped from 1,000 up in every language.
const THOUSANDS: Record<string, string> = {en: ',', es: '.', de: '.', it: '.', pt: '.', nl: '.', fr: '\u202f'};
let THOUSANDS_MARK = ',';
export const setLanguage = (language?: string | null) => {
  THOUSANDS_MARK = THOUSANDS[(language || 'en').slice(0, 2).toLowerCase()] ?? ',';
};
/** A whole number with the thousands mark of the video's language. */
export const formatNumber = (n: number) => {
  const r = Math.round(n);
  return (r < 0 ? '-' : '') + String(Math.abs(r)).replace(/\B(?=(\d{3})+(?!\d))/g, THOUSANDS_MARK);
};

export const applyTheme = (theme?: Theme | null) => {
  const bar = theme?.bar && HEX.test(theme.bar) ? theme.bar : DEFAULT_THEME.bar;
  const text = theme?.text && HEX.test(theme.text) ? theme.text : DEFAULT_THEME.text;
  RED = bar;
  CRIMSON = bar;
  // one accent: the text colour follows the bar colour (no second shade), darkened only where it must read on paper
  TEXT_RED = theme?.text && HEX.test(theme.text) && theme.text.toLowerCase() !== bar.toLowerCase() && theme.oneColour === false ? text : bar;
  TEXT_ON_PAPER = readableOnPaper(TEXT_RED);
  customText = [1, 3, 5].map((k) => parseInt(TEXT_RED.slice(k, k + 2), 16)) as [number, number, number];
  // the channel's paper (a built-in under templates/papers/ or the job's own uploaded paper.jpg); none = squared paper
  const paper = theme?.paper && /^(templates\/papers\/[a-z]+\.jpg|jobs\/[^/]+\/paper\.jpg)$/.test(theme.paper) ? theme.paper : '';
  PAPER = paper || GRID_PAPER;
  PAPER_CUSTOM = Boolean(paper);
};
/** The paper a template shows: its own squared-paper scan by default, the channel's paper when one is chosen. */
export const paperFor = (own: string) => (PAPER_CUSTOM ? PAPER : own);
/** The squared paper's own look; a chosen paper gets a gentler version (a little less colour and texture, a light veil)
 * so dark text stays readable and every paper sits in the same family. */
export const paperFilter = (own: string) => (PAPER_CUSTOM ? 'saturate(.8) contrast(.86) brightness(1.04)' : own);
export const paperVeil = (own: string) => (PAPER_CUSTOM ? 'rgba(250,247,238,.26)' : own);
/** A template's own highlight shade (e.g. T11's brighter red) unless the channel sets its own text colour. */
export const highlightRGB = (own: [number, number, number]): [number, number, number] => customText ?? own;
export const CREAM = '#fffaf2';
export const INK = '#17150f';
export const FONT = "'Poppins', 'Arial', sans-serif";
// Poppins ships with the renderer (public/fonts, SIL Open Font License); Job.tsx loads it before any frame renders
export const FONT_FILES = [[500, 'Medium'], [600, 'SemiBold'], [700, 'Bold'], [800, 'ExtraBold']] as const;
export const GRID_PAPER = 'templates/clip6/paper-grid.jpg';
export let PAPER = GRID_PAPER;
export let PAPER_CUSTOM = false;

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const easeOut = (frame: number, from: number, to: number) =>
  interpolate(frame, [from, to], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
export const easeInOut = (frame: number, from: number, to: number) =>
  interpolate(frame, [from, to], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});

export const textBase: React.CSSProperties = {fontFamily: FONT, textRendering: 'geometricPrecision', WebkitFontSmoothing: 'antialiased'};

/** Graph-paper ground shared by the paper templates, with the same slow drift every paper template has. */
// Two paper-board templates back to back share one board (the owner, 2026-10-24): Job draws it once under both and
// they leave their own paper out; the first clears its items at its end instead of a cut.
export const SharedBoard = React.createContext(false);

// The "No AI generated content" label sits top left for the first 20 s of every video (Job). A shot that starts in
// those 20 s gets this inset: whatever it would draw in the top-left corner moves down below the label (for the whole
// shot, so nothing jumps when the label goes).
export const NO_AI_BOX = {right: 680, bottom: 128};
export const TopLeftInset = React.createContext(0);
export const useTopLeftInset = () => React.useContext(TopLeftInset);
/** A template's own backdrop colour, transparent while it sits on the shared board. */
export const useBoardBg = (colour: string) => (React.useContext(SharedBoard) ? 'transparent' : colour);

export const PaperGround: React.FC<{frame: number; paper?: string; force?: boolean}> = ({frame, paper, force = false}) => {
  if (React.useContext(SharedBoard) && !force) return null;
  return <AbsoluteFill style={{transform: `scale(${1.02 + Math.max(0, frame) * 0.00012})`}}>
    <Img src={staticFile(paper ?? PAPER)} style={{width: '100%', height: '100%', objectFit: 'cover', filter: paperFilter('brightness(1.09) saturate(.58)')}} />
    <div style={{position: 'absolute', inset: 0, background: paperVeil('rgba(247,243,223,.42)')}} />
  </AbsoluteFill>;
};

// ------------------------------------------------------------------ the two text animations of the references
// Measured frame by frame on the owner's reference videos (2026-10-23). Every template uses these two and nothing
// else, so the motion is the same everywhere:
//  1. TAG: a coloured box (year, keyword, name, place). The box opens one character wide and steps wider for each new
//     character; each character rises from below inside the box (the box hides it until it is in). Words type left to
//     right (a character every 1.7 frames), numbers and years right to left (a digit every 3.5 frames).
//  2. TEXT: plain words (headings, figures' units, sentences, lines). Each letter arrives pale and spread to the right
//     and settles into place over 7 frames; a letter every 2 frames (a long sentence arrives faster).

export const TAG_STEP = 1.7;
export const TAG_STEP_DIGITS = 3.5;
export const TAG_RISE = 3;
export const TEXT_STEP = 2;
export const TEXT_SETTLE = 7;
export const TEXT_SPREAD = 0.3;

const isDigits = (t: string) => /^[\d\s.,:/\-–]+$/.test(t);
/** Frames between two letters of a plain text: 1.7, faster for a long line (a sentence lands in about a second). */
export const textStep = (len: number) => Math.min(TEXT_STEP, 22 / Math.max(1, len));

/** The characters inside a tag box (the box is their parent; it must hide what overflows). */
export const TagLetters: React.FC<{text: string; frame: number; start: number; rtl?: boolean; step?: number}> = ({text, frame, start, rtl, step}) => {
  const back = rtl ?? isDigits(text);
  const st = step ?? (isDigits(text) ? TAG_STEP_DIGITS : TAG_STEP);
  const chars = [...text];
  return <>{chars.map((c, i) => {
    const s = start + (back ? chars.length - 1 - i : i) * st;
    if (frame < s) return null;
    const p = Math.min(1, (frame - s) / TAG_RISE), e = 1 - (1 - p) * (1 - p);
    return <span key={i} style={{display: 'inline-block', transform: e < 1 ? `translateY(${((1 - e) * 100).toFixed(1)}%)` : undefined}}>{c === ' ' ? '\u00a0' : c}</span>;
  })}</>;
};

/** When the last character of a tag is in. */
export const tagDone = (text: string, start: number, step?: number) => start + ([...text].length - 1) * (step ?? (isDigits(text) ? TAG_STEP_DIGITS : TAG_STEP)) + TAG_RISE;

/**
 * A tag (animation 1). With `reserve` its final width is kept from the start (rows and centred layouts never move)
 * and the box grows from its `anchor` side; years grow from the right.
 */
export const TagBox: React.FC<{text: string; frame: number; start: number; size?: number; color?: string; textColor?: string; weight?: number;
  rtl?: boolean; step?: number; reserve?: boolean; anchor?: 'left' | 'right'; opacity?: number; style?: React.CSSProperties}> = ({text, frame, start, size = 56,
  color = RED, textColor = CREAM, weight = 600, rtl, step, reserve = true, anchor, opacity = 1, style}) => {
  const box: React.CSSProperties = {display: 'inline-block', background: color, color: textColor, borderRadius: Math.round(size * 0.16),
    padding: `${Math.round(size * 0.2)}px ${Math.round(size * 0.5)}px`, overflow: 'hidden', whiteSpace: 'pre', verticalAlign: 'top',
    ...textBase, fontWeight: weight, fontSize: size, lineHeight: 1.15, boxShadow: '0 6px 16px rgba(0,0,0,.35)', ...style};
  const back = rtl ?? isDigits(text);
  const side = anchor ?? (back ? 'right' : 'left');
  const on = frame >= start;
  const letters = <TagLetters text={text} frame={frame} start={start} rtl={back} step={step} />;
  if (!reserve) return on ? <div style={{...box, opacity}}>{letters}</div> : null;
  return <div style={{position: 'relative', display: 'inline-block', verticalAlign: 'top'}}>
    <div style={{...box, visibility: 'hidden', boxShadow: 'none'}}>{text}</div>
    {on ? <div style={{...box, position: 'absolute', top: 0, [side]: 0, opacity}}>{letters}</div> : null}
  </div>;
};

/**
 * Flat colour bar of the older templates, now the TAG animation (the bar grows with its letters, each rising in).
 * 'rtl' grows from the right edge and reveals the last character first.
 */
export const WipeBar: React.FC<{
  text: string; frame: number; start: number; color?: string; fontSize?: number; height?: number;
  padding?: number; letterSpacing?: number; radius?: number; spread?: number; style?: React.CSSProperties;
  direction?: 'ltr' | 'rtl';
  openFrames?: number; riseFrames?: number;
}> = ({text, frame, start, color = RED, fontSize = 72, height = 115, padding = 32, letterSpacing = 2, radius = 6, style, direction = 'ltr'}) => {
  if (frame < start) return null;
  return <div style={{display: 'inline-flex', alignItems: 'center', height, padding: `0 ${padding}px`, boxSizing: 'border-box',
    background: color, color: CREAM, borderRadius: radius, overflow: 'hidden', whiteSpace: 'pre', ...textBase, fontWeight: 600, fontSize, letterSpacing, lineHeight: 1, ...style}}>
    <TagLetters text={text} frame={frame} start={start} rtl={direction === 'rtl'} />
  </div>;
};

/** One letter of animation 2, started at frame s. */
export const revealChar = (frame: number, s: number): React.CSSProperties => {
  const p = Math.max(0, Math.min(1, (frame - s) / TEXT_SETTLE)), e = 1 - (1 - p) ** 3;
  return {display: 'inline-block', opacity: p <= 0 ? 0 : Math.min(1, 0.1 + p * 1.1), transform: e < 1 ? `translateX(${((1 - e) * TEXT_SPREAD).toFixed(3)}em)` : undefined};
};

/** A plain text in animation 2. `marks` turn ranges of letters to a colour, letter by letter, from their frame. */
export const RevealText: React.FC<{text: string; frame: number; start: number; step?: number; marks?: {from: number; to: number; at: number; color: string}[]}> = ({text, frame, start, step, marks = []}) => {
  const st = step ?? textStep(text.length);
  let n = 0;
  return <>{text.split(/(\s+)/).map((w, i) => {
    if (/^\s+$/.test(w) || !w) { n += w.length; return w; }
    const first = n; n += w.length;
    return <span key={i} style={{display: 'inline-block', whiteSpace: 'pre'}}>{[...w].map((c, k) => {
      const idx = first + k;
      const m = marks.find((x) => idx >= x.from && idx < x.to);
      const lit = m ? Math.max(0, Math.min(1, (frame - m.at - (idx - m.from) * 1.4) / 8)) : 0; // a calm left-to-right fill
      return <span key={k} style={{...revealChar(frame, start + idx * st),
        color: m && lit > 0 ? (lit >= 1 ? m.color : `color-mix(in srgb, ${m.color} ${Math.round(lit * 100)}%, currentColor)`) : undefined}}>{c}</span>;
    })}</span>;
  })}</>;
};
/** When the last letter of a plain text has settled. */
export const textDone = (text: string, start: number, step?: number) => start + text.length * (step ?? textStep(text.length)) + TEXT_SETTLE;

/** A copy line in animation 2; the emphasised words then turn to the channel colour. */
export const RiseWords: React.FC<{text: string; frame: number; start: number; gap?: number; color?: string; emphasis?: string; emphasisColor?: string}> = ({text, frame, start, color = 'inherit', emphasis, emphasisColor = TEXT_RED}) => {
  const emph = new Set((emphasis ?? '').split(' ').filter(Boolean));
  const marks: {from: number; to: number; at: number; color: string}[] = [];
  const done = textDone(text, start);
  let n = 0;
  text.split(' ').forEach((w) => { if (emph.has(w)) marks.push({from: n, to: n + w.length, at: done, color: emphasisColor}); n += w.length + 1; });
  return <span style={{color}}><RevealText text={text} frame={frame} start={start} marks={marks} /></span>;
};

// ------------------------------------------------------------------ text width
// advance widths of Poppins (per 1 em), printable ASCII from space (32) to ~ (126), measured from the font files
const ADV: Record<number, number[]> = {
  500: [260,321,323,872,650,794,761,172,492,492,504,714,225,585,241,514,641,350,577,594,647,639,642,560,638,635,245,304,612,774,590,538,1025,697,630,773,709,524,515,773,705,264,564,633,444,882,721,784,595,787,632,604,564,690,694,999,660,605,558,485,717,484,654,798,254,678,678,600,678,617,332,678,649,264,264,554,264,1039,649,638,678,678,384,534,372,649,576,825,499,582,471,516,324,516,553],
  600: [238,354,364,887,654,829,778,195,485,485,518,674,254,583,260,486,646,362,574,599,661,644,640,548,643,626,263,324,584,738,567,538,1051,716,643,768,717,532,530,768,717,278,570,663,459,899,735,785,608,787,641,609,577,697,711,1024,686,636,576,497,756,496,680,790,271,678,678,602,678,617,345,678,661,278,278,584,278,1048,661,638,678,678,404,545,388,661,599,844,540,605,483,508,309,508,592],
  700: [212,392,411,904,658,870,798,221,477,477,534,628,287,580,282,453,652,376,571,605,677,650,637,535,648,615,284,347,551,696,541,538,1080,737,659,762,727,541,547,762,731,295,578,697,477,918,752,786,624,788,652,615,591,705,730,1052,715,671,596,510,802,510,709,780,291,679,679,605,679,616,360,679,674,295,294,618,295,1059,674,637,679,679,428,558,406,674,626,866,588,632,496,499,291,499,636],
  800: [191,423,451,919,661,904,814,243,470,470,548,589,314,578,301,426,657,387,569,610,691,655,635,523,653,606,302,366,524,661,519,538,1104,755,671,758,735,548,561,757,743,308,584,726,491,935,765,787,636,788,661,620,604,712,747,1076,739,701,613,522,840,521,733,772,307,680,680,607,680,616,373,680,686,308,307,647,308,1067,686,636,680,680,447,568,421,686,649,885,628,655,507,492,277,492,674],
};
/** The width in pixels of a line of Poppins at this size and weight (letterSpacing in px per character): layouts use
 *  it to keep arrows, pins and other text clear of the words. */
export const textWidth = (text: string, size: number, weight: 500 | 600 | 700 | 800 = 600, letterSpacing = 0) => {
  const t = ADV[weight];
  let w = 0;
  for (const c of text) { const k = c.charCodeAt(0); w += (k >= 32 && k <= 126 ? t[k - 32] : 620) / 1000 * size + letterSpacing; }
  return w;
};
