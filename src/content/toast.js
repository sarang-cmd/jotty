/**
 * The corner nudge. Lives in a closed shadow root so a page's CSS cannot move
 * it, restyle it or read its internals. The toast is not modal: the page keeps
 * working, and keyboard users can tab to its buttons.
 */

import { mascotSvg, arrowSvg } from "../ui/mark.js";

const HOST_ID = "jotty-nudge-host";

function styles() {
  const fontUrl = chrome.runtime.getURL("fonts/PublicSans-Regular.woff2");
  const fontMedium = chrome.runtime.getURL("fonts/PublicSans-Medium.woff2");
  const serifUrl = chrome.runtime.getURL("fonts/InstrumentSerif-Regular.woff2");
  return `
  @font-face { font-family: "Jotty Sans"; src: url("${fontUrl}") format("woff2"); font-weight: 400; font-display: swap; }
  @font-face { font-family: "Jotty Sans"; src: url("${fontMedium}") format("woff2"); font-weight: 500; font-display: swap; }
  @font-face { font-family: "Jotty Serif"; src: url("${serifUrl}") format("woff2"); font-weight: 400; font-display: swap; }
  :host { all: initial; }
  .toast {
    position: fixed;
    right: 18px;
    bottom: 18px;
    z-index: 2147483646;
    width: 352px;
    max-width: calc(100vw - 32px);
    background: #fbf9f4;
    color: #1c231e;
    border: 1px solid #d8d1c3;
    border-radius: 6px;
    box-shadow: 0 18px 40px -26px rgba(20, 26, 21, 0.55);
    font-family: "Jotty Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-size: 13.5px;
    line-height: 1.5;
    animation: rise 180ms ease-out;
    display: grid;
    grid-template-columns: 40px minmax(0, 1fr) 22px;
    gap: 10px;
    padding: 13px 12px 12px 13px;
  }
  @keyframes rise { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
  @media (prefers-reduced-motion: reduce) { .toast { animation: none; } }
  .mark { padding-top: 2px; }
  .meta {
    font-size: 10.5px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #68736a;
    display: flex;
    gap: 6px;
    align-items: center;
    margin-bottom: 3px;
  }
  .dot { width: 5px; height: 5px; border-radius: 50%; background: #a05f3c; display: inline-block; }
  .dot[data-verdict="adjacent"] { background: #9a7228; }
  .title {
    font-family: "Jotty Serif", Georgia, serif;
    font-size: 19px;
    line-height: 1.2;
    margin: 0 0 4px;
    letter-spacing: -0.005em;
  }
  .reason {
    margin: 0 0 10px;
    color: #3d473f;
    font-size: 12.5px;
  }
  .actions { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
  button {
    font: inherit;
    cursor: pointer;
    border-radius: 4px;
    border: 1px solid #c2b9a8;
    background: transparent;
    color: #1c231e;
    padding: 5px 9px;
    min-height: 30px;
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }
  button:hover { background: #ece7dc; }
  button:focus-visible { outline: 2px solid #47624b; outline-offset: 2px; }
  .primary {
    background: #1c231e;
    border-color: #1c231e;
    color: #fbf9f4;
    font-weight: 500;
  }
  .primary:hover { background: #33493a; border-color: #33493a; }
  .quiet {
    border-color: transparent;
    color: #68736a;
    padding-left: 4px;
    padding-right: 4px;
  }
  .quiet:hover { background: transparent; color: #1c231e; text-decoration: underline; text-underline-offset: 2px; }
  .close {
    align-self: start;
    border: 0;
    padding: 2px;
    min-height: 22px;
    width: 22px;
    color: #68736a;
    font-size: 16px;
    line-height: 1;
    justify-content: center;
  }
  .close:hover { background: transparent; color: #1c231e; }
  .note { margin: 8px 0 0; font-size: 12px; color: #47624b; }
  .note:empty { display: none; }
  `;
}

export function createNudge(options = {}) {
  let host = document.getElementById(HOST_ID);
  let root = null;
  let toast = null;
  let hideTimer = null;

  function unmount() {
    clearTimeout(hideTimer);
    host?.remove();
    host = null;
    root = null;
    toast = null;
  }

  function show(judgement, handlers = {}) {
    unmount();
    host = document.createElement("div");
    host.id = HOST_ID;
    host.style.setProperty("all", "initial", "important");
    root = host.attachShadow({ mode: "closed" });
    const style = document.createElement("style");
    style.textContent = styles();
    root.append(style);

    const verdictLabel =
      judgement.verdict === "adjacent" ? "Related, off task" : "Off task";
    const reason = (judgement.reasons && judgement.reasons[0]) || "This page is not the assignment.";

    toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    toast.innerHTML = `
      <div class="mark">${mascotSvg(38)}</div>
      <div>
        <div class="meta"><span class="dot" data-verdict="${judgement.verdict}"></span>${verdictLabel} \u00b7 ${escapeHtml(judgement.host || "")}</div>
        <p class="title">${escapeHtml(judgement.coachLine || "This is not the assignment.")}</p>
        <p class="reason">${escapeHtml(reason)}</p>
        <div class="actions">
          <button type="button" class="primary" data-action="back">Back to task ${arrowSvg()}</button>
          <button type="button" data-action="snooze">Snooze</button>
          <button type="button" class="quiet" data-action="helpful">This helps</button>
        </div>
        <p class="note" data-note></p>
      </div>
      <button type="button" class="close" data-action="close" aria-label="Dismiss nudge">&times;</button>
    `;
    root.append(toast);

    const note = toast.querySelector("[data-note]");
    toast.addEventListener("click", async (event) => {
      const button = event.target.closest("[data-action]");
      if (!button) return;
      const action = button.dataset.action;
      if (action === "close") {
        handlers.onDismiss?.();
        unmount();
      }
      if (action === "back") {
        button.disabled = true;
        await handlers.onBack?.();
        unmount();
      }
      if (action === "snooze") {
        handlers.onSnooze?.();
        note.textContent = `Quiet for ${options.snoozeMinutes || 10} minutes.`;
        setTimeout(unmount, 1400);
      }
      if (action === "helpful") {
        button.disabled = true;
        await handlers.onHelpful?.();
        note.textContent = "Noted. This stays on your device.";
      }
    });

    document.documentElement.append(host);
    hideTimer = setTimeout(() => {
      if (handlers.onTimeout) handlers.onTimeout();
    }, 30000);
  }

  return { show, hide: unmount, isVisible: () => Boolean(host?.isConnected) };
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
