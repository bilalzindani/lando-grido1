import { loopInView, REDUCED } from "./ticker";
import { readToken } from "./tokens";

/**
 * The contour backdrop — the hero's field on a 2D canvas. Marching squares over
 * a 96-cell grid (the long edge; the short edge keeps the cells square), the
 * same field and constants as the shader. Verbatim.
 */
const LINE_SCALE = 3.8,
  LINE_COUNT = 2.5,
  WAVE_AMOUNT = 0.37,
  WAVE_SPEED = 1.66,
  LINE_OPACITY = 0.85;
const CELLS = 96;

const field = (x: number, y: number, t: number) => {
  let f = Math.sin(x * 1.0 + t * 0.6) * 0.5;
  f += Math.sin(y * 0.85 - t * 0.45) * 0.45;
  f += Math.sin((x + y) * 0.65 + t * 0.35) * 0.35;
  f += Math.sin((x - y) * 0.95 - t * 0.55) * 0.25;
  return f * 0.5 + 0.5;
};

export function createContours(canvas: HTMLCanvasElement, host: Element, token: string) {
  const context = canvas.getContext("2d")!;
  const colour = readToken(token);
  const start = performance.now();
  let width = 0;
  let height = 0;
  let ratio = 1;

  const size = () => {
    ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, canvas.clientWidth);
    height = Math.max(1, canvas.clientHeight);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
  };
  size();
  new ResizeObserver(size).observe(canvas);

  const draw = (now: number) => {
    if (!width || !height) return;
    const t = ((now - start) / 1000) * WAVE_SPEED;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);

    const cols = width >= height ? CELLS : Math.max(8, Math.round((CELLS * width) / height));
    const rows = Math.max(8, Math.round((cols * height) / width));
    const stepX = width / cols;
    const stepY = height / rows;
    const aspect = width / height;
    const values = new Float32Array((cols + 1) * (rows + 1));
    for (let j = 0; j <= rows; j += 1) {
      for (let i = 0; i <= cols; i += 1) {
        // NDC, framed the way the hero frames it
        const nx = ((i / cols) * 2 - 1) * aspect * LINE_SCALE;
        const ny = ((j / rows) * 2 - 1) * LINE_SCALE;
        const qx = nx + Math.sin(ny * 0.8 + t * 0.7) * WAVE_AMOUNT;
        const qy = ny + Math.cos(nx * 0.7 - t * 0.6) * WAVE_AMOUNT;
        values[j * (cols + 1) + i] = field(qx, qy, t) * LINE_COUNT;
      }
    }

    context.strokeStyle = colour;
    context.lineWidth = 1;
    context.globalAlpha = LINE_OPACITY;
    context.beginPath();
    // halfway between integers, like the shader
    for (let level = 0.5; level < LINE_COUNT; level += 1) {
      for (let j = 0; j < rows; j += 1) {
        for (let i = 0; i < cols; i += 1) {
          const a = values[j * (cols + 1) + i];
          const b = values[j * (cols + 1) + i + 1];
          const c = values[(j + 1) * (cols + 1) + i + 1];
          const d = values[(j + 1) * (cols + 1) + i];
          const index =
            (a > level ? 8 : 0) | (b > level ? 4 : 0) | (c > level ? 2 : 0) | (d > level ? 1 : 0);
          if (index === 0 || index === 15) continue;
          const x0 = i * stepX;
          const y0 = j * stepY;
          const top: [number, number] = [x0 + stepX * ((level - a) / (b - a)), y0];
          const right: [number, number] = [x0 + stepX, y0 + stepY * ((level - b) / (c - b))];
          const bottom: [number, number] = [x0 + stepX * ((level - d) / (c - d)), y0 + stepY];
          const left: [number, number] = [x0, y0 + stepY * ((level - a) / (d - a))];
          const segment = (p: [number, number], q: [number, number]) => {
            context.moveTo(p[0], p[1]);
            context.lineTo(q[0], q[1]);
          };
          switch (index) {
            case 1: case 14: segment(left, bottom); break;
            case 2: case 13: segment(bottom, right); break;
            case 3: case 12: segment(left, right); break;
            case 4: case 11: segment(top, right); break;
            case 6: case 9: segment(top, bottom); break;
            case 7: case 8: segment(left, top); break;
            case 5: segment(left, top); segment(bottom, right); break; // the saddles
            case 10: segment(left, bottom); segment(top, right); break;
          }
        }
      }
    }
    context.stroke();
    context.globalAlpha = 1;
  };

  // redrawn from the shared ticker at 24ms while in view
  loopInView(host, draw, () => (REDUCED ? 1e9 : 24));
  draw(start);
}
