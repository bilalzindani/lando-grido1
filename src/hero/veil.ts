import { subscribe } from "../lib/ticker";
import { Spring, CFG } from "../lib/spring";
import { makeAnim } from "../lib/anim";

/**
 * The loading veil.
 *
 * Progress is not measured: it creeps to 0.7 on a soft spring (so a warm load
 * resolves with the meter about a third across) and completes to 1 on a stiff
 * one the moment the scene reports ready. The exit runs in three beats — the
 * veil's own content clears, then CLEAR_MS + PAUSE_MS later the veil lifts and
 * the page's entrance begins on the same tick. The element is removed only
 * when its *rendered* opacity has gone, never on a timer.
 */
const CLEAR_MS = 430;
const PAUSE_MS = 240;
const LIFT_TIMEOUT_MS = 3000;

export function createVeil(maskUrl: string) {
  const el = document.createElement("div");
  el.className = "veil";
  el.setAttribute("role", "status");
  el.setAttribute("aria-label", "Loading Grido1 Racing Systems");
  el.innerHTML =
    '<div class="veil__inner">' +
    '<div class="veil__helmet"><span class="veil__shell"></span><span class="veil__fill"></span></div>' +
    '<p class="veil__name">kimi antonelli</p>' +
    "</div>" +
    '<div class="veil__meter"><i></i></div>';
  document.body.appendChild(el);

  const helmet = el.querySelector<HTMLElement>(".veil__helmet")!;
  helmet.style.setProperty("-webkit-mask-image", "url(" + maskUrl + ")");
  helmet.style.maskImage = "url(" + maskUrl + ")";

  const fill = el.querySelector<HTMLElement>(".veil__fill")!;
  const meter = el.querySelector<HTMLElement>(".veil__meter i")!;
  const inner = el.querySelector<HTMLElement>(".veil__inner")!;
  const meterTrack = el.querySelector<HTMLElement>(".veil__meter")!;

  makeAnim(el.querySelector<HTMLElement>(".veil__name")!, {
    from: { opacity: 0, y: "0.6rem" },
    to: { opacity: 1, y: "0rem" },
    config: CFG.LABEL,
    delay: 260,
    mode: "once",
  }).enable(true);

  const pcfg = { ...CFG.PROGRESS_WAIT };
  const progress = Spring(pcfg, 0);
  progress.to(0.7);

  let prev = -1;
  const stopProgress = subscribe((time) => {
    const dt = prev < 0 ? 16 : Math.min(64, time - prev);
    prev = time;
    progress.step(dt);
    const v = Math.max(0, Math.min(1, progress.value));
    fill.style.transform = "scaleY(" + v + ")";
    meter.style.transform = "scaleX(" + v + ")";
  }, () => 0);

  const handovers: (() => void)[] = [];
  let fired = false;

  return {
    onHandover(fn: () => void) {
      handovers.push(fn);
    },
    ready() {
      if (fired) return;
      fired = true;
      Object.assign(pcfg, CFG.PROGRESS_READY);
      progress.to(1);
      el.style.pointerEvents = "none";
      el.setAttribute("aria-label", "Loaded");

      // beat 1 — the veil's own content clears
      makeAnim(inner, {
        from: { opacity: 1, y: "0rem" },
        to: { opacity: 0, y: "-0.75rem" },
        config: CFG.CLEAR,
        mode: "once",
      }).enable(true);
      makeAnim(meterTrack, {
        from: { opacity: 1 },
        to: { opacity: 0 },
        config: CFG.CLEAR,
        mode: "once",
      }).enable(true);

      // beat 2 — the veil lifts and the page's entrance begins on the same tick
      window.setTimeout(() => {
        makeAnim(el, {
          from: { opacity: 1 },
          to: { opacity: 0 },
          config: CFG.VEIL,
          mode: "once",
        }).enable(true);
        handovers.forEach((fn) => fn());

        // beat 3 — removed only once the rendered opacity has actually gone
        const started = performance.now();
        const poll = subscribe((t) => {
          const o = parseFloat(getComputedStyle(el).opacity) || 0;
          if (o <= 0.004 || t - started > LIFT_TIMEOUT_MS) {
            stopProgress();
            el.remove();
            poll();
          }
        }, () => 0);
      }, CLEAR_MS + PAUSE_MS);
    },
  };
}
export type Veil = ReturnType<typeof createVeil>;
