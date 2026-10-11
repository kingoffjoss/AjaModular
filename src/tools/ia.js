// Shared dependencies: ajaStorage, escapeHTML
window.AjaModular.register("ia", ["compatibility"], function(ctx) {
    /* --- MÓDULO ANEXADO: IA.JS --- */
    try {
        // ==UserScript==
        // @name         PureCloud - Aja Assistente (v24.4 - Anti-Autofill Radical)
        // @description  Assistente Aja com proteção máxima contra gerenciadores de senha.
        // @author       Josias Queiroz - Kingoffjoss Assessoria
        // @version      24.4
        // @match        *://*/*
        // @grant        none
        // ==/UserScript==

        (function () {
            'use strict';

            // --- 1. CONFIGURAÇÃO E STORAGE ---
            const APP_PREFIX = "IA_V24_AJA_";

            const store = {
                get: (keys, cb) => {
                    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                        chrome.storage.local.get(keys, cb);
                    } else {
                        let res = {};
                        keys.forEach(k => {
                            const val = ctx.ajaStorage.getItem(APP_PREFIX + k);
                            if (val) { try { res[k] = JSON.parse(val); } catch (e) { res[k] = val; } }
                        });
                        cb(res);
                    }
                },
                set: (obj, cb) => {
                    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                        chrome.storage.local.set(obj, cb);
                    } else {
                        Object.keys(obj).forEach(k => ctx.ajaStorage.setItem(APP_PREFIX + k, JSON.stringify(obj[k])));
                        if (cb) cb();
                    }
                },
                remove: (keys, cb) => {
                    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                        chrome.storage.local.remove(keys, cb);
                    } else {
                        keys.forEach(k => ctx.ajaStorage.removeItem(APP_PREFIX + k));
                        if (cb) cb();
                    }
                }
            };

            store.get(['MOD_IA'], function (result) {
                if (result.MOD_IA === false || window.self !== window.top) return;
                initIA();
            });

            function initIA() {
                console.log("[Aja] Assistente v24.4 (Blindada) Iniciada...");

                // --- VARIÁVEIS ---
                let currentModel = "";
                let userApiKey = '';
                let agentName = 'Atendente';
                let chatHistoryContext = [];

                function getBrazilGreeting() {
                    const h = new Date().getHours();
                    if (h >= 5 && h < 12) return "Bom dia";
                    if (h >= 12 && h < 18) return "Boa tarde";
                    return "Boa noite";
                }

                // --- 2. CSS ---
                const css = `
            #gemini-wrapper {
                --purecloud-script-header-bg: #8b5cf6; /* Identidade Aja (Roxo Claro) */
                --purecloud-script-header-text: #ffffff;
                --purecloud-script-accent-color: #8b5cf6;
                --ia-bg: var(--purecloud-script-bg-primary);
                --ia-card: var(--purecloud-script-bg-secondary); 
                --ia-border: var(--purecloud-script-border-color); 
                --ia-text: var(--purecloud-script-text-primary); 
                --ia-text-muted: var(--purecloud-script-text-secondary);
                --ia-input: var(--purecloud-script-bg-primary); 
                --ia-primary: var(--purecloud-script-accent-color); 
                --ia-primary-hover: var(--purecloud-script-accent-color);
                --ia-danger: var(--purecloud-script-error-color); 
                --ia-success: var(--purecloud-script-success-color);
                --ia-shadow: 0 8px 30px var(--purecloud-script-shadow-color);
                --ia-radius: 8px;
                font-family: 'Segoe UI', Roboto, sans-serif;
                box-sizing: border-box; font-size: 14px;
            }
            #gemini-wrapper.cc-escurinho {
                --ia-bg: #0f172a; --ia-card: #1e293b; --ia-border: #334155; --ia-text: #f8fafc; --ia-text-muted: #94a3b8; --ia-input: #0f172a;
            }
            #gemini-wrapper.local-light-mode {
                --ia-bg: #f8fafc; --ia-card: #f1f5f9; --ia-border: #e2e8f0; --ia-text: #0f172a; --ia-text-muted: #475569; --ia-input: #f8fafc;
            }
            #gemini-wrapper * { box-sizing: border-box; transition: background-color 0.2s, color 0.2s; }

            /* Botão Flutuante */
            #gemini-float-btn {
                position: fixed; bottom: 85px; right: 25px; width: 56px; height: 56px; 
                background: linear-gradient(135deg, var(--purecloud-script-header-bg), var(--purecloud-script-accent-color)); 
                color: white; border-radius: 50%; border: none; 
                box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4); 
                cursor: pointer; font-size: 24px; z-index: 999999;
                display: flex; align-items: center; justify-content: center;
                transition: transform 0.2s;
            }
            #gemini-float-btn:hover { transform: scale(1.1); }

            /* Modal */
            #gemini-modal {
                display: none; position: fixed; z-index: 999999;
                width: 400px; height: 650px; 
                left: auto; top: 80px; transform: none; max-height: 90vh;
                background-color: var(--ia-bg); color: var(--ia-text);
                border-radius: var(--ia-radius); border: 1px solid var(--ia-border);
                box-shadow: var(--ia-shadow);
                flex-direction: column; overflow: hidden;
            }

            /* Header */
            .gemini-header { 
                padding: 14px 16px; border-bottom: 1px solid var(--ia-border); 
                display: flex; justify-content: space-between; align-items: center; 
                cursor: move; user-select: none; background: var(--purecloud-script-header-bg); color: var(--purecloud-script-header-text);
            }
            .gemini-header:active { cursor: grabbing; }
            .gemini-header h3 { margin: 0; font-size: 15px; font-weight: 600; display:flex; gap:8px; align-items:center; color: var(--purecloud-script-header-text); }
            .gh-actions { display: flex; gap: 6px; align-items: center; }
            .icon-btn { 
                background: transparent; border: 1px solid transparent; cursor: pointer; font-size: 15px; 
                color: var(--purecloud-script-header-text); padding: 5px; border-radius: 6px; 
                display: flex; align-items: center; justify-content: center;
                transition: all 0.2s;
            }
            .icon-btn:hover { color: #fff; background: rgba(255,255,255,0.15); border-color: rgba(255,255,255,0.2); }

            /* Abas */
            .nav-tabs { display: flex; border-bottom: 1px solid var(--ia-border); background: rgba(0,0,0,0.02); }
            .nav-tab { flex: 1; padding: 12px; text-align: center; cursor: pointer; font-size: 13px; font-weight: 500; color: var(--ia-text-muted); border-bottom: 2px solid transparent; }
            .nav-tab:hover { color: var(--ia-text); background: rgba(255,255,255,0.03); }
            .nav-tab.active { color: var(--ia-primary); border-bottom-color: var(--ia-primary); font-weight: 600; }

            /* Screens */
            .screen { padding: 20px; display: none; flex-direction: column; flex: 1; overflow-y: auto; }
            .screen.active { display: flex; }

            /* Inputs - CORREÇÃO DE ESTILO PARA TYPE=SEARCH */
            .gemini-input { width: 100%; padding: 12px; margin-bottom: 12px; border-radius: 8px; border: 1px solid var(--ia-border); background: var(--ia-input); color: var(--ia-text); font-size: 13px; font-family: inherit; resize: none; outline:none;}
            .gemini-input:focus { border-color: var(--ia-primary); box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2); }
            
            /* Remove o 'x' nativo do input type search */
            .gemini-input[type="search"]::-webkit-search-decoration,
            .gemini-input[type="search"]::-webkit-search-cancel-button,
            .gemini-input[type="search"]::-webkit-search-results-button,
            .gemini-input[type="search"]::-webkit-search-results-decoration { -webkit-appearance: none; }

            .gemini-label { font-size: 11px; font-weight: 700; color: var(--ia-text-muted); margin-bottom: 6px; display: block; text-transform: uppercase; letter-spacing: 0.5px; }

            /* Buttons */
            .gemini-btn { width: 100%; padding: 12px; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; margin-top: 8px; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 13px; color: white; transition: filter 0.2s, transform 0.1s; }
            .gemini-btn:active { transform: scale(0.98); }
            .btn-primary { background: var(--ia-primary); }
            .btn-success { background: var(--ia-success); }
            .btn-danger { background: transparent; border: 1px solid var(--ia-danger); color: var(--ia-danger); }
            .btn-danger:hover { background: rgba(239, 68, 68, 0.1); }
            .btn-outline { background: transparent; border: 1px solid var(--ia-border); color: var(--ia-text); }

            /* Result */
            #gemini-result { margin-top: 15px; padding: 15px; background: var(--ia-card); border: 1px solid var(--ia-border); border-left: 4px solid var(--ia-primary); border-radius: 8px; font-size: 13px; line-height: 1.6; display:none; white-space: pre-wrap; word-wrap: break-word; }
            #gemini-result strong { color: var(--ia-primary); font-weight: 700; }
            
            /* History & Chat Styles */
            .history-item { background: var(--ia-card); border: 1px solid var(--ia-border); border-radius: 8px; padding: 12px; margin-bottom: 10px; }
            .history-meta { display: flex; justify-content: space-between; font-size: 11px; color: var(--ia-text-muted); margin-bottom: 6px; border-bottom: 1px dashed var(--ia-border); padding-bottom: 4px; }
            .history-preview { font-size: 12px; color: var(--ia-text); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 8px; }
            .h-actions { display: flex; gap: 5px; justify-content: flex-end; }
            .h-btn { padding: 4px 10px; font-size: 11px; border-radius: 4px; cursor: pointer; border: none; }
            .chat-bubble { max-width: 85%; padding: 10px 14px; border-radius: 12px; font-size: 13px; line-height: 1.4; margin-bottom: 10px; }
            .chat-user { align-self: flex-end; background-color: var(--ia-primary); color: white; }
            .chat-ai { align-self: flex-start; background-color: var(--ia-card); border: 1px solid var(--ia-border); }
        `;

                const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style); window.AjaModular.scopeStyle('ia',style);

                // --- 3. HTML (Com Blindagem Anti-Autofill) ---
                const widgetHTML = `
          <style>
            :root {
                --ia-bg: #ffffff;
                --ia-surface: #f8fafc;
                --ia-border: #e2e8f0;
                --ia-text: #1e293b;
                --ia-text-muted: #64748b;
                --ia-primary: #8b5cf6;
                --ia-primary-hover: #7c3aed;
                --ia-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);
            }
            .cc-escurinho {
                --ia-bg: #0f172a;
                --ia-surface: #1e293b;
                --ia-border: #334155;
                --ia-text: #f8fafc;
                --ia-text-muted: #94a3b8;
                --ia-shadow: 0 10px 25px -5px rgba(0,0,0,0.5), 0 8px 10px -6px rgba(0,0,0,0.5);
            }
            #gemini-wrapper { font-family: 'Inter', -apple-system, sans-serif; }
            .gemini-btn {
                padding: 10px 14px;
                border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer;
                transition: all 0.2s ease; display: inline-flex; align-items: center; justify-content: center; gap: 6px;
            }
            .gemini-btn:disabled { opacity: 0.6; cursor: not-allowed; }
            .btn-primary { background: var(--ia-primary); color: white; }
            .btn-primary:hover:not(:disabled) { background: var(--ia-primary-hover); transform: translateY(-1px); }
            .btn-outline { background: transparent; border: 1px solid var(--ia-border); color: var(--ia-text); }
            .btn-outline:hover { background: var(--ia-surface); }
            .btn-danger { background: #ef4444; color: white; width: 100%; margin-top: 10px; }
            .btn-danger:hover { background: #dc2626; }
            .btn-action { background: var(--ia-surface); color: var(--ia-text); flex: 1; padding: 12px; }
            .btn-action:hover { background: var(--ia-border); }

            .gemini-input {
                width: 100%; box-sizing: border-box; padding: 10px 12px;
                border: 1px solid var(--ia-border); border-radius: 8px;
                background: var(--ia-surface); color: var(--ia-text); font-size: 13px; margin-bottom: 12px;
                outline: none; transition: border-color 0.2s;
            }
            .gemini-input:focus { border-color: var(--ia-primary); box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2); }
            
            textarea.gemini-input { resize: vertical; min-height: 80px; font-family: inherit; }

            .chat-bubble { max-width: 85%; padding: 10px 14px; border-radius: 12px; font-size: 13px; line-height: 1.5; margin-bottom: 10px; }
            .chat-user { background: var(--ia-primary); color: white; align-self: flex-end; border-bottom-right-radius: 2px; }
            .chat-ai { background: var(--ia-surface); color: var(--ia-text); border: 1px solid var(--ia-border); align-self: flex-start; border-bottom-left-radius: 2px; }
            .chat-ai p { margin: 0 0 8px 0; }
            .chat-ai p:last-child { margin: 0; }
            
            .screen { display: none; flex-direction: column; flex: 1; min-height: 0; }
            .screen.active { display: flex; }

            .nav-tabs { display: flex; border-bottom: 1px solid var(--ia-border); margin-bottom: 15px; }
            .nav-tab {
                flex: 1; padding: 10px 0; background: none; border: none; border-bottom: 2px solid transparent;
                color: var(--ia-text-muted); font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s;
            }
            .nav-tab:hover { color: var(--ia-text); }
            .nav-tab.active { color: var(--ia-primary); border-bottom-color: var(--ia-primary); }

            .history-item { document.createElement('div'); } /* fallback */
            .history-item { background: var(--ia-surface); border: 1px solid var(--ia-border); padding: 10px; border-radius: 8px; margin-bottom: 8px; font-size: 12px; color: var(--ia-text); }
            .history-meta { display: flex; justify-content: space-between; color: var(--ia-text-muted); font-size: 11px; margin-bottom: 4px; }
            .history-preview { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 8px; font-weight: 500;}
            .h-actions { display: flex; gap: 6px; }
            .h-btn { flex:1; padding:6px; font-size:11px; border-radius:4px; border:none; cursor:pointer; font-weight:600; }
            
            #gemini-result {
                background: var(--ia-surface); border: 1px solid var(--ia-border);
                border-radius: 8px; padding: 14px; font-size: 13px; color: var(--ia-text);
                line-height: 1.6; max-height: 250px; overflow-y: auto; display: none;
            }
            #gemini-result p { margin: 0 0 10px 0; }
            #gemini-result p:last-child { margin: 0; }
            #gemini-result strong { color: var(--ia-primary); }
            
            .gemini-label { display: block; font-size: 12px; font-weight: 600; color: var(--ia-text-muted); margin-bottom: 4px;}
            
            ::-webkit-scrollbar { width: 6px; }
            ::-webkit-scrollbar-track { background: transparent; }
            ::-webkit-scrollbar-thumb { background: var(--ia-border); border-radius: 3px; }
            ::-webkit-scrollbar-thumb:hover { background: var(--ia-text-muted); }
          </style>

          <div id="gemini-wrapper" class="local-light-mode">
            <button id="gemini-float-btn" class="purecloud-script-button" style="position:fixed; bottom:20px; right:20px; width:56px; height:56px; border-radius:50%; background:linear-gradient(135deg, #8b5cf6, #d946ef); color:white; border:none; box-shadow:0 4px 15px rgba(139,92,246,0.4); cursor:pointer; z-index:999999; display:flex; align-items:center; justify-content:center; hover{transform:scale(1.05)} transition:0.2s;">
              <svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" stroke-width="2" fill="none"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
            </button>

            <div id="gemini-modal" style="display:none; position:fixed; top:80px; right:30px; width:360px; height:600px; background:var(--ia-bg); box-shadow:var(--ia-shadow); border-radius:16px; border:1px solid var(--ia-border); z-index:1000000; flex-direction:column; overflow:hidden;">
              <div id="gemini-drag-handle" style="padding:16px; background:var(--ia-surface); border-bottom:1px solid var(--ia-border); display:flex; justify-content:space-between; align-items:center; cursor:move;">
                 <div style="display:flex; align-items:center; gap:8px;">
                    <div style="width:28px; height:28px; border-radius:8px; background:linear-gradient(135deg, #8b5cf6, #d946ef); display:flex; align-items:center; justify-content:center; color:white;">
                       <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M12 2a10 10 0 1 0 10 10H12V2z"></path><path d="M12 12 2.1 12"></path><path d="M12 12 21.9 12"></path></svg>
                    </div>
                    <div>
                        <div style="font-weight:700; font-size:14px; color:var(--ia-text);">Aja Assistant</div>
                        <div style="font-size:10px; color:var(--ia-text-muted);">by Genesys Pro</div>
                    </div>
                 </div>
                 <div style="display:flex; gap:8px;">
                     <button id="btn-theme" class="purecloud-script-button" style="background:none; border:none; cursor:pointer; font-size:16px;" title="Mudar Tema">🌗</button>
                     <button id="btn-close" class="purecloud-script-button" style="background:none; border:none; color:var(--ia-text-muted); cursor:pointer; padding:4px;">
                        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                     </button>
                 </div>
              </div>

              <div id="ia-nav-tabs" class="nav-tabs" style="padding:0 16px; background:var(--ia-surface); display:none;">
                 <button class="nav-tab purecloud-script-button active" data-target="report">Relatório</button>
                 <button class="nav-tab purecloud-script-button" data-target="chat">Chat</button>
                 <button class="nav-tab purecloud-script-button" data-target="history">Histórico</button>
                 <button class="nav-tab purecloud-script-button" data-target="config" style="flex:0.3;">⚙️</button>
              </div>

              <!-- TELAS -->
              <div style="flex:1; display:flex; flex-direction:column; padding:16px; overflow-y:auto;">
                 
                 <div id="screen-login" class="screen active" style="justify-content:center; align-items:center; text-align:center; padding-bottom:40px;">
                    <div style="width:64px; height:64px; border-radius:16px; background:linear-gradient(135deg, #8b5cf6, #d946ef); display:flex; align-items:center; justify-content:center; color:white; margin:0 auto 20px auto; box-shadow:0 8px 20px rgba(139,92,246,0.3);">
                       <svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" stroke-width="2" fill="none"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
                    </div>
                    <h3 style="margin:0 0 8px 0; color:var(--ia-text); font-size:20px;">Bem-vindo à Aja</h3>
                    <p style="color:var(--ia-text-muted); font-size:13px; margin:0 0 24px 0; line-height:1.5;">Configure sua chave da API Google Gemini para ativar todos os recursos.</p>
                    
                    <div style="text-align:left; width:100%;">
                        <span class="gemini-label">Nome do Agente</span>
                        <input type="text" id="input-setup-name" class="gemini-input" placeholder="Ex: Josias">
                        
                        <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                            <span class="gemini-label" style="margin:0;">Sua API Key Gemini</span>
                            <a href="https://aistudio.google.com/app/apikey" target="_blank" style="font-size:11px; color:var(--ia-primary); text-decoration:none;">Obter Chave</a>
                        </div>
                        <input type="text" id="input-setup-key" class="gemini-input" placeholder="AIzaSy..." autocomplete="off" style="-webkit-text-security: disc;">
                        <button id="btn-login" class="gemini-btn btn-primary purecloud-script-button" style="width:100%; padding:12px; margin-top:10px;">Ativar Assistente</button>
                    </div>
                 </div>

                 <div id="screen-report" class="screen">
                    <div id="logged-in-tools" style="display:none; flex-direction:column; flex:1;">
                        
                        <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:4px;">
                            <span class="gemini-label" style="margin:0;">O que aconteceu no atendimento?</span>
                            <button id="btn-clear-report-top" style="background:none; border:none; color:var(--ia-text-muted); cursor:pointer; font-size:11px;">Limpar Texto</button>
                        </div>
                        <textarea id="input-report" class="gemini-input" rows="4" placeholder="Ex: Cliente está sem acesso..."></textarea>
                        
                        <div id="result-actions-top" style="display:none; gap:10px; margin-bottom:12px;">
                             <button id="btn-copy-result-top" class="gemini-btn btn-primary purecloud-script-button" style="flex:1;">📋 Copiar Relatório</button>
                             <button id="btn-wipe-result-top" class="gemini-btn btn-outline purecloud-script-button" style="flex:1;">Limpar IA</button>
                        </div>

                        <button id="btn-gen-report" class="gemini-btn btn-primary purecloud-script-button" style="width:100%; padding:14px; font-size:14px;">⚡ Gerar Relatório</button>
                        
                        <div id="ia-tabulacao-box" style="display:none; margin-top:10px; padding:12px; border-radius:8px; border: 1px dashed var(--ia-primary); background: rgba(139, 92, 246, 0.05); user-select:none;">
                            <div style="font-size:11px; font-weight:700; color:var(--ia-primary); text-transform:uppercase; margin-bottom:4px; display:flex; gap:6px; align-items:center;">
                                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
                                Tabulação Sugerida
                            </div>
                            <div id="ia-tabulacao-text" style="font-size:13px; font-weight:600; color:var(--ia-text);"></div>
                        </div>

                        <div id="gemini-result" style="margin-top:10px;"></div>

                        <div id="result-actions" style="display:none; gap:10px; margin-top:12px;">
                             <button id="btn-copy-result" class="gemini-btn btn-primary purecloud-script-button" style="flex:1;">📋 Copiar Relatório</button>
                             <button id="btn-wipe-result" class="gemini-btn btn-outline purecloud-script-button" style="flex:1;">Limpar</button>
                        </div>
                    </div>
                 </div>

              <div id="screen-history" class="screen">
                 <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                     <h4 style="margin:0; color:var(--ia-text);">Seus Relatórios Salvos</h4>
                     <button id="btn-wipe-history" style="background:none; border:none; color:#ef4444; font-size:11px; cursor:pointer; font-weight:600;">Apagar Tudo</button>
                 </div>
                 <div id="history-list" style="flex:1; overflow-y:auto; display:flex; flex-direction:column;"></div>
                 <button id="btn-back-report-h" class="gemini-btn btn-outline purecloud-script-button" style="width:100%; margin-top:15px;">Voltar</button>
              </div>

              <div id="screen-chat" class="screen">
                 <div id="chat-container" style="flex:1; overflow-y:auto; display:flex; flex-direction:column;">
                    <div id="chat-welcome-msg" class="chat-bubble chat-ai">...</div>
                 </div>
                 <div style="display:flex; gap:8px; margin-top:10px; border-top:1px solid var(--ia-border); padding-top:10px;">
                    <input type="search" id="input-chat" class="gemini-input" style="margin:0; border-radius:20px;" placeholder="Converse com a Aja..." autocomplete="off">
                    <button id="btn-send-chat" class="gemini-btn btn-primary purecloud-script-button" style="width:40px; margin:0; border-radius:50%;">➤</button>
                 </div>
                 <button id="btn-clear-chat" style="background:none; border:none; color:var(--ia-text-muted); font-size:11px; cursor:pointer; align-self:flex-end; margin-top:5px;">Limpar Chat</button>
              </div>

              <div id="screen-config" class="screen">
                  <h4 style="margin-top:0;">Configurações</h4>
                  <span class="gemini-label">Nome:</span>
                  <input type="search" id="cfg-name" class="gemini-input" autocomplete="off" name="aja_cfg_name">
                  <span class="gemini-label">API Key:</span>
                  <input type="search" id="cfg-key" class="gemini-input" autocomplete="off" name="aja_cfg_key" style="-webkit-text-security: disc;">
                  <button id="btn-save-cfg" class="gemini-btn btn-primary purecloud-script-button" style="width:100%; margin-top:10px;">Salvar Alterações</button>
                  
                  <div style="margin-top:auto; border-top:1px dashed var(--ia-border); padding-top:15px;">
                      <button id="btn-back-report-c" class="gemini-btn btn-outline purecloud-script-button" style="margin-bottom:10px;">Voltar</button>
                      <button id="btn-logout" class="gemini-btn btn-danger purecloud-script-button">Sair e Bloquear</button>
                  </div>
              </div>

            </div>
          </div>
        `;

                if (window.self === window.top) {
                    const container = document.createElement('div'); container.innerHTML = widgetHTML; document.body.appendChild(container);
                }

                // --- 4. REFERÊNCIAS ---
                const getEl = (id) => document.getElementById(id);
                const modal = getEl('gemini-modal');
                const wrapper = getEl('gemini-wrapper');

                // --- 5. LÓGICA API ---
                async function findBestFreeModel(apiKey) {
                    const response = await window.AjaModularSpell.request('https://generativelanguage.googleapis.com/v1beta/models', {headers:{'x-goog-api-key':apiKey}});
                    if (!response.ok) throw new Error('ListModels: ' + response.status);
                    const data = await response.json();
                    const models = (data.models || []).filter(m=>m.supportedGenerationMethods?.includes('generateContent'));
                    const model = models.find(m=>m.name.includes('flash')) || models[0];
                    if (!model) throw new Error('Nenhum modelo de texto disponível.');
                    return model.name.replace('models/','');
                }
                const TABS_DB = `
LOS - FTTH	Cabo fibra rompido, problema nos conectores de fibra, problema na ONU.
Pon apagada - FTTH	ONU com problema de atualização.
Pon piscando - FTTH	Comando no TL1, passou por cancelamento ou reativação, clientes retornando sinal para OLT, pós falta de energia, inversão de rota
Rota inoperante - FTTH	Rompimento por acidentes, incendios em postes afeta todos os clientes.
Roteador sem gerencia - FTTH	Cabo de rede mal conectado, conectado na porta incorreta, comando no TL1, conector RJ45 com problema.
ONU sem IP - FTTH	Problema na ONU, Comando no TL1,VLAN incorreta.
PPPoE desconectado - FTTH	Senha PPPoE incorreta, login de autenticação incorreto, IP FIXO duplicado, sem VLAN.
Manutenção na rede brisanet - FTTH	Troca e atualização de OLTs, switch, MPLS, CPD.
Sistema interno indisponível	Yoda Indisponível, impossibilitado de realizar comandos.
Chamado imoc	Setor de Manutenção de Fibra solicita que o Suporte Interno abra reparo para cabo drop.
Sem acesso site ou sistema especifico - FTTH	Aplicativos, sites, VPNs, bloqueios de portas.
Equipamento desligado da energia  - FTTH	Roteador, receptor, CPE desligada da energia elétrica.
Equipamento desligado no botao POWER - FTTH	Botão POWER desativado.
Sem conexao a dispositivo especifico - FTTH	3 celulares navegando e TV não está navegando.
Dispositivo Conectado, mas sem Internet - FTTH	Apresenta a mensagem de falha na conexão, ponto de exclamação.
Wi-Fi padrao de fabrica - resetado - FTTH	Exibe rede TP-LNK, Brisadefault ou marca do roteador.
Baixo Alcance Wi-Fi - FTTH	Posição do roteador ruim, Interferências de parede.
Lentidão geral em todos dispositivo - FTTH	Todos lentos independentemente da aplicação.
Lentidão em dispositivos específicos - FTTH	Apenas alguns dispositivos estão lentos.
Lentidão em site específicos - FTTH	Apenas alguns sites específicos estão lentos.
Instabilidade em IPTV - FTTH	Serviços de IPTV não homologados instaveis.
Sem acesso a serviço IPTV - FTTH	Serviços de IPTV não homologados sem acesso.
Rota com sinal irregular - FTTH	Sinal de toda a ROTA (todos os clientes) irregular.
Sinal da fibra do cliente irregular - FTTH	Sinal apenas da fibra do cliente irregular.
Quedas na conexão - FTTH	Downloads demoram, lentidão intermitente.
Plano não chega o contratado  - FTTH	Plano 100Mbps mas atinge apenas 50Mbps.
Instabilidade massiva na rede brisanet - FTTH	Afeta mais de um cliente (OLT, CIDADE, ESTADO) culpa brisanet.
Instabilidade massiva na rede externa - FTTH	Afeta mais de um cliente, culpa de terceiros (Amazon, Google).
Problema em jogos online - FTTH	Latência para servidor do jogo, perca de pacote.
Agendamento de retorno	Cliente solicitar retorno em horário.
Ligação sem contato	Operador tentou retorno e não conseguiu.
Cliente desistiu da visita técnica	Problema resolvido remotamente, cancelou tecnico.
Ligação caiu	Ligação caiu antes de concluir.
Solicitação de atendimento voz/texto	Gravações de ligações e chat.
Solicitação de declaração	Declaração de instabilidade massiva.
Ligações escritório	Ligações do escritório para duvidas.
Atendimento encerrado por falta de cordialidade	Assédio, xingamentos do cliente.
Atendimento encerrado por falta de confirmação de dados	Cliente não confirma dados.
Transferencia para o Comercial	Deseja comprar plano.
Duvidas comercial	Dúvidas sobre planos sem transferir.
Transferencia para o Cobranca	Problemas de faturas.
Duvidas financeira	Dúvidas sobre fatura sem transferir.
Transferencia para o SAC	Problemas generalistas.
Duvidas sobre alteracao de endereco	Dúvidas de troca de endereco.
Duvidas sobre alteracao de titular	Dúvidas troca de titular.
Transferencia para o Retencao	Deseja cancelar a internet.
Duvidas sobre cancelamento	Dúvidas sobre multa de cancelamento.
Transferencia para o SAC 5G	Deseja suporte 5G.
Transferencia para o Suporte Corporativo B2B	Cliente CNPJ 0800 Varejo transfere B2B.
Transferencia para o Regional	Cliente transferido suporte regional.
Transferencia indevida para o suporte	Transferencia errada atendente.
Orientação sobre ocultar a rede wi-fi - FTTH	Quer ocultar rede wifi.
Transferencia para pausa	Operador transferiu o call pois vai pausar/descansar.
Orientação sobre como consultar a senha do wi-fi - FTTH	Quer ver a senha do wifi.
Orientação sobre rede unificada - FTTH	Dúvidas rede unificada TPLINK.
Informação sobre os canais de atendimento - FTTH	Quais canais empresa (whatsapp/0800).
Solicitação do número de IP - FTTH	Quer saber o numero IP.
Orientação de como contratar o IP FIXO - FTTH	Quer contratar IP Fixo.
Solicitação para separar a rede wi-fi - FTTH	Quer separar os WiFis 2.4/5.0.
Solicitação do cliente para desabilitar o wi-fi - FTTH	Quer desligar WiFi.
Solicitação de acesso ao equipamento da brisanet - FTTH	Quer entrar no roteador via admin.
Informações sobre valores dos serviços avulso - FTTH	Taxas de serviços.
Cliente com inadimplencia financeira - bloqueado - FTTH	Cliente bloqueado por divida mas caiu no suporte tecnico.
Dúvidas sobre a função do WPS - FTTH	Duvidas botão WPS.
Bloqueio IP - VPN - FTTH	VPN bloqueando.
Alterar senha PPPoE - FTTH	Técnico contata mudar senha pppoe.
Alterar login PPPoE - FTTH	Técnico contata mudar login pppoe.
Atualização de contato	Mudar numero de celular do cadatro.
Alteração de ip fixo - FTTH	Mudar IP fixo.
Alteração da senha do Wi-Fi - FTTH	Mudar senha wifi remotamente.
Altreração do canal da rede Wi-Fi - FTTH	Mudar canal wifi (ex: do 6 para 11).
Alteração do modo da rede Wi-Fi - FTTH	Mudar padrao wifi B/G/N/AC/AX.
Altreração da largura de banda da rede Wi-Fi - FTTH	Mudar largura de banda (20/40/80mhz).
Personalizar o nome da rede Wi-Fi - FTTH	Mudar nome do wifi.
Troca de cabo de rede	Cabo RJ45 danificado.
Troca de cabo fibra - FTTH	Cabo DROP rompido na casa do cliente.
Troca de fonte - FTTH	Fonte queimada choque eletrico.
Troca de onu - FTTH	ONU queimou.
Cabo de fibra baixo/remanejamento - FTTH	Cabo pendurado no poste do cliente.
Recolher roteador - FTTH	Pegar Tplink do cliente de volta.
Troca de roteador  - FTTH	Tplink pifou.
Instalação de roteador - FTTH	Instalar um Tplink na onu do cliente.
Suspeita de equipamento danificado	Equipamento aparente quebrado fisico.
Suporte a equipamento particular	Conectar dvr, smart tv, camera IP do cliente.
Alteração de cômodo	Mudar internet de lugar na casa.
Configuração estruturada de rede interna	Cliente tem switch, roteadores cascateados.
Sobrança de instalação fora do prazo	Instalacao atrasou (cobranca).
Cobrança de instalação dentro do prazo	Instalacao normal (cobranca).
Cobrança de reparo dentro do prazo	Reparo normal (cobranca).
Cobrança de reparo fora do prazo	Reparo atrasado (cobranca).
Cobrança de retorno interno	Retorno (cobranca).
Conecta+	Demandasecta+.
Cobrança de alt. De endereço dentro do prazo	Mudanca endereco prazo.
Cobrança de alt. De endereço fora do prazo	Mudanca endereco atrasou.
Alteração de titularidade (dentro do prazo)	Titularidade prazo.
Alteração de titularidade (fora do prazo)	Titularidade atrasada.
Instalação inadequada (local) - 7d	Comodo errado do tecnico inferior a 7 dias.
Instalação mal sucedida (sem acesso) - 7d	Instalou e ficou sem internet -7dias.
Configuração de roteador não realizada na instalação - 7d	Tecnico não configurou roteador TPlink.
Cabo de rede não disponibilizado no ato da instalação - até 7d	Tecnico nao deixou o amarelo de rede.
Insatisfeito com o equipamento instalado - 7d	Reclama equipamento usado ou sujo.
Conecta+ (cabo não deixado no ato da inst.) - 7d	Conecta+ mas sem cabo.
Alteração de endereço mal sucedida	Mudou de lugar e ficou sem internet.
Cliente ja atendido	Descobriu que o problema ja foi solucionado hoje.
CPE sem sinal - FWA	CPE sem sinal.
Falta de energia na torre - FWA	Torre sem sinal.
Torre inoperante - FWA	Torre parada FWA.
Sem acesso site ou sistema especifico - FWA	Apps VPN FWA travando.
Atingiu a franquia - FWA	Bateu franquia 100% gigas FWA limitou a velocidade.
Troca de receptor - TV	TV receptor quebrado.
Troca de controle TV - TV	Controle remoto quebrou TV.
Troca de cabo HDMI/RCA - TV	Cabo HDMI/RCA ruim TV.
Tela azul Brisanet - TV	Travado logomarca azul TV.
Suporte a TV com tela preta - TV	Tela super preta do receptor TV.
Suporte a canal indisponivel - TV	Canal 40 fora do ar TV.
Suporte a Canais Quadriculando - TV	Canais imagem bugando congelando TV.
Receptor bloqueado - TV	Mensagem de inadimplencia TV.
Problema no audio - TV	TV mudo.
Erro de NTP - TV	Erro hora/data TV.
Canais bloqueados - TV	Autocensura bloqueado TV.
Alteracao de senha TV - TV	Mudar senha autocensura TV.
Brisaplay - erro de login	Login Brisaplay Usuario Invalido.
Brisaplay - canais bloqueados	Brisaplay Cadeado.
Brisaplay - canais com código de erro	Brisaplay Erro 2.
Brisaplay - canais com tela preta	Brisaplay tela infinita negra.
Troca de telefone - Telefonia	Aparelho Fixo quebrado.
Telefonia fixa com as ligacoes falhando - Telefonia	Cortando voz no fixo.
Telefonia desativada - Telefonia	Telefone cortado.
Telefonia com falha de autenticacao - Telefonia	Falha registrar Voip.
Telefonia bloqueada por limite - Telefonia	Acabou os minutos de ligações telefone Fixo.
Telefone mudo - Telefonia	Telefone sem tom de discagem 100% inoperavel.
Problema no PABX do cliente - Telefonia	PABX Empresarial com problemas internos.
Problema na portabilidade - Telefonia	Número portado nao veio pro chip brisanet fixo.
Operadoras - falha massiva para receber/efetuar - Telefonia	Não consegue ligar para ninguem de celular Tim, Vivo etc.
Nao efetua/recebe ligacoes para operadora/numero especifico - Telefonia	Mudo so pra 1 pessoa.
Mudanca de numero da telefonia fixa - Telefonia	Trocar o numero.
Suporte a aplicativos SVAs	Qualifica, Skeelo, Hero, Exa SVAs suporte app.
Brisacliente	Brisacliente fatura APP erro.
Netflix	Netflix nao quer ativar conta email falha.
Globoplay	Globo play app assistindo filmes com problema ativação.
Premiere	Premiere APP ativação.
Paramount+	Paramount filmes bug.
Docway	Telemedicina Docway erro app.
Telecine	Telecine filmes erros APP app.
`;

                async function generateText(prompt) {
                    return window.AjaModularSpell.askGemini(prompt,userApiKey);
                }
                function formatMarkdown(text) {
                    if (!text) return '';
                    return ctx.escapeHTML(String(text))
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                        .replace(/`(.*?)`/g, '<code style="background:rgba(255,255,255,0.1); padding:2px; border-radius:3px;">$1</code>');
                }
                // --- CONTROLE DE ESTADO ---
                function loadState() {
                    store.get(['geminiKey', 'agentName', 'IA_THEME'], (res) => {

                        if (res.IA_THEME === 'light') {
                            wrapper.classList.add('local-light-mode');
                            wrapper.classList.remove('cc-escurinho');
                            getEl('btn-theme').innerText = '☀️';
                            getEl('btn-theme').title = 'Mudar para Tema Escuro';
                        } else if (res.IA_THEME === 'dark') {
                            wrapper.classList.add('cc-escurinho');
                            wrapper.classList.remove('local-light-mode');
                            getEl('btn-theme').innerText = '🌗';
                            getEl('btn-theme').title = 'Mudar para Tema Claro';
                        }

                        if (res.geminiKey) {
                            userApiKey = res.geminiKey;
                            agentName = res.agentName || "Atendente";

                            getEl('cfg-key').value = userApiKey;
                            getEl('cfg-name').value = agentName;
                            getEl('input-setup-name').value = agentName;

                            const greeting = getBrazilGreeting();
                            getEl('chat-welcome-msg').innerHTML = `${greeting} <b>${agentName}</b>!<br>Eu sou a <b>Aja</b>. Como posso ajudar?`;

                            getEl('logged-in-tools').style.display = 'flex';
                            getEl('ia-nav-tabs').style.display = 'flex';
                            switchScreen('report');
                        } else {
                            getEl('logged-in-tools').style.display = 'none';
                            getEl('ia-nav-tabs').style.display = 'none';
                            switchScreen('login');
                        }
                    });
                }

                function switchScreen(id) {
                    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
                    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
                    getEl('screen-' + id).classList.add('active');
                    const tab = document.querySelector(`.nav-tab[data-target="${id}"]`);
                    if (tab) tab.classList.add('active');
                    if (id === 'history') renderHistory();
                }

                // --- HISTÓRICO ---
                function saveToHistory(text) {
                    store.get(['geminiHistory'], (res) => {
                        let hist = res.geminiHistory || [];
                        hist.unshift({ id: Date.now(), date: new Date().toLocaleString(), text: text });
                        if (hist.length > 20) hist = hist.slice(0, 20);
                        store.set({ geminiHistory: hist });
                    });
                }

                function renderHistory() {
                    const list = getEl('history-list');
                    store.get(['geminiHistory'], (res) => {
                        const hist = res.geminiHistory || [];
                        list.innerHTML = hist.length ? '' : '<p style="text-align:center; color:var(--ia-text-muted); margin-top:20px;">Nenhum histórico.</p>';
                        hist.forEach(item => {
                            const div = document.createElement('div'); div.className = 'history-item';
                            div.innerHTML = `
                        <div class="history-meta"><span>${item.date}</span></div>
                        <div class="history-preview">${item.text}</div>
                        <div class="h-actions">
                             <button class="h-btn btn-primary h-copy purecloud-script-button" data-text="${encodeURIComponent(item.text)}">Copiar</button>
                             <button class="h-btn btn-danger h-del purecloud-script-button" data-id="${item.id}">🗑️</button>
                        </div>
                    `;
                            list.appendChild(div);
                        });
                        list.querySelectorAll('.h-copy').forEach(b => b.onclick = (e) => {
                            navigator.clipboard.writeText(decodeURIComponent(e.target.dataset.text));
                            e.target.innerText = "OK!"; setTimeout(() => e.target.innerText = "Copiar", 1500);
                        });
                        list.querySelectorAll('.h-del').forEach(b => b.onclick = (e) => {
                            const id = parseInt(e.target.dataset.id);
                            store.get(['geminiHistory'], r => {
                                store.set({ geminiHistory: (r.geminiHistory || []).filter(i => i.id !== id) }, renderHistory);
                            });
                        });
                    });
                }

                // --- EVENTOS ---

                if (getEl('btn-head-history')) getEl('btn-head-history').onclick = () => switchScreen('history');
                if (getEl('btn-head-config')) getEl('btn-head-config').onclick = () => switchScreen('config');
                getEl('btn-theme').onclick = () => {
                    const isLight = wrapper.classList.contains('local-light-mode');
                    if (isLight) {
                        wrapper.classList.remove('local-light-mode');
                        wrapper.classList.add('cc-escurinho');
                        store.set({ IA_THEME: 'dark' });
                        getEl('btn-theme').innerText = '🌗';
                        getEl('btn-theme').title = 'Mudar para Tema Claro';
                    } else {
                        wrapper.classList.remove('cc-escurinho');
                        wrapper.classList.add('local-light-mode');
                        store.set({ IA_THEME: 'light' });
                        getEl('btn-theme').innerText = '☀️';
                        getEl('btn-theme').title = 'Mudar para Tema Escuro';
                    }
                };
                getEl('btn-close').onclick = () => {
                    modal.style.display = 'none';
                    if (window.spellCheckerModule) window.spellCheckerModule.ocultarTudo();
                };
                getEl('gemini-float-btn').onclick = () => {
                    modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
                    if (modal.style.display === 'none' && window.spellCheckerModule) {
                        window.spellCheckerModule.ocultarTudo();
                    }
                    if (modal.style.display === 'flex') {
                        const rect = modal.getBoundingClientRect();
                        if (rect.top < 0 || rect.left < 0 || rect.bottom > window.innerHeight || rect.right > window.innerWidth) {
                            modal.style.top = '80px';
                            modal.style.left = '';
                            modal.style.right = '30px';
                            modal.style.transform = 'none';
                        }
                    }
                    loadState();
                };

                const dragHandle = getEl('gemini-drag-handle');
                if (dragHandle) {
                    let isDragging = false, dragOffsetX = 0, dragOffsetY = 0;
                    dragHandle.addEventListener('mousedown', (e) => {
                        if (e.target.closest('button')) return;
                        isDragging = true;
                        const rect = modal.getBoundingClientRect();
                        dragOffsetX = e.clientX - rect.left;
                        dragOffsetY = e.clientY - rect.top;
                        modal.style.transition = 'none';
                    });
                    document.addEventListener('mousemove', (e) => {
                        if (!isDragging) return;
                        modal.style.left = (e.clientX - dragOffsetX) + 'px';
                        modal.style.top = (e.clientY - dragOffsetY) + 'px';
                        modal.style.right = 'auto'; 
                        modal.style.bottom = 'auto';
                    });
                    document.addEventListener('mouseup', () => { isDragging = false; });
                }

                document.querySelectorAll('.nav-tab').forEach(t => t.onclick = () => switchScreen(t.dataset.target));

                getEl('btn-login').onclick = () => {
                    const k = getEl('input-setup-key').value.trim();
                    const n = getEl('input-setup-name').value.trim();
                    if (k.length < 10) return alert("Chave inválida.");
                    store.set({ geminiKey: k, agentName: n || "Atendente" }, loadState);
                };
                getEl('btn-logout').onclick = () => { if (confirm("Sair e Bloquear?")) store.remove(['geminiKey', 'agentName'], () => { userApiKey = ''; loadState(); }); };
                getEl('btn-save-cfg').onclick = () => {
                    store.set({ geminiKey: getEl('cfg-key').value, agentName: getEl('cfg-name').value }, () => alert("Salvo!"));
                };
                getEl('btn-back-report-h').onclick = () => switchScreen('report');
                getEl('btn-back-report-c').onclick = () => switchScreen('report');

                // Relatório
                getEl('btn-gen-report').onclick = async () => {
                    const txt = getEl('input-report').value.trim();
                    if (!txt) return alert("Insira o texto.");

                    const btn = getEl('btn-gen-report');
                    const resDiv = getEl('gemini-result');
                    const actions = getEl('result-actions');

                    btn.innerHTML = "⏳ A gerar..."; btn.disabled = true;
                    resDiv.style.display = 'none'; actions.style.display = 'none';

                    const timeGreeting = getBrazilGreeting();
                    const prompt = `
            Contexto: Agora é ${timeGreeting}. Você é a Aja, assistente do agente ${agentName}.
            Gere um relatório técnico em PRIMEIRA PESSOA (${agentName}).
            REGRAS RÍGIDAS DE SAÍDA:
            1. NÃO DÊ BOM DIA, BOA TARDE OU BOA NOITE NO INÍCIO.
            2. NÃO ESCREVA "AQUI ESTÁ O RELATÓRIO" OU "SEGUE O RELATÓRIO".
            3. A SAÍDA DEVE COMEÇAR IMEDIATAMENTE PELO TÍTULO OU PELA INTRODUÇÃO.
            4. NÃO invente horários. Mantenha privacidade: Apenas Nome e Telefone do cliente.
            5. VOCÊ DEVE OBRIGATORIAMENTE ESCOLHER A TABULAÇÃO GENESYS MAIS ADEQUADA COM BASE NO RELATO, E INSERIR NO INÍCIO DA SUA RESPOSTA ENTRE <TAB> e </TAB>. Ex: <TAB>LOS - FTTH</TAB>
            ESTRUTURA: <TAB>SUA ESCOLHA DE TABULAÇÃO</TAB> Relatório Técnico de Atendimento -> 1. Introdução, 2. Relato, 3. Procedimentos, 4. Conclusão
            
            TABULAÇÕES DISPONÍVEIS (Escolha apenas uma):
            ${TABS_DB}
            Texto base: ${txt}`;

                    try {
                        const raw = await generateText(prompt);

                        let finalReport = raw;
                        let suggestedTab = "Nenhuma tabulação identificada";

                        const tabMatch = raw.match(/<TAB>\s*(.*?)\s*<\/TAB>/is);
                        if (tabMatch) {
                            suggestedTab = tabMatch[1].replace(/\*/g, '').trim();
                            finalReport = raw.replace(tabMatch[0], '').trim();
                        } else {
                            // Backup: Tenta buscar a ultima linha.
                            let lines = raw.split('\n').filter(l => l.trim().length > 0);
                            let lastLine = lines[lines.length - 1] || "";
                            if (!lastLine.toLowerCase().includes('conclusão') && lastLine.length < 100) {
                                suggestedTab = lastLine.replace(/<.*?>/g, '').replace(/\*/g, '').trim();
                                finalReport = raw.replace(lastLine, '').trim();
                            } else {
                                suggestedTab = "Não identificada automaticamente. Analise o relato.";
                            }
                        }

                        const tabBox = document.getElementById('ia-tabulacao-box');
                        const tabText = document.getElementById('ia-tabulacao-text');
                        if (tabBox && tabText) {
                            tabText.innerText = suggestedTab;
                            tabBox.style.display = 'block';
                        }

                        resDiv.innerHTML = formatMarkdown(finalReport);
                        resDiv.style.display = 'block';
                        actions.style.display = 'flex';
                        if (document.getElementById('result-actions-top')) document.getElementById('result-actions-top').style.display = 'flex';
                        actions.style.flexDirection = 'row';
                        saveToHistory(finalReport);
                    } catch (e) {
                        resDiv.innerText = "Erro: " + e.message;
                        resDiv.style.display = 'block';
                    } finally {
                        btn.innerHTML = "⚡ Gerar Relatório"; btn.disabled = false;
                    }
                };

                const copyFunc = () => {
                    navigator.clipboard.writeText(getEl('gemini-result').innerText);
                    const b1 = getEl('btn-copy-result');
                    const b2 = getEl('btn-copy-result-top');
                    if (b1) { b1.innerText = "Copiado! ✅"; setTimeout(() => b1.innerText = "📋 Copiar Relatório", 2000); }
                    if (b2) { b2.innerText = "Copiado! ✅"; setTimeout(() => b2.innerText = "📋 Copiar Relatório", 2000); }
                };
                getEl('btn-copy-result').onclick = copyFunc;
                if (getEl('btn-copy-result-top')) getEl('btn-copy-result-top').onclick = copyFunc;

                const clearFunc = () => {
                    getEl('input-report').value = '';
                    getEl('gemini-result').innerHTML = '';
                    getEl('gemini-result').style.display = 'none';
                    getEl('result-actions').style.display = 'none';
                    if (getEl('result-actions-top')) getEl('result-actions-top').style.display = 'none';
                    if (document.getElementById('ia-tabulacao-box')) document.getElementById('ia-tabulacao-box').style.display = 'none';
                };
                getEl('btn-clear-report-top').onclick = clearFunc;
                getEl('btn-wipe-result').onclick = clearFunc;
                if (getEl('btn-wipe-result-top')) getEl('btn-wipe-result-top').onclick = clearFunc;

                getEl('btn-wipe-history').onclick = () => { if (confirm("Apagar tudo?")) store.set({ geminiHistory: [] }, renderHistory); };

                // Chat
                const sendChat = async () => {
                    const inp = getEl('input-chat');
                    const txt = inp.value.trim();
                    if (!txt) return;

                    const c = getEl('chat-container');
                    c.innerHTML += `<div class="chat-bubble chat-user">${formatMarkdown(txt)}</div>`;
                    inp.value = ''; c.scrollTop = c.scrollHeight;

                    const tempId = "tmp-" + Date.now();
                    c.innerHTML += `<div id="${tempId}" class="chat-bubble chat-ai">...</div>`;
                    c.scrollTop = c.scrollHeight;

                    try {
                        const context = chatHistoryContext.slice(-6).map(m => `user: ${m.user}\\nmodel: ${m.ai}`).join("\\n");
                        const currentG = getBrazilGreeting();
                        const prompt = `Você é a Aja. Agora é ${currentG}. Responda de forma útil ao ${agentName}.\\nHistórico:\\n${context}\\nUsuário: ${txt}`;
                        const ans = await generateText(prompt);
                        document.getElementById(tempId).innerHTML = formatMarkdown(ans);
                        chatHistoryContext.push({ user: txt, ai: ans });
                    } catch (e) { document.getElementById(tempId).innerText = "Erro."; }
                };
                getEl('btn-send-chat').onclick = sendChat;
                getEl('input-chat').onkeypress = (e) => { if (e.key === 'Enter') sendChat(); };
                getEl('btn-clear-chat').onclick = () => {
                    const greeting = getBrazilGreeting();
                    getEl('chat-container').innerHTML = `<div id="chat-welcome-msg" class="chat-bubble chat-ai">${greeting} <b>${agentName}</b>!<br>Eu sou a <b>Aja</b>. Como posso ajudar?</div>`;
                    chatHistoryContext = [];
                };
                // --- ARRASTO LIVRE ---
                const handle = getEl('gemini-drag-handle');
                let isDragging = false;
                let dragOffsetX = 0;
                let dragOffsetY = 0;

                handle.onmousedown = (e) => {
                    if (e.target.closest('button')) return;
                    e.preventDefault();
                    isDragging = true;
                    handle.style.cursor = 'grabbing';
                    const rect = modal.getBoundingClientRect();
                    modal.style.transform = 'none';
                    modal.style.margin = '0';
                    modal.style.left = rect.left + 'px';
                    modal.style.top = rect.top + 'px';
                    dragOffsetX = e.clientX - rect.left;
                    dragOffsetY = e.clientY - rect.top;
                };

                document.onmousemove = (e) => {
                    if (!isDragging) return;
                    e.preventDefault();
                    const newLeft = e.clientX - dragOffsetX;
                    const newTop = e.clientY - dragOffsetY;
                    modal.style.left = newLeft + 'px';
                    modal.style.top = newTop + 'px';
                };

                document.onmouseup = () => {
                    if (isDragging) {
                        isDragging = false;
                        handle.style.cursor = 'move';
                    }
                };

                loadState();
            }
        })();

    } catch (e) { console.error('[BUILDER] Erro fatal no módulo ia.js:', e); throw e; }



return { open() { return document.getElementById('gemini-float-btn')?.click(); } };
});
