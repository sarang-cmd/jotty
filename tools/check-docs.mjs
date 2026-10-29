/**
 * Static checks for the docs site: broken internal links, missing assets,
 * duplicate ids, unlabelled controls, inline scripts, banned typography.
 * Run with `npm run check`.
 */

import { parse } from "parse5";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const docs = path.join(root, "docs");

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function attrs(node) {
  return Object.fromEntries((node.attrs || []).map((attr) => [attr.name, attr.value]));
}

function walkNodes(node, visit) {
  visit(node);
  for (const child of node.childNodes || []) walkNodes(child, visit);
  if (node.content) walkNodes(node.content, visit);
}

const htmlFiles = walk(docs).filter((file) => file.endsWith(".html"));
const errors = [];
const warnings = [];

for (const file of htmlFiles) {
  const rel = path.relative(root, file);
  const html = fs.readFileSync(file, "utf8");
  const doc = parse(html);

  const ids = new Map();
  const anchors = [];
  const assets = [];
  const labels = new Set();
  const controls = [];

  walkNodes(doc, (node) => {
    const tag = node.tagName?.toLowerCase();
    if (!tag) return;
    const a = attrs(node);

    if (tag === "script" && a.src && a.src.startsWith("http")) {
      errors.push(`${rel}: remote script ${a.src}`);
    }
    if (tag === "script" && !a.src && !(a.type === "application/ld+json") && node.childNodes?.length) {
      const text = (node.childNodes || []).map((child) => child.value || "").join("").trim();
      if (text) errors.push(`${rel}: inline script without src`);
    }
    if (a.id) {
      if (ids.has(a.id)) errors.push(`${rel}: duplicate id "${a.id}"`);
      ids.set(a.id, true);
    }
    if (tag === "a" && a.href) {
      if (a.href.startsWith("#")) anchors.push({ href: a.href, rel });
      else if (!/^(https?:|mailto:|tel:)/.test(a.href)) assets.push({ src: a.href.split("#")[0].split("?")[0], rel });
    }
    if (tag === "img" || tag === "link" || tag === "script") {
      const src = a.src || a.href;
      if (src && !/^(https?:|data:|#)/.test(src)) assets.push({ src: src.split("?")[0], rel });
    }
    if (tag === "img" && a.alt === undefined) errors.push(`${rel}: img without alt (${a.src || ""})`);
    if (tag === "label" && a.for) labels.add(a.for);
    if (["input", "select", "textarea"].includes(tag) && a.type !== "hidden") controls.push(a);
    if (tag === "button" && !a.type) warnings.push(`${rel}: button without type ${JSON.stringify(a)}`);
    if (tag === "html" && a.lang !== "en") errors.push(`${rel}: html lang is ${a.lang}`);
    if (tag === "img" && a.loading === undefined && a.src && !a.src.includes("icon")) {
      // not fatal, just a note for large images
      warnings.push(`${rel}: img without loading attribute (${a.src})`);
    }
  });

  for (const { href } of anchors) {
    const id = href.slice(1);
    if (id && !ids.has(id)) errors.push(`${rel}: anchor ${href} has no target`);
  }

  for (const control of controls) {
    if (control.id && labels.has(control.id)) continue;
    if (control["aria-label"] || control["aria-labelledby"]) continue;
    if (control.type === "submit" || control.type === "button") continue;
    errors.push(`${rel}: unlabelled control ${JSON.stringify(control)}`);
  }

  for (const { src, rel: from } of assets) {
    if (!src) continue;
    const target = src.startsWith("/") ? path.join(docs, src) : path.resolve(path.dirname(file), src);
    if (!target.startsWith(docs)) {
      errors.push(`${from}: asset escapes docs/: ${src}`);
      continue;
    }
    if (!fs.existsSync(target)) errors.push(`${from}: missing asset ${src}`);
  }

  // Copy rules from the brief.
  const visible = html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ");
  if (visible.includes("\u2014") || visible.includes("\u2013")) {
    errors.push(`${rel}: em dash or en dash in visible copy`);
  }
  for (const word of ["seamless", "supercharge", "unlock", "effortless", "revolutionize", "game-changer"]) {
    if (new RegExp(`\\b${word}`, "i").test(visible)) errors.push(`${rel}: generic marketing word "${word}"`);
  }
}

const css = fs.readFileSync(path.join(docs, "styles.css"), "utf8");
for (const font of ["Inter", "Geist", "Space Grotesk", "lucide"]) {
  if (new RegExp(`\\b${font}\\b`, "i").test(css)) errors.push(`styles.css references banned font/icon "${font}"`);
}
if (/radial-gradient/.test(css)) errors.push("styles.css uses a radial gradient");
if (/backdrop-filter/.test(css)) errors.push("styles.css uses backdrop-filter (glass effect)");

const required = [
  "docs/index.html",
  "docs/privacy-policy.html",
  "docs/terms.html",
  "docs/guides/index.html",
  "docs/font-licenses.html",
  "docs/assets/engine.js",
  "docs/assets/logo.svg",
  "docs/assets/icon-48.png",
  "docs/assets/banner-social-1280x640.png",
  "docs/releases/jotty-v1.0.0.zip",
  "docs/sitemap.xml",
  "docs/robots.txt",
  "docs/site.webmanifest",
  "docs/404.html",
];
for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) errors.push(`missing required file ${file}`);
}

console.log(`Checked ${htmlFiles.length} HTML files.`);
if (warnings.length) {
  console.log(`\n${warnings.length} warnings:`);
  for (const warning of warnings) console.log(`  - ${warning}`);
}
if (errors.length) {
  console.log(`\n${errors.length} errors:`);
  for (const error of errors) console.log(`  - ${error}`);
  process.exitCode = 1;
} else {
  console.log("No errors.");
}
