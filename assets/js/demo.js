const AGENTS = [
  'Alex Johnson', 'Maria Garcia', 'Ivan Petrov',
  'Sarah Chen', 'Omar Hassan', 'Elena Novak',
  'James Wilson', 'Yuki Tanaka', 'Lucas Silva',
  'Anna Kowalski', 'David Okafor', 'Sophie Müller',
];

const COLORS_FREE = ['#008000', '#191970'];
const COLORS_BUSY = ['#800080', '#00bc9d', '#f38ba8', '#bc5e00', '#151515', '#3a87ad'];
const COLOR_BREAK = '#bc5e00';

const TOTAL_W = 600;
const START_H = 9;
const END_H = 22;

const now = new Date();
const NOW_H = now.getHours() + now.getMinutes() / 60;
const NOW_PCT = Math.min(1, Math.max(0, (NOW_H - START_H) / (END_H - START_H)));
const PX_PER_HOUR = TOTAL_W / (END_H - START_H);

export let agentSchedules = [];

function hToX(h) {
  return ((h - START_H) / (END_H - START_H)) * TOTAL_W;
}

function pickColor(state) {
  if (state === 'free') return COLORS_FREE[Math.floor(Math.random() * COLORS_FREE.length)];
  if (state === 'break') return COLOR_BREAK;
  return COLORS_BUSY[Math.floor(Math.random() * COLORS_BUSY.length)];
}

export function randomize() {
  agentSchedules = AGENTS.map((name, idx) => {
    const events = [];
    const targetStatus = ['free', 'soonBusy', 'breakNow', 'breakSoon', 'busy'][idx % 5];

    let t = START_H + Math.random() * 1.5;
    while (t < END_H - 0.5) {
      const dur = 0.25 + Math.random() * 1.2;
      const isFree = Math.random() < 0.6;
      const isBreak = !isFree && Math.random() < 0.15;
      events.push({
        start: t,
        end: t + dur,
        color: pickColor(isBreak ? 'break' : isFree ? 'free' : 'busy'),
        kind: isBreak ? 'break' : isFree ? 'free' : 'busy',
      });
      t += dur + 0.1 + Math.random() * 0.6;
    }

    if (targetStatus === 'busy') {
      events.push({ start: NOW_H - 0.2, end: NOW_H + 0.5, color: '#800080', kind: 'busy', active: true });
    } else if (targetStatus === 'breakNow') {
      events.push({ start: NOW_H - 0.05, end: NOW_H + 0.15, color: COLOR_BREAK, kind: 'break', active: true });
    } else if (targetStatus === 'soonBusy') {
      events.push({ start: NOW_H + 0.1, end: NOW_H + 0.8, color: '#00bc9d', kind: 'busy' });
    } else if (targetStatus === 'breakSoon') {
      events.push({ start: NOW_H + 0.15, end: NOW_H + 0.4, color: COLOR_BREAK, kind: 'break' });
    }

    return { name, events, targetStatus };
  });

  for (const a of agentSchedules) {
    let status = 'free';
    let minutesToBusy = null;
    let minutesToBreak = null;
    let minutesBreakLeft = null;
    let busy = false;
    let onBreak = false;
    let breakSoon = false;

    for (const e of a.events) {
      const startsAt = (e.start - NOW_H) * 60;
      const endsAt = (e.end - NOW_H) * 60;
      const crossesNow = e.start <= NOW_H && e.end >= NOW_H;

      if (e.kind === 'busy') {
        if (crossesNow) busy = true;
        else if (startsAt > 0 && startsAt <= 15) {
          if (minutesToBusy === null || startsAt < minutesToBusy) minutesToBusy = Math.round(startsAt);
        }
      } else if (e.kind === 'break') {
        if (crossesNow) {
          onBreak = true;
          minutesBreakLeft = Math.max(0, Math.round(endsAt));
        } else if (startsAt > 0 && startsAt <= 15) {
          breakSoon = true;
          if (minutesToBreak === null || startsAt < minutesToBreak) minutesToBreak = Math.round(startsAt);
        }
      }
    }

    if (busy) status = 'busy';
    else if (onBreak) status = 'breakNow';
    else if (breakSoon) status = 'breakSoon';
    else if (minutesToBusy !== null) status = 'soonBusy';
    else status = 'free';

    a.status = status;
    a.minutesToBusy = minutesToBusy;
    a.minutesToBreak = minutesToBreak;
    a.minutesBreakLeft = minutesBreakLeft;
  }

  renderDemo();
}

