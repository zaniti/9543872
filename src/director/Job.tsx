import React from 'react';
import {AbsoluteFill, Audio, CalculateMetadataFunction, Sequence, continueRender, delayRender, staticFile} from 'remotion';
import {BeatView, ENTER_FRAMES, Premount, type Beat} from './BeatView';
import {ReviewSubtitles, type SubtitleCue} from './ReviewSubtitles';
import {FONT_FILES, applyTheme, setLanguage, type Theme} from './channelStyle';
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
    const scenes = beats.map((beat, i) => <Sequence key={beat.id} from={beat.startFrame}
      durationInFrames={beat.durationFrames + (ENTER_FRAMES[(beats[i + 1]?.data?.enter as string) ?? ''] ?? 0)} name={`${beat.id} ${beat.mode}`}
      premountFor={premount}>
      <BeatView beat={beat} />
    </Sequence>);
    // the channel's finishing look over every scene (text included); none when the channel has not set one
    return theme?.look ? <LookFilter look={theme.look}>{scenes}</LookFilter> : scenes;
  })()}
  </Premount.Provider>
  {showSubtitles && subtitles ? <ReviewSubtitles cues={subtitles} /> : null}
</AbsoluteFill>;
};
