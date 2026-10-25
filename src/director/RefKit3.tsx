import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, delayRender, continueRender} from 'remotion';
import {backgroundZoom} from './templateMotion';
import {CREAM, PAPER, RED, clamp, easeInOut, easeOut, paperFilter, paperVeil, textBase, textWidth} from './channelStyle';
import {DrawnArrow, Reveal, TAG, TypeTag} from './RefKit';

/** Where a tag of this text can sit so it stays fully on screen: its centre x, kept 40 px from both edges. */
const tagCentre = (x: number, text: string, size = TAG) => {
  const half = (text.length * 0.6 * size + size) / 2;
  return Math.max(40 + half, Math.min(1920 - 40 - half, x));
};

/**
 * The reference kit, part 3 (2026-10-22): maps, the cut-out scene, stacked lines. Same theme: Poppins, the channel
 * colour, one cream; text types in, arrows draw themselves.
 */

/** The colour countries light up in: gold, unless the channel's own colour is itself golden (then a steel blue).
 *  Never the channel colour (the owner, 2026-10-23). */
const litColour = (hex: string) => {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return '#d4a03a';
  const [r, g, b] = [m[1], m[2], m[3]].map((x) => parseInt(x, 16) / 255);
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  const h = d === 0 ? 0 : mx === r ? 60 * (((g - b) / d) % 6) : mx === g ? 60 * ((b - r) / d + 2) : 60 * ((r - g) / d + 4);
  const hue = (h + 360) % 360;
  return hue >= 25 && hue <= 70 ? '#3f86b8' : '#d4a03a';  // gold: #d4a03a (mid), lit with a gradient and glow
};

// ------------------------------------------------------------------ T46: countries light up on a dark map

type Country = {n: string; iso: string; r: number[][][]};
let COUNTRIES: Country[] | null = null;

/** A dark map of a region (lon/lat box); the named countries light up one after another in the channel colour, each
 *  with a small typed tag; the camera drifts slowly. Countries by name or ISO code ("United Kingdom", "GBR"). */
const LABEL_SIZE = 38;

type RegionLabel = {text: string; at: number; x: number; y: number; w: number; h: number; px: number; py: number; ax: number; ay: number;
  lead: boolean; align: 'flex-start' | 'center' | 'flex-end'};

/** Where each region's label goes, decided once on the unzoomed map: inside a large country, else beside the
 *  country, as close as it can be, clear of every lit country's real outline, every other label and every other
 *  label's line (lines never cross), and inside the frame even at the end of the slow zoom-in. */
