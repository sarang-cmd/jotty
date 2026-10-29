/**
 * Rasterises the brand marks and writes the static badge set.
 * Run with `npm run assets`. Requires the dev dependencies only.
 */

import { Resvg } from "@resvg/resvg-js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const icon = fs.readFileSync(path.join(root, "docs/assets/icon.svg"), "utf8");

function render(svg, width, background) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: width },
    background,
    font: { loadSystemFonts: false },
  });
  return resvg.render().asPng();
}

function write(file, buffer) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, buffer);
  console.log(`wrote ${path.relative(root, file)} (${buffer.length} bytes)`);
}

/* Extension and web icons: transparent, simplified face. */
for (const size of [16, 32, 48, 128]) {
  write(path.join(root, `extension/icons/icon${size}.png`), render(icon, size));
  write(path.join(root, `docs/assets/icon-${size}.png`), render(icon, size));
}
const touch = render(icon, 180, "#f4f1ea");
write(path.join(root, "docs/assets/apple-touch-icon.png"), touch);
write(path.join(root, "docs/apple-touch-icon.png"), touch);
write(path.join(root, "extension/icons/icon128.png"), render(icon, 128));

/* The illustrated mascot is a painted raster; see tools/build-mascot.mjs. */

/* Favicons. */
for (const size of [48, 96, 144, 192, 512]) {
  write(path.join(root, `docs/favicon-${size}x${size}.png`), render(icon, size));
}
write(path.join(root, "docs/favicon.ico"), buildIco([16, 32, 48]));

function buildIco(sizes) {
  const images = sizes.map((size) => ({ size, png: render(icon, size) }));
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  const entries = [];
  let offset = 6 + 16 * images.length;
  for (const image of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(image.size >= 256 ? 0 : image.size, 0);
    entry.writeUInt8(image.size >= 256 ? 0 : image.size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(image.png.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += image.png.length;
    entries.push(entry);
  }
  return Buffer.concat([header, ...entries, ...images.map((image) => image.png)]);
}

/* Badges, drawn in the same warm palette as the site. */
const badges = {
  "website.svg": ["website", "jotty-five.vercel.app"],
  "manifest-v3.svg": ["chrome", "manifest v3"],
  "local-first.svg": ["storage", "on this device"],
  "telemetry.svg": ["telemetry", "none"],
  "tests.svg": ["tests", "66 passing"],
  "license.svg": ["license", "MIT"],
};

for (const [name, [label, value]] of Object.entries(badges)) {
  const width = 82 + value.length * 6.6;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width.toFixed(0)}" height="22" role="img" aria-label="${label}: ${value}">
  <title>${label}: ${value}</title>
  <rect x="0.5" y="0.5" width="${(width - 1).toFixed(0)}" height="21" rx="3" fill="#fbf9f4" stroke="#d8d1c3"/>
  <text x="8" y="15" font-family="Verdana,DejaVu Sans,sans-serif" font-size="10" fill="#68736a">${label}</text>
  <text x="${width - 7}" y="15" text-anchor="end" font-family="Verdana,DejaVu Sans,sans-serif" font-size="10" font-weight="bold" fill="#47624b">${value}</text>
</svg>`;
  write(path.join(root, `docs/assets/badges/${name}`), Buffer.from(svg, "utf8"));
}

/* Keep the store icon in sync. */
write(path.join(root, "store-assets/store-icon-128.png"), render(icon, 128));
