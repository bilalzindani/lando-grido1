import { px, PARALLAX_FIGURE } from "./sections";
import { NAV_LINKS } from "../data/home";
import { CFG } from "../lib/spring";
import { makeAnim, type Anim } from "../lib/anim";
import { splitText, masthead, type TextRun } from "../lib/text";
import { scrollTrigger, inViewOnce } from "../lib/scroll";
import { createContours } from "../lib/contours";
import { watchImage } from "../lib/fail";

const NAV_DELAY = 260;
const NAV_STAGGER = 80;
const FOOT_DELAY = 640;

export function mountFooter() {
  const section = document.querySelector<HTMLElement>("[data-footer]")!;

  createContours(
    section.querySelector<HTMLCanvasElement>("[data-footer-contours]")!,
    section,
    "--footer-contour",
  );

  section.querySelectorAll("img").forEach((img) => watchImage(img));

  /* the figure rides back into place as the page bottoms out */
  const layer = section.querySelector<HTMLElement>("[data-footer-figure-layer]")!;
  scrollTrigger(section, {
    start: "top_bottom",
    end: "bottom_bottom",
    onProgress: (p) => {
      layer.style.top = "calc(" + (1 - p) + " * " + px(PARALLAX_FIGURE) + ")";
    },
  });

  const logo = makeAnim(section.querySelector<HTMLElement>("[data-footer-logo]")!, {
    from: { opacity: 0 }, to: { opacity: 1 }, config: CFG.REVEAL, delay: 120, mode: "forward",
  });

  const head = masthead(
    section.querySelector<HTMLElement>("[data-footer-head]")!,
    ["keep pushing", "forward"],
    { stopColor: "var(--foreground-on-dark)", config: CFG.REVEAL, justify: "flex-end" },
  );

  /* the nav column, resolving letter by letter */
  const navHost = section.querySelector<HTMLElement>("[data-footer-nav]")!;
  const navRuns: TextRun[] = [];
  NAV_LINKS.forEach((link, i) => {
    const a = document.createElement("a");
    a.href = link.href;
    a.textContent = link.label;
    navHost.appendChild(a);
    navRuns.push(
      splitText(a, {
        kind: "letters",
        stagger: 22,
        config: CFG.ROW,
        delay: NAV_DELAY + i * NAV_STAGGER,
        gap: "0.2em",
        nowrap: true,
        mode: "forward",
      }),
    );
  });

  /* the foot row — all three end 32 above the foot */
  const feet: Anim[] = [];
  section.querySelectorAll<HTMLElement>("[data-footer-foot]").forEach((el, i) => {
    feet.push(
      makeAnim(el, {
        from: { opacity: 0, y: "0.75rem" },
        to: { opacity: 1, y: "0rem" },
        config: CFG.REVEAL,
        delay: FOOT_DELAY + i * 80,
        mode: "forward",
      }),
    );
  });

  inViewOnce(
    section,
    () => {
      logo.enable(true);
      head.enable(true);
      navRuns.forEach((r) => r.enable(true));
      feet.forEach((a) => a.enable(true));
    },
    "0% 0% -8% 0%",
  );
}
