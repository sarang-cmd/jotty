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
  var DAILY_QUOTA = 1e4;
  function quotaMessage(used, total = DAILY_QUOTA) {
    const remaining = Math.max(0, total - used);
    return `${used.toLocaleString()} of ${total.toLocaleString()} units used today. ${remaining.toLocaleString()} left.`;
  }

  // src/options/options.js
  var $ = (id) => document.getElementById(id);
  var settings = null;
  var quota = null;
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
  function status(name, message, tone = "ok") {
    const node = document.querySelector(`[data-status="${name}"]`);
    if (!node) return;
    node.textContent = message;
    node.dataset.tone = tone;
    clearTimeout(node._timer);
    node._timer = setTimeout(() => {
      node.textContent = "";
      delete node.dataset.tone;
    }, 5e3);
  }
  function splitLines(value) {
    return String(value || "").split(/[\n,]+/).map((line) => line.trim()).filter(Boolean);
  }
  function fillSelect(select, options, current) {
    select.replaceChildren();
    for (const option of options) {
      const node = document.createElement("option");
      if (typeof option === "string") {
        node.value = option;
        node.textContent = option;
      } else {
        node.value = String(option.value);
        node.textContent = option.label;
      }
      if (String(option.value ?? option) === String(current)) node.selected = true;
      select.append(node);
    }
  }
  function fillForms(state) {
    settings = state.settings;
    const s = settings;
    fillSelect($("default-subject"), SUBJECT_OPTIONS, s.subject);
    $("session-minutes").value = String(s.sessionMinutes);
    $("daily-goal").value = String(s.dailyGoalMinutes);
    $("blocklist").value = s.blocklist.join("\n");
    $("allowlist").value = s.allowlist.join("\n");
    $("block-unrelated").checked = s.blockUnrelated;
    $("strict-mode").checked = s.strictMode;
    $("block-delay").value = String(s.blockDelaySeconds);
    $("nudges-enabled").checked = s.nudges;
    $("snooze-minutes").value = String(s.nudgeSnoozeMinutes);
    $("reflection-enabled").checked = s.reflectionEnabled;
    $("notifications-enabled").checked = s.notifications;
    fillSelect(
      $("reflection-hour"),
      [6, 7, 8, 9, 10, 11, 12].map((hour) => ({
        value: hour,
        label: `${String(hour).padStart(2, "0")}:00`
      })),
      s.reflectionHour
    );
    fillSelect($("channels-subject"), SUBJECT_OPTIONS, s.subject);
    renderChannelList(s.subject);
    renderKeyStatus(state);
    renderQuota(state.quota || quota);
  }
  function renderChannelList(subject) {
    const list = settings?.channelsBySubject?.[subject] || [];
    $("channels-list").value = list.join("\n");
  }
  function renderKeyStatus(state) {
    const hasKey = state.hasKey;
    $("api-key").value = "";
    $("api-key").placeholder = hasKey ? "A key is saved. Paste a new one to replace it." : "AIza...";
    $("key-hint").textContent = hasKey ? "A key is saved in this profile. Jotty cannot show it back to you." : "Stored in chrome.storage.local. Never sent to Jotty.";
  }
  function renderQuota(value) {
    quota = value;
    if (!quota) {
      $("quota-readout").value = "No requests yet";
      return;
    }
    $("quota-readout").value = quotaMessage(quota.units, DAILY_QUOTA);
  }
  async function saveSection(name, patch) {
    const response = await send("settings:set", { settings: patch });
    if (!response.ok) {
      status(name, response.error || "Could not save.", "error");
      return false;
    }
    settings = response.settings;
    status(name, "Saved.");
    return true;
  }
  function wireForms() {
    $("form-sessions").addEventListener("submit", async (event) => {
      event.preventDefault();
      const goal = Number($("daily-goal").value);
      if (!Number.isFinite(goal) || goal < 10 || goal > 600) {
        status("sessions", "Daily goal must be between 10 and 600 minutes.", "error");
        $("daily-goal").focus();
        return;
      }
      await saveSection("sessions", {
        subject: $("default-subject").value,
        sessionMinutes: Number($("session-minutes").value),
        dailyGoalMinutes: goal
      });
    });
    $("form-rules").addEventListener("submit", async (event) => {
      event.preventDefault();
      const blocklist = splitLines($("blocklist").value);
      if (!blocklist.length) {
        status("rules", "Keep at least one site on the list, or turn sessions off instead.", "error");
        $("blocklist").focus();
        return;
      }
      await saveSection("rules", {
        blocklist,
        allowlist: splitLines($("allowlist").value),
        blockUnrelated: $("block-unrelated").checked,
        strictMode: $("strict-mode").checked,
        blockDelaySeconds: Number($("block-delay").value)
      });
      $("blocklist").value = settings.blocklist.join("\n");
      $("allowlist").value = settings.allowlist.join("\n");
    });
    $("form-nudges").addEventListener("submit", async (event) => {
      event.preventDefault();
      await saveSection("nudges", {
        nudges: $("nudges-enabled").checked,
        nudgeSnoozeMinutes: Number($("snooze-minutes").value)
      });
    });
    $("form-reflection").addEventListener("submit", async (event) => {
      event.preventDefault();
      await saveSection("reflection", {
        reflectionEnabled: $("reflection-enabled").checked,
        notifications: $("notifications-enabled").checked,
        reflectionHour: Number($("reflection-hour").value)
      });
    });
    $("form-player").addEventListener("submit", async (event) => {
      event.preventDefault();
      const subject = $("channels-subject").value;
      const next = { ...settings.channelsBySubject || {}, [subject]: splitLines($("channels-list").value) };
      if (await saveSection("player", { channelsBySubject: next })) {
        const trusted = new Set(settings.trustedChannels || []);
        for (const handle of splitLines($("channels-list").value)) trusted.add(handle);
        await send("settings:set", { settings: { trustedChannels: [...trusted] } });
        renderChannelList(subject);
        $("channels-list").value = settings.channelsBySubject[subject].join("\n");
      }
    });
    $("channels-subject").addEventListener("change", () => {
      renderChannelList($("channels-subject").value);
    });
    $("channels-reset").addEventListener("click", () => {
      const subject = $("channels-subject").value;
      const suggested = CURATED_CHANNELS[subject] || CURATED_CHANNELS.Other;
      $("channels-list").value = suggested.map((channel) => channel.handle).join("\n");
      status("player", "Suggested channels loaded. Save to keep them.");
    });
    $("key-save").addEventListener("click", async () => {
      const key = $("api-key").value.trim();
      if (!key) {
        status("key", "Paste a key first.", "error");
        $("api-key").focus();
        return;
      }
      if (!key.startsWith("AIza") || key.length < 30) {
        status("key", "That does not look like a Google API key. It starts with AIza.", "error");
        $("api-key").focus();
        return;
      }
      const response = await send("key:set", { key });
      if (!response.ok) {
        status("key", response.error || "The key was not saved.", "error");
        return;
      }
      $("api-key").value = "";
      renderKeyStatus({ hasKey: true });
      status("key", "Key saved. Test it before your next session.");
    });
    $("key-test").addEventListener("click", async () => {
      const button = $("key-test");
      button.disabled = true;
      button.textContent = "Testing…";
      status("key", "Calling the YouTube API once.", "ok");
      const response = await send("key:test");
      button.disabled = false;
      button.textContent = "Test key";
      if (!response.ok) {
        status("key", response.error || "The test failed.", "error");
        return;
      }
      status("key", response.message || "The key works.");
      if (response.quota) renderQuota(response.quota);
    });
    $("key-clear").addEventListener("click", async () => {
      const response = await send("key:clear");
      if (!response.ok) {
        status("key", response.error || "Could not remove the key.", "error");
        return;
      }
      renderKeyStatus({ hasKey: false });
      renderQuota({ units: 0 });
      status("key", "Key removed.");
    });
  }
  function wireData() {
    $("export-data").addEventListener("click", async () => {
      const response = await send("data:export");
      if (!response.ok) {
        status("data", response.error || "Export failed.", "error");
        return;
      }
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `jotty-export-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json`;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2e3);
      status("data", "Export downloaded.");
    });
    $("clear-data").addEventListener("click", () => {
      $("clear-panel").classList.remove("hidden");
      $("clear-confirm").focus();
    });
    $("clear-cancel").addEventListener("click", () => {
      $("clear-panel").classList.add("hidden");
      $("clear-confirm").value = "";
      $("clear-confirm-button").disabled = true;
    });
    $("clear-confirm").addEventListener("input", (event) => {
      $("clear-confirm-button").disabled = event.target.value.trim() !== "DELETE";
    });
    $("clear-confirm-button").addEventListener("click", async () => {
      const response = await send("data:clear");
      if (!response.ok) {
        status("data", response.error || "Nothing was deleted.", "error");
        return;
      }
      $("clear-panel").classList.add("hidden");
      $("clear-confirm").value = "";
      $("clear-confirm-button").disabled = true;
      status("data", "All local data deleted.");
      const fresh = await send("state:get");
      if (fresh.ok) fillForms(fresh);
    });
  }
  function wireNavigation() {
    const links = [...document.querySelectorAll("#options-nav a")];
    const sections = links.map((link) => document.querySelector(link.getAttribute("href"))).filter(Boolean);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          links.forEach((link) => {
            const current = link.getAttribute("href") === `#${entry.target.id}`;
            if (current) link.setAttribute("aria-current", "true");
            else link.removeAttribute("aria-current");
          });
        }
      },
      { rootMargin: "-10% 0px -70% 0px", threshold: 0 }
    );
    sections.forEach((section) => observer.observe(section));
  }
  async function init() {
    $("version-label").textContent = chrome.runtime.getManifest().version;
    const response = await send("state:get");
    if (!response.ok) {
      document.querySelector(".options-main").prepend(
        Object.assign(document.createElement("p"), {
          className: "note note--warn",
          textContent: response.error || "Jotty could not read its storage. Reload the page."
        })
      );
      return;
    }
    fillForms(response);
    wireForms();
    wireData();
    wireNavigation();
  }
  init();
})();
