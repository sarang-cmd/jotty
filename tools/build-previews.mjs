/**
 * Renders the interface previews used in the README, the store listing and the
 * social card. These are vector compositions built from the same palette and
 * type as the shipped extension, then rasterised with resvg. They are labelled
 * as previews on the website and in the README.
 */

import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fontDir = path.join(root, "node_modules/@fontsource");
const read = (file) => fs.readFileSync(file);
const fonts = [
  { name: "Jotty Sans", data: read(path.join(fontDir, "public-sans/files/public-sans-latin-400-normal.woff")), weight: 400, style: "normal" },
  { name: "Jotty Sans", data: read(path.join(fontDir, "public-sans/files/public-sans-latin-500-normal.woff")), weight: 500, style: "normal" },
  { name: "Jotty Sans", data: read(path.join(fontDir, "public-sans/files/public-sans-latin-600-normal.woff")), weight: 600, style: "normal" },
  { name: "Jotty Serif", data: read(path.join(fontDir, "instrument-serif/files/instrument-serif-latin-400-normal.woff")), weight: 400, style: "normal" },
  { name: "Jotty Mono", data: read(path.join(fontDir, "ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff")), weight: 400, style: "normal" },
  { name: "Jotty Mono", data: read(path.join(fontDir, "ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff")), weight: 500, style: "normal" },
];

const C = {
  paper: "#f4f1ea",
  raised: "#fbf9f4",
  sunken: "#ece7dc",
  ink: "#1b221d",
  soft: "#39443c",
  muted: "#5c675f",
  line: "#d8d1c3",
  lineStrong: "#bdb4a2",
  sage: "#afc6a6",
  sageSoft: "#e5ecde",
  sageDeep: "#6f8d6a",
  moss: "#47624b",
  clay: "#97593a",
  claySoft: "#f2e2d7",
  amber: "#8f6a24",
  amberSoft: "#f3ead5",
};

const sans = "Jotty Sans";
const serif = "Jotty Serif";
const mono = "Jotty Mono";

const logoData = `data:image/png;base64,${read(path.join(root, "docs/assets/mascot-512.png")).toString("base64")}`;
const iconData = `data:image/png;base64,${read(path.join(root, "docs/assets/icon-128.png")).toString("base64")}`;

const h = (type, style, children) => ({ type, props: { style, children } });
const box = (style, children) => h("div", style, children);
const img = (src, width, height, style = {}) => ({ type: "img", props: { src, width, height, style } });
const t = (content, style = {}) => h("div", style, content);

function wordmark(size = 20, color = C.ink) {
  return box({ display: "flex", alignItems: "center", gap: 8 }, [
    img(iconData, size + 4, size + 4, { borderRadius: 3 }),
    t("Jotty", { fontFamily: serif, fontSize: size, color, lineHeight: 1 }),
  ]);
}

function chip(label, tone = "plain") {
  const style = {
    display: "flex",
    alignItems: "center",
    border: `1px solid ${C.line}`,
    borderRadius: 999,
    padding: "3px 10px",
    fontFamily: sans,
    fontSize: 11,
    color: C.soft,
    background: C.raised,
    whiteSpace: "nowrap",
  };
  if (tone === "sage") Object.assign(style, { background: C.sageSoft, borderColor: "#c9d6c0", color: "#3d523c" });
  if (tone === "clay") Object.assign(style, { background: C.claySoft, borderColor: "#dcbfaa", color: "#6f4028" });
  if (tone === "amber") Object.assign(style, { background: C.amberSoft, borderColor: "#dcc9a1", color: "#674c19" });
  return t(label, style);
}

function button(label, primary = false, small = false) {
  return t(label, {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: sans,
    fontSize: small ? 12 : 13,
    fontWeight: 500,
    color: primary ? C.raised : C.ink,
    background: primary ? C.ink : "transparent",
    border: `1px solid ${primary ? C.ink : C.lineStrong}`,
    borderRadius: 4,
    padding: small ? "5px 11px" : "8px 14px",
    lineHeight: 1.2,
  });
}

