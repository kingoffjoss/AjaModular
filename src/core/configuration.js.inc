    const LOCKDOWN_CONFIG = { END_CHAT_BUTTON_SELECTOR: ['#call-control-end-sms-button', 'button[aria-label="Mensagens de término"]'], BALAO_BUTTON_SELECTOR_V4: 'button[aria-label="Mensagens de término"]' };

    // --- VARIÁVEIS E LINKS ÚTEIS ---
    const initialQuickReplies = [
        { title: "👋 Saudação", text: "Olá, {primeiro_nome}! Tudo bem? Sou o agente e vou te ajudar hoje.", shortcut: "/oi" },
        { title: "📝 Pedir Dados", text: "{primeiro_nome}, para prosseguirmos, poderia me confirmar seu CPF ou número do pedido, por favor?", shortcut: "/cpf" },
        { title: "⏳ Aguardar", text: "Por favor, aguarde só um momento enquanto eu verifico essa informação, {primeiro_nome}.", shortcut: "/espera" },
        { title: "🔄 Transferir", text: "Vou precisar transferir o seu atendimento para o setor responsável. Por favor, aguarde um instante.", shortcut: "/transf" },
        { title: "⚠️ Cliente Inativo", text: "{primeiro_nome}, ainda está por aí? Como não tivemos mais retorno, encerrarei o atendimento em alguns minutos caso não haja resposta.", shortcut: "/inativo" },
        { title: "❌ Encerramento", text: "Como não tivemos mais retorno, estou encerrando este atendimento. Qualquer dúvida, estamos à disposição!", shortcut: "/enc" },
        { title: "✅ Resolução", text: "{primeiro_nome}, ficou mais alguma dúvida referente a este assunto ou posso te ajudar com algo mais?", shortcut: "/duvida" },
        { title: "👋 Despedida", text: "Foi um prazer te atender, {primeiro_nome}! Tenha um excelente dia!", shortcut: "/tchau" }
    ];

    const USEFUL_LINKS = [
        { title: "🌐 CRM Corporativo", url: "https://google.com", color: "#3b82f6" },
        { title: "📚 Base de Conhecimento", url: "https://wikipedia.org", color: "#10b981" },
        { title: "💳 Sistema de Faturamento", url: "https://yahoo.com", color: "#f59e0b" },
        { title: "📦 Rastreio de Pedidos", url: "https://bing.com", color: "#6366f1" }
    ];

    const defaultThemeColors = { bgPrimary: '#f8fafc', bgSecondary: '#f1f5f9', textPrimary: '#0f172a', textSecondary: '#475569', borderColor: '#e2e8f0', accent: '#6366f1', accentText: '#ffffff', timerBg: '#2d3748', timerNormalText: '#ffffff', timerActiveText: '#4ade80', timerPausedText: '#f87171', timerInactiveClientText: '#fbbf24', timerInactiveOperatorText: '#fbbf24', timerCompletedBg: '#2d3748', timerCompletedText: '#ffffff', success: '#10b981', error: '#ef4444', warn: '#f59e0b', info: '#3b82f6', miniDashboardProgress: '#0ea5e9' };


    function applyGenesysDarkMode() {
        let s = document.getElementById('genesys-forced-dark-style');
        if (typeof CONFIG === 'undefined' || !CONFIG.GENESYS_DARK_MODE) {
            if (s) s.remove();
            document.body.classList.remove('genesys-forced-dark');
            return;
        }
        const styleStr = `
        body.genesys-forced-dark { background-color: #121212 !important; color: #e2e8f0 !important; }
        body.genesys-forced-dark .app-body, body.genesys-forced-dark .sidebar, body.genesys-forced-dark .interaction-content-wrapper, body.genesys-forced-dark .navbar, body.genesys-forced-dark .topbar, body.genesys-forced-dark #main-content { background-color: #121212 !important; color: #e2e8f0 !important; border-color: #334155 !important; }
        body.genesys-forced-dark .interaction-list { background-color: #1a1a1a !important; }
        body.genesys-forced-dark div, body.genesys-forced-dark span { border-color: #334155 !important; color: inherit; }
        body.genesys-forced-dark input, body.genesys-forced-dark textarea { background-color: #1e1e1e !important; color: #e2e8f0 !important; border: 1px solid #334155 !important; }
    `;
        if (!s) { s = document.createElement('style'); s.id = 'genesys-forced-dark-style'; document.head.appendChild(s); }
        s.textContent = styleStr;
        document.body.classList.add('genesys-forced-dark');
    }
    window.applyGenesysDarkMode = applyGenesysDarkMode; // Ensure it's globally accessible just in case



    let CONFIG = {
        CHECKMARK_THRESHOLD_MS: 70 * 1000, TIMER_UPDATE_INTERVAL_MS: 500, MAIN_LOOP_THROTTLE_MS: 1000,
        INACTIVITY_CLIENT_ALERT_SECONDS: parseInt(ajaStorage.getItem('inactivityClientAlertSeconds') || '70', 10),
        INACTIVITY_OPERATOR_ALERT_SECONDS: parseInt(ajaStorage.getItem('inactivityOperatorAlertSeconds') || '30', 10),
        LONG_CONVO_ALERT_MIN: parseInt(ajaStorage.getItem('longConvoAlertMin') || '15', 10),
        CONVERSATION_TARGET: parseInt(ajaStorage.getItem('gcp_conversationTarget') || '45', 10),

        DARK_MODE: ajaStorage.getItem('gcp_darkMode') === 'true',
        SOUND_ALERTS_ENABLED: ajaStorage.getItem('soundAlertsEnabled') !== 'false',
        QUICK_REPLIES: JSON.parse(ajaStorage.getItem('quickReplies')) || initialQuickReplies,
        // --- NOVOS ATALHOS ADICIONADOS AQUI ---
        HOTKEYS: JSON.parse(ajaStorage.getItem('hotkeys')) || { copyInteraction: "Control+Shift+I", openSettings: "Control+Shift+S", toggleMiniDashboard: "Control+Shift+J", toggleDarkMode: "Control+Shift+D", quickGreeting: "Control+Shift+Q", exportData: "Control+Shift+E", toggleZenMode: "Control+Shift+Z", formatText: "Control+Shift+M" },
        THEME_COLORS: JSON.parse(ajaStorage.getItem('gcp_themeColors_v2')) || JSON.parse(ajaStorage.getItem('timerColors')) || defaultThemeColors,
        LAST_SCRIPT_VERSION: ajaStorage.getItem('lastScriptVersion') || '0', POPUP_POSITIONS: JSON.parse(ajaSessionStorage.getItem('popupPositions') || '{}'),
        MINI_DASHBOARD_VISIBLE: ajaSessionStorage.getItem('miniDashboardVisible') !== 'false', MINI_DASHBOARD_MAXIMIZED: ajaSessionStorage.getItem('miniDashboardMaximized') === 'true', TOOLS_VISIBLE: ajaSessionStorage.getItem('toolsVisible') === 'true',
        MESSAGES: { COPIED_SUCCESS: "Copiado com sucesso!", COPY_ERROR: "Erro ao copiar.", NOT_FOUND_INTERACTION_DATA: "Dados não encontrados.", INTERACTION_COPIED: "Interação (Nome, Telefone e Link) copiada!" },
        PURECLOUD_SELECTORS: {
            TOOLBAR: ['div.interaction-controls-primary', 'div[data-qa-id="interaction-controls-primary"]', '.actions-container', 'div[role="toolbar"]'], PARTICIPANT_NAME_BADGE: ['h3.participant-name', 'div.interaction-name-wrapper div.participant-name > span', 'p.participant-name', 'span[data-qa-id="participant-name"]', 'h2.participant-name'], NATIVE_COPY_BUTTON: ['button[aria-label="Copiar link da interação"]', '.copy-interaction-url-btn', 'button[data-qa-id="copy-interaction-link"]', '.copy-action-button'], INTERACTION_ID_EL: 'span[data-qa-id="interaction-id"], [data-qa-id="detail-value-interactionId"]', CONVERSATION_ROOT: '.interaction-content', CONVERSATION_CONTENT_WRAPPER: ['.interaction-content-wrapper', '.interaction-content'], SCRIPT_IFRAME: '.interaction-script-container.no-headers.non-call iframe', MESSAGING_GADGET_IFRAME: 'iframe[src*="messaging-gadget.html"]', INTERACTION_GROUP: ['div.interaction-group', 'div[data-qa-id="interaction-group-list-item"]'], SELECTED_INTERACTION_GROUP: ['div.interaction-group.is-selected', 'div[data-qa-id="interaction-group-list-item"].is-selected'], TRANSFER_BUTTON_SELECTOR: ['button[aria-label*="Transferir"]', 'button[data-qa-id="interaction-control-transfer"]'], EVALUATION_BUTTON_SELECTOR: ['button[aria-label*="Enviar avaliação"]', 'button[aria-label*="Enviar pesquisa"]', 'button[data-qa-id="interaction-control-disconnect"]', 'button.btn-main.container-inner'], CONVERSATION_LIST_CONTAINER: ['div.infrg-1_medium.purecloud-grid-layout-grid-cell.interaction-list-column', 'div.interaction-list', 'div[data-qa-id*="interaction-list-column"]'], NATIVE_TIMER_SELECTORS: ['.message-timestamp', '.duration', '.chat-message-group > div:last-child > span', '.chat-message-group > div:last-child > div', 'span[class*="timestamp"]', 'div[class*="time"]', 'span[class*="datetime"]', 'span[class*="date-time"]'], ICON_SELECTOR_CALL: 'gux-icon[icon-name="phone"]', ICON_SELECTOR_CHAT: 'gux-icon[icon-name="comments"]'
        },
        LAST_ENDED_INTERACTIONS: new Map()
    };

    const featureDescriptions = {
        copyInteraction: { title: "Copiar Interação", description: "Copia nome, telefone e link.", hotkey: CONFIG.HOTKEYS.copyInteraction }, openSettings: { title: "Configurações", description: "Abre o painel de configurações.", hotkey: CONFIG.HOTKEYS.openSettings }, toggleMiniDashboard: { title: "Alternar Dashboard", description: "Oculta ou mostra o dashboard.", hotkey: CONFIG.HOTKEYS.toggleMiniDashboard }, toggleDarkMode: { title: "Modo Escuro (Script)", description: "Ativa o tema escuro nos cronômetros.", hotkey: CONFIG.HOTKEYS.toggleDarkMode }, quickGreeting: { title: "Saudação Rápida", description: "Cola sua primeira Resposta Rápida.", hotkey: CONFIG.HOTKEYS.quickGreeting }, exportData: { title: "Exportar Atendimentos", description: "Baixa os dados do dia.", hotkey: CONFIG.HOTKEYS.exportData },
        toggleZenMode: { title: "Modo Foco (Zen)", description: "Escurece a tela e foca apenas no chat atual.", hotkey: CONFIG.HOTKEYS.toggleZenMode }, formatText: { title: "Mágico Anti-Caps Lock", description: "Corrige texto MAIÚSCULO para Minúsculo.", hotkey: CONFIG.HOTKEYS.formatText }
    };

    let v4_counters = { balao: [] }; const V4_STORAGE_KEY = 'encerramentoCounters_v4_balao';
