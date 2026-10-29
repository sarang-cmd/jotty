/**
 * The soft block. A deliberate eight second gap, not a punishment: enough time
 * to notice the tab you just opened, short enough to keep working.
 *
 * Strict mode removes the override and keeps "end the session" as the honest
 * exit. The overlay traps focus while it is open.
 */

import { mascotSvg, arrowSvg } from "../ui/mark.js";

const HOST_ID = "jotty-block-host";

function styles() {
  const sans = chrome.runtime.getURL("fonts/PublicSans-Regular.woff2");
  const sansMedium = chrome.runtime.getURL("fonts/PublicSans-Medium.woff2");
  const serif = chrome.runtime.getURL("fonts/InstrumentSerif-Regular.woff2");
  return `
  @font-face { font-family: "Jotty Sans"; src: url("${sans}") format("woff2"); font-weight: 400; font-display: swap; }
  @font-face { font-family: "Jotty Sans"; src: url("${sansMedium}") format("woff2"); font-weight: 500; font-display: swap; }
  @font-face { font-family: "Jotty Serif"; src: url("${serif}") format("woff2"); font-weight: 400; font-display: swap; }
  :host { all: initial; }
  .wrap {
    position: fixed;
    inset: 0;
    z-index: 2147483647;
    background: #f4f1ea;
    color: #1c231e;
    font-family: "Jotty Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-size: 15px;
    line-height: 1.55;
    display: grid;
    place-items: center;
    padding: 24px;
    overflow-y: auto;
  }
  .card {
    width: min(560px, 100%);
    background: #fbf9f4;
    border: 1px solid #d8d1c3;
    border-radius: 7px;
    padding: 30px 30px 26px;
  }
  .mark { display: flex; align-items: center; gap: 10px; margin-bottom: 18px; }
  .mark span {
    font-family: "Jotty Serif", Georgia, serif;
    font-size: 20px;
    letter-spacing: -0.01em;
  }
  .eyebrow {
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #68736a;
    margin: 0 0 6px;
  }
  h1 {
    font-family: "Jotty Serif", Georgia, serif;
    font-weight: 400;
    font-size: clamp(28px, 5vw, 38px);
    line-height: 1.1;
    letter-spacing: -0.015em;
    margin: 0 0 10px;
  }
  .task {
    border-left: 2px solid #7c9a76;
    padding-left: 12px;
    margin: 16px 0;
    color: #3d473f;
    font-size: 13.5px;
  }
  .task strong { display: block; color: #1c231e; font-weight: 500; }
  .reason { color: #3d473f; margin: 0 0 16px; font-size: 14px; }
  .actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
  button {
    font: inherit;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    border-radius: 4px;
    border: 1px solid #c2b9a8;
    background: transparent;
    color: #1c231e;
    padding: 9px 14px;
    min-height: 40px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  button:hover { background: #ece7dc; border-color: #3d473f; }
  button:focus-visible { outline: 2px solid #47624b; outline-offset: 2px; }
  button.primary { background: #1c231e; border-color: #1c231e; color: #fbf9f4; }
  button.primary:hover { background: #33493a; border-color: #33493a; }
  button[disabled] { opacity: 0.55; cursor: not-allowed; }
  button.quiet { border-color: transparent; color: #68736a; padding-left: 4px; padding-right: 4px; }
  button.quiet:hover { background: transparent; text-decoration: underline; text-underline-offset: 2px; color: #1c231e; }
  .foot { margin-top: 18px; font-size: 12px; color: #68736a; }
  .count { font-variant-numeric: tabular-nums; }
  `;
}

export function createBlocker() {
  let host = null;
  let root = null;
  let previousOverflow = "";

  function close() {
    if (!host) return;
    host.remove();
    host = null;
    root = null;
    document.documentElement.style.overflow = previousOverflow;
    document.documentElement.style.removeProperty("overflow");
  }

  function show(judgement, handlers = {}) {
    close();
    previousOverflow = document.documentElement.style.overflow;
    host = document.createElement("div");
    host.id = HOST_ID;
    root = host.attachShadow({ mode: "closed" });
    const style = document.createElement("style");
    style.textContent = styles();
    root.append(style);

    const strict = Boolean(handlers.strict);
    const delay = Math.max(3, Number(handlers.delaySeconds) || 8);
    const hostName = judgement.host || "this site";
    const task = handlers.task || "the assignment";
    const reason =
      (judgement.reasons && judgement.reasons[0]) ||
      `${hostName} is not part of \u201c${task}\u201d.`;

    const wrap = document.createElement("div");
    wrap.className = "wrap";
    wrap.setAttribute("role", "dialog");
    wrap.setAttribute("aria-modal", "true");
    wrap.setAttribute("aria-labelledby", "jotty-block-title");
    wrap.innerHTML = `
      <div class="card">
        <div class="mark">${mascotSvg(34)}<span>Jotty</span></div>
        <p class="eyebrow">${strict ? "Strict mode" : "Focus session"} \u00b7 ${escapeHtml(hostName)}</p>
        <h1 id="jotty-block-title">This is the doorway.</h1>
        <div class="task"><strong>Your task</strong>${escapeHtml(task)}</div>
        <p class="reason">${escapeHtml(reason)}</p>
        <div class="actions">
          <button type="button" class="primary" data-action="back">Back to the assignment ${arrowSvg()}</button>
          ${
            strict
              ? `<button type="button" data-action="end">End the session</button>`
              : `<button type="button" data-action="continue" disabled>Continue in <span class="count">${delay}</span>s</button>`
          }
        </div>
        <p class="foot">${
          strict
            ? "Strict mode has no override. Ending the session is the only way through."
            : "Continuing is allowed. Jotty logs the choice, nothing else."
        }</p>
      </div>
    `;
    root.append(wrap);
    document.documentElement.style.overflow = "hidden";
    document.documentElement.append(host);

    const continueButton = wrap.querySelector('[data-action="continue"]');
    const focusables = () => [...wrap.querySelectorAll("button:not([disabled])")];
    const primary = wrap.querySelector('[data-action="back"]');
    primary?.focus();

    wrap.addEventListener("click", async (event) => {
      const button = event.target.closest("[data-action]");
      if (!button) return;
      const action = button.dataset.action;
      if (action === "back") {
        button.disabled = true;
        await handlers.onBack?.();
        close();
      }
      if (action === "continue") {
        handlers.onContinue?.();
        close();
      }
      if (action === "end") {
        button.disabled = true;
        await handlers.onEndSession?.();
        close();
      }
    });

    wrap.addEventListener("keydown", (event) => {
      if (event.key !== "Tab") return;
      const items = focusables();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    if (!strict && continueButton) {
      let left = delay;
      const timer = setInterval(() => {
        left -= 1;
        if (!continueButton.isConnected) {
          clearInterval(timer);
          return;
        }
        if (left <= 0) {
          clearInterval(timer);
          continueButton.disabled = false;
          continueButton.textContent = "Continue anyway";
        } else {
          continueButton.innerHTML = `Continue in <span class="count">${left}</span>s`;
        }
      }, 1000);
    }
  }

  return { show, close, isOpen: () => Boolean(host) };
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
