import { CIRCUIT_PATH, CIRCUIT_MARKERS, CIRCUIT_STEP, type CircuitPoint } from "./circuit-path";
import { FLAG_CUT, mapToArtboard } from "./map-vector";
import { readRgb, mix, rgba, type Rgb } from "../lib/tokens";

/**
 * The lap — one 6-second pass when the block arrives, drawn on the trace
 * canvas in the block's 1440x800 artboard units. Verbatim from the spec, with
 * the fragment's free variables (the context, the palette, the heat) closed
 * over by a factory.
 *
 * Pacing lives in the path's own curvature: the lap slows through the corners
 * and runs away down the straights.
 */
export const LAP_MS = 6000;
const LINE_WIDTH = 5.9; // the crisp core; the raster's own track is 5.75 across
const GLOW_WIDTH = 15; // the additive bloom around the head
const HEAD_UNITS = 210; // the hot zone behind the tip
export const COOL_MS = 800;
const MARKER_POP_UNITS = 90; // how far past a marker the arrival flare settles
const CORNER_BRAKE = 9; // how hard the corners slow the lap. 0 = a metronome

const CUT_CENTRE = mapToArtboard(FLAG_CUT.x, FLAG_CUT.y);
const CUT_SCALE = 1438.43 / 2560;
const CUT_ALONG = FLAG_CUT.along * CUT_SCALE;
const CUT_ACROSS = FLAG_CUT.across * CUT_SCALE;

const CUMULATIVE = CIRCUIT_PATH.reduce<number[]>((acc, point, i) => {
  if (i === 0) return [0];
  const previous = CIRCUIT_PATH[i - 1];
  acc.push(acc[i - 1] + Math.hypot(point[0] - previous[0], point[1] - previous[1]));
  return acc;
}, []);
/** NOT the rounded CIRCUIT_LENGTH — half a unit off reopens the seam. */
export const TOTAL = CUMULATIVE[CUMULATIVE.length - 1];

const TIME_AT = (() => {
  const count = CIRCUIT_PATH.length;
  const turn = new Array(count).fill(0);
  for (let i = 1; i < count - 1; i += 1) {
    const [ax, ay] = CIRCUIT_PATH[i - 1];
    const [bx, by] = CIRCUIT_PATH[i];
    const [cx, cy] = CIRCUIT_PATH[i + 1];
    const ux = bx - ax, uy = by - ay, vx = cx - bx, vy = cy - by;
    const lengths = (Math.hypot(ux, uy) || 1) * (Math.hypot(vx, vy) || 1);
    turn[i] = Math.acos(Math.min(1, Math.max(-1, (ux * vx + uy * vy) / lengths)));
  }
  const window = 6;
  const smoothed = turn.map((_, i) => {
    let sum = 0, n = 0;
    for (let j = Math.max(0, i - window); j <= Math.min(count - 1, i + window); j += 1) {
      sum += turn[j];
      n += 1;
    }
    return sum / n;
  });
  const accumulated = [0];
  for (let i = 1; i < count; i += 1) {
    const span = CUMULATIVE[i] - CUMULATIVE[i - 1];
    const speed = 1 / (1 + CORNER_BRAKE * smoothed[i]);
    accumulated.push(accumulated[i - 1] + span / speed);
  }
  const total = accumulated[count - 1] || 1;
  return accumulated.map((value) => value / total);
})();

export const distanceAtTime = (time: number) => {
  if (time <= 0) return 0;
  if (time >= 1) return TOTAL;
  let low = 0, high = TIME_AT.length - 1;
  while (low < high - 1) {
    const mid = (low + high) >> 1;
    if (TIME_AT[mid] <= time) low = mid;
    else high = mid;
  }
  const span = TIME_AT[high] - TIME_AT[low] || 1;
  const ratio = (time - TIME_AT[low]) / span;
  return CUMULATIVE[low] + (CUMULATIVE[high] - CUMULATIVE[low]) * ratio;
};

const trailUpTo = (distance: number): CircuitPoint[] => {
  const out: CircuitPoint[] = [];
  for (let i = 0; i < CIRCUIT_PATH.length; i += 1) {
    if (CUMULATIVE[i] <= distance) {
      out.push(CIRCUIT_PATH[i]);
      continue;
    }
    const a = CIRCUIT_PATH[i - 1];
    const b = CIRCUIT_PATH[i];
    const ratio = (distance - CUMULATIVE[i - 1]) / (CUMULATIVE[i] - CUMULATIVE[i - 1]);
    out.push([a[0] + (b[0] - a[0]) * ratio, a[1] + (b[1] - a[1]) * ratio]);
    break;
  }
  return out;
};

