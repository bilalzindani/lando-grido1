import { DOTS, DOT_LATTICE, DOT_RADIUS } from "./halftone-data";
import { MAP_VIEW } from "./map-vector";
import { readToken } from "../lib/tokens";
import { loopInView } from "../lib/ticker";

/**
 * The halftone — 8,004 dots, lit.
 *
 * The engine from the spec, with the React hooks unwound into one closure: the
 * memos become values computed once, the callbacks become functions, and every
 * `xRef.current` becomes a local. Nothing about the algorithm changes.
 *
 * The resting field is baked once into an offscreen canvas (every dot a
 * 1.75-radius disc in --map-dot) and blitted; per frame only the lit dots are
 * touched, found by lattice arithmetic. A lit dot squares up into a chequer —
 * the square grows from 0.7 to 1 of the lattice pitch as the light rises past
 * the threshold, and the lattice's own parity decides whether a cell fills or
 * is cleared.
 */
const MAX_RATIO =
  typeof window !== "undefined" &&
  window.matchMedia("(hover: none) and (pointer: coarse)").matches
    ? 1
    : 2;
/** Below this a dot has gone back to being a dot. */
const MIN_LEVEL = 0.02;
/** The wave runs across the map on this heading — along the long straight. */
const WAVE_ANGLE = (-20 * Math.PI) / 180;
const POINTER_HEAT = 0.95;
/** How far each arm runs from the crossing, in map units, fully open. */
const RETICLE_OPEN = 420;
/**
 * The arms only open when the cursor settles. Retracting is quick and opening
 * is not: the reticle should feel like it is acquiring, not like it is
 * flickering.
 */
const RETICLE_SETTLE = 900;
const SPREAD_OPEN = 0.38;
const SPREAD_SHUT = 0.09;
/** Arms sit under the crossing, so the centre still reads as the point. */
const RETICLE_ARM = 0.82;
/** The bloom at the crossing itself. */
const RETICLE_CORE = 54;
/** Seconds for the light to cover most of the gap to the cursor. */
const POINTER_TRAIL = 0.07;
/** Seconds to bring the light up on entry, and to put it out on exit. */
const POINTER_RISE = 0.14;
const POINTER_FALL = 0.3;
/** Exponential approach — frame-rate independent, unlike a flat lerp. */
const approach = (from: number, to: number, dt: number, tau: number) =>
  to + (from - to) * Math.exp(-dt / tau);

type Rgb = readonly [number, number, number];

const mix = (a: Rgb, b: Rgb, t: number): Rgb => [
  Math.round(a[0] + (b[0] - a[0]) * t),
  Math.round(a[1] + (b[1] - a[1]) * t),
  Math.round(a[2] + (b[2] - a[2]) * t),
];
const css = ([r, g, b]: Rgb) => "rgb(" + r + " " + g + " " + b + ")";
const readRgb = (token: string): Rgb => {
  const m = readToken(token).match(/\d+(\.\d+)?/g);
  return m ? [Number(m[0]), Number(m[1]), Number(m[2])] : [0, 0, 0];
};

/** Square side at full light, as a share of the lattice pitch. */
const CHEQUER_FILL = 1;
/** And at the threshold — 0.7 of the pitch, not the dot's own 0.45. */
const CHEQUER_SEED = 0.7;

const falloff = (t: number) => {
  if (t >= 1) return 0;
  const u = 1 - t;
  return u * u;
};

export interface HalftoneParams {
  threshold: number;
  radius: number;
  waveSpeed: number;
  fade: number;
  source: "none" | "edge" | "wave";
}

export const HALFTONE_DEFAULTS: HalftoneParams = {
  threshold: 0.34,
  radius: 170,
  waveSpeed: 0.16,
  fade: 0.9,
  source: "none",
};

interface HalftoneLight {
  x: number;
  y: number;
  heat: number;
}

