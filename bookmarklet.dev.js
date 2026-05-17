/**
 * CRM Free Agents Monitor
 *
 * A bookmarklet that reads the DayPilot Scheduler DOM and shows
 * which support agents are currently free (no active task at current time).
 *
 * How it works:
 * 1. Find the red "now" line → get its left px position
 * 2. Find all agent rows in the target group
 * 3. For each agent, check if any event block overlaps both:
 *    - vertically (same row as the agent)
 *    - horizontally (intersects current time)
 * 4. Render a floating panel with free/busy lists + scroll-to buttons
 * 5. Auto-refresh every 30 seconds
 */

(function () {
  // Clean up any existing panel and interval
  document.getElementById('crm-free-panel')?.remove();
  if (window._crmFreeInterval) clearInterval(window._crmFreeInterval);

  // ── Config ──────────────────────────────────────────────────
  const GROUP_NAME = 'Агенты технической поддержки';
  const SKIP_NAMES = ['Общий Пул'];
  const REFRESH_MS = 30000;

  // ── Core analysis function ───────────────────────────────────
  function analyze() {
    // Step 1: Find the red vertical "current time" line
    const sep = document.querySelector('.scheduler_default_separator');
    const nowPx = sep ? parseInt(sep.style.left) : 0;

    const now = new Date();
    const timeStr =
      now.getHours().toString().padStart(2, '0') + ':' +
      now.getMinutes().toString().padStart(2, '0');

    // Scroll containers (need to sync both for virtual scroll navigation)
    const rowHeaderScroll = document.querySelector('.scheduler_default_rowheader_scroll');
    const scrollable = document.querySelector('.scheduler_default_scrollable');

    // Step 2: Get all row header elements
    const allRows = [...document.querySelectorAll('.scheduler_default_rowheader_inner')];

    // Find the start of our target group
    const groupIdx = allRows.findIndex(r => r.textContent.trim() === GROUP_NAME);
    if (groupIdx === -1) return;

    // Find the end of our target group (start of next group)
    const nextGroupIdx = allRows.findIndex((r, i) => {
      if (i <= groupIdx) return false;
      const t = r.textContent.trim();
      return ['Руководители', 'TeamLider', 'Оператор горячей линии тех поддержки'].includes(t);
    });

    // Extract only the agent rows (skip group headers and blacklisted names)
    const agentRows = allRows
      .slice(groupIdx + 1, nextGroupIdx === -1 ? undefined : nextGroupIdx)
      .filter(r => {
        const t = r.textContent.trim();
        return t.length > 2 && !SKIP_NAMES.some(s => t.includes(s));
      });

    // Step 3: Pre-compute scroll positions for virtual scroll navigation
    // DayPilot uses virtual scrolling — offsetTop is always 0.
    // We accumulate row heights from top to get each agent's real scroll position.
    const scrollPositions = new Map();
    let cumH = 0;
    allRows.forEach(r => {
      scrollPositions.set(r.textContent.trim(), cumH);
      cumH += r.parentElement ? r.parentElement.offsetHeight : 35;
    });

    // Step 4: Check each agent for active events at current time
    const events = [...document.querySelectorAll('.scheduler_default_event')];

    const results = agentRows
      .map(r => ({ name: r.textContent.trim(), rect: r.getBoundingClientRect() }))
      .map(agent => {
        const busy = events.some(ev => {
          const evRect = ev.getBoundingClientRect();
          const evLeft = parseInt(ev.style.left) || 0;
          const evWidth = parseInt(ev.style.width) || 0;

          // Y-axis: does this event belong to this agent's row?
          const yMatch = evRect.top < agent.rect.bottom && evRect.bottom > agent.rect.top;
          // X-axis: does this event span the current time position?
          const xMatch = evLeft <= nowPx && (evLeft + evWidth) >= nowPx;

          return yMatch && xMatch;
        });

        return { name: agent.name, busy };
      });

    const free = results.filter(r => !r.busy);
    const busyList = results.filter(r => r.busy);
    const total = results.length;

    // Step 5: Render the panel
    const panel = document.getElementById('crm-free-panel');
    if (!panel) return;

    // Scroll to agent — handles virtual scrolling
    function scrollToAgent(name) {
      const targetTop = Math.max(0, (scrollPositions.get(name) || 0) - 200);
      // Scroll both containers simultaneously
      if (rowHeaderScroll) rowHeaderScroll.scrollTop = targetTop;
      if (scrollable) scrollable.scrollTop = targetTop;
      // Wait for virtual DOM to render the row, then highlight it
      setTimeout(() => {
        const target = [...document.querySelectorAll('.scheduler_default_rowheader_inner')]
          .find(r => r.textContent.trim() === name);
        if (target) {
          target.style.outline = '3px solid #89b4fa';
          target.style.borderRadius = '4px';
          setTimeout(() => {
            target.style.outline = '';
            target.style.borderRadius = '';
          }, 2500);
        }
      }, 350);
    }

    function makeAgentRow(agent, isFree) {
      const row = document.createElement('div');
      row.style.cssText =
        'display:flex;align-items:center;justify-content:space-between;' +
        'padding:5px 8px;margin:3px 0;' +
        'background:' + (isFree ? '#a6e3a122' : '#f38ba822') + ';' +
        'border-left:3px solid ' + (isFree ? '#a6e3a1' : '#f38ba8') + ';' +
        'border-radius:6px;';

      const nameEl = document.createElement('span');
      nameEl.style.cssText =
        'color:' + (isFree ? '#a6e3a1' : '#f38ba8') + ';' +
        'font-weight:500;font-size:13px;flex:1';
      nameEl.textContent = (isFree ? '✓ ' : '✗ ') + agent.name;

      const btn = document.createElement('button');
      btn.textContent = '→';
      btn.title = 'Перейти к технику';
      btn.style.cssText =
        'background:#313244;border:none;color:#cdd6f4;border-radius:6px;' +
        'padding:2px 8px;cursor:pointer;font-size:13px;flex-shrink:0;margin-left:6px';
      btn.onmouseenter = () => btn.style.background = '#45475a';
      btn.onmouseleave = () => btn.style.background = '#313244';
      btn.onclick = () => scrollToAgent(agent.name);

      row.appendChild(nameEl);
      row.appendChild(btn);
      return row;
    }

    // Clear and re-render panel content
    panel.innerHTML = '';

    // Header with counters and refresh button
    const header = document.createElement('div');
    header.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">' +
        '<span style="font-weight:700;color:#89b4fa">🟢 Агенты тех. поддержки</span>' +
        '<span style="color:#6c7086;font-size:11px">' + timeStr + '</span>' +
      '</div>' +
      '<div style="display:flex;gap:6px;margin-bottom:10px;align-items:center">' +
        '<span style="background:#a6e3a133;color:#a6e3a1;border-radius:6px;padding:3px 8px;font-size:12px;font-weight:600">Свободно: ' + free.length + '</span>' +
        '<span style="background:#f38ba833;color:#f38ba8;border-radius:6px;padding:3px 8px;font-size:12px;font-weight:600">Заняты: ' + busyList.length + '</span>' +
        '<span style="background:#31324466;color:#6c7086;border-radius:6px;padding:3px 8px;font-size:12px">Всего: ' + total + '</span>' +
        '<button id="crm-refresh-btn" title="Обновить" style="margin-left:auto;background:#313244;border:none;color:#cdd6f4;border-radius:6px;padding:2px 8px;cursor:pointer;font-size:14px">↺</button>' +
      '</div>';
    panel.appendChild(header);
    document.getElementById('crm-refresh-btn').onclick = analyze;

    // Free agents list
    if (free.length) {
      free.forEach(a => panel.appendChild(makeAgentRow(a, true)));
    } else {
      const empty = document.createElement('div');
      empty.style.cssText = 'color:#f38ba8;padding:6px 0';
      empty.textContent = 'Все заняты 😓';
      panel.appendChild(empty);
    }

    // Busy agents list (below divider)
    if (busyList.length) {
      const divider = document.createElement('div');
      divider.style.cssText = 'margin-top:8px;padding-top:8px;border-top:1px solid #313244';
      busyList.forEach(a => divider.appendChild(makeAgentRow(a, false)));
      panel.appendChild(divider);
    }

    // Close button
    const close = document.createElement('div');
    close.style.cssText = 'margin-top:10px;font-size:11px;color:#6c7086;text-align:center;cursor:pointer';
    close.textContent = '✕ закрыть';
    close.onclick = () => {
      panel.remove();
      clearInterval(window._crmFreeInterval);
    };
    panel.appendChild(close);
  }

  // Create the panel container
  const panel = document.createElement('div');
  panel.id = 'crm-free-panel';
  panel.style.cssText =
    'position:fixed;top:80px;right:20px;z-index:99999;' +
    'background:#1e1e2e;color:#cdd6f4;border-radius:12px;' +
    'padding:14px 16px;width:300px;font-family:sans-serif;font-size:13px;' +
    'box-shadow:0 8px 32px rgba(0,0,0,0.5);border:1px solid #313244;' +
    'max-height:80vh;overflow-y:auto';
  document.body.appendChild(panel);

  // Run immediately, then every 30 seconds
  analyze();
  window._crmFreeInterval = setInterval(analyze, REFRESH_MS);
})();
