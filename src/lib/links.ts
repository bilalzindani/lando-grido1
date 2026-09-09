/**
 * The page is one page, but the design's links are real paths — `/driver`,
 * `/season`, `/journal` and the rest, quoted verbatim from the frame. Left
 * alone they would each land on a 404.
 *
 * So the paths stay exactly as designed, and each one resolves to the block it
 * names: the address bar updates, the page scrolls, and a deep link opened
 * cold lands on the right block. The host rewrites every unknown path to this
 * page, so a refresh on `/season` is the season block rather than a 404.
 *
 * Only same-origin paths are intercepted. The socials are absolute URLs and
 * are left to the browser.
 */
const TARGETS: Record<string, string> = {
  "/": "hero",
  "/driver": "hero",
  "/driver/kimi-antonelli": "hero",
  "/trailer": "hero",
  "/season": "season",
  "/journal": "paddock",
  "/next-race": "paddock",
  "/stories/hungarian-gp": "paddock",
  "/store": "footer",
  "/garage": "footer",
  "/legal": "footer",
  "/privacy": "footer",
  "/terms": "footer",
};

type Scroller = {
  scrollTo(target: number | HTMLElement, options?: { immediate?: boolean }): void;
} | null;

function targetFor(pathname: string) {
  const clean = pathname.replace(/\/+$/, "") || "/";
  const id = TARGETS[clean];
  return id ? document.getElementById(id) : null;
}

export function mountLinks(lenis: Scroller) {
  const go = (el: HTMLElement, immediate: boolean) => {
    // The first three blocks are a sticky stack, so a block's own offsetTop is
    // not where it becomes the visible layer — the layer above it has to be
    // scrolled through first. offsetTop on the stack's wrapper gives that.
    const top = el.getBoundingClientRect().top + window.scrollY;
    if (lenis) lenis.scrollTo(top, { immediate });
    else window.scrollTo({ top, behavior: immediate ? "auto" : "smooth" });
  };

  document.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = (event.target as HTMLElement | null)?.closest?.("a");
    if (!anchor) return;
    const href = anchor.getAttribute("href");
    if (!href || !href.startsWith("/")) return;

    const el = targetFor(href);
    if (!el) return; // an unmapped path: let the host's rewrite handle it
    event.preventDefault();
    if (window.location.pathname !== href) history.pushState({}, "", href);
    go(el, false);
  });

  window.addEventListener("popstate", () => {
    const el = targetFor(window.location.pathname);
    if (el) go(el, false);
  });

  /** A deep link opened cold lands on its block once the page is up. */
  return () => {
    const el = targetFor(window.location.pathname);
    if (el && el.id !== "hero") go(el, true);
  };
}
