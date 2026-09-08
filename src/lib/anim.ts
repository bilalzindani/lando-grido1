import { subscribe, REDUCED } from "./ticker";
import { Spring, type SpringConfig } from "./spring";

/**
 * A spring for a linear system scales exactly with the distance travelled, so
 * one 0..1 spring driving every property of a unit is identical to one spring
 * per property with the same config — and a great deal cheaper.
 */
export type Props = Partial<{
  opacity: number;
  x: string;
  y: string;
  top: string;
  scale: number;
  scaleX: number;
  scaleY: number;
  rotate: number;
}>;

const NUM_UNIT = /^(-?[\d.]+)(.*)$/;

export function interp(a: string | number, b: string | number, t: number): string | number {
  if (typeof a === "number" && typeof b === "number") return a + (b - a) * t;
  const ma = String(a).match(NUM_UNIT);
  const mb = String(b).match(NUM_UNIT);
  if (!ma || !mb) return t < 0.5 ? a : b;
  const unit = mb[2] || ma[2] || "";
  return parseFloat(ma[1]) + (parseFloat(mb[1]) - parseFloat(ma[1])) * t + unit;
}

export function applyProps(el: HTMLElement, from: Props, to: Props, t: number, base?: string) {
  const tf: string[] = [];
  if (base) tf.push(base);
  if ("opacity" in to) el.style.opacity = String(interp(from.opacity ?? 0, to.opacity ?? 1, t));
  if ("top" in to) el.style.top = String(interp(from.top ?? "0px", to.top!, t));
  if ("x" in to) tf.push("translateX(" + interp(from.x ?? "0px", to.x!, t) + ")");
  if ("y" in to) tf.push("translateY(" + interp(from.y ?? "0px", to.y!, t) + ")");
  if ("scale" in to) tf.push("scale(" + interp(from.scale ?? 1, to.scale!, t) + ")");
  if ("scaleX" in to) tf.push("scaleX(" + interp(from.scaleX ?? 1, to.scaleX!, t) + ")");
  if ("scaleY" in to) tf.push("scaleY(" + interp(from.scaleY ?? 1, to.scaleY!, t) + ")");
  if ("rotate" in to) tf.push("rotate(" + interp(from.rotate ?? 0, to.rotate!, t) + "deg)");
  if (tf.length) el.style.transform = tf.join(" ");
}

export type Mode = "always" | "once" | "forward";

export interface AnimOptions {
  from?: Props;
  to?: Props;
  config?: SpringConfig;
  delay?: number;
  mode?: Mode;
  /** A transform kept in front of the animated one (e.g. a centring translate). */
  base?: string;
}

/**
 * One animated unit. `mode`:
 *   always  — animates to `to` while enabled, back to `from` when not
 *   once    — plays in once and never replays
 *   forward — plays in when enabled and holds `to` on the way back up
 */
export function makeAnim(el: HTMLElement, opt: AnimOptions) {
  const from = opt.from ?? { opacity: 0 };
  const to = opt.to ?? { opacity: 1 };
  const spring = Spring(opt.config ?? { tension: 90, friction: 26 }, 0);
  const delay = opt.delay ?? 0;
  const mode: Mode = opt.mode ?? "always";

  let enabled = false;
  let played = false;
  let armedAt = -1;
  let prev = -1;
  let stop: (() => void) | null = null;

  applyProps(el, from, to, REDUCED ? 1 : 0, opt.base);

  const tick = (time: number) => {
    const dt = prev < 0 ? 16 : Math.min(64, time - prev);
    prev = time;
    const active = enabled || (mode === "once" && played);
    if (active && armedAt < 0) armedAt = time;
    if (!active && mode === "always") armedAt = -1;
    const armed = active && time - armedAt >= delay;
    if (armed) {
      spring.to(1);
      played = true;
    } else if (!active && mode === "always") {
      spring.to(0);
    }
    spring.step(dt);
    applyProps(el, from, to, spring.value, opt.base);
    // stop paying for a unit that has arrived; enable() re-attaches
    if (spring.done && (armed || !active)) detach();
  };

  function attach() {
    if (!stop) {
      prev = -1;
      stop = subscribe(tick, () => 0);
    }
  }
  function detach() {
    if (stop) {
      stop();
      stop = null;
    }
  }

  return {
    enable(v: boolean) {
      if (v === enabled) return;
      enabled = v;
      if (REDUCED) {
        applyProps(el, from, to, v || mode !== "always" ? 1 : 0, opt.base);
        return;
      }
      if (v || mode === "always") attach();
    },
    get played() {
      return played;
    },
    destroy: detach,
  };
}
export type Anim = ReturnType<typeof makeAnim>;
