import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {CREAM, TagBox, clamp, textWidth} from './channelStyle';

/**
 * T28 "story photo" (the owner's reference: a hook that tells one strong picture in several shots, 2026-10-21).
 * One photo stays on screen while the camera travels over it: wide, then in on a person, across to another, closer on a
 * detail, each move landing on the word that names it. Red tags with an arrow name people and things on their word.
 *
 * shots: where the camera looks, from frame `at`: centre (cx, cy) and visible width w, all in % of the photo.
 * tags:  a red tag pointing at (x, y) in % of the photo, from frame `at` until `until` (default: to the end).
 *
 * The camera, the tag and the photo view are shared with the other motion pieces (MotionPieces.tsx).
 */
export type StoryShot = {at: number; cx: number; cy: number; w: number};
export type StoryTag = {at: number; until?: number; text: string; x: number; y: number; side?: 'left' | 'right';
  /** a face box [x, y, w, h] in % of the photo: the arrow stops just outside it (never inside a face, never far) */
  face?: [number, number, number, number]};

const MOVE = 26; // frames for the camera to travel to the next shot
export const FRAME_W = 1920, FRAME_H = 1080;

export const camera = (shots: StoryShot[], f: number, move = MOVE) => {
  const list = shots.length ? [...shots].sort((a, b) => a.at - b.at) : [{at: 0, cx: 50, cy: 50, w: 100}];
  let {cx, cy, w} = list[0];
  for (const s of list.slice(1)) {
    const p = interpolate(f, [s.at, s.at + move], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
    if (p <= 0) break;
    cx += (s.cx - cx) * p;
    cy += (s.cy - cy) * p;
    w = Math.exp(Math.log(w) + (Math.log(s.w) - Math.log(w)) * p); // zoom feels even when eased in log space
  }
  return {cx, cy, w};
};

/** Where a photo sits on screen for a camera (cx, cy, w in % of the photo), never showing past its edges. */
export const photoView = (aspect: number, cam: {cx: number; cy: number; w: number}, drift = 0) => {
  const wMax = Math.min(100, (100 * FRAME_W) / (FRAME_H * aspect)); // wider than this would show the edges
  const w = Math.min(wMax, cam.w * (1 - drift));
  const W = FRAME_W / (w / 100), H = W / aspect;
  const left = Math.min(0, Math.max(FRAME_W - W, FRAME_W / 2 - (cam.cx / 100) * W));
  const top = Math.min(0, Math.max(FRAME_H - H, FRAME_H / 2 - (cam.cy / 100) * H));
  // the picture is laid out once, large, and only moved and scaled down by a transform: sub-pixel smooth (moving it
  // by left/top/width/height snaps to whole pixels every frame and the slow moves shake), and never scaled up (sharp)
  const baseW = FRAME_W * 3;
  const style: React.CSSProperties = {position: 'absolute', left: 0, top: 0, width: baseW, height: baseW / aspect, maxWidth: 'none',
    transform: `translate(${left}px, ${top}px) scale(${W / baseW})`, transformOrigin: '0 0'};
  return {left, top, W, H, style, toScreen: (x: number, y: number) => [left + (x / 100) * W, top + (y / 100) * H] as [number, number]};
};

/** A red tag with a hand-drawn arrow to a point on screen (px, py); `t` = frames since it appeared. */
/** `settledX`: where the point is on screen once the camera has stopped; the tag picks its side from it once, so it never
 *  jumps from one side to the other while the camera is still moving. */
export const PointerTag: React.FC<{px: number; py: number; text: string; t: number; opacity?: number; settledX?: number; settledY?: number; side?: 'left' | 'right';
  face?: {rx: number; ry: number}}> = ({px, py, text, t, opacity = 1, settledX, settledY, side, face}) => {
  // a tag only points at what is on screen (the build rejects a tag whose point is outside its shot)
  if (t < 0 || opacity <= 0 || px < 80 || px > FRAME_W - 80 || py < 80 || py > FRAME_H - 80) return null;
  const show = interpolate(t, [0, 8], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.6))});
  const o = Math.min(show, opacity);
  // the tag sits above the point, on the side facing the middle of the screen, never off screen
  // the tag sits left of the point (right = true) or right of it; the build sets `side` for tags aimed at a face
  const right = side ? side === 'left' : (settledX ?? px) > FRAME_W / 2;
  const tagW = textWidth(text, 56, 600) + 56, tagH = 87; // the house tag: 56 px Poppins SemiBold in an 87 px box
  // aimed at a face: the tag sits up and to the side of the head, clear of it, so the arrow has room to curve onto it
  const tx = Math.max(40, Math.min(FRAME_W - tagW - 40, face ? (right ? px - face.rx - 110 - tagW : px + face.rx + 110) : (right ? px - tagW - 170 : px + 170)));
  // above the point; when there is no room above (a point near the top of the frame), below it instead, never
  // squeezed against the edge
  // decided once, where the camera settles (the slow drift must never flip the tag from below to above mid-shot)
  const ref = settledY ?? py;
  const roomAbove = (face ? ref - face.ry - 150 : ref - 210) >= 40;
  const ty = roomAbove ? Math.max(40, face ? py - face.ry - 150 : py - 210) : Math.min(FRAME_H - tagH - 40, face ? py + face.ry + 70 : py + 130);
  const ax = right ? tx + tagW : tx, ay = ty + tagH / 2; // where the arrow leaves the tag
  const draw = interpolate(t, [4, 18], [0, 1], clamp);
  let gx = px + (ax - px) * 0.12, gy = py + (ay - py) * 0.12; // stop just short of the point
  if (face) {
    // (px, py) is the face centre: stop on the face's outline, a small gap outside it, on the line toward the tag
    const th = Math.atan2(ay - py, ax - px);
    const r = (face.rx * face.ry) / Math.sqrt((face.ry * Math.cos(th)) ** 2 + (face.rx * Math.sin(th)) ** 2) + 6;
    gx = px + r * Math.cos(th); gy = py + r * Math.sin(th);
  }
  const mx = (ax + gx) / 2, my = Math.min(ay, gy) - 60; // a gentle curve
  const ang = Math.atan2(gy - my, gx - mx);
  return <>
    <svg width={FRAME_W} height={FRAME_H} style={{position: 'absolute', inset: 0, opacity: o}}>
      <path d={`M ${ax} ${ay} Q ${mx} ${my} ${gx} ${gy}`} fill="none" stroke={CREAM} strokeWidth={5} strokeLinecap="round"
        pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} style={{filter: 'drop-shadow(0 2px 4px rgba(0,0,0,.6))'}} />
      {draw >= 1 ? <path d={`M ${gx} ${gy} l ${-22 * Math.cos(ang - 0.45)} ${-22 * Math.sin(ang - 0.45)} M ${gx} ${gy} l ${-22 * Math.cos(ang + 0.45)} ${-22 * Math.sin(ang + 0.45)}`}
        stroke={CREAM} strokeWidth={5} strokeLinecap="round" fill="none" /> : null}
    </svg>
    <RedTag text={text} left={tx} top={ty} show={show} opacity={o} origin={right ? 'right center' : 'left center'} t={t} />
  </>;
};

