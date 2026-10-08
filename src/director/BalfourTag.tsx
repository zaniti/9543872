import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {backgroundZoom, type TemplateTiming} from './templateMotion';

const lowerCopy = 'Balfour Declaration';
const yearCopy = '1917';
const RED = '#aa1533'; // same crimson as the year tag (user request 2026-10-07)
const WHITE = '#fffdf7';

// Measured from the supplied 30fps reference. Some pairs intentionally begin
// together, creating the brisk bursts visible in the original edit.
const titleCharacterStarts = [7, 9, 10, 11, 11, 12, 13, 14, 14, 15, 16, 17, 18, 19, 20, 22, 24, 26, 29];
// These are indexed in normal reading order for the default four-digit year.
const yearCharacterStarts = [66, 59, 54, 50];

const riseFromBelow = (frame:number, start:number, initialOffset = 100) =>
  interpolate(frame, [start, start + 4], [initialOffset, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

const titleStartAt = (index:number, length:number) => {
  if (length === lowerCopy.length) return titleCharacterStarts[index];
  const referencePosition = (index / Math.max(1, length - 1)) * (titleCharacterStarts.length - 1);
  const left = Math.floor(referencePosition);
  const right = Math.min(titleCharacterStarts.length - 1, Math.ceil(referencePosition));
  const progress = referencePosition - left;
  return Math.round(titleCharacterStarts[left] + (titleCharacterStarts[right] - titleCharacterStarts[left]) * progress);
};

const yearStartAt = (index:number, length:number) => {
  if (length === yearCopy.length) return yearCharacterStarts[index];
  return Math.round(50 + ((length - 1 - index) / Math.max(1, length - 1)) * 16);
};

export type DocumentaryTypeOnLabelProps = {
  background?: string;
  title?: string;
  year?: string;
  zoomEnd?: number;
  zoomDurationFrames?: number;
  backgroundLayout?: 'cover' | 'aspect-safe';
} & TemplateTiming;

export const BalfourTag:React.FC<DocumentaryTypeOnLabelProps> = ({
  background = 'templates/balfour-clean.jpg',
  title = lowerCopy,
  year: suppliedYear = yearCopy,
  zoomEnd = 1.062,
  zoomDurationFrames = 86,
  backgroundLayout = 'cover',
  backgroundPosition = '50% 50%',
  revealShift = 0,
}) => {
  const clock = useCurrentFrame();
  // Reveals run on their own (shiftable) clock; the background zoom never stops.
  const frame = clock - revealShift;
  void zoomEnd; void zoomDurationFrames;
  const backgroundScale = backgroundZoom(clock);
  const labelCharacters = [...title].map((character, index) => ({
    character,
    start: titleStartAt(index, title.length),
  })).filter(({start}) => frame >= start);
  const yearCharacters = [...suppliedYear].map((character, index) => ({
    character,
    start: yearStartAt(index, suppliedYear.length),
  })).filter(({start}) => frame >= start);
  return <AbsoluteFill style={{background:'#0e1012', overflow:'hidden'}}>
    {backgroundLayout === 'aspect-safe' ? <>
      <Img src={staticFile(background)} style={{position: 'absolute', width:'100%', height:'100%', objectFit:'cover', opacity: .36, filter:'blur(18px) brightness(.58) saturate(.68)', objectPosition: backgroundPosition, transform: `scale(${backgroundScale * 1.08})`, transformOrigin: backgroundPosition}} />
      {/* The evidence foreground must remain fully legible; animate only its backdrop. */}
      <Img src={staticFile(background)} style={{position: 'absolute', inset: 0, width:'100%', height:'100%', objectFit:'contain', transform: 'scale(1)', transformOrigin: 'center center'}} />
    </> : <Img src={staticFile(background)} style={{
      width:'100%', height:'100%', objectFit:'cover', objectPosition: backgroundPosition,
      transform: `scale(${backgroundScale})`, transformOrigin: backgroundPosition,
    }} />}
    {labelCharacters.length > 0 ? <div style={{
      position:'absolute', left:'50%', top:858, height:115,
      display:'inline-flex', alignItems:'center', overflow:'hidden', whiteSpace:'pre',
      color:WHITE, backgroundColor:RED, borderRadius:8,
      boxSizing:'border-box', padding:'0 30px',
      fontFamily:'Arial, Helvetica, sans-serif', fontWeight:700, fontSize:72,
      letterSpacing:4.7, lineHeight:1, transform:'translateX(-50%)',
    }}>{labelCharacters.map(({character, start}, index) => <span key={`${character}-${index}`} style={{
      display: 'inline-block',
      transform: `translateY(${riseFromBelow(frame, start, 125)}%)`,
    }}>{character === ' ' ? '\u00a0' : character}</span>)}</div> : null}
    {yearCharacters.length > 0 ? <div style={{
      position:'absolute', right:177, top:100, height:115,
      display:'inline-flex', alignItems:'center', justifyContent:'flex-end', overflow:'hidden', whiteSpace:'pre',
      color:WHITE, backgroundColor:'#aa1533', borderRadius:8,
      boxSizing:'border-box', padding:'0 34px',
      fontFamily:'Arial, Helvetica, sans-serif', fontWeight:700, fontSize:68,
      letterSpacing:-1.5, lineHeight:1,
    }}>{yearCharacters.map(({character, start}, index) => <span key={`${character}-${index}`} style={{
      display: 'inline-block',
      transform: `translateY(${riseFromBelow(frame, start)}%)`,
    }}>{character}</span>)}</div> : null}
  </AbsoluteFill>;
};
