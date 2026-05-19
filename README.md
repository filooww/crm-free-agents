# 🟢 CRM Free Agents Monitor

A browser bookmarklet that instantly categorizes all support agents in a DayPilot Scheduler CRM — no backend, no API, no installation required.

**[Live Demo & Install →](https://filooww.github.io/crm-free-agents)**

---

## The Problem

Our support team uses a custom CRM built on [DayPilot Scheduler](https://javascript.daypilot.org/). The dispatcher needs to assign incoming tickets to available agents, but had to:

- Manually scroll through 40+ agent rows
- Read each agent's color-coded timeline at the current time
- Figure out who's on break, who's about to go on break, who's finishing up
- Mentally track which task colors mean "busy" vs "background activity"

With virtual scrolling rendering only ~20 rows at a time, this was slow and error-prone during high call volume.

## The Solution

One bookmarklet click produces a floating panel that categorizes every active agent:

| Status | Label | Meaning |
|--------|-------|---------|
| ✓ | **Свободны** | Available right now |
| ◷ | **Скоро заняты** | Free now, blocking task in ≤15 min |
| ☕ | **Перерыв** | On break now or break starting in ≤15 min |
| ✗ | **Заняты** | Actively occupied right now |

Each agent has a **→** button that scrolls the CRM directly to their row and highlights it. The panel auto-refreshes every 2 minutes. The **↺ Обновить** button re-scans immediately.

---

## Install

### Drag to bookmarks bar (recommended)
1. Open the [demo page](https://filooww.github.io/crm-free-agents)
2. Drag the **🟢 Free Agents Monitor** button to your bookmarks bar
3. Open the CRM and click the bookmark

### Manual
1. Copy the contents of [`bookmarklet.js`](./bookmarklet.js)
2. Create a new bookmark, paste the code as the URL
3. Open the CRM scheduler and click it

---

## How It Works

The bookmarklet runs entirely client-side in the existing authenticated browser session — no credentials to handle, no VPN config, no separate auth.

### 1. Virtual scroll traversal
DayPilot Scheduler only renders ~20 rows at a time. The script programmatically scrolls the container in 400px steps, dispatching synthetic `scroll` events so DayPilot renders each batch, then restores the original scroll position.

### 2. Group filtering
Finds the `"Агенты технической поддержки"` row header and collects all agents until the next group (Руководители, TeamLider, etc.). Skips "Общий Пул" and groups that aren't tech support.

### 3. Activity window filter
Drops anyone with no events in a **±1 hour window** from the current time — days off, ended shifts, not started yet. This avoids showing agents who are technically on the list but not working right now.

### 4. Event classification
For each event block near the current red time-line, reads the `rgb(...)` background of `.scheduler_default_event_inner` and classifies it:

| Task | Color | Status |
|------|-------|--------|
| Обзвон | `#008000` green | Free |
| Тех. обслуживание (ТО ПК) | `#191970` navy, wide (>50px) | Free |
| Тех. работы ГЛ | `#191970` navy, narrow (≤50px) | **Busy** |
| Перерыв | `#bc5e00` orange | **Break** |
| Аудит | `#00bc9d` teal | **Busy** |
| Обучение / Обучение ГЛ | `#800080` purple | **Busy** |
| Знакомство | `#3a87ad` blue | **Busy** |
| Потенциальный клиент | `#f9f89e` yellow | **Busy** |
| Новый+ТО | `#f5dd05` yellow | **Busy** |
| Работа со смартфоном | `#151515` black | **Busy** |
| Курсы | `#acb78e` olive | **Busy** |
| Прочее (wide) | `#cd5c5c` red, ≥30px | **Busy** |
| Прочее (narrow) | `#cd5c5c` red, <30px | Free |

Navy blocks are disambiguated by width: PC maintenance spans hours (wide), hotline calls are short (narrow).

### 5. Active task detection
Two signals determine if an event is happening **right now**:
- The event block **intersects the red current-time line** (with ±2px tolerance for breaks, ±10px for break blocks to catch "closed" breaks)
- The event has an **orange border** `rgb(211, 84, 0)` on its inner element (CRM's own "active now" marker)

Breaks use line-intersection only — the CRM doesn't always add an orange border to break blocks.

### 6. Soon-busy detection
Events starting within **18px of the current time line** (~15 minutes) trigger the ◷ "soon busy" category. Distance is converted to minutes: `px / (72/60)`.

### 7. Break timing
- Break in progress: shows **"ещё ~Xм"** (time until break ends)
- Break coming soon: shows **"через ~Xм"** (time until break starts)
- Sorted: soonest-to-end first

### 8. Scroll-to-agent
The **→** button re-uses the same programmatic scroll logic to jump the CRM to that agent's row, then highlights it with a blue outline for 2.5 seconds.

---

## Tech Stack

- **Vanilla JavaScript** — no dependencies, no build step, no npm
- **DOM APIs**: `querySelectorAll`, `getComputedStyle`, `dispatchEvent`, `scrollTo`
- **Single-file bookmarklet** (`javascript:` URL, ~13KB)
- Tested on **Firefox** and **Chrome**

## Repo Structure

```
crm-free-agents/
├── index.html              # GitHub Pages demo & install page
├── bookmarklet.js          # Production bookmarklet (paste as bookmark URL)
├── README.md
└── assets/
    ├── css/
    │   ├── base.css
    │   ├── layout.css
    │   ├── components.css
    │   ├── demo.css
    │   └── animations.css
    └── js/
        ├── demo.js         # Scheduler simulator with randomized agents
        └── panel.js        # Floating panel demo overlay
```

---

## Key Parameters (in bookmarklet.js)

| Constant | Value | Meaning |
|----------|-------|---------|
| `SOON_BUSY_PX` | 18px | ~15 min lookahead for "soon busy" |
| `ACTIVE_WINDOW_PX` | 72px | ±1 hour activity filter |
| `HOTLINE_MAX_WIDTH` | 50px | Navy blocks narrower than this = hotline (busy) |
| `MISC_WIDE_THRESHOLD` | 30px | Red "Прочее" blocks wider than this = busy |
| `EDGE_TOLERANCE` | 2px | Tolerance for line-crossing detection |
| `BREAK_TOLERANCE` | 10px | Wider tolerance for break detection |

---

*Built as a real productivity tool for a support operations team.*
