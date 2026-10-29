/**
 * Guard rails for the privacy claims in the README. These are source checks,
 * not runtime checks: if a future change moves the API key, adds a remote
 * script, or ships a telemetry call, this test fails.
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const srcFiles = walk(path.join(root, "src"));
const read = (file) => fs.readFileSync(file, "utf8");

test("only the service worker imports getApiKey", () => {
  const offenders = srcFiles
    .filter((file) => !file.endsWith(path.join("lib", "storage.js")))
    .filter((file) => /import[^;]*\bgetApiKey\b/s.test(read(file)))
    .map((file) => path.relative(root, file));
  assert.deepEqual(offenders, [path.join("src", "background", "service-worker.js")]);
});

test("only the service worker sets the key guard", () => {
  const flagged = srcFiles.filter(
    (file) => /__JOTTY_SERVICE_WORKER__\s*=\s*true/.test(read(file))
  );
  assert.deepEqual(flagged.map((file) => path.relative(root, file)), [
    path.join("src", "background", "service-worker.js"),
  ]);
});

test("content scripts make no network requests", () => {
  const contentFiles = srcFiles.filter((file) => file.includes(`${path.sep}content${path.sep}`));
  assert.ok(contentFiles.length > 0);
  for (const file of contentFiles) {
    const source = read(file);
    assert.equal(/\bfetch\s*\(/.test(source), false, `${file} calls fetch`);
    assert.equal(/XMLHttpRequest/.test(source), false, `${file} uses XHR`);
  }
});

test("the only external API host in source is the YouTube Data API", () => {
  const hosts = new Set();
  for (const file of srcFiles) {
    const source = read(file);
    for (const match of source.matchAll(/https:\/\/([a-z0-9.-]+)/gi)) {
      hosts.add(match[1]);
    }
  }
  const allowed = new Set([
    "www.googleapis.com",
    "www.youtube-nocookie.com",
    "i.ytimg.com",
    "www.youtube.com",
    "youtu.be",
    // The project's own site, used only as a documentation link in the
    // player's empty state. It is never fetched by the extension.
    "jotty.vercel.app",
  ]);
  const unexpected = [...hosts].filter((host) => !allowed.has(host) && !host.endsWith("schema.org"));
  assert.deepEqual(unexpected, []);

  // The project domain may appear as an anchor, never as a request target.
  for (const file of srcFiles) {
    const source = read(file);
    for (const request of source.matchAll(/fetch\s*\(\s*[`"'](https:\/\/[^`"']+)/g)) {
      assert.equal(
        request[1].includes("jotty.vercel.app"),
        false,
        `${file} fetches the project site`,
      );
    }
  }
});

test("the landing page loads no third party scripts", () => {
  const docs = walk(path.join(root, "docs")).filter((file) => file.endsWith(".html"));
  assert.ok(docs.length > 0);
  for (const file of docs) {
    const html = read(file);
    assert.equal(/fonts\.googleapis\.com/.test(html), false, `${file} loads remote fonts`);
    assert.equal(/googletagmanager|google-analytics|plausible\.io|posthog/.test(html), false, `${file} has analytics`);
    const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]);
    for (const src of scripts) {
      assert.ok(src.startsWith("/") || !src.startsWith("http"), `${file} loads remote script ${src}`);
    }
  }
});

test("the manifest keeps host permissions narrow", () => {
  const manifest = JSON.parse(read(path.join(root, "extension", "manifest.json")));
  assert.equal(manifest.manifest_version, 3);
  assert.deepEqual(manifest.host_permissions, ["https://www.googleapis.com/*"]);
  assert.deepEqual([...manifest.permissions].sort(), ["alarms", "notifications", "storage"]);
  assert.equal(manifest.content_scripts.every((entry) => entry.run_at === "document_idle"), true);
  assert.equal(JSON.stringify(manifest).includes("<all_urls>"), true, "content script scope is documented");
});
