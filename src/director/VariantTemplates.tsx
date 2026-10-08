import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, OffthreadVideo, staticFile, useCurrentFrame} from 'remotion';
import {backgroundZoom, type TemplateTiming} from './templateMotion';
import {CREAM, INK, RED, TEXT_RED, clamp, easeInOut, easeOut, textBase} from './channelStyle';

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
        {/* tape on the two corners farther from the circle */}
        {(x < 35 && y < 35) || (x > 65 && y > 65)
          ? <><Tape style={{right: -40, top: -12}} rotate={28} /><Tape style={{left: -40, bottom: -12}} rotate={28} /></>
          : <><Tape style={{left: -40, top: -12}} rotate={-28} /><Tape style={{right: -40, bottom: -12}} rotate={-28} /></>}
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
export const DocumentMark: React.FC<Bg & {doc: string; aspect: number; box: [number, number, number, number]; marker?: string}> = ({background, backgroundVideo, doc, aspect, box, marker = '#ffe14d', backgroundPosition = '50% 50%', revealShift = 0}) => {
  const clock = useCurrentFrame();
  const f = clock - revealShift;
  const [bx, by, bw, bh] = box;
  const {w, h} = fit(aspect, 1400, 860);
  const card = easeOut(f, 2, 16);
  const travel = easeInOut(f, 10, 48);
  // move in until the marked line is readable: about 60% of the frame wide, or at least 46 px tall for a short line,
  // never wider than the frame (between 1.4x and 7x)
  const lineW = Math.max(1, (bw / 100) * w), lineH = Math.max(1, (bh / 100) * h);
  const target = Math.min(7, (0.92 * 1920) / lineW, Math.max(1.4, (0.6 * 1920) / lineW, 46 / lineH));
  const zoom = 1 + (target - 1) * travel + Math.max(0, clock) * 0.0006;
  const mark = interpolate(f, [46, 68], [0, 1], {...clamp, easing: Easing.inOut(Easing.sin)});
  const ox = bx + bw / 2, oy = by + bh / 2;
  const padX = (bh * h / w) * 0.3; // a little room either side, a third of the line height
  const keep = (want: number, size: number, frame: number, o: number) => {
    // after scaling by `target` about the line (o = its offset inside the card) and translating by t, the card spans
    // [L0 + o - o*target + t, L0 + o + (size - o)*target + t]; keep that span covering the whole frame when it can
    if (size * target <= frame) return want;
    const L0 = (frame - size) / 2;
    const hi = -(L0 + o - o * target), lo = frame - (L0 + o + (size - o) * target);
    return Math.min(hi, Math.max(lo, want));
  };
  const tx = keep((50 - ox) * w / 100, w, 1920, (ox / 100) * w);
  const ty = keep((50 - oy) * h / 100, h, 1080, (oy / 100) * h);
  return <AbsoluteFill style={{overflow: 'hidden', background: '#111'}}>
    <Background src={background} video={backgroundVideo} position={backgroundPosition} frame={clock} filter={`brightness(${1 - 0.5 * card}) saturate(.7) blur(${3 * card}px)`} />
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
      <div style={{position: 'relative', width: w, height: h, opacity: card, boxShadow: '0 22px 50px rgba(0,0,0,.5)',
        // the marked line travels toward the middle while the camera moves in, but the page edge never comes inside the
        // frame once the page is bigger than it (so no background band or empty paper edge in the middle of the shot)
        transform: `translate(${tx * travel}px, ${ty * travel}px) rotate(-.5deg) scale(${zoom})`,
        transformOrigin: `${ox}% ${oy}%`}}>
        <Img src={staticFile(doc)} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'sepia(.15) contrast(1.05)'}} />
        <div style={{position: 'absolute', left: `${bx - padX}%`, top: `${by - bh * 0.15}%`, width: `${bw + 2 * padX}%`, height: `${bh * 1.3}%`, background: marker,
          mixBlendMode: 'multiply', opacity: 0.85, transform: `scaleX(${mark}) rotate(-.3deg)`, transformOrigin: 'left center', borderRadius: '2px 6px 3px 7px'}} />
        {/* the tape goes on the edge away from the marked line, never over it */}
        <div style={{opacity: 1 - travel}}><Tape style={oy < 30 ? {left: w / 2 - 75, bottom: -18} : {left: w / 2 - 75, top: -18}} rotate={2} /></div>
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

// ------------------------------------------------------------------ T15: a quick burst of 3–5 different photos (fixed)

/** Your T15: each photo pushes the previous one up and out with a short motion blur. The first photo is on screen
 * from the first frame (no empty start); every photo is different (the build refuses repeats). */
export const PhotoBurst: React.FC<{photos: string[]; positions?: string[]; durationFrames: number}> = ({photos, positions = [], durationFrames}) => {
  const f = useCurrentFrame();
  const slot = durationFrames / Math.max(1, photos.length);
  const smooth = (from: number, to: number) => interpolate(f, [from, to], [0, 1], {easing: Easing.bezier(0.22, 1, 0.36, 1), ...clamp});
  return <AbsoluteFill style={{overflow: 'hidden', background: '#111'}}>
    {photos.map((src, i) => {
      const start = Math.round(i * slot);
      const next = i + 1 < photos.length ? Math.round((i + 1) * slot) : undefined;
      const enter = i === 0 ? 1 : smooth(start, start + 12);
      const leave = next === undefined ? 0 : smooth(next, next + 12);
      const motion = Math.max(1 - enter, leave);
      if (f < start - 1 || (next !== undefined && f > next + 13)) return null;
      return <Img key={`${src}-${i}`} src={staticFile(src)} style={{position: 'absolute', left: 0, top: (1 - enter) * 1080 - leave * 1080, width: '100%', height: '100%',
        objectFit: 'cover', objectPosition: positions[i] ?? 'center', transform: `scale(${1 + Math.max(0, f - start) * 0.00025 + motion * 0.012})`,
        filter: `grayscale(.55) contrast(1.03) blur(${motion * 4}px)`}} />;
    })}
    <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(90deg,#0001,transparent 30%,transparent 70%,#0001)'}} />
  </AbsoluteFill>;
};
