import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, OffthreadVideo, staticFile, useCurrentFrame} from 'remotion';
import {backgroundZoom, type TemplateTiming} from './templateMotion';
import {CREAM, INK, PaperGround, RED, TEXT_RED, clamp, easeInOut, easeOut, textBase} from './channelStyle';

/**
 * Second designs for the most used jobs (statement, number, sentence, place) and two new kinds (map, document).
 * Same plain, hand-made look as the channel's own templates: real photos or film, graph paper, a bit of tape, Arial,
 * the channel colour. Key words are marked with *stars* in the text. Map circles and document highlights are placed
 * by the build from the words printed on the image (OCR), never guessed.
 */

const stars = (text: string) => text.split(/(\*[^*]+\*)/).filter(Boolean).map((part) =>
  part.startsWith('*') ? {text: part.slice(1, -1), key: true} : {text: part, key: false});

/** Photo (slow push-in) or film clip behind a template. */
export const Background: React.FC<{src: string; video?: string; position?: string; frame: number; filter?: string}> = ({src, video, position = '50% 50%', frame, filter}) => (
  video
    ? <OffthreadVideo muted src={staticFile(video)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter}} />
    : <Img src={staticFile(src)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: position,
      transform: `scale(${backgroundZoom(frame)})`, transformOrigin: position, filter}} />
);

/** Text whose colour fills with the channel colour from left to right as p goes 0 -> 1 (soft edge). */
export const sweep = (p: number, base: string): React.CSSProperties => ({
  backgroundImage: `linear-gradient(90deg, ${TEXT_RED} ${p * 100}%, ${base} ${p * 100}%)`, // hard edge, like a marker
  WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', WebkitTextFillColor: 'transparent',
});

/** Key words (in *stars*) turn the channel colour one after another, left to right, from frame `start`. */
const SweepKeys: React.FC<{text: string; frame: number; start: number; base: string}> = ({text, frame, start, base}) => {
  let k = 0;
  return <>{stars(text).map((seg, i) => {
    if (!seg.key) return <span key={i}>{seg.text}</span>;
    const s0 = start + 46 * k++;
    return <span key={i} style={sweep(interpolate(frame, [s0, s0 + 44], [0, 1], clamp), base)}>{seg.text}</span>;
  })}</>;
};

