import React from 'react';
import {AbsoluteFill, OffthreadVideo, Sequence, staticFile} from 'remotion';
import {BalfourTag} from './BalfourTag';
import type {ClaudeFuggerBeat} from './ClaudeFuggerTypes';
import {MetricPortraitCard} from './MetricPortraitCard';
import {PercentageStatistic} from './PercentageStatistic';
import {PolaroidNameCard} from './PolaroidNameCard';
import {PortraitFeatureCard} from './PortraitFeatureCard';
import {PortraitYearTag} from './PortraitYearTag';
import {RegularPhotoZoom} from './RegularPhotoZoom';
import {RelationshipPolaroids} from './RelationshipPolaroids';
import {ScatteredPaperPhotos} from './ScatteredPaperPhotos';
import {StatementOverlay} from './StatementOverlay';
import {StatisticOverlay} from './StatisticOverlay';
import {TwoPhotoHeading} from './TwoPhotoHeading';
import {CompareBars, TimelineStrip, type CompareRow, type TimelineEvent} from './NewTemplates';
import {DocumentMark, MapCircle, PhotoBurst, SentenceMarker, StatementPaper} from './VariantTemplates';
import {DocumentPair, MapPair, PaperPrints, PhotoLabels, SourceCard} from './OriginalTemplates';

export type Beat = ClaudeFuggerBeat & {revealShift?: number};
const gridPaper = 'templates/clip6/paper-grid.jpg';

/** Engine-cut clips are already framed to 1920x1080 by the dimension rule; play them natively, muted, back to back. */
const EngineClips: React.FC<{beat: Beat}> = ({beat}) => {
  let from = 0;
  return <AbsoluteFill style={{background: '#111'}}>
    {(beat.assets[0].videoParts ?? []).map((part) => {
      const shot = <Sequence key={part.src} from={from} durationInFrames={part.durationFrames}>
        <OffthreadVideo muted src={staticFile(part.src)} style={{width: '100%', height: '100%', filter: 'saturate(.8) contrast(1.055) brightness(.95) sepia(.045)'}} />
      </Sequence>;
      from += part.durationFrames;
      return shot;
    })}
  </AbsoluteFill>;
};