/** A tag in the reference style (RefKit): channel-colour box at its full width, cream Poppins text that types in one
 *  character per frame (`t` = frames since the tag appeared; without it the whole text shows). */
export const RedTag: React.FC<{text: string; left: number; top: number; show: number; opacity?: number; origin?: string; size?: number; t?: number}> = ({text, left, top, show, opacity = 1, origin = 'left center', size = 56, t}) => {
  // the references' tag (measured: 56 px Poppins SemiBold in an 87 px box) in the shared tag animation; the box grows
  // from the side that faces its arrow
  if (show <= 0) return null;
  return <div style={{position: 'absolute', left: 0, top: 0, transform: `translate3d(${Math.round(left)}px, ${Math.round(top)}px, 0)`, opacity}}>
    <TagBox text={text} frame={t ?? 999} start={0} size={size} rtl={false} anchor={origin.startsWith('right') ? 'right' : 'left'} />
  </div>;
};

export const tagOpacity = (f: number, until: number) => interpolate(f, [until - 6, until], [1, 0], clamp);

export const StoryPhoto: React.FC<{src: string; aspect: number; shots: StoryShot[]; tags?: StoryTag[]; durationFrames: number; revealShift?: number;
  move?: number; focusPull?: boolean}> = ({src, aspect, shots, tags = [], durationFrames, revealShift = 0, move = MOVE, focusPull = false}) => {
  const clock = useCurrentFrame();
  const f = clock - revealShift;
  const cam = camera(shots, f, move);
  // a slow drift inside every shot so the picture never stops moving
  const v = photoView(aspect, cam, 0.00045 * Math.max(0, clock));
  // detail reveal: the first detail starts soft and comes into focus, a dark vignette lifts as the camera pulls back
  const blur = focusPull ? interpolate(f, [0, 10], [3, 0], clamp) : 0; // on screen, in pixels: a light focus pull
  const vignette = focusPull ? interpolate(cam.w, [20, 90], [0.4, 0], clamp) : 0; // light: the channel look adds its own
  return <AbsoluteFill style={{overflow: 'hidden', background: '#111'}}>
    <Img src={staticFile(src)} style={{...v.style, filter: blur ? `blur(${blur / (v.W / (FRAME_W * 3))}px)` : undefined}} />
    {vignette ? <AbsoluteFill style={{background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,${vignette}) 100%)`}} /> : null}
    {tags.map((t, i) => {
      // a tag never arrives while the camera is still travelling (it would slide across the screen with the picture):
      // it waits until the move that is under way when it is due has settled
      const moving = shots.find((sh) => sh.at > 0 && sh.at <= t.at && t.at < sh.at + move);
      const at = moving ? moving.at + move : t.at;
      if (f < at) return null;
      const [px, py] = v.toScreen(t.x, t.y);
      const [settledX, settledY] = photoView(aspect, camera(shots, at + 6, move)).toScreen(t.x, t.y);
      return <PointerTag key={i} px={px} py={py} settledX={settledX} settledY={settledY} side={t.side} face={t.face ? {rx: (t.face[2] / 200) * v.W * 0.72, ry: (t.face[3] / 200) * v.H * 0.85} : undefined} text={t.text} t={f - at} opacity={tagOpacity(f, t.until ?? durationFrames + revealShift)} />;
    })}
  </AbsoluteFill>;
};
