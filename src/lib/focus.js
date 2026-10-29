/**
 * Focus Player helpers: YouTube Data API v3 requests, result shaping, and the
 * privacy-enhanced embed. No API key is ever handled here; the service worker
 * owns it and passes only the finished request through.
 */

const API_ROOT = "https://www.googleapis.com/youtube/v3";

/** Documented quota costs, so the UI can be honest about what a search spends. */
export const QUOTA_COST = { search: 100, videos: 1, channels: 1 };
export const DAILY_QUOTA = 10000;

export function searchQueries({ task, subject, base }) {
  const queries = [];
  const cleanTask = String(task || "").replace(/\s+/g, " ").trim();
  const cleanSubject = String(subject || "").trim();
  if (base) queries.push(String(base).trim());
  if (cleanTask) queries.push(`${cleanTask} explained`);
  if (cleanTask) queries.push(`${cleanTask} practice problems`);
  if (cleanSubject && cleanSubject !== "Other") queries.push(`${cleanSubject} lesson`);
  const unique = [];
  for (const query of queries) {
    if (query && !unique.includes(query)) unique.push(query);
  }
  return unique.slice(0, 4);
}

export function buildSearchUrl({ query, pageToken, maxResults = 18 }) {
  const params = new URLSearchParams({
    part: "snippet",
    type: "video",
    maxResults: String(maxResults),
    q: String(query || "").slice(0, 120),
    videoEmbeddable: "true",
    safeSearch: "strict",
    order: "relevance",
    relevanceLanguage: "en",
  });
  if (pageToken) params.set("pageToken", pageToken);
  return `${API_ROOT}/search?${params.toString()}`;
}

export function buildVideoStatsUrl(ids) {
  const list = (Array.isArray(ids) ? ids : []).filter(Boolean).slice(0, 50);
  const params = new URLSearchParams({
    part: "snippet,contentDetails,statistics",
    id: list.join(","),
  });
  return `${API_ROOT}/videos?${params.toString()}`;
}

export function buildChannelUrl(handles) {
  const list = (Array.isArray(handles) ? handles : [])
    .map((handle) => String(handle || "").trim())
    .filter(Boolean)
    .slice(0, 10);
  const params = new URLSearchParams({
    part: "snippet",
    forHandle: list[0] || "",
  });
  return `${API_ROOT}/channels?${params.toString()}`;
}

export function parseIsoDuration(iso) {
  const match = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(String(iso || ""));
  if (!match) return 0;
  const [, d, h, m, s] = match;
  return (Number(d) || 0) * 86400 + (Number(h) || 0) * 3600 + (Number(m) || 0) * 60 + (Number(s) || 0);
}

export function formatDuration(seconds) {
  const total = Math.max(0, Math.round(seconds || 0));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatViews(count) {
  if (count === null || count === undefined || count === "") return "";
  const n = Number(count);
  if (!Number.isFinite(n) || n < 0) return "";
  if (n < 1000) return `${n} views`;
  if (n < 1000000) return `${(n / 1000).toFixed(n < 10000 ? 1 : 0).replace(/\.0$/, "")}K views`;
  if (n < 1000000000) return `${(n / 1000000).toFixed(n < 10000000 ? 1 : 0).replace(/\.0$/, "")}M views`;
  return `${(n / 1000000000).toFixed(1).replace(/\.0$/, "")}B views`;
}

export function parseSearchResponse(json) {
  const items = Array.isArray(json?.items) ? json.items : [];
  return items
    .map((item) => ({
      id: item?.id?.videoId || "",
      title: decodeEntities(item?.snippet?.title || ""),
      channel: decodeEntities(item?.snippet?.channelTitle || ""),
      channelId: item?.snippet?.channelId || "",
      description: decodeEntities(item?.snippet?.description || ""),
      publishedAt: item?.snippet?.publishedAt || "",
      thumbnail:
        item?.snippet?.thumbnails?.medium?.url ||
        item?.snippet?.thumbnails?.default?.url ||
        "",
      viewCount: null,
      durationSeconds: null,
      trusted: false,
    }))
    .filter((video) => video.id);
}

export function applyVideoDetails(videos, json) {
  const details = new Map();
  for (const item of json?.items || []) {
    details.set(item.id, {
      viewCount: Number(item.statistics?.viewCount || 0),
      durationSeconds: parseIsoDuration(item.contentDetails?.duration),
      channel: decodeEntities(item.snippet?.channelTitle || ""),
    });
  }
  return videos.map((video) => {
    const detail = details.get(video.id);
    if (!detail) return video;
    return {
      ...video,
      viewCount: detail.viewCount,
      durationSeconds: detail.durationSeconds,
      channel: detail.channel || video.channel,
    };
  });
}

export function decodeEntities(text) {
  return String(text || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

/**
 * Put channels the student trusts first, then longer videos, then view count.
 * Shorts and clips under 90 seconds are removed: they are not lessons.
 */
function normalizeHandle(value) {
  return String(value || "").toLowerCase().replace(/^@/, "").replace(/[^a-z0-9]/g, "");
}

export function rankResults(videos, options = {}) {
  const allowlist = (options.allowlist || []).map(normalizeHandle).filter(Boolean);
  const minimumSeconds = options.minimumSeconds ?? 90;
  return videos
    .filter((video) => !video.durationSeconds || video.durationSeconds >= minimumSeconds)
    .map((video) => {
      const channel = normalizeHandle(video.channel);
      const trusted = allowlist.some((entry) => entry && (channel === entry || channel.includes(entry)));
      return { ...video, trusted };
    })
    .sort((a, b) => {
      if (a.trusted !== b.trusted) return a.trusted ? -1 : 1;
      return (b.viewCount || 0) - (a.viewCount || 0);
    });
}

/** Privacy-enhanced embed. Related videos are limited to the same channel. */
export function playerUrl(videoId, options = {}) {
  const id = String(videoId || "").replace(/[^A-Za-z0-9_-]/g, "");
  if (!id) return "";
  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
    iv_load_policy: "3",
    fs: options.allowFullscreen === false ? "0" : "1",
  });
  if (options.start) params.set("start", String(Math.max(0, Math.round(options.start))));
  return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
}

export function thumbUrl(video) {
  if (video?.thumbnail) return video.thumbnail;
  if (video?.id) return `https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`;
  return "";
}

/** Quota used by one search + one details call. */
export function estimateQuota({ resultPages = 1, channels = 0 } = {}) {
  return resultPages * (QUOTA_COST.search + QUOTA_COST.videos) + channels * QUOTA_COST.channels;
}

export function quotaMessage(used, total = DAILY_QUOTA) {
  const remaining = Math.max(0, total - used);
  return `${used.toLocaleString()} of ${total.toLocaleString()} units used today. ${remaining.toLocaleString()} left.`;
}

/** Friendly copy for the errors the API actually returns. */
export function describeApiError(status, body) {
  const reason = body?.error?.errors?.[0]?.reason || "";
  if (reason === "quotaExceeded" || reason === "dailyLimitExceeded") {
    return "The YouTube quota for this key is used up for today. It resets at midnight Pacific time.";
  }
  if (reason === "keyInvalid" || status === 400) {
    return "YouTube did not accept this API key. Check that the key is enabled for YouTube Data API v3.";
  }
  if (reason === "ipRefererBlocked" || reason === "forbidden") {
    return "This key is restricted. For an extension, allow requests without an HTTP referrer restriction.";
  }
  if (status === 403) return "YouTube refused the request. The key may not have YouTube Data API v3 enabled.";
  if (status === 429) return "Too many requests. Wait a minute and try again.";
  return "YouTube did not answer. Check your connection and try again.";
}
