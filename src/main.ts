import Lenis from "lenis";
import { subscribe, REDUCED } from "./lib/ticker";
import { mountStack } from "./lib/stack";
import { mountNav } from "./lib/nav";
import { mountLinks } from "./lib/links";
import { watchImage } from "./lib/fail";
import { mountHero } from "./hero/hero";
import { mountSeason } from "./season/season";
import { mountTimeline } from "./timeline/timeline";
import { mountPaddock } from "./paddock/paddock";
import { mountFooter } from "./footer/footer";

/**
 * The root scales with the viewport in bands so a rem is one design pixel of
 * the frame the band was drawn at. Below 1280 the CSS pins it at 16; above
 * 1920 it keeps scaling up, which only script can express.
 */
function scaleRoot() {
  document.documentElement.style.fontSize =
    window.innerWidth > 1920 ? (16 * window.innerWidth) / 1920 + "px" : "";
}
scaleRoot();
window.addEventListener("resize", scaleRoot, { passive: true });

/**
 * Lenis runs from the shared loop, registered first, so every scroll reader on
 * the page sees this frame's scrollY. Under reduced motion the platform scrolls.
 */
let lenis: Lenis | null = null;
if (!REDUCED) {
  lenis = new Lenis({ smoothWheel: true });
  subscribe((time) => lenis!.raf(time), () => 0);
}

document.querySelectorAll("img").forEach((img) => watchImage(img));

/* The hero's bracket panels: one 10x10 corner path, stamped four times. */
for (const panel of document.querySelectorAll("[data-brackets]")) {
  for (const pos of ["tr", "tl", "bl", "br"]) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 10.5 10.5");
    svg.setAttribute("fill", "none");
    svg.setAttribute("aria-hidden", "true");
    svg.classList.add("panel__corner", "panel__corner--" + pos);
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M0 0.5H10V10.5");
    path.setAttribute("stroke", "currentColor");
    svg.appendChild(path);
    panel.appendChild(svg);
  }
}

mountStack();
mountNav(lenis);

/* The design's links are real paths on a one-page site; route them to blocks. */
const openDeepLink = mountLinks(lenis);
window.addEventListener("lando:handover", () => openDeepLink(), { once: true });

mountHero();
mountSeason();
mountTimeline();
mountPaddock();
mountFooter();
