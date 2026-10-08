import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';

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
      ? `rgb(${Math.round(21 + (214 - 21) * highlight)},${Math.round(21 + (17 - 21) * highlight)},${Math.round(21 + (11 - 21) * highlight)})`
      : '#151515';
    return <span key={`${character}-${index}`} style={{
      display: 'inline-block', whiteSpace: 'pre', opacity: written,
      transform: `translateY(${(1 - written) * 13}px)`, color,
    }}>{character === ' ' ? '\u00a0' : character}</span>;
  })}</>;
};

/** Grid-paper portrait-and-stat template measured from reference clip 6. */
export const MetricPortraitCard:React.FC<MetricPortraitCardProps> = ({
  paper='templates/clip6/paper-grid.jpg', portrait='templates/clip6/portrait.jpg',
  firstLead='Reclaim nearly', firstEmphasis='50,000 hectares', firstTail='of land',
  secondLead='Supported the establishment of almost', secondEmphasis='30 settlements', secondTail='',
  zoomDurationFrames=214, revealShift=0, portraitPosition='right center',
}) => {
  const frame=useCurrentFrame()-revealShift;
  const portraitIn=reveal(frame,9,16);
  const settledZoom=interpolate(frame,[Math.round(zoomDurationFrames*.7),zoomDurationFrames],[1,1.018],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  return <AbsoluteFill style={{overflow:'hidden',background:'#e7e7d9',transform:`scale(${settledZoom})`,transformOrigin:'center center'}}>
    <Img src={staticFile(paper)} style={{width:'100%',height:'100%',objectFit:'cover',filter:'brightness(1.1) saturate(.58)'}} />
    <div style={{position:'absolute',inset:0,background:'rgba(247,243,223,.42)'}} />
    <div style={{position:'absolute',left:150,top:180,width:480,height:725,overflow:'hidden',opacity:portraitIn,transform:`translateY(${(1-portraitIn)*70}px) scale(${.95+.05*portraitIn})`,boxShadow:'0 12px 22px rgba(0,0,0,.22)',background:'#f8f4e8'}}>
      <Img src={staticFile(portrait)} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:portraitPosition}} />
    </div>
    <div style={{position:'absolute',left:730,top:280,width:1080,fontFamily:'Arial, Helvetica, sans-serif',fontWeight:400,fontSize:76,lineHeight:1.12,letterSpacing:-1.6}}>
      <Sentence frame={frame} start={37} lead={firstLead} emphasis={firstEmphasis} tail={firstTail}/>
    </div>
    <div style={{position:'absolute',left:730,top:635,width:1080,fontFamily:'Arial, Helvetica, sans-serif',fontWeight:400,fontSize:76,lineHeight:1.12,letterSpacing:-1.6}}>
      <Sentence frame={frame} start={104} lead={secondLead} emphasis={secondEmphasis} tail={secondTail} lineBreakAt={'Supported the establishment'.length}/>
    </div>
  </AbsoluteFill>;
};
