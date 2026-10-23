import React from 'react';
import {AbsoluteFill, Audio, Easing, Img, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Background} from './VariantTemplates';
import {CREAM, INK, RED, RevealText, TagBox, TagLetters, clamp, easeInOut, easeOut, tagDone, textBase} from './channelStyle';
import {DrawnArrow, TAG, TAG_BIG, TornPrint} from './RefKit';
import {Paper as PaperBg} from './RefKit2';

/**
 * The older templates rebuilt on the house pieces (the owner, 2026-10-23: "animation, text, color, dots, rgb and size
 * adapted to the new look so everything is one theme"). Same tags (TagBox), same text animation (RevealText), same
 * sizes as the reference kit: a year or keyword tag 75 px at the top right (100 from the top, 175 from the right), a
 * place or name tag 56-75 px, prints on paper with torn edges.
 */

type Bg = {background: string; backgroundVideo?: string; backgroundPosition?: string; revealShift?: number};

/** The year tag every template uses: top right, 75 px, typed from the right. */
export const YearCorner: React.FC<{year: string; f: number; at: number}> = ({year, f, at}) => year
  ? <div style={{position: 'absolute', top: 100, right: 175}}><TagBox text={year} frame={f} start={at} size={TAG_BIG} /></div> : null;

// ------------------------------------------------------------------ T1 / T2: place (and year)

/** The place in a tag at the bottom centre of the photo (75 px), then the year at the top right. */
export const PlaceYearRef: React.FC<Bg & {place: string; year?: string}> = ({background, backgroundVideo, backgroundPosition, place, year = '', revealShift = 0}) => {
  const clock = useCurrentFrame();
  const f = clock - revealShift;
  return <AbsoluteFill style={{overflow: 'hidden', background: '#111'}}>
    <Background src={background} video={backgroundVideo} position={backgroundPosition} frame={clock} />
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 102, display: 'flex', justifyContent: 'center'}}>
      <TagBox text={place} frame={f} start={8} size={TAG_BIG} />
    </div>
    <YearCorner year={year} f={f} at={tagDone(place, 8) + 4} />
  </AbsoluteFill>;
};

// ------------------------------------------------------------------ T1e: place with its coordinates

/** The coordinates tick in (small cream line), the place tag types under them; the year at the top right. */
export const CoordinatesRef: React.FC<Bg & {place: string; year?: string; coords?: string}> = ({background, backgroundVideo, backgroundPosition, place, year = '', coords = '', revealShift = 0}) => {
  const clock = useCurrentFrame();
  const f = clock - revealShift;
  const p = interpolate(f, [4, 26], [0, 1], clamp);
  // the digits roll toward their value while the line arrives
  const ticking = coords.replace(/\d/g, (d, i) => (p >= 1 ? d : String((Number(d) + Math.floor((1 - p) * 40) + i) % 10)));
  const placeAt = coords ? 14 : 6;
  return <AbsoluteFill style={{overflow: 'hidden', background: '#111'}}>
    <Background src={background} video={backgroundVideo} position={backgroundPosition} frame={clock} />
    <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 18% 22%, rgba(0,0,0,.45) 0%, rgba(0,0,0,.15) 40%, rgba(0,0,0,0) 65%)'}} />
    <div style={{position: 'absolute', left: 170, top: 100}}>
      {coords ? <div style={{...textBase, color: CREAM, fontWeight: 500, fontSize: 36, letterSpacing: 4, fontVariantNumeric: 'tabular-nums', marginBottom: 18,
        textShadow: '0 2px 10px rgba(0,0,0,.6)', whiteSpace: 'pre'}}><RevealText text={ticking} frame={f} start={2} /></div> : null}
      <TagBox text={place} frame={f} start={placeAt} size={TAG_BIG} />
    </div>
    {/* here the year sits at the bottom right, across from the place (the owner, 2026-10-23) */}
    {year ? <div style={{position: 'absolute', bottom: 102, right: 175}}><TagBox text={year} frame={f} start={tagDone(place, placeAt) + 4} size={TAG_BIG} /></div> : null}
  </AbsoluteFill>;
};

// ------------------------------------------------------------------ T1i: dateline