/** Letters popping up one after another behind a mask, like the T1 / T3 tags (quick, not eased). */
const PopLetters: React.FC<{text: string; frame: number; start: number; perLetter?: number; keyColor?: string}> = ({text, frame, start, perLetter = 0.9, keyColor = TEXT_RED}) => {
  let n = 0;
  return <>{stars(text).flatMap((seg, si) => seg.text.split(/(\s+)/).filter(Boolean).map((word, wi) => {
    if (/^\s+$/.test(word)) {
      n += 1;
      return <span key={`${si}-${wi}`}> </span>;
    }
    return <span key={`${si}-${wi}`} style={{display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom', whiteSpace: 'nowrap'}}>
      {[...word].map((ch, ci) => {
        const s = start + perLetter * n++;
        const y = interpolate(frame, [s, s + 3], [110, 0], clamp);
        return <span key={ci} style={{display: 'inline-block', transform: `translateY(${y}%)`, opacity: frame >= s ? 1 : 0, color: seg.key ? keyColor : 'inherit'}}>{ch}</span>;
      })}
    </span>;
  }))}</>;
};

/** A strip of paper tape (torn ends). */
const Tape: React.FC<{style: React.CSSProperties; rotate: number; width?: number}> = ({style, rotate, width = 150}) => (
  <div style={{position: 'absolute', width, height: 40, background: 'rgba(238,229,203,.86)', boxShadow: '0 1px 3px rgba(0,0,0,.18)',
    transform: `rotate(${rotate}deg)`, clipPath: 'polygon(2% 8%, 6% 0, 10% 9%, 15% 1%, 20% 8%, 80% 4%, 86% 0, 91% 9%, 96% 2%, 100% 10%, 98% 92%, 93% 100%, 88% 90%, 83% 99%, 78% 92%, 22% 96%, 16% 90%, 11% 100%, 5% 91%, 0 98%)', ...style}} />
);

/** Fit a picture of the given aspect ratio inside a box. */
const fit = (aspect: number, maxW: number, maxH: number) => (aspect >= maxW / maxH ? {w: maxW, h: maxW / aspect} : {w: maxH * aspect, h: maxH});

type Bg = {background: string; backgroundVideo?: string} & TemplateTiming;

// ------------------------------------------------------------------ T22b: plain statement, letters pop in, key words swept red

export const StatementPaper: React.FC<Bg & {statement: string}> = ({background, backgroundVideo, statement, backgroundPosition = '50% 50%', revealShift = 0}) => {
  const clock = useCurrentFrame();
  const f = clock - revealShift;
  const shade = easeOut(f, 0, 16);
  const letters = statement.replace(/\*/g, '').length;
  const done = 18 + letters * 0.9 + 6;
  return <AbsoluteFill style={{overflow: 'hidden', background: '#111'}}>
    <Background src={background} video={backgroundVideo} position={backgroundPosition} frame={clock} filter={`brightness(${1 - 0.45 * shade}) saturate(.8)`} />
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', padding: '0 170px'}}>
      <div style={{maxWidth: 1580, textAlign: 'center', ...textBase, fontWeight: 700, fontSize: 88, lineHeight: 1.12, letterSpacing: -1.2, color: '#fff9ed',
        filter: 'drop-shadow(0 4px 12px rgba(0,0,0,.55))'}}>
        {f < done ? <PopLetters text={statement} frame={f} start={18} keyColor="#fff9ed" /> : <SweepKeys text={statement} frame={f} start={done} base="#fff9ed" />}
      </div>
    </AbsoluteFill>
  </AbsoluteFill>;
};

// ------------------------------------------------------------------ T14b: number on paper next to a taped photo

export const NumberCard: React.FC<{photo: string; photoPosition?: string; percent: number; prefix?: string; suffix?: string; copy: string; revealShift?: number}> = ({photo, photoPosition = '50% 50%', percent, prefix = '', suffix = '', copy, revealShift = 0}) => {
  const clock = useCurrentFrame();
  const f = clock - revealShift;
  const card = easeOut(f, 0, 16);
  const num = easeOut(f, 12, 26);
  const copyIn = easeOut(f, 22, 36);
  return <AbsoluteFill style={{overflow: 'hidden'}}>
    <PaperGround frame={clock} />
    <div style={{position: 'absolute', left: 200, top: 220, width: 560, height: 640, background: '#fbf8ef', padding: '24px 24px 84px', boxSizing: 'border-box',
      boxShadow: '0 16px 36px rgba(0,0,0,.26)', opacity: card, transform: `translateY(${(1 - card) * 40}px)`}}>
      <div style={{width: '100%', height: '100%', overflow: 'hidden', background: '#222'}}>
        <Img src={staticFile(photo)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: photoPosition, filter: 'saturate(.85)'}} />
      </div>
      <Tape style={{left: 200, top: -20}} rotate={-2} width={160} />
    </div>
    <div style={{position: 'absolute', left: 870, right: 120, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
      <div style={{...textBase, color: '#151515', fontWeight: 700, fontSize: 124, lineHeight: 1, letterSpacing: -3, opacity: num, transform: `translateY(${(1 - num) * 12}px)`}}>
        <SweepKeys text={`*${prefix}${Math.round(percent).toLocaleString('en-US')}${suffix}*`} frame={f} start={30} base="#151515" />
      </div>
      <div style={{marginTop: 22, ...textBase, color: '#151515', fontWeight: 700, fontSize: 54, lineHeight: 1.16, letterSpacing: -0.5,
        opacity: copyIn, transform: `translateY(${(1 - copyIn) * 10}px)`}}>
        <SweepKeys text={copy} frame={f} start={80} base="#151515" />
      </div>
    </div>
  </AbsoluteFill>;
};

// ------------------------------------------------------------------ T11b: sentence over a photo or film, key words marked

const Marked: React.FC<{text: string; p: number}> = ({text, p}) => (
  <span style={{position: 'relative', display: 'inline-block'}}>
    <span style={{position: 'absolute', left: -10, right: -10, top: '8%', bottom: '2%', background: RED, opacity: 0.92, borderRadius: '3px 8px 5px 9px',
      transform: `scaleX(${p}) rotate(-1deg)`, transformOrigin: 'left center'}} />
    <span style={{position: 'relative'}}>{text}</span>
  </span>
);

export const SentenceMarker: React.FC<Bg & {sentence: string}> = ({background, backgroundVideo, sentence, backgroundPosition = '50% 50%', revealShift = 0}) => {
  const clock = useCurrentFrame();
  const f = clock - revealShift;
  const shade = easeOut(f, 0, 14);
  const textIn = easeOut(f, 6, 20);
  let k = 0;
  return <AbsoluteFill style={{overflow: 'hidden', background: '#111'}}>
    <Background src={background} video={backgroundVideo} position={backgroundPosition} frame={clock} filter={`brightness(${1 - 0.5 * shade}) saturate(.75)`} />
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', padding: '0 200px'}}>
      <div style={{maxWidth: 1460, textAlign: 'center', ...textBase, color: '#fffaf0', fontWeight: 700, fontSize: 76, lineHeight: 1.32, letterSpacing: -0.7,
        textShadow: '0 3px 14px rgba(0,0,0,.45)', opacity: textIn, transform: `translateY(${(1 - textIn) * 12}px)`}}>
        {stars(sentence).map((seg, i) => {
          if (!seg.key) return <span key={i}>{seg.text}</span>;
          const s = 26 + 18 * k++;
          return <Marked key={i} text={seg.text} p={interpolate(f, [s, s + 20], [0, 1], {...clamp, easing: Easing.inOut(Easing.sin)})} />;
        })}
      </div>
    </AbsoluteFill>
  </AbsoluteFill>;
};

// ------------------------------------------------------------------ T1b: place + year as a caption label (not reviewed yet)

export const PlaceCaption: React.FC<Bg & {place: string; year?: string}> = ({background, backgroundVideo, place, year = '', backgroundPosition = '50% 50%', revealShift = 0}) => {
  const clock = useCurrentFrame();
  const f = clock - revealShift;
  const strip = easeInOut(f, 8, 22);
  const text = easeOut(f, 16, 28);
  const tag = easeOut(f, 24, 34);
  return <AbsoluteFill style={{overflow: 'hidden', background: '#111'}}>
    <Background src={background} video={backgroundVideo} position={backgroundPosition} frame={clock} filter="saturate(.88)" />
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 360, background: 'linear-gradient(transparent, rgba(0,0,0,.45))'}} />
    <div style={{position: 'absolute', left: 120, bottom: 130, transform: 'rotate(-0.8deg)', transformOrigin: 'left bottom'}}>
      {year ? <div style={{display: 'inline-block', marginBottom: 12, marginLeft: 4, background: RED, color: CREAM, ...textBase, fontWeight: 700, fontSize: 36,
        padding: '8px 16px', borderRadius: 3, opacity: tag, transform: `translateY(${(1 - tag) * 12}px)`}}>{year}</div> : null}
      <div style={{background: '#f6f0de', padding: '20px 34px 18px', boxShadow: '0 10px 26px rgba(0,0,0,.35)', clipPath: `inset(0 ${(1 - strip) * 100}% 0 0)`}}>
        <span style={{...textBase, color: INK, fontWeight: 700, fontSize: 58, letterSpacing: 3, textTransform: 'uppercase', opacity: text}}>{place}</span>
      </div>
    </div>
  </AbsoluteFill>;
};

// ------------------------------------------------------------------ T26: map over a photo or film, place circled by hand

/** A wobbly circle, like a marker pen: a bit more than one turn, never quite round. */
const handCircle = (cx: number, cy: number, rx: number, ry: number) => {
  const pts: string[] = [];
  for (let i = 0; i <= 64; i++) {
    const a = -Math.PI / 2.4 + (i / 64) * Math.PI * 2.18;
    const wobble = 1 + 0.05 * Math.sin(a * 3 + 1) + 0.03 * Math.sin(a * 7) + 0.07 * (i / 64);
    pts.push(`${(cx + Math.cos(a) * rx * wobble).toFixed(1)},${(cy + Math.sin(a) * ry * wobble).toFixed(1)}`);
  }
  return `M${pts.join(' L')}`;
};

/** `box` = where the place name is printed on the map, in percent [left, top, width, height] (found by OCR). */
export const MapCircle: React.FC<Bg & {map: string; aspect: number; box: [number, number, number, number]; label?: string}> = ({background, backgroundVideo, map, aspect, box, label = '', backgroundPosition = '50% 50%', revealShift = 0}) => {
  const clock = useCurrentFrame();
  const f = clock - revealShift;
  const {w, h} = fit(aspect, 1380, 800);
  const card = easeOut(f, 2, 16);
  const draw = interpolate(f, [22, 46], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const label01 = easeOut(f, 42, 54);
  const [bx, by, bw, bh] = box;
  const x = bx + bw / 2, y = by + bh / 2;
  const cx = (x / 100) * w, cy = (y / 100) * h;
  const rx = Math.max(46, (bw / 100) * w * 0.62 + 22), ry = Math.max(36, (bh / 100) * h * 0.62 + 26);
  const push = 1 + Math.max(0, clock) * 0.0004;
  const right = x < 62; // label on the side with more room
  return <AbsoluteFill style={{overflow: 'hidden', background: '#111'}}>
    <Background src={background} video={backgroundVideo} position={backgroundPosition} frame={clock} filter={`brightness(${1 - 0.48 * card}) saturate(.7) blur(${3 * card}px)`} />
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
      <div style={{position: 'relative', width: w, height: h, opacity: card, boxShadow: '0 22px 50px rgba(0,0,0,.5)',
        transform: `translateY(${(1 - card) * 34}px) rotate(.6deg) scale(${push})`, transformOrigin: `${x}% ${y}%`}}>
        <Img src={staticFile(map)} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(.88) sepia(.1)'}} />
        <Tape style={{left: -40, top: -12}} rotate={-28} />
        <Tape style={{right: -40, bottom: -12}} rotate={-28} />
        <svg width={w} height={h} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
          <path d={handCircle(cx, cy, rx, ry)} fill="none" stroke={RED} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round"
            pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} style={{filter: 'drop-shadow(0 1px 1px rgba(0,0,0,.25))'}} />
        </svg>
        {label ? <div style={{position: 'absolute', top: cy - 30, ...(right ? {left: cx + rx + 26} : {right: w - cx + rx + 26}),
          background: RED, color: CREAM, ...textBase, fontWeight: 700, fontSize: 38, padding: '8px 18px', borderRadius: 3, whiteSpace: 'nowrap',
          opacity: label01, transform: `translateY(${(1 - label01) * 10}px)`, boxShadow: '0 6px 14px rgba(0,0,0,.25)'}}>{label}</div> : null}
      </div>
    </AbsoluteFill>
  </AbsoluteFill>;
};

// ------------------------------------------------------------------ T27: document over a photo or film, one line highlighted

/** `box` = the line to highlight, in percent [left, top, width, height] of the page (found by OCR). */
export const DocumentMark: React.FC<Bg & {doc: string; aspect: number; box: [number, number, number, number]}> = ({background, backgroundVideo, doc, aspect, box, backgroundPosition = '50% 50%', revealShift = 0}) => {
  const clock = useCurrentFrame();
  const f = clock - revealShift;
  const [bx, by, bw, bh] = box;
  const {w, h} = fit(aspect, 1400, 860);
  const card = easeOut(f, 2, 16);
  const travel = easeInOut(f, 10, 48);
  // move in until the marked line fills about 60% of the frame width (between 1.4x and 4x), so it can be read
  const target = Math.min(4, Math.max(1.4, (0.6 * 1920) / Math.max(1, (bw / 100) * w)));
  const zoom = 1 + (target - 1) * travel + Math.max(0, clock) * 0.0006;
  const mark = interpolate(f, [46, 68], [0, 1], {...clamp, easing: Easing.inOut(Easing.sin)});
  const ox = bx + bw / 2, oy = by + bh / 2;
  const padX = (bh * h / w) * 0.3; // a little room either side, a third of the line height
  return <AbsoluteFill style={{overflow: 'hidden', background: '#111'}}>
    <Background src={background} video={backgroundVideo} position={backgroundPosition} frame={clock} filter={`brightness(${1 - 0.5 * card}) saturate(.7) blur(${3 * card}px)`} />
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
      <div style={{position: 'relative', width: w, height: h, opacity: card, boxShadow: '0 22px 50px rgba(0,0,0,.5)',
        // the marked line travels to the middle of the frame while the camera moves in on it
        transform: `translate(${(50 - ox) * w / 100 * travel}px, ${(50 - oy) * h / 100 * travel}px) rotate(-.5deg) scale(${zoom})`,
        transformOrigin: `${ox}% ${oy}%`}}>
        <Img src={staticFile(doc)} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'sepia(.15) contrast(1.05)'}} />
        <div style={{position: 'absolute', left: `${bx - padX}%`, top: `${by - bh * 0.15}%`, width: `${bw + 2 * padX}%`, height: `${bh * 1.3}%`, background: '#ffe14d',
          mixBlendMode: 'multiply', opacity: 0.85, transform: `scaleX(${mark}) rotate(-.3deg)`, transformOrigin: 'left center', borderRadius: '2px 6px 3px 7px'}} />
        <Tape style={{left: w / 2 - 75, top: -18}} rotate={2} />
      </div>
    </AbsoluteFill>
  </AbsoluteFill>;
};

