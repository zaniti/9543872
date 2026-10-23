import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {layoutForAspectRatio, safeForegroundFrame} from './aspectFrame';

type PhotoShot = {
  src: string;
  durationInFrames?: number;
  fromScale?: number;
  layout?: 'landscape-cover' | 'aspect-safe';
  /** Source width divided by height; required whenever the full source is preserved. */
  aspectRatio?: number;
  objectPosition?: string;
  /** Zoom anchor in frame percentages (the face), defaults to objectPosition. */
  zoomOrigin?: string;
  /** Evidence graphics must remain sharp to their outer edge. */
  edgeTreatment?: 'lens' | 'none';
  /** A subject too tall or wide for the frame: the crop slides from `from` to `to` (object-positions) over the shot. */
  pan?: {from: string; to: string};
};

const lerpPosition = (from: string, to: string, t: number) => {
  const a = from.split(' ').map((v) => parseFloat(v));
  const b = to.split(' ').map((v) => parseFloat(v));
  return `${a[0] + (b[0] - a[0]) * t}% ${a[1] + (b[1] - a[1]) * t}%`;
};

const WIDTH = 1920;
const HEIGHT = 1080;
const DEFAULT_SHOT_FRAMES = 90;
// Measured from the supplied regular.mp4: 2.03% and 2.04% scale growth per second.
const ZOOM_PER_SECOND = 0.0205;

const defaultShots: PhotoShot[] = [
  {src: 'templates/clip4/field-clean.jpg'},
  {src: 'templates/clip4/barrels-clean.jpg'},
  {src: 'templates/clip4/aerial-clean.jpg'},
  {src: 'templates/clip5/group.jpg'},
  {src: 'templates/clip16/first-regular.jpg'},
];

/** Cover rectangle for a source of ratio r placed at object-position (px%, py%), like CSS object-fit: cover. */
const coverRect = (r: number | undefined, position: string) => {
  const [px, py] = position.split(' ').map((v) => parseFloat(v) / 100);
  if (!r || !Number.isFinite(r)) return {x: 0, y: 0, width: WIDTH, height: HEIGHT};
  if (r >= WIDTH / HEIGHT) {
    const width = HEIGHT * r;
    return {x: -(width - WIDTH) * (Number.isFinite(px) ? px : 0.5), y: 0, width, height: HEIGHT};
  }
  const height = WIDTH / r;
  return {x: 0, y: -(height - HEIGHT) * (Number.isFinite(py) ? py : 0.5), width: WIDTH, height};
};

const LensTreatment: React.FC<{image: string; transform: string; uniqueId: string; rect: {x: number; y: number; width: number; height: number}}> = ({image, transform, uniqueId, rect}) => {
  const edgeMask = `${uniqueId}-edge-mask`;
  const edgeFocus = `${uniqueId}-edge-focus`;
  const edgeBlur = `${uniqueId}-edge-blur`;
  const redChannel = `${uniqueId}-red-channel`;
  const cyanChannel = `${uniqueId}-cyan-channel`;

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width="100%" height="100%" style={{display: 'block'}}>
      <defs>
        {/* The channel look (Look.tsx) adds the grain, dots, RGB split and corner softness over every template; this
            shot adds none of its own (the owner, 2026-10-23: one look everywhere). */}
        <radialGradient id={edgeFocus} cx="50%" cy="48%" rx="67%" ry="76%">
          <stop offset="0%" stopColor="#000" />
          <stop offset="57%" stopColor="#000" />
          <stop offset="74%" stopColor="#4d4d4d" />
          <stop offset="100%" stopColor="#fff" />
        </radialGradient>
        <mask id={edgeMask} maskUnits="userSpaceOnUse" x="0" y="0" width={WIDTH} height={HEIGHT}>
          <rect width={WIDTH} height={HEIGHT} fill={`url(#${edgeFocus})`} />
        </mask>
        <filter id={edgeBlur} x="-8%" y="-8%" width="116%" height="116%" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation="0" />
        </filter>
        <filter id={redChannel} colorInterpolationFilters="sRGB">
          <feColorMatrix values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" />
        </filter>
        <filter id={cyanChannel} colorInterpolationFilters="sRGB">
          <feColorMatrix values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" />
        </filter>
      </defs>
      <g transform={transform}>
        <image href={image} x={rect.x} y={rect.y} width={rect.width} height={rect.height} preserveAspectRatio="none" />
      </g>
      <g transform={transform} mask={`url(#${edgeMask})`} filter={`url(#${edgeBlur})`}>
        <image href={image} x={rect.x} y={rect.y} width={rect.width} height={rect.height} preserveAspectRatio="none" />
      </g>
      <g transform={`translate(.7 -.25) ${transform}`} mask={`url(#${edgeMask})`} filter={`url(#${redChannel})`} opacity="0" style={{mixBlendMode: 'screen'}}>
        <image href={image} x={rect.x} y={rect.y} width={rect.width} height={rect.height} preserveAspectRatio="none" />
      </g>
      <g transform={`translate(-.7 .25) ${transform}`} mask={`url(#${edgeMask})`} filter={`url(#${cyanChannel})`} opacity="0" style={{mixBlendMode: 'screen'}}>
        <image href={image} x={rect.x} y={rect.y} width={rect.width} height={rect.height} preserveAspectRatio="none" />
      </g>
    </svg>
  );
};

