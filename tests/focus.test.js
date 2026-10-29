import test from "node:test";
import assert from "node:assert/strict";

import {
  searchQueries,
  buildSearchUrl,
  buildVideoStatsUrl,
  parseIsoDuration,
  formatDuration,
  formatViews,
  parseSearchResponse,
  applyVideoDetails,
  rankResults,
  playerUrl,
  estimateQuota,
  describeApiError,
  decodeEntities,
} from "../src/lib/focus.js";

test("search queries start with the task and stay specific", () => {
  const queries = searchQueries({ task: "gas stoichiometry", subject: "Chemistry" });
  assert.equal(queries[0], "gas stoichiometry explained");
  assert.ok(queries.includes("Chemistry lesson"));
  assert.ok(queries.length <= 4);
});

test("search requests ask for embeddable videos only", () => {
  const url = new URL(buildSearchUrl({ query: "gas stoichiometry" }));
  assert.equal(url.hostname, "www.googleapis.com");
  assert.equal(url.searchParams.get("type"), "video");
  assert.equal(url.searchParams.get("videoEmbeddable"), "true");
  assert.equal(url.searchParams.get("safeSearch"), "strict");
  assert.equal(url.searchParams.get("q"), "gas stoichiometry");
});

test("video details are batched into one request", () => {
  const url = new URL(buildVideoStatsUrl(["a", "b", "c"]));
  assert.equal(url.searchParams.get("id"), "a,b,c");
  assert.match(url.searchParams.get("part"), /statistics/);
});

test("ISO 8601 durations become seconds and labels", () => {
  assert.equal(parseIsoDuration("PT12M4S"), 724);
  assert.equal(parseIsoDuration("PT1H2M3S"), 3723);
  assert.equal(formatDuration(724), "12:04");
  assert.equal(formatDuration(3723), "1:02:03");
});

test("view counts are grouped the way people read them", () => {
  assert.equal(formatViews(940), "940 views");
  assert.equal(formatViews(14200), "14K views");
  assert.equal(formatViews(1400000), "1.4M views");
  assert.equal(formatViews(0), "0 views");
  assert.equal(formatViews(null), "");
});

test("search responses are decoded and malformed items dropped", () => {
  const json = {
    items: [
      {
        id: { videoId: "abc" },
        snippet: {
          title: "Gas &amp; Stoichiometry",
          channelTitle: "Tyler DeWitt",
          channelId: "chan1",
          description: "A &quot;lesson&quot;",
          publishedAt: "2024-01-01T00:00:00Z",
          thumbnails: { medium: { url: "https://i.ytimg.com/vi/abc/mqdefault.jpg" } },
        },
      },
      { id: {}, snippet: {} },
    ],
  };
  const videos = parseSearchResponse(json);
  assert.equal(videos.length, 1);
  assert.equal(videos[0].title, "Gas & Stoichiometry");
  assert.equal(decodeEntities(videos[0].description), 'A "lesson"');
});

test("statistics are merged back onto the search results", () => {
  const videos = [{ id: "abc", channel: "Old" }];
  const merged = applyVideoDetails(videos, {
    items: [
      {
        id: "abc",
        snippet: { channelTitle: "New" },
        contentDetails: { duration: "PT10M" },
        statistics: { viewCount: "1200" },
      },
    ],
  });
  assert.equal(merged[0].viewCount, 1200);
  assert.equal(merged[0].durationSeconds, 600);
  assert.equal(merged[0].channel, "New");
});

test("trusted channels come first and shorts are removed", () => {
  const videos = [
    { id: "1", channel: "Random", durationSeconds: 600, viewCount: 900000 },
    { id: "2", channel: "Tyler DeWitt", durationSeconds: 300, viewCount: 1000 },
    { id: "3", channel: "Random", durationSeconds: 30, viewCount: 5000000 },
  ];
  const ranked = rankResults(videos, { allowlist: ["@tylerdewitt"] });
  assert.equal(ranked.length, 2);
  assert.equal(ranked[0].id, "2");
  assert.equal(ranked[0].trusted, true);
});

test("player embeds use the no-cookie host and no related queue", () => {
  const url = new URL(playerUrl("abc_-123"));
  assert.equal(url.hostname, "www.youtube-nocookie.com");
  assert.equal(url.pathname, "/embed/abc_-123");
  assert.equal(url.searchParams.get("rel"), "0");
  assert.equal(url.searchParams.get("modestbranding"), "1");
});

test("player url rejects anything that is not an id", () => {
  const dirty = playerUrl("abc; rm -rf /");
  assert.ok(dirty.startsWith("https://www.youtube-nocookie.com/embed/"));
  assert.equal(dirty.includes(";"), false);
  assert.equal(dirty.includes(" "), false);
  assert.equal(playerUrl(""), "");
});

test("quota estimate matches documented YouTube costs", () => {
  assert.equal(estimateQuota({ resultPages: 1 }), 101);
  assert.equal(estimateQuota({ resultPages: 2, channels: 3 }), 205);
});

test("quota errors are explained in plain language", () => {
  assert.match(
    describeApiError(403, { error: { errors: [{ reason: "quotaExceeded" }] } }),
    /resets at midnight/
  );
  assert.match(describeApiError(400, { error: { errors: [{ reason: "keyInvalid" }] } }), /API key/);
});
