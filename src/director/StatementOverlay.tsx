import {FONT, CREAM, revealChar} from './channelStyle';
import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {backgroundZoom, clampAll, type TemplateTiming} from './templateMotion';

export type StatementOverlayProps = {
  background: string;
  statement: string;
} & TemplateTiming;

const WORD_GAP = 4; // frames between words
const TEXT_START = 30; // first word, after the readability layer settles

/**
 * Template 22: one concise conclusion over a full-frame image. The image keeps its continuous push-in;
 * a dark layer settles, then the statement rises word by word (masked), vertically centred on the frame.
 */
export const StatementOverlay: React.FC<StatementOverlayProps> = ({background, statement, backgroundPosition = '50% 50%', revealShift = 0}) => {
  const clock = useCurrentFrame();
  const frame = clock - revealShift;
  const layer = interpolate(frame, [TEXT_START - 14, TEXT_START], [0, 0.46], clampAll);
  const words = statement.split(' ');
  return <AbsoluteFill style={{overflow: 'hidden', background: '#111'}}>
    <Img src={staticFile(background)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: backgroundPosition,
      transform: `scale(${backgroundZoom(clock)})`, transformOrigin: backgroundPosition, filter: 'none'}} />
    <div style={{position: 'absolute', inset: 0, background: '#000', opacity: layer}} />
    <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(0,0,0,.35), transparent 75%)', opacity: layer / 0.46}} />
    <AbsoluteFill style={{display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 170px'}}>
      <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: 26, rowGap: 6, maxWidth: 1580,
        fontFamily: FONT, fontWeight: 700, fontSize: 88, lineHeight: 1.12, letterSpacing: -1.2, color: CREAM, textAlign: 'center'}}>
        {words.map((word, i) => {
          const start = TEXT_START + i * WORD_GAP;
          const p = interpolate(frame, [start, start + 9], [0, 1], {...clampAll, easing: Easing.out(Easing.cubic)});
          // the references' motion: the letters of each word arrive left to right, fading in from a little to their right
          void p;
          return <span key={`${word}-${i}`} style={{display: 'inline-block', paddingBottom: 6, textShadow: '0 4px 14px rgba(0,0,0,.6)'}}>
            {[...word].map((c, k) => <span key={k} style={revealChar(frame, start + k * 0.7)}>{c}</span>)}
          </span>;
        })}
      </div>
    </AbsoluteFill>
  </AbsoluteFill>;
};
