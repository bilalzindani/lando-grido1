import { readToken } from "./tokens";
import { scrollTrigger } from "./scroll";

/**
 * The chequered dissolve — the seam between two blocks. One ground carries
 * into the next block as solid rows, breaks into a chequerboard and burns off
 * as you scroll. Verbatim constants and render from the spec.
 */
const CELL = 24; // square edge in CSS px; read `--flag-cell` off the band first if set
const SOLID_UNTIL = 0.16; // share of the band that stays solid before the checker starts
const LIFT = 2; // how far the pattern travels off the top over the window
const ACCENT_SHARE = 0.06; // share of squares that come through in the accent instead

const noise = (x: number, y: number) => {
  // deterministic per-cell hash — stable across resizes
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export function chequeredSeam(
  canvas: HTMLCanvasElement,
  trigger: Element,
  carry: "light" | "dark",
) {
  const context = canvas.getContext("2d")!;
  const accent = readToken("--accent");
  const surface = carry === "light" ? readToken("--background") : readToken("--surface-black");
  let progress = 0;
  let width = 0;
  let height = 0;

  const render = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, canvas.clientWidth);
    height = Math.max(1, canvas.clientHeight);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);

    const declared = getComputedStyle(canvas).getPropertyValue("--flag-cell").trim();
    const cell = declared ? parseFloat(declared) || CELL : CELL;

    const columns = Math.ceil(width / cell);
    const rows = Math.ceil(height / cell);
    const lift = progress * LIFT;
    for (let y = 0; y < rows; y += 1) {
      const depth = y / Math.max(1, rows - 1) + lift;
      if (depth > 1) break;
      const solid = depth <= SOLID_UNTIL;
      const fade = clamp01(1 - (depth - SOLID_UNTIL) / (1 - SOLID_UNTIL));
      if (!solid && fade <= 0) break;
      for (let x = 0; x < columns; x += 1) {
        if (!solid) {
          if ((x + y) % 2 !== 0) continue; // only one colour of the board survives
          if (noise(x, y) > fade) continue;
        }
        context.fillStyle =
          !solid && noise(x + 101, y + 57) < ACCENT_SHARE ? accent : surface;
        context.fillRect(x * cell, y * cell, cell, cell);
      }
    }
  };

  render();
  new ResizeObserver(render).observe(canvas);
  scrollTrigger(trigger, {
    start: "top_bottom",
    end: "top_top",
    onSmoothed: (p) => {
      if (Math.abs(p - progress) < 0.0015) return;
      progress = p;
      render();
    },
  });
}
