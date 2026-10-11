// Shared dependencies: ajaStorage, CONFIG, saveData
window.AjaModular.register("ferramentas", ["compatibility","notepad","extrator","historico-documentos","links-uteis","lembretes"], function(ctx) {
    /* --- MÓDULO ANEXADO: FERRAMENTAS.JS --- */
    try {
        // ==UserScript==
        // @name         Painel de Ferramentas (Módulo)
        // @description  Aba do Painel de Ferramentas do Agente
        // ==/UserScript==

        (function () {
            'use strict';

            // Cria as opções iniciais hardcoded se não houver um sistema dinâmico 
            // Igual ao 'QUICK_REPLIES' e 'USEFUL_LINKS' do Sistema Geral.txt
            const QUICK_REPLIES = [
                { title: "Saudação - Bom dia", text: "Olá! Bom dia, como posso ajudar?", shortcut: "/bd" },
                { title: "Encerramento Padrão", text: "Agradeço seu contato. Tenha um excelente dia!", shortcut: "/enc" }
            ];

            const USEFUL_LINKS = [
                { title: "Consulta Base de Conhecimento", url: "https://example.com/kb", color: "#4B5563" },
                { title: "Calculadora", url: "https://example.com/calc", color: "#3B82F6" }
            ];

            // Removed custom theme colors, using variables from Cronometros global injected CSS
            const FERRAMENTAS_CSS = `
        /* Leveraging .purecloud-script-popup and .purecloud-script-button from Cronometros */
        #purecloud-script-tools-panel { width: 400px; height: 480px; resize: none; background: var(--purecloud-script-bg-primary); border-radius: 8px; box-shadow: 0 8px 30px var(--purecloud-script-shadow-color); z-index: 10002; display: flex; flex-direction: column; border: 1px solid var(--purecloud-script-border-color); margin: 0; overflow: hidden; }
        #purecloud-script-tools-panel .panel-header { cursor: move; background: var(--purecloud-script-bg-secondary); padding: 10px 15px; border-bottom: 1px solid var(--purecloud-script-border-color); display: flex; justify-content: space-between; align-items: center; border-radius: 8px 8px 0 0; } 
        #purecloud-script-tools-panel .panel-header:active { cursor: grabbing; }
        #purecloud-script-tools-panel .panel-header h2, #purecloud-script-tools-panel .panel-header h3 { margin: 0; color: var(--purecloud-script-text-primary); font-size: 16px; font-weight: 600; display: flex; align-items: center; gap: 8px; } 
        #purecloud-script-tools-panel .panel-header-buttons { display: flex; gap: 5px; } 
        #purecloud-script-tools-panel .panel-header-btn { background: none; border: none; font-size: 1.2em; cursor: pointer; color: var(--purecloud-script-text-secondary); padding: 0 5px; } 
        #purecloud-script-tools-panel .panel-header-btn:hover { color: var(--purecloud-script-text-primary); } 
        #purecloud-script-tools-panel .panel-content { padding: 15px; overflow-y: auto; flex-grow: 1; background: var(--purecloud-script-bg-primary); color: var(--purecloud-script-text-primary); font-size: 14px;} 
        #purecloud-script-tools-panel .settings-group { margin-bottom: 20px; display: flex; flex-direction: column; } 
        #purecloud-script-tools-panel .settings-group label { color: var(--purecloud-script-text-secondary); font-size: 0.9em; margin-bottom: 5px; font-weight: 600; } 
        #purecloud-script-tools-panel textarea { background: var(--purecloud-script-bg-primary); color: var(--purecloud-script-text-primary); border: 1px solid var(--purecloud-script-border-color); padding: 8px 10px; border-radius: 4px; transition: border-color 0.2s; width: 100%; box-sizing: border-box; font-size: 13px; font-family: inherit; resize: none; outline: none; } 
        #purecloud-script-tools-panel textarea:focus { border-color: var(--purecloud-script-accent-color); box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2); }
        #purecloud-script-tools-panel .purecloud-script-tabs { display: flex; background: var(--purecloud-script-bg-secondary); border-bottom: 1px solid var(--purecloud-script-border-color); padding-left: 10px; flex-wrap: wrap;} 
        #purecloud-script-tools-panel .purecloud-script-tab-button { flex: 1; padding: 10px 15px; text-align: center; background-color: transparent; color: var(--purecloud-script-text-secondary); border: none; cursor: pointer; transition: color 0.2s ease, border-bottom 0.2s ease; font-size: 0.95em; font-weight: 500; display: flex; justify-content: center; align-items: center; gap: 6px; white-space: nowrap; border-bottom: 2px solid transparent; border-radius: 0; box-shadow: none; margin-right: 0px; } 
        #purecloud-script-tools-panel .purecloud-script-tab-button.active { color: var(--purecloud-script-text-primary); border-bottom: 2px solid var(--purecloud-script-accent-color); font-weight: bold; background-color: transparent;} 
        #purecloud-script-tools-panel .purecloud-script-tab-button:hover:not(.active) { color: var(--purecloud-script-text-primary); } 
        #purecloud-script-tools-panel .purecloud-script-tab-content { display: none; padding-top: 15px; flex-direction: column; flex-grow: 1; } 
        #purecloud-script-tools-panel .purecloud-script-tab-content.active { display: flex; }
    `;

            const blockStyle = document.createElement('style');
            blockStyle.textContent = FERRAMENTAS_CSS;
            document.head.appendChild(blockStyle);

            function makeDraggable(element, handle, keyName) {
                if (!handle) handle = element;
                let isDragging = false, dragOffsetX = 0, dragOffsetY = 0;

                let moveHandler = (e) => {
                    if (!isDragging) return;
                    e.preventDefault();

                    let newLeft = e.clientX - dragOffsetX;
                    let newTop = e.clientY - dragOffsetY;

                    const rect = element.getBoundingClientRect();
                    if (newLeft < 0) newLeft = 0;
                    if (newTop < 0) newTop = 0;
                    if (newLeft + rect.width > window.innerWidth) newLeft = window.innerWidth - rect.width;
                    if (newTop + rect.height > window.innerHeight) newTop = window.innerHeight - rect.height;

                    element.style.left = newLeft + 'px';
                    element.style.top = newTop + 'px';
                };

                let upHandler = () => {
                    if (isDragging) {
                        isDragging = false;
                    }
                };

                handle.addEventListener('mousedown', (e) => {
                    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT' || e.target.closest('.os-btn') || e.target.closest('button')) return;
                    e.preventDefault();
                    isDragging = true;

                    element.style.transition = 'none';
                    element.style.transform = 'none';
                    element.style.margin = '0';

                    const rect = element.getBoundingClientRect();
                    element.style.left = rect.left + 'px';
                    element.style.top = rect.top + 'px';
                    element.style.bottom = 'auto';
                    element.style.right = 'auto';

                    dragOffsetX = e.clientX - rect.left;
                    dragOffsetY = e.clientY - rect.top;
                }, { passive: false });

                // Ensure we don't bind multiple identical listeners if makeDraggable is called multiple times on the same element
                // A quick hack is just bind it globally, it naturally ignores when isDragging is false.
                document.addEventListener('mousemove', moveHandler, { passive: false });
                document.addEventListener('mouseup', upHandler);
            }

            // Cria notificação via DOM
            function notify(message, type = "info", timeout = 5000) {
                // Pode linkar com a funcção de toast do cronometros ou gerar uma própria.
                // Vamos usar window.alert ou console para não perder.
                console.log(`[Painel Ferramentas] ${type}: ${message}`);
            }

            // Funcao exposta no window
            window.UI_tools = {
                createAgentToolsPanel: function () {
                    let panel = document.getElementById('purecloud-script-tools-panel');
                    if (!panel) {
                        panel = document.createElement('div');
                        panel.id = 'purecloud-script-tools-panel';
                        panel.className = 'purecloud-script-popup';
                        panel.innerHTML = `
                    <div class="panel-header">
                        <h2>🛠️ Ferramentas do Agente</h2>
                        <div class="panel-header-buttons">
                            <button class="panel-header-btn" id="closeToolsBtn" title="Minimizar">X</button>
                        </div>
                    </div>
                    <div class="purecloud-script-tabs">
                        <button class="purecloud-script-tab-button active" data-tab="notepad">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> B. Notas
                        </button>

                        <button class="purecloud-script-tab-button" data-tab="reminders">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> Lembretes
                        </button>
                        <button class="purecloud-script-tab-button" data-tab="historico">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> Histórico
                        </button>
                        <button class="purecloud-script-tab-button" data-tab="links">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px;"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg> Links
                        </button>
                    </div>
                    <div class="panel-content" style="padding: 15px;">
                        <div class="purecloud-script-tab-content active" data-tab-content="notepad">
                            <div class="settings-group" style="height: 100%; margin: 0; display: flex; flex-direction: column;">
                                <textarea id="tools-notepad" placeholder="Faça anotações rápidas aqui..." style="flex-grow: 1; min-height: 160px; resize: none; border-bottom-left-radius: 0; border-bottom-right-radius: 0; margin-bottom: 0; border-bottom: none;"></textarea>
                                <div style="display: flex; background: var(--purecloud-script-bg-primary); border: 1px solid var(--purecloud-script-border-color); border-radius: 0 0 8px 8px; border-top: none; padding: 6px; gap: 6px;">
                                    <button id="btn-notepad-fetch" class="purecloud-script-button" style="flex: 1; padding: 6px; background: var(--purecloud-script-bg-secondary); color: var(--purecloud-script-text-primary); border: 1px solid var(--purecloud-script-border-color); font-size: 0.85em; box-shadow: none;" title="Puxar dados da tela">📎 Puxar</button>
                                    <button id="btn-notepad-copy" class="purecloud-script-button" style="flex: 1; padding: 6px; font-size: 0.85em; box-shadow: none;" title="Copiar anotações">📋 Copiar</button>
                                    <button id="btn-notepad-clear" class="purecloud-script-button" style="background: var(--purecloud-script-error-color, #ef4444); padding: 6px 12px; box-shadow: none;" title="Limpar tudo">🗑️</button>
                                </div>
                            </div>
                        </div>

                        <div class="purecloud-script-tab-content" data-tab-content="reminders">
                            <p style="font-size: 0.9em; margin-top:0; margin-bottom: 12px; color: var(--purecloud-script-text-secondary);">
                                Configura um alarme para voltar e falar com o cliente.
                            </p>
                            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
                                <button class="purecloud-script-button btn-lembrete" data-time="1">1 Min</button>
                                <button class="purecloud-script-button btn-lembrete" data-time="3">3 Min</button>
                                <button class="purecloud-script-button btn-lembrete" data-time="5">5 Min</button>
                            </div>
                        </div>

                        <div class="purecloud-script-tab-content" data-tab-content="historico">
                            <p style="font-size: 0.85em; margin-top:0; margin-bottom: 8px; color: var(--purecloud-script-text-secondary);">Pressione <b>F2</b> para copiar CPF/CNPJ da tela e salvar aqui.</p>
                            <div id="historico-id-list" style="display:flex; flex-direction:column; gap:8px; max-height: 200px; overflow-y: auto;"></div>
                            <button id="btn-clear-history" class="purecloud-script-button" style="width: 100%; margin-top: 10px; padding: 6px; background: var(--purecloud-script-error-color, #ef4444); color: white; border: none; font-size: 0.85em;">🗑️ Limpar Histórico</button>
                        </div>

                        <div class="purecloud-script-tab-content" data-tab-content="links">
                            <div id="useful-links-list" style="display:flex; flex-direction:column; gap:8px;"></div>
                        </div>
                    </div>
                `;

                        document.body.appendChild(panel);
                        makeDraggable(panel, panel.querySelector('.panel-header'), 'toolsPanel');

                        // Recenter
                        panel.style.top = '100px';
                        panel.style.left = '100px';

                        panel.querySelector('#closeToolsBtn').onclick = () => { 
                            window.AjaModular.get('ferramentas').close();
                        };

                        const USEFUL_LINKS = [
                            { title: "Consulta Base de Conhecimento", url: "https://example.com/kb", color: "#4B5563" },
                            { title: "Calculadora", url: "https://example.com/calc", color: "#3B82F6" }
                        ];

                        window.AjaModular.get('historico-documentos').mount(panel);
const switchToolsTab = (tabId) => {
                            panel.querySelectorAll('.purecloud-script-tab-button').forEach(btn => btn.classList.remove('active'));
                            panel.querySelectorAll('.purecloud-script-tab-content').forEach(content => content.classList.remove('active'));
                            panel.querySelector(`.purecloud-script-tab-button[data-tab="${tabId}"]`)?.classList.add('active');
                            panel.querySelector(`[data-tab-content="${tabId}"]`)?.classList.add('active');
                        };

                        panel.querySelectorAll('.purecloud-script-tab-button').forEach(btn => {
                            btn.onclick = () => switchToolsTab(btn.dataset.tab);
                        });

                        window.AjaModular.get('notepad').mount(panel, notify);
window.AjaModular.get('links-uteis').mount(panel, USEFUL_LINKS);
window.AjaModular.get('lembretes').mount(panel, notify);
                    } else {
                        panel.style.display = 'flex';
                    }
                    return panel;
                }
            };
        })();

    } catch (e) { console.error('[BUILDER] Erro fatal no módulo ferramentas.js:', e); }



function setVisible(visible) {
    if (ctx.CONFIG.TOOLS_VISIBLE !== visible) { ctx.CONFIG.TOOLS_VISIBLE = visible; ctx.saveData(); }
}
return {
    open() { setVisible(true); return window.UI_tools.createAgentToolsPanel(); },
    close() { setVisible(false); const panel = document.getElementById('purecloud-script-tools-panel'); if (panel) panel.style.display = 'none'; }
};
});