const RegularShot: React.FC<{shot: PhotoShot; startFrame: number; isLast: boolean}> = ({shot, startFrame, isLast}) => {
  const frame = useCurrentFrame();
  const durationInFrames = shot.durationInFrames ?? DEFAULT_SHOT_FRAMES;
  const localFrame = frame - startFrame;
  const progress = interpolate(localFrame, [0, durationInFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fromScale = shot.fromScale ?? 1;
  // a pan carries the motion: the push-in is halved so the two never fight
  const toScale = fromScale + (durationInFrames / 30) * ZOOM_PER_SECOND * (shot.pan ? 0.5 : 1);
  const scale = interpolate(progress, [0, 1], [fromScale, toScale]);
  const position = shot.pan
    ? lerpPosition(shot.pan.from, shot.pan.to, interpolate(progress, [0, 1], [0, 1], {easing: Easing.inOut(Easing.sin)}))
    : shot.objectPosition ?? '50% 50%';
  // The push-in is anchored on the focal point (faces), so heads never drift out of frame; a pan zooms on the centre.
  const [ox, oy] = (shot.pan ? '50% 50%' : shot.zoomOrigin ?? position).split(' ').map((v) => parseFloat(v) / 100);
  const originX = WIDTH * (Number.isFinite(ox) ? ox : 0.5);
  const originY = HEIGHT * (Number.isFinite(oy) ? oy : 0.5);
  const transform = `translate(${originX} ${originY}) scale(${scale}) translate(${-originX} ${-originY})`;
  const image = staticFile(shot.src);

  if (frame < startFrame || (!isLast && frame >= startFrame + durationInFrames)) {
    return null;
  }

  const resolvedLayout = shot.aspectRatio ? layoutForAspectRatio(shot.aspectRatio) : shot.layout;
  const aspectSafe = resolvedLayout === 'aspect-safe';
  // Aspect-safe media starts with its complete source rectangle in view (full height or full width) and then
  // pushes in at the same duration-driven rate as every other still, anchored on its focal point.
  const preserveWholeImage = aspectSafe;
  const safeOrigin = `${(Number.isFinite(ox) ? ox : 0.5) * 100}% ${(Number.isFinite(oy) ? oy : 0.5) * 100}%`;
  const foreground = preserveWholeImage ? (
    <div style={{...safeForegroundFrame(shot.aspectRatio), overflow: 'visible', transform: `scale(${scale})`, transformOrigin: safeOrigin}}>
      <Img src={image} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'none', boxShadow: '0 0 60px rgba(0,0,0,.35)'}} />
    </div>
  ) : shot.edgeTreatment === 'none' ? <Img src={image} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: position, transform: `scale(${scale})`, transformOrigin: shot.pan ? '50% 50%' : shot.zoomOrigin ?? position}} /> : <LensTreatment image={image} transform={transform} uniqueId={`regular-lens-${startFrame}`} rect={coverRect(shot.aspectRatio, position)} />;

  return (
    <AbsoluteFill style={{overflow: 'hidden', filter: 'none'}}>
      {preserveWholeImage ? <AbsoluteFill style={{opacity: .42, filter: 'blur(100px) brightness(.46) saturate(.56)', transform: `scale(${1.18 * (1 + (scale - fromScale) * 0.5)})`}}><Img src={image} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: shot.objectPosition ?? '50% 16%'}} /></AbsoluteFill> : null}
      {foreground}
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 72% 78% at 50% 48%, transparent 53%, rgba(18,14,8,.025) 72%, rgba(0,0,0,.13) 100%)', pointerEvents: 'none'}} />
      <div style={{position: 'absolute', inset: 0, opacity: .045, backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,.5) 0 1px, transparent 1px 3px)', mixBlendMode: 'soft-light', pointerEvents: 'none'}} />
    </AbsoluteFill>
  );
};

// SVG <image> elements do not delay a render while their asset is loading.
// Keep Remotion Img instances mounted from frame zero, so a direct cut never
// exposes a blank frame while the next photograph is decoded.
const PreloadShotAssets: React.FC<{shots: PhotoShot[]}> = ({shots}) => (
  <AbsoluteFill style={{opacity: 0, overflow: 'hidden', pointerEvents: 'none'}}>
    {shots.map((shot) => (
      <Img
        key={shot.src}
        src={staticFile(shot.src)}
        style={{position: 'absolute', width: 1, height: 1, left: -2, top: -2}}
      />
    ))}
  </AbsoluteFill>
);

/** Full-frame regular archival visual: restrained push-in with a sharp centre and subtle lens-softened corners. */
export const RegularPhotoZoom: React.FC<{shots?: PhotoShot[]}> = ({shots = defaultShots}) => (
  <AbsoluteFill style={{overflow: 'hidden', background: '#0e0d0b'}}>
    <PreloadShotAssets shots={shots} />
    {shots.map((shot, index) => {
      const startFrame = shots.slice(0, index).reduce((sum, priorShot) => sum + (priorShot.durationInFrames ?? DEFAULT_SHOT_FRAMES), 0);
      return <RegularShot key={shot.src} shot={shot} startFrame={startFrame} isLast={index === shots.length - 1} />;
    })}
  </AbsoluteFill>
);