export function createTrace(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d")!;
  // palette: accent = --accent, white = --foreground-on-dark,
  // bright = mix(accent, white, 0.55) → [141, 243, 250]
  const accent = readRgb("--accent");
  const white = readRgb("--foreground-on-dark");
  const palette = { accent, white, bright: mix(accent, white, 0.55) as Rgb };

  const stroke = (points: CircuitPoint[], scale: number, from = 0) => {
    context.beginPath();
    context.moveTo(points[from][0] * scale, points[from][1] * scale);
    for (let i = from + 1; i < points.length; i += 1) {
      context.lineTo(points[i][0] * scale, points[i][1] * scale);
    }
    context.stroke();
  };

  const drawTrail = (
    points: CircuitPoint[],
    scale: number,
    minWidth: number,
    glow: boolean,
    heat: number,
  ) => {
    if (points.length < 2) return;
    const width = Math.max(minWidth, LINE_WIDTH * scale);
    context.lineCap = "round";
    context.lineJoin = "round";
    if (glow) {
      context.save();
      context.globalCompositeOperation = "lighter";
      context.strokeStyle = rgba(palette.accent, 0.05);
      context.lineWidth = GLOW_WIDTH * scale;
      stroke(points, scale);
      context.strokeStyle = rgba(palette.accent, 0.1);
      context.lineWidth = GLOW_WIDTH * 0.45 * scale;
      stroke(points, scale);
      context.restore();
    }
    // The hot zone: accent into the light accent, at the SAME width.
    const head = Math.max(2, Math.round(HEAD_UNITS / CIRCUIT_STEP));
    const from = Math.max(0, points.length - head);
    const tip = points[points.length - 1];
    const hot = context.createLinearGradient(
      points[from][0] * scale, points[from][1] * scale,
      tip[0] * scale, tip[1] * scale,
    );
    hot.addColorStop(0, rgba(palette.accent, 0));
    hot.addColorStop(0.45, rgba(palette.accent, 0.9));
    hot.addColorStop(1, rgba(mix(palette.accent, palette.bright, heat), 1));
    context.strokeStyle = hot;
    context.lineWidth = width;
    stroke(points, scale, from);
    // A white filament down the middle of the last third — the only white.
    const coreFrom = Math.max(0, points.length - Math.round(head * 0.42));
    if (points.length - coreFrom > 1) {
      const core = context.createLinearGradient(
        points[coreFrom][0] * scale, points[coreFrom][1] * scale,
        tip[0] * scale, tip[1] * scale,
      );
      core.addColorStop(0, rgba(palette.bright, 0));
      core.addColorStop(1, rgba(palette.white, 0.95 * heat));
      context.strokeStyle = core;
      context.lineWidth = Math.max(minWidth * 0.6, width * 0.38);
      stroke(points, scale, coreFrom);
    }
  };

  const render = (progress: number, heat: number) => {
    const distance = distanceAtTime(progress);
    const points = trailUpTo(distance);
    context.clearRect(0, 0, 1440, 800);
    if (points.length > 1) {
      drawTrail(points, 1, 0.6, true, heat);
      const [tx, ty] = points[points.length - 1]; // the spark at the tip, additive
      context.save();
      context.globalCompositeOperation = "lighter";
      const spark = context.createRadialGradient(tx, ty, 0, tx, ty, LINE_WIDTH * 2.6);
      spark.addColorStop(0, rgba(palette.white, 0.85 * heat));
      spark.addColorStop(0.35, rgba(palette.bright, 0.4 * heat));
      spark.addColorStop(1, rgba(palette.accent, 0));
      context.fillStyle = spark;
      context.beginPath();
      context.arc(tx, ty, LINE_WIDTH * 2.6, 0, Math.PI * 2);
      context.fill();
      context.restore();
    }
    // Punch the finish out of everything just drawn, so the glow stops at the
    // flag like the ribbon.
    context.save();
    context.translate(CUT_CENTRE[0], CUT_CENTRE[1]);
    context.rotate((FLAG_CUT.angle * Math.PI) / 180);
    context.clearRect(-CUT_ALONG / 2, -CUT_ACROSS / 2, CUT_ALONG, CUT_ACROSS);
    context.restore();

    for (const marker of CIRCUIT_MARKERS) {
      if (distance < marker.d) continue;
      const age = Math.min(1, (distance - marker.d) / MARKER_POP_UNITS);
      const radius = 12 + (1 - age) * 14;
      const glow = context.createRadialGradient(marker.x, marker.y, 0, marker.x, marker.y, radius);
      glow.addColorStop(0, rgba(palette.bright, 0.5 + 0.45 * (1 - age)));
      glow.addColorStop(0.45, rgba(palette.accent, 0.32));
      glow.addColorStop(1, rgba(palette.accent, 0));
      context.save();
      context.globalCompositeOperation = "lighter";
      context.fillStyle = glow;
      context.beginPath();
      context.arc(marker.x, marker.y, radius, 0, Math.PI * 2);
      context.fill();
      context.restore();
      if (age < 1) {
        context.strokeStyle = rgba(palette.bright, (1 - age) * 0.6);
        context.lineWidth = 1;
        context.beginPath();
        context.arc(marker.x, marker.y, 9 + age * 20, 0, Math.PI * 2);
        context.stroke();
      }
    }
  };

  /** The backing store is CSS size x the ratio; drawing is in artboard units. */
  const resize = () => {
    const ratio = window.matchMedia("(hover: none) and (pointer: coarse)").matches
      ? 1
      : Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(1440 * ratio);
    canvas.height = Math.round(800 * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  };
  resize();

  return { render, resize };
}
