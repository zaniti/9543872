import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {INK, TEXT_ON_PAPER, paperFilter, paperFor, paperVeil, FONT} from './channelStyle';

export type MetricPortraitCardProps = {
  paper?: string;
  portrait?: string;
  firstLead?: string;
  firstEmphasis?: string;
  firstTail?: string;
  secondLead?: string;
  secondEmphasis?: string;
  secondTail?: string;
  zoomDurationFrames?: number;
  /** Frames to delay the writing so the first figure lands on its spoken word. */
  revealShift?: number;
  /** When the second line starts writing (after the shift): the build sets it so its figure lands on its word. */
  secondStart?: number;
  portraitPosition?: string;
};

const reveal = (frame:number, start:number, duration:number) =>
  interpolate(frame, [start, start + duration], [0, 1], {extrapolateLeft:'clamp', extrapolateRight:'clamp'});

const Sentence:React.FC<{frame:number; start:number; lead:string; emphasis:string; tail:string; lineBreakAt?:number}> = ({frame,start,lead,emphasis,tail,lineBreakAt=lead.length}) => {
  const firstLine = lead.slice(0, lineBreakAt).trimEnd();
  const secondPrefix = lead.slice(lineBreakAt).trim();
  const secondLine = [secondPrefix, emphasis, tail].filter(Boolean).join(' ');
  const characters = [...firstLine, '\n', ...secondLine];
  const emphasisStart = firstLine.length + 1 + (secondPrefix ? secondPrefix.length + 1 : 0);
  const emphasisEnd = emphasisStart + emphasis.length;
  const printableCount = characters.filter((character) => character !== '\n').length;
  const highlightStart = start + printableCount * .85 + 7;
  let printableIndex = 0;
  return <>{characters.map((character, index) => {
    if (character === '\n') return <br key={`break-${index}`} />;
    const currentIndex = printableIndex++;
    const written = interpolate(frame, [start + currentIndex * .85, start + currentIndex * .85 + 6], [0, 1], {
      easing: Easing.out(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    });
    const isEmphasis = index >= emphasisStart && index < emphasisEnd;
    const highlight = isEmphasis ? interpolate(frame, [highlightStart, highlightStart + 12], [0, 1], {
      easing: Easing.inOut(Easing.quad), extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    }) : 0;
    const color = isEmphasis
      ? (highlight >= 1 ? TEXT_ON_PAPER : `color-mix(in srgb, ${TEXT_ON_PAPER} ${Math.round(highlight * 100)}%, ${INK})`)
      : '#151515';
    return <span key={`${character}-${index}`} style={{
      display: 'inline-block', whiteSpace: 'pre', opacity: written,
      transform: written < 1 ? `translateX(${((1 - written) * 0.35).toFixed(3)}em)` : undefined, color,
    }}>{character === ' ' ? '\u00a0' : character}</span>;
  })}</>;
};

/** Grid-paper portrait-and-stat template measured from reference clip 6. */
export const MetricPortraitCard:React.FC<MetricPortraitCardProps> = ({
  paper='templates/clip6/paper-grid.jpg', portrait='templates/clip6/portrait.jpg',
  firstLead='Reclaim nearly', firstEmphasis='50,000 hectares', firstTail='of land',
  secondLead='Supported the establishment of almost', secondEmphasis='30 settlements', secondTail='',
  zoomDurationFrames=214, revealShift=0, portraitPosition='right center', secondStart=104,
}) => {
  const frame=useCurrentFrame()-revealShift;
  const portraitIn=reveal(frame,9,16);
  const settledZoom=interpolate(frame,[Math.round(zoomDurationFrames*.7),zoomDurationFrames],[1,1.018],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  return <AbsoluteFill style={{overflow:'hidden',background:'#e7e7d9',transform:`scale(${settledZoom})`,transformOrigin:'center center'}}>
    <Img src={staticFile(paperFor(paper))} style={{width:'100%',height:'100%',objectFit:'cover',filter:paperFilter('brightness(1.1) saturate(.58)')}} />
    <div style={{position:'absolute',inset:0,background:paperVeil('rgba(247,243,223,.42)')}} />
    <div style={{position:'absolute',left:150,top:180,width:480,height:725,overflow:'hidden',opacity:portraitIn,transform:`translateY(${(1-portraitIn)*70}px) scale(${.95+.05*portraitIn})`,boxShadow:'0 12px 22px rgba(0,0,0,.22)',background:'#f8f4e8'}}>
      <Img src={staticFile(portrait)} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:portraitPosition}} />
    </div>
    <div style={{position:'absolute',left:730,top:280,width:1080,fontFamily:FONT,fontWeight:500,fontSize:68,lineHeight:1.15,letterSpacing:-0.5,color:INK}}>
      <Sentence frame={frame} start={37} lead={firstLead} emphasis={firstEmphasis} tail={firstTail}/>
    </div>
    <div style={{position:'absolute',left:730,top:635,width:1080,fontFamily:FONT,fontWeight:500,fontSize:68,lineHeight:1.15,letterSpacing:-0.5,color:INK}}>
      <Sentence frame={frame} start={secondStart} lead={secondLead} emphasis={secondEmphasis} tail={secondTail} lineBreakAt={'Supported the establishment'.length}/>
    </div>
  </AbsoluteFill>;
};