const regionLabels = (data: Country[], countries: {name: string; at: number; label?: string}[], Q: (lo: number, la: number) => number[], zoom: number): RegionLabel[] => {
  const z = (v: number, o: number) => (v - o) * zoom + o;
  const ZEND = 1.2;  // the map's zoom at the end of a long shot: labels must still be inside the frame then
  const find = (name: string) => data.find((d) => (d.n || '').toLowerCase() === name.toLowerCase() || (d.iso || '').toLowerCase() === name.toLowerCase());
  type Box = [number, number, number, number];
  type Ring = {pts: number[][]; box: Box};
  const ringsOf = (c: Country): Ring[] => c.r.map((ring) => {
    const pts = ring.map(([lo, la]) => { const [x, y] = Q(lo, la); return [z(x, 960), z(y, 540)]; });
    const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
    return {pts, box: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)] as Box};
  });
  const lit = countries.map((c) => find(c.name)).filter((d): d is Country => !!d).flatMap(ringsOf).filter((r) => r.box[2] > -100 && r.box[0] < 2020);
  const inside = (x: number, y: number) => lit.some((r) => {
    if (x < r.box[0] || x > r.box[2] || y < r.box[1] || y > r.box[3]) return false;
    let hit = false;
    for (let a = 0, b = r.pts.length - 1; a < r.pts.length; b = a++) {
      const [xa, ya] = r.pts[a], [xb, yb] = r.pts[b];
      if ((ya > y) !== (yb > y) && x < ((xb - xa) * (y - ya)) / (yb - ya) + xa) hit = !hit;
    }
    return hit;
  });
  const onLand = (b: Box) => {  // how much of the label's box covers a lit country (sampled)
    let n = 0;
    for (let ix = 0; ix <= 6; ix++) for (let iy = 0; iy <= 2; iy++) if (inside(b[0] + ((b[2] - b[0]) * ix) / 6, b[1] + ((b[3] - b[1]) * iy) / 2)) n++;
    return n;
  };
  const cross = (a: number[], b: number[], c: number[], d: number[]) => {
    const o = (p: number[], q: number[], r: number[]) => Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]));
    return o(a, b, c) * o(a, b, d) < 0 && o(c, d, a) * o(c, d, b) < 0;
  };
  const overlap = (a: Box, b: Box) => Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));
  const ze = (v: number, o: number) => (v - o) * ZEND + o;
  const placed: Box[] = [];
  const leads: number[][][] = [];
  const out: RegionLabel[] = [];
  // every country's own point, so a label never sits beside another country (it would read as that country's name)
  const points = countries.map((c) => {
    const d = find(c.name);
    const rs = d ? ringsOf(d).filter((r) => r.box[2] > -100 && r.box[0] < 2020) : [];
    if (!rs.length) return null;
    const m = rs.reduce((a, b) => ((b.box[2] - b.box[0]) * (b.box[3] - b.box[1]) > (a.box[2] - a.box[0]) * (a.box[3] - a.box[1]) ? b : a));
    return [m.pts.reduce((a, q) => a + q[0], 0) / m.pts.length, m.pts.reduce((a, q) => a + q[1], 0) / m.pts.length];
  });
  const gap = (b: Box, q: number[]) => Math.hypot(Math.max(b[0] - q[0], 0, q[0] - b[2]), Math.max(b[1] - q[1], 0, q[1] - b[3]));
  countries.forEach((c, ci) => {
    const d = find(c.name);
    if (!d || !c.label) return;
    const rings = ringsOf(d).filter((r) => r.box[2] > -100 && r.box[0] < 2020);
    if (!rings.length) return;
    const main = rings.reduce((a, b) => ((b.box[2] - b.box[0]) * (b.box[3] - b.box[1]) > (a.box[2] - a.box[0]) * (a.box[3] - a.box[1]) ? b : a));
    const px = main.pts.reduce((a, q) => a + q[0], 0) / main.pts.length, py = main.pts.reduce((a, q) => a + q[1], 0) / main.pts.length;
    const w = textWidth(c.label, LABEL_SIZE, 600, 2) + 8, h = LABEL_SIZE * 1.3;
    const big = (main.box[2] - main.box[0]) > w * 1.25 && (main.box[3] - main.box[1]) > h * 2.2;
    if (big) {  // the label fits inside the country with room around it: no line needed
      const b: Box = [px - w / 2, py - h / 2, px + w / 2, py + h / 2];
      placed.push(b);
      out.push({text: c.label, at: c.at, x: b[0], y: b[1], w, h, px, py, ax: px, ay: py, lead: false, align: 'center'});
      return;
    }
    let best: {score: number; b: Box; ax: number; ay: number; align: RegionLabel['align']} | null = null;
    for (const r of [60, 90, 130, 180, 240, 320]) {
      for (let a = 0; a < 24; a++) {
        const th = (a / 24) * Math.PI * 2, ex = px + r * Math.cos(th), ey = py + r * Math.sin(th);
        const right = Math.cos(th) >= 0;
        const b: Box = [right ? ex : ex - w, ey - h / 2, right ? ex + w : ex, ey + h / 2];
        const ax = right ? b[0] - 6 : b[2] + 6;
        let score = r;  // as close to its country as possible
        if (ze(b[0], 960) < 30 || ze(b[2], 960) > 1890 || ze(b[1], 540) < 30 || ze(b[3], 540) > 1050) score += 1e6;
        score += onLand(b) * 120;  // never on a lit country
        points.forEach((q, qi) => { if (q && qi !== ci && gap(b, q) < 90) score += (90 - gap(b, q)) * 12; });
        placed.forEach((o) => { score += overlap(b, [o[0] - 16, o[1] - 10, o[2] + 16, o[3] + 10]) * 8; });
        leads.forEach(([p0, p1]) => { if (cross([px, py], [ax, ey], p0, p1)) score += 5000; });  // lines never cross
        placed.forEach((o) => { if (cross([px, py], [ax, ey], [o[0], o[1]], [o[2], o[3]]) || cross([px, py], [ax, ey], [o[0], o[3]], [o[2], o[1]])) score += 3000; });
        if (!best || score < best.score) best = {score, b, ax, ay: ey, align: right ? 'flex-start' : 'flex-end'};
      }
    }
    if (!best) return;
    placed.push(best.b);
    leads.push([[px, py], [best.ax, best.ay]]);
    out.push({text: c.label, at: c.at, x: best.b[0], y: best.b[1], w, h, px, py, ax: best.ax, ay: best.ay, lead: true, align: best.align});
  });
  return out;
};

