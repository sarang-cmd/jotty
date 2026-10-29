/**
 * Landing page behaviour, mounted after React's first commit.
 *
 * The interactive panels are not illustrations. They call the same modules
 * that are bundled into the extension (docs/assets/engine.js, loaded before
 * this bundle), with example data. No network requests, no third-party
 * scripts. `initLanding` is idempotent: React effects can call it twice
 * without attaching duplicate listeners.
 */

let mounted = false;

export function initLanding() {
  if (mounted) return;
  mounted = true;

  const E = window.JottyEngine;
  const $ = (id) => document.getElementById(id);

  /* ---------------------------------------------------------------------
     CountUp, after the React Bits component, without its React dependency.
     Numbers ease from their previous value so a verdict change reads as a
     change rather than a jump. Reduced motion renders the final value.
     --------------------------------------------------------------------- */

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const counters = new WeakMap();

  function setCount(element, target, format, duration = 460) {
    if (!element) return;
    const previous = counters.get(element) || { value: 0, raf: 0 };
    cancelAnimationFrame(previous.raf);

    if (reducedMotion.matches || previous.value === target) {
      element.textContent = format(target);
      counters.set(element, { value: target, raf: 0 });
      return;
    }

    const from = previous.value;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(from + (target - from) * eased);
      element.textContent = format(value);
      if (progress < 1) {
        counters.set(element, { value, raf: requestAnimationFrame(tick) });
      } else {
        element.textContent = format(target);
        counters.set(element, { value: target, raf: 0 });
      }
    };
    counters.set(element, { value: from, raf: requestAnimationFrame(tick) });
  }

  document.getElementById("year").textContent = String(new Date().getFullYear());

  const header = document.getElementById("site-header");
  const onScroll = () => {
    header.dataset.scrolled = window.scrollY > 8 ? "true" : "false";
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  if (!E) {
    document.querySelectorAll(".demo-card, .heatmap-wrap").forEach((node) => {
      node.insertAdjacentHTML(
        "afterbegin",
        '<p class="small muted">The interactive example could not load. The extension does not depend on this script.</p>'
      );
    });
    return;
  }

  /* ---------------------------------------------------------------------
     1. Hero: the relevance judge
     --------------------------------------------------------------------- */

  const SESSION = {
    task: "Gas stoichiometry, chapter 9",
    subject: "Chemistry",
    status: "active",
    taskUrl: "https://docs.google.com/document/d/ch9",
  };

  const SETTINGS = {
    allowlist: ["khanacademy.org", "chem.libretexts.org", "docs.google.com"],
    trustedChannels: ["@tylerdewitt", "@khanacademy"],
    blocklist: ["youtube.com"],
  };

  const PAGES = {
    teflon: {
      title: "The chemistry of Teflon and nonstick pans",
      meta: "youtube.com · Tyler DeWitt",
      page: {
        title: "The chemistry of Teflon and nonstick pans",
        url: "https://www.youtube.com/watch?v=teflon",
        channel: "Tyler DeWitt",
        description: "How PTFE is made and why nothing sticks to it.",
      },
    },
    gas: {
      title: "Gas stoichiometry: equations, part 1",
      meta: "youtube.com · Tyler DeWitt",
      page: {
        title: "Gas stoichiometry: equations, part 1",
        url: "https://www.youtube.com/watch?v=gas1",
        channel: "Tyler DeWitt",
        description: "Molar volume at STP and limiting reagent calculations.",
      },
    },
    tokyo: {
      title: "24 hours in Tokyo",
      meta: "youtube.com · a travel channel",
      page: {
        title: "24 hours in Tokyo",
        url: "https://www.youtube.com/watch?v=tokyo",
        channel: "Somewhere to Go",
        description: "A day of trains, ramen and a very early fish market.",
      },
    },
  };

  const NOTES = {
    back: "In the extension this opens the saved task address and logs the return.",
    snooze: "Quiet for 10 minutes. The snooze is logged with the page.",
    helpful: "Noted. In the extension this stays in your browser, not on a server.",
  };

  function selectedDemoPage() {
    return document.querySelector("[data-demo-page][aria-pressed='true']")?.dataset.demoPage || "teflon";
  }

  function renderJudge(key = selectedDemoPage()) {
    const spec = PAGES[key];
    if (!spec) return;
    const result = E.judgePage(spec.page, { session: SESSION, settings: SETTINGS });
    const verdict = $("demo-verdict");

    $("demo-page-title").textContent = spec.title;
    $("demo-page-meta").textContent = spec.meta;
    verdict.dataset.verdict = result.verdict;
    $("demo-kicker").textContent = E.VERDICT_LABEL[result.verdict];
    setCount($("demo-score"), Math.round(result.confidence * 100), (value) => `${value}% confidence`);
    $("demo-coach").textContent = result.coachLine || "Nothing to judge without a session.";
    $("demo-note").textContent = "";

    const reasons = $("demo-reasons");
    reasons.replaceChildren();
    const lines = result.reasons.length ? result.reasons.slice(0, 2) : ["No evidence to show for this page."];
    for (const line of lines) {
      const item = document.createElement("li");
      item.textContent = line;
      reasons.append(item);
    }

    const primary = $("demo-back");
    primary.textContent = result.verdict === "on-task" ? "Open the task" : "Back to task";
    document.querySelectorAll("[data-demo-page]").forEach((button) => {
      button.setAttribute("aria-pressed", button.dataset.demoPage === key ? "true" : "false");
    });
  }

  document.querySelectorAll("[data-demo-page]").forEach((button) => {
    button.addEventListener("click", () => renderJudge(button.dataset.demoPage));
  });

  $("demo-back")?.addEventListener("click", () => {
    $("demo-note").textContent = NOTES.back;
  });
  $("demo-snooze")?.addEventListener("click", () => {
    $("demo-note").textContent = NOTES.snooze;
  });
  $("demo-helpful")?.addEventListener("click", () => {
    $("demo-note").textContent = NOTES.helpful;
  });

  renderJudge();

  /* ---------------------------------------------------------------------
     2. The example log (used by the reflection and the heatmap)
     --------------------------------------------------------------------- */

  const END = new Date("2026-10-28T22:00:00");

  function stamp(offsetDays, hour, minute = 0) {
    const date = new Date(END);
    date.setDate(date.getDate() - offsetDays);
    date.setHours(hour, minute, 0, 0);
    return date;
  }

  function buildExampleHabits() {
    let habits = E.createHabits();
    const driftPattern = [
      // [days before the end date, hour, minutes]
      [1, 16, 40],
      [8, 16, 35],
      [15, 16, 38],
      [22, 16, 20],
      [2, 21, 25],
      [9, 21, 19],
      [3, 11, 30],
      [10, 11, 20],
    ];

    for (const [offset, hour, minutes] of driftPattern) {
      const date = stamp(offset, hour);
      habits = E.recordSlice(habits, {
        date: E.dateKey(date),
        hour,
        seconds: minutes * 60,
        domain: "youtube.com",
        verdict: E.VERDICT.OFF_TASK,
      });
    }

    // A believable study week: two focused blocks on most weekdays.
    for (let offset = 0; offset < 28; offset += 1) {
      const date = stamp(offset, 10);
      const weekday = date.getDay();
      if (weekday === 0) continue;
      for (const [hour, minutes] of [[10, 55], [14, 70]]) {
        habits = E.recordSlice(habits, {
          date: E.dateKey(date),
          hour,
          seconds: minutes * 60,
          domain: "docs.google.com",
          verdict: E.VERDICT.ON_TASK,
        });
      }
    }

    const teflonAt = stamp(1, 16, 4);
    habits = E.recordEvent(habits, {
      ts: teflonAt.getTime(),
      domain: "youtube.com",
      title: "The chemistry of Teflon and nonstick pans",
      channel: "Tyler DeWitt",
      verdict: E.VERDICT.ADJACENT,
      action: "nudged",
      task: SESSION.task,
      subject: SESSION.subject,
    });
    const tokyoAt = stamp(1, 16, 12);
    habits = E.recordEvent(habits, {
      ts: tokyoAt.getTime(),
      domain: "youtube.com",
      title: "24 hours in Tokyo",
      channel: "Somewhere to Go",
      verdict: E.VERDICT.OFF_TASK,
      action: "nudged",
      task: SESSION.task,
      subject: SESSION.subject,
    });

    return habits;
  }

  const exampleHabits = buildExampleHabits();

  /* ---------------------------------------------------------------------
     3. Morning reflection
     --------------------------------------------------------------------- */

  const REFLECTION = E.buildReflection(exampleHabits, {
    date: "2026-10-27",
    task: SESSION.task,
    now: new Date("2026-10-28T08:00:00"),
  });

  const reflectionForm = $("reflection-form");
  const reflectionQuestions = $("reflection-questions");

  function renderReflectionQuestions() {
    if (!reflectionForm) return;
    reflectionQuestions.replaceChildren();
    REFLECTION.questions.slice(0, 3).forEach((question, index) => {
      const fieldset = document.createElement("fieldset");
      fieldset.className = "reflection-question";

      const legend = document.createElement("legend");
      legend.textContent = question.prompt;
      fieldset.append(legend);

      if (question.detail) {
        const detail = document.createElement("p");
        detail.className = "detail";
        detail.textContent = question.detail;
        fieldset.append(detail);
      }

      const row = document.createElement("div");
      row.className = "answer-row";
      question.options.forEach((option, optionIndex) => {
        const wrapper = document.createElement("div");
        wrapper.className = "answer-option";
        const input = document.createElement("input");
        input.type = "radio";
        input.name = question.id;
        input.value = option.id;
        input.id = `refl-${index}-${optionIndex}`;
        if (optionIndex === 0) input.required = index === 0;
        const label = document.createElement("label");
        label.setAttribute("for", input.id);
        const span = document.createElement("span");
        span.textContent = option.label;
        label.append(span);
        wrapper.append(input, label);
        row.append(wrapper);
      });
      fieldset.append(row);
      reflectionQuestions.append(fieldset);
    });
  }

  function readReflectionAnswers() {
    const answers = {};
    for (const question of REFLECTION.questions.slice(0, 3)) {
      const checked = reflectionForm.querySelector(`input[name="${question.id}"]:checked`);
      if (checked) answers[question.id] = { option: checked.value };
    }
    return answers;
  }

  function renderReflectionResult(evaluation) {
    const result = $("reflection-result");
    result.replaceChildren();
    result.classList.remove("hidden");

    const insight = document.createElement("p");
    insight.className = "insight";
    insight.textContent = evaluation.insight;
    result.append(insight);

    const list = document.createElement("ol");
    list.className = "plan";
    evaluation.plan.forEach((item, index) => {
      const li = document.createElement("li");
      const n = document.createElement("span");
      n.className = "n";
      n.textContent = String(index + 1).padStart(2, "0");
      const body = document.createElement("div");
      const strong = document.createElement("strong");
      strong.textContent = item.title;
      const span = document.createElement("span");
      span.textContent = item.detail;
      body.append(strong, span);
      li.append(n, body);
      list.append(li);
    });
    result.append(list);

    const note = document.createElement("p");
    note.className = "plan-note";
    note.textContent =
      "This plan is a suggestion. The extension would offer the same adjustment in Settings, with one click to accept it.";
    result.append(note);

    const reset = document.createElement("button");
    reset.type = "button";
    reset.className = "btn btn-sm";
    reset.style.marginTop = "16px";
    reset.textContent = "Try different answers";
    reset.addEventListener("click", () => {
      result.classList.add("hidden");
      reflectionForm.classList.remove("hidden");
      reflectionForm.reset();
      $("reflection-status").textContent = "";
    });
    result.append(reset);
  }

  if (reflectionForm) {
    renderReflectionQuestions();
    reflectionForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const answers = readReflectionAnswers();
      if (!Object.keys(answers).length) {
        $("reflection-status").textContent = "Choose one answer to see the plan.";
        return;
      }
      $("reflection-status").textContent = "";
      const evaluation = E.evaluateReflection(REFLECTION, answers);
      reflectionForm.classList.add("hidden");
      renderReflectionResult(evaluation);
    });
  }

  /* ---------------------------------------------------------------------
     4. Heatmap and weak spots
     --------------------------------------------------------------------- */

  const HEATMAP = E.buildHeatmap(exampleHabits, { weeks: 4, endDate: END });
  const WEAK = E.rankWeakSpots(exampleHabits, { weeks: 4, endDate: END, limit: 3 });
  let heatmapMetric = "drift";

  function buildHourHeader() {
    const row = $("heatmap-hours");
    if (!row) return;
    for (let hour = 0; hour < 24; hour += 1) {
      const th = document.createElement("th");
      th.scope = "col";
      th.textContent = hour % 2 === 0 ? String(hour).padStart(2, "0") : "";
      if (hour % 2 !== 0) th.setAttribute("aria-hidden", "true");
      row.append(th);
    }
  }

  function valueFor(cell, metric) {
    return metric === "drift" ? cell.driftMinutes : cell.focusMinutes;
  }

  function levelFor(value, max) {
    if (!value) return 0;
    if (!max) return 1;
    return Math.min(5, Math.max(1, Math.ceil((value / max) * 5)));
  }

  function renderHeatmap() {
    const body = $("heatmap-body");
    const table = $("heatmap");
    if (!body || !table) return;
    table.dataset.metric = heatmapMetric;
    body.replaceChildren();

    const max = heatmapMetric === "drift" ? HEATMAP.max : HEATMAP.maxFocus;
    const unit = heatmapMetric === "drift" ? "drift" : "on task";

    HEATMAP.rows.forEach((row, rowIndex) => {
      const tr = document.createElement("tr");
      const th = document.createElement("th");
      th.scope = "row";
      th.textContent = row.label;
      tr.append(th);
      for (let hour = 0; hour < 24; hour += 1) {
        const cell = row.hours[hour];
        const value = valueFor(cell, heatmapMetric);
        const td = document.createElement("td");
        td.dataset.level = String(levelFor(value, max));
        td.setAttribute("aria-label", `${row.longLabel} ${String(hour).padStart(2, "0")}:00, ${value} minutes ${unit}`);
        td.title = `${row.longLabel} ${String(hour).padStart(2, "0")}:00 · ${value} min ${unit}`;
        tr.append(td);
      }
      body.append(tr);
      tr.dataset.row = String(rowIndex);
    });

    const totalDrift = HEATMAP.rows.reduce(
      (sum, row) => sum + row.hours.reduce((inner, cell) => inner + cell.driftMinutes, 0),
      0
    );
    if (heatmapMetric === "drift") {
      setCount($("heatmap-total"), totalDrift, (value) => `${value} drift minutes across four example weeks`);
    } else {
      $("heatmap-total").textContent = "On-task minutes across four example weeks";
    }
    $("heatmap-caption").textContent =
      heatmapMetric === "drift"
        ? "Drift minutes by weekday and hour. Darker cells mean more drift."
        : "On-task minutes by weekday and hour. Darker cells mean more focused time.";
    $("legend-label").textContent = heatmapMetric === "drift" ? "Less drift" : "Less focus";
    $("legend-max").textContent = `max ${max} min`;
  }

  function renderWeakSpots() {
    const list = $("weak-spots");
    if (!list) return;
    list.replaceChildren();
    if (!WEAK.length) {
      const li = document.createElement("li");
      li.textContent = "No repeated window in this example log.";
      list.append(li);
      return;
    }
    for (const spot of WEAK) {
      const li = document.createElement("li");
      const strong = document.createElement("strong");
      strong.textContent = `${spot.weekdayLabel}, ${spot.hourLabel}`;
      const meta = document.createElement("span");
      meta.className = "mono";
      meta.textContent = `${spot.driftMinutes} min · ${spot.occurrences} of 4 weeks`;
      li.append(strong, meta);
      list.append(li);
    }
    if (WEAK[0]) {
      $("weak-summary").textContent = `${WEAK[0].weekdayLabel} ${WEAK[0].hourLabel} is the strongest pattern: ${WEAK[0].driftMinutes} drift minutes, mostly on ${WEAK[0].topDomain || "the listed site"}.`;
    }
  }

  document.querySelectorAll("[data-heatmap-metric]").forEach((button) => {
    button.addEventListener("click", () => {
      heatmapMetric = button.dataset.heatmapMetric;
      document.querySelectorAll("[data-heatmap-metric]").forEach((other) => {
        other.setAttribute("aria-pressed", other === button ? "true" : "false");
      });
      renderHeatmap();
    });
  });

  buildHourHeader();
  renderHeatmap();
  renderWeakSpots();

  /* ---------------------------------------------------------------------
     5. Focus Player preview
     --------------------------------------------------------------------- */

  const stage = $("player-stage");
  const posterMarkup = stage ? stage.innerHTML : "";

  function playerMessage(title, body, backLabel) {
    if (!stage) return;
    stage.replaceChildren();
    const box = document.createElement("div");
    box.className = "player-message";
    const heading = document.createElement("p");
    heading.textContent = title;
    const text = document.createElement("p");
    text.textContent = body;
    box.append(heading, text);
    if (backLabel) {
      const back = document.createElement("button");
      back.type = "button";
      back.textContent = backLabel;
      back.addEventListener("click", () => {
        stage.innerHTML = posterMarkup;
        wirePoster();
      });
      box.append(back);
    }
    stage.append(box);
  }

  function wirePoster() {
    const play = document.getElementById("player-play");
    play?.addEventListener("click", () => {
      playerMessage(
        "Playback uses the privacy-enhanced embed.",
        "In the extension this frame becomes the video from youtube-nocookie.com, with related videos off (rel=0), no annotation cards and no sidebar. This page does not load YouTube, on purpose.",
        "Back to the preview"
      );
      document.querySelector(".player-message button")?.focus();
    });
  }

  wirePoster();

  $("player-search-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const query = $("player-query").value.trim();
    playerMessage(
      query ? `Search is a preview on this page.` : "Type a topic first.",
      query
        ? `In the extension, \u201c${query}\u201d would go to the YouTube Data API from the service worker, with your key, and the results would play here. This page does not make that request.`
        : "The real search needs your own YouTube API key. Add one in Settings and results appear in this player.",
      "Back to the preview"
    );
  });
}
