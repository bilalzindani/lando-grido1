/**
 * Assembles the single self-contained index.html.
 *
 * The shipped artefact has no build step, no framework and no bundler: it is
 * one HTML file with plain ES modules inline, pulling three.js and Lenis
 * through the import map. This script only *authors* it — it bundles the
 * TypeScript sources into one ES module and splices the result into the
 * template between the two markers.
 */
import { build } from "esbuild";
import { readFile, writeFile, mkdir, cp, rm } from "node:fs/promises";

const EXTERNALS = ["three", "three/addons/*", "lenis"];

const result = await build({
  entryPoints: ["src/main.ts"],
  bundle: true,
  format: "esm",
  target: ["es2022"],
  external: EXTERNALS,
  minify: process.argv.includes("--dev") ? false : true,
  legalComments: "none",
  write: false,
  charset: "utf8",
});

const code = result.outputFiles[0].text;
const template = await readFile("template.html", "utf8");

const START = "<!-- @BUNDLE -->";
const END = "<!-- /@BUNDLE -->";
const a = template.indexOf(START);
const b = template.indexOf(END);
if (a < 0 || b < 0) throw new Error("template markers missing");

const html =
  template.slice(0, a + START.length) +
  '\n<script type="module">\n' +
  code +
  "</script>\n" +
  template.slice(b);

await writeFile("index.html", html, "utf8");

// dist/ is what the host serves: the page and the artwork it needs.
await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });
await writeFile("dist/index.html", html, "utf8");
await cp("assets", "dist/assets", { recursive: true });

const kb = (n) => (n / 1024).toFixed(1) + " kB";
console.log("index.html  " + kb(Buffer.byteLength(html)) + "  (script " + kb(Buffer.byteLength(code)) + ")");
