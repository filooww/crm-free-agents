javascript: (function () {
    document.getElementById('crm-free-panel')?.remove();

    if (window._crmFreeInterval) {
        clearInterval(window._crmFreeInterval);
    }

    const GROUP_NAME = 'Агенты технической поддержки';
    const SKIP_NAMES = ['Общий Пул'];

    function analyze() {
        const sep = document.querySelector('.scheduler_default_separator');
        const nowPx = sep ? parseInt(sep.style.left) : 0;

        const now = new Date();
        const timeStr =
            now.getHours().toString().padStart(2, '0') +
            ':' +
            now.getMinutes().toString().padStart(2, '0');

        const rowHeaderScroll = document.querySelector('.scheduler_default_rowheader_scroll');
        const scrollable = document.querySelector('.scheduler_default_scrollable');
        const allRows = [...document.querySelectorAll('.scheduler_default_rowheader_inner')];

        const groupIdx = allRows.findIndex(
            (r) => r.textContent.trim() === GROUP_NAME
        );

        if (groupIdx === -1) return;

        const nextGroupIdx = allRows.findIndex((r, i) => {
            if (i <= groupIdx) return false;
            const t = r.textContent.trim();
            return [
                'Руководители',
                'TeamLider',
                'Оператор горячей линии тех поддержки'
            ].includes(t);
        });

        const agentRows = allRows
            .slice(groupIdx + 1, nextGroupIdx === -1 ? undefined : nextGroupIdx)
            .filter((r) => {
                const t = r.textContent.trim();
                return t.length > 2 && !SKIP_NAMES.some((s) => t.includes(s));
            });

        const scrollPositions = new Map();
        let cumH = 0;

        allRows.forEach((r) => {
            scrollPositions.set(r.textContent.trim(), cumH);
            cumH += r.parentElement ? r.parentElement.offsetHeight : 35;
        });

        const events = [...document.querySelectorAll('.scheduler_default_event')];

        const results = agentRows
            .map((r) => ({
                name: r.textContent.trim(),
                rect: r.getBoundingClientRect()
            }))
            .map((a) => {
                const busy = events.some((ev) => {
                    const er = ev.getBoundingClientRect();
                    const l = parseInt(ev.style.left) || 0;
                    const w = parseInt(ev.style.width) || 0;

                    return (
                        er.top < a.rect.bottom &&
                        er.bottom > a.rect.top &&
                        l <= nowPx &&
                        l + w >= nowPx
                    );
                });

                return { name: a.name, busy };
            });

        const free = results.filter((r) => !r.busy);
        const busyList = results.filter((r) => r.busy);
        const total = results.length;

        const panel = document.getElementById('crm-free-panel');
        if (!panel) return;

        function scrollToAgent(name) {
            const targetTop = Math.max(0, (scrollPositions.get(name) || 0) - 200);

            if (rowHeaderScroll) rowHeaderScroll.scrollTop = targetTop;
            if (scrollable) scrollable.scrollTop = targetTop;

            setTimeout(() => {
                const target = [...document.querySelectorAll('.scheduler_default_rowheader_inner')]
                    .find((r) => r.textContent.trim() === name);

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

        function makeRow(a, isFree) {
            const row = document.createElement('div');
            row.style.cssText =
                'display:flex;align-items:center;justify-content:space-between;' +
                'padding:5px 8px;margin:3px 0;' +
                'background:' + (isFree ? '#a6e3a122' : '#f38ba822') + ';' +
                'border-left:3px solid ' + (isFree ? '#a6e3a1' : '#f38ba8') + ';' +
                'border-radius:6px;';

            const name = document.createElement('span');
            name.style.cssText =
                'color:' + (isFree ? '#a6e3a1' : '#f38ba8') + ';' +
                'font-weight:500;font-size:13px;flex:1';
            name.textContent = (isFree ? '✓ ' : '✗ ') + a.name;

            const btn = document.createElement('button');
            btn.textContent = '→';
            btn.style.cssText =
                'background:#313244;border:none;color:#cdd6f4;border-radius:6px;' +
                'padding:2px 8px;cursor:pointer;font-size:13px;flex-shrink:0;margin-left:6px';

            btn.onmouseenter = () => {
                btn.style.background = '#45475a';
            };

            btn.onmouseleave = () => {
                btn.style.background = '#313244';
            };

            btn.onclick = () => scrollToAgent(a.name);

            row.appendChild(name);
            row.appendChild(btn);

            return row;
        }

        panel.innerHTML = '';

        const header = document.createElement('div');
        header.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span style="font-weight:700;color:#89b4fa">🟢 Агенты тех. поддержки</span>
        <span style="color:#6c7086;font-size:11px">${timeStr}</span>
      </div>
      <div style="display:flex;gap:6px;margin-bottom:10px;align-items:center">
        <span style="background:#a6e3a133;color:#a6e3a1;border-radius:6px;padding:3px 8px;font-size:12px;font-weight:600">
          Свободно: ${free.length}
        </span>
        <span style="background:#f38ba833;color:#f38ba8;border-radius:6px;padding:3px 8px;font-size:12px;font-weight:600">
          Заняты: ${busyList.length}
        </span>
        <span style="background:#31324466;color:#6c7086;border-radius:6px;padding:3px 8px;font-size:12px">
          Всего: ${total}
        </span>
        <button
          id="crm-refresh-btn"
          title="Обновить"
          style="margin-left:auto;background:#313244;border:none;color:#cdd6f4;border-radius:6px;padding:2px 8px;cursor:pointer;font-size:14px"
        >
          ↺
        </button>
      </div>
    `;

        panel.appendChild(header);

        document.getElementById('crm-refresh-btn').onclick = analyze;

        if (free.length) {
            free.forEach((a) => panel.appendChild(makeRow(a, true)));
        } else {
            const empty = document.createElement('div');
            empty.style.cssText = 'color:#f38ba8;padding:6px 0';
            empty.textContent = 'Все заняты 😓';
            panel.appendChild(empty);
        }

        if (busyList.length) {
            const div = document.createElement('div');
            div.style.cssText =
                'margin-top:8px;padding-top:8px;border-top:1px solid #313244';

            busyList.forEach((a) => div.appendChild(makeRow(a, false)));
            panel.appendChild(div);
        }

        const close = document.createElement('div');
        close.style.cssText =
            'margin-top:10px;font-size:11px;color:#6c7086;text-align:center;cursor:pointer';
        close.textContent = '✕ закрыть';
        close.onclick = () => {
            panel.remove();
            clearInterval(window._crmFreeInterval);
        };

        panel.appendChild(close);
    }

    const panel = document.createElement('div');
    panel.id = 'crm-free-panel';
    panel.style.cssText =
        'position:fixed;top:80px;right:20px;z-index:99999;' +
        'background:#1e1e2e;color:#cdd6f4;border-radius:12px;' +
        'padding:14px 16px;width:300px;font-family:sans-serif;font-size:13px;' +
        'box-shadow:0 8px 32px rgba(0,0,0,0.5);border:1px solid #313244;' +
        'max-height:80vh;overflow-y:auto';

    document.body.appendChild(panel);

    analyze();
    window._crmFreeInterval = setInterval(analyze, 30000);
})();
