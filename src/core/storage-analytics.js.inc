    function loadV4Counters() { const today = getBrazilTime(new Date()).toLocaleDateString('pt-BR'); const storedData = JSON.parse(ajaStorage.getItem(V4_STORAGE_KEY) || '{}'); if (storedData.date === today) { v4_counters.balao = storedData.balao || []; } else { v4_counters = { balao: [] }; } }
    function saveV4Counters() { const today = getBrazilTime(new Date()).toLocaleDateString('pt-BR'); const dataToSave = { date: today, balao: v4_counters.balao }; try { ajaStorage.setItem(V4_STORAGE_KEY, JSON.stringify(dataToSave)); } catch (e) { } }

    async function autoRestoreFromCloud() {
        if (!GOOGLE_SCRIPT_URL) return;
        const stats = analyticsManager.calculateStats();
        // Se localmente está vazio e ainda não tentamos restaurar nesta sessão
        if (stats.count === 0 && !ajaSessionStorage.getItem('pcs_auto_restored')) {
            console.log("[PCS] Iniciando auto-restauração da nuvem...");
            try {
                const currentUserName = getAgentName();
                if (currentUserName === "Usuário Anônimo") return;

                const params = new URLSearchParams({ type: 'restore_agent', user: currentUserName });
                const response = await safeFetch(`${GOOGLE_SCRIPT_URL}?${params.toString()}`);
                if (!response.ok) return;
                const res = await response.json();

                if (res.status === 'success' && ((res.atendimentos && res.atendimentos.length > 0) || (res.encerrados && res.encerrados.length > 0))) {
                    const storedData = analyticsManager.getData();
                    storedData.conversations = [];
                    
                    if (res.atendimentos) {
                        res.atendimentos.forEach(a => {
                            const parts = a.horaFim.split(':');
                            const dt = new Date();
                            if (parts.length >= 2) dt.setHours(parseInt(parts[0]), parseInt(parts[1]), 0, 0);
                            storedData.conversations.push({
                                timestamp: dt.getTime(),
                                duration: (parseInt(a.duracaoSegundos) || 0) * 1000,
                                activeDuration: (parseInt(a.tmeSegundos) || 0) * 1000,
                                participantName: a.cliente || 'N/A',
                                phoneNumber: 'N/A',
                                isRecurrence: a.recorrencia === 'Sim',
                                endedByAgent: a.tipo || 'unknown',
                                interactionUrl: a.link || 'N/A',
                                interactionType: 'unknown'
                            });
                        });
                    }
                    
                    analyticsManager.saveData(storedData);
                    
                    if (res.encerrados && res.encerrados.length > 0) {
                        const novosEncerrados = res.encerrados.map(e => ({ timestamp: e.timestamp, participantName: e.participantName, interactionUrl: e.interactionUrl }));
                        v4_counters.balao = novosEncerrados;
                        ajaStorage.setItem(V4_STORAGE_KEY, JSON.stringify({ date: getBrazilTime(new Date()).toLocaleDateString('pt-BR'), balao: novosEncerrados }));
                    }
                    
                    ajaSessionStorage.setItem('pcs_auto_restored', 'true');
                    console.log("[PCS] Dados restaurados automaticamente com sucesso!");
                    UI.createNotification("🔄 Dados sincronizados com a nuvem!", "success", 4000);
                    
                    // Atualiza o dashboard se estiver visível
                    if (document.getElementById('purecloud-script-mini-dashboard')) {
                        document.getElementById('purecloud-script-mini-dashboard')._updateStatsInternal();
                    }
                }
            } catch (e) {
                console.error("[PCS] Erro na auto-restauração:", e);
            }
        }
    }

    const validateConfigValue = (key, value) => {
        const parsed = parseInt(value, 10);
        switch (key) {
            case 'CONVERSATION_TARGET': return !isNaN(parsed) && parsed >= 1 ? parsed : 45; case 'INACTIVITY_CLIENT_ALERT_SECONDS': return !isNaN(parsed) && parsed >= 30 ? parsed : 70; case 'INACTIVITY_OPERATOR_ALERT_SECONDS': return !isNaN(parsed) && parsed >= 10 ? parsed : 30; case 'LONG_CONVO_ALERT_MIN': return !isNaN(parsed) && parsed >= 5 ? parsed : 15; case 'DARK_MODE': return value === true || value === 'true'; case 'SOUND_ALERTS_ENABLED': return value === true || value === 'true';
            case 'THEME_COLORS': if (typeof value !== 'object' || value === null) { return defaultThemeColors; } const validatedColors = { ...defaultThemeColors }; for (const colorKey in defaultThemeColors) { if (value.hasOwnProperty(colorKey)) { if (typeof value[colorKey] === 'string' && value[colorKey].match(/^#[0-9a-f]{6}$/i)) { validatedColors[colorKey] = value[colorKey]; } } } return validatedColors;
            case 'HOTKEYS': if (typeof value === 'object' && value !== null) { return { copyInteraction: value.copyInteraction || "Control+Shift+I", openSettings: value.openSettings || "Control+Shift+S", toggleMiniDashboard: value.toggleMiniDashboard || "Control+Shift+J", toggleDarkMode: value.toggleDarkMode || "Control+Shift+D", quickGreeting: value.quickGreeting || "Control+Shift+Q", exportData: value.exportData || "Control+Shift+E", toggleZenMode: value.toggleZenMode || "Control+Shift+Z", formatText: value.formatText || "Control+Shift+M" }; } return CONFIG.HOTKEYS;
            default: return value;
        }
    };
    const saveData = () => {
        try {
            const dataToSave = analyticsManager.getData();
            ajaStorage.setItem('gcp_conversationTarget', validateConfigValue('CONVERSATION_TARGET', CONFIG.CONVERSATION_TARGET)); ajaStorage.setItem('gcp_darkMode', validateConfigValue('DARK_MODE', CONFIG.DARK_MODE)); ajaStorage.setItem('soundAlertsEnabled', validateConfigValue('SOUND_ALERTS_ENABLED', CONFIG.SOUND_ALERTS_ENABLED)); ajaStorage.setItem('inactivityClientAlertSeconds', validateConfigValue('INACTIVITY_CLIENT_ALERT_SECONDS', CONFIG.INACTIVITY_CLIENT_ALERT_SECONDS)); ajaStorage.setItem('inactivityOperatorAlertSeconds', validateConfigValue('INACTIVITY_OPERATOR_ALERT_SECONDS', CONFIG.INACTIVITY_OPERATOR_ALERT_SECONDS)); ajaStorage.setItem('longConvoAlertMin', validateConfigValue('LONG_CONVO_ALERT_MIN', CONFIG.LONG_CONVO_ALERT_MIN)); ajaStorage.setItem('hotkeys', JSON.stringify(validateConfigValue('HOTKEYS', CONFIG.HOTKEYS))); ajaStorage.setItem('gcp_themeColors_v2', JSON.stringify(validateConfigValue('THEME_COLORS', CONFIG.THEME_COLORS))); ajaStorage.setItem('lastScriptVersion', SCRIPT_VERSION); ajaStorage.setItem('dailyAnalytics_v2_data', JSON.stringify(dataToSave)); ajaSessionStorage.setItem('popupPositions', JSON.stringify(CONFIG.POPUP_POSITIONS)); ajaSessionStorage.setItem('miniDashboardVisible', CONFIG.MINI_DASHBOARD_VISIBLE); ajaSessionStorage.setItem('miniDashboardMaximized', CONFIG.MINI_DASHBOARD_MAXIMIZED); ajaSessionStorage.setItem('toolsVisible', CONFIG.TOOLS_VISIBLE);
            saveV4Counters();
        } catch (e) { if (e.name === 'QuotaExceededError') { UI.createNotification("Erro: Espaço de armazenamento cheio.", 'error', 10000); } }
    };

    const findEl = (selectors, parent = document) => { if (!Array.isArray(selectors)) selectors = [selectors]; for (const selector of selectors) { let el = parent.querySelector(selector); if (el) return el; } return null; };
