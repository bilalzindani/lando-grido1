const s = section.getBoundingClientRect();
const b = box.getBoundingClientRect();           // the fit box — only when it is displayed (offsetParent !== null), i.e. below xl
scene.setParams({
  ...DEFAULT_PARAMS,
  ...fitSubjectToBox(DEFAULT_PARAMS, { top: b.top - s.top, height: b.height }, container.clientHeight),
  // Every touch width, not just phones: the parked cursor reveal never moves and reads as a blob.
  ...(window.matchMedia("(max-width: 1023px)").matches ? { bgRevealOpacity: 0 } : null),
  // Where there is no pointer at all the reveal is driven for the reader by the idle sweep.
  ...(window.matchMedia("(hover: none)").matches ? { autoSweepAmount: 0.76 } : null),
  // The brush is sized for the screen: on a phone a wider brush reveals the head as one mass.
  ...(window.matchMedia("(max-width: 639px)").matches ? { sweepRadius: 0.95, sweepWarp: 0.18, autoSweepAmount: 0.55 } : null),
  // Last, because it overrides the two above: the mobile tier has no reveal after the burn at all.
  ...(scene.tier.reveal ? null : { autoSweepAmount: 0 }),
});