function skeleton(width, height = 12, color = C.sunken) {
  return box({ width, height, background: color, borderRadius: 2 });
}

function browserBar(url, right = "Jotty") {
  return box(
    {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "10px 16px",
      borderBottom: `1px solid ${C.line}`,
      background: C.raised,
    },
    [
      box({ display: "flex", alignItems: "center", gap: 10 }, [
        box({ display: "flex", gap: 4 }, [0, 1, 2].map(() => box({ width: 7, height: 7, borderRadius: 999, background: C.line }))),
        t(url, { fontFamily: mono, fontSize: 11, color: C.muted }),
      ]),
      t(right, { fontFamily: sans, fontSize: 11, color: C.muted }),
    ]
  );
}

async function renderTree(tree, width, height, out) {
  const svg = await satori(tree, { width, height, fonts, embedFont: true });
  const png = new Resvg(svg, { fitTo: { mode: "width", value: width } }).render().asPng();
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, png);
  console.log(`wrote ${path.relative(root, out)} (${width}x${height})`);
}

/* ---------------------------------------------------------------- popup */

function popupTree() {
  return box(
    { display: "flex", flexDirection: "column", width: 400, height: 520, background: C.paper, fontFamily: sans },
    [
      box(
        { display: "flex", flexDirection: "column", padding: "14px 16px 10px", borderBottom: `1px solid ${C.line}` },
        [
          box({ display: "flex", alignItems: "center", justifyContent: "space-between" }, [
            wordmark(21),
            box({ display: "flex", alignItems: "center", gap: 5 }, [
              box({ width: 6, height: 6, borderRadius: 999, background: C.sageDeep }),
              t("Focus session", { fontSize: 10.5, color: C.muted }),
            ]),
          ]),
        ]
      ),
      box({ display: "flex", flexDirection: "column", padding: 16, flex: 1 }, [
        box({ display: "flex", gap: 6, marginBottom: 12 }, [chip("Chemistry", "sage"), chip("Due tomorrow")]),
        t("Gas stoichiometry, chapter 9", { fontFamily: serif, fontSize: 25, lineHeight: 1.15, marginBottom: 12 }),
        t("41:12", { fontFamily: mono, fontSize: 36, lineHeight: 1, letterSpacing: "-0.02em" }),
        box({ display: "flex", height: 4, background: C.sunken, borderRadius: 2, marginTop: 10, marginBottom: 6 }, [
          box({ display: "flex", width: "18%", height: 4, background: C.moss, borderRadius: 2 }),
        ]),
        t("18% of the session done.", { fontSize: 12, color: C.muted, marginBottom: 14 }),
        box({ display: "flex", border: `1px solid ${C.line}`, borderRadius: 4, overflow: "hidden" }, [
          box({ display: "flex", flexDirection: "column", gap: 2, padding: "10px 12px", width: "50%", background: C.raised }, [
            t("On task today", { fontSize: 10.5, color: C.muted }),
            t("78%", { fontSize: 15, fontWeight: 500 }),
          ]),
          box({ display: "flex", flexDirection: "column", gap: 2, padding: "10px 12px", width: "50%", background: C.raised, borderLeft: `1px solid ${C.line}` }, [
            t("Recorded", { fontSize: 10.5, color: C.muted }),
            t("1 h 22 min", { fontSize: 15, fontWeight: 500 }),
          ]),
        ]),
        t("Most drift today: youtube.com (19 min).", { fontSize: 12, color: C.muted, marginTop: 10 }),
        box({ display: "flex", gap: 8, marginTop: 16 }, [button("Focus Player", true, true), button("Pause", false, true), button("End", false, true)]),
        box({ display: "flex", flexDirection: "column", borderLeft: `2px solid ${C.sageDeep}`, paddingLeft: 12, marginTop: 18 }, [
          t("2 pages from Tuesday still need an answer. Open the morning questions.", { fontSize: 12, color: C.soft, lineHeight: 1.5 }),
        ]),
      ]),
      box(
        { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", borderTop: `1px solid ${C.line}`, fontSize: 10.5, color: C.muted },
        [t("Settings"), t("Stays on this device")]
      ),
    ]
  );
}

/* ---------------------------------------------------------------- nudge */

function nudgeTree() {
  return box(
    { display: "flex", flexDirection: "column", width: 1200, height: 660, background: "#e9e5dc", fontFamily: sans },
    [
      browserBar("https://www.youtube.com/watch?v=teflon", "Example page"),
      box({ display: "flex", gap: 28, padding: 28, flex: 1 }, [
        // video column
        box({ display: "flex", flexDirection: "column", width: 760, gap: 14 }, [
          box(
            {
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: 400,
              background: "#232b23",
              borderRadius: 6,
              gap: 10,
            },
            [
              t("Chemistry · Chapter 9", { fontFamily: mono, fontSize: 11, color: "#b9c7b4", letterSpacing: "0.08em" }),
              t("The chemistry of Teflon", { fontFamily: serif, fontSize: 34, color: "#f4f1ea" }),
              t("Tyler DeWitt", { fontSize: 12, color: "#aebbac" }),
            ]
          ),
          t("The chemistry of Teflon and nonstick pans", { fontSize: 19, fontWeight: 500, color: C.ink }),
          box({ display: "flex", gap: 8 }, [chip("youtube.com"), chip("Tyler DeWitt"), chip("12:04")]),
        ]),
        // sidebar placeholder
        box({ display: "flex", flexDirection: "column", gap: 10, width: 320 }, [
          t("Up next", { fontSize: 10.5, color: C.muted, letterSpacing: "0.06em" }),
          ...[0, 1, 2].map(() =>
            box({ display: "flex", gap: 8 }, [
              box({ width: 96, height: 54, background: "#dcd6c9", borderRadius: 3 }),
              box({ display: "flex", flexDirection: "column", gap: 6, width: 200 }, [
                skeleton("100%", 10, "#d6cfc1"),
                skeleton("72%", 10, "#d6cfc1"),
              ]),
            ])
          ),
        ]),
      ]),
      // toast
      box(
        {
          display: "flex",
          position: "absolute",
          left: 1200 - 352 - 20,
          top: 660 - 232 - 20,
          width: 352,
          padding: "13px 12px 12px 13px",
          gap: 10,
          background: C.raised,
          border: `1px solid ${C.line}`,
          borderRadius: 6,
          boxShadow: "0 18px 40px -26px rgba(20,26,21,0.55)",
        },
        [
          img(iconData, 38, 38, { borderRadius: 4 }),
          box({ display: "flex", flexDirection: "column", gap: 4, width: 268 }, [
            box({ display: "flex", alignItems: "center", gap: 5 }, [
              box({ width: 5, height: 5, borderRadius: 999, background: C.amber }),
              t("RELATED, OFF TASK · YOUTUBE.COM", { fontSize: 9.5, letterSpacing: "0.06em", color: C.muted }),
            ]),
            t("This is the subject, not the assignment.", { fontFamily: serif, fontSize: 19, lineHeight: 1.2, marginBottom: 2 }),
            t("It is chemistry, but about polymers rather than gas laws.", { fontSize: 11.5, color: C.soft, lineHeight: 1.4 }),
            box({ display: "flex", gap: 6, marginTop: 4 }, [button("Back to task", true, true), button("Snooze", false, true), t("This helps", { fontSize: 11.5, color: C.muted, padding: "6px 4px", textDecoration: "underline" })]),
          ]),
        ]
      ),
    ]
  );
}

/* ---------------------------------------------------------------- reflection */

function questionBlock(prompt, detail, options, selected = -1) {
  return box({ display: "flex", flexDirection: "column", gap: 8, marginBottom: 22 }, [
    t("QUESTION", { fontFamily: mono, fontSize: 10, color: C.muted, letterSpacing: "0.06em" }),
    t(prompt, { fontFamily: serif, fontSize: 22, lineHeight: 1.25 }),
    t(detail, { fontSize: 12, color: C.muted, lineHeight: 1.45 }),
    box({ display: "flex", gap: 6, flexWrap: "wrap" }, options.map((label, index) => t(label, {
      border: `1px solid ${index === selected ? C.moss : C.line}`,
      background: index === selected ? C.sageSoft : C.raised,
      borderRadius: 999,
      padding: "6px 11px",
      fontSize: 11.5,
      color: C.soft,
    }))),
  ]);
}

function reflectionTree() {
  return box(
    { display: "flex", flexDirection: "column", width: 1200, height: 780, background: C.paper, fontFamily: sans },
    [
      box(
        { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 40px", borderBottom: `1px solid ${C.line}` },
        [wordmark(22), box({ display: "flex", gap: 20, fontSize: 12, color: C.soft }, [t("Settings"), t("Morning questions"), t("Focus Player")])]
      ),
      box({ display: "flex", flexDirection: "column", padding: "34px 40px", width: 820, gap: 6 }, [
        t("WEDNESDAY, 28 OCTOBER", { fontFamily: mono, fontSize: 11, color: C.muted, letterSpacing: "0.04em" }),
        t("Three questions about yesterday.", { fontFamily: serif, fontSize: 46, lineHeight: 1.05, marginBottom: 8 }),
        t("2 pages yesterday did not belong to \u201cGas stoichiometry, chapter 9\u201d. Three questions, then a plan for next week.", { fontSize: 15, color: C.soft, lineHeight: 1.55, marginBottom: 26, width: 660 }),
        questionBlock(
          "At 16:12 yesterday you were on YouTube, with gas stoichiometry still open. Was that a break you chose?",
          "You were watching \u201c24 hours in Tokyo\u201d.",
          ["I decided to take a break", "I drifted there", "I thought it would help"],
          1
        ),
        questionBlock(
          "What was the last thing you did on the assignment before YouTube?",
          "The trigger matters more than the site. It is the part you can change.",
          ["A recommended video", "A message or notification", "I got stuck and left", "It is where my hands go"],
          0
        ),
        questionBlock(
          "Tuesday around 16:00 is where this keeps happening. What should be different next time?",
          "Pick one. Jotty will set it up before the window opens.",
          ["Put a delay in front of it", "Shorter session, real break", "Search inside Jotty", "Move the phone"],
          0
        ),
        box({ display: "flex", gap: 10, alignItems: "center", marginTop: 4 }, [button("Save and see the plan", true), t("The answers stay in this browser.", { fontSize: 11.5, color: C.muted })]),
      ]),
      box(
        {
          display: "flex",
          flexDirection: "column",
          position: "absolute",
          right: 40,
          top: 190,
          width: 276,
          padding: 18,
          background: C.raised,
          border: `1px solid ${C.line}`,
          borderRadius: 6,
          gap: 8,
        },
        [
          t("THIS WEEK", { fontFamily: mono, fontSize: 10, color: C.muted, letterSpacing: "0.06em" }),
          t("Tuesday 16:00", { fontFamily: serif, fontSize: 24 }),
          t("38 drift minutes, three of the last four Tuesdays.", { fontSize: 12, color: C.muted, lineHeight: 1.5 }),
          box({ height: 1, background: C.line, marginTop: 4, marginBottom: 4 }),
          t("Trusted channel", { fontSize: 10.5, color: C.muted }),
          t("Tyler DeWitt", { fontSize: 13, fontWeight: 500 }),
          t("Session goal", { fontSize: 10.5, color: C.muted, marginTop: 6 }),
          t("60 on-task minutes", { fontSize: 13, fontWeight: 500 }),
        ]
      ),
    ]
  );
}

/* ---------------------------------------------------------------- player */

function resultRow(title, channel, meta, trusted) {
  return box({ display: "flex", gap: 12, padding: 10, border: `1px solid ${C.line}`, borderRadius: 5, background: C.raised }, [
    box({ width: 150, height: 84, background: "#2a322a", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center" }, [
      t("thumbnail", { fontFamily: mono, fontSize: 9, color: "#7f8f7c", letterSpacing: "0.04em" }),
    ]),
    box({ display: "flex", flexDirection: "column", gap: 4, width: 520 }, [
      t(title, { fontSize: 14, fontWeight: 500, lineHeight: 1.3 }),
      box({ display: "flex", gap: 8, alignItems: "center" }, [
        t(channel, { fontSize: 11.5, color: C.muted }),
        trusted ? chip("Your channel", "sage") : null,
        t(meta, { fontFamily: mono, fontSize: 10.5, color: C.muted }),
      ]),
      t("Worked examples with molar volume at STP and limiting reagent practice.", { fontSize: 11.5, color: C.muted }),
      box({ display: "flex", gap: 6, marginTop: 4 }, [button("Play here", true, true), button("Trust this channel", false, true)]),
    ]),
  ]);
}

function playerTree() {
  return box(
    { display: "flex", flexDirection: "column", width: 1280, height: 720, background: C.paper, fontFamily: sans },
    [
      box(
        { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 40px", borderBottom: `1px solid ${C.line}` },
        [wordmark(22), box({ display: "flex", gap: 20, fontSize: 12, color: C.soft }, [t("Settings"), t("Morning questions"), t("Focus Player")])]
      ),
      box({ display: "flex", padding: "30px 40px", gap: 32, flex: 1 }, [
        box({ display: "flex", flexDirection: "column", gap: 16, width: 800 }, [
          t("Search the subject, not the feed.", { fontFamily: serif, fontSize: 40, lineHeight: 1.05 }),
          t("Search gas stoichiometry", { border: `1px solid ${C.lineStrong}`, borderRadius: 4, padding: "10px 12px", fontSize: 13, color: C.muted, background: C.raised, width: 560 }),
          t("Example results. Titles, channels and view counts are filled by the YouTube API at runtime.", { fontSize: 11, color: C.muted }),
          box({ display: "flex", gap: 8, marginBottom: 4 }, [button("gas stoichiometry explained", false, true), button("gas stoichiometry practice problems", false, true), button("Chemistry lesson", false, true)]),
          resultRow("Gas stoichiometry: equations, part 1", "Tyler DeWitt", "views from YouTube", true),
          resultRow("Stoichiometry: limiting reagent practice", "Khan Academy", "views from YouTube", true),
          resultRow("How to solve gas law problems", "Professor Dave Explains", "views from YouTube", false),
        ]),
        box({ display: "flex", flexDirection: "column", gap: 10, width: 300, borderLeft: `1px solid ${C.line}`, paddingLeft: 24 }, [
          t("CURRENT SESSION", { fontFamily: mono, fontSize: 10, color: C.muted, letterSpacing: "0.06em" }),
          t("Gas stoichiometry, chapter 9", { fontFamily: serif, fontSize: 22, lineHeight: 1.2 }),
          t("41:12 left · Chemistry", { fontFamily: mono, fontSize: 11, color: C.muted }),
          box({ height: 1, background: C.line, marginTop: 8, marginBottom: 8 }),
          t("TRUSTED CHANNELS", { fontFamily: mono, fontSize: 10, color: C.muted, letterSpacing: "0.06em" }),
          ...["Khan Academy", "Tyler DeWitt", "Professor Dave Explains", "CrashCourse"].map((name) =>
            box({ display: "flex", alignItems: "center", gap: 6 }, [
              box({ width: 5, height: 5, borderRadius: 999, background: C.sageDeep }),
              t(name, { fontSize: 12, color: C.soft }),
            ])
          ),
          box({ height: 1, background: C.line, marginTop: 8, marginBottom: 8 }),
          t("No sidebar. No comments. No next-up queue.", { fontSize: 11.5, color: C.muted, lineHeight: 1.5 }),
        ]),
      ]),
    ]
  );
}

/* ---------------------------------------------------------------- options */

function settingRow(label, value, hint) {
  return box({ display: "flex", flexDirection: "column", gap: 3, width: 300 }, [
    t(label, { fontSize: 12, fontWeight: 500, color: C.soft }),
    t(value, { border: `1px solid ${C.lineStrong}`, borderRadius: 4, padding: "8px 10px", fontSize: 12, color: C.ink, background: C.raised, whiteSpace: "pre-line", lineHeight: 1.6 }),
    hint ? t(hint, { fontSize: 10.5, color: C.muted }) : null,
  ]);
}

function optionsTree() {
  return box(
    { display: "flex", flexDirection: "column", width: 1280, height: 620, background: C.paper, fontFamily: sans },
    [
      box(
        { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 40px", borderBottom: `1px solid ${C.line}` },
        [wordmark(22), box({ display: "flex", gap: 20, fontSize: 12, color: C.soft }, [t("Settings"), t("Morning questions"), t("Focus Player")])]
      ),
      box({ display: "flex", padding: "30px 40px", gap: 44 }, [
        box({ display: "flex", flexDirection: "column", gap: 4, width: 180 }, [
          ...[["Focus sessions", false], ["Blocking rules", true], ["Nudges", false], ["Morning reflection", false], ["Focus Player", false], ["Your data", false], ["About", false]].map(([label, active]) =>
            t(label, { fontSize: 12, padding: "6px 10px", borderLeft: `2px solid ${active ? C.moss : "transparent"}`, background: active ? C.sunken : "transparent", color: active ? C.ink : C.soft })
          ),
        ]),
        box({ display: "flex", flexDirection: "column", width: 900 }, [
          t("Settings", { fontFamily: serif, fontSize: 42, marginBottom: 6 }),
          t("Jotty has no account and no server. Everything on this page is stored in this browser profile.", { fontSize: 13.5, color: C.soft, marginBottom: 24, width: 620, lineHeight: 1.55 }),
          t("Blocking rules", { fontSize: 16, fontWeight: 600, marginBottom: 4 }),
          t("One domain per line. In normal mode Jotty only delays a listed site when the page looks off task.", { fontSize: 12, color: C.muted, marginBottom: 16, width: 620 }),
          box({ display: "flex", gap: 24, marginBottom: 18 }, [
            settingRow("Sites that interrupt a session", "youtube.com\ninstagram.com\ntiktok.com\nx.com\nreddit.com\nnetflix.com", null),
            settingRow("Sites that are always studying", "khanacademy.org\nchem.libretexts.org\ndocs.google.com\nnotion.so", null),
          ]),
          box({ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }, [
            box({ width: 15, height: 15, border: `1px solid ${C.moss}`, borderRadius: 2, background: C.sageSoft }),
            t("Strict mode: no override on listed sites during a session", { fontSize: 13, color: C.ink }),
          ]),
          box({ display: "flex", gap: 18, marginTop: 8 }, [settingRow("Delay before you can continue", "8 seconds", null), settingRow("Snooze length", "10 minutes", null)]),
          box({ display: "flex", gap: 10, alignItems: "center", marginTop: 22 }, [button("Save blocking rules", true), t("Saved.", { fontSize: 11.5, color: C.moss })]),
        ]),
      ]),
    ]
  );
}

/* ---------------------------------------------------------------- social card */

function bannerTree() {
  return box(
    { display: "flex", width: 1280, height: 640, background: C.paper, fontFamily: sans, padding: 84, gap: 64, alignItems: "center" },
    [
      box({ display: "flex", flexDirection: "column", width: 700 }, [
        box({ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }, [
          img(iconData, 44, 44),
          t("Jotty", { fontFamily: serif, fontSize: 40, lineHeight: 1 }),
        ]),
        t("Your attention leaves the page.", { fontFamily: serif, fontSize: 64, lineHeight: 1.05, letterSpacing: "-0.02em" }),
        t("Jotty notices, and asks about it tomorrow.", { fontFamily: serif, fontSize: 64, lineHeight: 1.05, color: C.moss, letterSpacing: "-0.02em" }),
        t("A local-first study coach for Chrome. No account, no server, MIT licensed.", { fontSize: 18, color: C.soft, marginTop: 26 }),
        t("jotty.vercel.app", { fontFamily: mono, fontSize: 13, color: C.muted, marginTop: 34 }),
      ]),
      img(logoData, 380, 312, { opacity: 0.98 }),
    ]
  );
}

/* ---------------------------------------------------------------- write */

const screenshots = path.join(root, "docs/assets/screenshots");
await renderTree(popupTree(), 400, 520, path.join(screenshots, "01-popup.png"));
await renderTree(nudgeTree(), 1200, 660, path.join(screenshots, "02-nudge.png"));
await renderTree(reflectionTree(), 1200, 780, path.join(screenshots, "03-morning-reflection.png"));
await renderTree(playerTree(), 1280, 720, path.join(screenshots, "04-focus-player.png"));
await renderTree(optionsTree(), 1280, 620, path.join(screenshots, "05-settings.png"));
await renderTree(bannerTree(), 1280, 640, path.join(root, "docs/assets/banner-social-1280x640.png"));

/* Store assets: 1280x800 screenshots and a 440x280 promo tile. */

const pngData = (file) => `data:image/png;base64,${fs.readFileSync(file).toString("base64")}`;

/**
 * Chrome Web Store screenshots are 1280x800. The interface previews are wider
 * or shorter than that, so each one sits under a small caption instead of
 * being stretched or cropped.
 */
function storeShot(label, headline, src, nativeWidth, nativeHeight) {
  const maxWidth = 1184;
  const maxHeight = 564;
  const scale = Math.min(maxWidth / nativeWidth, maxHeight / nativeHeight);
  const width = Math.round(nativeWidth * scale);
  const height = Math.round(nativeHeight * scale);

  return box(
    {
      display: "flex",
      flexDirection: "column",
      width: 1280,
      height: 800,
      background: C.paper,
      fontFamily: sans,
      padding: 48,
    },
    [
      box({ display: "flex", alignItems: "center", justifyContent: "space-between" }, [
        t(label, { fontFamily: mono, fontSize: 11, letterSpacing: "0.12em", color: C.muted }),
        t("jotty.vercel.app", { fontFamily: mono, fontSize: 11, color: C.muted }),
      ]),
      t(headline, { fontFamily: serif, fontSize: 34, lineHeight: 1.15, color: C.ink, marginTop: 12 }),
      box(
        {
          display: "flex",
          marginTop: 24,
          width,
          height,
          border: `1px solid ${C.lineStrong}`,
          borderRadius: 6,
          overflow: "hidden",
          background: C.raised,
        },
        [img(pngData(path.join(screenshots, src)), width, height)],
      ),
    ]
  );
}

for (const [label, headline, src, w, h, name] of [
  ["NUDGE  /  YOUTUBE WATCH PAGE", "It tells you what it sees.", "02-nudge.png", 1200, 660, "screenshot-01-nudge.png"],
  ["MORNING REFLECTION", "Three questions about yesterday.", "03-morning-reflection.png", 1200, 780, "screenshot-02-morning-reflection.png"],
  ["FOCUS PLAYER", "Search the subject, not the feed.", "04-focus-player.png", 1280, 720, "screenshot-03-focus-player.png"],
  ["SETTINGS", "Every rule stays on your machine.", "05-settings.png", 1280, 620, "screenshot-04-settings.png"],
]) {
  await renderTree(storeShot(label, headline, src, w, h), 1280, 800, path.join(root, "store-assets", name));
}

const promo = box(
  { display: "flex", width: 440, height: 280, background: C.paper, padding: 24, gap: 14, alignItems: "center" },
  [
    img(logoData, 124, 102),
    box({ display: "flex", flexDirection: "column", width: 254 }, [
      t("Jotty", { fontFamily: serif, fontSize: 38, lineHeight: 1 }),
      t("AI study focus coach", { fontSize: 12.5, color: C.soft, marginTop: 4 }),
      t("Notices when you drift.", { fontFamily: serif, fontSize: 17, lineHeight: 1.25, marginTop: 14 }),
      t("Asks about it tomorrow.", { fontFamily: serif, fontSize: 17, lineHeight: 1.25, marginTop: 2 }),
      t("Local only · No account", { fontFamily: mono, fontSize: 9, color: C.muted, marginTop: 14 }),
    ]),
  ]
);
const promoTree = box({ display: "flex", width: 440, height: 280 }, [promo]);
await renderTree(promoTree, 440, 280, path.join(root, "store-assets/small-promo-440x280.png"));
