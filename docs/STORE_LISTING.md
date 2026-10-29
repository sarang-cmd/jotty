# Chrome Web Store listing copy

Draft copy for the store form. Nothing here has been submitted. Availability of the name Jotty, and the listing itself, have not been checked against the Chrome Web Store.

## Name

Jotty: AI Study Focus & Reflection

## Short description (132 characters max)

Judges the page against your task, nudges you back when you drift, and asks about it the next morning. Local only, no account.

## Detailed description

Jotty is a study focus coach for Chrome. It does not block the internet. It compares the page in front of you with the task you set, tells you what it sees, and asks a few useful questions the next morning.

**A focus session with a real task**
Set a task that names the assignment, not just the subject. Set a deadline if there is one. Jotty judges pages only while a session is running.

**A judge that explains itself**
Every page gets one of three verdicts: on task, related off task, or off task. The nudge tells you why. A video about Teflon is chemistry, but it is not gas stoichiometry, so the card says so and offers a way back.

**A nudge, not a wall**
A small corner card appears in the page. Go back to the task, snooze for ten minutes, or tell Jotty the page was fine. Blocked sites get an optional delay screen instead of an instant block.

**A morning reflection**
The next morning, Jotty asks about yesterday's flagged session: the time, the site, the page, the moment before you clicked. Then it offers one plan based on the window where you drift most.

**A weak spot report**
A weekday by hour heatmap of on-task and drifting minutes, ranked by where drift actually clusters. Not total screen time.

**A quieter way to watch a video**
The Focus Player searches chemistry, biology, physics, maths and other subjects without the YouTube feed. Trusted channels rank first, and playback uses the privacy-enhanced embed with no sidebar and no recommendation queue. It is free and has no ads. Search needs your own free YouTube Data API key; the extension includes a guide for creating one.

**Private by construction**
No account. No server. No analytics. Session logs, reflections and settings stay in your browser profile. The API key is read only inside the extension's service worker and is never included in exports. Two network requests exist and both start with you: a player search, and a video embed when you press play.

## Category

Productivity

## Language

English

## Permission justifications

| Permission | Justification |
| :--- | :--- |
| `storage` | Stores the focus session, local habit log, reflections and settings. The extension has no backend. |
| `alarms` | Schedules the session-end check and the single daily reflection reminder. |
| `notifications` | Optional session-end notice and the morning reflection notice. |
| Host permission `https://www.googleapis.com/*` | YouTube Data API search for the Focus Player, triggered only by the user. |
| Content script on http and https | Reads `document.title`, `location.href` and the YouTube channel name so the page can be judged during a session. It does not read page content. |

No `<all_urls>` host permission is requested. The content script match pattern is the only broad scope, and it is required to know the current page during a session.

## Single purpose statement

Jotty judges the page you are on against a study task you set, shows a local focus report, and generates a next-morning reflection about the previous day.

## Remote code

None. All JavaScript is bundled in the package. No remote scripts, no eval, no external UI libraries.

## Data usage disclosures

- Does not collect personally identifiable information.
- Does not collect health, financial, authentication or personal communications data.
- Stores website activity locally (domains, page titles, timestamps) and does not transmit it.
- Does not sell data, does not use data for advertising, does not use data for credit or lending.

## Assets

| Asset | File |
| :--- | :--- |
| Store icon 128x128 | `store-assets/store-icon-128.png` |
| Screenshot 1, nudge | `store-assets/screenshot-01-nudge.png` (1280x800) |
| Screenshot 2, morning reflection | `store-assets/screenshot-02-morning-reflection.png` (1280x800) |
| Screenshot 3, Focus Player | `store-assets/screenshot-03-focus-player.png` (1280x800) |
| Screenshot 4, settings | `store-assets/screenshot-04-settings.png` (1280x800) |
| Small promo tile | `store-assets/small-promo-440x280.png` (440x280) |
| Marquee promo tile | not supplied |

The screenshots are interface previews rendered from the shipped palette and type by `tools/build-previews.mjs`. They are not photographs of a live browser session. Replace them with real captures before submitting if the store reviewer expects live UI.

## Privacy policy URL

`https://jotty.vercel.app/privacy-policy.html`

## Support URL

`https://github.com/sarang-cmd/jotty/issues`