function renderDemo() {
  const sim = document.getElementById('scheduler-sim');
  const panel = document.getElementById('panel-sim');

  const times = [];
  for (let h = START_H; h <= END_H; h += 2) {
    const pct = (h - START_H) / (END_H - START_H) * 100;
    const label = h > 12 ? (h - 12) + 'PM' : (h === 12 ? '12PM' : h + 'AM');
    times.push(`<span class="time-label" style="left:${pct}%">${label}</span>`);
  }

  let rows = '';
  let delay = 0;
  agentSchedules.forEach(agent => {
    const evHtml = agent.events.map(e => {
      const l = hToX(e.start);
      const w = hToX(e.end) - l;
      const d = (delay++) * 0.012;
      const cls = e.active ? 'sched-event active' : 'sched-event';
      return `<div class="${cls}" style="left:${l}px;width:${w}px;background:${e.color};animation-delay:${d}s"></div>`;
    }).join('');
    rows += `
      <div class="sched-row">
        <div class="sched-name">${agent.name}</div>
        <div class="sched-timeline">
          ${evHtml}
          <div class="now-line" style="left:${NOW_PCT * 100}%"></div>
        </div>
      </div>`;
  });

  sim.innerHTML = `
    <div class="sched-header">
      <div class="sched-corner">Agent Name</div>
      <div class="sched-times">${times.join('')}</div>
    </div>
    <div class="sched-body">${rows}</div>`;

  const free = agentSchedules.filter(a => a.status === 'free');
  const soonBusy = agentSchedules.filter(a => a.status === 'soonBusy');
  const breakList = agentSchedules.filter(a => a.status === 'breakNow' || a.status === 'breakSoon');
  const busyList = agentSchedules.filter(a => a.status === 'busy');
  const total = agentSchedules.length;

  const t = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

  function row(a, kind) {
    let sym = '✓', cls = 'agent-free', extra = '';
    if (kind === 'soonBusy') { sym = '◷'; cls = 'agent-soon'; extra = ` (~${a.minutesToBusy}м)`; }
    else if (kind === 'breakNow') { sym = '☕'; cls = 'agent-break'; extra = ` (ещё ~${a.minutesBreakLeft}м)`; }
    else if (kind === 'breakSoon') { sym = '☕'; cls = 'agent-break'; extra = ` (через ~${a.minutesToBreak}м)`; }
    else if (kind === 'busy') { sym = '✗'; cls = 'agent-busy'; }
    return `<div class="agent-row ${cls}"><span>${sym} ${a.name}${extra}</span><button class="agent-btn" data-agent="${a.name}">→</button></div>`;
  }

  const sections = [];
  if (free.length) sections.push(`<div class="panel-section-label" style="color:#a6e3a1">Свободны:</div>` + free.map(a => row(a, 'free')).join(''));
  if (soonBusy.length) sections.push(`<div class="panel-section-label" style="color:#fab387;margin-top:6px">Скоро заняты:</div>` + soonBusy.map(a => row(a, 'soonBusy')).join(''));
  if (breakList.length) sections.push(`<div class="panel-section-label" style="color:#cba6f7;margin-top:6px">Перерыв:</div>` + breakList.map(a => row(a, a.status)).join(''));
  if (busyList.length) sections.push(`<div class="panel-section-label" style="color:#f38ba8;margin-top:6px">Заняты:</div>` + busyList.map(a => row(a, 'busy')).join(''));

  panel.innerHTML = `
    <div class="panel-header">
      <span class="panel-title">🟢 Tech Support</span>
      <span class="panel-time">${t}</span>
    </div>
    <div class="panel-counters">
      <span class="counter counter-free">✓ ${free.length}</span>
      <span class="counter counter-soon">◷ ${soonBusy.length}</span>
      <span class="counter counter-break">☕ ${breakList.length}</span>
      <span class="counter counter-busy">✗ ${busyList.length}</span>
      <span class="counter counter-total">${total}</span>
    </div>
    ${sections.join('')}`;

  panel.querySelectorAll('.agent-btn').forEach(btn => {
    btn.onclick = () => scrollSimulatorTo(btn.dataset.agent);
  });
}

function scrollSimulatorTo(name) {
  const rows = [...document.querySelectorAll('#scheduler-sim .sched-row')];
  const target = rows.find(r => r.querySelector('.sched-name')?.textContent.trim() === name);
  if (!target) return;
  const body = document.querySelector('#scheduler-sim .sched-body');
  if (body) {
    const targetTop = target.offsetTop - body.clientHeight / 2 + target.offsetHeight / 2;
    body.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
  }
  setTimeout(() => {
    target.style.outline = '2px solid #89b4fa';
    target.style.outlineOffset = '-2px';
    target.style.background = 'rgba(137,180,250,0.08)';
    setTimeout(() => {
      target.style.outline = '';
      target.style.outlineOffset = '';
      target.style.background = '';
    }, 2200);
  }, 350);
}
