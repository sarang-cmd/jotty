import test from "node:test";
import assert from "node:assert/strict";

const store = new Map();

globalThis.chrome = {
  storage: {
    local: {
      async get(key) {
        if (key == null) return Object.fromEntries(store);
        if (typeof key === "string") return store.has(key) ? { [key]: store.get(key) } : {};
        const out = {};
        for (const k of key) if (store.has(k)) out[k] = store.get(k);
        return out;
      },
      async set(items) {
        for (const [key, value] of Object.entries(items)) store.set(key, structuredClone(value));
      },
      async remove(keys) {
        for (const key of Array.isArray(keys) ? keys : [keys]) store.delete(key);
      },
      async clear() {
        store.clear();
      },
    },
  },
};

const storage = await import("../src/lib/storage.js");
const { DEFAULT_BLOCKLIST, STORAGE_KEY } = storage;

test("a fresh install gets sane defaults", async () => {
  store.clear();
  const state = await storage.readState();
  assert.equal(state.settings.enabled, true);
  assert.equal(state.settings.strictMode, false);
  assert.equal(state.settings.subject, "Chemistry");
  assert.ok(state.settings.blocklist.includes("youtube.com"));
  assert.deepEqual(state.settings.blocklist, DEFAULT_BLOCKLIST);
  assert.equal(state.habits.events.length, 0);
});

test("settings patches are normalized, not trusted", async () => {
  store.clear();
  const settings = await storage.saveSettings({
    blockDelaySeconds: 500,
    blocklist: ["https://www.YouTube.com/feed", "youtube.com", "  "],
    sessionMinutes: 2,
    trustedChannels: ["tylerdewitt", "@TylerDeWitt", ""],
  });
  assert.equal(settings.blockDelaySeconds, 30);
  assert.equal(settings.sessionMinutes, 10);
  assert.deepEqual(settings.blocklist, ["youtube.com"]);
  assert.deepEqual(settings.trustedChannels, ["@tylerdewitt"]);
});

test("habits round trip through one versioned object", async () => {
  store.clear();
  const state = await storage.readState();
  state.habits.days["2026-10-27"] = {
    hours: Array.from({ length: 24 }, () => ({ onTask: 0, offTask: 0 })),
    domains: {},
    flagged: 0,
  };
  await storage.writeState(state);
  const stored = store.get(STORAGE_KEY);
  assert.ok(stored.habits.days["2026-10-27"]);
  const again = await storage.readState();
  assert.equal(again.version, 1);
});

test("the API key is stored apart from the state", async () => {
  store.clear();
  await storage.setApiKey("AIzaTESTKEY123456");
  assert.equal(await storage.hasApiKey(), true);
  assert.equal(store.get(STORAGE_KEY), undefined);
  const exported = await storage.exportState();
  assert.equal(JSON.stringify(exported).includes("AIzaTESTKEY123456"), false);
  await storage.clearApiKey();
  assert.equal(await storage.hasApiKey(), false);
});

test("reading the key outside the service worker throws", async () => {
  store.clear();
  await storage.setApiKey("AIzaTESTKEY123456");
  await assert.rejects(() => storage.getApiKey(), /service worker/);
  globalThis.__JOTTY_SERVICE_WORKER__ = true;
  assert.equal(await storage.getApiKey(), "AIzaTESTKEY123456");
  delete globalThis.__JOTTY_SERVICE_WORKER__;
});

test("clearing removes state, key and quota", async () => {
  store.clear();
  await storage.saveSettings({ subject: "Physics" });
  await storage.setApiKey("AIzaTESTKEY123456");
  await storage.addQuota(101);
  await storage.clearAll();
  assert.equal(store.size, 0);
});

test("quota counter resets with the date", async () => {
  store.clear();
  await storage.addQuota(101);
  await storage.addQuota(50);
  const quota = await storage.readQuota();
  assert.equal(quota.units, 151);
  store.set("jotty.quota.v1", { date: "2000-01-01", units: 9000 });
  const reset = await storage.readQuota();
  assert.equal(reset.units, 0);
});

test("keys are masked for display", () => {
  assert.equal(storage.maskKey("AIzaSyABCDEFGH1234"), "AIza\u20261234");
  assert.equal(storage.maskKey(""), "Not set");
});
