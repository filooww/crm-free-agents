# 🟢 CRM Free Agents Monitor

A browser bookmarklet that reads a DayPilot Scheduler CRM and tells you which support agents are free right now. No backend, no install, no API access.

**[Live demo & install →](https://presentation.web1337.net)**

---

## Why this exists

Our team uses a CRM built on [DayPilot Scheduler](https://javascript.daypilot.org/) where every agent has a color-coded timeline. When a ticket comes in, someone has to figure out who is free. That meant scrolling through 40+ rows, decoding the colors at the current time, and doing math in your head — who is finishing in five minutes, who is just starting something, who is on break and how long until they come back.

DayPilot also uses virtual scrolling so only the visible rows exist in the DOM. You scroll, the previous rows disappear, you forget what you saw. By the end of a shift your eyes hurt and you have made avoidable mistakes.

The bookmarklet does that work in one click.

## What you get

A floating panel on top of the CRM, with every active agent placed into one bucket and only one bucket:

| Status | Label | Meaning |
|--------|-------|---------|
| ✅ | **Свободны** | Available right now |
| ⏳ | **Скоро освободятся** | Busy, but a task ends within ~15 min |
| 🕒 | **Скоро будут заняты** | Free, but a blocking task starts within ~30 min |
| ☕ | **Перерыв** | On break, or break starts within ~30 min |
| ❌ | **Заняты** | Actively occupied right now |
| 🧑‍💻 | **На смене** | Total agents on shift (counter only) |

Each row has a **→** button that scrolls the CRM straight to that agent and highlights their row. The panel refreshes itself every two minutes, and the **↺ Обновить** button forces a fresh scan.

---

## Install

### From the demo page

Open [presentation.web1337.net](https://presentation.web1337.net), drag the green **Free Agents Monitor** button to your bookmarks bar. Open the CRM, click it.

### Safari

Safari does not accept drag-and-drop for `javascript:` bookmarks. Bookmark any page first, then open Bookmarks → Edit Bookmarks → right-click the new bookmark → Edit Address, and paste the contents of `bookmarklet.js` there.

### Manual

Copy [`bookmarklet.js`](./bookmarklet.js), create a bookmark with that code as the URL.

---

## How it actually works

The script runs inside the already-authenticated CRM tab. No credentials, no VPN config, nothing leaves the browser.

### Virtual scroll traversal

DayPilot renders maybe 20 rows at a time. The script remembers your scroll position, then walks down the scheduler in 400px steps and dispatches synthetic `scroll` events so DayPilot renders each batch. Every batch gets snapshotted (agent name, row top/bottom, every event block on that row), and at the end the original scroll position is restored. The user notices a brief flicker, that's all.

A 350ms wait between scroll steps gives DayPilot enough time to render rows without losing them.

### Filtering down to the right people

It finds the "Агенты технической поддержки" group header and keeps every row until the next group header (Руководители, TeamLider, Оператор горячей линии тех поддержки). "Общий Пул" gets skipped. Anyone with no events at all in a ±1 hour window from the current moment also gets dropped — that catches days off, ended shifts, not-yet-started shifts.

### Classifying event blocks

For each event block on each row, the script reads the `rgb(...)` background of `.scheduler_default_event_inner` and the inner element's border color. Both inline `style` and computed style are checked, because some block colors are applied through CSS rather than inline.

| Task | Color | Result |
|------|-------|--------|
| Обзвон / Обзвон ГЛ | `#008000` green | Free (background activity) |
| Тех. обслуживание ПК | `#191970` navy, wider than 50px | Free |
| **Горячая линия (ГЛ)** | `#000080` pure navy | **Always Busy** |
| ГЛ вариант (узкий синий) | `#000066` / `#1f1f5a` / `#191970`, ≤50px | **Busy** |
| Перерыв запланированный | `#bc5e00` / `#964b00` orange | Break |
| Перерыв в работе | orange + оранжевая рамка | Break |
| Перерыв закрытый | `#592d00` / `#ffdfbf` | Break |
| Аудит | `#00bc9d` teal | Busy / soon free |
| Обучение | `#800080` purple | Busy / soon free |
| Знакомство | `#3a87ad` blue | Busy |
| Новый + ТО | `#f5dd05` yellow | Busy / soon free |
| Работа со смартфоном | `#151515` black | Busy / soon free / **Free if ≥30 min elapsed** |
| Курсы | `#edffbf` / `#acb78e` | Busy |
| Прочее (≥31 мин) | `#cd5c5c` red, ≥37px | Busy |
| Прочее (<31 мин) | `#cd5c5c` red, <37px | Free (short call) |

### Special rules that took the most iteration

**ГЛ is sacred.** Pure `rgb(0, 0, 128)` is always Busy. Doesn't matter how wide the block is. The old "wide navy = ТО ПК" rule still applies for the slightly different navy shades used for actual PC maintenance.

**Recent ГЛ history.** If an agent had any ГЛ block in the past 2 hours, they stay in the Busy list. Even if they look free right now. This matches the team rule that you do not stack ГЛ on someone who just finished one.

**Long ТО смартфона.** A black ТО смартфона block lasting at least 30 minutes flips to Free after the 30-minute mark — by team rule, after 30 minutes a hotline operator can hand you a regular ticket. Between minutes 25 and 30 the agent shows up as "soon free".

**Active vs scheduled vs closed break.** A break only counts as "currently on break" when the red time-line actually crosses the block. The orange `#d35400` active border is no longer required, because closed breaks (which lack the border) still need to count when the line is on them. Future breaks within 15 min show "(через ~Xм)". Active breaks show "(ещё ~Xм)" with time until end. Break also wins against everything else — if an agent is on break, they appear in Перерыв only, never in Busy or Free.

**Chained tasks after ТО смартфона.** If the long ТО смартфона would have flipped someone to Free, but a blocking task starts right after it ends, the agent goes to Скоро будут заняты instead of Free. The 30-minute lookahead catches obvious cases like a training session that begins the moment the ТО finishes.

### Pixel arithmetic

72 pixels equals one hour. Everything that says "minutes" is computed as `pixels / (72/60)`. The current time is read from `style.left` of the red `.scheduler_default_separator` element. Distance to a block's left edge becomes "starts in X minutes", distance to its right edge becomes "ends in X minutes".

### Scroll-to-agent

The **→** button uses the same scroll machinery in reverse — it scrolls the CRM container until the target agent's row is centered in the viewport, then puts a blue outline on the row for 2.5 seconds so you can find it visually.

---

## Telegram bot

There's also a `bot.js` for notifying the team about new versions and hotfixes. Subscribers either drag a button on the site (opens `t.me/crm_free_agents_bot?start=subscribe` and saves their `chat_id` in Google Sheets), or enter an email and get notified that way.

The admin runs `/menu` in the bot and gets a keyboard with preset alarms (новая версия, хотфикс, тех. работы, etc.) plus a custom-text option. Before sending, the admin can hit "👥 Выбрать получателей" to toggle individual subscribers in or out. The subscriber list reads from Google Sheets, so changing names in column E updates the bot without restarting it.

Setup details are at the top of `bot.js`.

---

## Tech

Vanilla JavaScript. No build step, no npm install, no dependencies in the bookmarklet itself. The whole thing is a single `javascript:` URL around 17KB. Works in Firefox, Chrome, and Safari (with the manual install workaround above).

The bot uses `node-telegram-bot-api`, `googleapis`, and `nodemailer`. Tested with Node 22+ — Node 25 also works.

## Repo layout

```
crm-free-agents/
├── bookmarklet.js          The bookmarklet, copy-paste ready
└── README.md
```

## Tuning knobs

These constants live near the top of `bookmarklet.js`. Adjust if your CRM uses a different scale.

| Constant | Value | Meaning |
|----------|-------|---------|
| `SOON_BUSY_PX` | 36 | Lookahead window for "скоро занят", in px (~30 min) |
| `SOON_FREE_PX` | 18 | Lookbehind window for "скоро свободен", in px (~15 min) |
| `ACTIVE_WINDOW_PX` | 72 | ±1 hour window for the activity filter |
| `HOTLINE_MAX_WIDTH` | 50 | Navy blocks ≤50px count as hotline |
| `MISC_WIDE_THRESHOLD` | 37 | Red blocks ≥37px count as busy |
| `EDGE_TOLERANCE` | 2 | Line-crossing slack for normal events |
| `BREAK_TOLERANCE` | 2 | Line-crossing slack for break blocks |
| `SMARTPHONE_MIN_DURATION` | 30 | Minutes of ТО смартфона after which agent flips to free |
| `SMARTPHONE_SOON_FREE_START` | 25 | At this elapsed minute the agent becomes "soon free" |
| `GL_LOOKBACK_PX` | 144 | 2-hour window for "had ГЛ recently" detection |

---

Built for a real support team, used in production every day.
