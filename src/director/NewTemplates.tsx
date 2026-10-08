import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, random, staticFile, useCurrentFrame} from 'remotion';
import {CRIMSON, INK, PaperGround, RED, TEXT_RED, RiseWords, WipeBar, clamp, easeInOut, easeOut, textBase} from './channelStyle';

/** A real photo as a print on the paper: white border, slight tilt, drops in from below and settles. */
const Print: React.FC<{src: string; x: number; y: number; w: number; h: number; frame: number; start: number; tilt?: number; position?: string; border?: number}> = ({src, x, y, w, h, frame, start, tilt = 0, position = '50% 35%', border = 14}) => {
  const p = easeOut(frame, start, start + 16);
  if (p <= 0) return null;
  return <div style={{position: 'absolute', left: x, top: y, width: w, height: h, padding: border, boxSizing: 'border-box', background: '#fbf8ee',
    boxShadow: `0 ${8 + 10 * p}px ${18 + 12 * p}px rgba(24,20,12,.28)`, opacity: Math.min(1, p * 1.4),
    transform: `translateY(${(1 - p) * 90}px) rotate(${tilt * (0.4 + 0.6 * p)}deg) scale(${0.9 + 0.1 * p})`, transformOrigin: '50% 100%'}}>
    <Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: position, filter: `sepia(.12) contrast(.98) blur(${(1 - p) * 6}px)`}} />
  </div>;
};

// ---------------------------------------------------------------- T24 Timeline

export type TimelineEvent = {year: string; caption: string; photo: string; position?: string; at?: number};
export type TimelineStripProps = {heading: string; events: TimelineEvent[]; revealShift?: number};

/** T24 — a run of dated events: an ink line draws across the paper, each event drops in as a print with its red year. */
export const TimelineStrip: React.FC<TimelineStripProps> = ({heading, events, revealShift = 0}) => {
  const frame = useCurrentFrame() - revealShift;
  const n = events.length;
  const left = 190, right = 1730, lineY = 690;
  const line = easeInOut(frame, 8, 38);
  const xOf = (i: number) => left + (n === 1 ? (right - left) / 2 : ((right - left) * i) / (n - 1));
  const headIn = easeOut(frame, 0, 14);
  return <AbsoluteFill style={{overflow: 'hidden', background: '#e7e7d9'}}>
    <PaperGround frame={frame} />
    <div style={{position: 'absolute', top: 70, left: 0, right: 0, textAlign: 'center', color: TEXT_RED, ...textBase, fontWeight: 700, fontSize: 76, letterSpacing: -0.5,
      opacity: headIn, transform: `translateY(${(1 - headIn) * 16}px)`}}>{heading}</div>
    <svg width="1920" height="1080" style={{position: 'absolute', inset: 0}}>
      <line x1={left - 60} y1={lineY} x2={left - 60 + (right - left + 120) * line} y2={lineY} stroke={INK} strokeWidth={6} strokeLinecap="round" />
    </svg>
    {events.map((e, i) => {
      const at = e.at ?? 30 + i * 28;
      const dot = easeOut(frame, at, at + 8);
      const x = xOf(i);
      const last = i === n - 1;
      const pulse = last ? 1 + 0.12 * Math.max(0, Math.sin((frame - at - 12) / 7)) * easeOut(frame, at + 12, at + 20) : 1;
      return <React.Fragment key={i}>
        <Print src={e.photo} position={e.position} x={x - 170} y={250} w={340} h={360} frame={frame} start={at - 4} tilt={(random(`t${i}`) - 0.5) * 5} border={11} />
        <div style={{position: 'absolute', left: x - 17, top: lineY - 17, width: 34, height: 34, borderRadius: 17, background: last ? RED : INK,
          transform: `scale(${dot * pulse})`, boxShadow: '0 3px 8px rgba(0,0,0,.25)'}} />
        <div style={{position: 'absolute', left: x - 200, width: 400, top: lineY + 46, display: 'flex', justifyContent: 'center'}}>
          <WipeBar text={e.year} frame={frame} start={at + 4} color={last ? RED : CRIMSON} fontSize={50} height={78} padding={22} letterSpacing={-0.5} spread={6} radius={4} />
        </div>
        <div style={{position: 'absolute', left: x - 200, width: 400, top: lineY + 140, textAlign: 'center', color: INK, ...textBase, fontSize: 34, lineHeight: 1.15}}>
          <RiseWords text={e.caption} frame={frame} start={at + 12} gap={2} />
        </div>
      </React.Fragment>;
    })}
  </AbsoluteFill>;
};

