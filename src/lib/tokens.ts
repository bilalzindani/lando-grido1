/**
 * Resolves a Tier-2 design token to a concrete colour. A custom property read
 * straight off `:root` can still be an unsubstituted `var()` chain, so the
 * value is bounced through a probe element's computed `color` instead.
 */
export const readToken = (token: string): string => {
  const probe = document.createElement("span");
  probe.style.cssText = "position:absolute;visibility:hidden;color:var(" + token + ")";
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe).color;
  probe.remove();
  return resolved;
};

export type Rgb = [number, number, number];

/** The same token as an [r, g, b] triple, for canvas work. */
export const readRgb = (token: string): Rgb => {
  const m = readToken(token).match(/\d+(\.\d+)?/g);
  if (!m) return [0, 0, 0];
  return [Number(m[0]), Number(m[1]), Number(m[2])];
};

export const mix = (a: Rgb, b: Rgb, t: number): Rgb => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

export const rgba = ([r, g, b]: Rgb, alpha: number) =>
  "rgb(" + Math.round(r) + " " + Math.round(g) + " " + Math.round(b) + " / " + alpha + ")";

/** A device-pixel cap: 2 normally, 1 on a coarse pointer. */
export const maxRatio = () =>
  window.matchMedia("(hover: none) and (pointer: coarse)").matches ? 1 : 2;
