import { makeAnim, type Anim, type Mode, type Props } from "./anim";
import type { SpringConfig } from "./spring";

/**
 * The text engine — split to words or letters, one spring per unit, unit i
 * starting at delayIn + i * stagger. No overflow clip anywhere: the display
 * leadings (0.95, 0.72) would shave descenders. A visually-hidden plain copy
 * stays for assistive technology and the animated spans are aria-hidden.
 */
export const WORD_OUT: Props = { opacity: 0, y: "0.35em" };
export const WORD_IN: Props = { opacity: 1, y: "0em" };
export const LETTER_OUT: Props = { opacity: 0, y: "0.3em" };
export const LETTER_IN: Props = { opacity: 1, y: "0em" };

export interface TextOptions {
  kind?: "words" | "letters";
  stagger?: number;
  config?: SpringConfig;
  delay?: number;
  gap?: string;
  mode?: Mode;
  justify?: string;
  nowrap?: boolean;
  /** Extra spans appended after the run, each with its own delay and colour. */
  tail?: { text: string; className?: string; color?: string; delay: number }[];
}

export function splitText(el: HTMLElement, opt: TextOptions = {}) {
  const kind = opt.kind ?? "words";
  const raw = (el.textContent ?? "").replace(/\s+/g, " ").trim();
  const stagger = opt.stagger ?? 60;
  const config = opt.config ?? { tension: 90, friction: 26 };
  const delay = opt.delay ?? 0;
  const mode: Mode = opt.mode ?? "forward";

  el.textContent = "";
  const sr = document.createElement("span");
  sr.className = "sr-only";
  sr.textContent = raw + (opt.tail ? opt.tail.map((t) => t.text).join("") : "");
  el.appendChild(sr);

  const wrap = document.createElement("span");
  wrap.className = "tx" + (kind === "letters" ? " tx--letters" : "");
  wrap.setAttribute("aria-hidden", "true");
  if (opt.gap) wrap.style.columnGap = opt.gap;
  if (opt.justify) wrap.style.justifyContent = opt.justify;
  if (opt.nowrap) wrap.style.flexWrap = "nowrap";
  el.appendChild(wrap);

  const units: HTMLElement[] = [];
  if (kind === "letters") {
    for (const ch of raw) {
      const s = document.createElement("span");
      if (ch === " ") {
        s.style.width = "0.3em";
        s.innerHTML = "&nbsp;";
      } else {
        s.textContent = ch;
      }
      wrap.appendChild(s);
      units.push(s);
    }
  } else {
    for (const w of raw.split(" ")) {
      const s = document.createElement("span");
      s.textContent = w;
      wrap.appendChild(s);
      units.push(s);
    }
  }

  const out = kind === "letters" ? LETTER_OUT : WORD_OUT;
  const into = kind === "letters" ? LETTER_IN : WORD_IN;
  const anims: Anim[] = units.map((u, i) =>
    makeAnim(u, { from: out, to: into, config, delay: delay + i * stagger, mode }),
  );

  for (const t of opt.tail ?? []) {
    const s = document.createElement("span");
    s.textContent = t.text;
    if (t.className) s.className = t.className;
    if (t.color) s.style.color = t.color;
    wrap.appendChild(s);
    anims.push(makeAnim(s, { from: out, to: into, config, delay: t.delay, mode }));
  }

  return {
    anims,
    units,
    wrap,
    enable: (v: boolean) => anims.forEach((a) => a.enable(v)),
  };
}
export type TextRun = ReturnType<typeof splitText>;

/**
 * The page's recurring masthead shape: two authored lines, each its own word
 * reveal at `index * 130`, with the full stop after the last line as its own
 * span in a second colour at `130 + 110`.
 */
export function masthead(
  host: HTMLElement,
  lines: string[],
  opt: { stopColor: string; config?: SpringConfig; justify?: string },
) {
  const runs: TextRun[] = [];
  lines.forEach((line, index) => {
    const p = document.createElement("span");
    p.style.display = "block";
    p.textContent = line;
    host.appendChild(p);
    runs.push(
      splitText(p, {
        kind: "words",
        stagger: 110,
        config: opt.config ?? { tension: 90, friction: 26 },
        delay: index * 130,
        mode: "forward",
        justify: opt.justify ?? "flex-start",
        tail:
          index === lines.length - 1
            ? [{ text: ".", color: opt.stopColor, delay: 130 + 110 }]
            : undefined,
      }),
    );
  });
  return {
    runs,
    enable: (v: boolean) => runs.forEach((r) => r.enable(v)),
  };
}
