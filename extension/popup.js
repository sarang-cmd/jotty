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

  // src/lib/text.js
  function formatDuration(totalSeconds) {
    const minutes = Math.max(0, Math.round(Number(totalSeconds || 0) / 60));
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest ? `${hours} h ${String(rest).padStart(2, "0")} min` : `${hours} h`;
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
  function deadlineLabel(deadline, now = /* @__PURE__ */ new Date()) {
    if (!deadline) return "";
    const due = /* @__PURE__ */ new Date(`${deadline}T00:00:00`);
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const diffMs = due.getTime() - today.getTime();
    const days = Math.round(diffMs / 864e5);
    if (Number.isNaN(days)) return "";
    if (days < 0) return "Past due";
    if (days === 0) return "Due today";
    if (days === 1) return "Due tomorrow";
    if (days <= 7) return `Due in ${days} days`;
    return `Due ${(/* @__PURE__ */ new Date(`${deadline}T12:00:00`)).toLocaleDateString(void 0, {
      month: "short",
      day: "numeric"
    })}`;
  }
  function sessionProgress(session, now = /* @__PURE__ */ new Date()) {
    if (!session) return 0;
    const total = new Date(session.endsAt).getTime() - new Date(session.startedAt).getTime();
    if (total <= 0) return 100;
    const left = remainingSeconds(session, now) * 1e3;
    return Math.min(100, Math.max(0, Math.round((total - left) / total * 100)));
  }

  // src/popup/popup.js
  var view = document.getElementById("view");
  var statePill = document.getElementById("state-pill");
  var current = null;
  var ticker = null;
  var formError = "";
  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
      if (value == null || value === false) continue;
      if (key === "class") node.className = value;
      else if (key === "text") node.textContent = value;
      else if (key === "html") node.innerHTML = value;
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
  function setStatePill(session) {
    if (session && session.status === "active") {
      statePill.dataset.state = "active";
      statePill.lastElementChild.textContent = "Focus session";
    } else if (session && session.status === "paused") {
      statePill.dataset.state = "idle";
      statePill.lastElementChild.textContent = "Paused";
    } else {
      statePill.dataset.state = "idle";
      statePill.lastElementChild.textContent = "No session";
    }
  }
  function field(label, control, hint, error) {
    const id = control.id;
    return el("label", { class: "field", for: id }, [
      el("span", { class: "field-label", text: label }),
      control,
      hint ? el("span", { class: "field-hint", text: hint }) : null,
      error ? el("span", { class: "field-error", text: error }) : null
    ]);
  }
  function renderLoading() {
    view.replaceChildren(
      el("div", { style: "padding:24px 0" }, [
        el("div", { class: "skeleton", style: "width:62%;height:18px;margin-bottom:12px" }),
        el("div", { class: "skeleton", style: "width:100%;height:38px;margin-bottom:8px" }),
        el("div", { class: "skeleton", style: "width:40%;height:14px" })
      ])
    );
  }
  function renderSetup(state) {
    const settings = state.settings || {};
    const taskInput = el("input", {
      class: "input",
      id: "task",
      type: "text",
      maxlength: "160",
      placeholder: "e.g. Gas stoichiometry, chapter 9",
      autocomplete: "off",
      "aria-invalid": formError ? "true" : null
    });
    if (current?.draftTask) taskInput.value = current.draftTask;
    const subject = el(
      "select",
      { class: "select", id: "subject" },
      SUBJECT_OPTIONS.map(
        (option) => el("option", { value: option, selected: option === settings.subject }, option)
      )
    );
    const deadline = el("input", { class: "input", id: "deadline", type: "date" });
    const minutes = el(
      "select",
      { class: "select", id: "minutes" },
      [25, 50, 90].map(
        (value) => el(
          "option",
          { value: String(value), selected: value === Number(settings.sessionMinutes) },
          `${value} minutes`
        )
      )
    );
    const form = el(
      "form",
      {
        id: "start-form",
        novalidate: true,
        onsubmit: async (event) => {
          event.preventDefault();
          const task = taskInput.value.trim();
          if (task.length < 3) {
            formError = "Give the session a task first. Three characters is enough.";
            current = { ...current || {}, draftTask: task };
            render(current);
            document.getElementById("task")?.focus();
            return;
          }
          formError = "";
          const button = document.getElementById("start-button");
          button.disabled = true;
          button.textContent = "Starting…";
          const response = await send("session:start", {
            task,
            subject: subject.value,
            deadline: deadline.value,
            minutes: Number(minutes.value)
          });
          if (!response.ok) {
            formError = response.error || "The session did not start.";
            button.disabled = false;
            button.textContent = "Start focus session";
            render(current);
            return;
          }
          await refresh();
        }
      },
      [
        el("h1", { class: "popup-title", text: "What are you working on?" }),
        el("p", { class: "small muted", style: "margin-bottom:16px", text: "Jotty judges pages against this line. Be specific." }),
        field("Task", taskInput, "Include the chapter, problem set or paper.", formError),
        el("div", { class: "field-row" }, [
          field("Subject", subject),
          field("Session", minutes)
        ]),
        field("Deadline (optional)", deadline, "Used in the morning reflection."),
        el("button", { class: "btn btn-primary", type: "submit", id: "start-button", style: "width:100%" }, "Start focus session")
      ]
    );
    const pending = state.pendingReflection;
    const extras = el("div", { style: "margin-top:18px;border-top:1px solid var(--line);padding-top:14px" }, [
      el(
        "div",
        { class: "btn-row" },
        [
          el("button", { class: "btn btn-sm", type: "button", onclick: () => send("focus:open") }, "Open Focus Player"),
          pending ? el(
            "a",
            { class: "btn btn-sm", href: "reflection.html" },
            `Morning questions${pending.count ? ` (${pending.count})` : ""}`
          ) : null
        ]
      ),
      pending ? el("p", { class: "small muted", style: "margin-top:10px", text: `${pending.date} had ${pending.count} flagged ${pending.count === 1 ? "page" : "pages"} waiting for a reflection.` }) : null
    ]);
    view.replaceChildren(form, extras);
    taskInput.focus();
  }
  function statRow(summary) {
    const total = summary?.totalSeconds || 0;
    return el("dl", { class: "popup-stats" }, [
      el("div", { class: "popup-stat" }, [
        el("dt", { text: "On task today" }),
        el("dd", { text: total ? `${summary.focusPercent}%` : "—" })
      ]),
      el("div", { class: "popup-stat" }, [
        el("dt", { text: "Recorded" }),
        el("dd", { text: total ? formatDuration(total) : "0 min" })
      ])
    ]);
  }
  function renderActive(state) {
    const session = state.session;
    const summary = state.summary;
    const deadline = session.deadline ? deadlineLabel(session.deadline) : "";
    const countdown = el("div", { class: "countdown", id: "countdown", "aria-live": "off" });
    const meter = el("div", { class: "meter", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": "100" }, [
      el("span", { id: "meter-fill" })
    ]);
    const topDrift = (summary?.topDomains || []).find((entry) => entry.offTask > 0);
    const pauseButton = el(
      "button",
      {
        class: "btn btn-sm",
        type: "button",
        onclick: async () => {
          await send(session.status === "paused" ? "session:resume" : "session:pause");
          await refresh();
        }
      },
      session.status === "paused" ? "Resume" : "Pause"
    );
    const body = el("div", {}, [
      el("div", { class: "popup-meta" }, [
        el("span", { class: "chip chip--calm" }, [
          el("i", { class: "chip-dot" }),
          session.subject || "Focus"
        ]),
        deadline ? el("span", { class: "chip", text: deadline }) : null,
        session.status === "paused" ? el("span", { class: "chip chip--flag", text: "Paused" }) : null
      ]),
      el("h1", { class: "popup-task", text: session.task }),
      countdown,
      meter,
      el("p", { class: "small muted", id: "session-note" }),
      statRow(summary),
      topDrift ? el("p", {
        class: "small muted",
        style: "margin:-6px 0 12px",
        text: `Most drift today: ${topDrift.domain} (${formatDuration(topDrift.offTask)}).`
      }) : null,
      el("div", { class: "btn-row" }, [
        el("button", { class: "btn btn-sm btn-primary", type: "button", onclick: () => send("focus:open") }, "Focus Player"),
        pauseButton,
        el(
          "button",
          {
            class: "btn btn-sm btn-ghost",
            type: "button",
            onclick: async () => {
              await send("session:end");
              await refresh();
            }
          },
          "End"
        )
      ]),
      state.pendingReflection ? el(
        "a",
        { class: "note", href: "reflection.html", style: "display:block;margin-top:16px;text-decoration:none" },
        `${state.pendingReflection.count} ${state.pendingReflection.count === 1 ? "page" : "pages"} from ${state.pendingReflection.date} still need an answer. Open the morning questions.`
      ) : null
    ]);
    view.replaceChildren(body);
    const updateClock = () => {
      if (!current?.session) return;
      const left = remainingSeconds(current.session);
      if (!countdown.isConnected) return;
      countdown.textContent = session.status === "paused" ? "Paused" : formatCountdown(left);
      const progress = sessionProgress(current.session);
      const fill = document.getElementById("meter-fill");
      if (fill) fill.style.width = `${progress}%`;
      meter.setAttribute("aria-valuenow", String(progress));
      const note = document.getElementById("session-note");
      if (note) {
        note.textContent = session.status === "paused" ? "The clock is stopped. Resume when you are back." : left === 0 ? "Time is up. End the session when you are ready." : `${Math.round(progress)}% of the session done.`;
      }
    };
    updateClock();
    clearInterval(ticker);
    ticker = setInterval(updateClock, 1e3);
  }
  function renderEnded(state) {
    const summary = state.summary;
    view.replaceChildren(
      el("div", {}, [
        el("h1", { class: "popup-title", text: "Session closed." }),
        el("p", { class: "small muted", style: "margin-bottom:14px", text: "The log is saved. Tomorrow morning Jotty will ask about anything that drifted." }),
        statRow(summary),
        el("div", { class: "btn-row" }, [
          el("button", { class: "btn btn-sm btn-primary", type: "button", onclick: () => {
            current = { ...current, session: null };
            render(current);
          } }, "Start another"),
          el("a", { class: "btn btn-sm", href: "reflection.html" }, "Morning questions")
        ])
      ])
    );
  }
  function render(state) {
    if (!state) {
      renderLoading();
      return;
    }
    setStatePill(state.session);
    if (state.session && (state.session.status === "active" || state.session.status === "paused")) {
      renderActive(state);
      return;
    }
    clearInterval(ticker);
    if (state.session && state.session.status === "ended" && !state.settings?.showSetupAfterEnd) {
      renderEnded(state);
      return;
    }
    renderSetup(state);
  }
  async function refresh() {
    const response = await send("state:get");
    if (!response.ok) {
      view.replaceChildren(
        el("div", { class: "panel" }, [
          el("h2", { text: "Jotty could not read its own storage." }),
          el("p", { class: "small muted", text: response.error || "Reload the popup and try again." })
        ])
      );
      return;
    }
    current = response;
    render(current);
  }
  document.getElementById("settings-link").addEventListener("click", (event) => {
    event.preventDefault();
    chrome.runtime.openOptionsPage();
  });
  refresh();
})();
