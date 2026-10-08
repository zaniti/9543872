import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {FONT, TEXT_RED as RED, easeOut, paperFilter, paperFor, paperVeil} from './channelStyle';

export type PolaroidNameCardProps = {paper?: string; portrait?: string; name?: string; revealShift?: number; portraitPosition?: string};

/** A single vertical print that resolves from motion blur on the reference grid. */
export const PolaroidNameCard:React.FC<PolaroidNameCardProps> = ({
  paper='templates/clip7/paper-grid.jpg', portrait='templates/clip7/portrait.jpg', name='James Rothschild', revealShift=0, portraitPosition='50% 50%',
}) => {
  const frame=useCurrentFrame()-revealShift;
  const p=easeOut(frame,7,28);
  const showName=interpolate(frame,[55,73],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  const finalScale=interpolate(frame,[40,85],[1,1.055],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  void showName;
  return <AbsoluteFill style={{overflow:'hidden',background:'#e1e2d3'}}>
    <Img src={staticFile(paperFor(paper))} style={{width:'100%',height:'100%',objectFit:'cover',filter:paperFilter('brightness(1.09) saturate(.6)')}} />
    <div style={{position:'absolute',inset:0,background:paperVeil('rgba(247,243,223,.43)')}} />
    <div style={{position:'absolute',left:700,top:140,width:520,height:790,boxSizing:'border-box',padding:'16px 16px 103px',background:'#fbf8ea',boxShadow:'0 18px 31px rgba(23,21,16,.26)',opacity:p,transform:`translateY(${(1-p)*160}px) scale(${(.76+.24*p)*finalScale})`,transformOrigin:'50% 100%'}}>
      <Img src={staticFile(portrait)} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:portraitPosition,filter:`contrast(.98) saturate(.88) blur(${(1-p)*13}px)`}} />
      <div style={{position:'absolute',bottom:24,left:0,right:0,textAlign:'center',height:58,color:RED,fontFamily:FONT,fontWeight:700,fontSize:40,letterSpacing:-.3,overflow:'hidden',whiteSpace:'nowrap'}}>{[...name].map((c,i)=>{const s=55+Math.round(i/Math.max(1,name.length-1)*16);const q=easeOut(frame,s,s+7);return <span key={i} style={{display:'inline-block',transform:`translateY(${(1-q)*100}%)`,opacity:q}}>{c===' '?'\u00a0':c}</span>})}</div>
    </div>
  </AbsoluteFill>;
};
