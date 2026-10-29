/**
 * Mounts the built React landing page in jsdom and checks that it renders and
 * that the demo controller binds. The bundles under docs/ are committed, so
 * this runs without a build step.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("the React landing page mounts and the demos bind", async () => {
  for (const file of ["docs/index.html", "docs/assets/engine.js", "docs/app.js"]) {
    assert.ok(fs.existsSync(path.join(root, file)), `${file} is missing`);
  }

  const dom = new JSDOM(read("docs/index.html"), {
    runScripts: "outside-only",
    pretendToBeVisual: true,
    url: "http://localhost:4173/",
  });
  const { window } = dom;

  window.matchMedia =
    window.matchMedia ||
    (() => ({
      matches: false,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
    }));
  window.ResizeObserver =
    window.ResizeObserver ||
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  window.requestAnimationFrame = (callback) => setTimeout(() => callback(Date.now()), 0);
  window.cancelAnimationFrame = (id) => clearTimeout(id);

  const errors = [];
  window.addEventListener("error", (event) => errors.push(event.error || event.message));
  window.console.error = (...args) => errors.push(args.join(" "));

  window.eval(read("docs/assets/engine.js"));
  window.eval(read("docs/app.js"));

  await new Promise((resolve) => setTimeout(resolve, 350));

  const document = window.document;
  assert.equal(document.body.classList.contains("app-mounted"), true);
  assert.equal(document.querySelectorAll("main section").length, 10);
  assert.match(document.querySelector("h1").textContent, /A study coach for the moment you drift\./);
  assert.match(document.getElementById("demo-score").textContent, /^\d+% confidence$/);
  assert.equal(document.querySelectorAll(".faq-trigger").length, 7);
  assert.equal(document.querySelectorAll("#reflection-questions fieldset").length, 3);

  document.querySelector('[data-demo-page="tokyo"]').click();
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.equal(document.getElementById("demo-verdict").dataset.verdict, "off-task");

  const trigger = document.querySelector(".faq-trigger");
  trigger.click();
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.equal(trigger.getAttribute("data-state"), "open");

  assert.deepEqual(errors, []);
});
