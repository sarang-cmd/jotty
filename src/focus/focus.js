/**
 * Focus Player page controller. Search is performed in the service worker so
 * the API key never enters this document. Playback uses the no-cookie embed.
 */

import { SUBJECT_OPTIONS, CURATED_CHANNELS } from "../config/subjects.js";
import { formatViews, playerUrl, rankResults, searchQueries } from "../lib/focus.js";
import { formatCountdown, remainingSeconds } from "../lib/session.js";

const $ = (id) => document.getElementById(id);
let state = null;
let videos = [];
let playing = null;
let lastQuery = "";
let countdownTimer = null;

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value == null || value === false) continue;
    if (key === "class") node.className = value;
    else if (key === "text") node.textContent = value;
    else if (key.startsWith("on")) node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, value === true ? "" : String(value));
  }
  for (const child of [].concat(children)) {
    if (child == null || child === false) continue;
    node.append(typeof child === "string" ? document.createTextNode(child) : child);
  }
  return node;
}

function send(type, payload = {}) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ ns: "jotty", type, ...payload }, (response) => {
      if (chrome.runtime.lastError) {
        resolve({ ok: false, error: chrome.runtime.lastError.message });
        return;
      }
      resolve(response || { ok: false, error: "No response" });
    });
  });
}

function durationLabel(seconds) {
  if (!seconds) return "";
  const total = Math.round(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function renderSession() {
  const session = state?.session;
  const task = $("session-task");
  if (session && session.status !== "ended") {
    task.textContent = session.task;
    $("session-aside").append(
      Object.assign(document.createElement("span"), {
        className: "chip chip--calm",
        textContent: `${formatCountdown(remainingSeconds(session))} left`,
        id: "player-countdown",
      })
    );
    clearInterval(countdownTimer);
    countdownTimer = setInterval(() => {
      const node = document.getElementById("player-countdown");
      if (!node || !state?.session) return;
      node.textContent = `${formatCountdown(remainingSeconds(state.session))} left`;
    }, 1000);
  } else {
    task.textContent = "No session is running. Videos still play, but nothing is being judged.";
  }
}

function renderSubjects() {
  const select = $("player-subject");
  select.replaceChildren(
    ...SUBJECT_OPTIONS.map((subject) => {
      const option = document.createElement("option");
      option.value = subject;
      option.textContent = subject;
      if (subject === (state?.settings?.subject || "Chemistry")) option.selected = true;
      return option;
    })
  );
}

function renderSuggestions() {
  const wrap = $("suggestions");
  wrap.replaceChildren();
  const task = state?.session?.task || "";
  const subject = $("player-subject").value;
  const queries = searchQueries({ task, subject });
  const unique = queries.slice(0, 3);
  for (const query of unique) {
    const button = el(
      "button",
      {
        class: "btn btn-sm",
        type: "button",
        onclick: () => {
          $("query").value = query;
          runSearch(query);
        },
      },
      query
    );
    wrap.append(button);
  }
}

function skeletonList() {
  const items = Array.from({ length: 4 }, () =>
    el("li", { class: "result" }, [
      el("div", { class: "result-thumb skeleton" }),
      el("div", { class: "result-body" }, [
        el("div", { class: "skeleton", style: "width: 80%; height: 16px" }),
        el("div", { class: "skeleton", style: "width: 46%; height: 12px" }),
        el("div", { class: "skeleton", style: "width: 60%; height: 12px" }),
      ]),
    ])
  );
  $("results").replaceChildren(el("ul", { class: "result-list", "aria-label": "Loading results" }, items));
}

function renderNeedsKey() {
  $("results").replaceChildren(
    el("div", { class: "panel", style: "margin-top: 4px" }, [
      el("h2", { text: "Search needs a YouTube API key." }),
      el("p", { class: "lede", style: "font-size: 15px; margin-top: 8px" }, [
        "Jotty uses the official YouTube Data API instead of scraping the YouTube page. That keeps the results legal and the key free: 10,000 units a day covers roughly 99 searches. The key stays in this browser profile.",
      ]),
      el("div", { class: "btn-row", style: "margin-top: 16px" }, [
        el("a", { class: "btn btn-primary", href: "options.html#player" }, "Add a key in settings"),
        el("a", { class: "btn", href: "https://jotty.vercel.app/guides/youtube-data-api-key/", target: "_blank", rel: "noopener" }, "Read the 6-step guide"),
      ]),
      el("p", { class: "note", style: "margin-top: 18px" }, [
        "No key? The category list below still works. Each channel opens on YouTube, where the sidebar exists, so it is a fallback rather than the point of the player.",
      ]),
    ]),
    renderChannelDirectory()
  );
}

function renderChannelDirectory() {
  const subject = $("player-subject").value;
  const channels = (state?.settings?.channelsBySubject?.[subject] || []).map((handle) => {
    const match = (CURATED_CHANNELS[subject] || []).find(
      (channel) => channel.handle.toLowerCase() === handle.toLowerCase()
    );
    return { handle, name: match?.name || handle.replace(/^@/, "") };
  });
  return el("section", { style: "margin-top: 26px" }, [
    el("h2", { style: "font-family: var(--serif); font-size: 22px; margin-bottom: 4px", text: `Channels you trust for ${subject.toLowerCase()}` }),
    el("p", { class: "small muted", style: "margin-bottom: 12px", text: "Tap a channel to copy its handle into the search box." }),
    el(
      "div",
      { class: "btn-row" },
      channels.map((channel) =>
        el(
          "button",
          {
            class: "btn btn-sm",
            type: "button",
            onclick: () => {
              $("query").value = channel.name;
              $("query").focus();
            },
          },
          channel.name
        )
      )
    ),
  ]);
}

function renderResults() {
  if (!videos.length) {
    $("results").replaceChildren(
      el("div", { class: "empty" }, [
        el("h2", { text: "No results for that search." }),
        el("p", { text: "Try the task name without the chapter number, or search for the topic plus \u201cpractice problems\u201d." }),
      ])
    );
    return;
  }

  const list = el(
    "ul",
    { class: "result-list", "aria-label": "Video results" },
    videos.map((video) =>
      el("li", { class: "result" }, [
        el("div", { class: "result-thumb" }, [
          video.thumbnail
            ? el("img", { src: video.thumbnail, alt: "", loading: "lazy", width: "320", height: "180" })
            : el("div", { class: "skeleton", style: "height: 100%" }),
          video.durationSeconds
            ? el("span", { class: "result-duration", text: durationLabel(video.durationSeconds) })
            : null,
        ]),
        el("div", { class: "result-body" }, [
          el(
            "button",
            {
              class: "result-title",
              type: "button",
              onclick: () => play(video),
            },
            video.title
          ),
          el("div", { class: "result-meta" }, [
            el("span", { text: video.channel }),
            video.trusted ? el("span", { class: "chip chip--calm", text: "Your channel" }) : null,
            video.viewCount !== null ? el("span", { text: formatViews(video.viewCount) }) : null,
            video.publishedAt
              ? el("span", { text: new Date(video.publishedAt).toLocaleDateString(undefined, { month: "short", year: "numeric" }) })
              : null,
          ]),
          el(
            "p",
            { class: "small muted", style: "display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden" },
            video.description
          ),
          el("div", { class: "result-actions" }, [
            el("button", { class: "btn btn-sm btn-primary", type: "button", onclick: () => play(video) }, "Play here"),
            el(
              "button",
              {
                class: "btn btn-sm",
                type: "button",
                onclick: async (event) => {
                  const button = event.currentTarget;
                  button.disabled = true;
                  button.textContent = "Added";
                  await send("focus:channel", { handle: video.channel });
                  const response = await send("state:get");
                  if (response.ok) {
                    state = response;
                    $("query").value = lastQuery;
                  }
                },
              },
              "Trust this channel"
            ),
          ]),
        ]),
      ])
    )
  );
  $("results").replaceChildren(
    el("div", { class: "panel-head", style: "margin-bottom: 12px" }, [
      el("h2", { style: "font-family: var(--serif); font-size: 22px; font-weight: 400", text: `${videos.length} videos for \u201c${lastQuery}\u201d` }),
      el("span", { class: "small muted", text: "Your channels first" }),
    ]),
    list
  );
}

function play(video) {
  playing = video;
  $("results-region").classList.add("is-playing");
  const src = playerUrl(video.id);
  const frame = el("iframe", {
    src,
    title: video.title,
    allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
    allowfullscreen: true,
    referrerpolicy: "strict-origin-when-cross-origin",
    loading: "eager",
  });
  const backToTask = el(
    "button",
    {
      class: "btn btn-primary",
      type: "button",
      onclick: async (event) => {
        const button = event.currentTarget;
        const response = await send("session:back");
        if (response.ok && response.url) window.location.href = response.url;
        else {
          button.disabled = true;
          button.textContent = "No task address saved";
        }
      },
    },
    "Back to the assignment"
  );

  $("player-view").classList.remove("hidden");
  $("player-view").replaceChildren(
    el("div", { class: "watch-layout" }, [
      el("div", { class: "player-shell" }, [
        el("div", { class: "player-bar" }, [
          el("span", {}, [el("strong", { text: video.channel })]),
          el("span", { text: "No sidebar, no comments, no next-up" }),
        ]),
        el("div", { class: "player-frame" }, frame),
        el("div", { style: "padding: 14px 16px" }, [
          el("h2", { style: "font-family: var(--serif); font-size: 22px; line-height: 1.2", text: video.title }),
          el("p", { class: "small muted", style: "margin-top: 4px" }, [
            [video.channel, video.viewCount !== null ? formatViews(video.viewCount) : "", video.durationSeconds ? durationLabel(video.durationSeconds) : ""]
              .filter(Boolean)
              .join(" \u00b7 "),
          ]),
        ]),
      ]),
      el("aside", { class: "watch-side" }, [
        el("h2", { text: "The task" }),
        el("p", { text: state?.session?.task || "No session is running." }),
        el("div", { class: "rule", style: "margin: 16px 0" }),
        el("h2", { text: "When this finishes" }),
        el("p", { text: "Close the tab and go back. The player will not suggest another video." }),
        el("div", { class: "btn-row", style: "margin-top: 16px" }, [
          backToTask,
          el("button", { class: "btn btn-ghost", type: "button", onclick: closePlayer }, "Close player"),
        ]),
        el("p", { class: "small muted", style: "margin-top: 18px", text: "Playback uses youtube-nocookie.com. Nothing about this video is sent to Jotty." }),
      ]),
    ])
  );
  $("results").classList.add("hidden");
  $("player-view").scrollIntoView({ behavior: "smooth", block: "start" });
  frame.focus();
}

function closePlayer() {
  playing = null;
  $("player-view").classList.add("hidden");
  $("player-view").replaceChildren();
  $("results").classList.remove("hidden");
  $("search-form").scrollIntoView({ behavior: "smooth", block: "start" });
}

async function runSearch(query) {
  const clean = String(query || "").trim();
  if (!clean) {
    $("query").focus();
    return;
  }
  lastQuery = clean;
  const subject = $("player-subject").value;
  closePlayer();
  skeletonList();
  const response = await send("focus:search", { query: clean, subject });
  if (!response.ok) {
    if (response.needsKey) {
      renderNeedsKey();
      return;
    }
    $("results").replaceChildren(
      el("div", { class: "panel", style: "border-color: #ddcba2" }, [
        el("h2", { text: "The search did not go through." }),
        el("p", { class: "small muted", style: "margin-top: 6px", text: response.error || "Try again in a moment." }),
        el("div", { class: "btn-row", style: "margin-top: 12px" }, [
          el("button", { class: "btn btn-sm", type: "button", onclick: () => runSearch(clean) }, "Try again"),
          el("a", { class: "btn btn-sm", href: "options.html#player" }, "Check the key"),
        ]),
      ])
    );
    return;
  }
  const allowlist = state?.settings?.channelsBySubject?.[subject] || [];
  videos = rankResults(response.videos || [], { allowlist });
  renderResults();
  if (response.quota) {
    $("quota-note").textContent = `This search used about ${response.cost || 101} units. ${response.quota.units.toLocaleString()} of 10,000 used today.`;
  }
}

function wire() {
  $("search-form").addEventListener("submit", (event) => {
    event.preventDefault();
    runSearch($("query").value);
  });
  $("player-subject").addEventListener("change", () => {
    renderSuggestions();
    const subject = $("player-subject").value;
    const first = CURATED_CHANNELS[subject]?.[0]?.handle;
    if (first && state) {
      $("mode-chip").textContent = `${(state.settings.channelsBySubject?.[subject] || []).length} trusted channels`;
    }
  });
}

async function init() {
  const response = await send("state:get");
  if (!response.ok) {
    $("results").replaceChildren(
      el("div", { class: "panel" }, [el("h2", { text: "Jotty could not read its settings." }), el("p", { class: "small muted", text: response.error })])
    );
    return;
  }
  state = response;
  renderSession();
  renderSubjects();
  renderSuggestions();
  wire();
  $("mode-chip").textContent = response.hasKey ? "Your own API key" : "No key yet";
  if (!response.hasKey) {
    renderNeedsKey();
  } else {
    $("results").replaceChildren(
      el("div", { class: "empty" }, [
        el("img", { src: "icons/icon128.png", alt: "", style: "width: 84px" }),
        el("h2", { text: "One search, then the video." }),
        el("p", { text: "Use the task suggestions above or type a topic. Results come from YouTube, playback happens here without the feed." }),
      ])
    );
  }
}

init();
