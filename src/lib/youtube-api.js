/**
 * Thin YouTube Data API v3 client. The key is passed in by the service worker;
 * this module never touches storage, so it can be tested without chrome.
 */

import {
  applyVideoDetails,
  buildChannelUrl,
  buildSearchUrl,
  buildVideoStatsUrl,
  describeApiError,
  parseSearchResponse,
} from "./focus.js";

const TIMEOUT_MS = 12000;

async function request(url, key) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const target = new URL(url);
    target.searchParams.set("key", key);
    const response = await fetch(target.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    const text = await response.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }
    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: describeApiError(response.status, json),
        reason: json?.error?.errors?.[0]?.reason || "",
      };
    }
    return { ok: true, json };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error:
        error?.name === "AbortError"
          ? "YouTube took too long to answer. Try again."
          : "No connection to YouTube. Check the network and try again.",
      reason: "network",
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function searchVideos({ query, key, maxResults = 18 }) {
  const response = await request(buildSearchUrl({ query, maxResults }), key);
  if (!response.ok) return response;
  return { ok: true, videos: parseSearchResponse(response.json) };
}

export async function attachVideoDetails({ videos, key }) {
  if (!videos.length) return { ok: true, videos };
  const ids = videos.map((video) => video.id);
  const response = await request(buildVideoStatsUrl(ids), key);
  if (!response.ok) return { ok: true, videos, warning: response.error };
  return { ok: true, videos: applyVideoDetails(videos, response.json) };
}

/** Channel lookup by handle. One unit each, batched up to 10 handles per call. */
export async function lookupChannel({ handle, key }) {
  const response = await request(buildChannelUrl([handle]), key);
  if (!response.ok) return response;
  const item = response.json?.items?.[0];
  return {
    ok: true,
    channel: item
      ? {
          id: item.id,
          title: item.snippet?.title || handle,
          handle,
        }
      : null,
  };
}

/** A cheap validity check: one channel lookup costs a single unit. */
export async function testKey(key) {
  const response = await request(buildChannelUrl(["@khanacademy"]), key);
  if (!response.ok) return response;
  const name = response.json?.items?.[0]?.snippet?.title || "Khan Academy";
  return { ok: true, message: `The key works. It answered with ${name}.`, cost: 1 };
}
