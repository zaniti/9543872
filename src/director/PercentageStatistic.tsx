import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {backgroundZoom, type TemplateTiming} from './templateMotion';
import {CREAM, FONT, TEXT_RED, RiseWords, clamp, easeOut} from './channelStyle';

/** Template 14: one number and its meaning.
 * Default "highlight": everything appears in white (soft fade), then the number and the important words turn the channel
 * red with a slow left-to-right sweep, like a highlighter. Important words: wrap them in *stars* in `copy`.
 * "calm": number red + line white, fade only. "count": the original count-up with the word-by-word line. */
const sweep = (p: number): React.CSSProperties => ({
  // white text whose colour fills with red from left to right as p goes 0 -> 1
  backgroundImage: `linear-gradient(90deg, ${TEXT_RED} ${p * 100}%, ${CREAM} ${p * 100}%)`, // hard edge, like a marker
  WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', WebkitTextFillColor: 'transparent',
});
const HighlightCopy: React.FC<{copy: string; f: number; start: number}> = ({copy, f, start}) => {
  const parts = copy.split(/(\*[^*]+\*)/).filter(Boolean);
  let k = 0;
  return <>{parts.map((part, i) => {
    if (!part.startsWith('*')) return <span key={i}>{part}</span>;
    const s0 = start + 30 * k++; // marked words follow one another, left to right
    return <span key={i} style={sweep(interpolate(f, [s0, s0 + 36], [0, 1], {...clamp, easing: Easing.inOut(Easing.sin)}))}>{part.slice(1, -1)}</span>;
  })}</>;
};
export const PercentageStatistic: React.FC<{background?: string; percent?: number; copy?: string; sourceNote?: string; suffix?: string; prefix?: string; backgroundLayout?: 'cover' | 'aspect-safe'; motion?: 'highlight' | 'calm' | 'count'} & TemplateTiming> = ({
  background = 'templates/clip14/background.jpg', percent = 90, copy = 'Prisoners expected to die from the elements or disease',
  sourceNote = '[21] Source in Description', suffix = '%', prefix = '', backgroundLayout = 'cover', backgroundPosition = '50% 50%', revealShift = 0,
  motion = 'highlight',
}) => {
  const clock = useCurrentFrame();
  const f = clock - revealShift;
  const zoom = backgroundZoom(clock);
  const hl = motion === 'highlight';
  const calm = motion === 'calm' || hl;
  const count = calm ? percent : interpolate(f, [0, 52], [0, percent], {...clamp, easing: Easing.out(Easing.cubic)});
  const numberIn = easeOut(f, 0, calm ? 12 : 10);
  const settle = calm ? 1 : interpolate(f, [48, 56, 64], [1, 1.035, 1], clamp);
  const copyIn = easeOut(f, 6, 18);
  const filter = 'grayscale(.65) brightness(.31) contrast(1.14)';
  return <AbsoluteFill style={{overflow: 'hidden', background: '#111'}}>
    {backgroundLayout === 'aspect-safe' ? <>
      <Img src={staticFile(background)} style={{position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', objectPosition: backgroundPosition, transform: `scale(${zoom * 1.08})`, transformOrigin: backgroundPosition, filter: 'blur(18px) brightness(.3) saturate(.5)'}} />
      <Img src={staticFile(background)} style={{position: 'absolute', width: '100%', height: '100%', objectFit: 'contain', filter}} />
    </> : <Img src={staticFile(background)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: backgroundPosition, transform: `scale(${zoom})`, transformOrigin: backgroundPosition, filter}} />}
    {sourceNote ? <div style={{position: 'absolute', right: 74, top: 44, color: '#fff9ea', font: `700 22px ${FONT}`, opacity: interpolate(f, [12, 23], [0, .8], clamp)}}>{sourceNote}</div> : null}
    <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{filter: 'drop-shadow(0 4px 14px rgba(0,0,0,.45))'}}><div style={{color: TEXT_RED, fontFamily: FONT, fontWeight: 700, fontSize: 124, letterSpacing: -3, lineHeight: 1, fontVariantNumeric: 'tabular-nums',
        opacity: numberIn, transform: `translateY(${(1 - numberIn) * (calm ? 10 : 24)}px) scale(${settle})`,
        ...(hl ? sweep(interpolate(f, [14, 54], [0, 1], {...clamp, easing: Easing.inOut(Easing.sin)})) : {})}}>
        {prefix}{Math.round(count).toLocaleString('en-US')}{suffix}
      </div></div>
      <div style={{maxWidth: 1180, textAlign: 'center', marginTop: 18, color: CREAM, fontFamily: FONT, fontWeight: 700, fontSize: 58, lineHeight: 1.12, letterSpacing: -0.5}}>
        {calm ? <span style={{display: 'inline-block', opacity: copyIn, transform: `translateY(${(1 - copyIn) * 10}px)`, filter: 'drop-shadow(0 3px 12px rgba(0,0,0,.45))'}}>
          {hl ? <HighlightCopy copy={copy} f={f} start={56} /> : copy.replace(/\*/g, '')}</span>
          : <RiseWords text={copy.replace(/\*/g, '')} frame={f} start={46} gap={3} />}
      </div>
    </div>
  </AbsoluteFill>;
};
