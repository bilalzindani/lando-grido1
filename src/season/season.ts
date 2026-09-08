import {
  MAP_VIEW, TRACK_RIBBON, LAP_CENTRELINE, LAP_MASK_WIDTH, LAP_LENGTH,
  GRID_AXES_X, GRID_AXIS_Y, GRID_DASH, GRID_STROKE, HUB, RINGS, CORNER_MARKS,
  CORNER_MARK_SIZE, TURN_POINTS, TURNS, FLAG_CUT, FLAG_DIAMONDS,
} from "./map-vector";
import { CIRCUIT_PATH } from "./circuit-path";
import { createTrace, LAP_MS, COOL_MS, distanceAtTime, TOTAL } from "./trace";
import { createHalftone } from "./halftone-engine";
import { subscribe, REDUCED } from "../lib/ticker";
import { CFG, easeInOutSine, easeOutCubic, easeOutQuad, linear } from "../lib/spring";
import { makeAnim } from "../lib/anim";
import { splitText, masthead } from "../lib/text";
import { readToken } from "../lib/tokens";
import { chequeredSeam } from "../lib/flag";
import { STANDINGS } from "../data/home";

const SVG = "http://www.w3.org/2000/svg";
const el = (name: string, attrs: Record<string, string | number> = {}) => {
  const node = document.createElementNS(SVG, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
};

/** The track box: the lap path's bounding box padded 46. */
const TRACK_BOX = (() => {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of CIRCUIT_PATH) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const pad = 46;
  return {
    x: minX - pad,
    y: minY - pad,
    width: maxX - minX + pad * 2,
    height: maxY - minY + pad * 2,
  };
})();

