import React from 'react';
import {AbsoluteFill, Easing, Freeze, Img, interpolate, OffthreadVideo, staticFile, useCurrentFrame} from 'remotion';
import {CREAM, INK, PAPER, RED, clamp, easeOut, paperFilter, paperVeil, textBase} from './channelStyle';
import {FRAME_H, FRAME_W, PointerTag, RedTag, camera, photoView, tagOpacity, type StoryShot} from './StoryPhoto';

/**
 * Motion pieces (2026-10-21): the documentary moves of the owner's reference, each for a different kind of moment so
 * the opening never repeats itself. All coordinates are in % of the picture; every `at` is a frame of the beat, set on
 * the word it belongs to.
 *
 * T30 Spotlight      a photo darkens except a soft light on one person; the light moves from face to face, each named
 * T31 EvidenceBoard  photos and documents pinned on a dark board; red string draws from one to the next as the camera travels
 * T32 MapDive        a map, the camera dives into a place, then the place itself (photo or film) takes over
 * T33 FreezeFrame    archive film plays, freezes on a face, the camera pushes in and a tag names him
 * T34 Triptych       two or three tall photos slide in side by side to fill the screen, each labelled
 * (T29 Detail reveal is StoryPhoto starting close on a detail and pulling back, see BeatView)
 */

// ------------------------------------------------------------------ T30 Spotlight

export type Spot = {at: number; x: number; y: number; r: number; text?: string};

export const Spotlight: React.FC<{src: string; aspect: number; spots: Spot[]; durationFrames: number; revealShift?: number}> = ({src, aspect, spots, durationFrames, revealShift = 0}) => {
  const clock = useCurrentFrame();
  const f = clock - revealShift;
  const list = [...spots].sort((a, b) => a.at - b.at);
  // the light travels like a camera move between spots; the camera itself leans a little toward the lit face
  let x = list[0]?.x ?? 50, y = list[0]?.y ?? 50, r = list[0]?.r ?? 20;
  for (const s of list.slice(1)) {
    const p = interpolate(f, [s.at, s.at + 20], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
    if (p <= 0) break;
    x += (s.x - x) * p; y += (s.y - y) * p; r += (s.r - r) * p;
  }
  const dark = interpolate(f, [(list[0]?.at ?? 0) - 6, (list[0]?.at ?? 0) + 10], [0, 0.72], clamp);
  const v = photoView(aspect, {cx: 50 + (x - 50) * 0.25, cy: 50 + (y - 50) * 0.25, w: 92}, 0.0004 * Math.max(0, clock));
  const [sx, sy] = v.toScreen(x, y);
  const R = (r / 100) * v.W;
  const current = [...list].reverse().find((s) => f >= s.at);
  return <AbsoluteFill style={{overflow: 'hidden', background: '#111'}}>
    <Img src={staticFile(src)} style={v.style} />
    <AbsoluteFill style={{background: `radial-gradient(circle ${R * 1.25}px at ${sx}px ${sy}px, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 62%, rgba(0,0,0,${dark}) 100%)`}} />
    <svg width={FRAME_W} height={FRAME_H} style={{position: 'absolute', inset: 0, opacity: dark / 0.72}}>
      <circle cx={sx} cy={sy} r={R} fill="none" stroke={CREAM} strokeWidth={4} strokeDasharray="14 10" opacity={0.85} />
    </svg>
    {/* the name sits centred under the circle (kept inside the screen) */}
    {current?.text ? (() => {
      const show = interpolate(f, [current.at + 12, current.at + 20], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.6))});
      return <div style={{position: 'absolute', left: 60, right: 60, top: 0, height: 0, transform: `translateY(${Math.min(FRAME_H - 110, sy + R + 24)}px)`}}>
        <div style={{position: 'absolute', left: Math.max(0, Math.min(FRAME_W - 120, sx - 60)), top: 0, transform: 'translateX(-50%)', display: 'flex'}}>
          <div style={{background: RED, color: CREAM, ...textBase, fontWeight: 800, fontSize: 44, padding: '10px 26px', borderRadius: 6, whiteSpace: 'nowrap',
            boxShadow: '0 8px 20px rgba(0,0,0,.45)', opacity: Math.min(show, tagOpacity(f, durationFrames + revealShift)),
            transform: `scale(${0.7 + 0.3 * show})`, transformOrigin: 'center top'}}>{current.text}</div>
        </div>
      </div>;
    })() : null}
  </AbsoluteFill>;
};

