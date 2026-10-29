/**
 * The morning reflection page. Questions are generated in the service worker
 * from yesterday's log; this page only renders them and sends answers back.
 */

const view = document.getElementById("reflection-view");
let reflection = null;
let saved = null;
let answers = {};

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

function formatLongDate(key) {
  if (!key) return "";
  return new Date(`${key}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function statusNode(name, message, tone = "ok") {
  const node = document.querySelector(`[data-status="${name}"]`);
  if (!node) return;
  node.textContent = message;
  node.dataset.tone = tone;
}

function renderHeader() {
  return el("div", { class: "masthead", style: "grid-template-columns: 1fr; margin-bottom: 26px" }, [
    el("div", {}, [
      el("p", { class: "mono small muted", style: "margin-bottom: 8px", text: formatLongDate(reflection.date) }),
      el("h1", { text: saved ? "You already answered these." : "Three questions about yesterday." }),
      el("p", { class: "lede", style: "margin-top: 12px", text: reflection.intro }),
    ]),
  ]);
}

function renderQuestion(question, index) {
  const groupName = question.id;
  const options = question.options.map((option) => {
    const input = el("input", {
      type: "radio",
      name: groupName,
      value: option.id,
      id: `${groupName}-${option.id}`,
      onchange: () => {
        answers[groupName] = { ...(answers[groupName] || {}), option: option.id };
      },
    });
    if (saved?.answers?.[groupName]?.option === option.id) input.checked = true;
    return el("label", { class: "answer", for: `${groupName}-${option.id}` }, [
      input,
      el("span", { class: "answer-text" }, [
        el("strong", { text: option.label }),
        option.detail ? el("span", { text: option.detail }) : null,
      ]),
    ]);
  });

  const textarea = el("textarea", {
    class: "textarea",
    id: `${groupName}-text`,
    rows: "2",
    maxlength: "280",
    placeholder: "Optional. Your own words are kept with the answer.",
    "aria-label": "Anything to add",
    oninput: (event) => {
      answers[groupName] = { ...(answers[groupName] || {}), text: event.target.value };
    },
  });
  if (saved?.answers?.[groupName]?.text) textarea.value = saved.answers[groupName].text;

  return el("fieldset", { class: "question" }, [
    el("legend", { text: question.prompt }),
    el("span", { class: "question-number", text: `Question ${index + 1} of ${reflection.questions.length} \u00b7 ${question.title}` }),
    question.detail ? el("p", { class: "question-detail", text: question.detail }) : null,
    el("div", { class: "answer-list" }, options),
    el("label", { class: "field", for: `${groupName}-text`, style: "margin-top: 12px; margin-bottom: 0" }, [
      el("span", { class: "field-label", text: "Anything else" }),
      textarea,
    ]),
  ]);
}

function renderPlan(plan) {
  return el("section", { class: "panel", "aria-labelledby": "plan-heading" }, [
    el("div", { class: "panel-head" }, [
      el("h3", { id: "plan-heading", style: "font-family: var(--serif); font-size: 24px; font-weight: 400", text: "A plan for next week" }),
      el("span", { class: "chip chip--calm", text: "Saved" }),
    ]),
    el(
      "ol",
      { class: "plan-list" },
      plan.map((item, index) =>
        el("li", {}, [
          el("span", { class: "plan-index", text: String(index + 1).padStart(2, "0") }),
          el("div", {}, [
            el("strong", { text: item.title }),
            el("p", { text: item.detail }),
            item.action === "settings:soft-block"
              ? el("a", { class: "small", href: "options.html#rules", text: "Open blocking rules" })
              : item.action === "open:focus"
                ? el("a", { class: "small", href: "focus.html", text: "Open the Focus Player" })
                : null,
          ]),
        ])
      )
    ),
  ]);
}

function renderSaved() {
  view.replaceChildren(
    renderHeader(),
    el("div", { class: "panel" }, [
      el("p", { class: "verdict-label", text: "What the answers said" }),
      el("p", { style: "font-family: var(--serif); font-size: 23px; line-height: 1.3; margin: 6px 0 10px", text: saved.evaluation.insight }),
      el("p", { class: "small muted", text: `${saved.evaluation.answered} of ${reflection.questions.length} answered. Saved ${new Date(saved.savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.` }),
    ]),
    el("div", { style: "height: 18px" }),
    renderPlan(saved.evaluation.plan),
    el("div", { class: "btn-row", style: "margin-top: 22px" }, [
      el("a", { class: "btn btn-primary", href: "focus.html" }, "Start with the player"),
      el("a", { class: "btn", href: "options.html" }, "Settings"),
      el(
        "button",
        {
          class: "btn btn-ghost",
          type: "button",
          onclick: () => {
            saved = null;
            answers = {};
            render();
          },
        },
        "Review the answers"
      ),
    ])
  );
}

function renderForm() {
  const form = el(
    "form",
    {
      novalidate: true,
      onsubmit: async (event) => {
        event.preventDefault();
        const answered = Object.values(answers).filter((answer) => answer?.option || answer?.text).length;
        if (!answered) {
          statusNode("reflection", "Answer at least one question. One sentence is a real answer.", "error");
          return;
        }
        const button = document.getElementById("save-reflection");
        button.disabled = true;
        button.textContent = "Saving\u2026";
        const response = await send("reflection:save", {
          date: reflection.date,
          answers,
        });
        button.disabled = false;
        button.textContent = "Save and see the plan";
        if (!response.ok) {
          statusNode("reflection", response.error || "The reflection was not saved.", "error");
          return;
        }
        saved = response.saved;
        window.scrollTo({ top: 0, behavior: "smooth" });
        render();
      },
    },
    [
      el("div", { class: "reflection-list" }, reflection.questions.map(renderQuestion)),
      el("div", { class: "btn-row", style: "margin-top: 28px" }, [
        el("button", { class: "btn btn-primary", type: "submit", id: "save-reflection" }, "Save and see the plan"),
        el("span", { class: "status-line", "data-status": "reflection" }),
      ]),
      el("p", { class: "small muted", style: "margin-top: 16px; max-width: 58ch", text: "The answers stay in this browser. They are used to suggest one adjustment, not to score you." }),
    ]
  );
  view.replaceChildren(renderHeader(), form);
}

function renderEmpty() {
  view.replaceChildren(
    el("div", { class: "empty" }, [
      el("img", { src: "icons/icon128.png", alt: "" }),
      el("h1", { text: "Nothing to report." }),
      el("p", { text: "No drift was recorded for yesterday, so there are no questions. Keep the session task short and specific; it makes the judgement better." }),
      el("div", { class: "btn-row", style: "justify-content: center; margin-top: 20px" }, [
        el("a", { class: "btn btn-primary", href: "focus.html" }, "Open the Focus Player"),
        el("a", { class: "btn", href: "options.html" }, "Settings"),
      ]),
    ])
  );
}

function render() {
  if (!reflection) return;
  if (saved) {
    renderSaved();
    return;
  }
  if (!reflection.questions.length) {
    renderEmpty();
    return;
  }
  renderForm();
}

async function init() {
  const response = await send("reflection:get");
  if (!response.ok) {
    view.replaceChildren(
      el("div", { class: "panel" }, [
        el("h2", { text: "Jotty could not open the reflection." }),
        el("p", { class: "small muted", text: response.error || "Reload the page." }),
      ])
    );
    return;
  }
  reflection = response.reflection;
  saved = response.saved;
  answers = saved?.answers ? structuredClone(saved.answers) : {};
  render();
}

init();
