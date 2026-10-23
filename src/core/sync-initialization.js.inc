    function sincronizarDadosComPlanilha() {
        if (typeof analyticsManager === 'undefined' || typeof v4_counters === 'undefined') return;
        let currentUserName = getAgentName(); 
        const stats = analyticsManager.calculateStats();
        const analyticsPayload = { conversasUnicas: stats.count, tmaGeral: stats.tma, tmeAtivo: stats.tme, encAgente: stats.baloonClicks, inicio: stats.last, ultima: stats.first, meta: CONFIG.CONVERSATION_TARGET, transferidos: stats.transferClicks, tmaGeralSegundos: stats.tmaSeconds || 0, tmeAtivoSegundos: stats.tmeSeconds || 0 };
        DataSyncer.send({ type: 'analytics', user: currentUserName, stats: analyticsPayload });
        const atendimentosPayload = analyticsManager.getData().conversations.map(conv => ({ tipo: conv.interactionType || 'unknown', horaFim: new Date(conv.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), cliente: conv.participantName, tme: (() => { const s = Math.floor(conv.activeDuration / 1000); return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}` })(), tmeSegundos: Math.floor(conv.activeDuration / 1000), duracaoSegundos: Math.floor((conv.duration || 0) / 1000), recorrencia: conv.isRecurrence ? 'Sim' : 'Não', link: conv.interactionUrl || 'N/A' }));
        DataSyncer.send({ type: 'atendimento', user: currentUserName, atendimentos: atendimentosPayload });
        if (v4_counters.balao.length > 0) { DataSyncer.send({ type: 'encerrados', user: currentUserName, encerrados: v4_counters.balao }); }
    }

    const isMainFrame = (window.self === window.top);

    const initialize = () => iniciarScript();

    function iniciarScript() {
        // Inicialização em TODOS OS FRAMES (CAR e Corretor)
        // Corretor único inicializado pelo módulo tools/corretor.
        
        // Inicialização APENAS NO TOP FRAME (Dashboards, Menus, IA)
        if (isMainFrame) {
            effectsManager.init();
            timerManager.startGlobalTimer();

            // --- SISTEMA DE INTEGRAÇÃO MODULAR (EXTENSÃO CHROME) ---
            window.PCScript = window.PCScript || {};
            window.PCScript.Integrador = {
                Config: CONFIG,
                UI: {
                    notificar: UI.createNotification,
                    alternarDarkMode: actions.toggleDarkMode
                },
                Estilo: {
                    geradorCSS: CONFIG_CSS
                },
                Audio: {
                    tocarSom: (tipo) => effectsManager.playBeep(tipo),
                    sucesso: () => effectsManager.playSuccess()
                },
                Estado: {
                    conversasAtivas: timerManager.activeTimers,
                    getMétricas: () => analyticsManager.getData()
                }
            };

            setInterval(() => DataSyncer.processQueue(), 60000);
            setTimeout(() => DataSyncer.updateIndicator(), 3000);
            setTimeout(sincronizarDadosComPlanilha, 15000); // Sincroniza mais cedo ao iniciar
            setInterval(sincronizarDadosComPlanilha, 5 * 60 * 1000); // Sincroniza a cada 5 min em vez de 10

            {
                initializeDailyCounters();
                saveData();
                injectCss();
                document.addEventListener('keydown', keyboardEventHandler);
                document.addEventListener('click', () => effectsManager.init(), { once: true });
                let targetNode = findEl(CONFIG.PURECLOUD_SELECTORS.CONVERSATION_LIST_CONTAINER);
                if (!targetNode) { targetNode = document.body; }
                const mainObserver = new MutationObserver(throttle(mainLoop, CONFIG.MAIN_LOOP_THROTTLE_MS));
                setTimeout(() => { mainObserver.observe(targetNode, { childList: true, subtree: true, attributes: true }); }, 500);
                setTimeout(mainLoop, 100);
                setTimeout(autoRestoreFromCloud, 2000); // Tenta restaurar 2s após carregar
                if (CONFIG.MINI_DASHBOARD_VISIBLE) {
                    setTimeout(() => {
                        UI.createMiniDashboard();
                    }, 4000);
                }
            }
        }
    }

    // Shared initialization runs after module setup.


    /* ============================================================== 
       ⬇️ INJEÇÃO DOS MÓDULOS DA EXTENSÃO ⬇️ 
       (Limpeza e conversão automática de estilos) 
       ============================================================== */


