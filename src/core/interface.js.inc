    const UI = {
        createNotification(message, type = 'info', duration = 3000) {
            let c = document.getElementById('purecloud-script-notification-container');
            if (!c) { c = document.createElement('div'); c.id = 'purecloud-script-notification-container'; document.body.appendChild(c); }
            const n = document.createElement("div"); n.textContent = message; n.className = `purecloud-script-notification purecloud-script-notification-${type}`; c.prepend(n); const v = document.querySelectorAll('#purecloud-script-notification-container .purecloud-script-notification'); if (v.length > 5) { v[v.length - 1].remove(); } setTimeout(() => { n.style.opacity = '0'; n.style.transform = 'translateX(100%)'; setTimeout(() => n.remove(), 300); }, duration);
        },
        renderBarChart(container, perHourData) {
            container.innerHTML = ''; if (Object.keys(perHourData).length === 0) { container.innerHTML = '<div class="chart-placeholder">Nenhuma conversa para exibir gráfico.</div>'; return; } const maxCount = Math.max(...Object.values(perHourData)); const chartWrapper = document.createElement('div'); chartWrapper.className = 'chart-bars-wrapper'; for (let hour = 0; hour < 24; hour++) { const count = perHourData[hour] || 0; const height = (count / (maxCount || 1)) * 90; const barWrapper = document.createElement('div'); barWrapper.className = 'chart-bar-wrapper'; barWrapper.title = `${count} conversas às ${String(hour).padStart(2, '0')}h`; barWrapper.style.height = '100%'; barWrapper.style.position = 'relative'; barWrapper.innerHTML = `<div class="chart-bar building-bar" style="height: ${height}%; position: absolute; bottom: 0; width: 90%;"><span class="bar-count">${count > 0 ? count : ''}</span></div><span class="bar-label">${String(hour).padStart(2, '0')}h</span>`; chartWrapper.appendChild(barWrapper); } container.innerHTML = `<div class="chart-scroll-container">${chartWrapper.outerHTML}</div>`;
        },
        renderAnalyticsContent(container) {
            const stats = analyticsManager.calculateStats();
            container.innerHTML = `<div class="stats-grid"><div class="stat-item"><span>Conversas (Únicas)</span><strong id="analytics-total-count">${stats.count}</strong></div><div class="stat-item"><span>TMA (Geral)</span><strong id="analytics-tma">${stats.tma}</strong></div><div class="stat-item"><span>TME (Ativo)</span><strong id="analytics-tme">${stats.tme}</strong></div><div class="stat-item"><span>Balão (Término)</span><strong id="analytics-balao-clicks">${stats.baloonClicks}</strong></div> <div class="stat-item"><span>Início</span><strong id="analytics-first">${stats.first}</strong></div><div class="stat-item"><span>Última</span><strong id="analytics-last">${stats.last}</strong></div><div class="stat-item"><span>Meta</span><strong id="analytics-target">${CONFIG.CONVERSATION_TARGET}</strong></div><div class="stat-item"><span>Transferidos</span><strong id="analytics-transfer-count">${stats.transferClicks}</strong></div></div><div style="display:flex; justify-content:space-between; align-items:center;"><p style="font-size: 0.8em; color: var(--purecloud-script-text-secondary); margin-top: 5px;">* Balão (Término) usa o contador integrado (v4.0).</p><button id="export-shift-btn" class="purecloud-script-button" style="padding: 6px 12px; font-size: 0.85em;">📋 Copiar Resumo P/ Lua</button></div><h4>Conversas/Hora (Todas Completas)</h4><div class="analytics-chart-container-main"></div>`;
            UI.renderBarChart(container.querySelector('.analytics-chart-container-main'), stats.perHour);

            container.querySelector('#export-shift-btn').onclick = () => {
                const s = analyticsManager.calculateStats();
                const today = getBrazilTime(new Date()).toLocaleDateString('pt-BR');
                const text = `📊 RESUMO DE TURNO (${today})\nAtendimentos Únicos: ${s.count}\nTMA Geral: ${s.tma}\nTME Ativo: ${s.tme}\nTransferências: ${s.transferClicks}\nCliques Balão T.: ${s.baloonClicks}\nPrimeiro Chat: ${s.first}\nÚltimo Chat: ${s.last}`;
                copyTextToClipboard(text).then(() => UI.createNotification("Resumo do turno copiado!", "success"));
            };
        },
        renderDetailsContent(container) {
            const stats = analyticsManager.calculateStats(); const conversations = stats.allConversations.filter(c => c.duration >= CONFIG.CHECKMARK_THRESHOLD_MS).sort((a, b) => b.timestamp - a.timestamp);
            let detailsList = container.querySelector('#details-list'); if (!detailsList) { detailsList = document.createElement('div'); detailsList.id = 'details-list'; container.appendChild(detailsList); }
            if (conversations.length === 0) { detailsList.innerHTML = '<p>Nenhum atendimento completo registrado hoje.</p>'; return; }
            const conversationsAsc = conversations.reverse(); const totalCount = conversationsAsc.length; const recurrenceCount = stats.recurrenceCount;
            detailsList.innerHTML = `
                <div class="details-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;"><h4 style="margin:0; color: var(--purecloud-script-text-primary);">Total de Atendimentos Completos: ${totalCount}</h4><h4 style="margin:0; color: var(--purecloud-script-warn-color); font-weight: bold;">Recorrências Hoje: ${recurrenceCount}</h4></div>
                <table class="details-table"><thead><tr><th class="col-num">#</th><th class="col-type">Tipo</th><th>Hora Fim</th><th>Cliente</th><th>TME</th><th>Recorrência</th><th>Link</th></tr></thead><tbody>${conversationsAsc.map((conv, index) => { const time = getBrazilTime(new Date(conv.timestamp)).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); const tmeSeconds = Math.floor(conv.activeDuration / 1000); const tme = `${formatTime(Math.floor(tmeSeconds / 60))}:${formatTime(tmeSeconds % 60)}`; const recurrenceLabel = conv.isRecurrence ? '<span class="recurrence-tag">Sim</span>' : '<span class="first-tag">Não</span>'; const urlLink = conv.interactionUrl && conv.interactionUrl !== 'N/A' ? `<a href="${escapeHTML(conv.interactionUrl)}" target="_blank" title="Abrir Interação">🔗</a>` : 'N/A'; let typeIcon = '❔'; if (conv.interactionType === 'call') { typeIcon = '📞'; } else if (conv.interactionType === 'chat') { typeIcon = '💬'; } return `<tr class="${conv.isRecurrence ? 'is-recurrence-row' : ''}"><td class="col-num">${index + 1}</td><td class="col-type" title="${conv.interactionType}">${typeIcon}</td><td>${time}</td><td>${escapeHTML(conv.participantName || 'N/A')}</td><td>${tme}</td><td>${recurrenceLabel}</td><td>${urlLink}</td></tr>`; }).join('')}</tbody></table><button id="export-details-btn" class="purecloud-script-button" style="margin-top: 15px;">Exportar Detalhes (JSON)</button>`;
            const exportDetailsBtn = container.querySelector('#export-details-btn'); if (exportDetailsBtn) { exportDetailsBtn.onclick = () => actions.exportData(); }
        },
        renderClosedDetailsContent(container) {
            const balaoRecords = v4_counters.balao.slice().reverse();
            container.innerHTML = `
                <h4 style="margin-top:0;">Histórico de Cliques: Balão (Mensagens de Término)</h4><p style="font-size: 0.85em; color: var(--purecloud-script-text-secondary); margin-bottom: 15px;">Total de Cliques de Balão Hoje: <strong style="color: var(--purecloud-script-error-color);">${balaoRecords.length}</strong></p>
                <div id="closed-interactions-list" class="details-table-wrapper" style="max-height: 400px; overflow-y: auto;">${balaoRecords.length === 0 ? '<p>Nenhum clique de Balão registrado hoje.</p>' : ''}<table class="details-table"><thead><tr><th style="width: 20%;">Hora</th><th style="width: 45%;">Cliente</th><th style="width: 25%;">Telefone</th><th style="width: 10%; text-align: center;">Link</th></tr></thead><tbody>${balaoRecords.map(item => { const time = getBrazilTime(new Date(item.timestamp)).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); const urlLink = (item.interactionUrl && item.interactionUrl !== 'N/A') ? `<a href="${escapeHTML(item.interactionUrl)}" target="_blank" title="Abrir Interação">🔗</a>` : 'N/A'; return `<tr><td>${time}</td><td>${escapeHTML(item.participantName || 'N/A')}</td><td>${escapeHTML(item.phoneNumber || 'N/A')}</td><td style="text-align: center;">${urlLink}</td></tr>`; }).join('')}</tbody></table></div><button id="export-balao-details-btn" class="purecloud-script-button" style="margin-top: 15px;">Exportar Detalhes de Balão (JSON)</button>`;
            const exportDetailsBtn = container.querySelector('#export-balao-details-btn'); if (exportDetailsBtn) { exportDetailsBtn.onclick = () => { const dataToExport = v4_counters.balao; const filename = `purecloud_script_balao_closures_${getBrazilTime(new Date()).toISOString().split('T')[0]}.json`; const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); UI.createNotification("Dados exportados!", "success"); }; }
        },
        renderThemeContent(container, tempThemeColors) {
            const colorGroups = { "Interface Geral": { bgPrimary: "Fundo Principal", bgSecondary: "Fundo Secundário", textPrimary: "Texto Principal", textSecondary: "Texto Secundário", borderColor: "Cor da Borda", }, "Timers e Números (Bolhas)": { timerBg: "Fundo Padrão", accent: "Fundo (Selecionado)", timerNormalText: "Texto (Novo/Completo)", timerActiveText: "Texto (Contando)", timerPausedText: "Texto (Pausado)", timerInactiveClientText: "Texto (Cliente Inativo)", timerInactiveOperatorText: "Texto (Operador Inativo)", }, "Cores de Alerta e Status": { success: "Sucesso (Verde)", error: "Erro (Vermelho)", warn: "Aviso (Amarelo)", info: "Informação (Azul)", }, "Outros": { miniDashboardProgress: "Progresso (Mini Dashboard)" } };
            container.innerHTML = `<h3>Configurações de Tema</h3><p>Altere as cores da interface. As alterações serão aplicadas após salvar.</p><div id="theme-color-sections"></div><button id="reset-theme-btn" class="purecloud-script-button button-danger" style="margin-top: 25px;">Resetar Cores Padrão</button>`;
            const sectionsContainer = container.querySelector('#theme-color-sections'); for (const groupName in colorGroups) { const section = document.createElement('div'); section.className = 'theme-section'; section.innerHTML = `<h4>${groupName}</h4><div class="settings-group color-grid"></div>`; const grid = section.querySelector('.color-grid'); for (const key in colorGroups[groupName]) { if (tempThemeColors.hasOwnProperty(key)) { const label = colorGroups[groupName][key]; const color = tempThemeColors[key]; const pickerGroup = document.createElement('div'); pickerGroup.className = 'color-picker-group'; pickerGroup.innerHTML = `<label for="theme-color-${key}">${label}</label><input type="color" id="theme-color-${key}" data-key="${key}" value="${color}">`; grid.appendChild(pickerGroup); } } sectionsContainer.appendChild(section); }
            container.querySelectorAll('input[type="color"]').forEach(input => { input.addEventListener('input', (e) => { tempThemeColors[e.target.dataset.key] = e.target.value; }); });
            container.querySelector('#reset-theme-btn').onclick = () => { if (!confirm("Resetar todas as cores para o padrão?")) return; Object.assign(tempThemeColors, JSON.parse(JSON.stringify(defaultThemeColors))); container.querySelectorAll('input[type="color"]').forEach(input => { const key = input.dataset.key; if (tempThemeColors.hasOwnProperty(key)) { input.value = tempThemeColors[key]; } }); UI.createNotification("Cores resetadas para o padrão. Salve para confirmar.", "info"); };
        },
        createSettingsPanel() {
            document.querySelector('.purecloud-script-settings-panel')?.remove(); const panel = document.createElement('div'); panel.className = 'purecloud-script-settings-panel purecloud-script-popup'; if (CONFIG.DARK_MODE) panel.classList.add('gcp-tema-escuro'); let tempHotkeysConfig = { ...CONFIG.HOTKEYS }; let tempThemeColors = JSON.parse(JSON.stringify(CONFIG.THEME_COLORS));

            const iconAnalytics = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>`;
            const iconAtendimentos = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`;
            const iconEncerrados = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
            const iconGeral = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2 2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`;
            const iconAparencia = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>`;
            const iconAtalhos = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect><line x1="6" y1="8" x2="6.01" y2="8"></line><line x1="10" y1="8" x2="10.01" y2="8"></line><line x1="14" y1="8" x2="14.01" y2="8"></line><line x1="18" y1="8" x2="18.01" y2="8"></line><line x1="6" y1="12" x2="6.01" y2="12"></line><line x1="10" y1="12" x2="10.01" y2="12"></line><line x1="14" y1="12" x2="14.01" y2="12"></line><line x1="18" y1="12" x2="18.01" y2="12"></line><line x1="10" y1="16" x2="14" y2="16"></line></svg>`;

            panel.innerHTML = `
                <div class="panel-header" style="cursor: move;">
                    <h2>Config. Contador</h2>
                    <div class="panel-header-buttons">
                        <button class="panel-header-btn minimize-btn" title="Minimizar">-</button>
                        <button class="panel-header-btn purecloud-script-popup-close-btn" id="closeSettingsPanelBtn" title="Fechar">X</button>
                    </div>
                </div>
                <div class="purecloud-script-tabs">
                    <button class="purecloud-script-tab-button active" data-tab="analytics">${iconAnalytics} Analytics</button>
                    <button class="purecloud-script-tab-button" data-tab="details">${iconAtendimentos} Atendimentos</button>
                    <button class="purecloud-script-tab-button" data-tab="closed">${iconEncerrados} Encerrados</button>
                    <button class="purecloud-script-tab-button" data-tab="general">${iconGeral} Geral</button>
                    <button class="purecloud-script-tab-button" data-tab="theme">${iconAparencia} Aparência</button>
                    <button class="purecloud-script-tab-button" data-tab="hotkeys">${iconAtalhos} Atalhos</button>
                </div>
                <div class="panel-content">
                    <div class="purecloud-script-tab-content active" data-tab-content="analytics"></div>
                    <div class="purecloud-script-tab-content" data-tab-content="details"></div>
                    <div class="purecloud-script-tab-content" data-tab-content="closed"></div>
                    <div class="purecloud-script-tab-content" data-tab-content="general"></div>
                    <div class="purecloud-script-tab-content" data-tab-content="theme"></div>
                    <div class="purecloud-script-tab-content" data-tab-content="hotkeys"></div>
                </div>
                <div class="panel-footer">
                    <button id="save-settings-btn" class="purecloud-script-button">Salvar e Fechar</button>
                </div>`;

            document.body.appendChild(panel); makeDraggable(panel, panel.querySelector('.panel-header'), 'settingsPanel'); panel.querySelector('#closeSettingsPanelBtn').onclick = () => panel.remove();

            const renderHotkeys = (container) => {
                container.innerHTML = '<h3>Atalhos de Teclado</h3><p>Clique no campo de atalho e pressione a tecla desejada. Use ESC para cancelar a gravação.</p><div id="hotkey-list"></div>';
                const hotkeyList = container.querySelector('#hotkey-list');
                for (const actionKey in tempHotkeysConfig) {
                    const feature = featureDescriptions[actionKey];
                    if (!feature) continue;
                    const hotkeyGroup = document.createElement('div'); hotkeyGroup.className = 'settings-group hotkey-group';
                    hotkeyGroup.innerHTML = `<label for="hotkey-${actionKey}">${feature.title} <span style="display:block; font-size:0.8em; color:var(--purecloud-script-text-secondary); font-weight:normal;">${feature.description}</span></label><input type="text" id="hotkey-${actionKey}" data-action="${actionKey}" value="${tempHotkeysConfig[actionKey]}" readonly class="hotkey-input">`;
                    hotkeyList.appendChild(hotkeyGroup);
                }
                hotkeyList.querySelectorAll('.hotkey-input').forEach(input => {
                    document.removeEventListener('keydown', input._captureHotkey, true);
                    const captureHotkey = (e) => {
                        if (!input.classList.contains('listening')) return;
                        e.preventDefault(); e.stopPropagation();
                        if (e.key === 'Escape') { input.classList.remove('listening'); input.value = tempHotkeysConfig[input.dataset.action]; input.title = ''; document.removeEventListener('keydown', input._captureHotkey, true); return; }
                        const newCombo = getHotkeyCombo(e);
                        if (['Control', 'Shift', 'Alt'].includes(e.key) && newCombo.split('+').length < 2) { return; }
                        const existingAction = Object.keys(tempHotkeysConfig).find(key => tempHotkeysConfig[key] === newCombo && key !== input.dataset.action);
                        if (existingAction) { UI.createNotification(`Conflito! Já está em uso.`, 'error', 5000); input.value = tempHotkeysConfig[input.dataset.action]; }
                        else if (newCombo.split('+').length < 2) { UI.createNotification("Deve conter pelo menos um modificador (Ctrl, Shift, Alt).", 'warn', 4000); input.value = tempHotkeysConfig[input.dataset.action]; }
                        else { tempHotkeysConfig[input.dataset.action] = newCombo; input.value = newCombo; UI.createNotification(`Atalho salvo temporariamente.`, 'info', 3000); }
                        input.classList.remove('listening'); input.title = ''; document.removeEventListener('keydown', input._captureHotkey, true);
                    };
                    input._captureHotkey = captureHotkey;
                    input.addEventListener('click', () => {
                        if (input.classList.contains('listening')) { input.classList.remove('listening'); input.value = tempHotkeysConfig[input.dataset.action]; input.title = ''; document.removeEventListener('keydown', input._captureHotkey, true); return; }
                        hotkeyList.querySelectorAll('.hotkey-input.listening').forEach(i => { i.classList.remove('listening'); i.value = tempHotkeysConfig[i.dataset.action]; i.title = ''; document.removeEventListener('keydown', i._captureHotkey, true); });
                        input.classList.add('listening'); input.value = 'Pressione o atalho...'; input.title = 'Pressione ESC para cancelar'; document.addEventListener('keydown', input._captureHotkey, true);
                    });
                });
            };

            const switchTab = (tabId) => {
                panel.querySelectorAll('.purecloud-script-tab-button').forEach(btn => btn.classList.remove('active')); panel.querySelectorAll('.purecloud-script-tab-content').forEach(content => content.classList.remove('active'));
                const targetTabBtn = panel.querySelector(`.purecloud-script-tab-button[data-tab="${tabId}"]`); const targetTabContent = panel.querySelector(`[data-tab-content="${tabId}"]`);
                if (targetTabBtn) targetTabBtn.classList.add('active'); if (targetTabContent) targetTabContent.classList.add('active');
                if (tabId === 'general') { panel.querySelector('#conversation-target').value = CONFIG.CONVERSATION_TARGET; panel.querySelector('#dark-mode-toggle').checked = CONFIG.DARK_MODE; panel.querySelector('#sound-alerts-toggle').checked = CONFIG.SOUND_ALERTS_ENABLED; panel.querySelector('#inactivity-client-alert-seconds').value = CONFIG.INACTIVITY_CLIENT_ALERT_SECONDS; panel.querySelector('#inactivity-operator-alert-seconds').value = CONFIG.INACTIVITY_OPERATOR_ALERT_SECONDS; panel.querySelector('#long-convo-alert-min').value = CONFIG.LONG_CONVO_ALERT_MIN; } else if (tabId === 'analytics') { UI.renderAnalyticsContent(targetTabContent); } else if (tabId === 'details') { UI.renderDetailsContent(targetTabContent); } else if (tabId === 'closed') { UI.renderClosedDetailsContent(targetTabContent); } else if (tabId === 'hotkeys') { renderHotkeys(targetTabContent); } else if (tabId === 'theme') { UI.renderThemeContent(targetTabContent, tempThemeColors); }
                if (tabId !== 'hotkeys') { panel.querySelectorAll('.hotkey-input.listening').forEach(i => { i.classList.remove('listening'); i.value = tempHotkeysConfig[i.dataset.action]; i.title = ''; document.removeEventListener('keydown', i._captureHotkey, true); }); }
            };
            panel.querySelectorAll('.purecloud-script-tab-button').forEach(btn => { btn.onclick = () => switchTab(btn.dataset.tab); });
            const generalTab = panel.querySelector('[data-tab-content="general"]');
            generalTab.innerHTML = `<div class="settings-group"><label for="conversation-target">Meta Conversas Diárias:</label><input type="number" id="conversation-target" value="${CONFIG.CONVERSATION_TARGET}" min="1"></div><div class="settings-group"><label>Modo Escuro (Cronômetros):</label><label class="switch"><input type="checkbox" id="dark-mode-toggle" ${CONFIG.DARK_MODE ? 'checked' : ''}><span class="slider round"></span></label></div><div class="settings-group"><label>Sons e Confetes 🎉:</label><label class="switch"><input type="checkbox" id="sound-alerts-toggle" ${CONFIG.SOUND_ALERTS_ENABLED ? 'checked' : ''}><span class="slider round"></span></label></div><div class="settings-group"><label for="inactivity-client-alert-seconds">Alerta Inatividade CLIENTE (seg, min 30):</label><input type="number" id="inactivity-client-alert-seconds" value="${CONFIG.INACTIVITY_CLIENT_ALERT_SECONDS}" min="30"></div><div class="settings-group"><label for="inactivity-operator-alert-seconds">Alerta Inatividade OPERADOR (seg, min 10):</label><input type="number" id="inactivity-operator-alert-seconds" value="${CONFIG.INACTIVITY_OPERATOR_ALERT_SECONDS}" min="10"></div><div class="settings-group"><label for="long-convo-alert-min">Alerta Conversa Longa (min, min 5):</label><input type="number" id="long-convo-alert-min" value="${CONFIG.LONG_CONVO_ALERT_MIN}" min="5"></div><div class="settings-group"><h4>Sincronização & Dados:</h4><p style="font-size:0.85em; color:var(--purecloud-script-success-color);">✅ Sincronização automática ativa</p><button id="adjust-tma-btn" class="purecloud-script-button" style="margin-bottom:10px;">Ajustar TMA Manual</button><br><button id="reset-counter-btn" class="purecloud-script-button button-danger">Resetar Contadores/Dados do Dia</button></div>`;
            panel.querySelector('#reset-counter-btn').onclick = () => { if (confirm("Tem certeza? Isso apagará os dados de hoje localmente.")) { analyticsManager.clearAllData(); UI.renderDetailsContent(panel.querySelector('[data-tab-content="details"]')); UI.renderAnalyticsContent(panel.querySelector('[data-tab-content="analytics"]')); UI.renderClosedDetailsContent(panel.querySelector('[data-tab-content="closed"]')); } };
            
            panel.querySelector('#adjust-tma-btn').onclick = () => {
                const currentTma = analyticsManager.calculateStats().tma;
                const newTma = prompt("Insira o novo TMA desejado (formato MM:SS):", currentTma);
                if (!newTma || !/^\d{2}:\d{2}$/.test(newTma)) { if (newTma !== null) UI.createNotification("Formato inválido. Use MM:SS", "error"); return; }
                const parts = newTma.split(':');
                const targetSeconds = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
                
                let data = analyticsManager.getData();
                let completedConvos = data.conversations.filter(c => c.duration >= CONFIG.CHECKMARK_THRESHOLD_MS);
                if (completedConvos.length === 0) { UI.createNotification("Você precisa ter pelo menos 1 atendimento para ajustar o TMA.", "error"); return; }
                
                const currentTotalMs = completedConvos.reduce((sum, conv) => sum + conv.duration, 0);
                const targetTotalMs = (targetSeconds * completedConvos.length) * 1000;
                const diffMs = targetTotalMs - currentTotalMs;
                
                let firstCompletedIndex = data.conversations.findIndex(c => c.duration >= CONFIG.CHECKMARK_THRESHOLD_MS);
                if (firstCompletedIndex !== -1) {
                    data.conversations[firstCompletedIndex].duration += diffMs;
                    if (data.conversations[firstCompletedIndex].duration < 1000) data.conversations[firstCompletedIndex].duration = 1000;
                    analyticsManager.saveData(data);
                    
                    if (document.getElementById('purecloud-script-mini-dashboard')) { document.getElementById('purecloud-script-mini-dashboard')._updateStatsInternal(); }
                    
                    // Atualiza a tela de Analytics imediatamente se estiver aberta
                    const analyticsTab = panel.querySelector('[data-tab-content="analytics"]');
                    if (analyticsTab) UI.renderAnalyticsContent(analyticsTab);
                    
                    UI.createNotification("TMA ajustado com sucesso!", "success");
                }
            };
            panel.querySelector('[data-tab-content="analytics"]').innerHTML = `<div id="analytics-content-main"><button id="load-stats-btn" class="purecloud-script-button">Carregar Estatísticas</button></div>`; panel.querySelector('#load-stats-btn').onclick = () => { UI.renderAnalyticsContent(panel.querySelector('[data-tab-content="analytics"]')); };
            panel.querySelector('#save-settings-btn').onclick = () => {
                CONFIG.CONVERSATION_TARGET = validateConfigValue('CONVERSATION_TARGET', panel.querySelector('#conversation-target').value); CONFIG.INACTIVITY_CLIENT_ALERT_SECONDS = validateConfigValue('INACTIVITY_CLIENT_ALERT_SECONDS', panel.querySelector('#inactivity-client-alert-seconds').value); CONFIG.INACTIVITY_OPERATOR_ALERT_SECONDS = validateConfigValue('INACTIVITY_OPERATOR_ALERT_SECONDS', panel.querySelector('#inactivity-operator-alert-seconds').value); CONFIG.LONG_CONVO_ALERT_MIN = validateConfigValue('LONG_CONVO_ALERT_MIN', panel.querySelector('#long-convo-alert-min').value); CONFIG.SOUND_ALERTS_ENABLED = validateConfigValue('SOUND_ALERTS_ENABLED', panel.querySelector('#sound-alerts-toggle').checked);
                CONFIG.HOTKEYS = validateConfigValue('HOTKEYS', tempHotkeysConfig); CONFIG.THEME_COLORS = validateConfigValue('THEME_COLORS', tempThemeColors);
                saveData(); document.querySelectorAll('.purecloud-script-popup, .purecloud-script-custom-btn, #purecloud-script-notification-container, .injected-bubbles-container').forEach(el => el.classList.toggle('gcp-tema-escuro', CONFIG.DARK_MODE)); UI.createNotification("Configurações salvas!", "success"); panel.remove(); document.getElementById('purecloud-script-injected-style')?.remove(); injectCss(); const toolbarEl = findEl(CONFIG.PURECLOUD_SELECTORS.TOOLBAR); if (toolbarEl) { toolbarEl.dataset.scriptVersion = ''; createToolbarUI(toolbarEl); }
            };
            switchTab('analytics');
        },

        createAgentToolsPanel() {
            if (!CONFIG.TOOLS_VISIBLE) { document.getElementById('purecloud-script-tools-panel')?.remove(); return; }
            let panel = document.getElementById('purecloud-script-tools-panel');
            if (!panel) {
                panel = document.createElement('div');
                panel.id = 'purecloud-script-tools-panel';
                panel.className = 'purecloud-script-popup';

                const iconNotes = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`;
                const iconForm = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`;
                const iconZap = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px;"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`;
                const iconLink = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px;"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"></path></svg>`;
                const iconBell = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px;"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>`;

                panel.innerHTML = `
                    <div class="panel-header" style="cursor: move;">
                        <h2>🛠️ Ferramentas Rápidas</h2>
                        <div class="panel-header-buttons">
                            <button id="tools-btn-theme" class="panel-header-btn" title="Mudar Tema" style="cursor: pointer; font-size: 16px; margin-right: 8px; background: none; border: none; color: inherit;">🌗</button>
                            <button class="panel-header-btn purecloud-script-popup-close-btn" id="closeToolsBtn" title="Fechar">X</button>
                        </div>
                    </div>
                    <style>
                        #purecloud-script-tools-panel.cc-escurinho { --purecloud-script-bg-primary: #0f172a; --purecloud-script-bg-secondary: #1e293b; --purecloud-script-text-primary: #f8fafc; --purecloud-script-text-secondary: #cbd5e1; --purecloud-script-border-color: #334155; }
                        #purecloud-script-tools-panel.local-light-mode { --purecloud-script-bg-primary: #ffffff; --purecloud-script-bg-secondary: #f1f5f9; --purecloud-script-text-primary: #0f172a; --purecloud-script-text-secondary: #475569; --purecloud-script-border-color: #e2e8f0; }
                    </style>
                    <div class="purecloud-script-tabs" style="font-size: 0.85em; padding: 0 5px;">
                        <button class="purecloud-script-tab-button active" data-tab="notas">${iconNotes} Notas</button>
                        <button class="purecloud-script-tab-button" data-tab="respostas">${iconZap} Respostas</button>
                        <button class="purecloud-script-tab-button" data-tab="lembretes">${iconBell} Lembretes</button>
                        <button class="purecloud-script-tab-button" data-tab="links">${iconLink} Links</button>
                    </div>
                    <div class="panel-content" style="padding: 15px;">
                        <div class="purecloud-script-tab-content active" data-tab-content="notas">
                            <textarea id="tools-notepad" style="width:100%; height:200px; resize:none; border-radius:8px; padding:10px; background:var(--purecloud-script-bg-primary); color:var(--purecloud-script-text-primary); border:1px solid var(--purecloud-script-border-color);" placeholder="Digite suas anotações temporárias aqui... Salva automaticamente!"></textarea>
                        </div>
                        
                        <div class="purecloud-script-tab-content" data-tab-content="respostas">
                            <p style="font-size: 0.8em; color:var(--purecloud-script-text-secondary); margin-bottom: 10px;">Dica: Digite <strong>/oi</strong> (com espaço) no chat para usar os atalhos mágicos.</p>
                            <div id="quick-replies-list" style="display:flex; flex-direction:column; gap:8px;"></div>
                        </div>

                        <div class="purecloud-script-tab-content" data-tab-content="lembretes">
                            <p style="font-size: 0.85em; color:var(--purecloud-script-text-primary); margin-bottom: 15px;">O cliente pediu um minuto? Defina um alerta para não esquecer de retornar ao chat.</p>
                            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
                                <button class="purecloud-script-button btn-lembrete" data-time="1">1 Min</button>
                                <button class="purecloud-script-button btn-lembrete" data-time="3">3 Min</button>
                                <button class="purecloud-script-button btn-lembrete" data-time="5">5 Min</button>
                            </div>
                        </div>

                        <div class="purecloud-script-tab-content" data-tab-content="links">
                            <div id="useful-links-list" style="display:flex; flex-direction:column; gap:8px;"></div>
                        </div>
                    </div>
                `;
                document.body.appendChild(panel); makeDraggable(panel, panel.querySelector('.panel-header'), 'toolsPanel');
                panel.querySelector('#closeToolsBtn').onclick = () => { CONFIG.TOOLS_VISIBLE = false; saveData(); panel.remove(); };

                const themeBtnTools = panel.querySelector('#tools-btn-theme');
                const savedThemeTools = ajaStorage.getItem('TOOLS_THEME');
                if (savedThemeTools === 'light') {
                    panel.classList.add('local-light-mode');
                    themeBtnTools.innerText = '☀️';
                } else if (savedThemeTools === 'dark') {
                    panel.classList.add('cc-escurinho');
                    themeBtnTools.innerText = '🌗';
                }
                themeBtnTools.onclick = () => {
                    const isLight = panel.classList.contains('local-light-mode');
                    if (isLight) {
                        panel.classList.remove('local-light-mode');
                        panel.classList.add('cc-escurinho');
                        ajaStorage.setItem('TOOLS_THEME', 'dark');
                        themeBtnTools.innerText = '🌗';
                    } else {
                        panel.classList.remove('cc-escurinho');
                        panel.classList.add('local-light-mode');
                        ajaStorage.setItem('TOOLS_THEME', 'light');
                        themeBtnTools.innerText = '☀️';
                    }
                };

                const switchToolsTab = (tabId) => {
                    panel.querySelectorAll('.purecloud-script-tab-button').forEach(btn => btn.classList.remove('active'));
                    panel.querySelectorAll('.purecloud-script-tab-content').forEach(content => content.classList.remove('active'));
                    panel.querySelector(`.purecloud-script-tab-button[data-tab="${tabId}"]`)?.classList.add('active');
                    panel.querySelector(`[data-tab-content="${tabId}"]`)?.classList.add('active');
                };
                panel.querySelectorAll('.purecloud-script-tab-button').forEach(btn => { btn.onclick = () => switchToolsTab(btn.dataset.tab); });

                const notepad = panel.querySelector('#tools-notepad'); notepad.value = ajaStorage.getItem('purecloudScript_notepad') || ''; notepad.addEventListener('input', (e) => { ajaStorage.setItem('purecloudScript_notepad', e.target.value); });

                // Populando Respostas Rápidas (Padrão)
                const qrList = panel.querySelector('#quick-replies-list');

                CONFIG.QUICK_REPLIES.forEach(qr => {
                    // Preenche a aba Respostas visuais (Lista)
                    const btn = document.createElement('button'); btn.className = 'purecloud-script-button';
                    btn.style.cssText = "text-align:left; padding: 8px 12px; background:var(--purecloud-script-bg-secondary); color:var(--purecloud-script-text-primary); border:1px solid var(--purecloud-script-border-color); box-shadow:none; position:relative;";
                    btn.innerHTML = `<strong>${escapeHTML(qr.title)}</strong> <span style="font-size:0.8em; color:var(--purecloud-script-accent-color); float:right; font-weight:bold;">${escapeHTML(qr.shortcut || '')}</span> <span style="display:block; font-size:0.8em; font-weight:normal; color:var(--purecloud-script-text-secondary); margin-top:4px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHTML(qr.text)}</span>`;
                    btn.onmouseover = () => { btn.style.borderColor = 'var(--purecloud-script-accent-color)'; }; btn.onmouseout = () => { btn.style.borderColor = 'var(--purecloud-script-border-color)'; };

                    const dispatchSnippet = async () => {
                        const chatInputField = getChatInput();
                        const textToInject = templateProcessor.process(qr.text);
                        if (chatInputField) {
                            chatInputField.value = textToInject; chatInputField.dispatchEvent(new Event('input', { bubbles: true })); chatInputField.focus();
                            UI.createNotification("Resposta inserida no chat!", "success");
                        } else {
                            if (await copyTextToClipboard(textToInject)) { UI.createNotification("Resposta copiada para o mouse!", "info"); }
                        }
                    };
                    btn.onclick = dispatchSnippet;
                    qrList.appendChild(btn);
                });

                // Populando Links Úteis
                const linksList = panel.querySelector('#useful-links-list');
                USEFUL_LINKS.forEach(link => {
                    const btn = document.createElement('button'); btn.className = 'purecloud-script-button';
                    btn.style.cssText = `text-align:center; padding: 10px; background:${link.color}; color:#fff; border:none; margin-bottom: 5px; font-weight: bold;`;
                    btn.textContent = link.title;
                    btn.onclick = () => window.open(link.url, '_blank');
                    linksList.appendChild(btn);
                });

                // Lógica dos Lembretes
                panel.querySelectorAll('.btn-lembrete').forEach(btn => {
                    btn.onclick = (e) => {
                        const minutes = parseInt(e.target.dataset.time);
                        const selectedConvEl = findEl(CONFIG.PURECLOUD_SELECTORS.SELECTED_INTERACTION_GROUP);
                        let { participantName } = documentExtractor.getNameAndNumber(selectedConvEl);
                        if (!participantName || participantName === 'N/A') participantName = 'o cliente';

                        UI.createNotification(`Alarme configurado! Avisarei sobre ${participantName} em ${minutes} minuto(s).`, "success");

                        setTimeout(() => {
                            effectsManager.playBeep('reminder');
                            UI.createNotification(`⏰ HORA DE RETORNAR!\nVerifique o chat do cliente: ${participantName}`, "error", 15000);
                        }, minutes * 60000);
                    };
                });

            }
        },

        createMiniDashboard() {
            if (!CONFIG.MINI_DASHBOARD_VISIBLE) { const dashboard = document.getElementById('purecloud-script-mini-dashboard'); if (dashboard && dashboard._updateInterval) { clearInterval(dashboard._updateInterval); } dashboard?.remove(); return; }
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
                const dashboardHeader = dashboard.querySelector('.mini-dashboard-header'); makeDraggable(dashboard, dashboardHeader, 'miniDashboard');

                const themeBtnDash = dashboard.querySelector('#mini-dashboard-btn-theme');
                const savedThemeDash = ajaStorage.getItem('DASHBOARD_THEME');
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
                        ajaStorage.setItem('DASHBOARD_THEME', 'dark');
                        themeBtnDash.innerText = '🌗';
                    } else {
                        dashboard.classList.remove('cc-escurinho');
                        dashboard.classList.add('local-light-mode');
                        ajaStorage.setItem('DASHBOARD_THEME', 'light');
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
                    const stats = analyticsManager.calculateStats();
                    const progress = (stats.count / CONFIG.CONVERSATION_TARGET) * 100;

                    const counterTextEl = dashboard.querySelector('.counter-text');
                    const newCounterText = `${stats.count}/${CONFIG.CONVERSATION_TARGET}`;
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

                    if (CONFIG.MINI_DASHBOARD_MAXIMIZED) {
                        const currentTmaSeconds = Math.floor(stats.tma.split(':').reduce((acc, time) => (60 * acc) + +time, 0));
                        const targetTmaSeconds = CONFIG.LONG_CONVO_ALERT_MIN * 60;
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
                    const shouldExpand = forceState !== null ? forceState : !CONFIG.MINI_DASHBOARD_MAXIMIZED;
                    CONFIG.MINI_DASHBOARD_MAXIMIZED = shouldExpand;
                    dashboard.classList.toggle('expanded', shouldExpand); dashboard.classList.toggle('collapsed', !shouldExpand);
                    expandIcon.style.display = shouldExpand ? 'none' : 'inline-block'; collapseIcon.style.display = shouldExpand ? 'inline-block' : 'none';
                    toggleButton.title = shouldExpand ? "Recolher" : "Expandir";

                    if (!shouldExpand) {
                        dashboard.style.width = ''; dashboard.style.height = ''; dashboard.style.resize = 'none';
                    } else {
                        const savedPosition = CONFIG.POPUP_POSITIONS['miniDashboard'];
                        if (savedPosition && savedPosition.top && savedPosition.top !== 'auto') {
                            dashboard.style.top = savedPosition.top; dashboard.style.left = savedPosition.left; dashboard.style.bottom = 'auto'; dashboard.style.right = 'auto'; dashboard.style.transform = 'none';
                        } else { dashboard.style.top = '50%'; dashboard.style.left = '50%'; dashboard.style.transform = 'translate(-50%, -50%)'; dashboard.style.bottom = 'auto'; dashboard.style.right = 'auto'; }
                        dashboard.style.width = '320px'; dashboard.style.height = 'auto'; dashboard.style.resize = 'none';
                    }
                    saveData(); dashboard._updateStatsInternal();
                };

                dashboard._toggleFloatingDashboard = toggleFloatingDashboard;
                dashboardHeader.onclick = (e) => { if (e.target.closest('.compact-btn, #mini-dashboard-adjust-attended-btn')) { return; } const wasDragging = dashboard.dataset.isDragging === 'true'; dashboard.dataset.isDragging = 'false'; if (!wasDragging && !CONFIG.MINI_DASHBOARD_MAXIMIZED) { toggleFloatingDashboard(true); } };
                toggleButton.onclick = (e) => { e.stopPropagation(); toggleFloatingDashboard(); };
                dashboard.querySelector('.close-btn').onclick = () => { clearInterval(dashboard._updateInterval); dashboard.remove(); CONFIG.MINI_DASHBOARD_VISIBLE = false; saveData(); };

                dashboard.querySelector('#mini-dashboard-tools-btn').onclick = (e) => {
                    e.stopPropagation(); CONFIG.TOOLS_VISIBLE = !CONFIG.TOOLS_VISIBLE; saveData(); UI.createAgentToolsPanel();
                };

                dashboard.querySelector('#mini-dashboard-adjust-attended-btn').onclick = (e) => {
                    e.stopPropagation(); const currentAttendedCount = analyticsManager.calculateStats().count; const newCount = prompt("Insira o novo número de conversas atendidas:", currentAttendedCount);
                    if (newCount !== null && !isNaN(newCount)) {
                        const parsedNewCount = parseInt(newCount, 10); if (parsedNewCount < 0) { UI.createNotification("O número deve ser positivo.", 'error', 4000); return; }
                        let data = analyticsManager.getData(); const currentUniqueCount = analyticsManager.calculateStats().count;
                        if (parsedNewCount < currentUniqueCount) { UI.createNotification("Use 'Resetar Contadores' nas Configurações para reduzir.", "warn", 7000); return; }
                        if (parsedNewCount > currentUniqueCount) {
                            const diff = parsedNewCount - currentUniqueCount;
                            for (let i = 0; i < diff; i++) { data.conversations.push({ timestamp: Date.now() - (i * 1000), duration: CONFIG.CHECKMARK_THRESHOLD_MS + 5000, activeDuration: CONFIG.CHECKMARK_THRESHOLD_MS + 2000, participantName: `Ajuste Manual ${Date.now()}`, phoneNumber: `000000000${i}`, isRecurrence: false, endedByAgent: 'AVALIACAO', interactionUrl: 'Ajuste Manual' }); }
                            analyticsManager.saveData(data);
                        }
                        dashboard._updateStatsInternal();
                    }
                };
                toggleFloatingDashboard(CONFIG.MINI_DASHBOARD_MAXIMIZED);
                if (dashboard._updateInterval) { clearInterval(dashboard._updateInterval); }
                dashboard._updateInterval = setInterval(dashboard._updateStatsInternal, 5000);
                dashboard._updateStatsInternal();
            } else {
                if (dashboard._updateStatsInternal) { dashboard._updateStatsInternal(); }
            }
        },
    };

    const defaultTheme = { bgPrimary: '#ffffff', bgSecondary: '#f8fafc', textPrimary: '#1e293b', textSecondary: '#64748b', borderColor: '#e2e8f0', accent: '#6366f1', accentText: '#ffffff', success: '#10b981', error: '#ef4444', warn: '#f59e0b', info: '#3b82f6', timerBg: '#f8fafc', timerNormalText: '#1e293b', timerActiveText: '#6366f1', timerPausedText: '#f59e0b', timerInactiveClientText: '#ef4444', timerCompletedBg: '#10b981', miniDashboardProgress: '#10b981' };
    let theme;
    try {
        theme = JSON.parse(ajaStorage.getItem('gcp_themeColors_v2')) || JSON.parse(ajaStorage.getItem('timerColors')) || defaultTheme;
    } catch (e) { theme = defaultTheme; }

