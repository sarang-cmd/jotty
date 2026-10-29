/**
 * esbuild bundler for Jotty.
 *
 * src/background/service-worker.js -> extension/background.js   (ESM worker)
 * src/content/content.js           -> extension/content.js      (IIFE, isolated world)
 * src/popup|options|reflection|focus-> extension/*.js           (IIFE page controllers)
 * src/ui/theme.css                 -> extension/theme.css
 * src/demo/engine.js               -> docs/assets/engine.js     (same judge, used by the site demo)
 */

import * as esbuild from "esbuild";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(fileURLToPath(import.meta.url));
const extDir = resolve(rootDir, "extension");
const docsAssets = resolve(rootDir, "docs/assets");

await mkdir(extDir, { recursive: true });
await mkdir(docsAssets, { recursive: true });

const shared = {
  bundle: true,
  target: ["chrome116"],
  charset: "utf8",
  legalComments: "none",
  logLevel: "warning",
};

await Promise.all([
  esbuild.build({
    ...shared,
    entryPoints: [resolve(rootDir, "src/background/service-worker.js")],
    outfile: resolve(extDir, "background.js"),
    format: "esm",
  }),
  esbuild.build({
    ...shared,
    entryPoints: [resolve(rootDir, "src/content/content.js")],
    outfile: resolve(extDir, "content.js"),
    format: "iife",
  }),
  esbuild.build({
    ...shared,
    entryPoints: [resolve(rootDir, "src/popup/popup.js")],
    outfile: resolve(extDir, "popup.js"),
    format: "iife",
  }),
  esbuild.build({
    ...shared,
    entryPoints: [resolve(rootDir, "src/options/options.js")],
    outfile: resolve(extDir, "options.js"),
    format: "iife",
  }),
  esbuild.build({
    ...shared,
    entryPoints: [resolve(rootDir, "src/reflection/reflection.js")],
    outfile: resolve(extDir, "reflection.js"),
    format: "iife",
  }),
  esbuild.build({
    ...shared,
    entryPoints: [resolve(rootDir, "src/focus/focus.js")],
    outfile: resolve(extDir, "focus.js"),
    format: "iife",
  }),
  esbuild.build({
    ...shared,
    entryPoints: [resolve(rootDir, "src/demo/engine.js")],
    outfile: resolve(docsAssets, "engine.js"),
    format: "iife",
    globalName: "JottyEngine",
  }),
]);

await copyFile(resolve(rootDir, "src/ui/theme.css"), resolve(extDir, "theme.css"));

const manifest = JSON.parse(await readFile(resolve(rootDir, "extension/manifest.json"), "utf8"));
const pkg = JSON.parse(await readFile(resolve(rootDir, "package.json"), "utf8"));
if (manifest.version !== pkg.version) {
  throw new Error(`Version mismatch: manifest ${manifest.version}, package ${pkg.version}`);
}

const sizes = [
  ["extension/background.js", "service worker"],
  ["extension/content.js", "content script"],
  ["extension/popup.js", "popup"],
  ["extension/options.js", "options"],
  ["extension/reflection.js", "reflection"],
  ["extension/focus.js", "focus player"],
  ["docs/assets/engine.js", "demo engine"],
];

const lines = [];
for (const [file, label] of sizes) {
  const stats = await readFile(resolve(rootDir, file));
  lines.push(`${label.padEnd(16)} ${(stats.byteLength / 1024).toFixed(1)} kB`);
}
const summary = `Jotty build complete (v${manifest.version})\n${lines.join("\n")}\n`;
await writeFile(resolve(rootDir, "extension/BUILD.txt"), summary);
console.log(summary);