// ------------------------------------------------------------------ T31 Evidence board

export type BoardItem = {src: string; aspect: number; label?: string};

/** Items are laid out by the template on a dark board (left to right, alternating up and down); the camera visits
 *  item i at frame visits[i]; the string from item i-1 to item i draws as the camera travels. */
export const EvidenceBoard: React.FC<{items: BoardItem[]; visits: number[]; durationFrames: number; revealShift?: number}> = ({items, visits, durationFrames, revealShift = 0}) => {
  const clock = useCurrentFrame();
  const f = clock - revealShift;
  const BW = 1250 * items.length + 500, BH = Math.max(2000, (BW * 9) / 16); // the board, in its own pixels (whole board fits the screen)
  const placed = items.map((it, i) => {
    const h = 900, w = Math.min(1100, h * it.aspect);
    const cx = 875 + i * 1250, cy = BH / 2 + (i % 2 ? 260 : -260);
    return {...it, w, h: w / it.aspect, cx, cy, rot: [-3, 2.5, -1.5, 3, -2][i % 5]};
  });
  // the camera: close on the first item, along the string to each next one, and back to the whole board at the end
  const close = placed.map((p, i) => ({at: i === 0 ? 0 : visits[i] ?? i * 60, cx: (100 * p.cx) / BW, cy: (100 * p.cy) / BH, w: (100 * 2000) / BW}));
  const last = visits[placed.length - 1] ?? (placed.length - 1) * 60;
  const shots: StoryShot[] = [...close, ...(durationFrames - last > 70 ? [{at: last + 45, cx: 50, cy: 50, w: 100}] : [])];
  const cam = camera(shots, f, 30);
  const v = photoView(BW / BH, cam, 0.0003 * Math.max(0, clock));
  const k = v.W / BW; // board pixels -> screen pixels
  return <AbsoluteFill style={{overflow: 'hidden', background: '#2a2620'}}>
    <div style={{position: 'absolute', left: 0, top: 0, width: BW, height: BH, transform: `translate(${v.left}px, ${v.top}px) scale(${k})`, transformOrigin: '0 0'}}>
      {/* the board is the channel's paper */}
      <Img src={staticFile(PAPER)} style={{position: 'absolute', inset: 0, width: BW, height: BH, objectFit: 'cover', filter: paperFilter('brightness(1.05) saturate(.7)')}} />
      <div style={{position: 'absolute', inset: 0, background: paperVeil('rgba(247,243,223,.25)'), boxShadow: 'inset 0 0 260px rgba(60,40,20,.35)'}} />
      <svg width={BW} height={BH} style={{position: 'absolute', inset: 0}}>
        {placed.slice(1).map((p, i) => {
          const a = placed[i];
          const t = visits[i + 1] ?? (i + 1) * 60;
          const draw = interpolate(f, [t - 8, t + 22], [0, 1], clamp);
          if (draw <= 0) return null;
          const x1 = a.cx, y1 = a.cy - a.h / 2 + 30, x2 = p.cx, y2 = p.cy - p.h / 2 + 30;
          return <path key={i} d={`M ${x1} ${y1} Q ${(x1 + x2) / 2} ${Math.max(y1, y2) + 90} ${x2} ${y2}`} fill="none" stroke={RED}
            strokeWidth={9} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} strokeLinecap="round"
            style={{filter: 'drop-shadow(0 4px 3px rgba(0,0,0,.35))'}} />;
        })}
      </svg>
      {placed.map((p, i) => {
        const pop = easeOut(f, (visits[i] ?? i * 60) - 30, (visits[i] ?? i * 60) - 14);
        return <div key={i} style={{position: 'absolute', left: p.cx - p.w / 2, top: p.cy - p.h / 2, width: p.w, height: p.h,
          transform: `rotate(${p.rot}deg) scale(${0.94 + 0.06 * pop})`, opacity: i === 0 ? 1 : Math.max(0.45, pop),
          background: '#fbf8f0', padding: 14, boxShadow: '0 22px 34px rgba(0,0,0,.35)'}}>
          <Img src={staticFile(p.src)} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'sepia(.1) contrast(1.05)'}} />
          <div style={{position: 'absolute', left: '50%', top: -16, width: 44, height: 44, marginLeft: -22, borderRadius: '50%',
            background: `radial-gradient(circle at 35% 35%, #ff6b5e, ${RED})`, boxShadow: '0 5px 7px rgba(0,0,0,.45)'}} />
          {p.label ? <div style={{position: 'absolute', left: -60, right: -60, bottom: -96, textAlign: 'center', ...textBase, fontWeight: 800,
            fontSize: 62, color: INK}}>{p.label}</div> : null}
        </div>;
      })}
    </div>
  </AbsoluteFill>;
};

