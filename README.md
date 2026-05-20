# 🟢 CRM Free Agents Monitor

A browser bookmarklet for a DayPilot Scheduler CRM. One click and it tells you which support agents are free right now.

**[Live demo & install](https://presentation.web1337.net)**

---

## Why I built this

Our team's CRM runs on [DayPilot Scheduler](https://javascript.daypilot.org/). Every agent has a color-coded timeline. When a ticket lands, somebody has to figure out who's free. Which meant scrolling through 40+ rows and decoding the colors at the current moment. Who finishes in five minutes? Who's on a break that ends when? After enough of it you start making mistakes.

DayPilot uses virtual scrolling, so only visible rows exist in the DOM at any moment. Scroll down and the previous rows are gone from memory. The bookmarklet does the bookkeeping instead.

## What it shows

A floating panel on top of the CRM. Each active agent ends up in exactly one bucket:

| Status | Label | Meaning |
|--------|-------|---------|
| ✅ | Свободны | Available right now |
| ⏳ | Скоро освободятся | Busy now, finishing within ~15 min |
| 🕒 | Скоро будут заняты | Free now, blocking task within ~30 min |
| ☕ | Перерыв | On break, or break starts within ~30 min |
| ❌ | Заняты | Actively occupied right now |
| 🧑‍💻 | На смене | Count of agents currently on shift |

Each row has a → button that scrolls the CRM straight to that agent and highlights their row. The panel auto-refreshes every two minutes. The ↺ button forces a fresh scan.

---

## Install

### From the demo page

Open [presentation.web1337.net](https://presentation.web1337.net), drag the green "Free Agents Monitor" button to your bookmarks bar, then open the CRM and click it.

### Safari workaround

Safari doesn't accept drag-and-drop for `javascript:` bookmarks. Bookmark any page first, open Bookmarks → Edit Bookmarks, right-click the new bookmark, hit Edit Address, paste the contents of `bookmarklet.js` there.

### Manual

Copy [`bookmarklet.js`](./bookmarklet.js), create a bookmark, paste it as the URL.

---

## How it works

Everything runs inside the CRM tab that's already logged in. Nothing leaves the browser.

### Reading the virtual scroll

DayPilot only renders about 20 rows at a time. The script saves your current scroll position, walks down the scheduler in 400px steps, dispatches synthetic `scroll` events so DayPilot renders each batch, then puts the scroll position back. Each batch gets snapshotted (agent name, row coordinates, every event block on that row). You see a brief flicker on screen, takes about three seconds.

A 350ms wait between scroll steps gives DayPilot time to render rows before they get snapshotted. Anything faster and rows get missed.

### Filtering down to the right people

It finds the "Агенты технической поддержки" group header and keeps every row until the next group header (Руководители, TeamLider, Оператор горячей линии тех поддержки). "Общий Пул" is skipped. Anyone with no events at all in a ±1 hour window from the current time gets dropped, which removes days off and finished shifts.

### Classifying event blocks

For each event block the script reads the `rgb(...)` background of `.scheduler_default_event_inner` plus the border color. It checks computed style first because some block colors are applied through CSS rather than inline.

| Task | Color | Result |
|------|-------|--------|
| Обзвон / Обзвон ГЛ | `#008000` green | Free |
| ТО ПК | `#191970` navy, wider than 50px | Free |
| Горячая линия (ГЛ) | `#000080` pure navy | Always Busy |
| ГЛ alt | `#000066` / `#1f1f5a` / `#191970`, ≤50px | Busy |
| Перерыв запланированный | `#bc5e00` / `#964b00` orange | Break |
| Перерыв в работе | orange + active orange border | Break |
| Перерыв закрытый | `#592d00` / `#ffdfbf` | Break |
| Аудит | `#00bc9d` teal | Busy / soon free |
| Обучение | `#800080` purple | Busy / soon free |
| Знакомство | `#3a87ad` blue | Busy |
| Новый + ТО | `#f5dd05` yellow | Busy / soon free |
| Работа со смартфоном | `#151515` black | Busy / soon free / Free after 30 min |
| Курсы | `#edffbf` / `#acb78e` | Busy |
| Прочее (≥31 мин) | `#cd5c5c` red, ≥37px | Busy |
| Прочее (<31 мин) | `#cd5c5c` red, <37px | Free |

### Edge cases that needed special handling

Pure `rgb(0, 0, 128)` is always Busy regardless of block width. The team uses that exact color for hotline tickets specifically so the script can recognize them without ambiguity. Similar-looking navy shades (`rgb(0, 0, 102)`, `rgb(20, 20, 90)`, `rgb(25, 25, 112)`) are PC maintenance when they're wider than 50px and hotline when narrower.

If an agent had any ГЛ block in the past two hours, they stay in Busy. Even if their schedule is empty at this exact moment. That matches the team rule that you don't stack hotline tickets on someone who just finished one.

For long ТО смартфона, the rule is more lenient. The team agreed that a phone maintenance block lasting 30+ minutes can be interrupted, so after 30 minutes the agent flips to Free. Between minutes 25 and 30 they show up as "soon free" without a countdown. Under 25 minutes elapsed, they stay Busy.

Breaks took the most iteration. The rule now: if the red time-line crosses any break block (scheduled, in-progress, or closed), the agent is on break. Earlier versions required the active orange border, but that excluded closed breaks where the line was clearly inside the block. Future breaks within 15 minutes get a "(через ~Xм)" tag; active ones get "(ещё ~Xм)" with time remaining. Break also overrides every other status, so a person on break never shows up under Busy or Free.

One more rule about long ТО смартфона: if it would normally flip someone to Free, but a blocking task starts right after it ends, they go into "Скоро будут заняты" instead. Otherwise the panel would mark someone free thirty seconds before training begins.

### Pixel arithmetic

72 pixels = one hour. Anything labeled in minutes is computed as `pixels / (72/60)`. The current time comes from `style.left` of the red `.scheduler_default_separator`. Distance to a block's left edge becomes "starts in X minutes", distance to the right edge becomes "ends in X minutes".

### Jumping to a row

The → button reuses the scroll machinery in reverse. It scrolls the CRM container until the target agent's row sits in the middle of the viewport, then puts a blue outline on the row for 2.5 seconds.

---

## Telegram bot

There's also a `bot.js` for sending update notifications to the team. People subscribe by hitting a button on the site (which opens `t.me/crm_free_agents_bot?start=subscribe` and writes their `chat_id` into Google Sheets), or by entering an email.

The admin types `/menu` in the bot and gets a keyboard with preset alarms — new version, hotfix, planned downtime, back online, custom text. Each one shows a preview before sending. "👥 Выбрать получателей" lets the admin tick individual subscribers in or out before pressing send. The subscriber list comes from Google Sheets, so editing names in column E updates the bot without restarting it.

---

## Tech

Vanilla JavaScript. No build step, no npm install for the bookmarklet. The whole thing is one `javascript:` URL around 17KB. Tested on Firefox, Chrome, and Safari (with the install workaround).

The bot uses `node-telegram-bot-api`, `googleapis`, and `nodemailer`. Tested on Node 22 and Node 25.

## Repo layout

```
crm-free-agents/
├── bookmarklet.js          The bookmarklet, copy-paste ready
└── README.md
```

## Tuning knobs

These constants live near the top of `bookmarklet.js`.

| Constant | Value | Meaning |
|----------|-------|---------|
| `SOON_BUSY_PX` | 36 | Lookahead for "скоро занят" (~30 min) |
| `SOON_FREE_PX` | 18 | Lookbehind for "скоро свободен" (~15 min) |
| `ACTIVE_WINDOW_PX` | 72 | ±1 hour activity filter |
| `HOTLINE_MAX_WIDTH` | 50 | Navy blocks ≤50px count as hotline |
| `MISC_WIDE_THRESHOLD` | 37 | Red blocks ≥37px count as busy |
| `EDGE_TOLERANCE` | 2 | Line-crossing slack for normal events |
| `BREAK_TOLERANCE` | 2 | Line-crossing slack for break blocks |
| `SMARTPHONE_MIN_DURATION` | 30 | Minutes after which ТО смартфона becomes free |
| `SMARTPHONE_SOON_FREE_START` | 25 | Elapsed minute at which agent becomes "soon free" |
| `GL_LOOKBACK_PX` | 144 | 2-hour window for "had ГЛ recently" check |
