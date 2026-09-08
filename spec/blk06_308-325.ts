const RECEDE_SCALE = 0.9;
const RECEDE_SHADE = 0.55;
const phone = window.matchMedia("(max-width: 639px)");
const apply = () => {
  const view = window.innerHeight || 1;
  const shrink = phone.matches ? 0 : 1 - RECEDE_SCALE;      // no shrink on a phone, shade only
  for (const { inner, shade, next } of pinned) {
    // 0 while the next block is still a full screen away, 1 once it has taken the whole viewport.
    const p = Math.min(1, Math.max(0, 1 - next.getBoundingClientRect().top / view));
    // No transform at rest — a scale(1) here makes the layer the containing block for the
    // hero's position:fixed loader, which then centres in the section instead of the viewport.
    inner.style.transform = p > 0 && shrink > 0 ? `scale(${1 - shrink * p})` : "";
    inner.style.willChange = p > 0 && shrink > 0 ? "transform" : "";
    shade.style.opacity = `${RECEDE_SHADE * p}`;
    inner.style.visibility = p >= 1 ? "hidden" : "visible";   // fully covered: stop painting the scene
  }
};