// ------------------------------------------------------------------ T32 Map dive

export const MapDive: React.FC<{map: string; mapAspect: number; x: number; y: number; place: string; photo?: string; photoAspect?: number;
  video?: string; diveAt: number; landAt: number; durationFrames: number; revealShift?: number}> = ({map, mapAspect, x, y, place, photo, photoAspect = 16 / 9, video, diveAt, landAt, durationFrames, revealShift = 0}) => {
  const clock = useCurrentFrame();
  const f = clock - revealShift;
  const cam = camera([{at: 0, cx: 50, cy: 50, w: 100}, {at: diveAt, cx: x, cy: y, w: 14}], f, Math.max(20, landAt - diveAt));
  const v = photoView(mapAspect, cam, 0.0003 * Math.max(0, clock));
  const [px, py] = v.toScreen(x, y);
  const pin = easeOut(f, 8, 20);
  const pulse = (f % 30) / 30;
  const cross = interpolate(f, [landAt - 6, landAt + 10], [0, 1], clamp); // the place itself takes over
  const pv = photoView(photoAspect, {cx: 50, cy: 50, w: interpolate(f, [landAt - 6, durationFrames], [60, 92], clamp)});
  return <AbsoluteFill style={{overflow: 'hidden', background: '#111'}}>
    <Img src={staticFile(map)} style={{...v.style, filter: 'sepia(.15) saturate(.9)'}} />
    <svg width={FRAME_W} height={FRAME_H} style={{position: 'absolute', inset: 0, opacity: pin * (1 - cross)}}>
      <circle cx={px} cy={py} r={18 + 60 * pulse} fill="none" stroke={RED} strokeWidth={5} opacity={1 - pulse} />
      <circle cx={px} cy={py} r={16} fill={RED} stroke={CREAM} strokeWidth={5} />
    </svg>
    {cross > 0 ? <AbsoluteFill style={{opacity: cross}}>
      {video ? <OffthreadVideo muted src={staticFile(video)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        : photo ? <Img src={staticFile(photo)} style={pv.style} /> : null}
    </AbsoluteFill> : null}
    <RedTag text={place} left={cross > 0.5 ? 80 : Math.min(FRAME_W - 26 * place.length - 120, px + 40)} top={cross > 0.5 ? FRAME_H - 170 : Math.max(40, py - 110)}
      show={easeOut(f, 16, 26)} origin="left center" />
  </AbsoluteFill>;
};

// ------------------------------------------------------------------ T33 Freeze frame

export const FreezeFrame: React.FC<{video: string; freezeAt: number; x: number; y: number; w?: number; text: string; durationFrames: number; revealShift?: number}> = ({video, freezeAt, x, y, w = 38, text, durationFrames, revealShift = 0}) => {
  const clock = useCurrentFrame();
  const f = clock - revealShift;
  const frozen = f >= freezeAt;
  const cam = camera([{at: 0, cx: 50, cy: 50, w: 100}, {at: freezeAt + 4, cx: x, cy: y, w}], f, 22);
  const v = photoView(16 / 9, cam);
  const [px, py] = v.toScreen(x, y);
  const flash = interpolate(f, [freezeAt, freezeAt + 2, freezeAt + 9], [0, 0.85, 0], clamp);
  const film = <OffthreadVideo muted src={staticFile(video)} style={{width: '100%', height: '100%', objectFit: 'cover',
    filter: frozen ? 'grayscale(.55) contrast(1.15)' : undefined}} />;
  return <AbsoluteFill style={{overflow: 'hidden', background: '#111'}}>
    <div style={v.style}>
      {frozen ? <Freeze frame={freezeAt + revealShift}>{film}</Freeze> : film}
    </div>
    <AbsoluteFill style={{background: CREAM, opacity: flash}} />
    {frozen ? <PointerTag px={px} py={py} settledX={photoView(16 / 9, camera([{at: 0, cx: 50, cy: 50, w: 100}, {at: freezeAt + 4, cx: x, cy: y, w}], freezeAt + 40, 22)).toScreen(x, y)[0]}
      text={text} t={f - freezeAt - 30} opacity={tagOpacity(f, durationFrames + revealShift)} /> : null}
  </AbsoluteFill>;
};

// ------------------------------------------------------------------ T34 Triptych

export type Panel = {src: string; at: number; label?: string; position?: string};

export const Triptych: React.FC<{panels: Panel[]; durationFrames: number; revealShift?: number}> = ({panels, durationFrames, revealShift = 0}) => {
  const clock = useCurrentFrame();
  const f = clock - revealShift;
  const n = Math.max(1, panels.length), gap = 14, pw = (FRAME_W - gap * (n + 1)) / n;
  return <AbsoluteFill style={{overflow: 'hidden', background: '#0e0d0c'}}>
    {panels.map((p, i) => {
      const inn = interpolate(f, [p.at, p.at + 16], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
      const zoom = 1.04 + 0.0007 * Math.max(0, f - p.at);
      return <div key={i} style={{position: 'absolute', left: gap + i * (pw + gap), top: gap, width: pw, height: FRAME_H - 2 * gap, overflow: 'hidden',
        opacity: inn, transform: `translateY(${(1 - inn) * (i % 2 ? -80 : 80)}px)`}}>
        <Img src={staticFile(p.src)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: p.position ?? '50% 25%',
          transform: `scale(${zoom})`, transformOrigin: p.position ?? '50% 25%'}} />
        {/* the label is centred under its own photo */}
        {p.label ? <div style={{position: 'absolute', left: 0, right: 0, bottom: 34, display: 'flex', justifyContent: 'center'}}>
          <div style={{position: 'relative', background: RED, color: CREAM, ...textBase, fontWeight: 800, fontSize: 40, padding: '10px 26px',
            borderRadius: 6, whiteSpace: 'nowrap', boxShadow: '0 8px 20px rgba(0,0,0,.45)',
            opacity: Math.min(easeOut(f, p.at + 10, p.at + 20), tagOpacity(f, durationFrames + revealShift)),
            transform: `scale(${0.7 + 0.3 * easeOut(f, p.at + 10, p.at + 20)})`, transformOrigin: 'center bottom'}}>{p.label}</div>
        </div> : null}
      </div>;
    })}
  </AbsoluteFill>;
};
