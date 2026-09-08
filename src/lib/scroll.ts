import { subscribe } from "./ticker";
import { Spring, CFG } from "./spring";

export type Pose =
  | "top_top" | "center_top" | "bottom_top"
  | "top_bottom" | "center_bottom" | "bottom_bottom"
  | "top_center" | "center_center" | "bottom_center";

/** Positions of a trigger element, all relative to the viewport. */
export function positions(bb: DOMRect, vh: number): Record<Pose, number> {
  return {
    top_top: bb.top,
    center_top: bb.top + bb.height / 2,
    bottom_top: bb.bottom,
    top_bottom: bb.top - vh,
    center_bottom: bb.top + bb.height / 2 - vh,
    bottom_bottom: bb.bottom - vh,
    top_center: bb.top - vh / 2,
    center_center: bb.top + bb.height / 2 - vh / 2,
    bottom_center: bb.bottom - vh / 2,
  };
}

export interface TriggerOptions {
  start?: Pose;
  end?: Pose;
  /** Raw 0..1 progress, every frame the element is in view. */
  onProgress?: (p: number, bb: DOMRect) => void;
  /** The same progress through a spring, for readers that want it smoothed. */
  onSmoothed?: (p: number) => void;
}

/**
 * A scroll trigger — the element's rect read inside the ticker at 10ms, gated
 * by an IntersectionObserver plus ten more frames after it leaves.
 */
export function scrollTrigger(el: Element, opt: TriggerOptions) {
  const start: Pose = opt.start ?? "top_bottom";
  const end: Pose = opt.end ?? "bottom_top";
  let inView = false;
  let grace = 0;
  let last = -1;
  const smooth = opt.onSmoothed ? Spring(CFG.TRIGGER, 0) : null;

  const io = new IntersectionObserver(
    ([e]) => {
      inView = e.isIntersecting;
      if (inView) grace = 10;
    },
    { rootMargin: "0px" },
  );
  io.observe(el);

  const stop = subscribe(
    (time) => {
      if (!inView) {
        if (grace <= 0) return;
        grace -= 1;
      }
      const bb = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const p = positions(bb, vh);
      const scrollStart = p[start];
      const scrollEnd = p[end];
      const length = Math.abs(scrollStart - scrollEnd) || 1;
      const progress = Math.min(Math.max(0, 1 - (scrollStart + length) / length), 1);
      opt.onProgress?.(progress, bb);
      if (smooth && opt.onSmoothed) {
        const dt = last < 0 ? 16 : Math.min(64, time - last);
        last = time;
        smooth.to(progress);
        smooth.step(dt);
        opt.onSmoothed(smooth.value);
      }
    },
    () => 10,
  );

  return () => {
    io.disconnect();
    stop();
  };
}

/**
 * A parallax layer: a scrub over the element's whole crossing that moves the
 * content on `top` from +travel to -travel, so it passes through its design
 * position exactly as the row passes the middle of the screen. Never a
 * transform — the design positions these against their own boxes.
 */
export function parallax(
  trigger: Element,
  layer: HTMLElement,
  travelCss: string,
  opt: { start?: Pose; end?: Pose } = {},
) {
  const sign = travelCss.startsWith("-") ? -1 : 1;
  const magnitude = travelCss.replace(/^-/, "");
  return scrollTrigger(trigger, {
    start: opt.start ?? "top_bottom",
    end: opt.end ?? "bottom_top",
    onProgress: (p) => {
      // +travel at the fold, -travel once it has gone
      layer.style.top = "calc(" + (1 - p * 2) * sign + " * " + magnitude + ")";
    },
  });
}

/** An in-view gate that fires once, at a rootMargin the caller chooses. */
export function inViewOnce(el: Element, cb: () => void, rootMargin = "0% 0% -25% 0%") {
  const io = new IntersectionObserver(
    ([e]) => {
      if (e.isIntersecting) {
        io.disconnect();
        cb();
      }
    },
    { rootMargin },
  );
  io.observe(el);
  return () => io.disconnect();
}

/** A one-shot tween on the shared ticker. Never re-runs, never reverses. */
export function tweenOnce(
  ms: number,
  easing: (t: number) => number,
  onChange: (v: number) => void,
  onRest?: () => void,
) {
  let start = -1;
  const stop = subscribe((time) => {
    if (start < 0) start = time;
    const p = Math.min(1, (time - start) / ms);
    onChange(easing(p));
    if (p >= 1) {
      stop();
      onRest?.();
    }
  }, () => 0);
  return stop;
}
