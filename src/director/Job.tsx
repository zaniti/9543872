import React from 'react';
import {AbsoluteFill, Audio, CalculateMetadataFunction, Easing, Sequence, continueRender, delayRender, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {BeatView, ENTER_FRAMES, Premount, type Beat} from './BeatView';
import {ReviewSubtitles, type SubtitleCue} from './ReviewSubtitles';
import {FONT_FILES, PaperGround, SharedBoard, applyTheme, setLanguage, type Theme, CREAM, RevealText, textBase, TagBox, textWidth} from './channelStyle';
import {LookFilter} from './Look';

/** One director job: written by engine/build_project.py to jobs/<id>/edit.json and passed in as props. */
export type JobProps = {
  jobId: string;
  audio: string;
  totalFrames: number;
  beats: Beat[];
  subtitles?: SubtitleCue[] | null;
  showSubtitles?: boolean;
  theme?: Theme | null;
  /** The narration's language (en, es, ...): numbers on screen use its thousands mark. */
  language?: string;
  /** The look of the "No AI generated content" label. */
  noAiLook?: NoAiLook;
  /** Label text size and its own colour-split strength (preview of the options; defaults: 19 and the video's). */
  noAiSize?: number;
  noAiSplit?: number;
  /** The source-style label's mark: a bracketed tick, or a circled i. */
  noAiMark?: 'check' | 'info';
  /** Review player only (6 s): build each scene this many frames early (hidden) so its photo or film has loaded when it
   *  appears, instead of a black frame. Renders leave it at 0: they wait for every frame anyway. */
  premount?: number;
};

export const jobMetadata: CalculateMetadataFunction<JobProps> = ({props}) => ({durationInFrames: Math.max(1, props.totalFrames)});

// the templates drawn on the channel's squared paper board (a background photo makes T38 a photo template)
const BOARD_MODES = new Set(['T4', 'T7', 'T12', 'T16', 'T17', 'T24', 'T25', 'T41', 'T42', 'T44']);
const isBoard = (b: Beat) => BOARD_MODES.has(b.mode) || (b.mode === 'T38' && !b.assets.some((a) => a.layout !== 'template-card'));
const CLEAR_FRAMES = 12;

// "No AI generated content used": top left for the first 20 s of every video, in the narration's language (the owner,
// 2026-10-24). Drawn over the film look so it stays crisp.
const NO_AI: Record<string, string> = {
  en: 'NO AI GENERATED CONTENT USED', es: 'SIN CONTENIDO GENERADO POR IA', fr: 'AUCUN CONTENU GÉNÉRÉ PAR IA',
  de: 'KEINE KI-GENERIERTEN INHALTE', pt: 'SEM CONTEÚDO GERADO POR IA', it: 'NESSUN CONTENUTO GENERATO DA IA',
};
// about 4.8 s on screen, 4 s of it fully readable (the owner, 2026-10-25: longer than the references' 3 s source tag,
// so the longer line is read); the entrance and exit are the reference's
const NO_AI_FRAMES = 144;
const NO_AI_EVERY = 10 * 60 * 30;  // then again every 10 minutes
export type NoAiLook = 'pill' | 'check' | 'source';
const NO_AI_LEFT = 48, NO_AI_BOTTOM = 44;
/** Small, bottom left, from the end of the first shot for 20 s (the owner, 2026-10-25), drawn with the house
 *  animations and under the film look (RGB split, grain) like everything else. Two looks:
 *  'pill': a small white box stepping wider as each letter rises in (the tag animation);
 *  'check': a circle draws, a tick snaps in, the words reveal beside it (the text animation). */
const NoAiLabel: React.FC<{language?: string; from: number; look?: NoAiLook; size?: number; mark?: 'check' | 'info'}> = ({language, from, look = 'pill', size = 19, mark: mark_ = 'check'}) => {
  const f = useCurrentFrame() - from;
  if (f < 0 || f > NO_AI_FRAMES) return null;
  const caps = NO_AI[(language || 'en').slice(0, 2).toLowerCase()] ?? NO_AI.en;
  // the references write their tag in title case ("Source in Description")
  const text = look === 'source' ? caps.toLowerCase().replace(/(^|\s)(\p{L})/gu, (m) => m.toUpperCase()).replace(/\bAi\b|\bIa\b|\bKi\b/g, (m) => m.toUpperCase()) : caps;
  const out = interpolate(f, [NO_AI_FRAMES - 14, NO_AI_FRAMES], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const pos: React.CSSProperties = {position: 'absolute', left: NO_AI_LEFT, bottom: NO_AI_BOTTOM, opacity: 1 - out};
  if (look === 'source') {
    // copied frame by frame from the reference (Medici video 9:47, 30 fps), measured at 1080p. Nothing slides as a
    // whole: the brackets stay where they are, the line is anchored on its left. Entrance (frame numbers from the first):
    //  0-5   the two brackets grow from flat dashes to full height, far apart;
    //  9-    the letters come in one after another (about 2.4 a frame), each fading in over 3 frames with wide spacing
    //        that closes up over ~14 frames, so the line tightens toward the brackets;
    //  11-15 the mark inside grows from a thin line to full width.
    // The exit is the entrance played backwards (the mark goes, the brackets fold flat, the line opens up and fades
    // from its end).
    const T = NO_AI_FRAMES;
    const e = Math.min(f, T - f);                                   // the exit mirrors the entrance
    const cl = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
    const SIZE = 40, BR = 44, GAP = 14, INNER = 40;                 // Poppins Bold 40 (the reference is heavier than SemiBold), brackets SemiBold 44
    const width = textWidth('[', BR, 600) * 2 + INNER + GAP + textWidth(text, SIZE, 700);
    const widthInfo = 44 + GAP + textWidth(text, SIZE, 700);
    const bracket = interpolate(e, [0, 5], [0.08, 1], {...cl, easing: Easing.out(Easing.cubic)});
    const mark = interpolate(e, [11, 15], [0.05, 1], cl);
    const shadow = '0 2px 4px rgba(0,0,0,.55), 0 0 12px rgba(0,0,0,.35)';
    if (e < 0) return null;
    const letters = <span style={{fontWeight: 700, fontSize: SIZE}}>{[...text].map((c, k) => {
        const s0 = 9 + k * 0.42;                                   // ~2.4 letters a frame, as measured
        const op = interpolate(e, [s0, s0 + 3], [0, 1], cl);
        const tight = interpolate(e, [s0, s0 + 14], [0, 1], {...cl, easing: Easing.out(Easing.cubic)});
        return <span key={k} style={{display: 'inline-block', whiteSpace: 'pre', opacity: op, marginRight: (1 - tight) * 18}}>{c}</span>;
      })}</span>;
    if (mark_ === 'info') {
      // the circled "i" instead of the bracketed mark: the circle draws round in the brackets' frames (0-5), the "i"
      // grows in where the mark did (11-15); the exit mirrors it
      const ring = interpolate(e, [0, 6], [0, 1], {...cl, easing: Easing.out(Easing.cubic)});
      return <div style={{position: 'absolute', left: 1920 - 168 - widthInfo, top: 54, height: 50, display: 'flex', alignItems: 'center',
        ...textBase, lineHeight: 1, color: '#ffffff', textShadow: shadow, whiteSpace: 'pre'}}>
        <svg width={44} height={44} viewBox="0 0 44 44" style={{filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.55))', overflow: 'visible'}}>
          <circle cx={22} cy={22} r={19} fill="none" stroke="#ffffff" strokeWidth={3.6} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ring}
            transform="rotate(-90 22 22)" />
          {e >= 11 ? <g transform={`translate(22 22) scale(${mark}) translate(-22 -22)`}>
            <circle cx={23.6} cy={12.6} r={3.1} fill="#ffffff" />
            <path d="M17.6 19.6 L25.4 18.6 L22.2 30.2 Q21.6 32.6 23.4 31.6 L25.6 30.0" fill="none" stroke="#ffffff" strokeWidth={3.6}
              strokeLinecap="round" strokeLinejoin="round" />
          </g> : null}
        </svg>
        <span style={{display: 'inline-block', width: GAP}} />
        {letters}
      </div>;
    }
    return <div style={{position: 'absolute', left: 1920 - 168 - width, top: 54, height: 50, display: 'flex', alignItems: 'center',
      ...textBase, lineHeight: 1, color: '#ffffff', textShadow: shadow, whiteSpace: 'pre'}}>
      <span style={{display: 'inline-block', fontWeight: 600, fontSize: BR, transform: `scaleY(${bracket})`}}>[</span>
      <span style={{display: 'inline-flex', width: INNER, justifyContent: 'center', alignItems: 'center'}}>
        {e >= 11 ? <svg width={34} height={34} viewBox="0 0 30 30" style={{transform: `scaleX(${mark})`, filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.55))'}}>
          <path d="M5 16 l7 7 l13 -16" fill="none" stroke="#ffffff" strokeWidth={4.6} strokeLinecap="round" strokeLinejoin="round" /></svg> : null}
      </span>
      <span style={{display: 'inline-block', fontWeight: 600, fontSize: BR, transform: `scaleY(${bracket})`}}>]</span>
      <span style={{display: 'inline-block', width: GAP}} />
      {letters}
    </div>;
  }
  if (look === 'check') {
    const ring = interpolate(f, [0, 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
    const tick = interpolate(f, [8, 14], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    return <div style={{...pos, display: 'flex', alignItems: 'center', gap: 10, filter: 'drop-shadow(0 1px 3px rgba(0,0,0,.85)) drop-shadow(0 0 8px rgba(0,0,0,.45))'}}>
      <svg width={30} height={30} viewBox="0 0 30 30">
        <circle cx={15} cy={15} r={12.5} fill="rgba(255,250,242,.12)" stroke={CREAM} strokeWidth={2.4} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ring} transform="rotate(-90 15 15)" />
        <path d="M9 15.5 l4 4 l8 -9" fill="none" stroke={CREAM} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - tick} />
      </svg>
      <div style={{...textBase, fontWeight: 600, fontSize: 19, letterSpacing: 1.8, color: CREAM, whiteSpace: 'pre'}}><RevealText text={text} frame={f} start={12} /></div>
    </div>;
  }
  return <div style={pos}>
    <TagBox text={text} frame={f} start={0} size={size} color="rgba(255,255,255,.9)" textColor="#2b2b2b" weight={700} rtl={false} anchor="left"
      style={{fontFamily: 'Arial, Helvetica, sans-serif', letterSpacing: 0.6, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,.2)'}} />
  </div>;
};

/** The shared board: the same paper the templates draw, with one slow zoom across the whole run. */
const BoardLayer: React.FC = () => <PaperGround frame={useCurrentFrame()} force />;

/** The template's items lift and slide off the board in its last frames, leaving the paper for the next one. */
const BoardClear: React.FC<{frames: number; clear: boolean; children: React.ReactNode}> = ({frames, clear, children}) => {
  const f = useCurrentFrame();
  const p = clear ? interpolate(f, [frames - CLEAR_FRAMES, frames], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic)}) : 0;
  return <AbsoluteFill style={{transform: p ? `translate(${-p * 700}px, ${-p * 40}px)` : undefined, opacity: 1 - p}}>{children}</AbsoluteFill>;
};

/** When the label shows: after the first shot, then every 10 minutes; each time moved later to the first moment
 *  when no year tag (or other top-right text) is on screen for its 3 s, so it never meets one. */
const TOP_RIGHT_MODES = new Set(['T1', 'T1j', 'T3', 'T5']);
const hasTopRight = (b: Beat) => TOP_RIGHT_MODES.has(b.mode) || Boolean((b.text as Record<string, unknown> | undefined)?.year)
  || Boolean((b.text as Record<string, unknown> | undefined)?.yearEnd);
const noAiTimes = (beats: Beat[]): number[] => {
  if (!beats.length) return [];
  const end = beats[beats.length - 1].startFrame + beats[beats.length - 1].durationFrames;
  const busy = beats.filter(hasTopRight).map((b) => [b.startFrame, b.startFrame + b.durationFrames] as [number, number]);
  const free = (t: number) => !busy.some(([a, z]) => t < z && t + NO_AI_FRAMES > a);
  const out: number[] = [];
  for (let want = beats.length > 1 ? beats[1].startFrame : 0; want + NO_AI_FRAMES <= end; want += NO_AI_EVERY) {
    let t = want;
    // the next beat start (or the end of a busy beat) after `want` where the 3 s are clear, within the next 2 minutes
    const starts = beats.map((b) => b.startFrame).concat(busy.map(([, z]) => z)).filter((x) => x >= want).sort((a, b) => a - b);
    t = [want, ...starts].find((x) => x - want < 2 * 60 * 30 && x + NO_AI_FRAMES <= end && free(x)) ?? -1;
    if (t >= 0 && (!out.length || t - out[out.length - 1] > NO_AI_FRAMES)) out.push(t);
  }
  return out;
};

export const Job: React.FC<JobProps> = ({audio, beats, subtitles, showSubtitles, theme, language, premount = 0, noAiLook = 'source', noAiSize = 19, noAiSplit, noAiMark = 'check'}) => {
  // the channel font (Poppins) is loaded before the first frame is taken
  const [fontWait] = React.useState(() => delayRender('channel font'));
  React.useEffect(() => {
    Promise.all(FONT_FILES.map(([weight, name]) => new FontFace('Poppins', `url(${staticFile(`fonts/Poppins-${name}.ttf`)})`, {weight: String(weight)})
      .load().then((f) => { document.fonts.add(f); })))
      .then(() => continueRender(fontWait), () => continueRender(fontWait));
  }, [fontWait]);
  applyTheme(theme);
  setLanguage(language);  // the channel's accent colours, before any template renders
  return <AbsoluteFill style={{background: '#0d0d0d'}}>
  {audio ? <Audio src={staticFile(audio)} /> : null}
  <Premount.Provider value={premount}>
  {(() => {
    // a shot that arrives with an entrance (whip, blur, frame) comes in over the end of the shot before it: that shot
    // stays on screen underneath until the entrance is over (never black behind a photo)
    // paper-board templates back to back share one board: it is drawn once under the run, never cut; each template
    // leaves its own paper out, and all but the last clear their items away at their end (the owner, 2026-10-24)
    const onBoard = beats.map(isBoard);
    const linked = (i: number) => onBoard[i] && (onBoard[i - 1] || onBoard[i + 1]);
    const boards: React.ReactNode[] = [];
    for (let i = 0; i < beats.length; i++) {
      if (!onBoard[i] || !onBoard[i + 1] || onBoard[i - 1]) continue;
      let j = i;
      while (onBoard[j + 1]) j++;
      const from = beats[i].startFrame, to = beats[j].startFrame + beats[j].durationFrames;
      boards.push(<Sequence key={`board-${beats[i].id}`} from={from} durationInFrames={to - from} name={`board ${beats[i].id}-${beats[j].id}`}>
        <BoardLayer />
      </Sequence>);
    }
    const scenes = [...boards, ...beats.map((beat, i) => <Sequence key={beat.id} from={beat.startFrame}
      durationInFrames={beat.durationFrames + (linked(i) ? 0 : ENTER_FRAMES[(beats[i + 1]?.data?.enter as string) ?? ''] ?? 0)} name={`${beat.id} ${beat.mode}`}
      premountFor={premount}>
      {linked(i) ? <SharedBoard.Provider value={true}>
        <BoardClear frames={beat.durationFrames} clear={!!onBoard[i + 1]}><BeatView beat={beat} noEnter /></BoardClear>
      </SharedBoard.Provider> : <BeatView beat={beat} />}
    </Sequence>)];
    // the channel's finishing look over every scene (text included); none when the channel has not set one
    // the label carries the film look too (RGB split, texture, grain), above the soft corners that would blur it
    const label = <>{noAiTimes(beats).map((t) => <NoAiLabel key={`no-ai-${t}`} language={language} from={t} look={noAiLook} size={noAiSize} mark={noAiMark} />)}</>;
    return theme?.look ? <LookFilter look={theme.look} overlay={label} overlaySplit={noAiSplit ?? (noAiLook === 'source' ? 0 : undefined)}>{scenes}</LookFilter> : <>{scenes}{label}</>;
  })()}
  </Premount.Provider>
  {showSubtitles && subtitles ? <ReviewSubtitles cues={subtitles} /> : null}
</AbsoluteFill>;
};
