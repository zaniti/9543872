import React from 'react';
import {AbsoluteFill, Audio, CalculateMetadataFunction, Easing, Sequence, continueRender, delayRender, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {BeatView, ENTER_FRAMES, Premount, type Beat} from './BeatView';
import {ReviewSubtitles, type SubtitleCue} from './ReviewSubtitles';
import {FONT_FILES, PaperGround, SharedBoard, applyTheme, setLanguage, type Theme, TopLeftInset, NO_AI_BOX} from './channelStyle';
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
const NO_AI_FRAMES = 20 * 30;
const NoAiLabel: React.FC<{language?: string}> = ({language}) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [12, 24, NO_AI_FRAMES - 18, NO_AI_FRAMES], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (o <= 0) return null;
  const text = NO_AI[(language || 'en').slice(0, 2).toLowerCase()] ?? NO_AI.en;
  return <div style={{position: 'absolute', left: 54, top: 46, opacity: o, transform: `translateY(${(1 - o) * -8}px)`, padding: '13px 24px',
    background: 'rgba(255,255,255,.94)', borderRadius: 16, boxShadow: '0 4px 18px rgba(0,0,0,.25)', color: '#2b2b2b',
    fontFamily: 'Arial, Helvetica, sans-serif', fontWeight: 700, fontSize: 31, letterSpacing: 0.4, whiteSpace: 'pre'}}>{text}</div>;
};

/** The shared board: the same paper the templates draw, with one slow zoom across the whole run. */
const BoardLayer: React.FC = () => <PaperGround frame={useCurrentFrame()} force />;

/** The template's items lift and slide off the board in its last frames, leaving the paper for the next one. */
const BoardClear: React.FC<{frames: number; clear: boolean; children: React.ReactNode}> = ({frames, clear, children}) => {
  const f = useCurrentFrame();
  const p = clear ? interpolate(f, [frames - CLEAR_FRAMES, frames], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic)}) : 0;
  return <AbsoluteFill style={{transform: p ? `translate(${-p * 700}px, ${-p * 40}px)` : undefined, opacity: 1 - p}}>{children}</AbsoluteFill>;
};

export const Job: React.FC<JobProps> = ({audio, beats, subtitles, showSubtitles, theme, language, premount = 0}) => {
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
      <TopLeftInset.Provider value={beat.startFrame < NO_AI_FRAMES ? NO_AI_BOX.bottom - 40 : 0}>
      {linked(i) ? <SharedBoard.Provider value={true}>
        <BoardClear frames={beat.durationFrames} clear={!!onBoard[i + 1]}><BeatView beat={beat} noEnter /></BoardClear>
      </SharedBoard.Provider> : <BeatView beat={beat} />}
      </TopLeftInset.Provider>
    </Sequence>)];
    // the channel's finishing look over every scene (text included); none when the channel has not set one
    return theme?.look ? <LookFilter look={theme.look}>{scenes}</LookFilter> : scenes;
  })()}
  </Premount.Provider>
  <NoAiLabel language={language} />
  {showSubtitles && subtitles ? <ReviewSubtitles cues={subtitles} /> : null}
</AbsoluteFill>;
};
