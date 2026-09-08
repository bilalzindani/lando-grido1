import {
  px, type as ptype, PARALLAX_PORTRAIT, CALENDAR, BRACKET, STATS, MEET,
} from "./sections";
import { ROUNDS, PADDOCK_STATS } from "../data/home";
import { asset } from "../lib/assets";
import { watchImage } from "../lib/fail";
import { CFG } from "../lib/spring";
import { makeAnim, type Anim } from "../lib/anim";
import { splitText, masthead, type TextRun } from "../lib/text";
import { scrollTrigger, inViewOnce } from "../lib/scroll";
import { createContours } from "../lib/contours";
import { chequeredSeam } from "../lib/flag";
import { subscribe, REDUCED } from "../lib/ticker";
import { easeOutQuad } from "../lib/spring";

const SVG = "http://www.w3.org/2000/svg";
const svgEl = (name: string, attrs: Record<string, string | number> = {}) => {
  const node = document.createElementNS(SVG, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
};

const CARD_DELAY = 560;
const CARD_STAGGER = 90;
const PULSE_MS = 3200;
const PULSE_REACH = 3.4;
const CRAWL_MS = 5200;
const MEET_DELAY = 320;
const STATS_DELAY = 460;
const ROW_STAGGER = 90;

/** spread(x) = calc(50% + px(x - 720) * var(--cal-spread, 1)) */
const spread = (x: number) => "calc(50% + " + px(x - 720) + " * var(--cal-spread, 1))";

/** The corner brackets, drawn as one path four ways. */
function brackets(host: HTMLElement, colour: string) {
  const rotations: Record<string, number> = { tl: 270, tr: 0, br: 90, bl: 180 };
  for (const [corner, angle] of Object.entries(rotations)) {
    const svg = svgEl("svg", {
      viewBox: "0 0 10.5 10.5",
      class: "bracket bracket--" + corner,
      "aria-hidden": "true",
      fill: "none",
    });
    svg.appendChild(
      svgEl("path", {
        d: "M0 0.5H10V10.5",
        stroke: colour,
        transform: "rotate(" + angle + " 5.25 5.25)",
      }),
    );
    host.appendChild(svg);
  }
}

export function mountPaddock() {
  const section = document.querySelector<HTMLElement>("[data-paddock]")!;

  createContours(
    section.querySelector<HTMLCanvasElement>("[data-paddock-contours]")!,
    section,
    "--paddock-contour",
  );

  /* ---- the portrait, on a parallax layer that only moves up -------------- */
  const figLayer = section.querySelector<HTMLElement>("[data-paddock-figure]")!;
  const portrait = figLayer.querySelector("img");
  if (portrait) watchImage(portrait as HTMLImageElement);
  scrollTrigger(section, {
    start: "top_bottom",
    end: "bottom_top",
    onProgress: (p) => {
      figLayer.style.top = "calc(" + -p + " * " + px(PARALLAX_PORTRAIT) + ")";
    },
  });

  /* ---- the intro --------------------------------------------------------- */
  const head = masthead(
    section.querySelector<HTMLElement>("[data-paddock-head]")!,
    ["from the", "paddock"],
    { stopColor: "var(--accent)", config: CFG.REVEAL, justify: "flex-start" },
  );
  const report = splitText(section.querySelector<HTMLElement>("[data-paddock-report]")!, {
    kind: "words",
    stagger: 30,
    config: CFG.COPY_FAST,
    delay: 2 * 130 + 90,
    gap: "0.22em",
    mode: "forward",
  });
  const cta = makeAnim(section.querySelector<HTMLElement>("[data-paddock-cta]")!, {
    from: { opacity: 0, y: "0.75rem" },
    to: { opacity: 1, y: "0rem" },
    config: CFG.REVEAL,
    delay: 2 * 130 + 260,
    mode: "forward",
  });

  /* ---- the two panels ---------------------------------------------------- */
  const meetFrame = section.querySelector<HTMLElement>("[data-paddock-meet-frame]")!;
  const statsFrame = section.querySelector<HTMLElement>("[data-paddock-stats-frame]")!;
  brackets(meetFrame, "var(--foreground)");
  brackets(statsFrame, "var(--foreground)");
  const meetFrameAnim = makeAnim(meetFrame, {
    from: { opacity: 0 }, to: { opacity: 1 }, config: CFG.REVEAL, delay: MEET_DELAY, mode: "forward",
  });
  const statsFrameAnim = makeAnim(statsFrame, {
    from: { opacity: 0 }, to: { opacity: 1 }, config: CFG.REVEAL, delay: STATS_DELAY, mode: "forward",
  });
  const meetCol = makeAnim(section.querySelector<HTMLElement>("[data-paddock-meet]")!, {
    from: { opacity: 0, y: "0.5rem" }, to: { opacity: 1, y: "0rem" },
    config: CFG.ROW, delay: 410, mode: "forward",
  });

  /* the four stat rows: a rule draws in, the row rises, the figure resolves */
  const statAnims: Anim[] = [];
  const statRuns: TextRun[] = [];
  section.querySelectorAll<HTMLElement>("[data-stat-row]").forEach((row, i) => {
    const rule = row.querySelector<HTMLElement>(".pd__rule");
    if (rule) {
      statAnims.push(
        makeAnim(rule, {
          from: { opacity: 1, scaleX: 0 }, to: { opacity: 1, scaleX: 1 },
          config: CFG.REVEAL, delay: STATS_DELAY + i * ROW_STAGGER, mode: "forward",
        }),
      );
    }
    statAnims.push(
      makeAnim(row, {
        from: { opacity: 0, y: "0.5rem" }, to: { opacity: 1, y: "0rem" },
        config: CFG.ROW, delay: STATS_DELAY + i * ROW_STAGGER + 40, mode: "forward",
      }),
    );
    const figure = row.querySelector<HTMLElement>("[data-stat-figure]");
    if (figure) {
      statRuns.push(
        splitText(figure, {
          kind: "letters", stagger: 24, config: CFG.FIGURE,
          delay: STATS_DELAY + i * ROW_STAGGER + 120, mode: "forward",
        }),
      );
    }
  });

  inViewOnce(
    section,
    () => {
      head.enable(true);
      report.enable(true);
      cta.enable(true);
      meetFrameAnim.enable(true);
      statsFrameAnim.enable(true);
      meetCol.enable(true);
      statAnims.forEach((a) => a.enable(true));
      statRuns.forEach((r) => r.enable(true));
    },
    "0% 0% -15% 0%",
  );

  /* ---- the calendar strip ------------------------------------------------- */
  const strip = section.querySelector<HTMLElement>("[data-calendar]")!;
  const liveIndex = ROUNDS.findIndex((r) => r.marker.kind === "live");
  const stripAnims: Anim[] = [];
  const stripRuns: TextRun[] = [];
  const connectors: { el: HTMLElement; dir: number }[] = [];

  CALENDAR.links.forEach((link, i) => {
    const bar = document.createElement("i");
    bar.className = "cal__link";
    bar.style.left = spread(link.x);
    bar.style.width = px(link.width);
    bar.style.top = "calc(" + px(CALENDAR.linkY) + " + var(--cal-mark-drop, 0px))";
    bar.style.backgroundImage =
      "repeating-linear-gradient(to right, var(--foreground-on-dark-muted) 0 " +
      px(CALENDAR.linkDash) + ", transparent " + px(CALENDAR.linkDash) + " " +
      px(CALENDAR.linkDash + CALENDAR.linkGap) + ")";
    strip.appendChild(bar);
    // the two left of the live round crawl right, the two right of it crawl left
    connectors.push({ el: bar, dir: i < liveIndex ? 1 : -1 });
    stripAnims.push(
      makeAnim(bar, {
        from: { opacity: 1, scaleX: 0 }, to: { opacity: 1, scaleX: 1 },
        config: CFG.REVEAL, delay: CARD_DELAY + i * CARD_STAGGER, mode: "forward",
      }),
    );
  });

  let pulseRing: SVGCircleElement | null = null;

  ROUNDS.forEach((round, i) => {
    const card = document.createElement("div");
    card.className = "cal__card" + (round.marker.kind === "live" ? " is-live" : "");
    card.style.left = "calc(" + spread(round.x + round.width / 2) + " - " + px(round.width / 2) + ")";
    card.style.top = "calc(" + px(CALENDAR.y) + " + var(--cal-card-drop, 0px))";
    card.style.width = "var(--cal-card-w, " + px(round.width) + ")";

    const no = document.createElement("p");
    no.className = "cal__no";
    no.textContent = round.round;
    const name = document.createElement("h3");
    name.className = "cal__name";
    name.textContent = round.name;
    const date = document.createElement("p");
    date.className = "cal__date";
    date.textContent = round.date;
    card.append(no, name, date);
    strip.appendChild(card);

    stripAnims.push(
      makeAnim(card, {
        from: { opacity: 0, y: "0.5rem" }, to: { opacity: 1, y: "0rem" },
        config: CFG.ROW, delay: CARD_DELAY + i * CARD_STAGGER, mode: "forward",
      }),
    );
    stripRuns.push(
      splitText(name, {
        kind: "words", stagger: 0, config: CFG.NAME,
        delay: CARD_DELAY + i * CARD_STAGGER + 110, mode: "forward",
        justify: "center", nowrap: true,
      }),
    );

    /* the marker on the connector run */
    const marker = document.createElement("div");
    marker.className = "cal__marker";
    marker.style.left = spread(round.x + round.width / 2);
    marker.style.top = "calc(" + px(CALENDAR.markY) + " + var(--cal-mark-drop, 0px))";
    if (round.marker.kind === "result") {
      marker.classList.add("cal__marker--result");
      marker.textContent = round.marker.label;
    } else {
      const dot = svgEl("svg", {
        viewBox: "0 0 " + CALENDAR.dot + " " + CALENDAR.dot,
        class: "cal__dot", "aria-hidden": "true",
      });
      if (round.marker.kind === "live") {
        dot.appendChild(
          svgEl("circle", { cx: CALENDAR.dot / 2, cy: CALENDAR.dot / 2, r: 5.5, fill: "var(--accent)" }),
        );
        pulseRing = svgEl("circle", {
          cx: CALENDAR.dot / 2, cy: CALENDAR.dot / 2, r: 5.5, fill: "none",
          stroke: "var(--accent)", "stroke-width": 1, opacity: 0,
        }) as SVGCircleElement;
        pulseRing.setAttribute("vector-effect", "non-scaling-stroke");
        dot.appendChild(pulseRing);
        dot.setAttribute("overflow", "visible");
      } else {
        dot.appendChild(
          svgEl("circle", {
            cx: CALENDAR.dot / 2, cy: CALENDAR.dot / 2, r: 5, fill: "none",
            stroke: "var(--foreground-on-dark)", "stroke-width": 1,
          }),
        );
      }
      marker.appendChild(dot);
    }
    strip.appendChild(marker);
    stripAnims.push(
      makeAnim(marker, {
        from: { opacity: 0 }, to: { opacity: 1 },
        config: CFG.REVEAL, delay: CARD_DELAY + i * CARD_STAGGER + 60, mode: "forward",
      }),
    );

    if (round.marker.kind === "live") {
      card.addEventListener("pointerenter", () => strip.style.setProperty("--bracket-spread", px(5)));
      card.addEventListener("pointerleave", () => strip.style.removeProperty("--bracket-spread"));
    }
  });

  /* the live bracket */
  const liveFrame = document.createElement("div");
  liveFrame.className = "cal__live";
  liveFrame.style.left = spread(CALENDAR.live.left);
  liveFrame.style.width = "calc(" + spread(CALENDAR.live.right) + " - " + spread(CALENDAR.live.left) + ")";
  liveFrame.style.top = "calc(" + px(CALENDAR.live.top) + " + var(--bracket-drop, 0px))";
  liveFrame.style.height =
    "calc(" + px(CALENDAR.live.bottom - CALENDAR.live.top) + " + var(--bracket-stretch, 0px))";
  brackets(liveFrame, "var(--accent)");
  strip.appendChild(liveFrame);
  stripAnims.push(
    makeAnim(liveFrame, {
      from: { opacity: 0 }, to: { opacity: 1 },
      config: CFG.REVEAL, delay: CARD_DELAY + 5 * CARD_STAGGER, mode: "forward",
    }),
  );

  inViewOnce(
    strip,
    () => {
      stripAnims.forEach((a) => a.enable(true));
      stripRuns.forEach((r) => r.enable(true));
    },
    "0% 0% -20% 0%",
  );

  /* the connectors crawl, and the live marker pulses */
  let inView = false;
  new IntersectionObserver(([e]) => { inView = e.isIntersecting; }).observe(strip);
  subscribe((time) => {
    if (!inView || REDUCED) return;
    const period = CALENDAR.linkDash + CALENDAR.linkGap;
    const phase = ((time % CRAWL_MS) / CRAWL_MS) * period;
    for (const c of connectors) {
      c.el.style.backgroundPositionX = "calc(" + c.dir * phase + " * 100cqw / 1440)";
    }
    if (pulseRing) {
      const v = easeOutQuad((time % PULSE_MS) / PULSE_MS);
      pulseRing.setAttribute("r", String(5.5 + v * 5.5 * PULSE_REACH));
      pulseRing.setAttribute("opacity", String(0.5 * (1 - v) * (1 - v)));
    }
  }, () => 0);

  /* ---- the seam (the near-black carried into the light block) ------------- */
  chequeredSeam(
    section.querySelector<HTMLCanvasElement>("[data-paddock-seam]")!,
    section,
    "dark",
  );

  void [ptype, BRACKET, STATS, MEET, PADDOCK_STATS, asset];
}
