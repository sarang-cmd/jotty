/**
 * Rasters the illustrated mascot for the README, the social card, the promo
 * tile and the 404 page.
 *
 * The source is a painted illustration, not an SVG. It is stored at
 * `assets/brand/mascot.png`, already composited onto the paper colour so it
 * sits on the site with no visible rectangle. This script only resizes it.
 */

import { Resvg } from "@resvg/resvg-js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "assets/brand/mascot.png"));
const data = source.toString("base64");

const PNG_SIGNATURE = source.subarray(0, 8).toString("hex");
if (PNG_SIGNATURE !== "89504e470d0a1a0a") {
  throw new Error("assets/brand/mascot.png is not a PNG");
}
const width = source.readUInt32BE(16);
const height = source.readUInt32BE(20);
const ratio = height / width;

function write(file, buffer) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, buffer);
  console.log(`wrote ${path.relative(root, file)} (${buffer.length} bytes)`);
}

for (const target of [512, 256]) {
  const h = Math.round(target * ratio);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${target}" height="${h}" viewBox="0 0 ${target} ${h}"><image href="data:image/png;base64,${data}" x="0" y="0" width="${target}" height="${h}"/></svg>`;
  const png = new Resvg(svg, { fitTo: { mode: "width", value: target } }).render().asPng();
  write(path.join(root, `docs/assets/mascot-${target}.png`), png);
}

console.log(`mascot aspect ${width}x${height}, ratio ${ratio.toFixed(4)}`);
