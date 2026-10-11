    /* --- MÓDULO ANEXADO: MENU.JS --- */
    try {
        // ==UserScript==
        // @name         PureCloud - Menu Unificado (V8.3 - Overlay Safety)
        // @namespace    http://tampermonkey.net/
        // @version      8.3
        // @description  Menu FAB com proteção absoluta contra bloqueio de tela.
        // @match        https://*.mypurecloud.*/*
        // @match        https://*.genesys.cloud/*
        // @grant        GM_addStyle
        // ==/UserScript==

        (function () {
            'use strict';

            if (window.self !== window.top) return;

            // --- CSS DE SEGURANÇA ---
            const css = `
        /* 1. Oculta botões originais para não poluir */
        #qr-trigger-button, #pr-trigger-button, #bau-trigger-button, 
        #gemini-float-btn, #monitor-trigger-btn, #central-trigger-btn, #car-float-btn {
            display: none !important; opacity: 0 !important; pointer-events: none !important;
        }

        /* 2. Container do Menu: TRANSPARENTE AO CLIQUE */
        #uni-menu-container { 
            position: fixed; z-index: 2147483640; 
            display: flex; flex-direction: column-reverse; align-items: center; gap: 12px; 
            width: 60px; height: auto; bottom: 20px; right: 20px;
            pointer-events: none !important; /* O SEGREDRO: Cliques atravessam a área vazia */
        }

        /* 3. Botões do Menu: REATIVAM O CLIQUE */
        .uni-fab-main, .uni-fab-btn { 
            pointer-events: auto !important; 
            box-shadow: 0 4px 15px rgba(0,0,0,0.3); 
        }

        .uni-fab-main { 
            width: 60px; height: 60px; border-radius: 50%; 
            background: linear-gradient(135deg, #FF5F6D, #FFC371); 
            color: white; border: none; cursor: pointer; font-size: 28px; 
            display: flex; align-items: center; justify-content: center; 
            transition: transform 0.3s, background 0.3s; user-select: none;
        }
        .uni-fab-main:hover { transform: scale(1.05); }
        .uni-fab-main.active { transform: rotate(45deg); background: linear-gradient(135deg, #ff4b1f, #ff9068); }
        
        .uni-fab-actions { 
            display: flex; flex-direction: column-reverse; gap: 10px; margin-bottom: 5px; 
            opacity: 0; visibility: hidden; transform: translateY(20px) scale(0.8); 
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); 
            pointer-events: none !important; /* Garante que invisível não bloqueia */
        }
        
        #uni-menu-container.active .uni-fab-actions { 
            opacity: 1; visibility: visible; transform: translateY(0) scale(1); 
            pointer-events: auto !important; /* Ativa clique apenas quando visível */
        }
        
        .uni-fab-btn { 
            width: 48px; height: 48px; border-radius: 50%; border: none; color: white; cursor: pointer; 
            display: flex; align-items: center; justify-content: center; position: relative;
        }
        .uni-fab-btn:hover { transform: scale(1.15); z-index: 2; }
        
        /* Cores dos Botões */
        #uni-btn-id { background: linear-gradient(135deg, #667eea, #764ba2); }
        #uni-btn-bar { background: linear-gradient(135deg, #ff6b6b, #ee5253); }
        #uni-btn-pr { background: linear-gradient(135deg, #d4fc79, #96e6a1); color: #333; }
        #uni-btn-qr { background: linear-gradient(135deg, #00f260, #0575e6); }
        #uni-btn-ia { background: linear-gradient(135deg, #2563EB, #7C3AED); }
        #uni-btn-mon { background: linear-gradient(135deg, #F59E0B, #D97706); }
        #uni-btn-central { background: linear-gradient(135deg, #06B6D4, #3B82F6); }
        #uni-btn-copy { background: linear-gradient(135deg, #FF00CC, #333399); }
        #uni-btn-car { background: linear-gradient(135deg, #10b981, #059669); } 
        #uni-btn-calc { background: linear-gradient(135deg, #00c6ff, #0072ff); }
        #uni-btn-tools { background: linear-gradient(135deg, #ff9966, #ff5e62); } 
        

        .uni-fab-btn::after { 
            content: attr(data-label); position: absolute; right: 55px; 
            background: rgba(0,0,0,0.8); color: #fff; padding: 4px 8px; 
            border-radius: 4px; font-size: 11px; white-space: nowrap; 
            opacity: 0; visibility: hidden; transition: opacity 0.2s; pointer-events: none;
        }
        .uni-fab-btn:hover::after { opacity: 1; visibility: visible; }
        .uni-icon { width: 24px; height: 24px; fill: currentColor; }

        /* Calculadora usa Shadow DOM - sem CSS externo necessário */
    `;

            const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

            // --- LIMPEZA DE LIXO E CONFLITOS ---
            if (document.getElementById('uni-menu-container')) document.getElementById('uni-menu-container').remove();

            // Remove calculadora anterior se existir
            const oldCalc = document.getElementById('calc-modal');
            if (oldCalc) oldCalc.remove();

            const div = document.createElement('div'); div.id = 'uni-menu-container';
            div.innerHTML = `
        <div class="uni-fab-actions">
            
            <button class="uni-fab-btn" id="uni-btn-calc" data-label="Calculadora"><span style="font-size:24px;">🧮</span></button>
            <button class="uni-fab-btn" id="uni-btn-ia" data-label="Assistente IA"><span style="font-size:24px;">🧑‍💻</span></button>
            <button class="uni-fab-btn" id="uni-btn-central" data-label="Central de Ajuda"><span style="font-size:26px;">💠</span></button>
            <button class="uni-fab-btn" id="uni-btn-mon" data-label="Monitor Filas"><svg class="uni-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg></button>
            <button class="uni-fab-btn" id="uni-btn-copy" data-label="Copiar Chat"><svg class="uni-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg></button>
            <button class="uni-fab-btn" id="uni-btn-car" data-label="Automação (CAR)"><span style="font-size:18px;">⌨️</span></button>
            <button class="uni-fab-btn" id="uni-btn-id" data-label="Copiar ID"><span style="font-size:20px;font-weight:800;">🆔</span></button>
            <button class="uni-fab-btn" id="uni-btn-bar" data-label="Ferramentas (Bar)"><svg class="uni-icon" viewBox="0 0 24 24"><path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"/></svg></button>
            <button class="uni-fab-btn" id="uni-btn-tools" data-label="Ferramentas"><svg class="uni-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg></button>
            <button class="uni-fab-btn" id="uni-btn-pr" data-label="Protocolos"><svg class="uni-icon" viewBox="0 0 24 24"><path d="M14 17H4v2h10v-2zm6-8H4v2h16V9zM4 15h16v-2H4v2zM4 5v2h16V5H4z"/></svg></button>
            <button class="uni-fab-btn" id="uni-btn-qr" data-label="Respostas"><svg class="uni-icon" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6zm8 5H6v-2h8zm4-6H6V6h12z"/></svg></button>
        </div>
        <button class="uni-fab-main" id="uni-fab-trigger" title="Menu Genesys">
            <svg class="uni-icon" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
        </button>
    `;
            document.body.appendChild(div);

            const container = document.getElementById('uni-menu-container');
            const trigger = document.getElementById('uni-fab-trigger');
            let isDragging = false, startX, startY, initialLeft, initialTop;

            trigger.addEventListener('mousedown', function (e) {
                if (e.button !== 0) return;
                e.preventDefault(); isDragging = false; startX = e.clientX; startY = e.clientY;
                const rect = container.getBoundingClientRect(); initialLeft = rect.left; initialTop = rect.top;
                document.addEventListener('mousemove', onMouseMove); document.addEventListener('mouseup', onMouseUp);
            });

            function onMouseMove(e) {
                const dx = e.clientX - startX; const dy = e.clientY - startY;
                if (!isDragging && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) { isDragging = true; container.style.transition = 'none'; }
                if (isDragging) {
                    let newLeft = Math.max(0, Math.min(initialLeft + dx, window.innerWidth - container.offsetWidth));
                    let newTop = Math.max(0, Math.min(initialTop + dy, window.innerHeight - container.offsetHeight));
                    container.style.left = newLeft + 'px'; container.style.top = newTop + 'px';
                    container.style.bottom = 'auto'; container.style.right = 'auto';
                }
            }

            function onMouseUp(e) {
                document.removeEventListener('mousemove', onMouseMove); document.removeEventListener('mouseup', onMouseUp);
                if (isDragging) {
                    container.style.transition = 'all 0.3s';
                    ajaStorage.setItem('uniMenuPos', JSON.stringify({ left: container.style.left, top: container.style.top }));
                    setTimeout(() => { isDragging = false; }, 50);
                }
            }

            trigger.addEventListener('click', function (e) {
                if (isDragging) { e.stopImmediatePropagation(); e.preventDefault(); return; }
                container.classList.toggle('active'); trigger.classList.toggle('active');
            });

            try { const savedPos = ajaStorage.getItem('uniMenuPos'); if (savedPos) { const p = JSON.parse(savedPos); container.style.left = p.left; container.style.top = p.top; container.style.bottom = 'auto'; container.style.right = 'auto'; } } catch (e) { }

            // TRIGGERS
            function triggerModule(id) { const btn = document.getElementById(id); if (btn) btn.click(); else console.warn("Módulo não carregado: " + id); }

            document.getElementById('uni-btn-qr').onclick = () => triggerModule('qr-trigger-button');
            document.getElementById('uni-btn-pr').onclick = () => triggerModule('pr-trigger-button');
            document.getElementById('uni-btn-bar').onclick = () => triggerModule('bau-trigger-button');
            document.getElementById('uni-btn-ia').onclick = () => triggerModule('gemini-float-btn');
            document.getElementById('uni-btn-mon').onclick = () => triggerModule('monitor-trigger-btn');
            document.getElementById('uni-btn-central').onclick = () => triggerModule('central-trigger-btn');
            document.getElementById('uni-btn-tools').onclick = () => {
                if (typeof window.UI_tools !== 'undefined') window.UI_tools.createAgentToolsPanel();

            };

            document.getElementById('uni-btn-car').onclick = () => { if (typeof window.toggleCAR === 'function') window.toggleCAR(); };
            document.getElementById('uni-btn-id').onclick = () => { if (typeof window.executarExtracaoDocumento === 'function') window.executarExtracaoDocumento(); };
            document.getElementById('uni-btn-copy').onclick = () => {
                if (typeof window.executarCopiaEspelho === 'function') {
                    const btn = document.getElementById('uni-btn-copy'); btn.style.transform = 'scale(0.9)';
                    setTimeout(() => btn.style.transform = 'scale(1)', 150); window.executarCopiaEspelho();
                }
            };

            // --- SISTEMA MULTI-CALC PRO (Shadow DOM) ---
            (function initCalc() {
                const oldHost = document.getElementById('calc-ultimate-host');
                if (oldHost) oldHost.remove();

                const host = document.createElement('div');
                host.id = 'calc-ultimate-host';
                host.style.cssText = 'position:fixed; top:0; left:0; width:0; height:0; z-index:2147483647;';
                document.body.appendChild(host);

                const shadow = host.attachShadow({mode: 'open'});

                const style = document.createElement('style');
                style.textContent = `
                    :host { all: initial; }
                    #modal {
                        position: fixed; bottom: 90px; right: 20px; width: 360px;
                        background: #1a1a20; border-radius: 16px; border: 1px solid #333;
                        display: none; flex-direction: column; color: white;
                        box-shadow: 0 10px 50px rgba(0,0,0,0.8); overflow: hidden;
                        font-family: 'Segoe UI', Roboto, sans-serif;
                    }
                    #modal.calc-visible { display: flex !important; }
                    .header { 
                        display: flex; align-items: center; background: #24242e; 
                        padding: 8px 12px; cursor: move; border-bottom: 1px solid #333;
                    }
                    .header-title { flex: 1; font-size: 11px; color: #888; font-weight: bold; pointer-events: none; }
                    #close-btn { background: none; border: none; color: #ff4757; font-size: 22px; cursor: pointer; line-height: 1; }

                    .tabs { 
                        display: flex; flex-wrap: wrap; background: #24242e; 
                        border-bottom: 1px solid #333;
                    }
                    .tab { 
                        flex: 1 1 23%; padding: 8px 2px; text-align: center; font-size: 9px; 
                        cursor: pointer; color: #666; border-bottom: 2px solid transparent; 
                        font-weight: bold; text-transform: uppercase;
                    }
                    .tab:hover { background: rgba(255,255,255,0.05); color: #aaa; }
                    .tab.active { color: #00c6ff; border-bottom: 2px solid #00c6ff; }
                    
                    .body { padding: 15px; display: none; max-height: 420px; overflow-y: auto; }
                    .body.active { display: block; }
                    
                    #display-container { padding: 10px 15px; background: #1a1a20; }
                    #calc-display {
                        width: 100%; height: 55px; background: #24242e; border: 1px solid #444;
                        border-radius: 8px; color: #fff; font-size: 24px; text-align: right; 
                        padding: 10px; box-sizing: border-box; outline: none;
                    }
                    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 10px; }
                    .btn { 
                        background: #2f2f3c; border: none; color: white; padding: 12px 0; 
                        border-radius: 8px; cursor: pointer; font-size: 16px; transition: 0.2s;
                    }
                    .btn:hover { background: #3f3f4e; }
                    .btn.action { background: #0072ff; }
                    .btn.clear { background: #ff4757; }
                    
                    .input-group { margin-bottom: 10px; }
                    .input-group label { display: block; font-size: 11px; color: #aaa; margin-bottom: 4px; }
                    .input-group input, .input-group select { 
                        width: 100%; padding: 8px; background: #24242e; border: 1px solid #444; 
                        color: white; border-radius: 6px; box-sizing: border-box; outline: none;
                    }
                    .res-box { 
                        margin-top: 10px; padding: 12px; background: #24242e; border-radius: 8px; 
                        color: #00c6ff; text-align: center; font-weight: bold; border: 1px dashed #444;
                    }
                    .hist-item { 
                        padding: 8px; border-bottom: 1px solid #333; cursor: pointer; font-size: 13px; 
                    }
                    .hist-item:hover { background: rgba(0,198,255,0.1); }
                    
                    ::-webkit-scrollbar { width: 4px; }
                    ::-webkit-scrollbar-thumb { background: #444; border-radius: 10px; }
                `;
                shadow.appendChild(style);

                const main = document.createElement('div');
                main.innerHTML = `
                    <div id="modal">
                        <div class="header" id="drag-handle">
                            <span class="header-title">SISTEMA MULTI-CALC PRO</span>
                            <button id="close-btn" title="Fechar">&times;</button>
                        </div>
                        <div class="tabs">
                            <div class="tab active" data-t="t-base">BÁSICA</div>
                            <div class="tab" data-t="t-sci">CIENT.</div>
                            <div class="tab" data-t="t-fuel">VIAGEM</div>
                            <div class="tab" data-t="t-imc">IMC</div>
                            <div class="tab" data-t="t-med">MEDIDAS</div>
                            <div class="tab" data-t="t-r3">REGRA 3</div>
                            <div class="tab" data-t="t-curr">MOEDA</div>
                            <div class="tab" data-t="t-hist">HIST.</div>
                        </div>
                        <div id="display-container">
                            <input type="text" id="calc-display" readonly value="0">
                        </div>

                        <div class="body active" id="t-base">
                            <div class="grid">
                                <button class="btn clear" data-v="C">C</button>
                                <button class="btn" data-v="(">(</button>
                                <button class="btn" data-v=")">)</button>
                                <button class="btn action" data-v="/">÷</button>
                                <button class="btn" data-v="7">7</button><button class="btn" data-v="8">8</button><button class="btn" data-v="9">9</button>
                                <button class="btn action" data-v="*">×</button>
                                <button class="btn" data-v="4">4</button><button class="btn" data-v="5">5</button><button class="btn" data-v="6">6</button>
                                <button class="btn action" data-v="-">-</button>
                                <button class="btn" data-v="1">1</button><button class="btn" data-v="2">2</button><button class="btn" data-v="3">3</button>
                                <button class="btn action" data-v="+">+</button>
                                <button class="btn" data-v="0">0</button><button class="btn" data-v=".">.</button>
                                <button class="btn clear" data-v="del">⌫</button>
                                <button class="btn action" data-v="=">=</button>
                            </div>
                        </div>

                        <div class="body" id="t-sci">
                            <div class="grid">
                                <button class="btn" data-v="Math.sin(">sin</button>
                                <button class="btn" data-v="Math.cos(">cos</button>
                                <button class="btn" data-v="Math.tan(">tan</button>
                                <button class="btn action" data-v="**">x^y</button>
                                <button class="btn" data-v="Math.sqrt(">√</button>
                                <button class="btn" data-v="Math.PI">π</button>
                                <button class="btn" data-v="Math.log10(">log</button>
                                <button class="btn action" data-v="%">%</button>
                            </div>
                        </div>

                        <div class="body" id="t-fuel">
                            <div class="input-group"><label>Distância (km)</label><input type="number" id="f-d"></div>
                            <div class="input-group"><label>Consumo (km/l)</label><input type="number" id="f-c"></div>
                            <div class="input-group"><label>Preço</label><input type="number" id="f-p"></div>
                            <button id="btn-fuel" class="btn action" style="width:100%">Calcular</button>
                            <div id="res-fuel" class="res-box" style="display:none"></div>
                        </div>

                        <div class="body" id="t-imc">
                            <div class="input-group"><label>Peso (kg)</label><input type="number" id="imc-p"></div>
                            <div class="input-group"><label>Altura (m)</label><input type="number" id="imc-a" placeholder="Ex: 1.75"></div>
                            <button id="btn-imc" class="btn action" style="width:100%">Calcular IMC</button>
                            <div id="res-imc" class="res-box" style="display:none"></div>
                        </div>

                        <div class="body" id="t-med">
                            <div class="input-group">
                                <label>Conversão</label>
                                <select id="med-type">
                                    <option value="km_mi">Km -> Milhas</option>
                                    <option value="mi_km">Milhas -> Km</option>
                                    <option value="c_f">Celsius -> Fahr.</option>
                                    <option value="kg_lb">Kg -> Libras</option>
                                </select>
                            </div>
                            <div class="input-group"><label>Valor</label><input type="number" id="med-v"></div>
                            <button id="btn-med" class="btn action" style="width:100%">Converter</button>
                            <div id="res-med" class="res-box" style="display:none"></div>
                        </div>

                        <div class="body" id="t-r3">
                            <p style="font-size:10px; color:#888; margin-top:0;">Se A está para B, C está para X</p>
                            <div style="display:flex; gap:5px">
                                <input type="number" id="r3-a" placeholder="A" style="flex:1; padding:8px; background:#24242e; color:white; border:1px solid #444; border-radius:6px">
                                <span style="line-height:35px">➔</span>
                                <input type="number" id="r3-b" placeholder="B" style="flex:1; padding:8px; background:#24242e; color:white; border:1px solid #444; border-radius:6px">
                            </div>
                            <div style="display:flex; gap:5px; margin-top:10px">
                                <input type="number" id="r3-c" placeholder="C" style="flex:1; padding:8px; background:#24242e; color:white; border:1px solid #444; border-radius:6px">
                                <span style="line-height:35px">➔</span>
                                <input type="text" value="X" disabled style="flex:1; padding:8px; background:#1a1a20; color:#00c6ff; border:1px solid #444; border-radius:6px; text-align:center; font-weight:bold">
                            </div>
                            <button id="btn-r3" class="btn action" style="width:100%; margin-top:10px">Calcular X</button>
                            <div id="res-r3" class="res-box" style="display:none"></div>
                        </div>

                        <div class="body" id="t-curr">
                            <div style="display:flex; gap:5px">
                                <select id="cur-f" style="flex:1"><option value="USD">USD</option><option value="EUR">EUR</option><option value="BRL">BRL</option><option value="GBP">GBP</option></select>
                                <select id="cur-t" style="flex:1"><option value="BRL" selected>BRL</option><option value="USD">USD</option><option value="EUR">EUR</option></select>
                            </div>
                            <div class="input-group" style="margin-top:10px"><label>Valor (Real-time)</label><input type="number" id="cur-v" placeholder="0.00"></div>
                            <div id="res-curr" class="res-box">Digite para converter...</div>
                        </div>

                        <div class="body" id="t-hist">
                            <button id="btn-clear-h" class="btn clear" style="width:100%; font-size:12px; margin-bottom:10px">Limpar Tudo</button>
                            <div id="hist-list"></div>
                        </div>
                    </div>
                `;
                shadow.appendChild(main);

                const modal = shadow.getElementById('modal');
                const display = shadow.getElementById('calc-display');
                const tabs = shadow.querySelectorAll('.tab');
                const bodies = shadow.querySelectorAll('.body');
                let expr = "";

                // Bloqueio de propagação (Impede o site de reagir aos cliques)
                main.addEventListener('mousedown', (e) => e.stopPropagation());
                main.addEventListener('click', (e) => e.stopPropagation());

                // Abrir/Fechar via script interno
                shadow.getElementById('close-btn').onclick = () => modal.classList.remove('calc-visible');

                // Navegação entre Abas
                tabs.forEach(t => {
                    t.onclick = (e) => {
                        tabs.forEach(x => x.classList.remove('active'));
                        bodies.forEach(x => x.classList.remove('active'));
                        t.classList.add('active');
                        shadow.getElementById(t.dataset.t).classList.add('active');
                        const showDisp = (t.dataset.t === 't-base' || t.dataset.t === 't-sci');
                        shadow.getElementById('display-container').style.display = showDisp ? 'block' : 'none';
                    };
                });

                // Matemática Básica e Científica
                shadow.querySelectorAll('.btn[data-v]').forEach(b => {
                    b.onclick = () => {
                        const v = b.dataset.v;
                        if(v === 'C') { expr = ""; display.value = "0"; }
                        else if(v === 'del') { expr = expr.slice(0,-1); display.value = expr || "0"; }
                        else if(v === '=') {
                            try {
                                const r = eval(expr);
                                const rF = Number.isInteger(r) ? r : parseFloat(r.toFixed(4));
                                saveH(expr, rF);
                                expr = rF.toString(); display.value = rF;
                            } catch(e) { display.value = "Erro"; expr = ""; }
                        } else { expr += v; display.value = expr; }
                    };
                });

                // Viagem
                shadow.getElementById('btn-fuel').onclick = () => {
                    const d = parseFloat(shadow.getElementById('f-d').value), c = parseFloat(shadow.getElementById('f-c').value), p = parseFloat(shadow.getElementById('f-p').value);
                    if(!d || !c || !p) return;
                    const res = shadow.getElementById('res-fuel');
                    res.style.display = 'block'; res.innerHTML = `Total: R$ ${((d/c)*p).toFixed(2)}<br>Litros: ${(d/c).toFixed(1)}L`;
                };

                // IMC
                shadow.getElementById('btn-imc').onclick = () => {
                    const p = parseFloat(shadow.getElementById('imc-p').value), a = parseFloat(shadow.getElementById('imc-a').value);
                    if(!p || !a) return;
                    const imc = p / (a * a);
                    let s = imc < 18.5 ? "Abaixo" : imc < 25 ? "Normal" : imc < 30 ? "Sobrepeso" : "Obesidade";
                    const res = shadow.getElementById('res-imc');
                    res.style.display = 'block'; res.innerHTML = `IMC: ${imc.toFixed(1)}<br>${s}`;
                };

                // Medidas
                shadow.getElementById('btn-med').onclick = () => {
                    const t = shadow.getElementById('med-type').value, v = parseFloat(shadow.getElementById('med-v').value);
                    if(isNaN(v)) return;
                    let r = 0, unit = "";
                    if(t === 'km_mi') { r = v * 0.621; unit = "Mi"; }
                    else if(t === 'mi_km') { r = v / 0.621; unit = "Km"; }
                    else if(t === 'c_f') { r = (v * 9/5) + 32; unit = "°F"; }
                    else if(t === 'kg_lb') { r = v * 2.204; unit = "Lb"; }
                    const res = shadow.getElementById('res-med');
                    res.style.display = 'block'; res.innerHTML = `Res: ${r.toFixed(2)} ${unit}`;
                };

                // Regra de 3
                shadow.getElementById('btn-r3').onclick = () => {
                    const a = parseFloat(shadow.getElementById('r3-a').value), b = parseFloat(shadow.getElementById('r3-b').value), c = parseFloat(shadow.getElementById('r3-c').value);
                    if(isNaN(a) || isNaN(b) || isNaN(c)) return;
                    const x = (b * c) / a;
                    const res = shadow.getElementById('res-r3');
                    res.style.display = 'block'; res.innerHTML = `X = ${x.toFixed(2)}`;
                };

                // Moeda Live
                const curV = shadow.getElementById('cur-v');
                const updateCur = async () => {
                    const f = shadow.getElementById('cur-f').value, t = shadow.getElementById('cur-t').value, v = parseFloat(curV.value);
                    if(isNaN(v)) return;
                    try {
                        const r = await safeFetch('https://open.er-api.com/v6/latest/'+f);
                        const d = await r.json();
                        shadow.getElementById('res-curr').innerHTML = `<strong>${(v * d.rates[t]).toFixed(2)} ${t}</strong>`;
                    } catch(e) {}
                };
                curV.oninput = updateCur;

                // Histórico
                let hData = JSON.parse(ajaStorage.getItem('smart-ultimate-h')) || [];
                const saveH = (e, r) => {
                    hData.unshift({e, r}); hData = hData.slice(0,10);
                    ajaStorage.setItem('smart-ultimate-h', JSON.stringify(hData));
                    renderH();
                };
                const renderH = () => {
                    shadow.getElementById('hist-list').innerHTML = hData.map(x => `<div class="hist-item">${x.e} = <strong>${x.r}</strong></div>`).join('');
                };
                shadow.getElementById('btn-clear-h').onclick = () => { hData = []; ajaStorage.removeItem('smart-ultimate-h'); renderH(); };
                renderH();

                // Arrastar
                let isMoving = false, ox, oy;
                shadow.getElementById('drag-handle').onmousedown = (e) => {
                    isMoving = true; ox = e.clientX - modal.offsetLeft; oy = e.clientY - modal.offsetTop;
                };
                window.addEventListener('mousemove', (e) => {
                    if(!isMoving) return;
                    modal.style.left = (e.clientX - ox) + 'px';
                    modal.style.top = (e.clientY - oy) + 'px';
                    modal.style.right = 'auto'; modal.style.bottom = 'auto';
                });
                window.addEventListener('mouseup', () => isMoving = false);

                // Teclado
                window.addEventListener('keydown', (e) => {
                    if(!modal.classList.contains('calc-visible')) return;
                    if(/[0-9\.\+\-\*\/\(\)]/.test(e.key)) { expr += e.key; display.value = expr; }
                    else if(e.key === 'Enter') shadow.querySelector('.btn[data-v="="]').click();
                    else if(e.key === 'Backspace') { expr = expr.slice(0,-1); display.value = expr || "0"; }
                });

                // Integração com o botão do menu genesys original
                const calcBtn = document.getElementById('uni-btn-calc');
                if(calcBtn) {
                    calcBtn.onclick = (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        modal.classList.toggle('calc-visible');
                        // Fechar o menu FAB original para não ficar por cima
                        const cont = document.getElementById('uni-menu-container');
                        if (cont) { cont.classList.remove('active'); }
                        const trig = document.getElementById('uni-fab-trigger');
                        if (trig) { trig.classList.remove('active'); }
                    };
                }
            })();

        })();

    } catch (e) { console.error('[BUILDER] Erro fatal no módulo menu.js:', e); }