/** Every template gets the face-aware crop (objectPosition) and a reveal shift that lands its key element on the spoken word. */
export const BeatView: React.FC<{beat: Beat}> = ({beat}) => {
  const [a, b, c] = beat.assets;
  const t = beat.text;
  const s = (key: string) => String(t[key] ?? '');
  const shift = beat.revealShift ?? 0;
  const bgPos = a?.objectPosition ?? '50% 50%';
  switch (beat.mode) {
    case 'T1': return <BalfourTag background={a.src} title={s('title')} year={s('year')} backgroundLayout="cover" backgroundPosition={bgPos} revealShift={shift} />;
    case 'T2': return <BalfourTag background={a.src} title={s('title')} year="" backgroundLayout="cover" backgroundPosition={bgPos} revealShift={shift} />;
    case 'T3': return <PortraitYearTag background={a.src} year={s('year')} backgroundLayout="cover" backgroundPosition={bgPos} revealShift={shift} />;
    case 'T5': return <PortraitFeatureCard background={a.src} portrait={b.src} label={s('label')} sourceNote="" backgroundLayout="cover" backgroundPosition={bgPos} portraitPosition={b.objectPosition} revealShift={shift} />;
    case 'T6': return <MetricPortraitCard paper={gridPaper} portrait={a.src} portraitPosition={a.objectPosition} firstLead={s('firstLead')} firstEmphasis={s('firstEmphasis')} firstTail="" secondLead={s('secondLead')} secondEmphasis={s('secondEmphasis')} secondTail="" zoomDurationFrames={beat.durationFrames} revealShift={shift} />;
    case 'T7': return <PolaroidNameCard portrait={a.src} portraitPosition={a.objectPosition} name={s('name')} revealShift={shift} />;
    case 'T8': return <RelationshipPolaroids first={a.src} second={b.src} firstPosition={a.objectPosition} secondPosition={b.objectPosition} firstName={s('nameA')} secondName={s('nameB')} sourceNote="" revealShift={shift} />;
    case 'T11': return <StatisticOverlay firstBackground={a.src} firstLine={s('firstLine')} emphasis={s('emphasis')} secondLine={s('secondLine')} backgroundLayout="cover" backgroundPosition={bgPos} revealShift={shift} />;
    case 'T14': return <PercentageStatistic background={a.src} percent={Number(t.percent)} prefix={s('prefix')} suffix={s('suffix')} copy={s('copy')} sourceNote="" backgroundLayout="cover" backgroundPosition={bgPos} revealShift={shift} motion={s('motion') === 'count' ? 'count' : s('motion') === 'calm' ? 'calm' : 'highlight'} />;
    case 'T16': return <ScatteredPaperPhotos first={a.src} second={b.src} third={c.src} positions={[a.objectPosition, b.objectPosition, c.objectPosition]} fits={beat.data?.fits as ['cover' | 'contain', 'cover' | 'contain', 'cover' | 'contain'] | undefined} revealShift={shift} />;
    case 'T18': return <TwoPhotoHeading first={a.src} second={b.src} firstPosition={a.objectPosition} secondPosition={b.objectPosition} heading={s('heading')} firstLabel={s('labelA')} secondLabel={s('labelB')} revealShift={shift} />;
    case 'T22': return <StatementOverlay background={a.src} statement={s('statement')} backgroundPosition={bgPos} revealShift={shift} />;
    // second designs and new kinds: background = a photo or a film clip (bgfilm); the map / document is the last card
    case 'T22b': return <StatementPaper background={a.src} backgroundVideo={a.videoParts?.[0]?.src} statement={s('statement')} backgroundPosition={bgPos} revealShift={shift} />;
    case 'T11b': return <SentenceMarker background={a.src} backgroundVideo={a.videoParts?.[0]?.src} sentence={s('sentence')} backgroundPosition={bgPos} revealShift={shift} />;
    case 'T26': return <MapCircle background={a.src} backgroundVideo={a.videoParts?.[0]?.src} map={b.src} aspect={b.aspectRatio} box={beat.data?.box as [number, number, number, number]} label={s('label')} backgroundPosition={bgPos} revealShift={shift} />;
    case 'T27': return <DocumentMark background={a.src} backgroundVideo={a.videoParts?.[0]?.src} doc={b.src} aspect={b.aspectRatio} box={beat.data?.box as [number, number, number, number]} marker={beat.data?.marker as string | undefined} backgroundPosition={bgPos} revealShift={shift} />;
    // the owner's reference templates 4, 12, 13, 15, 17, 20: every picture is a card (documents and maps pre-trimmed)
    case 'T4': return <PaperPrints photos={beat.assets.map((x) => x.src)} positions={beat.assets.map((x) => x.objectPosition)} durationFrames={beat.durationFrames} revealShift={shift} />;
    case 'T12': return <DocumentPair first={a.src} second={b.src} aspectA={a.aspectRatio} aspectB={b.aspectRatio} revealShift={shift} />;
    case 'T13': return <SourceCard background={a.src} backgroundVideo={a.videoParts?.[0]?.src} backgroundPosition={bgPos} doc={b.src} aspect={b.aspectRatio} revealShift={shift} />;
    case 'T15': return <PhotoBurst photos={beat.assets.map((x) => x.src)} positions={beat.assets.map((x) => x.objectPosition)} durationFrames={beat.durationFrames} />;
    case 'T17': return <MapPair first={a.src} second={b.src} aspectA={a.aspectRatio} aspectB={b.aspectRatio} caption={s('caption')} revealShift={shift} />;
    case 'T20': return <PhotoLabels first={a.src} second={b?.src} firstPosition={a.objectPosition} secondPosition={b?.objectPosition} labelA={s('labelA')} labelB={s('labelB')} durationFrames={beat.durationFrames} revealShift={shift} />;
    case 'T24': return <TimelineStrip heading={s('heading')} events={(beat.data?.events ?? []) as TimelineEvent[]} revealShift={shift} />;
    case 'T25': return <CompareBars heading={s('heading')} rows={(beat.data?.rows ?? []) as CompareRow[]} prefix={s('prefix')} suffix={s('suffix')} note={s('note') || undefined} revealShift={shift} />;
    case 'video': return <EngineClips beat={beat} />;
    case 'regular': return <RegularPhotoZoom shots={[{src: a.src, durationInFrames: beat.durationFrames, layout: a.layout === 'aspect-safe' ? 'aspect-safe' : 'landscape-cover',
      aspectRatio: a.aspectRatio, objectPosition: a.objectPosition, zoomOrigin: a.zoomOrigin}]} />;
  }
};
