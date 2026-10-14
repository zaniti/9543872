import React from 'react';
import {AbsoluteFill, Audio, CalculateMetadataFunction, Sequence, staticFile} from 'remotion';
import {BeatView, Premount, type Beat} from './BeatView';
import {ReviewSubtitles, type SubtitleCue} from './ReviewSubtitles';
import {applyTheme, setLanguage, type Theme} from './channelStyle';

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
  applyTheme(theme);
  setLanguage(language);  // the channel's accent colours, before any template renders
  return <AbsoluteFill style={{background: '#0d0d0d'}}>
  {audio ? <Audio src={staticFile(audio)} /> : null}
  <Premount.Provider value={premount}>
  {beats.map((beat) => <Sequence key={beat.id} from={beat.startFrame} durationInFrames={beat.durationFrames} name={`${beat.id} ${beat.mode}`}
    premountFor={premount}>
    <BeatView beat={beat} />
  </Sequence>)}
  </Premount.Provider>
  {showSubtitles && subtitles ? <ReviewSubtitles cues={subtitles} /> : null}
</AbsoluteFill>;
};
