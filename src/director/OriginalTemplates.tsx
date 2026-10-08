import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Background} from './VariantTemplates';
import {CREAM, PaperGround, TEXT_RED, clamp} from './channelStyle';

/**
 * The owner's approved reference templates 4, 12, 13, 17 and 20, rebuilt for any picture: every card takes the
 * picture's own shape (nothing cropped), motion as in the reference clips (slides with a short motion blur, hard cuts).
 */

const slideIn = (frame: number, from: number, frames = 10) =>
  interpolate(frame, [from, from + frames], [0, 1], {easing: Easing.bezier(0.22, 0.78, 0.27, 1), ...clamp});

/** Fit a picture of the given aspect ratio inside a box. */
const fit = (aspect: number, maxW: number, maxH: number) => (aspect >= maxW / maxH ? {w: maxW, h: maxW / aspect} : {w: maxH * aspect, h: maxH});

// ------------------------------------------------------------------ T4: photos pass through one print on graph paper

export const PaperPrints: React.FC<{photos: string[]; positions?: string[]; durationFrames: number; revealShift?: number}> = ({photos, positions = [], durationFrames, revealShift = 0}) => {
  const frame = useCurrentFrame() - revealShift;
  const first = 8;
  const slot = Math.max(20, (durationFrames - first) / Math.max(1, photos.length));
  const shown = slideIn(frame, first);
  return <AbsoluteFill style={{overflow: 'hidden'}}>
    <PaperGround frame={0} />
    {/* the print window: nothing (no empty box) until the first photo arrives */}
    <div style={{position: 'absolute', left: 150, top: 88, width: 1620, height: 900, overflow: 'hidden', boxShadow: `0 13px 24px rgba(28,25,17,${0.24 * shown})`}}>
      {photos.map((src, i) => {
        const start = Math.round(first + i * slot);
        const next = i + 1 < photos.length ? Math.round(first + (i + 1) * slot) : undefined;
        const enter = slideIn(frame, start);
        const leave = next === undefined ? 0 : slideIn(frame, next);
        const moving = Math.max(1 - enter, leave);
        if (enter <= 0 || leave >= 1) return null;
        return <Img key={`${src}-${i}`} src={staticFile(src)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
          objectPosition: positions[i] ?? 'center', transform: `translateY(${(1 - enter) * 100 - leave * 100}%) scale(${1 + moving * 0.008})`,
          filter: `sepia(.12) contrast(.97) blur(${moving * 7}px)`}} />;
      })}
    </div>
    <div style={{position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(90deg,rgba(46,42,31,.10),transparent 23%,transparent 74%,rgba(46,42,31,.10))', mixBlendMode: 'multiply'}} />
  </AbsoluteFill>;
};

// ------------------------------------------------------------------ T12: two documents side by side on graph paper

const PaperCard: React.FC<{src: string; aspect: number; cx: number; cy: number; maxW: number; maxH: number; p: number; from?: 'below' | 'left' | 'right'}> = ({src, aspect, cx, cy, maxW, maxH, p, from = 'below'}) => {
  const {w, h} = fit(aspect, maxW, maxH);
  const off = (1 - p) * 140;
  const move = from === 'below' ? `translateY(${off}px)` : `translateX(${from === 'left' ? -off : off}px)`;
  return <div style={{position: 'absolute', left: cx - w / 2, top: cy - h / 2, width: w, height: h, opacity: Math.min(1, p * 3), transform: move,
    boxShadow: '0 17px 28px rgba(0,0,0,.27)', background: '#e5d5ae'}}>
    <Img src={staticFile(src)} style={{display: 'block', width: '100%', height: '100%', objectFit: 'cover', filter: `blur(${(1 - p) * 8}px)`}} />
  </div>;
};

export const DocumentPair: React.FC<{first: string; second: string; aspectA: number; aspectB: number; revealShift?: number}> = ({first, second, aspectA, aspectB, revealShift = 0}) => {
  const f = useCurrentFrame() - revealShift;
  return <AbsoluteFill style={{overflow: 'hidden'}}>
    <PaperGround frame={0} />
    <PaperCard src={first} aspect={aspectA} cx={570} cy={560} maxW={760} maxH={920} p={slideIn(f, 7, 12)} />
    <PaperCard src={second} aspect={aspectB} cx={1400} cy={560} maxW={760} maxH={920} p={slideIn(f, 25, 12)} />
  </AbsoluteFill>;
};

// ------------------------------------------------------------------ T13: a document card over a scene (photo or film)

export const SourceCard: React.FC<{background: string; backgroundVideo?: string; backgroundPosition?: string; doc: string; aspect: number; revealShift?: number}> = ({background, backgroundVideo, backgroundPosition = '50% 50%', doc, aspect, revealShift = 0}) => {
  const clock = useCurrentFrame();
  const f = clock - revealShift;
  const p = interpolate(f, [14, 34], [0, 1], {easing: Easing.bezier(0.22, 0.78, 0.27, 1), ...clamp});
  const {w, h} = fit(aspect, 512, 735); // the card's size in the reference (570 x 804 with its border)
  return <AbsoluteFill style={{overflow: 'hidden', background: '#12100c'}}>
    <Background src={background} video={backgroundVideo} position={backgroundPosition} frame={clock} filter="contrast(.96) saturate(.84)" />
    <div style={{position: 'absolute', inset: 0, background: 'rgba(27,19,7,.15)'}} />
    <div style={{position: 'absolute', left: 960 - w / 2 - 29, top: 540 - h / 2 - 22, width: w + 58, height: h + 72, padding: '29px 29px 43px', boxSizing: 'border-box',
      background: '#eee8d8', boxShadow: '0 18px 35px rgba(0,0,0,.55)', opacity: Math.min(1, p * 3), transform: `translateY(${(1 - p) * 250}px) scale(${0.82 + 0.18 * p})`,
      transformOrigin: '50% 100%'}}>
      <Img src={staticFile(doc)} style={{display: 'block', width: '100%', height: '100%', objectFit: 'cover', filter: `blur(${(1 - p) * 10}px) contrast(.95)`}} />
    </div>
  </AbsoluteFill>;
};

// ------------------------------------------------------------------ T17: two maps on graph paper with a caption

export const MapPair: React.FC<{first: string; second: string; aspectA: number; aspectB: number; caption: string; revealShift?: number}> = ({first, second, aspectA, aspectB, caption, revealShift = 0}) => {
  const f = useCurrentFrame() - revealShift;
  const text = interpolate(f, [24, 34], [0, 1], clamp);
  return <AbsoluteFill style={{overflow: 'hidden'}}>
    <PaperGround frame={0} />
    <PaperCard src={first} aspect={aspectA} cx={465} cy={425} maxW={800} maxH={520} p={slideIn(f, 9, 14)} from="left" />
    <PaperCard src={second} aspect={aspectB} cx={1455} cy={425} maxW={800} maxH={520} p={slideIn(f, 62, 14)} from="right" />
    <div style={{position: 'absolute', left: 125, right: 125, top: 760, textAlign: 'center', font: '400 60px Arial, Helvetica, sans-serif', lineHeight: 1.14,
      color: '#111', opacity: text, transform: `translateY(${(1 - text) * 10}px)`}}>{caption}</div>
  </AbsoluteFill>;
};

// ------------------------------------------------------------------ T20: red labels on one or two photos (hard cut)

const Tag: React.FC<{text: string; frame: number; start: number}> = ({text, frame, start}) => {
  if (frame < start - 2) return null; // the bar appears at once (no fade), then the letters type in
  return <div style={{height: 115, background: TEXT_RED, color: CREAM, font: '700 70px Arial, Helvetica, sans-serif', padding: '11px 28px', boxSizing: 'border-box',
    overflow: 'hidden', whiteSpace: 'pre', borderRadius: 4}}>
    {[...text].map((ch, i) => {
      const s = start + i * 1.4;
      return <span key={i} style={{display: 'inline-block', opacity: frame >= s ? 1 : 0, transform: `translateY(${interpolate(frame, [s, s + 3], [100, 0], clamp)}%)`}}>{ch}</span>;
    })}
  </div>;
};

export const PhotoLabels: React.FC<{first: string; second?: string; firstPosition?: string; secondPosition?: string; labelA: string; labelB?: string; durationFrames: number; revealShift?: number}> = ({first, second, firstPosition = '50% 50%', secondPosition = '50% 50%', labelA, labelB = '', durationFrames, revealShift = 0}) => {
  const clock = useCurrentFrame();
  const f = clock - revealShift;
  const cut = second ? Math.round(durationFrames * 0.42) : Infinity; // straight cut to the second photo, no dissolve
  const onSecond = clock >= cut;
  const startB = second ? cut + 12 : 46;
  return <AbsoluteFill style={{overflow: 'hidden'}}>
    <Img src={staticFile(onSecond ? second! : first)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: onSecond ? secondPosition : firstPosition,
      filter: 'contrast(1.05)', transform: `scale(${1 + (onSecond ? clock - cut : clock) * 0.00025})`}} />
    <div style={{position: 'absolute', left: 0, top: 855, width: 960, display: 'flex', justifyContent: 'center'}}><Tag text={labelA} frame={f} start={13} /></div>
    {labelB ? <div style={{position: 'absolute', left: 960, top: 855, width: 960, display: 'flex', justifyContent: 'center'}}><Tag text={labelB} frame={clock} start={startB} /></div> : null}
  </AbsoluteFill>;
};