export const RegionsMap: React.FC<{view: [number, number, number, number]; countries: {name: string; at: number; label?: string}[]; revealShift?: number}> = ({view, countries, revealShift = 0}) => {
  const clock = useCurrentFrame();
  const f = clock - revealShift;
  const [data, setData] = React.useState<Country[] | null>(COUNTRIES);
  const [wait] = React.useState(() => (COUNTRIES ? null : delayRender('countries')));
  React.useEffect(() => {
    if (COUNTRIES) return;
    fetch(staticFile('templates/geo/countries.json')).then((r) => r.json()).then((d: Country[]) => { COUNTRIES = d; setData(d); if (wait !== null) continueRender(wait); },
      () => { if (wait !== null) continueRender(wait); });
  }, [wait]);
  // Mercator, fitted to the view's width and centred on it
  const [lon0, lat0, lon1, lat1] = view;
  const merc = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (Math.max(-80, Math.min(80, lat)) * Math.PI) / 360));
  const kx = 1920 / (lon1 - lon0), ym = (merc(lat0) + merc(lat1)) / 2, lm = (lon0 + lon1) / 2;
  const Q = (lon: number, lat: number) => [(lon - lm) * kx + 960, (ym - merc(lat)) * kx * (180 / Math.PI) + 540];
  const path = (c: Country) => c.r.map((ring) => 'M' + ring.map(([lo, la]) => { const [x, y] = Q(lo, la); return `${x.toFixed(1)},${y.toFixed(1)}`; }).join('L') + 'Z').join('');
  const want = new Map(countries.map((c) => [c.name.toLowerCase(), c]));
  const pick = (c: Country) => want.get((c.n || '').toLowerCase()) ?? want.get((c.iso || '').toLowerCase());
  const zoom = 1.02 + Math.max(0, clock) * 0.00025;
  const LIT = litColour(RED), LIT_HI = LIT === '#d4a03a' ? '#ffe9a6' : '#a8d4f2', LIT_LO = LIT === '#d4a03a' ? '#8a5a12' : '#1f4f73';
  return <AbsoluteFill style={{overflow: 'hidden', background: '#16191c'}}>
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, #2a2f34 0%, #16191c 75%)'}} />
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, transform: `scale(${zoom})`, transformOrigin: '50% 50%'}}>
      <defs>
        {/* a lit country is printed, not flat: the colour carries a fine paper grain (as in the references) */}
        <filter id="litGrain" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed="4" result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.3 1.1" result="a" />
          <feComposite in="SourceGraphic" in2="a" operator="in" />
        </filter>
        {/* glowing metallic gold (the owner, 2026-10-23): a light-to-deep gold gradient over the whole map, a soft glow
            around each lit country and a thin bright rim */}
        <linearGradient id="litMetal" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1920" y2="1080">
          <stop offset="0" stopColor={LIT_HI} /><stop offset="0.45" stopColor={LIT} /><stop offset="0.7" stopColor={LIT_HI} /><stop offset="1" stopColor={LIT_LO} />
        </linearGradient>
        {/* glow and burst areas cover the whole frame: sized to the country, a small one (Iceland) cut its glow into a
            square (the owner, 2026-10-24) */}
        <filter id="litGlow" filterUnits="userSpaceOnUse" x="-300" y="-300" width="2520" height="1680">
          <feGaussianBlur in="SourceAlpha" stdDeviation="9" result="b" />
          <feFlood floodColor={LIT_HI} floodOpacity="0.75" />
          <feComposite in2="b" operator="in" result="g" />
          <feMerge><feMergeNode in="g" /><feMergeNode in="g" /></feMerge>
        </filter>
        {/* the burst when a country lights up: a wide, bright glow (the owner: "a clicking glow, then reduce it") */}
        <filter id="litBurst" filterUnits="userSpaceOnUse" x="-300" y="-300" width="2520" height="1680">
          <feGaussianBlur in="SourceAlpha" stdDeviation="26" result="b" />
          <feFlood floodColor={LIT_HI} floodOpacity="1" />
          <feComposite in2="b" operator="in" result="g" />
          <feMerge><feMergeNode in="g" /><feMergeNode in="g" /><feMergeNode in="g" /></feMerge>
        </filter>
      </defs>
      {(data ?? []).map((c, i) => {
        const hit = pick(c);
        if (hit) return null;
        return <path key={i} d={path(c)} fill="#2f353b" stroke="#4a525a" strokeWidth={0.8} />;
      })}
      {(data ?? []).map((c, i) => {
        const hit = pick(c);
        if (!hit) return null;
        const p = interpolate(f, [hit.at, hit.at + 8], [0, 1], clamp);
        const flash = interpolate(f, [hit.at, hit.at + 3, hit.at + 10], [0, 1, 0], clamp);
        return <g key={i}>
          <path d={path(c)} fill="#2f353b" stroke="#4a525a" strokeWidth={0.8} />
          {p > 0 ? <>
            {/* a strong flash on the click, then a faint glow that stays */}
            <path d={path(c)} fill={LIT} filter="url(#litBurst)" opacity={interpolate(f, [hit.at, hit.at + 2, hit.at + 16], [0, 1, 0], clamp)} />
            <path d={path(c)} fill={LIT} filter="url(#litGlow)" opacity={interpolate(f, [hit.at, hit.at + 3, hit.at + 18], [0, 1, 0.3], clamp)} />
            <path d={path(c)} fill="url(#litMetal)" fillOpacity={0.45 + 0.55 * p} filter="url(#litGrain)" />
            <path d={path(c)} fill="none" stroke={LIT_HI} strokeWidth={1.6} strokeOpacity={0.9 * p} />
          </> : null}
          <path d={path(c)} fill="none" stroke={flash > 0 ? CREAM : p > 0 ? 'rgba(0,0,0,.35)' : '#4a525a'} strokeWidth={flash > 0 ? 2 + 3 * flash : p > 0 ? 1.4 : 0.8} />
        </g>;
      })}
    </svg>
    {data ? regionLabels(data, countries, Q, 1).map((L0, i) => {
      // placed once on the map (never re-decided as the map zooms: EDO FOLKLORE jumped to another spot mid-shot), then
      // carried by the slow zoom with the countries
      const z = (v: number, o: number) => (v - o) * zoom + o;
      const L = {...L0, x: z(L0.x + L0.w / 2, 960) - L0.w / 2, y: z(L0.y + L0.h / 2, 540) - L0.h / 2, px: z(L0.px, 960), py: z(L0.py, 540),
        ax: z(L0.ax, 960), ay: z(L0.ay, 540)};
      // labels never sit on a lit country (the owner, 2026-10-24: SAGAS, INQUISITION, MERCHANT DIARIES hid Iceland,
      // Spain and the Netherlands): a small country gets a dot and a thin line to its label in empty space; a large one
      // carries its label inside itself. Light type, no box.
      const p = interpolate(f, [L.at + 4, L.at + 12], [0, 1], clamp);
      if (p <= 0) return null;
      return <React.Fragment key={i}>
        {L.lead ? <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity: p}}>
          <line x1={L.px} y1={L.py} x2={L.px + (L.ax - L.px) * p} y2={L.py + (L.ay - L.py) * p} stroke={CREAM} strokeWidth={2} strokeOpacity={0.85} />
          <circle cx={L.px} cy={L.py} r={6} fill={CREAM} />
          <circle cx={L.px} cy={L.py} r={11} fill="none" stroke={CREAM} strokeWidth={1.5} strokeOpacity={0.6} />
        </svg> : null}
        <div style={{position: 'absolute', left: L.x, top: L.y, width: L.w, height: L.h, display: 'flex', alignItems: 'center',
          justifyContent: L.align, ...textBase, fontWeight: 600, fontSize: LABEL_SIZE, letterSpacing: 2, color: CREAM, whiteSpace: 'pre',
          textShadow: '0 2px 10px rgba(0,0,0,.85), 0 0 2px rgba(0,0,0,.9)'}}>
          <span style={{whiteSpace: 'pre'}}><Reveal text={L.text} f={f} start={L.at + 8} /></span>
        </div>
      </React.Fragment>;
    }) : null}
  </AbsoluteFill>;
};

