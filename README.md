# 🟢 CRM Free Agents Monitor

A browser bookmarklet that parses a DayPilot Scheduler-based support CRM in real time and instantly shows which support agents are free, busy, or on break — without any backend, API, or installation.

**Built for:** Internal support team dispatchers who previously had to manually scroll through 40+ agent dashboards to figure out who's available right now.

**[Live Demo →](https://presentation.web1337.net/)**

---

## The Problem

Our support team uses a custom CRM built on [DayPilot Scheduler](https://javascript.daypilot.org/). The dispatcher on the hotline needs to assign incoming tickets to free agents, but had to:

- Manually scroll through all 40+ agent rows
- Read each agent's timeline at the current time
- Mentally distinguish between "active work" colors and "background activity" colors (calls vs PC maintenance vs breaks)
- Track who's about to go on break and who's just back

With virtual scrolling rendering only ~20 rows at a time, this was slow and error-prone.

## The Solution

A single bookmarklet click that produces a floating panel categorizing every active agent into:

- ✓ **Free** — currently available
- ◷ **Soon busy** — has a blocking task starting in ≤15 minutes
- ☕ **On break / break soon** — with countdown (`ещё ~5м` or `через ~10м`)
- ✗ **Busy** — has an active blocking task right now

The panel includes per-agent **→** buttons that scroll the CRM scheduler directly to that agent's row and highlight it. Auto-refreshes every 2 minutes.

No backend. No API. Works entirely from the existing authenticated session.

---

## How It Works

The CRM is a DayPilot Scheduler with virtual scrolling. The bookmarklet does five things:

1. **Programmatically scrolls** through the virtualized list, dispatching `scroll` events so DayPilot renders each batch, collecting all agent rows and their absolute Y-positions
2. **Filters to the target group** by finding the `"Агенты технической поддержки"` header and slicing until the next group
3. **Skips inactive agents** — those with no events in a ±1 hour window from "now" (days off, ended shift)
4. **For each event near the red current-time line**, classifies the colored event block:
   - Reads the `rgb(...)` background of `.scheduler_default_event_inner`
   - Compares against a whitelist of "busy" colors (purple, yellow, black, orange break, etc.)
   - Disambiguates navy `rgb(25, 25, 112)` between PC maintenance (wide blocks, free) and hotline (narrow blocks ≤50px, busy)
   - Treats the orange border `rgb(211, 84, 0)` as a secondary "active right now" signal
5. **Computes time-to-event** in minutes from pixel offsets (72px = 1 hour), powering the `~Xм` countdown labels

### Color Reference

The CRM legend has 17 task types. They classify as:

| Task | Color | Status |
|------|-------|--------|
| Обзвон / Обзвон ГЛ | `#008000` green | Free (background activity) |
| Тех. обслуживание | `#191970` navy (wide) | Free |
| Тех. работы ГЛ | `#191970` navy (narrow) | **Busy** (hotline) |
| Перерыв | `#bc5e00` orange | **Break** |
| Аудит, Обучение, Знакомство, Потенциальный клиент, Новый+ТО, Работа со смартфоном, Курсы | various | **Busy** |
| Прочее | `#cd5c5c` light red (wide) | **Busy** |
| Прочее | `#cd5c5c` light red (narrow) | Free |

---

## Install

Two ways to install:

### A. Drag-to-install (recommended)
1. Open the [demo page](https://presentation.web1337.net/)
2. Drag the **🟢 Free Agents Monitor** button to your bookmarks bar
3. Open the CRM scheduler page and click the bookmark

### B. Manual
1. Copy the contents of [`bookmarklet.js`](./bookmarklet.js)
2. Create a new bookmark in your browser
3. Paste the code as the bookmark URL
4. Open the CRM scheduler and click the bookmark

A floating dark panel appears in the top-right corner. It auto-refreshes every 2 minutes; click **↺ Обновить** to force-refresh.

---

## Why This Is Interesting

- **Zero infrastructure** — runs client-side in an already-authenticated browser session, bypassing VPN + client-certificate auth complexity entirely
- **Handles virtual scrolling** — most DOM nodes don't exist until scrolled into view. The script programmatically scrolls the container in 400px steps with synthetic `scroll` events, collects state, then restores the original scroll position
- **Multi-signal activity detection** — combines current-time-line intersection, orange-border markers from the CRM, and color-width rules for ambiguous navy blocks
- **Domain-aware** — encodes the team's actual workflow (which task types occupy a tech vs. which are background) rather than naive "any event = busy"
- **Real-time** — reads live DOM state, not a snapshot
- **Non-invasive** — read-only; adds only a floating UI element, leaves the CRM untouched

---

## Tech Stack

- Vanilla JavaScript — no dependencies, no build step
- DOM API: `querySelectorAll`, `getBoundingClientRect`, `getComputedStyle`, `dispatchEvent`
- Single-file browser bookmarklet (`javascript:` URL)
- Tested on Firefox and Chrome

## Files

```
crm-free-agents/
├── index.html              # GitHub Pages demo page
├── bookmarklet.js          # Production bookmarklet (paste as bookmark URL)
├── assets/css/             # Modular styles
│   ├── base.css
│   ├── layout.css
│   ├── components.css
│   ├── demo.css
│   └── animations.css
└── assets/js/              # Modular demo scripts
    ├── main.js
    ├── demo.js
    ├── panel.js
    └── bookmarklet-source.js
```

---

*Built as a productivity tool for a real support operations team.*
