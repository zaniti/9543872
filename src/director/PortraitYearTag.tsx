import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {backgroundZoom, type TemplateTiming} from './templateMotion';

export type PortraitYearTagProps = {
  background?: string;
  year?: string;
  zoomDurationFrames?: number;
  zoomEnd?: number;
  backgroundLayout?: 'cover' | 'aspect-safe';
} & TemplateTiming;

const yearCharacterStarts = [70, 63, 59, 59];

const riseFromBelow = (frame: number, start: number) =>
  interpolate(frame, [start, start + 2], [100, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

export const PortraitYearTag: React.FC<PortraitYearTagProps> = ({
  background = 'templates/portrait-year-clean.png',
  year = '1887',
  zoomDurationFrames = 127,
  zoomEnd = 1.09,
  backgroundLayout = 'cover',
  backgroundPosition = '50% 50%',
  revealShift = 0,
}) => {
  const clock = useCurrentFrame();
  const frame = clock - revealShift;
  void zoomEnd; void zoomDurationFrames;
  const backgroundScale = backgroundZoom(clock);
  const characters = [...year].map((character, index) => ({
    character,
    start: year.length === 4 ? yearCharacterStarts[index] : Math.round(59 + ((year.length - 1 - index) / Math.max(1, year.length - 1)) * 11),
  })).filter(({start}) => frame >= start);

  return <AbsoluteFill style={{background: '#101217', overflow: 'hidden'}}>
    {backgroundLayout === 'aspect-safe' ? <>
      <Img src={staticFile(background)} style={{position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', objectPosition: backgroundPosition, transform: `scale(${backgroundScale * 1.08})`, transformOrigin: backgroundPosition, filter: 'blur(18px) brightness(.55) saturate(.64)'}} />
      <Img src={staticFile(background)} style={{position: 'absolute', width: '100%', height: '100%', objectFit: 'contain'}} />
    </> : <Img src={staticFile(background)} style={{
      width: '100%', height: '100%', objectFit: 'cover', objectPosition: backgroundPosition,
      transform: `scale(${backgroundScale})`, transformOrigin: backgroundPosition,
    }} />}
    {characters.length > 0 ? <div style={{
      position: 'absolute', right: 170, top: 95, height: 120,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', overflow: 'hidden', whiteSpace: 'pre',
      color: '#fffdf7', backgroundColor: '#aa1533', borderRadius: 8,
      boxSizing: 'border-box', padding: '0 34px',
      fontFamily: 'Arial, Helvetica, sans-serif', fontWeight: 700, fontSize: 68,
      letterSpacing: -1.5, lineHeight: 1,
    }}>{characters.map(({character, start}, index) => <span key={`${character}-${index}`} style={{
      display: 'inline-block', transform: `translateY(${riseFromBelow(frame, start)}%)`,
    }}>{character}</span>)}</div> : null}
  </AbsoluteFill>;
};
