/**
 * The shared ticker — one rAF loop, reference counted. A subscriber is called
 * only when `time - last > getFramerate()`, so a framerate of 0 runs every tick
 * and 1000/60 - 2 gives 60 on a 60Hz screen and every second tick at 120.
 */
type Sub = { cb: (time: number) => void; rate: () => number; last: number };

const subs = new Set<Sub>();
let raf = 0;

const frame = (time: number) => {
  raf = requestAnimationFrame(frame);
  for (const s of Array.from(subs)) {
    if (time - s.last > s.rate()) {
      s.last = time;
      s.cb(time);
    }
  }
};

export function subscribe(cb: (time: number) => void, rate: () => number = () => 0) {
  const s: Sub = { cb, rate, last: -Infinity };
  subs.add(s);
  if (!raf) raf = requestAnimationFrame(frame);
  return () => {
    subs.delete(s);
    if (!subs.size && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };
}

/** Everything on the page reads this, so one media query decides. */
export const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * A loop that only runs while its element is on screen — plus ten more frames
 * after it leaves, which is what every canvas on the page uses.
 */
export function loopInView(
  el: Element,
  cb: (time: number) => void,
  rate: () => number = () => 0,
) {
  let inView = false;
  let grace = 0;
  const io = new IntersectionObserver(
    ([e]) => {
      inView = e.isIntersecting;
      if (inView) grace = 10;
    },
    { rootMargin: "0px" },
  );
  io.observe(el);
  const stop = subscribe((time) => {
    if (!inView) {
      if (grace <= 0) return;
      grace -= 1;
    }
    cb(time);
  }, rate);
  return () => {
    io.disconnect();
    stop();
  };
}
