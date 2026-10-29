/**
 * Converts the original hand-written landing markup in `tools/landing/source.html`
 * into the React section components under `src/web/landing/`.
 *
 * This is a one-time migration helper, kept in the repo so the markup can be
 * regenerated if the static source is edited. It is not part of `npm run build`.
 */

import { parseFragment } from "parse5";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "tools/landing/source.html"), "utf8");
const body = parseFragment(source);

const ATTRS = {
  class: "className",
  for: "htmlFor",
  tabindex: "tabIndex",
  readonly: "readOnly",
  maxlength: "maxLength",
  minlength: "minLength",
  autocomplete: "autoComplete",
  autofocus: "autoFocus",
  srcset: "srcSet",
  frameborder: "frameBorder",
  allowfullscreen: "allowFullScreen",
  playsinline: "playsInline",
  viewbox: "viewBox",
  preserveaspectratio: "preserveAspectRatio",
  gradientunits: "gradientUnits",
  patternunits: "patternUnits",
  markerwidth: "markerWidth",
  markerheight: "markerHeight",
  refx: "refX",
  refy: "refY",
  "stroke-width": "strokeWidth",
  "stroke-linecap": "strokeLinecap",
  "stroke-linejoin": "strokeLinejoin",
  "stroke-dasharray": "strokeDasharray",
  "stroke-dashoffset": "strokeDashoffset",
  "stroke-opacity": "strokeOpacity",
  "fill-rule": "fillRule",
  "clip-rule": "clipRule",
  "clip-path": "clipPath",
  "font-size": "fontSize",
  "font-family": "fontFamily",
  "font-weight": "fontWeight",
  "text-anchor": "textAnchor",
  "dominant-baseline": "dominantBaseline",
  "letter-spacing": "letterSpacing",
  "stop-color": "stopColor",
  "stop-opacity": "stopOpacity",
  "shape-rendering": "shapeRendering",
  "vector-effect": "vectorEffect",
  "xlink:href": "xlinkHref",
  "xmlns:xlink": "xmlnsXlink",
};

const BOOLEAN = new Set([
  "allowfullscreen",
  "async",
  "autofocus",
  "autoplay",
  "checked",
  "controls",
  "defer",
  "disabled",
  "hidden",
  "loop",
  "multiple",
  "muted",
  "novalidate",
  "open",
  "required",
  "selected",
]);

const RAW_TEXT = new Set(["script", "style", "textarea"]);

function styleObject(value) {
  const parts = value
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const index = part.indexOf(":");
      const prop = part.slice(0, index).trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      const val = part.slice(index + 1).trim();
      return `${prop}: ${JSON.stringify(val)}`;
    });
  return `{{ ${parts.join(", ")} }}`;
}

function escText(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\{/g, "&#123;")
    .replace(/\}/g, "&#125;");
}

function textNode(node) {
  const raw = node.value;
  if (!raw.trim()) return raw.includes("\n") ? "" : " ";
  return escText(raw.replace(/\s+/g, " "));
}

function attrs(node) {
  const out = [];
  for (const attr of node.attrs || []) {
    const name = ATTRS[attr.name] || attr.name;
    if (BOOLEAN.has(attr.name) && (attr.value === "" || attr.value === attr.name)) {
      out.push(name);
    } else if (attr.name === "style") {
      out.push(`style=${styleObject(attr.value)}`);
    } else {
      out.push(`${name}=${JSON.stringify(attr.value)}`);
    }
  }
  return out.length ? " " + out.join(" ") : "";
}

function serialize(node) {
  if (node.nodeName === "#text") return textNode(node);
  if (node.nodeName === "#comment") return `{/* ${node.data.replace(/\*\//g, "* /")} */}`;
  if (!node.tagName) return "";
  const tag = node.tagName;
  if (tag === "noscript") return "";

  const open = `<${tag}${attrs(node)}`;
  if (RAW_TEXT.has(tag)) {
    const raw = (node.childNodes || []).map((child) => child.value || "").join("");
    return `${open}>${raw}</${tag}>`;
  }

  const children = (node.childNodes || []).map(serialize).join("");
  return children ? `${open}>${children}</${tag}>` : `${open} />`;
}

function component(name, nodes) {
  const inner = nodes.map((node) => serialize(node)).filter(Boolean).join("\n      ");
  return `export function ${name}() {\n  return (\n    <>\n${inner}\n    </>\n  );\n}\n`;
}

const bodyChildren = body.childNodes.filter((node) => node.tagName || node.nodeName === "#text");
const skip = bodyChildren.find((node) => node.attrs?.some((a) => a.name === "class" && a.value === "skip-link"));
const header = bodyChildren.find((node) => node.tagName === "header");
const main = bodyChildren.find((node) => node.tagName === "main");
const footer = bodyChildren.find((node) => node.tagName === "footer");

const sections = (main?.childNodes || []).filter((node) => node.tagName === "section");
const out = [];
out.push(`/* Generated from tools/landing/source.html by tools/build-landing-jsx.mjs. */\n`);
out.push(component("Header", [skip, header].filter(Boolean)));

for (const section of sections) {
  const id = section.attrs.find((a) => a.name === "id")?.value || "hero";
  if (id === "faq") continue;
  const name = id.charAt(0).toUpperCase() + id.slice(1) + "Section";
  out.push(component(name, [section]));
}
out.push(component("Footer", [footer].filter(Boolean)));

fs.mkdirSync(path.join(root, "src/web/landing"), { recursive: true });
fs.writeFileSync(path.join(root, "src/web/landing/sections.jsx"), out.join("\n"));
console.log("wrote src/web/landing/sections.jsx");
