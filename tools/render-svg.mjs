import { Resvg } from "@resvg/resvg-js";
import fs from "node:fs";
const [,, src, out, w, bg] = process.argv;
const svg = fs.readFileSync(src, "utf8");
const r = new Resvg(svg, { fitTo: { mode: "width", value: Number(w) }, background: bg || undefined });
fs.writeFileSync(out, r.render().asPng());
console.log(out, r.render().width);
