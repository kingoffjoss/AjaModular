// Shared dependencies: CONFIG, UI, ajaStorage, analyticsManager, makeDraggable, saveData
window.AjaModular.register("ui-createMiniDashboard", [], function(ctx) {
const implementation = {createMiniDashboard() {
            if (!ctx.CONFIG.MINI_DASHBOARD_VISIBLE) { const dashboard = document.getElementById('purecloud-script-mini-dashboard'); if (dashboard && dashboard._updateInterval) { clearInterval(dashboard._updateInterval); } dashboard?.remove(); return; }
            let dashboard = document.getElementById('purecloud-script-mini-dashboard');
            if (!dashboard) {
                dashboard = document.createElement('div'); dashboard.id = 'purecloud-script-mini-dashboard'; dashboard.className = 'purecloud-script-popup'; document.body.appendChild(dashboard);

                const iconCheck = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="stat-icon" style="width: 14px; height: 14px; color: var(--purecloud-script-accent-color);"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
                const iconClock = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="stat-icon" style="width: 14px; height: 14px; color: var(--purecloud-script-accent-color);"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`;
                const iconZap = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="stat-icon" style="width: 14px; height: 14px; color: var(--purecloud-script-accent-color);"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`;
                const iconBaloon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="stat-icon" style="width: 14px; height: 14px; color: var(--purecloud-script-accent-color);"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;
                const iconTarget = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px; color: var(--purecloud-script-accent-color);"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>`;
                const iconTools = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px;"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>`;

                dashboard.innerHTML = `
                    <div class="mini-dashboard-header">
                        <div class="counter-display">${iconTarget}<span class="counter-text">--/--</span><div class="progress-bar-container-compact"><div class="progress-bar-compact"></div></div></div>
                        <div class="mini-dashboard-controls">
                            <button id="mini-dashboard-btn-theme" class="compact-btn" title="Mudar Tema" style="font-size: 14px; background: none; border: none; color: inherit; padding: 0 4px; cursor: pointer;">🌗</button>
                            <button id="mini-dashboard-tools-btn" class="compact-btn" title="Ferramentas do Agente">${iconTools}</button>
                            <button id="mini-dashboard-adjust-attended-btn" class="compact-btn adjust-btn" title="Ajustar Contagem"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
                            <button class="compact-btn toggle-expand-btn" title="Expandir/Recolher"><svg class="expand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px;"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg><svg class="collapse-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px; display: none;"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path></svg></button>
                            <button class="compact-btn close-btn" id="closeMiniDashboardBtn" title="Fechar">X</button>
                        </div>
                    </div>
                    <div class="mini-dashboard-content">
                        <div class="stats-grid-original mini-dashboard-stats-grid">
                            <div class="stat-item-original"><span class="stat-label">${iconCheck} Únicas</span><strong id="dashboard-conv-count">--</strong></div>
                            <div class="stat-item-original"><span class="stat-label">${iconClock} TMA</span><strong id="dashboard-tma">--:--</strong></div>
                            <div class="stat-item-original"><span class="stat-label">${iconZap} TME</span><strong id="dashboard-tme">--:--</strong></div>
                            <div class="stat-item-original" title="Cliques no botão 'Mensagens de Término' (Balão)"><span class="stat-label">${iconBaloon} Balão</span><strong id="dashboard-balao-clicks">--</strong></div>
                        </div>
                    </div>
                `;
                const dashboardHeader = dashboard.querySelector('.mini-dashboard-header'); ctx.makeDraggable(dashboard, dashboardHeader, 'miniDashboard');

                const themeBtnDash = dashboard.querySelector('#mini-dashboard-btn-theme');
                const savedThemeDash = ctx.ajaStorage.getItem('DASHBOARD_THEME');
                if (savedThemeDash === 'light') {
                    dashboard.classList.add('local-light-mode');
                    themeBtnDash.innerText = '☀️';
                } else if (savedThemeDash === 'dark') {
                    dashboard.classList.add('cc-escurinho');
                    themeBtnDash.innerText = '🌗';
                }
                themeBtnDash.onclick = () => {
                    const isLight = dashboard.classList.contains('local-light-mode');
                    if (isLight) {
                        dashboard.classList.remove('local-light-mode');
                        dashboard.classList.add('cc-escurinho');
                        ctx.ajaStorage.setItem('DASHBOARD_THEME', 'dark');
                        themeBtnDash.innerText = '🌗';
                    } else {
                        dashboard.classList.remove('cc-escurinho');
                        dashboard.classList.add('local-light-mode');
                        ctx.ajaStorage.setItem('DASHBOARD_THEME', 'light');
                        themeBtnDash.innerText = '☀️';
                    }
                };

                // Estilos locais inseridos diretamente no documento se já não existirem
                if (!document.getElementById('dash-local-styles')) {
                    const st = document.createElement('style'); st.id = 'dash-local-styles';
                    st.innerHTML = `
                        #purecloud-script-mini-dashboard.cc-escurinho { --purecloud-script-bg-primary: #0f172a; --purecloud-script-bg-secondary: #1e293b; --purecloud-script-text-primary: #f8fafc; --purecloud-script-text-secondary: #cbd5e1; --purecloud-script-border-color: #334155; }
                        #purecloud-script-mini-dashboard.local-light-mode { --purecloud-script-bg-primary: #ffffff; --purecloud-script-bg-secondary: #f1f5f9; --purecloud-script-text-primary: #0f172a; --purecloud-script-text-secondary: #475569; --purecloud-script-border-color: #e2e8f0; }
                    `;
                    document.head.appendChild(st);
                }

                dashboard._lastRenderedStats = {};
                dashboard._updateStatsInternal = () => {
                    if (!dashboard.isConnected) { clearInterval(dashboard._updateInterval); return; }
                    const stats = ctx.analyticsManager.calculateStats();
                    const progress = (stats.count / ctx.CONFIG.CONVERSATION_TARGET) * 100;

                    const counterTextEl = dashboard.querySelector('.counter-text');
                    const newCounterText = `${stats.count}/${ctx.CONFIG.CONVERSATION_TARGET}`;
                    if (counterTextEl && dashboard._lastRenderedStats.counterText !== newCounterText) {
                        counterTextEl.textContent = newCounterText;
                        dashboard._lastRenderedStats.counterText = newCounterText;
                    }

                    const progressBarEl = dashboard.querySelector('.progress-bar-compact');
                    const newProgressWidth = `${Math.min(100, progress)}%`;
                    if (progressBarEl && dashboard._lastRenderedStats.progressWidth !== newProgressWidth) {
                        progressBarEl.style.width = newProgressWidth;
                        dashboard._lastRenderedStats.progressWidth = newProgressWidth;
                    }

                    if (ctx.CONFIG.MINI_DASHBOARD_MAXIMIZED) {
                        const currentTmaSeconds = Math.floor(stats.tma.split(':').reduce((acc, time) => (60 * acc) + +time, 0));
                        const targetTmaSeconds = ctx.CONFIG.LONG_CONVO_ALERT_MIN * 60;
                        let tmaIndicator = currentTmaSeconds > 0 ? (currentTmaSeconds < targetTmaSeconds * 0.9 ? '▲' : (currentTmaSeconds > targetTmaSeconds * 1.1 ? '▼' : '●')) : '';

                        const convCountElement = dashboard.querySelector('#dashboard-conv-count');
                        if (convCountElement && dashboard._lastRenderedStats.convCount !== stats.count) {
                            convCountElement.textContent = stats.count;
                            dashboard._lastRenderedStats.convCount = stats.count;
                        }

                        const tmaElement = dashboard.querySelector('#dashboard-tma');
                        const tmaHTML = `${stats.tma} <span style="font-size: 0.8em; color: ${tmaIndicator === '▲' ? 'var(--purecloud-script-success-color)' : tmaIndicator === '▼' ? 'var(--purecloud-script-error-color)' : 'var(--purecloud-script-warn-color)'};">${tmaIndicator}</span>`;
                        if (tmaElement && dashboard._lastRenderedStats.tmaHTML !== tmaHTML) {
                            tmaElement.innerHTML = tmaHTML;
                            dashboard._lastRenderedStats.tmaHTML = tmaHTML;
                        }

                        const tmeElement = dashboard.querySelector('#dashboard-tme');
                        if (tmeElement && dashboard._lastRenderedStats.tme !== stats.tme) {
                            tmeElement.textContent = stats.tme;
                            dashboard._lastRenderedStats.tme = stats.tme;
                        }

                        const baloonClicksElement = dashboard.querySelector('#dashboard-balao-clicks');
                        if (baloonClicksElement && dashboard._lastRenderedStats.baloonClicks !== stats.baloonClicks) {
                            baloonClicksElement.textContent = stats.baloonClicks;
                            dashboard._lastRenderedStats.baloonClicks = stats.baloonClicks;
                        }
                    }
                };

                const toggleButton = dashboard.querySelector('.toggle-expand-btn'); const expandIcon = dashboard.querySelector('.expand-icon'); const collapseIcon = dashboard.querySelector('.collapse-icon');
                const toggleFloatingDashboard = (forceState = null) => {
                    const shouldExpand = forceState !== null ? forceState : !ctx.CONFIG.MINI_DASHBOARD_MAXIMIZED;
                    ctx.CONFIG.MINI_DASHBOARD_MAXIMIZED = shouldExpand;
                    dashboard.classList.toggle('expanded', shouldExpand); dashboard.classList.toggle('collapsed', !shouldExpand);
                    expandIcon.style.display = shouldExpand ? 'none' : 'inline-block'; collapseIcon.style.display = shouldExpand ? 'inline-block' : 'none';
                    toggleButton.title = shouldExpand ? "Recolher" : "Expandir";

                    if (!shouldExpand) {
                        dashboard.style.width = ''; dashboard.style.height = ''; dashboard.style.resize = 'none';
                    } else {
                        const savedPosition = ctx.CONFIG.POPUP_POSITIONS['miniDashboard'];
                        if (savedPosition && savedPosition.top && savedPosition.top !== 'auto') {
                            dashboard.style.top = savedPosition.top; dashboard.style.left = savedPosition.left; dashboard.style.bottom = 'auto'; dashboard.style.right = 'auto'; dashboard.style.transform = 'none';
                        } else { dashboard.style.top = '50%'; dashboard.style.left = '50%'; dashboard.style.transform = 'translate(-50%, -50%)'; dashboard.style.bottom = 'auto'; dashboard.style.right = 'auto'; }
                        dashboard.style.width = '320px'; dashboard.style.height = 'auto'; dashboard.style.resize = 'none';
                    }
                    ctx.saveData(); dashboard._updateStatsInternal();
                };

                dashboard._toggleFloatingDashboard = toggleFloatingDashboard;
                dashboardHeader.onclick = (e) => { if (e.target.closest('.compact-btn, #mini-dashboard-adjust-attended-btn')) { return; } const wasDragging = dashboard.dataset.isDragging === 'true'; dashboard.dataset.isDragging = 'false'; if (!wasDragging && !ctx.CONFIG.MINI_DASHBOARD_MAXIMIZED) { toggleFloatingDashboard(true); } };
                toggleButton.onclick = (e) => { e.stopPropagation(); toggleFloatingDashboard(); };
                dashboard.querySelector('.close-btn').onclick = () => { clearInterval(dashboard._updateInterval); dashboard.remove(); ctx.CONFIG.MINI_DASHBOARD_VISIBLE = false; ctx.saveData(); };

                dashboard.querySelector('#mini-dashboard-tools-btn').onclick = (e) => {
                    e.stopPropagation(); ctx.CONFIG.TOOLS_VISIBLE = !ctx.CONFIG.TOOLS_VISIBLE; ctx.saveData(); ctx.UI.createAgentToolsPanel();
                };

                dashboard.querySelector('#mini-dashboard-adjust-attended-btn').onclick = (e) => {
                    e.stopPropagation(); const currentAttendedCount = ctx.analyticsManager.calculateStats().count; const newCount = prompt("Insira o novo número de conversas atendidas:", currentAttendedCount);
                    if (newCount !== null && !isNaN(newCount)) {
                        const parsedNewCount = parseInt(newCount, 10); if (parsedNewCount < 0) { ctx.UI.createNotification("O número deve ser positivo.", 'error', 4000); return; }
                        let data = ctx.analyticsManager.getData(); const currentUniqueCount = ctx.analyticsManager.calculateStats().count;
                        if (parsedNewCount < currentUniqueCount) { ctx.UI.createNotification("Use 'Resetar Contadores' nas Configurações para reduzir.", "warn", 7000); return; }
                        if (parsedNewCount > currentUniqueCount) {
                            const diff = parsedNewCount - currentUniqueCount;
                            for (let i = 0; i < diff; i++) { data.conversations.push({ timestamp: Date.now() - (i * 1000), duration: ctx.CONFIG.CHECKMARK_THRESHOLD_MS + 5000, activeDuration: ctx.CONFIG.CHECKMARK_THRESHOLD_MS + 2000, participantName: `Ajuste Manual ${Date.now()}`, phoneNumber: `000000000${i}`, isRecurrence: false, endedByAgent: 'AVALIACAO', interactionUrl: 'Ajuste Manual' }); }
                            ctx.analyticsManager.saveData(data);
                        }
                        dashboard._updateStatsInternal();
                    }
                };
                toggleFloatingDashboard(ctx.CONFIG.MINI_DASHBOARD_MAXIMIZED);
                if (dashboard._updateInterval) { clearInterval(dashboard._updateInterval); }
                dashboard._updateInterval = setInterval(dashboard._updateStatsInternal, 5000);
                dashboard._updateStatsInternal();
            } else {
                if (dashboard._updateStatsInternal) { dashboard._updateStatsInternal(); }
            }
        }};
ctx.UI.createMiniDashboard = implementation.createMiniDashboard;
});
