# Jotty privacy policy

**Effective 29 October 2026 · Version 1.0 · Applies to the Jotty extension and this website**

Jotty has no backend. There is no account, no analytics, no crash reporting and no developer server that could receive your data. This document describes, field by field, what the extension stores, what it sends, and how to remove it.

> **Draft for review.** This policy is written to match the shipped code, but it has not been reviewed by a lawyer. Before a public store release, the operator should confirm the contact route, retention wording and the governing-law section of the [Terms of Service](terms.html).

## Who runs Jotty

Jotty is an independent open-source project published by the developer of the [sarang-cmd/jotty](https://github.com/sarang-cmd/jotty) repository. There is no company, no team and no support inbox behind it. Questions and data requests happen through GitHub issues, which are public by nature; do not post personal data there.

## What the extension stores

Everything below is stored with `chrome.storage.local` inside your browser profile. It does not sync to your Google account and is not readable by other extensions.

| Field | What it contains | Why |
| :--- | :--- | :--- |
| Session | Task line, subject, optional deadline, start and end time, optional task address. | The judge needs a task. The nudge needs a way back. |
| Habit slices | Date, hour, domain, seconds, whether the time was on task. | The heatmap and weak spot ranking. |
| Events | Domain, URL, page title, channel name (YouTube only), verdict, action taken. | The next morning's questions. |
| Reflections | Selected answers, optional free text, the generated plan. | So the conversation does not restart on every open. |
| Settings | Site lists, trusted channels, session length, reminder hour, strict mode. | Your configuration. |
| Feedback | Domain, verdict and task attached to a "This helps" click. | So a misjudgement can be reviewed locally. |
| API key | Your YouTube Data API key, in a separate storage key. | Focus Player search. Excluded from exports. |
| Quota counter | A date and a unit count. | To show what today's searches cost. |

## What Jotty never collects

- Page content, article text, video transcripts, comments or feeds.
- Keystrokes, clipboard contents, form values, passwords or payment details.
- Screenshots, camera, microphone or location.
- Your name, email address, school or Google account identity.
- Analytics identifiers, advertising identifiers, or a Jotty user id.

The content script reads exactly three fields from a page: `document.title`, `location.href`, and on YouTube the channel name. It also reads the page's description meta tag as a fallback signal. It does not walk the page body.

## Permissions, and why each exists

| Permission | Reason |
| :--- | :--- |
| `storage` | Holds the session, log, reflection and settings. Required for every feature. |
| `alarms` | Session-end and morning-reflection reminders. No background polling. |
| `notifications` | One optional morning notification and one when a session ends. |
| `https://www.googleapis.com/*` | The YouTube Data API, used only when you start a Focus Player search. |
| Content script on http and https pages | Needed to judge the page you are on during a session. With no session running, nothing is judged and nothing is logged. |

## When data leaves your browser

There are exactly two cases, and both are started by you.

1. **Focus Player search.** Your search text and API key are sent to `www.googleapis.com` because that is the YouTube Data API. Google receives the query, your key and the usual request metadata such as your IP address. The key is read only inside the extension's service worker and is never included in an export.
2. **Video playback.** When you press play, your browser requests the embed from `www.youtube-nocookie.com`, Google's privacy-enhanced YouTube embed. Google may set cookies or receive request data under its own policies. Jotty does not send your task, log or reflections with that request.

This website is static and self-hosted on Vercel. It loads no analytics, no third-party scripts, no remote fonts and no embed. The host may keep standard access logs under its own policy. Fonts are served from this domain.

## YouTube API Services

The Focus Player uses YouTube API Services. By using that feature you also agree to the [YouTube Terms of Service](https://www.youtube.com/t/terms) and acknowledge the [Google Privacy Policy](https://policies.google.com/privacy). Jotty does not store YouTube account data, watch history or video metadata beyond what is rendered in the player page at that moment. Search results are cached in memory for thirty minutes inside the service worker and disappear when the browser closes.

## Retention

- Habit days and events older than ninety days are pruned automatically.
- Reflections are kept until you delete them or clear all data.
- The API key stays until you remove it in Settings.
- Uninstalling the extension removes its local storage, subject to your browser's own cleanup.

## Export and deletion

Settings → Your data exports a readable JSON file of the session, log, events, reflections and settings. The same page deletes everything after you type `DELETE`. Both actions happen in your browser; neither contacts a server.

## Security, stated plainly

Local storage is protected by your operating system profile, not by Jotty's own encryption. Anyone with access to your unlocked browser profile can read it. The API key is isolated in the service worker so page scripts never receive it, and the extension refuses to return it outside that context. On a shared computer, remove the key after use.

## Children

Jotty is a study tool for secondary school and university students. It has no account, no social features and no way to contact another person. It does not knowingly collect personal information from anyone, because it does not collect personal information at all.

## Changes

Material changes appear on this page and in the repository history before a release. The effective date at the top always matches the shipped version.
