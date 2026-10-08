import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {WipeBar} from './channelStyle';
import {backgroundZoom, type TemplateTiming} from './templateMotion';

export type PortraitFeatureCardProps = {
  background?: string;
  portrait?: string;
  label?: string;
  sourceNote?: string;
  zoomDurationFrames?: number;
  backgroundLayout?: 'cover' | 'aspect-safe';
  /** object-position of the portrait inside its card (keep the face). */
  portraitPosition?: string;
} & TemplateTiming;

export const PortraitFeatureCard: React.FC<PortraitFeatureCardProps> = ({
  background = 'templates/clip5/group.jpg',
  portrait = 'templates/clip5/portrait.jpg',
  label = 'The Benefactor',
  sourceNote = '',
  zoomDurationFrames = 160,
  backgroundLayout = 'cover',
  backgroundPosition = '50% 50%',
  portraitPosition = '50% 50%',
  revealShift = 0,
}) => {
  const clock = useCurrentFrame();
  const frame = clock - revealShift;
  void zoomDurationFrames;
  const bgScale = backgroundZoom(clock);
  const cardProgress = interpolate(frame, [88, 112], [0, 1], {
    easing: Easing.out(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  return <AbsoluteFill style={{overflow: 'hidden', background: '#17140f'}}>
    {backgroundLayout === 'aspect-safe' ? <>
      <Img src={staticFile(background)} style={{position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', objectPosition: backgroundPosition, transform: `scale(${bgScale * 1.08})`, transformOrigin: backgroundPosition, filter: 'blur(18px) brightness(.5) saturate(.6)'}} />
      <Img src={staticFile(background)} style={{position: 'absolute', width: '100%', height: '100%', objectFit: 'contain', filter: 'sepia(.42) contrast(.9) brightness(.83)'}} />
    </> : <Img src={staticFile(background)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: backgroundPosition, transform: `scale(${bgScale})`, transformOrigin: backgroundPosition, filter: 'sepia(.42) contrast(.9) brightness(.83)'}} />}
    <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(90deg,rgba(24,19,11,.10),transparent 45%,rgba(24,19,11,.22))'}} />
    {sourceNote ? <div style={{position: 'absolute', top: 45, right: 66, color: '#f6eee0', opacity: interpolate(frame, [12, 24], [0, .84], {extrapolateLeft:'clamp', extrapolateRight:'clamp'}), fontFamily: 'Arial, Helvetica, sans-serif', fontSize: 23, fontWeight: 700, letterSpacing: .4}}>{sourceNote}</div> : null}
    <div style={{position: 'absolute', left: 660, top: 82, width: 600, height: 910, overflow: 'hidden', boxShadow: '0 18px 38px rgba(0,0,0,.46)', opacity: cardProgress, transform: `translateY(${(1-cardProgress)*480}px)`, transformOrigin: '50% 100%'}}>
      <Img src={staticFile(portrait)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: portraitPosition, filter: `sepia(.26) contrast(.95) blur(${(1-cardProgress)*10}px)`}} />
    </div>
    {label ? <div style={{position: 'absolute', left: 0, right: 0, top: 858, display: 'flex', justifyContent: 'center'}}>
      <WipeBar text={label} frame={frame} start={95} fontSize={74} height={116} padding={38} letterSpacing={1.5} radius={4} style={{boxShadow: '0 12px 28px rgba(0,0,0,.35)'}} />
    </div> : null}
  </AbsoluteFill>;
};