export function mountSeason() {
  const section = document.querySelector<HTMLElement>("[data-season]")!;
  const frame = section.querySelector<HTMLElement>("[data-season-frame]")!;
  const stage = section.querySelector<HTMLElement>("[data-season-stage]")!;
  const mapBox = section.querySelector<HTMLElement>("[data-season-map]")!;
  const dots = section.querySelector<HTMLCanvasElement>("[data-season-dots]")!;
  const traceCanvas = section.querySelector<HTMLCanvasElement>("[data-season-trace]")!;

  /* ---- the map SVG, in its own 2560x1440 space -------------------------- */
  const svg = el("svg", {
    viewBox: "0 0 " + MAP_VIEW.width + " " + MAP_VIEW.height,
    overflow: "visible",
    "aria-hidden": "true",
    class: "season__map-svg",
  });

  // grid — three vertical axes and one horizontal, drawn 4000 units past the
  // artboard on both ends, crawling one dash period every 7s
  const grid = el("g", { id: "grid" });
  const OVERRUN = 4000;
  const axes: SVGElement[] = [];
  for (const x of GRID_AXES_X) {
    const line = el("line", {
      x1: x, y1: -OVERRUN, x2: x, y2: MAP_VIEW.height + OVERRUN,
      stroke: "var(--map-grid)", "stroke-width": GRID_STROKE,
      "stroke-dasharray": GRID_DASH,
    });
    grid.appendChild(line);
    axes.push(line);
  }
  const hAxis = el("line", {
    x1: -OVERRUN, y1: GRID_AXIS_Y, x2: MAP_VIEW.width + OVERRUN, y2: GRID_AXIS_Y,
    stroke: "var(--map-grid)", "stroke-width": GRID_STROKE,
    "stroke-dasharray": GRID_DASH,
  });
  grid.appendChild(hAxis);
  axes.push(hAxis);

  for (const ring of RINGS) {
    grid.appendChild(
      el("circle", {
        cx: HUB.x, cy: HUB.y, r: ring.r, fill: "none",
        stroke: ring.ghost ? "var(--map-grid-ghost)" : "var(--map-grid)",
        "stroke-width": ring.width,
      }),
    );
  }
  const ping = el("circle", {
    cx: HUB.x, cy: HUB.y, r: HUB.r, fill: "none",
    stroke: "var(--accent)", "stroke-width": GRID_STROKE, opacity: 0,
  });
  grid.appendChild(ping);
  for (const [x, y] of CORNER_MARKS) {
    grid.appendChild(
      el("rect", {
        x: x - CORNER_MARK_SIZE / 2, y: y - CORNER_MARK_SIZE / 2,
        width: CORNER_MARK_SIZE, height: CORNER_MARK_SIZE, fill: "var(--map-mark)",
      }),
    );
  }
  grid.appendChild(el("circle", { cx: HUB.x, cy: HUB.y, r: HUB.r, fill: "var(--map-mark)" }));
  svg.appendChild(grid);

  // defs — the flag cut and the lap mask
  const defs = el("defs");
  const cut = el("mask", { id: "season-cut", maskUnits: "userSpaceOnUse",
    x: 0, y: 0, width: MAP_VIEW.width, height: MAP_VIEW.height });
  cut.appendChild(el("rect", { x: 0, y: 0, width: MAP_VIEW.width, height: MAP_VIEW.height, fill: "#fff" }));
  cut.appendChild(
    el("rect", {
      x: FLAG_CUT.x - FLAG_CUT.along / 2, y: FLAG_CUT.y - FLAG_CUT.across / 2,
      width: FLAG_CUT.along, height: FLAG_CUT.across, fill: "#000",
      transform: "rotate(" + FLAG_CUT.angle + " " + FLAG_CUT.x + " " + FLAG_CUT.y + ")",
    }),
  );
  defs.appendChild(cut);

  const lapMask = el("mask", { id: "season-lap", maskUnits: "userSpaceOnUse",
    x: 0, y: 0, width: MAP_VIEW.width, height: MAP_VIEW.height });
  const lapLine = el("path", {
    d: LAP_CENTRELINE, fill: "none", stroke: "#fff",
    "stroke-width": LAP_MASK_WIDTH, "stroke-linecap": "round", "stroke-linejoin": "round",
    "stroke-dasharray": LAP_LENGTH + 60,
    "stroke-dashoffset": 60 + LAP_LENGTH,
  });
  lapMask.appendChild(lapLine);
  defs.appendChild(lapMask);
  svg.appendChild(defs);

  // the track, cut at the flag
  const track = el("g", { mask: "url(#season-cut)" });
  track.appendChild(el("path", { d: TRACK_RIBBON, fill: "var(--foreground-on-dark)" }));
  const lit = el("g", { mask: "url(#season-lap)" });
  lit.appendChild(el("path", { d: TRACK_RIBBON, fill: "var(--accent)" }));
  track.appendChild(lit);
  svg.appendChild(track);

  // markers
  const markers = el("g", { id: "markers" });
  for (const turn of TURNS) {
    markers.appendChild(
      el("polygon", {
        points: TURN_POINTS, fill: "var(--accent)",
        transform: "translate(" + turn.x + " " + turn.y + ") rotate(" + turn.angle + ")",
      }),
    );
  }
  markers.appendChild(el("path", { d: FLAG_DIAMONDS, fill: "var(--map-mark)" }));
  svg.appendChild(markers);

  mapBox.appendChild(svg);

  /* ---- the halftone and the trace ---------------------------------------- */
  const halftone = createHalftone(dots, section);
  const trace = createTrace(traceCanvas);

  /* ---- the stage fit ------------------------------------------------------ */
  const fit = () => {
    const w = frame.clientWidth;
    const h = frame.clientHeight;
    if (!w || !h) return;
    let scale: number;
    let tx: number;
    let ty: number;
    if (w >= 1024) {
      // cover
      scale = Math.max(w / 1440, h / 800);
      tx = (w - 1440 * scale) / 2;
      ty = (h - 800 * scale) / 2;
    } else {
      // fit the track box to the width, centred on the box's centre
      scale = w / TRACK_BOX.width;
      tx = w / 2 - (TRACK_BOX.x + TRACK_BOX.width / 2) * scale;
      ty = h / 2 - (TRACK_BOX.y + TRACK_BOX.height / 2) * scale;
    }
    stage.style.transform = "translate(" + tx + "px, " + ty + "px) scale(" + scale + ")";
  };
  fit();
  new ResizeObserver(fit).observe(frame);

  /* ---- the lap: one 6-second pass when the block arrives ------------------ */
  let lap = 0;
  let heat = 1;
  let armed = false;

  const renderAll = () => {
    trace.render(lap, heat);
    const reveal = 1 - distanceAtTime(lap) / TOTAL;
    lapLine.setAttribute("stroke-dashoffset", String(60 + reveal * LAP_LENGTH));
  };
  renderAll();

  const runLap = () => {
    if (REDUCED) {
      lap = 1;
      heat = 0;
      armed = true;
      renderAll();
      return;
    }
    let start = -1;
    const stop = subscribe((time) => {
      if (start < 0) start = time;
      lap = easeInOutSine(Math.min(1, (time - start) / LAP_MS));
      renderAll();
      if ((time - start) / LAP_MS >= 1) {
        stop();
        // when it rests, cool the head to a plain line
        let coolStart = -1;
        const cool = subscribe((t2) => {
          if (coolStart < 0) coolStart = t2;
          const p = Math.min(1, (t2 - coolStart) / COOL_MS);
          heat = 1 - easeOutCubic(p);
          renderAll();
          if (p >= 1) {
            cool();
            // and only when that rests is the cursor reticle armed
            armed = true;
          }
        }, () => 0);
      }
    }, () => 0);
  };

  const lapGate = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return;
      lapGate.disconnect();
      runLap();
    },
    { threshold: 0.35 },
  );
  lapGate.observe(frame);

  /* ---- the grid crawl and the hub ping ----------------------------------- */
  const GRID_MS = 7000;
  const PING_MS = 4200;
  const PING_REACH = 86;
  const DASH_PERIOD = 20.5;
  let inView = false;
  new IntersectionObserver(([e]) => { inView = e.isIntersecting; }).observe(section);
  subscribe((time) => {
    if (!inView) return; // both loops pause off screen
    const g = linear((time % GRID_MS) / GRID_MS) * DASH_PERIOD;
    for (const axis of axes) axis.setAttribute("stroke-dashoffset", String(g));
    const v = easeOutQuad((time % PING_MS) / PING_MS);
    ping.setAttribute("r", String(HUB.r + v * PING_REACH));
    ping.setAttribute("opacity", String(0.4 * (1 - v) * (1 - v)));
  }, () => (REDUCED ? 200 : 0));

  /* ---- the reticle, armed only after the lap has cooled ------------------- */
  const usesPointer =
    !window.matchMedia("(hover: none)").matches && !REDUCED;
  if (usesPointer) {
    const move = (e: PointerEvent) => {
      const rect = dots.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const box = section.getBoundingClientRect();
      const inside =
        armed &&
        e.clientX >= box.left && e.clientX <= box.right &&
        e.clientY >= box.top && e.clientY <= box.bottom;
      halftone.setPointer(
        ((e.clientX - rect.left) / rect.width) * MAP_VIEW.width,
        ((e.clientY - rect.top) / rect.height) * MAP_VIEW.height,
        inside,
      );
    };
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", () => halftone.setPointer(0, 0, false));
    window.addEventListener("blur", () => halftone.setPointer(0, 0, false));
  }

  /* ---- the copy column ---------------------------------------------------- */
  const head = section.querySelector<HTMLElement>("[data-season-head]")!;
  const headRun = masthead(head, ["the season", "so far"], {
    stopColor: "var(--foreground-on-dark)",
    config: CFG.REVEAL,
    justify: "flex-start",
  });
  const rule = section.querySelector<HTMLElement>("[data-season-rule]")!;
  const ruleAnim = makeAnim(rule, {
    from: { opacity: 0, scaleX: 0 },
    to: { opacity: 1, scaleX: 1 },
    config: CFG.REVEAL,
    delay: 2 * 130,
    mode: "forward",
  });
  const intro = splitText(section.querySelector<HTMLElement>("[data-season-intro]")!, {
    kind: "words",
    stagger: 34,
    config: CFG.COPY_FAST,
    delay: 2 * 130 + 90,
    gap: "0.22em",
    mode: "forward",
  });

  const plate = section.querySelector<HTMLElement>("[data-season-plate]")!;
  const plateAnim = makeAnim(plate, {
    from: { opacity: 0, y: "0.75rem" },
    to: { opacity: 1, y: "0rem" },
    config: CFG.REVEAL,
    delay: 260,
    mode: "forward",
  });
  const badge = [
    splitText(section.querySelector<HTMLElement>("[data-plate-f1]")!, {
      kind: "letters", stagger: 22, config: CFG.TYPE, delay: 430, gap: "0.3em", mode: "forward",
    }),
    splitText(section.querySelector<HTMLElement>("[data-plate-year]")!, {
      kind: "letters", stagger: 22, config: CFG.TYPE, delay: 490, gap: "0.3em", mode: "forward",
    }),
  ];
  const stats = STANDINGS.flatMap((_, row) => {
    const dt = section.querySelector<HTMLElement>('[data-plate-figure="' + row + '"]')!;
    const dd = section.querySelector<HTMLElement>('[data-plate-wording="' + row + '"]')!;
    return [
      splitText(dt, { kind: "letters", stagger: 22, config: CFG.TYPE, delay: 430 + row * 110, mode: "forward" }),
      splitText(dd, { kind: "letters", stagger: 22, config: CFG.TYPE, delay: 430 + row * 110 + 70, mode: "forward" }),
    ];
  });

  /* the globe's meridian, 0 -> 2pi every 10s, paused off screen */
  const meridian = section.querySelector<SVGEllipseElement>("[data-plate-meridian]")!;
  const SPIN_MS = 10000;
  subscribe((time) => {
    if (!inView) return;
    const turn = ((time % SPIN_MS) / SPIN_MS) * Math.PI * 2;
    meridian.setAttribute("rx", String(Math.max(0.5, Math.abs(Math.cos(turn)) * 18)));
  }, () => (REDUCED ? 400 : 0));

  const enter = () => {
    headRun.enable(true);
    ruleAnim.enable(true);
    intro.enable(true);
    plateAnim.enable(true);
    badge.forEach((b) => b.enable(true));
    stats.forEach((s) => s.enable(true));
  };
  const copyGate = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return;
      copyGate.disconnect();
      enter();
    },
    { rootMargin: "0% 0% -20% 0%" },
  );
  copyGate.observe(section);

  /* ---- the seam ----------------------------------------------------------- */
  chequeredSeam(
    section.querySelector<HTMLCanvasElement>("[data-season-seam]")!,
    section,
    "light",
  );

  void readToken;
}
