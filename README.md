# 🟢 CRM Free Agents Monitor

A browser bookmarklet that parses a DayPilot Scheduler-based CRM in real time and instantly shows which support agents are currently free — without any backend, installation, or API access required.

**Built for:** Internal support team dispatchers who previously had to manually scroll through 40+ agent dashboards to find available agents.

---

## The Problem

Our support team uses a custom CRM built on [DayPilot Scheduler](https://javascript.daypilot.org/). The dispatcher on the hotline needed to assign incoming tickets to free agents — but had to manually scroll through all 40+ agent rows, read their timelines, and figure out who wasn't busy at the current moment.

With agents grouped into categories, virtual scrolling (only visible rows are rendered), and no built-in "availability" view — this was slow and error-prone.

## The Solution

A single bookmarklet click that:

1. Finds the red "current time" line in the scheduler (`scheduler_default_separator`)
2. Reads all agent rows from the **"Агенты технической поддержки"** group
3. Checks which agents have **no active event** intersecting the current time (using `getBoundingClientRect` for Y-axis matching and `style.left`/`width` for X-axis time matching)
4. Renders a floating panel with free ✓ and busy ✗ agents, live counters, and a **→ scroll-to** button per agent
5. Auto-refreshes every **30 seconds**

No backend. No API. No installation. Works entirely from the browser session that's already authenticated through OpenVPN + certificate.

---

## Demo

👉 **[Live Demo →](https://YOUR_USERNAME.github.io/crm-free-agents)**

The demo simulates a DayPilot Scheduler with randomized agent schedules so you can see the bookmarklet in action without access to the actual CRM.

---

## How to Install

### Bookmarklet (recommended)

1. Copy the contents of [`bookmarklet.js`](./bookmarklet.js)
2. Create a new bookmark in your browser
3. Paste the code as the bookmark URL
4. Navigate to the CRM scheduler page
5. Click the bookmark — the panel appears instantly

---

## How It Works

```
CRM Page (DayPilot Scheduler)
        │
        ▼
 Find .scheduler_default_separator
 → get current time position (px)
        │
        ▼
 Find all .scheduler_default_rowheader_inner
 → filter to "Агенты технической поддержки" group
 → skip "Общий Пул"
        │
        ▼
 For each agent row:
   getBoundingClientRect() → Y range
   For each .scheduler_default_event:
     check Y overlap (same row?)
     check X overlap (intersects now?)
        │
        ▼
 Render floating panel
 Free agents ✓ | Busy agents ✗
 Auto-refresh every 30s
```

### Virtual Scroll Challenge

DayPilot uses virtual scrolling — only visible rows are rendered in the DOM. To handle the **→ scroll-to** button, the script:
- Pre-computes each agent's scroll position by **accumulating row heights** (`offsetHeight`) from the top
- Sets `scrollTop` directly on both `scheduler_default_rowheader_scroll` and `scheduler_default_scrollable` containers simultaneously
- Waits 350ms for the virtual DOM to re-render, then highlights the newly rendered row

---

## Technical Stack

- **Vanilla JavaScript** — no dependencies, no build step
- **DOM API** — `querySelectorAll`, `getBoundingClientRect`, `scrollTop`
- **Browser Bookmarklet** — runs in the existing authenticated session
- Works with **DayPilot Scheduler** (the underlying CRM component)
- Tested on **Firefox** and **Chrome**

---

## Files

```
crm-free-agents/
├── bookmarklet.js    # The bookmarklet source (minified, ready to use)
├── bookmarklet.dev.js # Readable source with comments
└── README.md
```

---

## Why This Matters

- **Zero infrastructure** — runs client-side in an already-authenticated browser session, bypassing VPN/certificate complexity entirely
- **Handles virtual scrolling** — correctly navigates a virtualized list where most DOM nodes don't exist until scrolled into view
- **Real-time** — auto-refreshes from live DOM state, not a snapshot
- **Non-invasive** — read-only, adds only a floating UI element, leaves the CRM untouched

---

*Built as a productivity tool for a real support operations team.*