/** A news-wire dateline across the top: a dark band opens, the line types in letter by letter (the house tag motion,
 *  a letter rising in every 1.7 frames) with a blinking caret in the channel colour. */
export const DatelineRef: React.FC<Bg & {place: string; year?: string; date?: string}> = ({background, backgroundVideo, backgroundPosition, place, year = '', date = '', revealShift = 0}) => {
  const clock = useCurrentFrame();
  const f = clock - revealShift;
  const line = `${place.toUpperCase()} — ${(date || year).toUpperCase()}`;
  const open = easeInOut(f, 0, 8);
  const done = tagDone(line, 8);
  const caret = f < done || Math.floor(f / 8) % 2 === 0;
  return <AbsoluteFill style={{overflow: 'hidden', background: '#111'}}>
    {/* soft key clicks, one per letter, quiet under the voice (the owner: "not too aggressive") */}
    <Sequence from={8 + revealShift} durationInFrames={Math.max(1, Math.round(done - 8))}>
      <Audio src={staticFile('sfx/type_soft.wav')} volume={0.22} />
    </Sequence>
    <Background src={background} video={backgroundVideo} position={backgroundPosition} frame={clock} />
    <div style={{position: 'absolute', left: 0, right: 0, top: 100, height: 116, background: 'rgba(10,10,10,.78)', clipPath: `inset(0 ${(1 - open) * 100}% 0 0)`}}>
      <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: 14, background: RED}} />
      <div style={{position: 'absolute', left: 170, top: 0, bottom: 0, display: 'flex', alignItems: 'center', overflow: 'hidden', ...textBase, color: CREAM,
        fontWeight: 600, fontSize: 50, letterSpacing: 4, whiteSpace: 'pre'}}>
        <TagLetters text={line} frame={f} start={8} rtl={false} />
        <span style={{display: 'inline-block', width: 22, height: 50, marginLeft: 8, background: caret && f >= 8 ? RED : 'transparent'}} />
      </div>
    </div>
  </AbsoluteFill>;
};

// ------------------------------------------------------------------ T1j: rubber stamp

/** The place and date stamped in the channel colour on a cream paper label, so the ink reads on any photo (the owner:
 *  "sometimes not visible"). The label drops, the stamp hits it. */