// ---------------------------------------------------------------- T25 Comparison bars

export type CompareRow = {label: string; value: number; display?: string; photo?: string; position?: string; highlight?: boolean; at?: number};
export type CompareBarsProps = {heading: string; rows: CompareRow[]; prefix?: string; suffix?: string; note?: string; revealShift?: number};

/** T25 — two or three amounts side by side: each row's print, a flat bar growing to its share, the figure counting up at its tip. */
export const CompareBars: React.FC<CompareBarsProps> = ({heading, rows, prefix = '', suffix = '', note, revealShift = 0}) => {
  const frame = useCurrentFrame() - revealShift;
  const max = Math.max(...rows.map((r) => r.value));
  const headIn = easeOut(frame, 0, 14);
  const rowH = rows.length > 2 ? 230 : 280;
  const top0 = rows.length > 2 ? 260 : 300;
  const barX = 560, barW = 820;
  const lastAt = Math.max(...rows.map((r, i) => r.at ?? 18 + i * 34));
  return <AbsoluteFill style={{overflow: 'hidden', background: '#e7e7d9'}}>
    <PaperGround frame={frame} />
    <div style={{position: 'absolute', top: 80, left: 0, right: 0, textAlign: 'center', color: TEXT_RED, ...textBase, fontWeight: 700, fontSize: 76, letterSpacing: -0.5,
      opacity: headIn, transform: `translateY(${(1 - headIn) * 16}px)`}}>{heading}</div>
    {rows.map((r, i) => {
      const at = r.at ?? 18 + i * 34;
      const y = top0 + i * rowH;
      const grow = interpolate(frame, [at + 6, at + 46], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
      const w = (r.value / max) * barW * grow;
      const color = r.highlight ?? i === 0 ? RED : INK;
      const shown = r.display && grow >= 1 ? r.display : `${prefix}${Math.round(r.value * grow).toLocaleString('en-US')}${suffix}`;
      return <React.Fragment key={i}>
        {r.photo ? <Print src={r.photo} position={r.position} x={250} y={y - 20} w={200} h={200} frame={frame} start={at - 6} tilt={i % 2 ? 2 : -2} border={9} /> : null}
        <div style={{position: 'absolute', left: barX, top: y - 4, color: INK, ...textBase, fontWeight: 700, fontSize: 46, opacity: easeOut(frame, at, at + 10)}}>
          <RiseWords text={r.label} frame={frame} start={at} gap={2} />
        </div>
        <div style={{position: 'absolute', left: barX, top: y + 70, width: barW, height: 70, background: 'rgba(23,21,15,.07)'}} />
        <div style={{position: 'absolute', left: barX, top: y + 70, width: w, height: 70, background: color, boxShadow: '0 6px 14px rgba(0,0,0,.18)'}} />
        <div style={{position: 'absolute', left: barX + w + 22, top: y + 72, color: color === RED ? TEXT_RED : color, ...textBase, fontWeight: 700, fontSize: 58, lineHeight: '66px', fontVariantNumeric: 'tabular-nums',
          opacity: easeOut(frame, at + 8, at + 16), whiteSpace: 'nowrap'}}>{shown}</div>
      </React.Fragment>;
    })}
    {note ? <div style={{position: 'absolute', left: 0, right: 0, bottom: 95, display: 'flex', justifyContent: 'center'}}>
      <WipeBar text={note} frame={frame} start={lastAt + 50} fontSize={46} height={80} padding={26} letterSpacing={1} radius={4} />
    </div> : null}
  </AbsoluteFill>;
};
