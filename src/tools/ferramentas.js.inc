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
                            panel.style.display = 'none'; 
                            if (window.spellCheckerModule) window.spellCheckerModule.ocultarTudo();
                        };

                        const USEFUL_LINKS = [
                            { title: "Consulta Base de Conhecimento", url: "https://example.com/kb", color: "#4B5563" },
                            { title: "Calculadora", url: "https://example.com/calc", color: "#3B82F6" }
                        ];

                        // Lógica Extrator F2 e Histórico
                        const refreshHistoryUI = () => {
                            const list = panel.querySelector('#historico-id-list');
                            list.innerHTML = '';
                            let history = [];
                            try { history = JSON.parse(ajaStorage.getItem('purecloudScript_idHistory') || '[]'); } catch (e) { }

                            if (history.length === 0) {
                                list.innerHTML = '<span style="color:var(--purecloud-script-text-secondary); font-size:0.85em;">Nenhum documento salvo ainda.</span>';
                                return;
                            }

                            history.forEach((item, index) => {
                                const btn = document.createElement('button');
                                btn.className = 'purecloud-script-button';
                                btn.style.cssText = `text-align: left; padding: 8px; font-size: 0.85em; background: var(--purecloud-script-bg-secondary); color: var(--purecloud-script-text-primary); border: 1px solid var(--purecloud-script-border-color); display: flex; justify-content: space-between;`;
                                btn.innerHTML = `<span><strong>${item.doc}</strong> (${item.tipo})</span> <span style="color:var(--purecloud-script-text-secondary);">${item.hora}</span>`;
                                btn.onclick = () => {
                                    navigator.clipboard.writeText(item.doc);
                                    btn.innerHTML = `<span><strong>Copiado!</strong> ✅</span> <span style="color:var(--purecloud-script-text-secondary);">${item.hora}</span>`;
                                    setTimeout(() => refreshHistoryUI(), 1000);
                                };
                                list.appendChild(btn);
                            });
                        };

                        panel.querySelector('#btn-clear-history').onclick = () => {
                            ajaStorage.removeItem('purecloudScript_idHistory');
                            refreshHistoryUI();
                        };

                        refreshHistoryUI();

                        const switchToolsTab = (tabId) => {
                            panel.querySelectorAll('.purecloud-script-tab-button').forEach(btn => btn.classList.remove('active'));
                            panel.querySelectorAll('.purecloud-script-tab-content').forEach(content => content.classList.remove('active'));
                            panel.querySelector(`.purecloud-script-tab-button[data-tab="${tabId}"]`)?.classList.add('active');
                            panel.querySelector(`[data-tab-content="${tabId}"]`)?.classList.add('active');
                        };

                        panel.querySelectorAll('.purecloud-script-tab-button').forEach(btn => {
                            btn.onclick = () => switchToolsTab(btn.dataset.tab);
                        });

                        // ==== LÓGICA DO EXTRATOR DE DOCUMENTOS (F2) ====
                        function validarCPF_Ext(cpf) {
                            cpf = cpf.replace(/[^\d]+/g, '');
                            if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
                            let soma = 0, resto;
                            for (let i = 1; i <= 9; i++) soma = soma + parseInt(cpf.substring(i - 1, i)) * (11 - i);
                            resto = (soma * 10) % 11; if (resto === 10 || resto === 11) resto = 0;
                            if (resto !== parseInt(cpf.substring(9, 10))) return false;
                            soma = 0;
                            for (let i = 1; i <= 10; i++) soma = soma + parseInt(cpf.substring(i - 1, i)) * (12 - i);
                            resto = (soma * 10) % 11; if (resto === 10 || resto === 11) resto = 0;
                            if (resto !== parseInt(cpf.substring(10, 11))) return false;
                            return true;
                        }

                        function validarCNPJ_Ext(cnpj) {
                            cnpj = cnpj.replace(/[^\d]+/g, '');
                            if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;
                            let tamanho = cnpj.length - 2, numeros = cnpj.substring(0, tamanho), digitos = cnpj.substring(tamanho), soma = 0, pos = tamanho - 7;
                            for (let i = tamanho; i >= 1; i--) { soma += numeros.charAt(tamanho - i) * pos--; if (pos < 2) pos = 9; }
                            let resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
                            if (resultado != digitos.charAt(0)) return false;
                            tamanho = tamanho + 1; numeros = cnpj.substring(0, tamanho); soma = 0; pos = tamanho - 7;
                            for (let i = tamanho; i >= 1; i--) { soma += numeros.charAt(tamanho - i) * pos--; if (pos < 2) pos = 9; }
                            resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
                            if (resultado != digitos.charAt(1)) return false;
                            return true;
                        }

                        function buscarMelhorDocumento() {
                            let textoTotal = document.body.innerText + " ";
                            document.querySelectorAll('iframe').forEach(ifr => {
                                try { textoTotal += " " + (ifr.contentDocument || ifr.contentWindow.document).body.innerText + " "; } catch (e) { }
                            });

                            const regexDoc = /(?<!\d)(\d{3}\.?\d{3}\.?\d{3}-?\d{2})(?!\d)|(?<!\d)(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})(?!\d)/g;
                            const encontrados = textoTotal.match(regexDoc);
                            if (!encontrados) return null;

                            let melhorCandidato = null, maiorPontuacao = -1000;
                            encontrados.forEach(rawDoc => {
                                const docLimpo = rawDoc.replace(/\D/g, '');
                                let ehValido = false;
                                if (docLimpo.length === 11 && validarCPF_Ext(docLimpo)) ehValido = true;
                                if (docLimpo.length === 14 && validarCNPJ_Ext(docLimpo)) ehValido = true;
                                if (!ehValido) return;

                                let pontos = 0;
                                const index = textoTotal.indexOf(rawDoc);
                                const contexto = textoTotal.substring(Math.max(0, index - 60), index + rawDoc.length + 60).toLowerCase();

                                if (contexto.includes('cpf') || contexto.includes('cnpj') || contexto.includes('documento')) pontos += 200;
                                if (contexto.includes('cliente') || contexto.includes('titular')) pontos += 50;
                                if (rawDoc.includes('.') || rawDoc.includes('-')) pontos += 50;
                                if (contexto.includes('tel') || contexto.includes('cel') || contexto.includes('zap')) pontos -= 1000;
                                if (contexto.includes('documento:')) pontos += 500;
                                pontos += 5;

                                if (pontos > maiorPontuacao) {
                                    maiorPontuacao = pontos;
                                    melhorCandidato = docLimpo;
                                }
                            });
                            return maiorPontuacao > -500 ? melhorCandidato : null;
                        }

                        // Substitui globalmente a funcao
                        window.executarExtracaoDocumento = function () {
                            const documento = buscarMelhorDocumento();
                            if (documento) {
                                const tipo = documento.length === 11 ? 'CPF' : 'CNPJ';
                                navigator.clipboard.writeText(documento).then(() => {
                                    notify(`📋 ${tipo} Copiado: ${documento}`, 'success');
                                    // Salva no histórico
                                    let history = [];
                                    try { history = JSON.parse(ajaStorage.getItem('purecloudScript_idHistory') || '[]'); } catch (e) { }
                                    // Adiciona no topo
                                    history.unshift({
                                        doc: documento,
                                        tipo: tipo,
                                        hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                                    });
                                    if (history.length > 30) history.pop(); // Limita 30
                                    ajaStorage.setItem('purecloudScript_idHistory', JSON.stringify(history));
                                    refreshHistoryUI();
                                });
                            } else {
                                notify("Nenhum CPF/CNPJ válido encontrado.", 'error');
                            }
                        };

                        // Atalho global F2 APENAS SE AINDA NÃO EXISTIR
                        if (!window._f2ExtractorAttached) {
                            window._f2ExtractorAttached = true;
                            document.addEventListener('keydown', (e) => {
                                if (e.key === 'F2') {
                                    e.preventDefault(); e.stopPropagation();
                                    window.executarExtracaoDocumento();
                                }
                            });
                        }
                        // ============================================

                        // Notepad
                        const notepad = panel.querySelector('#tools-notepad');
                        notepad.value = ajaStorage.getItem('purecloudScript_notepad') || '';
                        notepad.addEventListener('input', (e) => { ajaStorage.setItem('purecloudScript_notepad', e.target.value); });

                        panel.querySelector('#btn-notepad-clear').onclick = () => { notepad.value = ''; notepad.dispatchEvent(new Event('input')); };
                        panel.querySelector('#btn-notepad-copy').onclick = async () => {
                            try {
                                await navigator.clipboard.writeText(notepad.value);
                                const btn = panel.querySelector('#btn-notepad-copy');
                                btn.innerText = '✅ Copiado';
                                setTimeout(() => btn.innerText = '📋 Copiar', 2000);
                            } catch (e) { notify("Erro ao copiar", "error"); }
                        };

                        panel.querySelector('#btn-notepad-fetch').onclick = () => {
                            let rawText = document.body.innerText + " ";
                            document.querySelectorAll('iframe').forEach(ifr => {
                                try { rawText += " " + (ifr.contentDocument || ifr.contentWindow.document).body.innerText + " "; } catch (e) { }
                            });

                            let nome = "Cliente", cpf = "Não encontrado", prot = "Não encontrado", tel = "Não encontrado";

                            const cpfMatch = rawText.match(/(?:CPF|CNPJ)[\s:]*([\d\.\-\/]+)/i) || rawText.match(/\d{3}\.\d{3}\.\d{3}\-\d{2}/);
                            if (cpfMatch) cpf = (cpfMatch[1] || cpfMatch[0]).replace(/[^\d\.\-\/]/g, '');

                            const protMatch = rawText.match(/(?:Protocolo)[\s:]*(\d{10,})/i) || rawText.match(/202[456]\d{8,}/);
                            if (protMatch) prot = protMatch[1] || protMatch[0];

                            const telMatch = rawText.match(/(?:Telefone|Celular|Contato)[\s:]*(\(?\d{2}\)?\s?\d{4,5}-?\d{4})/i);
                            if (telMatch) tel = (telMatch[1] || telMatch[0]).trim();

                            const nameMatch = rawText.match(/(?:Nome|Cliente|Titular)[\s:]*([A-ZÀ-Ú][a-zà-ú]+(?:[ ]+[A-ZÀ-Úa-zà-ú]+)+)/i);
                            if (nameMatch) nome = nameMatch[1].trim();

                            const contentToAppend = `👤 Nome: ${nome}\n🆔 CPF/CNPJ: ${cpf}\n📱 Tel: ${tel}\n🎫 Prot: ${prot}\n\n`;
                            notepad.value = contentToAppend + notepad.value;
                            notepad.dispatchEvent(new Event('input'));

                            const btn = panel.querySelector('#btn-notepad-fetch');
                            btn.innerText = '✅ Feito';
                            setTimeout(() => btn.innerText = '📎 Puxar', 2000);
                        };

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
                                notify(`Alarme configurado! Avisarei em ${minutes} minuto(s).`, "success");

                                setTimeout(() => {
                                    // Play beep / alert
                                    if (window.audioNotificacao) { window.audioNotificacao.play().catch(e => { }); }
                                    alert(`⏰ HORA DE RETORNAR! Verifique o chat do cliente.`);
                                }, minutes * 60000);
                            };
                        });
                    } else {
                        panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
                    }
                }
            };
        })();

    } catch (e) { console.error('[BUILDER] Erro fatal no módulo ferramentas.js:', e); }

