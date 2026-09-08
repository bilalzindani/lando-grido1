/**
 * react-spring's damped solver, reproduced: 1ms substeps, a 64ms frame cap,
 * mass 1, at rest when |velocity| and |target - value| are both under the
 * precision. A config given as { duration, easing } is a plain tween instead.
 */
export interface SpringConfig {
  tension?: number;
  friction?: number;
  mass?: number;
  precision?: number;
  duration?: number;
  easing?: (t: number) => number;
}

export function Spring(cfg: SpringConfig, initial = 0) {
  const s = {
    value: initial,
    velocity: 0,
    target: initial,
    from: initial,
    t: 0,
    done: true,
    cfg,
    to(v: number) {
      if (v === s.target) return;
      s.target = v;
      s.from = s.value;
      s.t = 0;
      s.done = false;
    },
    set(v: number) {
      s.value = s.target = s.from = v;
      s.velocity = 0;
      s.done = true;
    },
    step(dt: number) {
      if (s.done) return;
      const c = s.cfg;
      if (c.duration != null) {
        s.t = Math.min(c.duration, s.t + dt);
        const p = c.duration <= 0 ? 1 : s.t / c.duration;
        const e = c.easing ? c.easing(p) : p;
        s.value = s.from + (s.target - s.from) * e;
        if (p >= 1) {
          s.value = s.target;
          s.done = true;
        }
        return;
      }
      const tension = c.tension ?? 170;
      const friction = c.friction ?? 26;
      const mass = c.mass ?? 1;
      let remaining = Math.min(dt, 64);
      while (remaining > 0) {
        const h = Math.min(1, remaining) / 1000;
        const a = (-tension * (s.value - s.target) - friction * s.velocity) / mass;
        s.velocity += a * h;
        s.value += s.velocity * h;
        remaining -= 1;
      }
      const prec = c.precision ?? 0.01;
      if (Math.abs(s.velocity) < prec && Math.abs(s.target - s.value) < prec) {
        s.value = s.target;
        s.velocity = 0;
        s.done = true;
      }
    },
  };
  return s;
}
export type SpringState = ReturnType<typeof Spring>;

/** Named configs, baked. */
export const CFG = {
  REVEAL: { tension: 90, friction: 26 },
  ROW: { tension: 170, friction: 24 },
  ITEM: { tension: 170, friction: 24 },
  SHEET: { tension: 190, friction: 26 },
  FIGURE: { tension: 200, friction: 24 },
  TYPE: { tension: 210, friction: 24 },
  YEAR: { tension: 190, friction: 24 },
  COPY: { tension: 110, friction: 26 },
  COPY_FAST: { tension: 150, friction: 24 },
  NAME: { tension: 190, friction: 24 },
  VEIL: { tension: 70, friction: 24 },
  CLEAR: { tension: 140, friction: 26 },
  LABEL: { tension: 110, friction: 26 },
  PROGRESS_WAIT: { tension: 10, friction: 30 },
  PROGRESS_READY: { tension: 170, friction: 26 },
  YEAR_SETTLE: { tension: 32, friction: 26 },
  TRIGGER: { tension: 140, friction: 30 },
} satisfies Record<string, SpringConfig>;

/** Easings the tweened parts of the page use by name. */
export const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeOutQuad = (t: number) => 1 - (1 - t) * (1 - t);
export const linear = (t: number) => t;