export function createHalftone(
  canvas: HTMLCanvasElement,
  host: Element,
  params: HalftoneParams = HALFTONE_DEFAULTS,
) {
  const palette = {
    dot: readRgb("--map-dot"),
    accent: readRgb("--accent"),
    bright: mix(readRgb("--accent"), [255, 255, 255], 0.55),
    white: readRgb("--foreground-on-dark"),
  };

  /* ---- the lattice index (built once) ----------------------------------- */
  const index = (() => {
    const { columns, rows, points, count } = DOTS;
    let minI = Infinity;
    let maxI = -Infinity;
    let minJ = Infinity;
    let maxJ = -Infinity;
    for (let i = 0; i < count; i += 1) {
      if (columns[i] < minI) minI = columns[i];
      if (columns[i] > maxI) maxI = columns[i];
      if (rows[i] < minJ) minJ = rows[i];
      if (rows[i] > maxJ) maxJ = rows[i];
    }
    const w = maxI - minI + 1;
    const h = maxJ - minJ + 1;
    const cell = new Int32Array(w * h).fill(-1);
    for (let i = 0; i < count; i += 1) {
      cell[(rows[i] - minJ) * w + (columns[i] - minI)] = i;
    }

    const dx = Math.cos(WAVE_ANGLE);
    const dy = Math.sin(WAVE_ANGLE);
    const projection = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      projection[i] = points[i * 2] * dx + points[i * 2 + 1] * dy;
    }
    const order = Array.from({ length: count }, (_, i) => i).sort(
      (a, b) => projection[a] - projection[b],
    );
    const sorted = new Int32Array(order);
    const sortedProjection = Float32Array.from(order, (i) => projection[i]);

    return {
      cell, w, h, minI, minJ, dx, dy, sorted, sortedProjection,
      projectionMin: sortedProjection[0],
      projectionMax: sortedProjection[count - 1],
    };
  })();

  const level = new Float32Array(DOTS.count);
  const active = new Int32Array(DOTS.count);
  const inList = new Uint8Array(DOTS.count);
  let activeCount = 0;
  let phase = 0;
  let spread = 0;
  let dirty = true;
  let last = 0;
  let baked: HTMLCanvasElement | null = null;

  const pointer: HalftoneLight = { x: 0, y: 0, heat: 0 };
  const target = { x: 0, y: 0, on: false };

  /* ---- the resting field, baked once per size change --------------------- */
  const bake = () => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) return;

    const ratio = Math.min(window.devicePixelRatio || 1, MAX_RATIO);
    const w = Math.round(width * ratio);
    const h = Math.round(height * ratio);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    baked = baked ?? document.createElement("canvas");
    baked.width = w;
    baked.height = h;

    const context = baked.getContext("2d");
    if (!context) return;
    const scale = w / MAP_VIEW.width;
    context.setTransform(scale, 0, 0, scale, 0, 0);
    context.clearRect(0, 0, MAP_VIEW.width, MAP_VIEW.height);

    const { points, count } = DOTS;
    context.fillStyle = css(palette.dot);
    context.beginPath();
    for (let i = 0; i < count; i += 1) {
      const x = points[i * 2];
      const y = points[i * 2 + 1];
      context.moveTo(x + DOT_RADIUS, y);
      context.arc(x, y, DOT_RADIUS, 0, Math.PI * 2);
    }
    context.fill();

    // Setting the canvas size cleared the visible layer, so put the field back
    // now rather than leaving it blank until the clock's first tick.
    dirty = true;
    draw();
  };

  /* ---- raise the dots the light reaches ---------------------------------- */
  const light = (p: HalftoneParams, dt: number) => {
    const { points } = DOTS;
    const radius = Math.max(1, p.radius);

    const add = (i: number, value: number) => {
      if (value <= MIN_LEVEL) return;
      if (value > level[i]) level[i] = value;
      if (!inList[i]) {
        inList[i] = 1;
        active[activeCount] = i;
        activeCount += 1;
      }
    };

    /** A round light at a point: ask the lattice for its rows and columns. */
    const addPoint = (source: HalftoneLight, reach: number) => {
      if (source.heat <= 0.01) return;
      const { cell, w, h, minI, minJ } = index;
      const i0 = Math.floor((source.x - reach - DOT_LATTICE.originX) / DOT_LATTICE.pitchX);
      const i1 = Math.ceil((source.x + reach - DOT_LATTICE.originX) / DOT_LATTICE.pitchX);
      const j0 = Math.floor((source.y - reach - DOT_LATTICE.originY) / DOT_LATTICE.pitchY);
      const j1 = Math.ceil((source.y + reach - DOT_LATTICE.originY) / DOT_LATTICE.pitchY);
      for (let j = Math.max(minJ, j0); j <= Math.min(minJ + h - 1, j1); j += 1) {
        const row = (j - minJ) * w;
        for (let i = Math.max(minI, i0); i <= Math.min(minI + w - 1, i1); i += 1) {
          const idx = cell[row + (i - minI)];
          if (idx < 0) continue;
          const d = Math.hypot(points[idx * 2] - source.x, points[idx * 2 + 1] - source.y);
          add(idx, falloff(d / reach) * source.heat);
        }
      }
    };

    /**
     * The reticle: the cursor's own lattice row and column, then a bloom where
     * they cross. The arms fall off linearly where the round lights fall off
     * quadratically — a square law puts the far half of each arm under the
     * threshold, and a crosshair that fades after a third of its length reads
     * as a smudge rather than a line.
     */
    const addReticle = (source: HalftoneLight) => {
      if (source.heat <= 0.01) return;
      const { cell, w, h, minI, minJ } = index;
      const ci = Math.round((source.x - DOT_LATTICE.originX) / DOT_LATTICE.pitchX);
      const cj = Math.round((source.y - DOT_LATTICE.originY) / DOT_LATTICE.pitchY);
      const arm = RETICLE_ARM * source.heat;
      const reach = RETICLE_OPEN * spread;

      if (reach > 1 && cj >= minJ && cj < minJ + h) {
        const row = (cj - minJ) * w;
        const span = Math.ceil(reach / DOT_LATTICE.pitchX);
        const from = Math.max(minI, ci - span);
        const to = Math.min(minI + w - 1, ci + span);
        for (let i = from; i <= to; i += 1) {
          const idx = cell[row + (i - minI)];
          if (idx < 0) continue;
          const d = Math.abs(points[idx * 2] - source.x);
          add(idx, (1 - d / reach) * arm);
        }
      }

      if (reach > 1 && ci >= minI && ci < minI + w) {
        const span = Math.ceil(reach / DOT_LATTICE.pitchY);
        const from = Math.max(minJ, cj - span);
        const to = Math.min(minJ + h - 1, cj + span);
        for (let j = from; j <= to; j += 1) {
          const idx = cell[(j - minJ) * w + (ci - minI)];
          if (idx < 0) continue;
          const d = Math.abs(points[idx * 2 + 1] - source.y);
          add(idx, (1 - d / reach) * arm);
        }
      }

      addPoint(source, RETICLE_CORE);
    };

    // The reticle stacks with whichever source is selected — `add` keeps the
    // brighter claim on a dot, so the two never sum into a blown-out patch.
    addReticle(pointer);

    // `none` ships: the cursor is the only light.
    if (p.source === "none") return;

    // The wave: a band crossing the map, found by binary search on the dots
    // sorted along its heading.
    phase = (phase + dt * p.waveSpeed) % 1;
    const { sorted, sortedProjection, projectionMin, projectionMax } = index;
    const span = projectionMax - projectionMin + radius * 2;
    const centre = projectionMin - radius + phase * span;
    const lo = centre - radius;
    const hi = centre + radius;

    let a = 0;
    let b = sortedProjection.length;
    while (a < b) {
      const m = (a + b) >> 1;
      if (sortedProjection[m] < lo) a = m + 1;
      else b = m;
    }
    for (let k = a; k < sortedProjection.length; k += 1) {
      const projection = sortedProjection[k];
      if (projection > hi) break;
      add(sorted[k], falloff(Math.abs(projection - centre) / radius));
    }
  };

  /* ---- the draw: blit the baked field, then the chequer ------------------ */
  function draw() {
    if (!baked || !canvas.width) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const p = params;
    const scale = canvas.width / MAP_VIEW.width;
    context.setTransform(scale, 0, 0, scale, 0, 0);
    context.clearRect(0, 0, MAP_VIEW.width, MAP_VIEW.height);
    context.drawImage(baked, 0, 0, MAP_VIEW.width, MAP_VIEW.height);

    const count = activeCount;
    const { points, columns, rows } = DOTS;
    const { accent, bright, white } = palette;

    // Two passes: every lit dot is lifted out of the baked field first, then
    // the chequer goes down. One pass would let a later dot's clear bite a
    // hole in a square already drawn.
    const box = DOT_RADIUS * 2 + 1;
    const span = 1 - p.threshold || 1;
    let drew = 0;
    for (let k = 0; k < count; k += 1) {
      const idx = active[k];
      if (level[idx] < p.threshold) continue;
      context.clearRect(
        points[idx * 2] - DOT_RADIUS - 0.5,
        points[idx * 2 + 1] - DOT_RADIUS - 0.5,
        box,
        box,
      );
      drew += 1;
    }
    if (!drew) return;

    for (let k = 0; k < count; k += 1) {
      const idx = active[k];
      const value = level[idx];
      if (value < p.threshold) continue;
      // The dark half of the chequer: cleared above and left cleared, so the
      // pattern is drawn as much by what the light takes as by what it puts
      // down — which is what stops a lit patch reading as a solid block.
      if ((columns[idx] + rows[idx]) & 1) continue;

      const t = Math.min(1, (value - p.threshold) / span);
      const side = DOT_LATTICE.pitchX * (CHEQUER_SEED + (CHEQUER_FILL - CHEQUER_SEED) * t);
      context.fillStyle = css(
        value > 0.8 ? white : value > 0.5 ? bright : mix(accent, bright, value),
      );
      context.fillRect(
        points[idx * 2] - side / 2,
        points[idx * 2 + 1] - side / 2,
        side,
        side,
      );
    }
  }

  /* ---- the frame -------------------------------------------------------- */
  const frame = () => {
    const now = performance.now();
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
    last = now;

    const p = params;

    // Walk the pointer light toward the cursor. The lag is the whole point: a
    // light with a little mass reads as something held over the map.
    const wanted = target.on ? POINTER_HEAT : 0;
    if (pointer.heat <= 0.001 && wanted > 0) {
      pointer.x = target.x;
      pointer.y = target.y;
    } else if (dt > 0) {
      const px = pointer.x;
      const py = pointer.y;
      pointer.x = approach(px, target.x, dt, POINTER_TRAIL);
      pointer.y = approach(py, target.y, dt, POINTER_TRAIL);
      // Measured off the light's own travel rather than the raw cursor.
      const speed = Math.hypot(pointer.x - px, pointer.y - py) / dt;
      const wantedSpread = Math.max(0, 1 - speed / RETICLE_SETTLE);
      spread = approach(
        spread,
        wantedSpread,
        dt,
        wantedSpread > spread ? SPREAD_OPEN : SPREAD_SHUT,
      );
    }
    pointer.heat = approach(
      pointer.heat,
      wanted,
      dt,
      wanted > pointer.heat ? POINTER_RISE : POINTER_FALL,
    );
    // Out means shut: the reticle should acquire on the way back in rather
    // than reappearing already open.
    if (pointer.heat < 0.005) {
      pointer.heat = 0;
      spread = 0;
    }

    // Fade what is already lit, and drop whatever has landed back.
    const decay = Math.exp(-dt / Math.max(0.05, p.fade / 3));
    let write = 0;
    for (let k = 0; k < activeCount; k += 1) {
      const idx = active[k];
      const value = level[idx] * decay;
      if (value > MIN_LEVEL) {
        level[idx] = value;
        active[write] = idx;
        write += 1;
      } else {
        level[idx] = 0;
        inList[idx] = 0;
      }
    }
    const before = activeCount;
    activeCount = write;

    light(p, dt);

    // An idle field repaints once and then stops asking for the blit.
    if (activeCount === 0 && before === 0 && !dirty) return;
    dirty = false;
    draw();
  };

  bake();
  new ResizeObserver(bake).observe(canvas);
  loopInView(host, frame, () => 0);

  return {
    /** The reticle only arms once the lap has cooled. */
    setPointer(x: number, y: number, on: boolean) {
      target.x = x;
      target.y = y;
      target.on = on;
    },
    params,
  };
}
