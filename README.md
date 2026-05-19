# 🟢 CRM Free Agents Monitor

A browser bookmarklet that instantly categorizes all support agents in a DayPilot Scheduler CRM — no backend, no API, no installation required.

**[Live Demo & Install →](https://presentation.web1337.net/)**

---

## The Problem

Our support team uses a custom CRM built on [DayPilot Scheduler](https://javascript.daypilot.org/). The dispatcher needs to assign incoming tickets to available agents, but had to:

- Manually scroll through 40+ agent rows
- Read each agent's color-coded timeline at the current time
- Figure out who's on break, who's about to go on break, who's finishing up
- Mentally track which task colors mean "busy" vs "background activity"

With virtual scrolling rendering only ~20 rows at a time, this was slow and error-prone during high call volume.

## The Solution

One bookmarklet click produces a floating panel that categorizes every active agent in priority order:

| Priority | Status | Label | Meaning |
|----------|--------|-------|---------|
| 1 | ✅ | **Свободны** | Available right now |
| 2 | ⏳ | **Скоро свободны** | Busy now, but freeing up in ≤15 min |
| 3 | 🕒 | **Скоро заняты** | Free now, blocking task in ≤15 min |
| 4 | ☕  | **Перерыв** | On break now or break starting in ≤15 min |
| 5 | ❌ | **Заняты** | Actively occupied right now |

Each agent has a **→** button that scrolls the CRM directly to their row and highlights it. The panel auto-refreshes every 2 minutes. The **↺ Обновить** button re-scans immediately.

No agent appears in more than one category — priority is strict.

---

## Install

### Drag to bookmarks bar (recommended)
1. Open the [demo page](https://presentation.web1337.net/)
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
Finds the `"Агенты технической поддержки"` row header and collects all agents until the next group (Руководители, TeamLider, etc.). Skips "Общий Пул".

### 3. Activity window filter
Drops anyone with no events in a **±1 hour window** from the current time — days off, ended shifts, not started yet.

### 4. Event classification

For each event block, reads `rgb(...)` background of `.scheduler_default_event_inner`:

| Task | Color | Status |
|------|-------|--------|
| Обзвон / Обзвон ГЛ | `#008000` green | Free |
| Тех. обслуживание (ТО ПК) | `#191970` navy, wide >50px | Free |
| Тех. работы ГЛ | `#191970` navy, narrow ≤50px | **Busy** |
| Перерыв | `#bc5e00` orange | **Break** / Скоро свободны |
| Аудит | `#00bc9d` teal | **Busy** / Скоро свободны |
| Обучение / Обучение ГЛ | `#800080` purple | **Busy** / Скоро свободны |
| Знакомство | `#3a87ad` blue | **Busy** |
| Потенциальный клиент | `#f9f89e` yellow | **Busy** |
| Новый+ТО | `#f5dd05` yellow | **Busy** / Скоро свободны |
| Работа со смартфоном | `#151515` black | **Busy** / Скоро свободны |
| Курсы | `#acb78e` olive | **Busy** |
| Прочее (≥31 мин) | `#cd5c5c` red, ≥37px | **Busy** |
| Прочее (<31 мин) | `#cd5c5c` red, <37px | Free |

### 5. "Скоро свободны" detection
If a busy task (Аудит, Новый+ТО, Перерыв, Работа со смартфоном, Обучение) is currently active but ends within **≤15 minutes** — agent goes to "Скоро свободны" instead of "Заняты". Shows "(ещё ~Xм)". Sorted: soonest-to-free first. Not duplicated in any other category.

### 6. Active task detection
Two signals determine if an event is happening **right now**:
- The event block **intersects the red current-time line** (±2px tolerance, ±10px for breaks)
- The event has an **orange border** `rgb(211, 84, 0)` on its inner element (CRM's "active now" marker)

Breaks use line-intersection only — the CRM doesn't always add an orange border to break blocks.

### 7. Timing labels
- Break in progress: **"ещё ~Xм"** (time until break ends)
- Break coming soon: **"через ~Xм"** (time until break starts)
- Soon busy: **"~Xм"** (time until blocking task starts)
- Soon free: **"ещё ~Xм"** (time until current task ends)

72px = 1 hour. All times computed from pixel offsets: `px / (72/60)`.

### 8. Scroll-to-agent
The **→** button programmatically scrolls the CRM to the agent's row and centers it in the visible area, then highlights it with a blue outline for 2.5 seconds.

---

## Tech Stack

- **Vanilla JavaScript** — no dependencies, no build step, no npm
- **DOM APIs**: `querySelectorAll`, `getComputedStyle`, `dispatchEvent`, `scrollTo`
- **Single-file bookmarklet** (`javascript:` URL, ~14KB)
- Tested on **Firefox** and **Chrome**

## Repo Structure

```
crm-free-agents/
├── bookmarklet.js          # Production bookmarklet
└── README.md

```

## Key Parameters

| Constant | Value | Meaning |
|----------|-------|---------|
| `SOON_BUSY_PX` | 18px | ~15 min lookahead for "soon busy" |
| `SOON_FREE_PX` | 18px | ~15 min lookbehind for "soon free" |
| `ACTIVE_WINDOW_PX` | 72px | ±1 hour activity filter |
| `HOTLINE_MAX_WIDTH` | 50px | Navy ≤50px = hotline (busy) |
| `MISC_WIDE_THRESHOLD` | 37px | Прочее ≥37px (~31 min) = busy |
| `EDGE_TOLERANCE` | 2px | Line-crossing tolerance |
| `BREAK_TOLERANCE` | 10px | Break detection tolerance |

---

*Built as a real productivity tool for a support operations team.*
