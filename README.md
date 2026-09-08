# LANDO — GRIDO1 Racing Systems / Kimi Antonelli

A one-page driver site for Kimi Antonelli, driver_012 of GRIDO1 Racing Systems.

**The deliverable is `index.html`** — one self-contained file. No build step, no
framework, no bundler at runtime: plain HTML, CSS and inline ES modules, with
three.js and Lenis pulled through an import map. Everything else — the spring
solver, the shared ticker, the scroll triggers, the text reveals, the sticky
stack, the circuit trace, the halftone, the chequered dissolves, the contour
backdrops and the loader — is hand-written.

## What is in here

| path | what it is |
|---|---|
| `index.html` | the shipped page, built |
| `template.html` | the markup and the stylesheet |
| `src/` | the TypeScript sources the script half is authored in |
| `build.mjs` | bundles `src/` and splices it into `template.html` |
| `Prompt.md` | the specification this was built from |
| `spec/` | the specification's code blocks, extracted |

`src/hero/scene.ts`, `src/hero/device.ts`, the season block's vector and path
data, and the four geometry modules are the specification's own source, used
verbatim.

## Building

```
npm install
npm run build      # writes index.html
```

`build.mjs --dev` skips minification.

## Blocks

1. **Hero** — a WebGL scene: a depth-parallax portrait with a Mercedes helmet
   worn over it. The helmet burns away crown-to-chin, then exists only where
   the cursor has just been.
2. **The season so far** — an instrument-panel map of the circuit: an 8,004-dot
   halftone landmass and a 6-second lap that fills the track ribbon.
3. **From karts to F1** — seven photographs on stepped-corner plates, on a rail
   with a marker that turns five times over the block.
4. **From the paddock** — the race report, the calendar strip, and the hero's
   contour field drawn by marching squares.
5. **Keep pushing forward** — the sign-off.

The first three are a sticky stack: each pins and the next comes out over it.

## Assets

Every image, texture and model is fetched from
`https://storage.getlayers.ai/assets/lando-04a9449ab2/`, built from one
`ASSET_BASE_URL` constant in `src/lib/assets.ts`.