export const StampRef: React.FC<Bg & {place: string; year?: string; date?: string}> = ({background, backgroundVideo, backgroundPosition, place, year = '', date = '', revealShift = 0}) => {
  const clock = useCurrentFrame();
  const f = clock - revealShift;
  const card = interpolate(f, [0, 10], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const hit = 12;
  const s = f < hit ? 1.5 : f < hit + 3 ? interpolate(f, [hit, hit + 3], [1.08, 1], clamp) : 1;
  return <AbsoluteFill style={{overflow: 'hidden', background: '#111'}}>
    <Background src={background} video={backgroundVideo} position={backgroundPosition} frame={clock} />
    <svg width={0} height={0} style={{position: 'absolute'}}>
      <filter id="stampInk2" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves={2} seed={4} result="n" />
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.1 1.45" result="holes" />
        <feComposite in="SourceGraphic" in2="holes" operator="in" result="inked" />
        <feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves={1} seed={9} result="w" />
        <feDisplacementMap in="inked" in2="w" scale={4} />
      </filter>
    </svg>
    {/* no board (the owner, 2026-10-23): the stamp sits on the footage over a soft darkened patch carrying the same printed
        dot texture as the channel look, so the ink reads on any picture */}
    <div style={{position: 'absolute', right: 150, top: 120, padding: '34px 44px', transform: 'rotate(-2.5deg)'}}>
      <div style={{position: 'absolute', inset: -70, opacity: card,
        background: 'radial-gradient(rgba(255,255,255,.22) 1.3px, transparent 1.9px) 0 0 / 7px 7px, rgba(8,8,8,.62)',
        maskImage: 'radial-gradient(ellipse at center, black 45%, transparent 72%)', WebkitMaskImage: 'radial-gradient(ellipse at center, black 45%, transparent 72%)'}} />
      <div style={{position: 'relative'}}>
      {f >= hit ? <div style={{transform: `scale(${s})`, transformOrigin: 'center', filter: 'url(#stampInk2)'}}>
        <div style={{border: `8px solid ${RED}`, padding: 7}}>
          <div style={{border: `3px solid ${RED}`, padding: '16px 36px 14px', textAlign: 'center'}}>
            <div style={{...textBase, color: RED, fontWeight: 700, fontSize: 70, letterSpacing: 5, lineHeight: 1}}>{place.toUpperCase()}</div>
            <div style={{height: 4, background: RED, margin: '12px 0 10px'}} />
            <div style={{...textBase, color: RED, fontWeight: 700, fontSize: 44, letterSpacing: 7, lineHeight: 1}}>{(date || year).toUpperCase()}</div>
          </div>
        </div>
      </div> : <div style={{visibility: 'hidden', border: '8px solid', padding: 7}}><div style={{border: '3px solid', padding: '16px 36px 14px', textAlign: 'center'}}>
        <div style={{...textBase, fontWeight: 700, fontSize: 70, letterSpacing: 5, lineHeight: 1}}>{place.toUpperCase()}</div><div style={{height: 4, margin: '12px 0 10px'}} />
        <div style={{...textBase, fontWeight: 700, fontSize: 44, letterSpacing: 7, lineHeight: 1}}>{(date || year).toUpperCase()}</div></div></div>}
      </div>
    </div>
  </AbsoluteFill>;
};

// ------------------------------------------------------------------ T5: a person introduced over a scene

/** The scene darkens and the person's torn polaroid rises in the middle, the name typed in its margin (the same card
 *  as the name card T7, over a photo instead of paper). */
export const PortraitOnScene: React.FC<Bg & {portrait: string; portraitAspect?: number; portraitPosition?: string; name: string}> = ({background, backgroundVideo, backgroundPosition,
  portrait, portraitAspect = 0.78, portraitPosition, name, revealShift = 0}) => {
  const clock = useCurrentFrame();
  const f = clock - revealShift;
  const h = 640, w = Math.max(440, Math.min(560, h * portraitAspect));
  const p = interpolate(f, [6, 20], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const W = w + 2 * Math.round(w * 0.04), H = h + Math.round(w * 0.04) + Math.round(42 * 2.6);
  return <AbsoluteFill style={{overflow: 'hidden', background: '#111'}}>
    <Background src={background} video={backgroundVideo} position={backgroundPosition} frame={clock} />
    <AbsoluteFill style={{background: '#000', opacity: 0.42 * easeOut(f, 0, 12)}} />
    <div style={{position: 'absolute', left: 960 - W / 2, top: 540 - H / 2, opacity: Math.min(1, p * 1.4), transform: `translateY(${(1 - p) * 140}px)`,
      filter: p < 1 ? `blur(${(1 - p) * 6}px)` : undefined}}>
      <TornPrint src={portrait} w={w} h={h} position={portraitPosition} name={name} nameAt={20} nameSize={42} f={f} seed={11} />
    </div>
  </AbsoluteFill>;
};

// ------------------------------------------------------------------ T26: place circled on a map, label

/** The label of the hand-circled place: the house tag (56 px). */
export const CircleLabel: React.FC<{text: string; f: number; at: number}> = ({text, f, at}) => <TagBox text={text} frame={f} start={at} size={TAG} />;

// ------------------------------------------------------------------ T13: a document card over a scene

/**
 * The document card rises over the scene; once it has landed, a short flash and the camera pushes into the part that
 * matters (`box`, % of the document: [x, y, w, h]), and that phrase is marked with a highlighter stroke in the channel
 * colour. Without a box it pushes gently into the middle of the page.
 */
export const DocumentOverScene: React.FC<Bg & {doc: string; aspect: number; box?: [number, number, number, number]; marker?: string}> = ({background, backgroundVideo, backgroundPosition, doc, aspect, box, marker = '#ffe14d', revealShift = 0}) => {
  const clock = useCurrentFrame();
  const f = clock - revealShift;
  const p = interpolate(f, [8, 28], [0, 1], {easing: Easing.bezier(0.22, 0.78, 0.27, 1), ...clamp});
  const maxW = 560, maxH = 800;
  const w = Math.min(maxW, maxH * aspect), h = w / aspect;
  const zoomAt = 36;
  const z = interpolate(f, [zoomAt, zoomAt + 16], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const flash = interpolate(f, [zoomAt, zoomAt + 2, zoomAt + 9], [0, 0.55, 0], clamp);
  const [bx, by, bw, bh] = box ?? [20, 40, 60, 12];
  // the push: the phrase comes to the centre of the screen, about 2.2 times larger (never larger than the frame allows)
  const scale = 1 + z * Math.min(1.2, (1500 / (w * (bw / 100))) - 1);
  const fx = (bx + bw / 2) / 100 * w - w / 2, fy = (by + bh / 2) / 100 * h - h / 2;
  const mark = interpolate(f, [zoomAt + 16, zoomAt + 30], [0, 1], {...clamp, easing: Easing.inOut(Easing.quad)});
  return <AbsoluteFill style={{overflow: 'hidden', background: '#12100c'}}>
    <AbsoluteFill style={{transform: `scale(${1 + z * 0.15})`, filter: `blur(${z * 6}px)`}}>
      <Background src={background} video={backgroundVideo} position={backgroundPosition} frame={clock} filter="contrast(.96) saturate(.84)" />
    </AbsoluteFill>
    <AbsoluteFill style={{background: '#000', opacity: 0.15 + 0.25 * z}} />
    <div style={{position: 'absolute', left: 960 - w / 2, top: 540 - h / 2, width: w, height: h,
      transform: `translate(${-fx * (scale - 1)}px, ${-fy * (scale - 1)}px) scale(${scale})`, transformOrigin: `${50 + fx / w * 100}% ${50 + fy / h * 100}%`}}>
      <div style={{position: 'absolute', inset: -24, padding: 24, background: '#f4f0e6', boxShadow: '0 18px 35px rgba(0,0,0,.55)', opacity: Math.min(1, p * 3),
        transform: `translateY(${(1 - p) * 250}px) scale(${0.82 + 0.18 * p})`, transformOrigin: '50% 100%'}}>
        <div style={{position: 'relative', width: w, height: h}}>
          <Img src={staticFile(doc)} style={{display: 'block', width: '100%', height: '100%', objectFit: 'cover', filter: `blur(${(1 - p) * 10}px) contrast(.95)`}} />
          {/* the same highlighter as the newspaper template (T27): exactly over the words found by OCR (build: find=) */}
          {box ? <div style={{position: 'absolute', left: `calc(${bx}% - 4px)`, top: `calc(${by}% - 3px)`, width: `calc(${bw}% + 8px)`, height: `calc(${bh}% + 6px)`, background: marker,
            opacity: 0.55, mixBlendMode: 'multiply', transform: `scaleX(${mark})`, transformOrigin: 'left center', borderRadius: 3}} /> : null}
        </div>
      </div>
    </div>
    <AbsoluteFill style={{background: '#fff', opacity: flash}} />
  </AbsoluteFill>;
};

// ------------------------------------------------------------------ T15: quick burst of photos

/** Three to five photos in quick succession: each new one slides up over the last with a soft ease and a light
 *  motion blur; the one leaving darkens a little and drifts up more slowly (depth), so the cut always feels smooth. */
export const PhotoBurstRef: React.FC<{photos: string[]; positions?: string[]; durationFrames: number}> = ({photos, positions = [], durationFrames}) => {
  const f = useCurrentFrame();
  const n = Math.max(1, photos.length);
  const slot = durationFrames / n, T = Math.min(16, Math.round(slot * 0.55));
  const ease = (a: number) => interpolate(f, [a, a + T], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  return <AbsoluteFill style={{overflow: 'hidden', background: '#111'}}>
    {photos.map((src, i) => {
      const start = Math.round(i * slot) - (i === 0 ? 0 : T);
      const next = i + 1 < n ? Math.round((i + 1) * slot) - T : undefined;
      if (f < start - 1 || (next !== undefined && f > next + T + 1)) return null;
      const enter = i === 0 ? 1 : ease(start), leave = next === undefined ? 0 : ease(next);
      const speed = Math.abs(enter < 1 ? Math.sin(Math.PI * enter) : Math.sin(Math.PI * leave) * 0.4);
      return <div key={`${src}-${i}`} style={{position: 'absolute', inset: 0, zIndex: i, transform: `translateY(${(1 - enter) * 1080 - leave * 300}px)`,
        boxShadow: enter < 1 ? '0 -30px 60px rgba(0,0,0,.5)' : undefined}}>
        <Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: positions[i] ?? 'center',
          transform: `scale(${1.04 + Math.max(0, f - start) * 0.0004})`, filter: `blur(${speed * 3}px) brightness(${1 - leave * 0.35})`}} />
      </div>;
    })}
  </AbsoluteFill>;
};

export {INK};

// ------------------------------------------------------------------ T1d: place + year, the year huge

/** The year huge (the big-year style of T40: cream, a little depth, the digits arriving one by one), the place in a
 *  75 px tag under it. */
export const PlaceBigYearRef: React.FC<Bg & {place: string; year: string}> = ({background, backgroundVideo, backgroundPosition, place, year, revealShift = 0}) => {
  const clock = useCurrentFrame();
  const f = clock - revealShift;
  const size = Math.round(Math.min(330, 1500 / Math.max(1, year.length * 0.64)));
  const shown = Math.max(0, Math.min(year.length, Math.floor((f - 4) / 4) + 1));
  return <AbsoluteFill style={{overflow: 'hidden', background: '#111'}}>
    <Background src={background} video={backgroundVideo} position={backgroundPosition} frame={clock} />
    <AbsoluteFill style={{background: '#000', opacity: 0.25}} />
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 34}}>
      <div style={{position: 'relative', ...textBase, fontWeight: 800, fontSize: size, letterSpacing: 4, lineHeight: 1, whiteSpace: 'pre', color: CREAM,
        textShadow: [2, 4, 6, 8].map((d, i) => `0 ${Math.round((d * size) / 300)}px 0 ${['#c9c3b6', '#b3ad9f', '#9d9789', '#878173'][i]}`).join(', ') + ', 0 18px 36px rgba(0,0,0,.6)'}}>
        <span style={{visibility: 'hidden'}}>{year}</span>
        <span style={{position: 'absolute', left: 0, top: 0}}>{[...year].map((c, i) => <span key={i} style={{display: 'inline-block', opacity: i < shown ? 1 : 0,
          transform: `translateY(${i < shown ? 0 : 30}px)`}}>{c}</span>)}</span>
      </div>
      <TagBox text={place} frame={f} start={4 + year.length * 4 + 4} size={TAG_BIG} />
    </AbsoluteFill>
  </AbsoluteFill>;
};

