## 3 — The season so far

`<section data-season>` — `container-type: inline-size; position: relative; isolation: isolate; min-height: var(--season-h, 100lvh); overflow: hidden; background: var(--surface-black); color: var(--foreground-on-dark)`.
This block is written in `rem` for its copy (so it shares the hero's gutters) and in **`cqw`** for its
plate and rules; `px(v) = (v/1440*100).toFixed(4)cqw`. Below `lg` it sets, on the section:
`--gutter-min: 32px; --type-min: 13px; --copy-min-size: 17px; --copy-min-w: 15rem; --head-min: 6.6667cqw; --plate-w: 277px; --plate-h: 78px; --plate-cell: 83px; --plate-badge-gap: 11px; --plate-globe-w: 37px; --plate-globe-h: 23px; --plate-stats-left: 16px; --plate-stats-gap: 8px; --plate-eyebrow: 12px; --plate-body: 14px`;
below `sm` also `--head-min: 40px; --head-air: 20px; --season-h: 680px`.

Layers: the circuit stage (`absolute inset-0`, described below), the chequered dissolve
(`z-index 10`, phone `z-index 0`), then the copy column:
`position: relative; min-height: var(--season-h, 100lvh); display: flex; flex-direction: column; justify-content: space-between; gap: 4rem; padding: 4.8611cqw 1.5rem 2rem` — from `sm` the sides and bottom are `--season-gutter: max(2.2222cqw, var(--gutter-min, 0px))`.

### The heading (left rail)

`<h2>` Oswald 700, uppercase, line-height 0.95, `color: var(--accent)`,
`font-size: max(3.8194cqw, var(--head-min, 0px))`, two authored lines — `the season` / `so far` —
each its own word reveal (`wordStagger 110`, `REVEAL`, `delayIn index * 130`, mode forward,
`justify-content: flex-start`), and the full stop after the last line as a separate span in
**white** (`--foreground-on-dark`), fading in at `130 + 110`. Then a cyan rule — `1.6667cqw × 0.1389cqw`,
`margin-top: max(1.9444cqw, var(--head-air, 0px))`, `transform-origin: left`, `{opacity 0, scaleX(0)}
→ {1, 1}` at `2 * 130` — and the intro
`Every race is a step forward. Here's how the season is shaping up.` word by word
(`wordStagger 34`, `{150, 24}`, `column-gap: 0.22em`, delay `2*130 + 90`), uppercase, line-height
1.1, `margin-top: max(2.0833cqw, var(--head-air))`, `width: max(16.1111cqw, var(--copy-min-w))`,
`font-size: max(1.25cqw, var(--copy-min-size))`.

### The standings plate (bottom right, `align-self: flex-end`)

A `277×78` frame with the bottom-right corner cut 9, drawn as one stroked-and-filled SVG path:
`viewBox="0 0 277 78"`, `M0.5 0.5H276.5V69L268 77.5H0.5Z`, `fill: var(--surface-black); stroke: var(--accent); stroke-width 1; vector-effect: non-scaling-stroke`, plus a divider line at `x = 83`.
Size `var(--plate-w, 19.2361cqw) × var(--plate-h, 5.4167cqw)`, `display: grid; grid-template-columns: var(--plate-cell, 5.7639cqw) 1fr`.
The plate rises `{0, translateY(0.75rem)} → {1, 0}` with `REVEAL` at **260ms**; its type starts at
**430**.

- Badge cell (centred column, `gap: var(--plate-badge-gap, 0.7639cqw)`): the **globe** — an SVG
  `viewBox="0 0 37 23"`, `stroke: var(--accent); stroke-width 1; fill none`: an ellipse
  `cx 18.5 cy 11.5 rx 18 ry 11`, the equator line from `0.5,11.5` to `36.5,11.5`, and a **meridian**
  ellipse whose `rx = max(0.5, |cos(turn)| * 18)`, `turn` running 0→2π every **10s** linear, looping
  (paused off screen). Under it `F1` (white) and `/ 2026` (accent), letter by letter
  (`letterStagger 22`, `TYPE {210, 24}`) at 430 and 490, `font-size: var(--plate-eyebrow, max(0.8333cqw, var(--type-min)))`, line-height 0.72, tracking −0.02em, `gap: 0.3em`.
- Stats cell (`padding-left: var(--plate-stats-left, 1.1111cqw); gap: var(--plate-stats-gap, 0.5556cqw)`, uppercase, line-height 0.72, `font-size: var(--plate-body, max(0.9722cqw, var(--type-min)))`),
  three rows `<dt>` accent + `<dd>` white (`gap: 0.35em`, `dd` grows, nowrap), letter by letter:
  `P1` / `in the championship`, `6` / `wins`, `9` / `podiums.` — the figure at `430 + row * 110`, its
  wording 70ms after.

### The chequered dissolve (the seam)

A canvas band `absolute inset-x-0 top-0; height: 34svh; pointer-events: none`, over the copy.
Scrubbed by a scroll trigger `start "top bottom" → end "top top"` (`TRIGGER {140, 30}`), progress
0→1 as the band's top rises from the fold to the ceiling. Verbatim render:

    [[code block from line 2844]]

`carry="light"` here (the hero's ground carried into the dark block). The same component seams the
timeline (`carry="light"`, `z-index 30`) and the paddock (`carry="dark"`: the near-black carried into
the light block, `z-index 30`). Re-render on resize and on every progress change.

### The circuit stage

A `1440×800` stage (`position: absolute; left: 0; top: 0; width: 1440px; height: 800px; transform-origin: top left`) inside an `absolute inset-0; overflow: hidden` frame masked top and bottom
(`mask-image: linear-gradient(to bottom, transparent 0, #000 10%, #000 90%, transparent 100%)`; no
mask below `lg`). **Fit**: from 1024 wide, **cover** — `scale = max(w/1440, h/800)`, centred by
`translate((w - 1440s)/2, (h - 800s)/2)`. Below 1024, **fit the track box to the width**:
`TRACK_BOX` = the lap path's bounding box padded 46 → `scale = w / TRACK_BOX.width`, centred on the
box's centre. Re-fit on resize.

Inside the stage, two things at the artboard's coordinates:

1. **The map** — a `2560×1440` SVG (plus its halftone canvas beneath it) placed at
   `top: 2 - 11.67 * 796 / 1416.66 px` (= −4.559px), `width: 1438.43px`, `height: 796 * 1440 / 1416.66 px` (= 809.11px) — the artwork is 1.807:1 in a squarer frame, banded 11.67 top and bottom; undoing the band seats the circuit on the artboard.
2. **The trace canvas** — `1440×800` CSS, backing store `× min(devicePixelRatio, 2)` (1 on a coarse
   pointer), drawn in artboard units.

#### The map SVG

`viewBox="0 0 2560 1440"`, `overflow: visible`, `aria-hidden`. In this order:

- **The halftone canvas** `absolute inset-0` under the SVG (see below).
- `<g id="grid">`: three vertical and one horizontal dashed axes — `x = 645.31, 1276.96, 1908.61` and
  `y = 697.98`, drawn **4000 units past the artboard** on both ends, `stroke: var(--map-grid); stroke-width 2.13; stroke-dasharray "12.15 8.35"`, with `stroke-dashoffset` running 0 → 20.5 (one dash period) every **7s** linear, looping — the grid crawls. Three rings on the hub `(1278.48, 699.5)`: `r 69.85` width 3.04 in `--map-grid`; `r 356.06` and `442.61` width 2.13 in `--map-grid-ghost`. A **ping**: a circle on the hub, `r = 10.63 + v * 86`, `opacity = 0.4 * (1 - v)²`, `stroke: var(--accent)` width 2.13, `v` 0→1 every **4.2s** ease-out quad, looping. Seven `16.7`-square corner marks in `--map-mark` at `[65.29, 76.96] [2471.93, 76.96] [65.29, 931.81] [2471.93, 931.81] [65.29, 1343.3] [1155.49, 1343.3] [1384.77, 1343.3]` and the hub dot `r 10.63`. Both loops pause off screen.
- The **track**, cut at the flag: inside a mask that is white everywhere except a
  `36 × 40` black rect centred on `(822.96, 921.57)` rotated `144°` — the ribbon path `TRACK_RIBBON`
  (below) filled `--foreground-on-dark`, and the **same path filled `--accent` under the lap mask**.
- The **lap mask**: `LAP_CENTRELINE` stroked white, `stroke-width 30`, round caps and joins,
  `stroke-dasharray = 4805.57 + 60`, `stroke-dashoffset = 60 + reveal * 4805.57` where
  `reveal = 1 - distanceAtTime(lap) / TOTAL` — the mask uncovers the designer's ribbon *along the
  lap* on the same distance curve the canvas head uses.
- `<g id="markers">`: four turn triangles — `<polygon points="13.69,0 -6.85,11.86 -6.85,-11.86">`
  filled `--accent`, at `(1349.96, 351.98) rotate 73.5`, `(1862.23, 611.24) rotate 30.5`,
  `(1732.95, 903.82) rotate 89.5`, `(585.43, 916.65) rotate 17.5` — and the chequered flag
  `FLAG_DIAMONDS` in `--map-mark`, over the gap the cut leaves.

The vector data, verbatim:


    [[code block from line 2915]]

`map-vector.ts`:

    [[code block from line 2979]]


#### The lap — one 6-second pass when the block arrives

An `IntersectionObserver` at `threshold 0.35` on the stage's frame starts a one-shot tween
`lap: 0 → 1` over **6000ms, ease-in-out sine**; every change re-renders the canvas. When it rests, a
second tween `heat: 1 → 0` over **800ms ease-out cubic** cools the head to a plain line — and only
when *that* rests is the cursor reticle armed. The lap must never re-run or reverse.

The path is the `CIRCUIT_PATH` below (900 points, 3 units apart, closed on the flag). **Pacing lives
in the path's own curvature**: the lap slows through the corners and runs away down the straights.
Verbatim:

    [[code block from line 3127]]

The path data:


    [[code block from line 3273]]


#### The halftone — 8,004 dots, lit

The dots are the map's landmass, drawn on a canvas that is `absolute inset-0` under the SVG, its
backing store `min(devicePixelRatio, 2)` (1 on a coarse pointer) times the map box's CSS size, and
its coordinate space the map's own `2560×1440`. The resting field is **baked once** into an
offscreen canvas (every dot a `1.75`-radius disc in `--map-dot`) and blitted; per frame only the lit
dots are touched, found by lattice arithmetic. A lit dot **squares up into a chequer** — the square
grows from `0.7` to `1` of the lattice pitch as the light rises past the threshold, and the
lattice's own parity decides whether a cell fills or is cleared. The shipped light source is
**`none`**: the cursor reticle is the only light, and it arms only after the lap has cooled.

The dot data (`map-dots.ts`) and the engine (`season-dots.tsx`) are quoted verbatim below; the
parameters are `threshold 0.34, radius 170, waveSpeed 0.16, fade 0.9, source "none"`. The frame
clock is a looping 2000ms linear tween whose only job is to tick (paused off screen); `dt` is
`min(0.1, elapsed)`. The pointer is read on `window` (`pointermove`, mouse only; not under
`(hover: none)` or reduced motion), converted to map units through the canvas's own rect, and is
"on" only while inside the section's box; `pointerleave` on the document and `blur` put it out.

`map-dots.ts`:

    [[code block from line 3571]]

`season-dots.tsx` — the engine (constants, the lattice index, the bake, the light, the draw, the frame):

    [[code block from line 3866]]


## 4 — From karts to F1 (the timeline)

`<section>` — `container-type: inline-size; position: relative; isolation: isolate; width: 100%; background: var(--surface-black); color: var(--foreground-on-dark); padding-bottom: var(--bottom-pad)`
where `--gutter: max(2.2222cqw, var(--gutter-min, 0px))`, `--bottom-pad: 10.4167cqw` (150 design px),
`--bottom-pad-narrow: 5cqw`. Below `lg`: `overflow-x: clip` (**not** `hidden` — that would make it a
scroll container and kill the sticky stack) and `--copy-min-size: 17px; --head-min: 6.6667cqw; --head-w-min: 82cqw; --year-min: 30px; --copy-min-w: 200px`; `sm…lg`: `--top-pad-extra: 16cqw; --head-top: var(--bottom-pad)`;
below `sm`: `--head-min: 40px; --top-pad-extra: 15cqw; --copy-min-w: 320px; --gutter-min: 24px`;
from `sm`: `--copy-max-w: 26.9444cqw`. It is the last layer of the stack — `position: relative; z-index: 20`, never pinned.

The chequered dissolve seams it (`carry="light"`, `z-index 30`, phone 0). Then a wrapper
`position: relative; width: 100%; padding-top: calc(var(--top-pad) + var(--top-pad-extra, 0px))`
with `--top-pad: 11.7361cqw` (169) holding the rail, the heading and the seven rows (below `sm` the
wrapper is a column, `gap: 2.5rem; padding: 0 var(--gutter)`).

The geometry module and the plate shape are quoted verbatim below. The frame is 1440×2700: 169 of
top inset, then rows of **462** (centre) and **217** (side) stacked with **no gap at all** —
centre, side, centre, side, centre, side, centre — and 32 below.

### The heading

`<h2>` Oswald 700 uppercase line-height 0.95 `color: var(--accent)`, `font-size: max(3.8194cqw, var(--head-min, 0px))`,
`position: absolute; z-index: 20; top: var(--head-top, var(--gutter)); right: var(--gutter); width: max(20.3472cqw, var(--head-w-min, 0px))`,
right-aligned (`align-items: flex-end; text-align: right; justify-content: flex-end` from `lg`;
centred below; left at the gutter below `sm` where the two lines sit in one row, `gap: 0.28em`).
Two lines — `from karts` / `to f1` — word reveals at `index * 130`, the full stop after the last in
white at `130 + 110`.

### The rail

`position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); z-index: 10; width: 1.1111cqw; top: var(--rail-top)`, hidden below `sm`.
`--rail-top` is `0` (the block's own top edge) from `lg`, and `calc(11.7361cqw + var(--top-pad-extra, 0px))` below it (the first photograph). One SVG,
`viewBox="0 0 16 ${viewH}"` where `viewH = railHeight - origin`, `overflow: visible`, `size: 100%`:

- the track: a line at `x = 8` from `0` to `98` solid, then from `102` to `rest` dashed `6 6`,
  `stroke: var(--timeline-rail); stroke-width 1`;
- a **progress rect** `x 7.5, width 1`, `height = run`, `fill: var(--foreground-on-dark)`;
- a **marker square** of side `9` (`20` below `lg`), `fill` white, `transform = translate(8 ${run}) rotate(${run / rest * 1800})` — **five full turns** over the run.

`run = interpolatedProgress * rest`, scrubbed by a trigger `start "top center" → end "bottom bottom"`
on the rail element (the page ends with this block's stack, so the last half-viewport is
unreachable; `bottom bottom` is what lets the thread finish). `rest` is the resting point: the last
row's middle minus 50, i.e. `restingPoint()` in the geometry — the thread stops **on the last
entry**, not at the foot.

### A row

`position: relative; width: 100%; height: px(462 | 217)`; below `sm` a column `gap: 0.75rem; height: auto`.
Three things, each on its own **parallax layer** — a scrub trigger on the row's whole crossing
(`"top bottom" → "bottom top"`) that moves the layer's content on **`top`** (never a transform) from
`+px(travel)` to `−px(travel)`, so it passes through its design position exactly as the row passes
the middle of the screen. `PARALLAX = { plate: { side: 60, centre: 20 }, copy: 110 }` — in design px,
half-ranges, in `cqw`.

1. **The plate** — `position: absolute; inset-y: 0; width: px(333 | 710)`; a side plate sits at
   `left: var(--gutter)` or `right: var(--gutter)` per `align`, a centre plate at `left: 50%; transform: translateX(-50%)`.
   Below `sm` every plate is `width: 82%; aspect-ratio: 710/462`, alternating `margin-right: auto` /
   `margin-left: auto` by row index. The plate is `TimelinePlate`: a clip to `PLATE_CLIP`
   (`clipPathUnits="objectBoundingBox"`) on an `absolute inset-0; overflow: hidden; background: var(--timeline-fill)`
   fill that **insets to 5% on hover** (`transition: inset 700ms cubic-bezier(0.33,0,0,1)`) while the
   outline stays — `PLATE_OUTLINE` in an `absolute inset-0` SVG `viewBox="0 0 710.995 462.995" preserveAspectRatio="none"`,
   `stroke: var(--timeline-outline); stroke-width 1; vector-effect: non-scaling-stroke`. Inside the
   fill, a second scrub (`"top bottom" → "top center"`) moves the slot's content on `top` from
   `-10%` to `0%`, and the photograph is `object-fit: cover; height: 110%` pinned to the top — the
   overscan *is* the travel. Plate parallax travel: `plate[frame]`.
2. **The year** — `position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); z-index: 20; pointer-events: none`,
   Oswald 700 uppercase line-height 0.95 `color: var(--accent)`, `font-size: max(px(36), var(--year-min, 0px))`.
   It rides its **plate's** parallax figure (not one of its own). Letter by letter
   (`letterStagger 26`, `YEAR {190, 24}`, mode forward) when the row enters view (`rootMargin 0% 0% -25% 0%`, once).
   On a **centre** row it then settles from `opacity 1` to **`0.4`** after a `2200ms` hold with
   `YEAR_SETTLE {32, 26}`; on a side row it stays at 1. Below `sm` it sits on the picture's middle
   (`position: relative; height: 0; width: 82%; top: -28.8cqw; text-align: center`, same side as the plate).
3. **The copy** (centre rows only) — `<p>` `position: absolute; left: px(1020); top: 50%; transform: translateY(-50%); z-index: 20; pointer-events: none`,
   uppercase, line-height 1.1, white, `width: min(max(px(copyWidth), var(--copy-min-w, 0px)), var(--copy-max-w, 100vw))`,
   `font-size: max(px(18), var(--copy-min-size, 0px))`; the lead sentence bold then the rest. A block
   rise `{0, translateY(0.75rem)} → {1, 0}` with `COPY {110, 26}` at `+220` after the row enters view.
   Its content rides `PARALLAX.copy` — the nearest layer moves most.

**Hovering one plate dims the rest of the block**: with `(hover: hover)`, when any plate is hovered
every row goes to `opacity: 0.3` except the hovered row (`transition: opacity 700ms cubic-bezier(0.33,0,0,1)`).

The seven entries, verbatim (`copyWidth` is the design's own column per row; images are
`timeline/<year>.webp`, all 1420×1016):

| year | frame | align | copy |
|---|---|---|---|
| 2012 | centre | — | **The first kart.** At six, Kimi discovered karting — turning a childhood curiosity into something of his own. (228) — alt "Kimi in kart overalls in the paddock, aged six" |
| 2015 | side | right | — alt "Kimi holding a karting trophy at sunset" |
| 2019 | centre | — | **Finding his people.** Kimi joined the Mercedes Junior Programme, marking his first major step into professional motorsport. (272) — alt "Kimi signing with the Mercedes junior team" |
| 2021 | side | left | — alt "Kimi beside a single-seater in the garage" |
| 2024 | centre | — | **The year everything changed.** Formula 2 brought Kimi closer to F1, while Mercedes confirmed him as their future race driver. (278) — alt "Kimi walking the pit lane in Mercedes kit" |
| 2025 | side | right | — alt "Kimi in the Mercedes garage" |
| 2026 | centre | — | **From karts to f1.** Kimi is now racing at the highest level, with Bologna still his anchor — family, home and life beyond racing. (284) — alt "The Mercedes-AMG F1 car on track" |

The geometry, verbatim:


    [[code block from line 4434]]

`plate-shape.ts`:

    [[code block from line 4684]]


## 5 — From the paddock

`<section>` — `container-type: inline-size; position: relative; isolation: isolate; min-height: var(--block-h, 100lvh); width: 100%; overflow: hidden; background: var(--background); color: var(--foreground)`.
The 1440×800 frame at 1:1 in `cqw`. The stack, bottom up: the contour backdrop, the dark **band**
(`absolute inset-x-0 bottom-0; height: calc(11.7361cqw * var(--band-scale, 1)); background: var(--surface-black)`),
the portrait on a parallax layer (`absolute inset-0; z-index 10`), a gradient that melts the
portrait's foot into the band (`absolute inset-x-0 bottom-0; z-index 10; height: the band's;
background: linear-gradient(to bottom, rgb(9 10 11 / 0) 0%, var(--surface-black) var(--band-fade, 38.685%))`),
the chequered dissolve (`carry="dark"`, `z-index 30`, phone 0), then the intro, the two panels and
the calendar strip.

### The contour backdrop — the hero's field on a 2D canvas

`<canvas>` `absolute inset-0; pointer-events: none`, backing store `× min(devicePixelRatio, 2)`,
redrawn from the shared ticker at **24ms** while in view. Marching squares over a `96`-cell grid
(the long edge; the short edge keeps the cells square), the same field and constants as the
shader — verbatim:

    [[code block from line 4734]]

### The portrait

`paddock/portrait.webp` (1350×1165, alt "Kimi Antonelli in the paddock") —
`position: absolute; bottom: var(--fig-lift, 0px); left: var(--fig-x-override, 65.6917%); transform: translateX(-50%); height: min(calc(102.0363% * var(--fig-fit, 1)), var(--fig-cap, 100000px)); width: auto; aspect-ratio: 1.15881; object-fit: cover; user-select: none`
— sized off the block's **height** (816.29 in an 800 frame, hung 16 above the top so it bleeds off
both ends). Its layer is a scrub over the block's crossing (`"top bottom" → "bottom top"`) moving
`top` from `0cqw` to `−3.3333cqw` — **up only**, 48 design px.

### The intro (left rail)

- `<h2>` `position: absolute; z-index 20; left: var(--head-left, 2.2222cqw); top: var(--head-top, 2.2222cqw)`,
  Oswald 700 uppercase line-height 0.95, `color: var(--foreground)`, `font-size: max(max(6.6667cqw, var(--type-min)), var(--head-min, 0px))` —
  `from the` / `paddock`, word reveals at `index * 130`, the full stop in the **accent** at `130 + 110`.
- A column `position: absolute; z-index 20; left: var(--intro-left, 2.2222cqw); bottom: var(--intro-bottom, calc(11.7361cqw * var(--band-scale, 1) + 2.2222cqw)); width: max(23.4722cqw, var(--intro-min-w, 0px)); gap: var(--intro-gap, 2.7778cqw)` —
  what the design fixes is the 32 between this column's foot and the band. The report:
  `A composed drive through a difficult weekend secured another podium — and kept Kimi at the top of the championship.`
  word by word (`wordStagger 30`, `{150, 24}`, `column-gap 0.22em`, delay `2*130 + 90`), uppercase,
  line-height 1.1, `font-size: max(1.25cqw, var(--copy-min-size))` (white below `sm`, where it lands
  on the figure). Then the button, rising `{0, translateY(0.75rem)} → {1, 0}` at `2*130 + 260`.
- **The button** `read story` → `/stories/hungarian-gp`: `217×50`, chamfer 8, every length a ratio
  of its height `--cta-h` (`3.4722cqw`; `50px` between `sm` and `lg` and below `sm`), width
  `calc(--cta-h * 4.34)`. SVG `viewBox="0 0 217 50"`: the outline
  `M0.5 0.5H216.5V42L209 49.5H0.5Z` **filled `var(--surface-black)`** with `stroke: var(--accent)` 1
  non-scaling — a dark slab with cyan type on this light surface — and the accent flood
  (`scaleX(0) → 1` on hover, 250ms `--ease-plate`, `transform-origin: left`). Label
  `position: absolute; inset-y: 0; left: calc(h * 24/50); gap: calc(h * 32/50); font-size: calc(h * 20/50)`,
  uppercase, line-height 0.9, accent → black on hover; the arrow `M0 5.35H13M8 10.35L13 5.35L8 0.35`
  at `calc(h * 13.71/50) × calc(h * 10.71/50)`, stepping `translateX(0.25rem)` on hover.

### The two panels (right rail) — hidden below `sm`

Both are framed by **corner brackets** drawn as one path four ways (`M0 0.5H10V10.5`,
`viewBox 0 0 10.5 10.5`, `10` design px square, rotations `tl 270 · tr 0 · br 90 · bl 180`), each
corner offset outward by `--bracket-spread` (0 unless something sets it) and the bottom pair moved
alone by `--bracket-stretch`; both `left`/`top` transition over `700ms --ease-plate`. **These two
sets are stroked `var(--foreground)`** (black), not the accent. Their unit `U` is `calc(100cqw / 1440)`
(`1px` between `sm` and `lg`, where the panels are drawn at the hero's 1:1 size).

The text column is anchored to the **right gutter**: `columnWidth = 193U`,
`columnRight = calc(2.2222cqw + 12U)`, `columnLeft = calc(100% - columnRight - columnWidth)`;
the bracket frame runs `FRAME_RIGHT = calc(100% - 2.2222cqw)` to `FRAME_LEFT = FRAME_RIGHT - columnWidth - 25U`.

- **The meeting**: brackets from `y 32U` to `105U` (fading in at **320ms**); the column at
  `left: columnLeft; top: 43U; width: 193U; gap: 6U; font-size: 14U`, uppercase, line-height 0.9,
  rising at `410`: `hungarian gp` (bold), `silverstone`, `july 12, 2026`.
- **The stats**: brackets from `y 137U` to `535U` (at **460ms**); the column at
  `left: calc(100% - columnRight - 193U); top: 147U; width: 193U`. Four rows, each `58U` tall
  (`align-items: flex-end; gap: 24U`): the icon (`31U`, `paddock/icon-{flag,bars,trophy,gauge}.svg`),
  then a label (`12U`, uppercase, tracking `-0.48U`, `--foreground-muted`) over the figure (Oswald
  500, `38U`, line-height 0.72, tracking `-3.04U`) — `last result` / `P4`, `points gained` / `+12`,
  `championship` / `P1`, `points` / `118`. Between rows a 1px rule in `--foreground-muted`,
  `margin: 24U 0 23U`, drawing in from the left (`scaleX 0 → 1`) at `460 + row * 90`; each row
  rises at `+40` after its rule and its figure resolves letter by letter (`letterStagger 24`,
  `FIGURE {200, 24}`) at `+120`.

### The calendar strip (the band)

`position: absolute; inset-x-0 bottom-0; z-index 20; height: calc(11.7361cqw * var(--band-scale, 1))`.
Everything is measured **from the top of the band**; every x is spread about the block's middle by
`--cal-spread` (1 at the frame's own coordinates): `spread(x) = calc(50% + px(x - 720) * var(--cal-spread, 1))`.
The strip's entrance is gated on it entering view (`rootMargin 0% 0% -20% 0%`, once); everything
is `mode forward`.

- **Four dashed connectors** at `top: calc(px(131.5) + var(--cal-mark-drop, 0px))`, 1px tall:
  `{x 416, w 126}`, `{580, 128}`, `{743, 136}`, `{914, 124}`; each a
  `repeating-linear-gradient(to right, var(--foreground-on-dark-muted) 0 px(7), transparent px(7) px(11.45))`
  whose `background-position-x` runs `0 → ±px(11.45)` every **5200ms** linear, looping — the two left
  of the live round crawl **right**, the two right of it crawl **left**, toward the race being
  reported. Each scales in (`scaleX 0 → 1`, `transform-origin: left`) at `560 + index * 90`.
- **Five cards** at `left: calc(spread(x + w/2) - px(w/2)); top: calc(px(43) + var(--cal-card-drop, 0px)); width: var(--cal-card-w, px(w))`,
  centred column, uppercase, `gap: type(12)`; rising `{0, translateY(0.5rem)} → {1, 0}` at `560 + i * 90`:
  the round (`type(12)`, tracking `px(-0.24)`), the name (Oswald 700, line-height 0.95, white,
  `font-size: max(type(18), var(--copy-min-size))`, rising `{0, translateY(0.3em)} → {1, 0}` with
  `NAME {190, 24}` at `+110`), the date (`type(14)`, tracking `px(-0.28)`). Round and date are
  `--foreground-on-dark-muted`, **accent on the live round**.

  | round | name | date | x | width | marker |
  |---|---|---|---|---|---|
  | round 11 | austrian gp | 29 jun | 347 | 100 | `p6` |
  | round 12 | british gp | 12 jul | 511 | 100 | `p4` |
  | round 13 | belgian gp | 27 jul | 675 | 100 | **live** — filled accent dot |
  | round 14 | hungarian gp | 03 aug | 839 | 114 | ring |
  | round 15 | dutch gp | 31 aug | 1017 | 76 | ring |

- **Markers** on the connector run at `top: calc(px(126) + var(--cal-mark-drop, 0px))`, centred on
  each card, fading in at `560 + i * 90 + 60`: a result in Oswald 700 `type(12)` uppercase white, or
  an `11`-unit SVG — `r 5` white ring for rounds to come, `r 5.5` accent disc for the live one.
- **The live pulse**: on the live marker, a ring `r = 5.5 + v * 5.5 * 3.4`, `opacity = 0.5 (1 - v)²`,
  stroke accent 1 non-scaling, `v` 0→1 every **3200ms** ease-out quad, looping (hidden below `sm`).
- **The live bracket** (fading in at `560 + 5 * 90`, `pointer-events: none`): accent brackets from
  `spread(669)` to `spread(781)`, `y 32` to `113` from the band's top. **Hovering the live card opens
  them by 5 design px** (`--bracket-spread: px(5)` on the strip while the live card is hovered).

Below `sm` the strip becomes a three-column grid (`padding: 1.5rem 4%; gap 0.75rem/1.25rem`, a rule
above it in white at 15%) showing only the last three rounds, connectors, markers and bracket hidden.

### The narrow variables (tablet and phone)

Between `sm` and `lg` the section sets: `--type-min: 13px; --copy-min-size: 17px; --stats-row-min: 42px; --fig-cap: 118.75cqw; --fig-x-override: 65.7%; --cta-h: 50px; --band-scale: 1.75; --cal-spread: 1.75; --cal-mark-drop: 8cqw; --cal-card-drop: 1.3cqw; --panel-u: 1px; --stats-rule-top: 16px; --stats-rule-bottom: 11px; --stats-frame-drop: 0px; --stats-drop: 2.86cqw; --stats-col-w: 170px; --intro-min-w: 280px`
and the two panels **trade places** — the stats run down the left under the masthead
(`--stats-left: calc(2.2222cqw + 13px); --stats-frame-left: 2.2222cqw; --stats-frame-right: calc(2.2222cqw + 195px)`;
bracket stretch `calc(var(--panel-u) * -62)`), the meeting takes the top-right corner on the
masthead's cap line (`--meet-frame-left: calc(100% - 2.2222cqw - 131px); --meet-frame-right: calc(100% - 2.2222cqw); --meet-frame-top: 2.8646cqw; --meet-frame-bottom: calc(2.8646cqw + 73px); --meet-left: calc(100% - 2.2222cqw - 118px); --meet-top: calc(2.8646cqw + 11px)`),
and the live bracket takes `--bracket-drop: 1.7cqw; --bracket-stretch: 5.9cqw`.

Below `sm` the block is a **stack** that grows to fit (`PHONE` in the geometry): `--block-h: 1062px; --intro-bottom: 139px; --head-left/--intro-left/--meet-frame-left/--stats-frame-left: 24px; --head-top: 24px; --intro-min-w: 320px; --intro-gap: 24px; --band-fade: 60px; --cta-h: 50px; --panel-u: 1px; --meet-left: 37px; --meet-top: 121px; --meet-frame-top: 110px; --meet-frame-bottom: 183px; --meet-frame-right: 155px; --stats-left: 37px; --stats-frame-right: 369px; --stats-col-w: 320px; --stats-drop: 63px; --fig-cap: 599px; --fig-x-override: 48.5%; --fig-lift: 328px; --band-scale: 8.48; --cal-card-w: 100%; --head-min: 40px` — masthead, the meeting, the four figures two-up, Kimi standing in the strip, the report and its button, then the three-card strip. (The panels are hidden below `sm` in the shipped page; the variables are what the layout would use.)

The geometry module, verbatim:


    [[code block from line 4894]]


## 6 — Keep pushing forward (the footer)

`<section>` — `container-type: inline-size; position: relative; isolation: isolate; min-height: var(--foot-h, 100lvh); width: 100%; overflow: hidden; background: var(--accent)`.
A cyan page edge with a near-black panel inset **16** (`1.1111cqw`) on every side:
`position: absolute; inset: 1.1111cqw; overflow: hidden; background: var(--surface-black); color: var(--foreground-on-dark)`,
holding the same **contour backdrop** as the paddock, in `--footer-contour` (white at 10%). No
chequered seam into this block — the accent edge already draws the join.

The figure sits **on the section, not in the panel** (it hangs 9.8 past the foot to cover the accent
edge): a group `absolute inset-0; z-index 10; transform-origin: bottom; scale: var(--fig-scale, 1); translate: var(--fig-shift, 0)`,
hidden below `sm`. Inside it a parallax layer whose window **ends at `bottom bottom`**
(`"top bottom" → "bottom bottom"`, the moment the page is scrolled to its end) moving `top` from
`px(60)` to `0cqw` — the figure rides *back into place* and the resting frame is exact. Two plates,
both sized off the block's **height**, moving as one:

- `footer/body.webp` (1536×1024, suit behind) — `position: absolute; z-index 10; left: 50%; bottom: -1.225%; height: 96.078%; aspect-ratio: 1.15902; transform: translateX(-50%); object-fit: cover`,
  **masked to the suit**: `mask-image: linear-gradient(to bottom, transparent 69%, black 72%)` — the
  export carries the driver's own head and helmet, which must stay hidden behind the plate in front.
- `footer/helmet.webp` (1536×1024, alt "Kimi Antonelli's helmet") — `left: 50%; top: 1.25%; height: 83.364%; aspect-ratio: 1.5; transform: translateX(-50%)`.

The copy sits on the section too (frame-relative coordinates). `G = var(--foot-gutter, 2.2222cqw)`:

- **Logo** — `absolute z-20; left: G; top: G; width: var(--logo-w, 7.3611cqw); height: var(--logo-h, 1.6667cqw); background: var(--accent); mask-image: url(footer/logo-mask.png); mask-size: 100% 100%`
  (the design's own artwork as a mask filled with the accent), `role="img" aria-label="GRID01 Racing Systems"`, fading in at `120`.
- **Masthead** — `<h2>` `absolute z-20; top: var(--foot-head-top, G); right: var(--foot-head-right, G); width: max(25.6944cqw, var(--head-w-min, 0px)); font-size: max(3.8194cqw, var(--foot-head-min, 0px))`,
  Oswald 700 uppercase line-height 0.95, **accent**, right-aligned column (`align-items: flex-end`):
  `keep pushing` / `forward`, word reveals at `index * 130`, the full stop in **white** at `130 + 110`. Hidden below `sm`.
- **Nav** — `absolute z-20; left: 0; margin-left: G; top: var(--nav-mid, 50%); transform: translateY(-50%); width: var(--nav-w, 10.9722cqw); gap: var(--nav-gap, type(12)); font-size: var(--nav-size, type(36))`,
  Oswald 700 uppercase line-height 0.95 white, each link `display: block; width: max-content; height: var(--nav-row, type(34))`,
  hover accent — `driver` / `season` / `journal` / `next race` / `store` (→ `/driver` … `/store`),
  each resolving **letter by letter** (`letterStagger 22`, `ROW {170, 24}`, `column-gap 0.2em`,
  nowrap) at `260 + index * 80`. Below `sm` each is a full-width row with a 15%-white rule under it
  and an accent arrow at its end.
- **The foot row** — all three end **32 above the foot** (`bottom: max(2.2222cqw, var(--foot-bottom-min, 0px))`), rising `{0, translateY(0.75rem)} → {1, 0}` at `640`, `720`, `800`:
  the copyright `© 2026 GRID01 Racing Systems. All rights reserved.` (`left: G; width: max(type(220), var(--foot-copy-min, 0px)); font-size: type(14)`, uppercase, line-height 1.1, `--foreground-on-dark-faint`);
  the button `legal documents` → `/legal` at `left: var(--cta-left, 40.4861cqw)` — `275×50`, chamfer 8.835, **hollow** (`M0.5 0.5H274.5V41.165L266.165 49.5H0.5Z`, `fill none; stroke: var(--accent)` 1 non-scaling, `preserveAspectRatio="none"`), the accent flood on hover, label `left: h * 24/50; gap: h * 32/50; font-size: h * 20/50` accent → black, the same arrow; and the socials
  (`right: var(--social-right, G); width: max(type(206), var(--social-min-w, 0px)); font-size: type(14)`, `justify-content: space-between`, uppercase, white, hover accent): `inst` / `x` / `youtube`.

Narrow variables — below `lg`: `--type-min: 13px; --foot-bottom-min: 5cqw; --head-min: 6.6667cqw; --head-w-min: 44cqw; --foot-head-min: 6.6667cqw`; between `sm` and `lg`: `--foot-h: 104cqw; --fig-scale: 0.87; --fig-shift: 3%; --logo-w: 106px; --logo-h: 24px; --nav-size: 36px; --nav-gap: 12px; --nav-row: 34px; --cta-left: 50%; --cta-shift: -50%; --foot-copy-min: 200px; --cta-h: 50px`; below `sm`: `--foot-gutter: 24px; --foot-h: 680px; --nav-mid: 282px; --cta-bottom: 73px; --social-bottom: 151px; --social-left: 24px; --social-right: auto; --social-min-w: auto; --logo-w: 106px; --logo-h: 24px; --nav-size: 30px; --nav-gap: 18px; --nav-row: auto; --nav-w: calc(100cqw - 48px); --cta-left: 24px; --cta-w: calc(100cqw - 48px); --foot-head-left: 24px; --foot-head-right: auto; --foot-head-top: 78px; --cta-h: 50px; --foot-copy-min: 212px; --foot-head-min: 40px; --head-w-min: 240px`.

The geometry, verbatim:


    [[code block from line 5317]]


## Responsive rules, in one place