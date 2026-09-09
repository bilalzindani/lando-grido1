import { subscribe, REDUCED } from "../lib/ticker";
import { CFG } from "../lib/spring";
import { makeAnim, type Anim } from "../lib/anim";
import { splitText, type TextRun } from "../lib/text";
import { ASSET_BASE_URL, asset } from "../lib/assets";
import { reportAssetFailure } from "../lib/fail";
import { createVeil } from "./veil";
import { HeroScene, DEFAULT_PARAMS, fitSubjectToBox } from "./scene";
import type { SceneTier } from "./device";

/** The scene stops drawing once the scroll has carried this far past the fold. */
const COVERED_AFTER = 1.15;

export function mountHero() {
  const section = document.querySelector<HTMLElement>("[data-hero]")!;
  const canvas = document.querySelector<HTMLCanvasElement>("[data-hero-canvas]")!;
  const fitbox = document.querySelector<HTMLElement>("[data-hero-fitbox]")!;
  const veil = createVeil(asset("hero/ui/helmet-mask.png"));

  /* ---- the entrance, every delay measured from the handover -------------- */
  const items: Anim[] = [];
  const runs: TextRun[] = [];
  const q = <T extends HTMLElement>(s: string) => document.querySelector<T>(s)!;

  items.push(
    makeAnim(q('[data-reveal="masthead"]'), {
      from: { opacity: 0, y: "1.25rem" },
      to: { opacity: 1, y: "0rem" },
      config: CFG.REVEAL,
      delay: 0,
      mode: "once",
    }),
  );
  items.push(
    makeAnim(q('[data-reveal="id"]'), {
      from: { opacity: 0 },
      to: { opacity: 1 },
      config: CFG.REVEAL,
      delay: 180,
      mode: "once",
    }),
  );
  document.querySelectorAll<HTMLElement>('[data-reveal="meta"]').forEach((el, i) => {
    items.push(
      makeAnim(el, {
        from: { opacity: 0, y: "0.75rem" },
        to: { opacity: 1, y: "0rem" },
        config: CFG.ROW,
        delay: 180 + 260 + i * 130,
        mode: "once",
      }),
    );
  });
  items.push(
    makeAnim(q('[data-reveal="panels"]'), {
      from: { opacity: 0, y: "1.25rem" },
      to: { opacity: 1, y: "0rem" },
      config: CFG.REVEAL,
      delay: 900,
      mode: "once",
    }),
  );
  items.push(
    makeAnim(q('[data-reveal="actions"]'), {
      from: { opacity: 0, y: "1.25rem" },
      to: { opacity: 1, y: "0rem" },
      config: CFG.REVEAL,
      delay: 1500,
      mode: "once",
    }),
  );

  // the name, word by word
  runs.push(
    splitText(q("[data-hero-name]"), {
      kind: "words",
      stagger: 110,
      config: CFG.REVEAL,
      delay: 180,
      mode: "once",
      justify: "flex-start",
    }),
  );
  // the three stat figures, letter by letter
  document.querySelectorAll<HTMLElement>("[data-hero-figure-text]").forEach((el, i) => {
    runs.push(
      splitText(el, {
        kind: "letters",
        stagger: 26,
        config: CFG.FIGURE,
        delay: i * 90,
        mode: "forward",
      }),
    );
  });

  const beginEntrance = () => {
    items.forEach((a) => a.enable(true));
    runs.forEach((r) => r.enable(true));
  };

  /* ---- the scene --------------------------------------------------------- */
  let scene: HeroScene | null = null;
  try {
    scene = new HeroScene(canvas);
  } catch (error) {
    reportAssetFailure(ASSET_BASE_URL + "/hero/scene (WebGL unavailable)", error);
  }

  if (!scene) {
    // No WebGL: the static contour backdrop and the portrait stand in, and the
    // veil lifts immediately.
    section.classList.add("hero--flat");
    const bg = document.createElement("img");
    bg.className = "hero__flat-bg";
    bg.src = asset("hero/ui/backdrop-lines.svg");
    bg.alt = "";
    bg.setAttribute("aria-hidden", "true");
    const person = document.createElement("img");
    person.className = "hero__flat-person";
    person.src = asset("hero/scene/person-diffuse.webp");
    person.alt = "";
    person.setAttribute("aria-hidden", "true");
    canvas.replaceWith(bg);
    fitbox.appendChild(person);
    veil.onHandover(beginEntrance);
    veil.ready();
    return;
  }

  const s = scene;
  let tier: SceneTier = s.tier;

  const applyFit = () => {
    const sr = section.getBoundingClientRect();
    const params = { ...DEFAULT_PARAMS };
    // From xl the box is display:none, so the subject fills the canvas — the
    // composition the frame was signed off at.
    if (fitbox.offsetParent !== null) {
      const b = fitbox.getBoundingClientRect();
      Object.assign(
        params,
        fitSubjectToBox(
          DEFAULT_PARAMS,
          { top: b.top - sr.top, height: b.height },
          section.clientHeight,
        ),
      );
    }
    // Every touch width, not just phones: the parked cursor reveal never moves
    // and reads as a blob.
    if (window.matchMedia("(max-width: 1023px)").matches) params.bgRevealOpacity = 0;
    // Where there is no pointer at all the reveal is driven by the idle sweep.
    if (window.matchMedia("(hover: none)").matches) params.autoSweepAmount = 0.76;
    // The brush is sized for the screen.
    if (window.matchMedia("(max-width: 639px)").matches) {
      params.sweepRadius = 0.95;
      params.sweepWarp = 0.18;
      params.autoSweepAmount = 0.55;
    }
    // Last, because it overrides the two above.
    if (!tier.reveal) params.autoSweepAmount = 0;
    s.setParams(params);
  };

  const resize = () => {
    s.resize(section.clientWidth, section.clientHeight);
    applyFit();
  };

  /* pointer — bound only when the tier allows it, rebound on every retune */
  let bound = false;
  const onPointer = (e: PointerEvent) => {
    s.setPointer((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
  };
  const syncPointer = () => {
    if (tier.pointerEnabled && !bound) {
      window.addEventListener("pointermove", onPointer, { passive: true });
      bound = true;
    } else if (!tier.pointerEnabled && bound) {
      window.removeEventListener("pointermove", onPointer);
      bound = false;
    }
  };
  syncPointer();

  /* the tier is re-read on a width change or a pointer-class flip; a
     height-only change on a coarse pointer is the iOS URL bar — ignore it. */
  let lastWidth = -1;
  let queued = false;
  const observer = new ResizeObserver(() => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      const w = section.clientWidth;
      if (w !== lastWidth) {
        lastWidth = w;
        tier = s.retune();
        syncPointer();
      } else if (!tier.coarsePointer) {
        // a genuine height change on a mouse device
      } else {
        return;
      }
      resize();
    });
  });
  observer.observe(section);
  window.matchMedia("(hover: none) and (pointer: coarse)").addEventListener("change", () => {
    tier = s.retune();
    syncPointer();
    resize();
  });
  resize();

  /* the loop — only while the hero is in view (plus ten frames), the tab is
     visible, and the scroll has not carried past it */
  let inView = true;
  let grace = 10;
  new IntersectionObserver(
    ([e]) => {
      inView = e.isIntersecting;
      if (inView) grace = 10;
    },
    { rootMargin: "0px" },
  ).observe(section);

  subscribe(
    (time) => {
      if (document.hidden) return;
      if (!inView) {
        if (grace <= 0) return;
        grace -= 1;
      }
      if (window.scrollY > window.innerHeight * COVERED_AFTER) return;
      s.update(time);
    },
    () => tier.frameInterval,
  );

  /**
   * The veil waits on the scene, and the scene waits on the network. A model
   * that never decodes would otherwise leave the veil up forever at 70% —
   * the exact failure the asset banner is there to name, except the reader
   * never gets to see the page underneath it. So readiness has a watchdog:
   * past this the page opens anyway, with the banner saying what is missing.
   */
  const READY_TIMEOUT_MS = 12000;
  const watchdog = window.setTimeout(() => {
    if (s.ready) return;
    reportAssetFailure(ASSET_BASE_URL + "/hero/scene (did not finish loading)");
    section.classList.add("hero--flat");
    veil.ready();
  }, READY_TIMEOUT_MS);

  s.onReady = () => {
    window.clearTimeout(watchdog);
    veil.ready();
  };
  if (s.ready) {
    window.clearTimeout(watchdog);
    veil.ready();
  }
  veil.onHandover(() => {
    beginEntrance();
    s.beginRise();
  });

  // Reduced motion still gets the entrance; the scene freezes itself after it.
  if (REDUCED) section.classList.add("hero--calm");
}
