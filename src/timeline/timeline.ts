import {
  px, ROW_HEIGHT, PLATE_WIDTH, PARALLAX, COPY_LEFT, MARK_SIZE, MARK_SIZE_NARROW,
  RAIL_SOLID, RAIL_GAP, RAIL_DASH, RAIL_WIDTH, RAIL_START, TOP_PAD,
  railHeight, restingPoint,
} from "./sections";
import { PLATE_VIEW, PLATE_OUTLINE, PLATE_CLIP } from "./plate";
import { TIMELINE } from "../data/home";
import { asset } from "../lib/assets";
import { watchImage } from "../lib/fail";
import { CFG } from "../lib/spring";
import { makeAnim } from "../lib/anim";
import { splitText, masthead } from "../lib/text";
import { scrollTrigger, inViewOnce } from "../lib/scroll";
import { chequeredSeam } from "../lib/flag";
import { REDUCED } from "../lib/ticker";

const SVG = "http://www.w3.org/2000/svg";
const svgEl = (name: string, attrs: Record<string, string | number> = {}) => {
  const node = document.createElementNS(SVG, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
};

const YEAR_RESTING = 0.4;
const YEAR_HOLD = 2200;

export function mountTimeline() {
  const section = document.querySelector<HTMLElement>("[data-timeline]")!;
  const wrapper = section.querySelector<HTMLElement>("[data-tl-wrapper]")!;
  const railHost = section.querySelector<HTMLElement>("[data-tl-rail]")!;
  const rowsHost = section.querySelector<HTMLElement>("[data-tl-rows]")!;

  /* ---- the heading -------------------------------------------------------- */
  const headRun = masthead(
    section.querySelector<HTMLElement>("[data-tl-head]")!,
    ["from karts", "to f1"],
    { stopColor: "var(--foreground-on-dark)", config: CFG.REVEAL, justify: "flex-end" },
  );
  inViewOnce(section, () => headRun.enable(true), "0% 0% -10% 0%");

  /* ---- the rail ----------------------------------------------------------- */
  const totalHeight = railHeight(TIMELINE);
  const viewH = totalHeight - RAIL_START;
  const rest = restingPoint(TIMELINE) * viewH;
  const rail = svgEl("svg", {
    viewBox: "0 0 " + RAIL_WIDTH + " " + viewH,
    overflow: "visible",
    class: "tl__rail-svg",
    "aria-hidden": "true",
    preserveAspectRatio: "none",
  });
  rail.appendChild(
    svgEl("line", {
      x1: 8, y1: 0, x2: 8, y2: RAIL_SOLID,
      stroke: "var(--timeline-rail)", "stroke-width": 1,
      vectorEffect: "non-scaling-stroke",
    }),
  );
  rail.appendChild(
    svgEl("line", {
      x1: 8, y1: RAIL_SOLID + RAIL_GAP, x2: 8, y2: viewH,
      stroke: "var(--timeline-rail)", "stroke-width": 1,
      "stroke-dasharray": RAIL_DASH + " " + RAIL_DASH,
      vectorEffect: "non-scaling-stroke",
    }),
  );
  const thread = svgEl("rect", {
    x: 7.5, y: 0, width: 1, height: 0, fill: "var(--foreground-on-dark)",
  });
  rail.appendChild(thread);
  const narrow = window.matchMedia("(max-width: 1023px)");
  const markSize = () => (narrow.matches ? MARK_SIZE_NARROW : MARK_SIZE);
  const mark = svgEl("rect", {
    x: -markSize() / 2, y: -markSize() / 2,
    width: markSize(), height: markSize(), fill: "var(--foreground-on-dark)",
  });
  rail.appendChild(mark);
  railHost.appendChild(rail);
  railHost.style.setProperty("--rail-view", String(viewH));

  scrollTrigger(railHost, {
    start: "top_center",
    end: "bottom_bottom",
    onSmoothed: (p) => {
      const run = p * rest;
      thread.setAttribute("height", String(run));
      const s = markSize();
      mark.setAttribute("x", String(-s / 2));
      mark.setAttribute("y", String(-s / 2));
      mark.setAttribute("width", String(s));
      mark.setAttribute("height", String(s));
      // five full turns over the run
      mark.setAttribute(
        "transform",
        "translate(8 " + run + ") rotate(" + (run / rest) * 1800 + ")",
      );
    },
  });

  /* ---- the seven rows ------------------------------------------------------ */
  TIMELINE.forEach((entry, index) => {
    const row = document.createElement("article");
    row.className = "tl__row tl__row--" + entry.frame;
    row.style.height = px(ROW_HEIGHT[entry.frame]);

    /* the plate, on its own parallax layer */
    const plateLayer = document.createElement("div");
    plateLayer.className = "tl__layer tl__layer--plate";
    const plate = document.createElement("figure");
    plate.className = "tl__plate";
    plate.style.width = px(PLATE_WIDTH[entry.frame]);
    if (entry.frame === "centre") {
      plate.classList.add("tl__plate--centre");
    } else {
      plate.classList.add(entry.align === "left" ? "tl__plate--left" : "tl__plate--right");
    }
    if (index % 2 === 1) plate.classList.add("tl__plate--alt");

    const clipId = "tl-clip-" + index;
    const clipSvg = svgEl("svg", { width: 0, height: 0, "aria-hidden": "true", class: "tl__clipdef" });
    const clip = svgEl("clipPath", { id: clipId, clipPathUnits: "objectBoundingBox" });
    clip.appendChild(svgEl("path", { d: PLATE_CLIP }));
    clipSvg.appendChild(clip);
    plate.appendChild(clipSvg);

    const fill = document.createElement("div");
    fill.className = "tl__fill";
    fill.style.clipPath = "url(#" + clipId + ")";
    const slot = document.createElement("div");
    slot.className = "tl__slot";
    const img = document.createElement("img");
    img.src = asset(entry.image);
    img.alt = entry.alt;
    img.width = 1420;
    img.height = 1016;
    img.loading = index > 1 ? "lazy" : "eager";
    img.decoding = "async";
    img.crossOrigin = "anonymous";
    watchImage(img);
    slot.appendChild(img);
    fill.appendChild(slot);
    plate.appendChild(fill);

    const outline = svgEl("svg", {
      viewBox: "0 0 " + PLATE_VIEW.width + " " + PLATE_VIEW.height,
      preserveAspectRatio: "none",
      class: "tl__outline",
      "aria-hidden": "true",
    });
    outline.appendChild(
      svgEl("path", {
        d: PLATE_OUTLINE, fill: "none", stroke: "var(--timeline-outline)",
        "stroke-width": 1, vectorEffect: "non-scaling-stroke",
      }),
    );
    plate.appendChild(outline);
    plateLayer.appendChild(plate);
    row.appendChild(plateLayer);

    /* the year — rides the plate's parallax figure */
    const year = document.createElement("p");
    year.className = "tl__year";
    year.textContent = entry.year;
    plateLayer.appendChild(year);

    /* the copy, on the nearest layer */
    let copyLayer: HTMLElement | null = null;
    let copyAnim: ReturnType<typeof makeAnim> | null = null;
    if (entry.copy) {
      copyLayer = document.createElement("div");
      copyLayer.className = "tl__layer tl__layer--copy";
      const p = document.createElement("p");
      p.className = "tl__copy";
      p.style.left = px(COPY_LEFT);
      p.style.setProperty("--copy-w", px(entry.copyWidth ?? 240));
      const lead = document.createElement("b");
      lead.textContent = entry.lead + " ";
      p.append(lead, document.createTextNode(entry.copy));
      copyLayer.appendChild(p);
      row.appendChild(copyLayer);
      copyAnim = makeAnim(p, {
        from: { opacity: 0, y: "0.75rem" },
        to: { opacity: 1, y: "0rem" },
        config: CFG.COPY,
        delay: 220,
        mode: "forward",
      });
    }

    rowsHost.appendChild(row);

    /* the year resolves letter by letter when the row enters view */
    const yearRun = splitText(year, {
      kind: "letters",
      stagger: 26,
      config: CFG.YEAR,
      mode: "forward",
    });
    const settle =
      entry.frame === "centre"
        ? makeAnim(year, {
            from: { opacity: 1 },
            to: { opacity: YEAR_RESTING },
            config: CFG.YEAR_SETTLE,
            delay: YEAR_HOLD,
            mode: "forward",
          })
        : null;

    inViewOnce(
      row,
      () => {
        yearRun.enable(true);
        settle?.enable(true);
        copyAnim?.enable(true);
      },
      "0% 0% -25% 0%",
    );

    /* three parallax layers: the plate (and its year), and the copy */
    const plateTravel = px(PARALLAX.plate[entry.frame]);
    scrollTrigger(row, {
      start: "top_bottom",
      end: "bottom_top",
      onProgress: (p) => {
        const k = 1 - p * 2;
        plateLayer.style.top = "calc(" + k + " * " + plateTravel + ")";
        if (copyLayer) copyLayer.style.top = "calc(" + k + " * " + px(PARALLAX.copy) + ")";
      },
    });

    /* the slot's own overscan: the photograph moves -10% to 0% across the top */
    scrollTrigger(row, {
      start: "top_bottom",
      end: "top_center",
      onProgress: (p) => {
        slot.style.top = (-10 + p * 10).toFixed(3) + "%";
      },
    });

    /* hovering one plate dims the rest of the block */
    if (!REDUCED) {
      plate.addEventListener("pointerenter", () => {
        section.classList.add("is-dimmed");
        row.classList.add("is-lit");
      });
      plate.addEventListener("pointerleave", () => {
        section.classList.remove("is-dimmed");
        row.classList.remove("is-lit");
      });
    }
  });

  wrapper.style.setProperty("--rail-height", px(totalHeight - TOP_PAD));

  /* ---- the seam ------------------------------------------------------------ */
  chequeredSeam(
    section.querySelector<HTMLCanvasElement>("[data-tl-seam]")!,
    section,
    "light",
  );
}
