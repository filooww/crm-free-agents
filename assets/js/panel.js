import { agentSchedules, randomize } from './demo.js';

export function tryDemo() {
  document.getElementById('demo-panel')?.remove();
  randomize();

  const now = new Date();
  const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
  const free = agentSchedules.filter(a => a.status === 'free');
  const soonBusy = agentSchedules.filter(a => a.status === 'soonBusy');
  const breakList = agentSchedules.filter(a => a.status === 'breakNow' || a.status === 'breakSoon');
  const busyList = agentSchedules.filter(a => a.status === 'busy');
  const total = agentSchedules.length;

  const panel = document.createElement('div');
  panel.id = 'demo-panel';
  panel.style.cssText = 'position:fixed;top:80px;right:20px;z-index:99999;background:#1e1e2e;color:#cdd6f4;border-radius:12px;padding:14px 16px;width:300px;font-family:sans-serif;font-size:13px;box-shadow:0 8px 32px rgba(0,0,0,0.5);border:1px solid #313244;max-height:80vh;overflow-y:auto;animation:fadeInPanel 0.2s ease';

  function makeRow(a, kind) {
    const colors = {
      free: ['#a6e3a1', '#a6e3a122'],
      soonBusy: ['#fab387', '#fab38722'],
      breakNow: ['#cba6f7', '#cba6f722'],
      breakSoon: ['#cba6f7', '#cba6f722'],
      busy: ['#f38ba8', '#f38ba822'],
    };
    const sym = { free: '✓', soonBusy: '◷', breakNow: '☕', breakSoon: '☕', busy: '✗' };
    const [c, bgc] = colors[kind];

    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:5px 8px;margin:3px 0;background:' + bgc + ';border-left:3px solid ' + c + ';border-radius:6px;';

    const nameEl = document.createElement('span');
    nameEl.style.cssText = 'color:' + c + ';font-weight:500;font-size:13px;flex:1';
    let text = sym[kind] + ' ' + a.name;
    if (kind === 'soonBusy' && a.minutesToBusy !== null) text += ' (~' + a.minutesToBusy + 'м)';
    if (kind === 'breakNow' && a.minutesBreakLeft !== null) text += ' (ещё ~' + a.minutesBreakLeft + 'м)';
    if (kind === 'breakSoon' && a.minutesToBreak !== null) text += ' (через ~' + a.minutesToBreak + 'м)';
    nameEl.textContent = text;

    const btn = document.createElement('button');
    btn.textContent = '→';
    btn.style.cssText = 'background:#313244;border:none;color:#cdd6f4;border-radius:6px;padding:2px 8px;cursor:pointer;font-size:13px;flex-shrink:0;margin-left:6px';
    btn.onclick = () => scrollToAgentInSim(a.name);

    row.appendChild(nameEl);
    row.appendChild(btn);
    return row;
  }

  function makeSection(label, color, list, kindMapper) {
    if (!list.length) return null;
    const div = document.createElement('div');
    div.style.cssText = 'margin-top:8px;padding-top:8px;border-top:1px solid #313244';
    const lbl = document.createElement('div');
    lbl.style.cssText = 'font-size:11px;color:' + color + ';margin-bottom:4px;font-weight:600';
    lbl.textContent = label;
    div.appendChild(lbl);
    list.forEach(a => div.appendChild(makeRow(a, kindMapper(a))));
    return div;
  }

  const header = document.createElement('div');
  header.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><span style="font-weight:700;color:#89b4fa;font-family:Syne,sans-serif">🟢 Tech Support Agents</span><span style="color:#6c7086;font-size:11px">${timeStr}</span></div><div style="display:flex;gap:4px;margin-bottom:10px;align-items:center;flex-wrap:wrap"><span style="background:#a6e3a133;color:#a6e3a1;border-radius:5px;padding:2px 6px;font-size:10px;font-weight:600">✓ ${free.length}</span><span style="background:#fab38733;color:#fab387;border-radius:5px;padding:2px 6px;font-size:10px;font-weight:600">◷ ${soonBusy.length}</span><span style="background:#cba6f733;color:#cba6f7;border-radius:5px;padding:2px 6px;font-size:10px;font-weight:600">☕ ${breakList.length}</span><span style="background:#f38ba833;color:#f38ba8;border-radius:5px;padding:2px 6px;font-size:10px;font-weight:600">✗ ${busyList.length}</span><span style="background:#31324466;color:#6c7086;border-radius:5px;padding:2px 6px;font-size:10px">${total}</span></div>`;
  panel.appendChild(header);

  const refreshBtn = document.createElement('button');
  refreshBtn.textContent = '↺ Refresh';
  refreshBtn.style.cssText = 'width:100%;background:#313244;border:none;color:#cdd6f4;border-radius:6px;padding:6px;cursor:pointer;font-size:12px;margin-bottom:10px';
  refreshBtn.onclick = tryDemo;
  panel.appendChild(refreshBtn);

  if (free.length) {
    const lbl = document.createElement('div');
    lbl.style.cssText = 'font-size:11px;color:#a6e3a1;margin-bottom:4px;font-weight:600';
    lbl.textContent = 'Free:';
    panel.appendChild(lbl);
    free.forEach(a => panel.appendChild(makeRow(a, 'free')));
  } else {
    const empty = document.createElement('div');
    empty.style.cssText = 'color:#f38ba8;padding:6px 0';
    empty.textContent = 'Nobody free 😓';
    panel.appendChild(empty);
  }

  const sec1 = makeSection('Soon busy:', '#fab387', soonBusy, () => 'soonBusy');
  if (sec1) panel.appendChild(sec1);

  const sec2 = makeSection('On break:', '#cba6f7', breakList, a => a.status);
  if (sec2) panel.appendChild(sec2);

  const sec3 = makeSection('Busy:', '#f38ba8', busyList, () => 'busy');
  if (sec3) panel.appendChild(sec3);

  const close = document.createElement('div');
  close.style.cssText = 'margin-top:10px;font-size:11px;color:#6c7086;text-align:center;cursor:pointer';
  close.textContent = '✕ close';
  close.onclick = () => panel.remove();
  panel.appendChild(close);

  document.body.appendChild(panel);
}

function scrollToAgentInSim(name) {
  const demoEl = document.getElementById('demo');
  demoEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  setTimeout(() => {
    const rows = [...document.querySelectorAll('#scheduler-sim .sched-row')];
    const target = rows.find(r => r.querySelector('.sched-name')?.textContent.trim() === name);
    if (!target) return;
    const body = document.querySelector('#scheduler-sim .sched-body');
    if (body) {
      const targetTop = target.offsetTop - body.clientHeight / 2 + target.offsetHeight / 2;
      body.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
    }
    setTimeout(() => {
      target.style.outline = '3px solid #89b4fa';
      target.style.outlineOffset = '-3px';
      setTimeout(() => {
        target.style.outline = '';
        target.style.outlineOffset = '';
      }, 2500);
    }, 400);
  }, 500);
}