// ------------------------------------------------------------------ T47: flow map

/** Arrows flowing out of (or into) one place on a map picture, one after another, each with its tag: trade, money,
 *  armies, people. Positions are % of the map. */
export const FlowMap: React.FC<{map: string; position?: string; hub: {x: number; y: number; label?: string}; targets: {x: number; y: number; label?: string; at: number}[];
  inward?: boolean; revealShift?: number}> = ({map, position, hub, targets, inward = false, revealShift = 0}) => {
  const clock = useCurrentFrame();
  const f = clock - revealShift;
  const z = backgroundZoom(clock);
  const S = (x: number, y: number) => [((x / 100) * 1920 - 960) * z + 960, ((y / 100) * 1080 - 540) * z + 540];
  const S0 = (x: number, y: number) => [(x / 100) * 1920, (y / 100) * 1080]; // without the slow zoom: placement is decided once
  const [hx, hy] = S(hub.x, hub.y);
  return <AbsoluteFill style={{overflow: 'hidden', background: '#111'}}>
    <Img src={staticFile(map)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: position ?? '50% 50%',
      transform: `scale(${z})`, transformOrigin: '50% 50%'}} />
    <AbsoluteFill style={{background: 'rgba(0,0,0,.18)'}} />
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
      <circle cx={hx} cy={hy} r={16 * easeOut(f, 0, 8)} fill={RED} stroke={CREAM} strokeWidth={5} />
    </svg>
    {targets.map((t, i) => {
      const [tx, ty] = S(t.x, t.y);
      const [x1, y1, x2, y2] = inward ? [tx, ty, hx, hy] : [hx, hy, tx, ty];
      const dx = x2 - x1, dy = y2 - y1, d = Math.hypot(dx, dy) || 1;
      const g1 = 26, g2 = 22; // leave the dots free
      return <React.Fragment key={i}>
        <DrawnArrow x1={x1 + (dx / d) * g1} y1={y1 + (dy / d) * g1} x2={x2 - (dx / d) * g2} y2={y2 - (dy / d) * g2} f={f} start={t.at} dur={16} bend={0.18} width={8} head={34} />
        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
          <circle cx={tx} cy={ty} r={11 * easeOut(f, t.at + 12, t.at + 18)} fill={CREAM} stroke={RED} strokeWidth={4} />
        </svg>
        {t.label ? <div style={{position: 'absolute', left: tagCentre(tx, t.label), top: ty < 140 ? ty + 30 : ty - 108, transform: 'translateX(-50%)'}}><TypeTag text={t.label} f={f} start={t.at + 14} size={TAG} /></div> : null}
      </React.Fragment>;
    })}
    {/* the tags sit on top: the arrows pass under them (the owner, 2026-10-23) */}
    {hub.label ? (() => {
      // the hub's tag goes on the side of the dot where no arrow passes (above, right, left or below), on screen
      const tw = textWidth(hub.label, TAG, 600) + TAG, th = TAG * 1.55;
      // the points each arrow passes through (the same curve DrawnArrow draws, bend 0.18)
      const [hx0, hy0] = S0(hub.x, hub.y);
      const pts = targets.flatMap((t) => {
        const [tx, ty] = S0(t.x, t.y);
        const [x1, y1, x2, y2] = inward ? [tx, ty, hx0, hy0] : [hx0, hy0, tx, ty];
        const mx = (x1 + x2) / 2 - (y2 - y1) * 0.18, my = (y1 + y2) / 2 + (x2 - x1) * 0.18;
        return Array.from({length: 40}, (_, k) => { const u = k / 39; return [(1 - u) ** 2 * x1 + 2 * (1 - u) * u * mx + u * u * x2, (1 - u) ** 2 * y1 + 2 * (1 - u) * u * my + u * u * y2]; });
      });
      // candidates all around the dot, near first; a candidate is refused if it covers the dot or leaves the screen,
      // then the one that the fewest arrow points pass under wins
      const spots: number[][] = [];
      for (const r of [22, 50, 90]) for (let k = 0; k < 12; k++) {
        const a = (k / 12) * Math.PI * 2, cx = hx0 + Math.cos(a) * (r + tw / 2), cy = hy0 + Math.sin(a) * (r + th / 2);
        spots.push([cx - tw / 2, cy - th / 2, r]);
      }
      const score = ([x, y, r]: number[]) => {
        if (x < 30 || y < 30 || x + tw > 1890 || y + th > 1050) return 1e9;
        if (hx0 > x - 20 && hx0 < x + tw + 20 && hy0 > y - 20 && hy0 < y + th + 20) return 1e9;
        // close to its dot first (the tags sit over the arrows, so an arrow passing under is a small cost)
        return pts.filter(([px, py]) => px > x - 14 && px < x + tw + 14 && py > y - 14 && py < y + th + 14).length * 6 + r;
      };
      const [lx, ly] = spots.reduce((best, s) => (score(s) < score(best) ? s : best), spots[0]);
      // the spot is decided on the unzoomed map (stable for the whole shot), then rides the zoom with the dot
      return <div style={{position: 'absolute', left: hx + (lx - hx0) * z, top: hy + (ly - hy0) * z}}><TypeTag text={hub.label} f={f} start={4} size={TAG} /></div>;
    })() : null}
  </AbsoluteFill>;
};

