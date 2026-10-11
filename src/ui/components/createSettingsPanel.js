// Shared dependencies: CONFIG, UI, analyticsManager, createToolbarUI, featureDescriptions, findEl, getHotkeyCombo, injectCss, makeDraggable, saveData, validateConfigValue
window.AjaModular.register("ui-createSettingsPanel", [], function(ctx) {
const implementation = {createSettingsPanel() {
            document.querySelector('.purecloud-script-settings-panel')?.remove(); const panel = document.createElement('div'); panel.className = 'purecloud-script-settings-panel purecloud-script-popup'; if (ctx.CONFIG.DARK_MODE) panel.classList.add('gcp-tema-escuro'); let tempHotkeysConfig = { ...ctx.CONFIG.HOTKEYS }; let tempThemeColors = JSON.parse(JSON.stringify(ctx.CONFIG.THEME_COLORS));

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

            document.body.appendChild(panel); ctx.makeDraggable(panel, panel.querySelector('.panel-header'), 'settingsPanel'); panel.querySelector('#closeSettingsPanelBtn').onclick = () => panel.remove();

            const renderHotkeys = (container) => {
                container.innerHTML = '<h3>Atalhos de Teclado</h3><p>Clique no campo de atalho e pressione a tecla desejada. Use ESC para cancelar a gravação.</p><div id="hotkey-list"></div>';
                const hotkeyList = container.querySelector('#hotkey-list');
                for (const actionKey in tempHotkeysConfig) {
                    const feature = ctx.featureDescriptions[actionKey];
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
                        const newCombo = ctx.getHotkeyCombo(e);
                        if (['Control', 'Shift', 'Alt'].includes(e.key) && newCombo.split('+').length < 2) { return; }
                        const existingAction = Object.keys(tempHotkeysConfig).find(key => tempHotkeysConfig[key] === newCombo && key !== input.dataset.action);
                        if (existingAction) { ctx.UI.createNotification(`Conflito! Já está em uso.`, 'error', 5000); input.value = tempHotkeysConfig[input.dataset.action]; }
                        else if (newCombo.split('+').length < 2) { ctx.UI.createNotification("Deve conter pelo menos um modificador (Ctrl, Shift, Alt).", 'warn', 4000); input.value = tempHotkeysConfig[input.dataset.action]; }
                        else { tempHotkeysConfig[input.dataset.action] = newCombo; input.value = newCombo; ctx.UI.createNotification(`Atalho salvo temporariamente.`, 'info', 3000); }
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
                if (tabId === 'general') { panel.querySelector('#conversation-target').value = ctx.CONFIG.CONVERSATION_TARGET; panel.querySelector('#dark-mode-toggle').checked = ctx.CONFIG.DARK_MODE; panel.querySelector('#sound-alerts-toggle').checked = ctx.CONFIG.SOUND_ALERTS_ENABLED; panel.querySelector('#inactivity-client-alert-seconds').value = ctx.CONFIG.INACTIVITY_CLIENT_ALERT_SECONDS; panel.querySelector('#inactivity-operator-alert-seconds').value = ctx.CONFIG.INACTIVITY_OPERATOR_ALERT_SECONDS; panel.querySelector('#long-convo-alert-min').value = ctx.CONFIG.LONG_CONVO_ALERT_MIN; } else if (tabId === 'analytics') { ctx.UI.renderAnalyticsContent(targetTabContent); } else if (tabId === 'details') { ctx.UI.renderDetailsContent(targetTabContent); } else if (tabId === 'closed') { ctx.UI.renderClosedDetailsContent(targetTabContent); } else if (tabId === 'hotkeys') { renderHotkeys(targetTabContent); } else if (tabId === 'theme') { ctx.UI.renderThemeContent(targetTabContent, tempThemeColors); }
                if (tabId !== 'hotkeys') { panel.querySelectorAll('.hotkey-input.listening').forEach(i => { i.classList.remove('listening'); i.value = tempHotkeysConfig[i.dataset.action]; i.title = ''; document.removeEventListener('keydown', i._captureHotkey, true); }); }
            };
            panel.querySelectorAll('.purecloud-script-tab-button').forEach(btn => { btn.onclick = () => switchTab(btn.dataset.tab); });
            const generalTab = panel.querySelector('[data-tab-content="general"]');
            generalTab.innerHTML = `<div class="settings-group"><label for="conversation-target">Meta Conversas Diárias:</label><input type="number" id="conversation-target" value="${ctx.CONFIG.CONVERSATION_TARGET}" min="1"></div><div class="settings-group"><label>Modo Escuro (Cronômetros):</label><label class="switch"><input type="checkbox" id="dark-mode-toggle" ${ctx.CONFIG.DARK_MODE ? 'checked' : ''}><span class="slider round"></span></label></div><div class="settings-group"><label>Sons e Confetes 🎉:</label><label class="switch"><input type="checkbox" id="sound-alerts-toggle" ${ctx.CONFIG.SOUND_ALERTS_ENABLED ? 'checked' : ''}><span class="slider round"></span></label></div><div class="settings-group"><label for="inactivity-client-alert-seconds">Alerta Inatividade CLIENTE (seg, min 30):</label><input type="number" id="inactivity-client-alert-seconds" value="${ctx.CONFIG.INACTIVITY_CLIENT_ALERT_SECONDS}" min="30"></div><div class="settings-group"><label for="inactivity-operator-alert-seconds">Alerta Inatividade OPERADOR (seg, min 10):</label><input type="number" id="inactivity-operator-alert-seconds" value="${ctx.CONFIG.INACTIVITY_OPERATOR_ALERT_SECONDS}" min="10"></div><div class="settings-group"><label for="long-convo-alert-min">Alerta Conversa Longa (min, min 5):</label><input type="number" id="long-convo-alert-min" value="${ctx.CONFIG.LONG_CONVO_ALERT_MIN}" min="5"></div><div class="settings-group"><h4>Sincronização & Dados:</h4><p style="font-size:0.85em; color:var(--purecloud-script-success-color);">✅ Sincronização automática ativa</p><button id="adjust-tma-btn" class="purecloud-script-button" style="margin-bottom:10px;">Ajustar TMA Manual</button><br><button id="reset-counter-btn" class="purecloud-script-button button-danger">Resetar Contadores/Dados do Dia</button></div>`;
            panel.querySelector('#reset-counter-btn').onclick = () => { if (confirm("Tem certeza? Isso apagará os dados de hoje localmente.")) { ctx.analyticsManager.clearAllData(); ctx.UI.renderDetailsContent(panel.querySelector('[data-tab-content="details"]')); ctx.UI.renderAnalyticsContent(panel.querySelector('[data-tab-content="analytics"]')); ctx.UI.renderClosedDetailsContent(panel.querySelector('[data-tab-content="closed"]')); } };
            
            panel.querySelector('#adjust-tma-btn').onclick = () => {
                const currentTma = ctx.analyticsManager.calculateStats().tma;
                const newTma = prompt("Insira o novo TMA desejado (formato MM:SS):", currentTma);
                if (!newTma || !/^\d{2}:\d{2}$/.test(newTma)) { if (newTma !== null) ctx.UI.createNotification("Formato inválido. Use MM:SS", "error"); return; }
                const parts = newTma.split(':');
                const targetSeconds = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
                
                let data = ctx.analyticsManager.getData();
                let completedConvos = data.conversations.filter(c => c.duration >= ctx.CONFIG.CHECKMARK_THRESHOLD_MS);
                if (completedConvos.length === 0) { ctx.UI.createNotification("Você precisa ter pelo menos 1 atendimento para ajustar o TMA.", "error"); return; }
                
                const currentTotalMs = completedConvos.reduce((sum, conv) => sum + conv.duration, 0);
                const targetTotalMs = (targetSeconds * completedConvos.length) * 1000;
                const diffMs = targetTotalMs - currentTotalMs;
                
                let firstCompletedIndex = data.conversations.findIndex(c => c.duration >= ctx.CONFIG.CHECKMARK_THRESHOLD_MS);
                if (firstCompletedIndex !== -1) {
                    data.conversations[firstCompletedIndex].duration += diffMs;
                    if (data.conversations[firstCompletedIndex].duration < 1000) data.conversations[firstCompletedIndex].duration = 1000;
                    ctx.analyticsManager.saveData(data);
                    
                    if (document.getElementById('purecloud-script-mini-dashboard')) { document.getElementById('purecloud-script-mini-dashboard')._updateStatsInternal(); }
                    
                    // Atualiza a tela de Analytics imediatamente se estiver aberta
                    const analyticsTab = panel.querySelector('[data-tab-content="analytics"]');
                    if (analyticsTab) ctx.UI.renderAnalyticsContent(analyticsTab);
                    
                    ctx.UI.createNotification("TMA ajustado com sucesso!", "success");
                }
            };
            panel.querySelector('[data-tab-content="analytics"]').innerHTML = `<div id="analytics-content-main"><button id="load-stats-btn" class="purecloud-script-button">Carregar Estatísticas</button></div>`; panel.querySelector('#load-stats-btn').onclick = () => { ctx.UI.renderAnalyticsContent(panel.querySelector('[data-tab-content="analytics"]')); };
            panel.querySelector('#save-settings-btn').onclick = () => {
                ctx.CONFIG.CONVERSATION_TARGET = ctx.validateConfigValue('CONVERSATION_TARGET', panel.querySelector('#conversation-target').value); ctx.CONFIG.INACTIVITY_CLIENT_ALERT_SECONDS = ctx.validateConfigValue('INACTIVITY_CLIENT_ALERT_SECONDS', panel.querySelector('#inactivity-client-alert-seconds').value); ctx.CONFIG.INACTIVITY_OPERATOR_ALERT_SECONDS = ctx.validateConfigValue('INACTIVITY_OPERATOR_ALERT_SECONDS', panel.querySelector('#inactivity-operator-alert-seconds').value); ctx.CONFIG.LONG_CONVO_ALERT_MIN = ctx.validateConfigValue('LONG_CONVO_ALERT_MIN', panel.querySelector('#long-convo-alert-min').value); ctx.CONFIG.SOUND_ALERTS_ENABLED = ctx.validateConfigValue('SOUND_ALERTS_ENABLED', panel.querySelector('#sound-alerts-toggle').checked);
                ctx.CONFIG.HOTKEYS = ctx.validateConfigValue('HOTKEYS', tempHotkeysConfig); ctx.CONFIG.THEME_COLORS = ctx.validateConfigValue('THEME_COLORS', tempThemeColors);
                ctx.saveData(); document.querySelectorAll('.purecloud-script-popup, .purecloud-script-custom-btn, #purecloud-script-notification-container, .injected-bubbles-container').forEach(el => el.classList.toggle('gcp-tema-escuro', ctx.CONFIG.DARK_MODE)); ctx.UI.createNotification("Configurações salvas!", "success"); panel.remove(); document.getElementById('purecloud-script-injected-style')?.remove(); ctx.injectCss(); const toolbarEl = ctx.findEl(ctx.CONFIG.PURECLOUD_SELECTORS.TOOLBAR); if (toolbarEl) { toolbarEl.dataset.scriptVersion = ''; ctx.createToolbarUI(toolbarEl); }
            };
            switchTab('analytics');
        }};
ctx.UI.createSettingsPanel = implementation.createSettingsPanel;
});
