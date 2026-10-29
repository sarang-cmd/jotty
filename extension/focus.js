(() => {
  // src/config/subjects.js
  var SUBJECT_OPTIONS = [
    "Chemistry",
    "Biology",
    "Physics",
    "Math",
    "Computer science",
    "History",
    "Economics",
    "Literature",
    "Other"
  ];
  var CURATED_CHANNELS = {
    Chemistry: [
      { handle: "@khanacademy", name: "Khan Academy" },
      { handle: "@TylerDeWitt", name: "Tyler DeWitt" },
      { handle: "@ProfessorDaveExplains", name: "Professor Dave Explains" },
      { handle: "@crashcourse", name: "CrashCourse" },
      { handle: "@TheOrganicChemistryTutor", name: "The Organic Chemistry Tutor" }
    ],
    Biology: [
      { handle: "@khanacademy", name: "Khan Academy" },
      { handle: "@crashcourse", name: "CrashCourse" },
      { handle: "@AmoebaSisters", name: "Amoeba Sisters" },
      { handle: "@BozemanScience", name: "Bozeman Science" }
    ],
    Physics: [
      { handle: "@khanacademy", name: "Khan Academy" },
      { handle: "@PhysicsVideosbyEugeneKhutoryansky", name: "Physics Videos by Eugene Khutoryansky" },
      { handle: "@crashcourse", name: "CrashCourse" },
      { handle: "@MinutePhysics", name: "MinutePhysics" }
    ],
    Math: [
      { handle: "@khanacademy", name: "Khan Academy" },
      { handle: "@3blue1brown", name: "3Blue1Brown" },
      { handle: "@patrickjmt", name: "patrickJMT" },
      { handle: "@Mathantics", name: "Math Antics" }
    ],
    "Computer science": [
      { handle: "@freecodecamp", name: "freeCodeCamp.org" },
      { handle: "@crashcourse", name: "CrashCourse" },
      { handle: "@Computerphile", name: "Computerphile" },
      { handle: "@AbdulBari", name: "Abdul Bari" }
    ],
    History: [
      { handle: "@crashcourse", name: "CrashCourse" },
      { handle: "@khanacademy", name: "Khan Academy" },
      { handle: "@OverSimplified", name: "OverSimplified" },
      { handle: "@TomRichey", name: "Tom Richey" }
    ],
    Economics: [
      { handle: "@crashcourse", name: "CrashCourse" },
      { handle: "@MarginalRevolutionUniversity", name: "Marginal Revolution University" },
      { handle: "@khanacademy", name: "Khan Academy" }
    ],
    Literature: [
      { handle: "@crashcourse", name: "CrashCourse" },
      { handle: "@khanacademy", name: "Khan Academy" },
      { handle: "@ThugNotes", name: "Wisecrack" }
    ],
    Other: [
      { handle: "@khanacademy", name: "Khan Academy" },
      { handle: "@crashcourse", name: "CrashCourse" }
    ]
  };

  // src/lib/focus.js
  function searchQueries({ task, subject, base }) {
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
  function formatViews(count) {
    if (count === null || count === void 0 || count === "") return "";
    const n = Number(count);
    if (!Number.isFinite(n) || n < 0) return "";
    if (n < 1e3) return `${n} views`;
    if (n < 1e6) return `${(n / 1e3).toFixed(n < 1e4 ? 1 : 0).replace(/\.0$/, "")}K views`;
    if (n < 1e9) return `${(n / 1e6).toFixed(n < 1e7 ? 1 : 0).replace(/\.0$/, "")}M views`;
    return `${(n / 1e9).toFixed(1).replace(/\.0$/, "")}B views`;
  }
  function normalizeHandle(value) {
    return String(value || "").toLowerCase().replace(/^@/, "").replace(/[^a-z0-9]/g, "");
  }
  function rankResults(videos2, options = {}) {
    const allowlist = (options.allowlist || []).map(normalizeHandle).filter(Boolean);
    const minimumSeconds = options.minimumSeconds ?? 90;
    return videos2.filter((video) => !video.durationSeconds || video.durationSeconds >= minimumSeconds).map((video) => {
      const channel = normalizeHandle(video.channel);
      const trusted = allowlist.some((entry) => entry && (channel === entry || channel.includes(entry)));
      return { ...video, trusted };
    }).sort((a, b) => {
      if (a.trusted !== b.trusted) return a.trusted ? -1 : 1;
      return (b.viewCount || 0) - (a.viewCount || 0);
    });
  }
  function playerUrl(videoId, options = {}) {
    const id = String(videoId || "").replace(/[^A-Za-z0-9_-]/g, "");
    if (!id) return "";
    const params = new URLSearchParams({
      rel: "0",
      modestbranding: "1",
      playsinline: "1",
      iv_load_policy: "3",
      fs: options.allowFullscreen === false ? "0" : "1"
    });
    if (options.start) params.set("start", String(Math.max(0, Math.round(options.start))));
    return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
  }

  // src/lib/session.js
  var SESSION_STATUS = { ACTIVE: "active", PAUSED: "paused", ENDED: "ended" };
  function remainingSeconds(session, now = /* @__PURE__ */ new Date()) {
    if (!session || session.status === SESSION_STATUS.ENDED) return 0;
    const end = new Date(session.endsAt).getTime();
    const reference = session.status === SESSION_STATUS.PAUSED && session.pausedAt ? new Date(session.pausedAt).getTime() : new Date(now).getTime();
    return Math.max(0, Math.round((end - reference) / 1e3));
  }
  function formatCountdown(totalSeconds) {
    const seconds = Math.max(0, Math.round(totalSeconds));
    const h = Math.floor(seconds / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = seconds % 60;
    if (h) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  // src/focus/focus.js
  var $ = (id) => document.getElementById(id);
  var state = null;
  var videos = [];
  var playing = null;
  var lastQuery = "";
  var countdownTimer = null;
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
          id: "player-countdown"
        })
      );
      clearInterval(countdownTimer);
      countdownTimer = setInterval(() => {
        const node = document.getElementById("player-countdown");
        if (!node || !state?.session) return;
        node.textContent = `${formatCountdown(remainingSeconds(state.session))} left`;
      }, 1e3);
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
          }
        },
        query
      );
      wrap.append(button);
    }
  }
  function skeletonList() {
    const items = Array.from(
      { length: 4 },
      () => el("li", { class: "result" }, [
        el("div", { class: "result-thumb skeleton" }),
        el("div", { class: "result-body" }, [
          el("div", { class: "skeleton", style: "width: 80%; height: 16px" }),
          el("div", { class: "skeleton", style: "width: 46%; height: 12px" }),
          el("div", { class: "skeleton", style: "width: 60%; height: 12px" })
        ])
      ])
    );
    $("results").replaceChildren(el("ul", { class: "result-list", "aria-label": "Loading results" }, items));
  }
  function renderNeedsKey() {
    $("results").replaceChildren(
      el("div", { class: "panel", style: "margin-top: 4px" }, [
        el("h2", { text: "Search needs a YouTube API key." }),
        el("p", { class: "lede", style: "font-size: 15px; margin-top: 8px" }, [
          "Jotty uses the official YouTube Data API instead of scraping the YouTube page. That keeps the results legal and the key free: 10,000 units a day covers roughly 99 searches. The key stays in this browser profile."
        ]),
        el("div", { class: "btn-row", style: "margin-top: 16px" }, [
          el("a", { class: "btn btn-primary", href: "options.html#player" }, "Add a key in settings"),
          el("a", { class: "btn", href: "https://jotty.vercel.app/guides/youtube-data-api-key/", target: "_blank", rel: "noopener" }, "Read the 6-step guide")
        ]),
        el("p", { class: "note", style: "margin-top: 18px" }, [
          "No key? The category list below still works. Each channel opens on YouTube, where the sidebar exists, so it is a fallback rather than the point of the player."
        ])
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
        channels.map(
          (channel) => el(
            "button",
            {
              class: "btn btn-sm",
              type: "button",
              onclick: () => {
                $("query").value = channel.name;
                $("query").focus();
              }
            },
            channel.name
          )
        )
      )
    ]);
  }
  function renderResults() {
    if (!videos.length) {
      $("results").replaceChildren(
        el("div", { class: "empty" }, [
          el("h2", { text: "No results for that search." }),
          el("p", { text: "Try the task name without the chapter number, or search for the topic plus “practice problems”." })
        ])
      );
      return;
    }
    const list = el(
      "ul",
      { class: "result-list", "aria-label": "Video results" },
      videos.map(
        (video) => el("li", { class: "result" }, [
          el("div", { class: "result-thumb" }, [
            video.thumbnail ? el("img", { src: video.thumbnail, alt: "", loading: "lazy", width: "320", height: "180" }) : el("div", { class: "skeleton", style: "height: 100%" }),
            video.durationSeconds ? el("span", { class: "result-duration", text: durationLabel(video.durationSeconds) }) : null
          ]),
          el("div", { class: "result-body" }, [
            el(
              "button",
              {
                class: "result-title",
                type: "button",
                onclick: () => play(video)
              },
              video.title
            ),
            el("div", { class: "result-meta" }, [
              el("span", { text: video.channel }),
              video.trusted ? el("span", { class: "chip chip--calm", text: "Your channel" }) : null,
              video.viewCount !== null ? el("span", { text: formatViews(video.viewCount) }) : null,
              video.publishedAt ? el("span", { text: new Date(video.publishedAt).toLocaleDateString(void 0, { month: "short", year: "numeric" }) }) : null
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
                  }
                },
                "Trust this channel"
              )
            ])
          ])
        ])
      )
    );
    $("results").replaceChildren(
      el("div", { class: "panel-head", style: "margin-bottom: 12px" }, [
        el("h2", { style: "font-family: var(--serif); font-size: 22px; font-weight: 400", text: `${videos.length} videos for “${lastQuery}”` }),
        el("span", { class: "small muted", text: "Your channels first" })
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
      loading: "eager"
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
        }
      },
      "Back to the assignment"
    );
    $("player-view").classList.remove("hidden");
    $("player-view").replaceChildren(
      el("div", { class: "watch-layout" }, [
        el("div", { class: "player-shell" }, [
          el("div", { class: "player-bar" }, [
            el("span", {}, [el("strong", { text: video.channel })]),
            el("span", { text: "No sidebar, no comments, no next-up" })
          ]),
          el("div", { class: "player-frame" }, frame),
          el("div", { style: "padding: 14px 16px" }, [
            el("h2", { style: "font-family: var(--serif); font-size: 22px; line-height: 1.2", text: video.title }),
            el("p", { class: "small muted", style: "margin-top: 4px" }, [
              [video.channel, video.viewCount !== null ? formatViews(video.viewCount) : "", video.durationSeconds ? durationLabel(video.durationSeconds) : ""].filter(Boolean).join(" · ")
            ])
          ])
        ]),
        el("aside", { class: "watch-side" }, [
          el("h2", { text: "The task" }),
          el("p", { text: state?.session?.task || "No session is running." }),
          el("div", { class: "rule", style: "margin: 16px 0" }),
          el("h2", { text: "When this finishes" }),
          el("p", { text: "Close the tab and go back. The player will not suggest another video." }),
          el("div", { class: "btn-row", style: "margin-top: 16px" }, [
            backToTask,
            el("button", { class: "btn btn-ghost", type: "button", onclick: closePlayer }, "Close player")
          ]),
          el("p", { class: "small muted", style: "margin-top: 18px", text: "Playback uses youtube-nocookie.com. Nothing about this video is sent to Jotty." })
        ])
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
            el("a", { class: "btn btn-sm", href: "options.html#player" }, "Check the key")
          ])
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
          el("p", { text: "Use the task suggestions above or type a topic. Results come from YouTube, playback happens here without the feed." })
        ])
      );
    }
  }
  init();
})();