// ------------------------------------------------------------------ T45: cut-out scene

/**
 * A person (or a statue) cut out of their photo stands on the channel's paper; then the place behind them (a palace, a
 * street, a battlefield) opens up behind the figure, and the two drift at different speeds (depth). The cut-out is a
 * transparent PNG made by engine/cutout.py.
 */
export const CutoutScene: React.FC<{cutout: {src: string; aspect: number}; background: string; position?: string; revealAt?: number; side?: 'left' | 'center' | 'right';
  name?: string; revealShift?: number}> = ({cutout, background, position, revealAt = 40, side = 'left', name, revealShift = 0}) => {
  const clock = useCurrentFrame();
  const f = clock - revealShift;
  // measured on the references: the figure stands at one side, about three quarters of the frame high and a third wide
  const h = Math.min(820, 640 / cutout.aspect), w = h * cutout.aspect;
  const cx = side === 'left' ? 440 : side === 'right' ? 1480 : 960;
  const enter = interpolate(f, [0, 14], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const open = interpolate(f, [revealAt, revealAt + 18], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const t = Math.max(0, clock);
  const figScale = 1 + t * 0.0009, bgScale = 1.06 + t * 0.00035, bgShift = -t * 0.18; // the figure comes closer faster than the place
  return <AbsoluteFill style={{overflow: 'hidden', background: '#d9d3c4'}}>
    <AbsoluteFill style={{transform: `scale(${1.02 + t * 0.00012})`}}>
      <Img src={staticFile(PAPER)} style={{width: '100%', height: '100%', objectFit: 'cover', filter: paperFilter('brightness(1.09) saturate(.58)')}} />
      <div style={{position: 'absolute', inset: 0, background: paperVeil('rgba(247,243,223,.42)')}} />
    </AbsoluteFill>
    {open > 0 ? <AbsoluteFill style={{clipPath: `inset(${(1 - open) * 50}% 0 ${(1 - open) * 50}% 0)`}}>
      <Img src={staticFile(background)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: position ?? '50% 50%',
        transform: `translateX(${bgShift}px) scale(${bgScale})`, filter: `blur(${(1 - open) * 10}px)`}} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,.35) 100%)'}} />
    </AbsoluteFill> : null}
    <div style={{position: 'absolute', left: cx - w / 2, top: 1080 - h + 20, width: w, height: h, transformOrigin: '50% 100%',
      transform: `translateY(${(1 - enter) * 80}px) scale(${figScale})`, opacity: Math.min(1, enter * 1.6),
      filter: 'drop-shadow(0 16px 24px rgba(0,0,0,.35))'}}>
      <Img src={staticFile(cutout.src)} style={{width: '100%', height: '100%', objectFit: 'contain', objectPosition: '50% 100%'}} />
    </div>
    {/* the name sits under the person, centred on them (the owner, 2026-10-23) */}
    {name ? <div style={{position: 'absolute', left: tagCentre(cx, name), top: 1080 - 175, transform: 'translateX(-50%)'}}><TypeTag text={name} f={f} start={18} size={TAG} /></div> : null}
  </AbsoluteFill>;
};

