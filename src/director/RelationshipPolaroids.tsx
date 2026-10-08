import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {tagCharacterOpacity, tagCharacterRise, tagCharacterStart} from './documentaryMotion';
import {FONT, TEXT_RED as RED, easeOut, paperFilter, paperFor, paperVeil} from './channelStyle';

export type RelationshipPolaroidsProps={paper?:string; first?:string; second?:string; firstName?:string; secondName?:string; sourceNote?:string; revealShift?:number; firstPosition?:string; secondPosition?:string};

const Print:React.FC<{src:string;name:string;x:number;y:number;width:number;height:number;imageHeight:number;progress:number;frame:number;nameStart:number;pos?:string}> = ({src,name,x,y,width,height,imageHeight,progress,frame,nameStart,pos='center center'}) => <div style={{position:'absolute',left:x,top:y,width,height,padding:14,boxSizing:'border-box',background:'#fffbed',boxShadow:'0 16px 28px rgba(24,20,12,.26)',opacity:progress,transform:`translateY(${(1-progress)*120}px) scale(${.79+.21*progress})`,transformOrigin:'50% 100%'}}>
  <Img src={staticFile(src)} style={{width:'100%',height:imageHeight,objectFit:'cover',objectPosition:pos,filter:`blur(${(1-progress)*5}px) contrast(.98)`}}/>
  <div style={{height:height-imageHeight-28,display:'flex',alignItems:'center',justifyContent:'center',color:RED,fontFamily:FONT,fontWeight:700,fontSize:36,whiteSpace:'nowrap',overflow:'hidden'}}>{[...name].map((character,index)=>{const start=tagCharacterStart(index,name.length,nameStart,18);return frame<start?null:<span key={`${character}-${index}`} style={{display:'inline-block',opacity:tagCharacterOpacity(frame,start),transform:`translateY(${tagCharacterRise(frame,start,100)}%)`}}>{character===' '? '\u00a0':character}</span>})}</div>
</div>;

/** Two named Polaroids joined by a hand-drawn relationship arrow. */
export const RelationshipPolaroids:React.FC<RelationshipPolaroidsProps>=({
 paper='templates/clip8/paper-grid.jpg',first='templates/clip8/first-clean.jpg',second='templates/clip8/second-clean.jpg',firstName='James Rothschild',secondName='Amschel Rothschild',sourceNote='[9] Source in Description',revealShift=0,firstPosition='center center',secondPosition='center center',
})=>{
 const f=useCurrentFrame()-revealShift;
 const firstP=easeOut(f,7,29);
 const arrowP=interpolate(f,[34,54],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
 const secondP=easeOut(f,46,70);
 return <AbsoluteFill style={{overflow:'hidden',background:'#e1e1d2'}}>
  <Img src={staticFile(paperFor(paper))} style={{width:'100%',height:'100%',objectFit:'cover',filter:paperFilter('brightness(1.08) saturate(.62)')}}/><div style={{position:'absolute',inset:0,background:paperVeil('rgba(248,245,226,.45)')}}/>
  <div style={{position:'absolute',top:40,right:74,color:'#faf7eb',font: '700 22px Arial',opacity:interpolate(f,[25,38],[0,.82],{extrapolateLeft:'clamp',extrapolateRight:'clamp'})}}>{sourceNote}</div>
  <Print src={first} name={firstName} x={280} y={100} width={464} height={670} imageHeight={584} progress={firstP} frame={f} nameStart={34} pos={firstPosition}/>
  <svg width="650" height="370" viewBox="0 0 650 370" style={{position:'absolute',left:720,top:55,overflow:'visible'}}>
    <path d="M 82 124 C 266 31, 406 71, 488 254" fill="none" stroke="#151b21" strokeWidth="8" strokeLinecap="round" strokeDasharray="700" strokeDashoffset={700*(1-arrowP)}/>
    <path d="M 440 229 L 488 254 L 501 199" fill="none" stroke="#151b21" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" opacity={interpolate(arrowP,[.88,1],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'})}/>
  </svg>
  <Print src={second} name={secondName} x={1092} y={350} width={460} height={630} imageHeight={500} progress={secondP} frame={f} nameStart={76} pos={secondPosition}/>
 </AbsoluteFill>;
};
