/**
 * The sticky stack — each pinned layer recedes as the next comes over it,
 * scaling to 0.9 and darkening to 55% black rather than scrolling away.
 * The transform lives on the inner wrapper, never on the sticky element: a
 * transformed ancestor takes position: sticky out of the viewport's frame.
 */
const RECEDE_SCALE = 0.9;
const RECEDE_SHADE = 0.55;

export function mountStack() {
  const phone = window.matchMedia("(max-width: 639px)");
  const layers = Array.from(document.querySelectorAll<HTMLElement>("[data-pin]"));
  const all = Array.from(document.querySelectorAll<HTMLElement>("[data-pin], [data-pin-last]"));
  const pinned = layers
    .map((layer) => ({
      inner: layer.querySelector<HTMLElement>("[data-pin-inner]")!,
      shade: layer.querySelector<HTMLElement>("[data-pin-shade]")!,
      next: all[all.indexOf(layer) + 1],
    }))
    .filter((p) => p.next && p.inner && p.shade);

  const apply = () => {
    const view = window.innerHeight || 1;
    const shrink = phone.matches ? 0 : 1 - RECEDE_SCALE; // no shrink on a phone, shade only
    for (const { inner, shade, next } of pinned) {
      // 0 while the next block is still a full screen away, 1 once it has
      // taken the whole viewport.
      const p = Math.min(1, Math.max(0, 1 - next.getBoundingClientRect().top / view));
      // No transform at rest — a scale(1) here makes the layer the containing
      // block for the hero's position:fixed loader, which then centres in the
      // section instead of the viewport.
      inner.style.transform = p > 0 && shrink > 0 ? "scale(" + (1 - shrink * p) + ")" : "";
      inner.style.willChange = p > 0 && shrink > 0 ? "transform" : "";
      shade.style.opacity = String(RECEDE_SHADE * p);
      // fully covered: stop painting the scene
      inner.style.visibility = p >= 1 ? "hidden" : "visible";
    }
  };

  let queued = false;
  const onScroll = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      apply();
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  apply();
}