// ------------------------------------------------------------------ T48: stacked lines

/** Two to four short lines stacked in the middle of a darkened photo or document, each typed in on its cue: a
 *  summary ("LEND MONEY TO THE UNION / EARN INTEREST / HELP FINANCE THE WAR"). */
export const StackedLines: React.FC<{background: string; position?: string; lines: string[]; at?: number[]; revealShift?: number}> = ({background, position, lines, at = [], revealShift = 0}) => {
  const clock = useCurrentFrame();
  const f = clock - revealShift;
  return <AbsoluteFill style={{overflow: 'hidden', background: '#111'}}>
    <Img src={staticFile(background)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: position ?? '50% 50%',
      transform: `scale(${backgroundZoom(clock)})`}} />
    <AbsoluteFill style={{background: 'rgba(0,0,0,.6)'}} />
    {/* measured on the references: 92 px capitals, the lines' tops about 220 px apart */}
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: lines.length > 3 ? 70 : 110}}>
      {lines.map((l, i) => <div key={i} style={{position: 'relative', ...textBase, fontWeight: 800, fontSize: Math.min(92, Math.round(1700 / Math.max(1, l.length * 0.72))), lineHeight: 1.2,
        letterSpacing: 1, color: CREAM, whiteSpace: 'pre', textShadow: '0 4px 16px rgba(0,0,0,.6)'}}>
        <span style={{visibility: 'hidden'}}>{l.toUpperCase()}</span>
        <span style={{position: 'absolute', left: 0, top: 0}}><Reveal text={l.toUpperCase()} f={f} start={at[i] ?? 6 + i * 30} /></span>
      </div>)}
    </AbsoluteFill>
    {void easeInOut}
  </AbsoluteFill>;
};