// ------------------------------------------------------------------ T1g: the year counted back from today

/** The year counts back from today to the event in the big-year style (one colour all the way), then the place tag
 *  and "N years ago" arrive under it. */
export const YearsAgoRef: React.FC<Bg & {place: string; year: string; now?: number; agoLabel?: string}> = ({background, backgroundVideo, backgroundPosition, place, year,
  now = new Date().getFullYear(), agoLabel = 'years ago', revealShift = 0}) => {
  const clock = useCurrentFrame();
  const f = clock - revealShift;
  const target = Number(year) || now;
  const shown = Math.round(interpolate(f, [2, 46], [now, target], {...clamp, easing: Easing.out(Easing.cubic)}));
  const size = 300;
  const tagAt = 50;
  return <AbsoluteFill style={{overflow: 'hidden', background: '#111'}}>
    <Background src={background} video={backgroundVideo} position={backgroundPosition} frame={clock} />
    <AbsoluteFill style={{background: '#000', opacity: 0.28}} />
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 30}}>
      <div style={{...textBase, fontWeight: 800, fontSize: size, letterSpacing: 4, lineHeight: 1, color: CREAM, fontVariantNumeric: 'tabular-nums', opacity: f >= 2 ? 1 : 0,
        textShadow: [2, 4, 6, 8].map((d, i) => `0 ${Math.round((d * size) / 300)}px 0 ${['#c9c3b6', '#b3ad9f', '#9d9789', '#878173'][i]}`).join(', ') + ', 0 18px 36px rgba(0,0,0,.6)'}}>{shown}</div>
      <div style={{display: 'flex', alignItems: 'center', gap: 26}}>
        <TagBox text={place} frame={f} start={tagAt} size={TAG_BIG} />
        {now > target ? <div style={{...textBase, fontWeight: 600, fontSize: 52, lineHeight: 1.3, color: CREAM, whiteSpace: 'pre', textShadow: '0 3px 12px rgba(0,0,0,.6)'}}>
          <RevealText text={`${now - target} ${agoLabel}`} frame={f} start={tagDone(place, tagAt) + 2} /></div> : null}
      </div>
    </AbsoluteFill>
  </AbsoluteFill>;
};

