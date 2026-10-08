import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {backgroundZoom, type TemplateTiming} from './templateMotion';
import {CREAM, FONT, TEXT_RED, RiseWords, clamp, easeOut} from './channelStyle';

/** Template 14: one number that counts up and settles (ease-out), then its meaning rises in underneath. */
export const PercentageStatistic: React.FC<{background?: string; percent?: number; copy?: string; sourceNote?: string; suffix?: string; prefix?: string; backgroundLayout?: 'cover' | 'aspect-safe'} & TemplateTiming> = ({
  background = 'templates/clip14/background.jpg', percent = 90, copy = 'Prisoners expected to die from the elements or disease',
  sourceNote = '[21] Source in Description', suffix = '%', prefix = '', backgroundLayout = 'cover', backgroundPosition = '50% 50%', revealShift = 0,
}) => {
  const clock = useCurrentFrame();
  const f = clock - revealShift;
  const zoom = backgroundZoom(clock);
  const count = interpolate(f, [0, 52], [0, percent], {...clamp, easing: Easing.out(Easing.cubic)});
  const numberIn = easeOut(f, 0, 10);
  const settle = interpolate(f, [48, 56, 64], [1, 1.035, 1], clamp);
  const filter = 'grayscale(.65) brightness(.31) contrast(1.14)';
  return <AbsoluteFill style={{overflow: 'hidden', background: '#111'}}>
    {backgroundLayout === 'aspect-safe' ? <>
      <Img src={staticFile(background)} style={{position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', objectPosition: backgroundPosition, transform: `scale(${zoom * 1.08})`, transformOrigin: backgroundPosition, filter: 'blur(18px) brightness(.3) saturate(.5)'}} />
      <Img src={staticFile(background)} style={{position: 'absolute', width: '100%', height: '100%', objectFit: 'contain', filter}} />
    </> : <Img src={staticFile(background)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: backgroundPosition, transform: `scale(${zoom})`, transformOrigin: backgroundPosition, filter}} />}
    {sourceNote ? <div style={{position: 'absolute', right: 74, top: 44, color: '#fff9ea', font: `700 22px ${FONT}`, opacity: interpolate(f, [12, 23], [0, .8], clamp)}}>{sourceNote}</div> : null}
    <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{color: TEXT_RED, fontFamily: FONT, fontWeight: 700, fontSize: 124, letterSpacing: -3, lineHeight: 1, fontVariantNumeric: 'tabular-nums',
        opacity: numberIn, transform: `translateY(${(1 - numberIn) * 24}px) scale(${settle})`, textShadow: '0 4px 18px rgba(0,0,0,.45)'}}>
        {prefix}{Math.round(count).toLocaleString('en-US')}{suffix}
      </div>
      <div style={{maxWidth: 1180, textAlign: 'center', marginTop: 18, color: CREAM, fontFamily: FONT, fontWeight: 700, fontSize: 58, lineHeight: 1.12, letterSpacing: -0.5}}>
        <RiseWords text={copy} frame={f} start={46} gap={3} />
      </div>
    </div>
  </AbsoluteFill>;
};
