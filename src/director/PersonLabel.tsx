import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {FONT, textBase} from './channelStyle';

/**
 * T50: a person's name on the film itself, at their belly, following them (the owner's reference, 2026-10-26: a bold
 * name with a small role line under it, centred on the person, never on the face, head or chest). The path is worked
 * out when the video is built (engine/persontrack.py: the face found every 0.2 s, the label placed at the belly, then
 * smoothed and speed-limited) and is curved here between its points, so the label glides on every frame and never
 * jumps. The name rises letter by letter (calm); the role line rises whole or word by word, then both leave together.
 */
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const NAME_RISE = 9, NAME_GAP = 1.4; // the calmer speed the owner chose
const ease = (t: number) => 1 - (1 - t) ** 3;

/** The label's centre at time t (seconds): Catmull-Rom through the 0.2 s points, held at the ends. */
const along = (track: number[][], t: number): [number, number] => {
  if (!track.length) return [50, 70];
  if (t <= track[0][0]) return [track[0][1], track[0][2]];
  const last = track[track.length - 1];
  if (t >= last[0]) return [last[1], last[2]];
  let i = 0;
  while (i < track.length - 2 && track[i + 1][0] <= t) i++;
  const p0 = track[Math.max(0, i - 1)], p1 = track[i], p2 = track[i + 1], p3 = track[Math.min(track.length - 1, i + 2)];
  const u = (t - p1[0]) / Math.max(1e-6, p2[0] - p1[0]);
  const cr = (a: number, b: number, c: number, d: number) =>
    0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u);
  return [cr(p0[1], p1[1], p2[1], p3[1]), cr(p0[2], p1[2], p2[2], p3[2])];
};

const Rise: React.FC<{text: string; f: number; start: number; rise: number; gap: number; by: 'letter' | 'word' | 'whole'}> = ({text, f, start, rise, gap, by}) => {
  const units = by === 'whole' ? [text] : by === 'word' ? text.split(' ') : [...text];
  return <>{units.map((u, i) => {
    const e = ease(interpolate(f, [start + i * gap, start + i * gap + rise], [0, 1], clamp));
    const space = by === 'word' && i < units.length - 1 ? '0.28em' : 0;
    return <span key={i} style={{display: 'inline-block', whiteSpace: 'pre', opacity: e, transform: `translateY(${(1 - e) * 0.42}em)`, marginRight: space}}>{u}</span>;
  })}</>;
};

export const PersonLabel: React.FC<{background?: string; backgroundVideo?: string; position?: string; track?: number[][];
  name: string; role?: string; roleBy?: 'whole' | 'word'; durationFrames: number; revealShift?: number}> =
  ({background, backgroundVideo, position = '50% 50%', track = [], name, role = '', roleBy = 'whole', durationFrames, revealShift = 0}) => {
  const clock = useCurrentFrame();
  const f = clock - revealShift;
  const [x, y] = along(track, clock / 30);
  const nameDone = 4 + ([...name].length - 1) * NAME_GAP + NAME_RISE * 0.5;
  const out = interpolate(clock, [durationFrames - 12, durationFrames - 2], [1, 0], clamp); // both leave together
  return <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
    {backgroundVideo
      ? <OffthreadVideo src={staticFile(backgroundVideo)} muted style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: position}} />
      : background ? <Img src={staticFile(background)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: position}} /> : null}
    <div style={{position: 'absolute', left: `${x}%`, top: `${y}%`, transform: `translate(-50%, -50%) translateY(${(1 - out) * 14}px)`, opacity: out,
      display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', whiteSpace: 'nowrap',
      ...textBase, fontFamily: FONT, color: '#fff', textShadow: '0 3px 14px rgba(0,0,0,.65), 0 1px 3px rgba(0,0,0,.5)'}}>
      <div style={{fontWeight: 800, fontSize: 96, lineHeight: 1, letterSpacing: 0.5}}>
        <Rise text={name} f={f} start={4} rise={NAME_RISE} gap={NAME_GAP} by="letter" />
      </div>
      {role ? <div style={{fontWeight: 700, fontSize: 30, letterSpacing: 2, marginTop: 6}}>
        <Rise text={role} f={f} start={nameDone} rise={roleBy === 'whole' ? 10 : 8} gap={4} by={roleBy} />
      </div> : null}
    </div>
  </AbsoluteFill>;
};