// ------------------------------------------------------------------ T8: two people

/** Two torn polaroids on the channel's paper (the house name card), their names typed in the margins, a thick drawn
 *  arrow between them. */
export const TwoPeopleRef: React.FC<{first: string; second: string; firstAspect?: number; secondAspect?: number; firstPosition?: string; secondPosition?: string;
  nameA: string; nameB: string; revealShift?: number}> = ({first, second, firstAspect = 0.78, secondAspect = 0.78, firstPosition, secondPosition, nameA, nameB, revealShift = 0}) => {
  const clock = useCurrentFrame();
  const f = clock - revealShift;
  const H = 560;
  const card = (src: string, aspect: number, pos: string | undefined, name: string, cx: number, at: number, seed: number, _tilt: number) => {
    const w = Math.round(Math.max(400, Math.min(500, H * aspect)));
    const W = w + 2 * Math.round(w * 0.04), Hc = H + Math.round(w * 0.04) + Math.round(40 * 2.6);
    const p = interpolate(f, [at, at + 12], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
    if (f < at) return null;
    return <div style={{position: 'absolute', left: cx - W / 2, top: 540 - Hc / 2, opacity: Math.min(1, p * 1.4), transform: `translateY(${(1 - p) * 140}px)`,
      filter: p < 1 ? `blur(${(1 - p) * 6}px)` : undefined}}>
      <TornPrint src={src} w={w} h={H} position={pos} name={name} nameAt={at + 10} nameSize={40} f={f} seed={seed} />
    </div>;
  };
  return <AbsoluteFill style={{overflow: 'hidden', background: '#d9d3c4'}}>
    <PaperBg frame={clock} />
    {card(first, firstAspect, firstPosition, nameA, 560, 0, 21, -1.5)}
    {card(second, secondAspect, secondPosition, nameB, 1360, 22, 22, 1.5)}
    <DrawnArrow x1={835} y1={470} x2={1085} y2={470} f={f} start={14} dur={12} bend={-0.25} color="#1b1a17" width={9} head={34} />
  </AbsoluteFill>;
};

// ------------------------------------------------------------------ T20: labels on one or two photos

/** One or two short labels (sides, groups, names of wars) in the house tag, low on the photo; with a second photo the
 *  picture cuts and the second label types on it. */
export const LabelsOnPhotoRef: React.FC<{first: string; second?: string; firstPosition?: string; secondPosition?: string; labelA: string; labelB?: string; durationFrames: number;
  revealShift?: number}> = ({first, second, firstPosition = '50% 50%', secondPosition = '50% 50%', labelA, labelB = '', durationFrames, revealShift = 0}) => {
  const clock = useCurrentFrame();
  const f = clock - revealShift;
  const cut = second ? Math.round(durationFrames * 0.42) : Infinity;
  const onSecond = clock >= cut;
  const startB = second ? cut + 12 : 46;
  return <AbsoluteFill style={{overflow: 'hidden', background: '#111'}}>
    <Background src={onSecond ? second! : first} position={onSecond ? secondPosition : firstPosition} frame={onSecond ? clock - cut : clock} />
    <div style={{position: 'absolute', left: 0, width: 960, bottom: 102, display: 'flex', justifyContent: 'center'}}><TagBox text={labelA} frame={f} start={13} size={TAG_BIG} /></div>
    {labelB ? <div style={{position: 'absolute', left: 960, width: 960, bottom: 102, display: 'flex', justifyContent: 'center'}}><TagBox text={labelB} frame={clock} start={startB} size={TAG_BIG} /></div> : null}
  </AbsoluteFill>;
};