// ------------------------------------------------------------------ the same place, then and now (not reviewed yet)

export const ThenNow: React.FC<{before: string; after: string; yearBefore: string; yearAfter: string; beforePosition?: string; afterPosition?: string; revealShift?: number}> = ({before, after, yearBefore, yearAfter, beforePosition = '50% 50%', afterPosition = '50% 50%', revealShift = 0}) => {
  const clock = useCurrentFrame();
  const f = clock - revealShift;
  const split = 100 - 50 * interpolate(f, [34, 62], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const tagA = easeOut(f, 8, 18);
  const tagB = easeOut(f, 56, 66);
  const tag = (text: string, p: number, side: 'left' | 'right') => <div style={{position: 'absolute', top: 70, [side]: 80, background: RED, color: CREAM,
    ...textBase, fontWeight: 700, fontSize: 44, padding: '10px 20px', borderRadius: 3, opacity: p, transform: `translateY(${(1 - p) * 12}px)`,
    boxShadow: '0 6px 16px rgba(0,0,0,.3)'}}>{text}</div>;
  return <AbsoluteFill style={{overflow: 'hidden', background: '#111'}}>
    <Background src={before} position={beforePosition} frame={clock} filter="saturate(.75)" />
    <div style={{position: 'absolute', inset: 0, clipPath: `inset(0 0 0 ${split}%)`}}>
      <Background src={after} position={afterPosition} frame={clock} />
    </div>
    <div style={{position: 'absolute', top: 0, bottom: 0, left: `${split}%`, width: 6, marginLeft: -3, background: CREAM, boxShadow: '0 0 12px rgba(0,0,0,.4)',
      opacity: split < 99.5 ? 1 : 0}} />
    {tag(yearBefore, tagA, 'left')}
    {tag(yearAfter, tagB, 'right')}
  </AbsoluteFill>;
};
