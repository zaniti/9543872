import React from 'react';
import {AbsoluteFill, Easing, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import type {ClaudeFuggerBeat} from './ClaudeFuggerTypes';
import {MetricPortraitCard} from './MetricPortraitCard';
import {RegularPhotoZoom} from './RegularPhotoZoom';
import {StatementOverlay} from './StatementOverlay';
import {TwoPhotoHeading} from './TwoPhotoHeading';
import {TimelineStrip, type TimelineEvent} from './NewTemplates';
import {DocumentMark, MapCircle, SentenceMarker, StatementPaper} from './VariantTemplates';
import {DocumentPair, MapPair} from './OriginalTemplates';
import {Letterbox, LocatorMap, LowerThird, PaperStrip} from './OpenerTemplates';
import {StoryPhoto, type StoryShot, type StoryTag} from './StoryPhoto';
import {Badge, ChainBoard, KeywordChips, YearTagRef} from './RefKit';
import {CoordinatesRef, DatelineRef, DocumentOverScene, LabelsOnPhotoRef, PhotoBurstRef, PlaceBigYearRef, PlaceYearRef, PortraitOnScene, StampRef, TwoPeopleRef, YearsAgoRef} from './RefKit4';
import {CutoutScene, FlowMap, RegionsMap, StackedLines} from './RefKit3';
import {BarsOnPaper, BetweenTwo, BigYearRef, DocumentQuote, FigureOnPaper, NumberedSteps, PercentRef, PortraitPrint, PrintsOnPaper, SentenceRef, ThenToday, type BarRow} from './RefKit2';
import {EvidenceBoard, FreezeFrame, MapDive, PathTrace, Spotlight, Triptych, type PathPoint, type Spot} from './MotionPieces';

export type Beat = ClaudeFuggerBeat & {revealShift?: number};
const gridPaper = 'templates/clip6/paper-grid.jpg';

/** Frames to build a scene early in the review player (see Job.tsx); 0 when rendering. */
export const Premount = React.createContext(0);

/** Engine-cut clips are already framed to 1920x1080 by the dimension rule; play them natively, muted, back to back. */
const EngineClips: React.FC<{beat: Beat}> = ({beat}) => {
  const premount = React.useContext(Premount);
  let from = 0;
  return <AbsoluteFill style={{background: '#111'}}>
    {(beat.assets[0].videoParts ?? []).map((part) => {
      const shot = <Sequence key={part.src} from={from} durationInFrames={part.durationFrames} premountFor={premount}>
        <OffthreadVideo muted src={staticFile(part.src)} style={{width: '100%', height: '100%', filter: 'saturate(.8) contrast(1.055) brightness(.95) sepia(.045)'}} />
      </Sequence>;
      from += part.durationFrames;
      return shot;
    })}
  </AbsoluteFill>;
};

/** Every template gets the face-aware crop (objectPosition) and a reveal shift that lands its key element on the spoken word. */
const BeatInner: React.FC<{beat: Beat}> = ({beat}) => {
  const [a, b, c] = beat.assets;
  const t = beat.text;
  const s = (key: string) => String(t[key] ?? '');
  const shift = beat.revealShift ?? 0;
  const bgPos = a?.objectPosition ?? '50% 50%';
  switch (beat.mode) {
    case 'T1': return <PlaceYearRef background={a.src} backgroundVideo={a.videoParts?.[0]?.src} place={s('title')} year={s('year')} backgroundPosition={bgPos} revealShift={shift} />;
    case 'T1b': return <PaperStrip background={a.src} backgroundVideo={a.videoParts?.[0]?.src} place={s('title')} year={s('year')} backgroundPosition={bgPos} revealShift={shift} />;
    case 'T1c': return <LowerThird background={a.src} backgroundVideo={a.videoParts?.[0]?.src} place={s('title')} year={s('year')} backgroundPosition={bgPos} revealShift={shift} />;
    case 'T1d': return <PlaceBigYearRef background={a.src} backgroundVideo={a.videoParts?.[0]?.src} place={s('title')} year={s('year')} backgroundPosition={bgPos} revealShift={shift} />;
    case 'T1f': return <LocatorMap background={a.src} backgroundVideo={a.videoParts?.[0]?.src} place={s('title')} year={s('year')} coords={s('coords')} span={Number(t.span) || 40} backgroundPosition={bgPos} revealShift={shift} />;
    case 'T1g': return <YearsAgoRef background={a.src} backgroundVideo={a.videoParts?.[0]?.src} place={s('title')} year={s('year')} agoLabel={s('ago') || undefined} backgroundPosition={bgPos} revealShift={shift} />;
    case 'T1h': return <Letterbox background={a.src} backgroundVideo={a.videoParts?.[0]?.src} place={s('title')} year={s('year')} region={s('region')} backgroundPosition={bgPos} revealShift={shift} />;
    case 'T1i': return <DatelineRef background={a.src} backgroundVideo={a.videoParts?.[0]?.src} place={s('title')} year={s('year')} date={s('date')} backgroundPosition={bgPos} revealShift={shift} />;
    case 'T1j': return <StampRef background={a.src} backgroundVideo={a.videoParts?.[0]?.src} place={s('title')} year={s('year')} date={s('date')} backgroundPosition={bgPos} revealShift={shift} />;
    case 'T1e': return <CoordinatesRef background={a.src} backgroundVideo={a.videoParts?.[0]?.src} place={s('title')} year={s('year')} coords={s('coords')} backgroundPosition={bgPos} revealShift={shift} />;
    case 'T2': return <PlaceYearRef background={a.src} backgroundVideo={a.videoParts?.[0]?.src} place={s('title')} backgroundPosition={bgPos} revealShift={shift} />;
    // T3: the year (or a range with yearEnd, or a date) typed into a tag at the top right; figure: a large figure on its cue
    case 'T3': return <YearTagRef background={a.src} position={bgPos} year={s('year') || s('date')} yearEnd={s('yearEnd') || undefined} figure={s('figure') || undefined}
      figureAt={beat.data?.figureAt as number | undefined} durationFrames={beat.durationFrames} revealShift={shift} />;
    case 'T36': return <ChainBoard people={beat.assets.map((x, i) => ({src: x.src, aspect: x.aspectRatio, position: x.objectPosition,
      name: ((beat.data?.names as string[]) ?? [])[i] ?? '', at: ((beat.data?.at as number[]) ?? [])[i] ?? 8 + i * 45}))} labels={beat.data?.labels as string[] | undefined} revealShift={shift} />;
    case 'T38': return <ThenToday background={beat.assets.find((x) => x.layout !== 'template-card')?.src} position={bgPos}
      card={beat.assets.find((x) => x.layout === 'template-card') ? {src: beat.assets.find((x) => x.layout === 'template-card')!.src, aspect: beat.assets.find((x) => x.layout === 'template-card')!.aspectRatio} : undefined}
      heading={s('heading') || undefined} label={s('label') || undefined} from={s('from')} to={s('to')} toWord={t.toWord === undefined ? undefined : s('toWord')} at={beat.data?.at as number[] | undefined} revealShift={shift} />;
    case 'T39': return <NumberedSteps background={a.src} position={bgPos} steps={(beat.data?.steps as string[]) ?? []} at={beat.data?.at as number[] | undefined} badge={s('badge') || undefined} revealShift={shift} />;
    case 'T40': return <BigYearRef backgrounds={beat.assets.map((x) => x.src)} text={s('year') || s('text')} revealShift={shift} durationFrames={beat.durationFrames} />;
    case 'T41': return <FigureOnPaper card={{src: a.src, aspect: a.aspectRatio}} heading={s('heading')} figure={s('figure')} at={beat.data?.at as number[] | undefined} revealShift={shift} />;
    case 'T42': return <BetweenTwo left={{src: a.src, aspect: a.aspectRatio}} right={{src: b.src, aspect: b.aspectRatio}} middle={c ? {src: c.src, aspect: c.aspectRatio} : undefined}
      labels={beat.data?.labels as string[] | undefined} at={beat.data?.at as number[] | undefined} revealShift={shift} />;
    case 'T44': return <DocumentQuote doc={{src: a.src, aspect: a.aspectRatio}} quote={s('quote')} figure={s('figure') || undefined} at={beat.data?.at as number[] | undefined} revealShift={shift} />;
    case 'T45': return <CutoutScene cutout={{src: a.src, aspect: a.aspectRatio}} background={b.src} position={b.objectPosition} revealAt={beat.data?.revealAt as number | undefined}
      side={beat.data?.side as 'left' | 'center' | 'right' | undefined} name={s('name') || undefined} revealShift={shift} />;
    case 'T46': return <RegionsMap view={beat.data?.view as [number, number, number, number]} countries={(beat.data?.countries as {name: string; at: number; label?: string}[]) ?? []} revealShift={shift} />;
    case 'T47': return <FlowMap map={a.src} position={bgPos} hub={beat.data?.hub as {x: number; y: number; label?: string}} targets={(beat.data?.targets as {x: number; y: number; label?: string; at: number}[]) ?? []}
      inward={Boolean(beat.data?.inward)} revealShift={shift} />;
    case 'T48': return <StackedLines background={a.src} position={bgPos} lines={(beat.data?.lines as string[]) ?? []} at={beat.data?.at as number[] | undefined} revealShift={shift} />;
    case 'T37': return <KeywordChips background={a.src} position={bgPos} words={(beat.data?.words as string[]) ?? []} at={beat.data?.at as number[] | undefined} spots={beat.data?.spots as {x: number; y: number}[] | undefined} revealShift={shift} />;
    case 'T5': return <PortraitOnScene background={a.src} backgroundVideo={a.videoParts?.[0]?.src} backgroundPosition={bgPos} portrait={b.src} portraitAspect={b.aspectRatio} portraitPosition={b.objectPosition} name={s('label')} revealShift={shift} />;
    case 'T6': return <MetricPortraitCard paper={gridPaper} portrait={a.src} portraitPosition={a.objectPosition} firstLead={s('firstLead')} firstEmphasis={s('firstEmphasis')} firstTail="" secondLead={s('secondLead')} secondEmphasis={s('secondEmphasis')} secondTail="" zoomDurationFrames={beat.durationFrames} revealShift={shift} secondStart={beat.data?.secondAt as number | undefined} />;
    case 'T7': return <PortraitPrint src={a.src} aspect={a.aspectRatio} position={a.objectPosition} name={s('name')} revealShift={shift} />;
    case 'T8': return <TwoPeopleRef first={a.src} second={b.src} firstAspect={a.aspectRatio} secondAspect={b.aspectRatio} firstPosition={a.objectPosition} secondPosition={b.objectPosition} nameA={s('nameA')} nameB={s('nameB')} revealShift={shift} />;
    case 'T11': return <SentenceRef keyAt={beat.data?.keyAt as (number | null)[] | undefined} background={a.src} position={bgPos} sentence={[s('firstLine'), s('emphasis') ? `*${s('emphasis')}*` : '', s('secondLine')].filter(Boolean).join(' ')} revealShift={shift} />;
    case 'T14': return <PercentRef background={a.src} position={bgPos} percent={Number(t.percent)} label={(s('label') || s('copy')).replace(/\*/g, '') || undefined} year={s('year') || undefined} revealShift={shift} />;
    case 'T16': return <PrintsOnPaper items={beat.assets.map((x) => ({src: x.src, aspect: x.aspectRatio, position: x.objectPosition}))} at={beat.data?.at as number[] | undefined} layout={beat.data?.layout as 'row' | 'portrait' | undefined} revealShift={shift} />;
    case 'T18': return <TwoPhotoHeading first={a.src} second={b.src} firstPosition={a.objectPosition} secondPosition={b.objectPosition} heading={s('heading')} firstLabel={s('labelA')} secondLabel={s('labelB')} revealShift={shift} />;
    case 'T22': return <StatementOverlay background={a.src} statement={s('statement')} backgroundPosition={bgPos} revealShift={shift} />;
    // second designs and new kinds: background = a photo or a film clip (bgfilm); the map / document is the last card
    case 'T22b': return <StatementPaper background={a.src} backgroundVideo={a.videoParts?.[0]?.src} statement={s('statement')} backgroundPosition={bgPos} keyAt={beat.data?.keyAt as (number | null)[] | undefined} revealShift={shift} />;
    case 'T11b': return a.videoParts?.length ? <SentenceMarker background={a.src} backgroundVideo={a.videoParts?.[0]?.src} sentence={s('sentence')} backgroundPosition={bgPos} revealShift={shift} /> : <SentenceRef keyAt={beat.data?.keyAt as (number | null)[] | undefined} background={a.src} position={bgPos} sentence={s('sentence')} revealShift={shift} />;
    case 'T26': return <MapCircle background={a.src} backgroundVideo={a.videoParts?.[0]?.src} map={b.src} aspect={b.aspectRatio} box={beat.data?.box as [number, number, number, number]} label={s('label')} markerColor={beat.data?.markerColor as string | undefined} backgroundPosition={bgPos} revealShift={shift} />;
    case 'T28': return <StoryPhoto src={a.src} aspect={a.aspectRatio} shots={(beat.data?.shots as StoryShot[]) ?? []} tags={(beat.data?.tags as StoryTag[]) ?? []} durationFrames={beat.durationFrames} revealShift={shift} />;
    // motion pieces (MotionPieces.tsx): one picture or film told in several moves, for the opening
    case 'T29': return <StoryPhoto src={a.src} aspect={a.aspectRatio} shots={(beat.data?.shots as StoryShot[]) ?? []} tags={(beat.data?.tags as StoryTag[]) ?? []} durationFrames={beat.durationFrames} revealShift={shift} move={50} focusPull />;
    case 'T30': return <Spotlight src={a.src} aspect={a.aspectRatio} spots={(beat.data?.spots as Spot[]) ?? []} durationFrames={beat.durationFrames} revealShift={shift} />;
    case 'T31': return <EvidenceBoard items={beat.assets.map((x, i) => ({src: x.src, aspect: x.aspectRatio, label: ((beat.data?.labels as string[]) ?? [])[i]}))} visits={(beat.data?.visits as number[]) ?? []} durationFrames={beat.durationFrames} revealShift={shift} />;
    case 'T32': return <MapDive map={a.src} mapAspect={a.aspectRatio} x={Number(beat.data?.x)} y={Number(beat.data?.y)} place={s('place')} photo={b?.src} photoAspect={b?.aspectRatio} video={b?.videoParts?.[0]?.src} diveAt={Number(beat.data?.diveAt ?? 20)} landAt={Number(beat.data?.landAt ?? 80)} durationFrames={beat.durationFrames} revealShift={shift} />;
    case 'T33': return <FreezeFrame video={a.videoParts?.[0]?.src ?? a.src} freezeAt={Number(beat.data?.freezeAt ?? 30)} x={Number(beat.data?.x ?? 50)} y={Number(beat.data?.y ?? 40)} w={beat.data?.w as number | undefined} face={beat.data?.face as [number, number, number, number] | undefined} text={s('name')} durationFrames={beat.durationFrames} revealShift={shift} />;
    case 'T34': return <Triptych panels={beat.assets.map((x, i) => ({src: x.src, position: x.objectPosition, at: ((beat.data?.at as number[]) ?? [])[i] ?? i * 12, label: ((beat.data?.labels as string[]) ?? [])[i]}))} durationFrames={beat.durationFrames} revealShift={shift} />;
    case 'T35': return <PathTrace src={a.src} aspect={a.aspectRatio} points={(beat.data?.points as PathPoint[]) ?? []} follow={beat.data?.follow as number | undefined} title={s('title') || undefined} subtitle={s('subtitle') || undefined} durationFrames={beat.durationFrames} revealShift={shift} />;
    case 'T27': return <DocumentMark background={a.src} backgroundVideo={a.videoParts?.[0]?.src} doc={b.src} aspect={b.aspectRatio} box={beat.data?.box as [number, number, number, number]} marker={beat.data?.marker as string | undefined} backgroundPosition={bgPos} revealShift={shift} />;
    // the owner's reference templates 4, 12, 13, 15, 17, 20: every picture is a card (documents and maps pre-trimmed)
    case 'T4': return <PrintsOnPaper items={beat.assets.map((x) => ({src: x.src, aspect: x.aspectRatio, position: x.objectPosition}))} at={beat.data?.at as number[] | undefined} revealShift={shift} />;
    case 'T12': return <DocumentPair first={a.src} second={b.src} aspectA={a.aspectRatio} aspectB={b.aspectRatio} revealShift={shift} />;
    case 'T13': return <DocumentOverScene background={a.src} backgroundVideo={a.videoParts?.[0]?.src} backgroundPosition={bgPos} doc={b.src} aspect={b.aspectRatio} box={beat.data?.box as [number, number, number, number] | undefined} marker={beat.data?.marker as string | undefined} revealShift={shift} />;
    case 'T15': return <PhotoBurstRef photos={beat.assets.map((x) => x.src)} positions={beat.assets.map((x) => x.objectPosition)} durationFrames={beat.durationFrames} />;
    case 'T17': return <MapPair first={a.src} second={b.src} aspectA={a.aspectRatio} aspectB={b.aspectRatio} caption={s('caption')} revealShift={shift} />;
    case 'T20': return <LabelsOnPhotoRef first={a.src} second={b?.src} firstPosition={a.objectPosition} secondPosition={b?.objectPosition} labelA={s('labelA')} labelB={s('labelB')} durationFrames={beat.durationFrames} revealShift={shift} />;
    case 'T24': return <TimelineStrip heading={s('heading')} events={(beat.data?.events ?? []) as TimelineEvent[]} revealShift={shift} />;
    case 'T25': return <BarsOnPaper heading={s('heading') || undefined} rows={(beat.data?.rows ?? []) as BarRow[]} at={beat.data?.at as number[] | undefined} revealShift={shift} />;
    case 'video': return <EngineClips beat={beat} />;
    case 'regular': return <RegularPhotoZoom shots={[{src: a.src, durationInFrames: beat.durationFrames, layout: a.layout === 'aspect-safe' ? 'aspect-safe' : 'landscape-cover',
      aspectRatio: a.aspectRatio, objectPosition: a.objectPosition, zoomOrigin: a.zoomOrigin, pan: a.pan}]} />;
  }
};

/**
 * Every beat, plus two things any photo or film beat can carry (the owner's reference channels, 2026-10-22):
 * - data.enter: how the shot arrives: 'whip' (slides in fast with motion blur), 'blur' (comes into focus from a soft zoom),
 *   'frame' (seen first in a rounded old-TV frame that opens to the full screen);
 * - data.badge: a small numbered badge top left ("1", "2"...) while a passage counts through its parts.
 */
/** How long each entrance takes, in frames (the shot before stays underneath for that long). */
export const ENTER_FRAMES: Record<string, number> = {whip: 9, blur: 12, frame: 22};

export const BeatView: React.FC<{beat: Beat}> = ({beat}) => {
  const frame = useCurrentFrame();
  const enter = beat.data?.enter as 'whip' | 'blur' | 'frame' | undefined;
  const badge = beat.data?.badge as string | undefined;
  const inner = <BeatInner beat={beat} />;
  let body = inner;
  if (enter === 'whip') {
    const p = interpolate(frame, [0, ENTER_FRAMES.whip], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
    body = <AbsoluteFill style={{transform: `translateX(${p * 1920}px)`, filter: p > 0.02 ? `blur(${p * 26}px)` : undefined}}>{inner}</AbsoluteFill>;
  } else if (enter === 'blur') {
    // the new shot comes into focus over the last moment of the one before it
    const p = interpolate(frame, [0, ENTER_FRAMES.blur], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
    body = <AbsoluteFill style={{opacity: Math.min(1, (1 - p) * 2.2), transform: `scale(${1 + p * 0.12})`, filter: p > 0.02 ? `blur(${p * 18}px) brightness(${1 + p * 0.5})` : undefined}}>{inner}</AbsoluteFill>;
  } else if (enter === 'frame') {
    // the new shot opens out of a rounded card over the shot before it (no black around it)
    const p = interpolate(frame, [2, ENTER_FRAMES.frame], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
    body = <AbsoluteFill style={{transform: `scale(${1 - p * 0.3})`, borderRadius: p * 48, overflow: 'hidden', opacity: Math.min(1, frame / 3 + 0.01),
      boxShadow: p > 0 ? `0 ${Math.round(p * 30)}px ${Math.round(p * 70)}px rgba(0,0,0,${(0.55 * p).toFixed(2)})` : undefined}}>{inner}</AbsoluteFill>;
  }
  if (!badge) return body;
  return <AbsoluteFill>
    {body}
    <Badge text={badge} f={frame} />
  </AbsoluteFill>;
};
