import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {backgroundZoom, type TemplateTiming} from './templateMotion';
import {easeOut, highlightRGB} from './channelStyle';
export type StatisticOverlayProps={firstBackground?:string;firstLine?:string;emphasis?:string;secondLine?:string;zoomDurationFrames?:number;backgroundLayout?:'cover'|'aspect-safe'} & TemplateTiming;

const CopyBeat:React.FC<{frame:number;start:number;firstLine:string;emphasis:string;secondLine:string}>=({frame,start,firstLine,emphasis,secondLine})=>{
  const [hr,hg,hb]=highlightRGB([241,26,10]);
  const words=[...firstLine.split(' ').map(x=>({x,focus:false})),...emphasis.split(' ').map(x=>({x,focus:true}))];
  const hiStart=start+words.length*3+6;
  const opacity=interpolate(frame,[start,start+7],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  return <div style={{position:'absolute',left:0,right:0,top:425,textAlign:'center',fontFamily:'Arial, Helvetica, sans-serif',fontSize:74,fontWeight:700,lineHeight:1.12,letterSpacing:-1.8,textShadow:'0 3px 9px #0009',opacity}}>
    <div>{words.map(({x,focus},i)=>{const p=easeOut(frame,start+i*3,start+i*3+9);const hi=focus?interpolate(frame,[hiStart,hiStart+12],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'}):0;return <span key={i} style={{display:'inline-block',opacity:p,transform:`translateY(${(1-p)*18}px)`,color:focus?`rgb(${Math.round(255+(hr-255)*hi)},${Math.round(248+(hg-248)*hi)},${Math.round(236+(hb-236)*hi)})`:'#fff8ec'}}>{x}&nbsp;</span>})}</div>
    <div style={{opacity:interpolate(frame,[start+35,start+45],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'}),transform:`translateY(${interpolate(frame,[start+35,start+45],[16,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'})}px)`,color:'#fff8ec'}}>{secondLine}</div>
  </div>;
};

export const StatisticOverlay:React.FC<StatisticOverlayProps>=({firstBackground='templates/clip11/first.jpg',firstLine='More than',emphasis='250 anti-Jewish riots erupted',secondLine='between 1881 and 1884',zoomDurationFrames=210,backgroundLayout='cover',backgroundPosition='50% 50%',revealShift=0})=>{const clock=useCurrentFrame();const f=clock-revealShift;void zoomDurationFrames;const readability=interpolate(f,[33,41],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});const zoom=backgroundZoom(clock);return <AbsoluteFill style={{overflow:'hidden',background:'#111'}}>{backgroundLayout==='aspect-safe'?<><Img src={staticFile(firstBackground)} style={{position:'absolute',width:'100%',height:'100%',objectFit:'cover',objectPosition:backgroundPosition,transform:`scale(${zoom*1.08})`,transformOrigin:backgroundPosition,filter:'blur(18px) brightness(.55) saturate(.62)'}}/><Img src={staticFile(firstBackground)} style={{position:'absolute',width:'100%',height:'100%',objectFit:'contain',filter:'contrast(1.03)'}}/></>:<Img src={staticFile(firstBackground)} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:backgroundPosition,transform:`scale(${zoom})`,transformOrigin:backgroundPosition,filter:'contrast(1.03)'}}/>}<div style={{position:'absolute',inset:0,opacity:readability,background:'rgba(0,0,0,.44)'}}/><div style={{position:'absolute',left:170,right:170,top:390,height:310,opacity:readability,background:'radial-gradient(ellipse,rgba(0,0,0,.34),rgba(0,0,0,0) 72%)'}}/><CopyBeat frame={f} start={43} firstLine={firstLine} emphasis={emphasis} secondLine={secondLine}/></AbsoluteFill>};
