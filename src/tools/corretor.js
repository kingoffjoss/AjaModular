// Shared dependencies: ajaStorage, buildSpellOverlayHTML, safeFetch
window.AjaModular.register("corretor", ["compatibility"], function(ctx) {
    /* --- MÓDULO ANEXADO: CORRETOR.JS --- */
    try {
        // ==UserScript==
        // @name         Corretor Pro (Módulo)
        // @description  Módulo de Correção Ortográfica contínuo
        // ==/UserScript==

        (function () {
            'use strict';

            // Utilitário global se não existir
            window.log = window.log || console.log;

            // --- ESTILOS DO CORRETOR PRO ---
            const SPELL_PRO_CSS = `
        #spell-overlay-layer { position: absolute; pointer-events: none; color: transparent !important; background: transparent !important; z-index: 2147483640; overflow: hidden; white-space: pre-wrap; word-wrap: break-word; }
        #spell-overlay-layer mark { background: transparent !important; color: transparent !important; }
        .spell-wavy-error { text-decoration: underline wavy #ff4757; text-decoration-skip-ink: none; text-underline-offset: 3px; }
        .spell-wavy-punct { border-bottom: 2px dashed #2ed573; display: inline-block; min-width: 4px; }
        #spell-badge { position: absolute; width: 32px; height: 32px; border-radius: 50%; color: white; display: none; align-items: center; justify-content: center; font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 800; z-index: 2147483645; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.3); background: #3b82f6; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); border: 2px solid rgba(255,255,255,0.2); overflow: visible; }
        #spell-badge.loading { background: #ffa502; animation: spellPulse 1s infinite; }
        #spell-badge.clean { background: #2ed573; }
        #spell-badge:hover { transform: scale(1.1); }
        .badge-dict-btn { position: absolute; bottom: -5px; right: -5px; width: 16px; height: 16px; background: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; border: 1px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2); z-index: 10; }
        @keyframes spellPulse { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.7; transform: scale(0.9); } 100% { opacity: 1; transform: scale(1); } }
        
        #spell-inline-popup { position: absolute; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.15); width: 260px; display: none; flex-direction: column; z-index: 2147483648; font-family: 'Inter', sans-serif; overflow: hidden; backdrop-filter: blur(10px); }
        .popup-header { background: #f8fafc; padding: 12px 15px; font-size: 10px; color: #64748b; font-weight: 700; border-bottom: 1px solid #f1f5f9; text-transform: uppercase; letter-spacing: 1px; }
        .popup-body { padding: 15px; }
        .popup-sug-btn { width: 100%; text-align: left; padding: 10px 14px; background: #eff6ff; color: #2563eb; border: 1px solid #dbeafe; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; transition: all 0.2s; display: flex; align-items: center; gap: 10px; }
        .popup-sug-btn:hover { background: #dbeafe; transform: translateY(-1px); }
        .popup-footer { display: flex; flex-wrap: wrap; gap: 6px; padding: 10px 15px; background: #f8fafc; border-top: 1px solid #f1f5f9; }
        .popup-action-btn { flex: 1; padding: 8px; font-size: 11px; border: 1px solid #e2e8f0; background: white; border-radius: 6px; cursor: pointer; color: #475569; font-weight: 500; transition: all 0.2s; }
        .popup-action-btn:hover { background: #f1f5f9; color: #0f172a; border-color: #cbd5e1; }
        #btn-add-dict { color: #10b981; border-color: #d1fae5; }
        #btn-add-dict:hover { background: #ecfdf5; }
        #btn-rewrite { font-weight: 600; color: #8b5cf6; border-color: #ddd6fe; background: #f5f3ff; }
        #btn-rewrite:hover { background: #ede9fe; }
        .ai-loading { background: linear-gradient(90deg, #f5f3ff, #ddd6fe, #f5f3ff); background-size: 200% 100%; animation: spellAILoading 1.5s infinite linear; pointer-events: none; }
        @keyframes spellAILoading { 0% { background-position: 100% 0; } 100% { background-position: -100% 0; } }

        #spell-main-panel { position: fixed; top: 100px; right: 20px; width: 340px; background: #ffffff; border-radius: 16px; box-shadow: 0 20px 50px rgba(0,0,0,0.2); z-index: 2147483647; display: none; flex-direction: column; font-family: 'Inter', sans-serif; overflow: hidden; border: 1px solid #e2e8f0; }
        #spell-main-panel .panel-header-top { padding: 15px; background: #10b981; color: white; border-bottom: 1px solid #0d9488; display: flex; justify-content: space-between; align-items: center; cursor: move; }
        #spell-main-panel .panel-title { font-weight: 700; font-size: 16px; display: flex; align-items: center; gap: 10px; }
        .panel-tabs { display: flex; background: #fff; border-bottom: 1px solid #e2e8f0; padding: 0 10px; }
        .tab-btn-p { padding: 12px 15px; font-size: 13px; font-weight: 600; color: #64748b; border-bottom: 3px solid transparent; transition: all 0.2s; flex: 1; text-align: center; }
        .tab-btn-p.active { color: #10b981; border-bottom-color: #10b981; }
        .btn-fix-all { background: white !important; color: #10b981 !important; border-radius: 8px; padding: 6px 12px; font-weight: 700; font-size: 12px; border: none; cursor: pointer; }
    `;

            // Injeta CSS
            const blockStyle = document.createElement('style');
            blockStyle.textContent = SPELL_PRO_CSS;
            document.head.appendChild(blockStyle);

            // Utilitário para não inundar eventos
            function throttle(func, limit) {
                let inThrottle;
                return function () {
                    const args = arguments;
                    const context = this;
                    if (!inThrottle) {
                        func.apply(context, args);
                        inThrottle = true;
                        setTimeout(() => inThrottle = false, limit);
                    }
                }
            }

            // --- MÓDULO CORRETOR PRO ---
            const spellCheckerModule = {
                ultimoCampo: null, errosEncontrados: [], tempoDigitacao: null,
                camadaIlusao: null, badge: null, popup: null, panel: null,
                dicionarioPessoal: window.AjaModularSpell.readDictionary(),
                adicionarAoDicionario(palavra) {
                    const p = palavra.toLowerCase().trim();
                    if (p && !this.dicionarioPessoal.includes(p)) {
                        this.dicionarioPessoal.push(p);
                        ctx.ajaStorage.setItem('pcs_spell_dict', JSON.stringify(this.dicionarioPessoal));
                        this.verificarTextoNaAPI();
                    }
                },
                isVisible(el) {
                    if (!el) return false;
                    try {
                        const rect = el.getBoundingClientRect();
                        if (rect.width === 0 || rect.height === 0) return false;
                        let curr = el;
                        while (curr && curr !== document.body) {
                            const style = window.getComputedStyle(curr);
                            if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
                            curr = curr.parentElement;
                        }
                        return true;
                    } catch (e) { return false; }
                },
                prepararArraste(el) {
                    const header = el.querySelector('.panel-header-top');
                    let isDragging = false, offset = { x: 0, y: 0 };
                    header.addEventListener('mousedown', (e) => {
                        isDragging = true;
                        offset.x = e.clientX - el.offsetLeft;
                        offset.y = e.clientY - el.offsetTop;
                        header.style.cursor = 'grabbing';
                    });
                    document.addEventListener('mousemove', (e) => {
                        if (!isDragging) return;
                        el.style.left = (e.clientX - offset.x) + 'px';
                        el.style.top = (e.clientY - offset.y) + 'px';
                        el.style.right = 'auto';
                    });
                    document.addEventListener('mouseup', () => {
                        isDragging = false;
                        header.style.cursor = 'move';
                    });
                },
                init() {
                    if (document.getElementById('spell-badge')) return;
                    this.camadaIlusao = document.createElement('div'); this.camadaIlusao.id = 'spell-overlay-layer'; document.body.appendChild(this.camadaIlusao);
                    this.badge = document.createElement('div'); this.badge.id = 'spell-badge'; document.body.appendChild(this.badge);
                    this.popup = document.createElement('div'); this.popup.id = 'spell-inline-popup'; document.body.appendChild(this.popup);
                    this.panel = document.createElement('div'); this.panel.id = 'spell-main-panel'; document.body.appendChild(this.panel);

                    this.badge.addEventListener('click', (e) => {
                        if (e.target.closest('.badge-dict-btn')) {
                            this.panel.style.display = 'flex';
                            this.renderizarPainel();
                            this.panel.querySelector('#tab-dict').click();
                            return;
                        }
                        if (this.errosEncontrados.length > 0) {
                            this.panel.style.display = this.panel.style.display === 'flex' ? 'none' : 'flex';
                            this.renderizarPainel();
                        }
                    });
                    document.addEventListener('mousedown', (e) => { 
                        if (this.popup.style.display === 'flex' && !this.popup.contains(e.target) && this.ultimoCampo !== e.target) {
                            this.popup.style.display = 'none'; 
                        }
                    });

                    this.rastrearCampos();
                    window.spellCheckerModule = this; // Expoe para limpeza global
                    // Arraste pertence somente a ui/corretor-interaction.

                    // Loop de Segurança (Mão de Ferro) - Verifica a cada 300ms se o campo sumiu
                    setInterval(() => {
                        if (this.ultimoCampo && !this.isVisible(this.ultimoCampo)) {
                            this.ocultarTudo();
                        }
                    }, 300);
                },
                rastrearCampos() {
                    document.addEventListener('focusin', (e) => {
                        const el = e.target;
                        if (el.closest('#spell-main-panel, #ajamodular-settings, #aja-spell-compact')) return;
                        if (el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && el.type === 'text') || el.isContentEditable) {
                            this.ultimoCampo = el; this.sincronizarIlusao(); this.posicionarBadge(); this.configurarEventosDoCampo(); this.verificarTextoNaAPI();
                        }
                    });
                    window.addEventListener('resize', () => { if(this.ultimoCampo) { this.sincronizarIlusao(); this.posicionarBadge(); } });
                    window.addEventListener('scroll', () => { if(this.ultimoCampo) { this.sincronizarIlusao(); this.posicionarBadge(); } }, true);

                    const observer = new MutationObserver(throttle(() => { 
                        if (this.ultimoCampo && this.isVisible(this.ultimoCampo)) { 
                            this.sincronizarIlusao(); this.posicionarBadge(); 
                        } else if (this.ultimoCampo) { 
                            this.ocultarTudo(); 
                        } 
                    }, 400));
                    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class', 'hidden'] });
                },
                ocultarTudo() { 
                    if (this.badge) this.badge.style.display = 'none'; 
                    if (this.popup) this.popup.style.display = 'none'; 
                    if (this.panel) this.panel.style.display = 'none';
                    if (this.camadaIlusao) this.camadaIlusao.innerHTML = ''; 
                    this.ultimoCampo = null; 
                },
                sincronizarIlusao() {
                    if (!this.ultimoCampo) return;
                    const rect = this.ultimoCampo.getBoundingClientRect();
                    if (rect.width === 0 || rect.height === 0) return;
                    const estilos = window.getComputedStyle(this.ultimoCampo);
                    this.camadaIlusao.style.top = (rect.top + window.scrollY) + 'px';
                    this.camadaIlusao.style.left = (rect.left + window.scrollX) + 'px';
                    this.camadaIlusao.style.width = rect.width + 'px'; this.camadaIlusao.style.height = rect.height + 'px';
                    this.camadaIlusao.style.font = estilos.font; this.camadaIlusao.style.padding = estilos.padding;
                    this.camadaIlusao.style.lineHeight = estilos.lineHeight; this.camadaIlusao.style.letterSpacing = estilos.letterSpacing;
                    this.camadaIlusao.style.border = estilos.border; this.camadaIlusao.style.borderColor = 'transparent';
                    this.camadaIlusao.scrollTop = this.ultimoCampo.scrollTop; this.camadaIlusao.scrollLeft = this.ultimoCampo.scrollLeft;
                },
                posicionarBadge() {
                    if (!this.ultimoCampo || this.errosEncontrados.length === 0) {
                        if (this.badge) this.badge.style.display = 'none';
                        return;
                    }
                    const rect = this.ultimoCampo.getBoundingClientRect();
                    if (rect.width === 0 || rect.bottom < 0 || rect.top > window.innerHeight) {
                        this.badge.style.display = 'none';
                        return;
                    }
                    this.badge.style.left = (rect.right + window.scrollX - 30) + 'px'; 
                    this.badge.style.top = (rect.bottom + window.scrollY - 30) + 'px'; 
                    this.badge.style.display = 'flex';
                },
                configurarEventosDoCampo() {
                    if (this.ultimoCampo._spellConfigured) return; this.ultimoCampo._spellConfigured = true;
                    this.ultimoCampo.addEventListener('input', () => {
                        this.badge.className = 'loading'; this.badge.innerHTML = ''; this.popup.style.display = 'none'; this.camadaIlusao.innerHTML = '';
                        clearTimeout(this.tempoDigitacao); this.tempoDigitacao = setTimeout(() => this.verificarTextoNaAPI(), 800);
                    });
                    this.ultimoCampo.addEventListener('scroll', () => this.sincronizarIlusao());
                    this.ultimoCampo.addEventListener('click', (e) => this.verificarCursor(e));
                    this.ultimoCampo.addEventListener('keyup', (e) => { if (["ArrowLeft", "ArrowRight"].includes(e.key)) this.verificarCursor(e); });
                },
                async verificarTextoNaAPI() {
                    const field = this.ultimoCampo;
                    if (!field) return;
                    const text = field.isContentEditable ? (field.innerText || field.textContent) : field.value;
                    const revision = this.__revision = (this.__revision || 0) + 1;
                    if (!text.trim()) { this.errosEncontrados=[]; this.atualizarLinhasOnduladas(text); this.atualizarBadge(); return; }
                    try {
                        const response = await ctx.safeFetch('https://api.languagetool.org/v2/check', {method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({text,language:'pt-BR'}).toString()});
                        if (!response.ok) throw new Error('LanguageTool ' + response.status);
                        const data = await response.json();
                        const current = field.isContentEditable ? (field.innerText || field.textContent) : field.value;
                        if (this.__revision !== revision || this.ultimoCampo !== field || current !== text) return;
                        this.errosEncontrados = window.AjaModularSpell.filterMatches(data.matches || [], text, this.dicionarioPessoal).sort((a,b)=>b.offset-a.offset);
                        this.atualizarLinhasOnduladas(text); this.atualizarBadge();
                        if (this.panel.style.display === 'flex' && !this.panel.querySelector('#tab-voice.active, #tab-dict.active')) this.renderizarPainel();
                    } catch(error) { console.warn('[AjaModular] Corretor indisponível:', error.message); }
                },
                atualizarLinhasOnduladas(textoOriginal) {
                    this.camadaIlusao.innerHTML = ctx.buildSpellOverlayHTML(textoOriginal, this.errosEncontrados);
                    this.sincronizarIlusao();
                },
                atualizarBadge() {
                    const qtd = this.errosEncontrados.length;
                    if (qtd === 0) {
                        this.badge.className = 'clean';
                        this.badge.innerHTML = '<div class="badge-dict-btn" style="bottom: 6px; right: 6px;" title="Dicionário Pessoal">📖</div>'; 
                        this.badge.style.display = 'flex';
                    } else { 
                        this.badge.className = ''; 
                        this.badge.innerHTML = `${qtd}<div class="badge-dict-btn" title="Dicionário Pessoal">📖</div>`; 
                        this.badge.style.display = 'flex'; 
                    }
                },
                verificarCursor(eventoMouse) {
                    if (!this.ultimoCampo || this.errosEncontrados.length === 0) return;
                    const cursor = this.ultimoCampo.selectionStart;
                    const erroNoCursor = this.errosEncontrados.find(err => cursor >= (err.offset - 1) && cursor <= (err.offset + err.length + 1));
                    if (erroNoCursor) {
                        let top = eventoMouse.pageY ? eventoMouse.pageY + 15 : (this.ultimoCampo.getBoundingClientRect().bottom + window.scrollY);
                        let left = eventoMouse.pageX ? eventoMouse.pageX : (this.ultimoCampo.getBoundingClientRect().left + window.scrollX + 20);
                        this.popup.style.left = left + 'px'; this.popup.style.top = top + 'px';
                        this.mostrarPopupCorrecao(erroNoCursor);
                    } else { this.popup.style.display = 'none'; }
                },
                mostrarPopupCorrecao(erro) {
                    const sugestaoPrincipal = erro.replacements[0] ? erro.replacements[0].value : "";
                    const categoria = erro.rule.category.name || "Revisão sugerida";
                    let labelSugestao = sugestaoPrincipal;
                    const palavraErro = erro.context.text.substring(erro.context.offset, erro.context.offset + erro.context.length);
                    let html = `<div class="popup-header">${categoria}</div><div class="popup-body">`;
                    if (sugestaoPrincipal) { html += `<button class="popup-sug-btn purecloud-script-button" id="sug-btn-main">➔ ${labelSugestao}</button>`; }
                    else { html += `<div style="font-size:12px; color:#ef4444; font-weight:500;">${erro.message}</div>`; }
                    html += `</div><div class="popup-footer">
                        <button class="popup-action-btn" id="btn-add-dict" title="Não marcar mais como erro">💾 Salvar</button>
                        <button class="popup-action-btn" id="btn-rewrite">✨ IA</button>
                        <button class="popup-action-btn" id="btn-ignore">🗑️ Ignorar</button>
                    </div>`;
                    this.popup.innerHTML = html;
                    if (sugestaoPrincipal) { this.popup.querySelector('#sug-btn-main').onclick = () => this.aplicarCorrecao(erro, sugestaoPrincipal); }
                    this.popup.querySelector('#btn-add-dict').onclick = () => { this.adicionarAoDicionario(palavraErro); this.popup.style.display = 'none'; };
                    this.popup.querySelector('#btn-ignore').onclick = () => {
                        this.errosEncontrados = this.errosEncontrados.filter(e => e !== erro);
                        this.atualizarLinhasOnduladas(this.ultimoCampo.isContentEditable ? (this.ultimoCampo.innerText || this.ultimoCampo.textContent) : this.ultimoCampo.value); this.atualizarBadge(); this.popup.style.display = 'none';
                    };
                    this.popup.querySelector('#btn-rewrite').onclick = async () => {
                        if (!window.askGemini) { alert("IA não disponível."); return; }
                        const btnIA = this.popup.querySelector('#btn-rewrite');
                        const originalHtml = btnIA.innerHTML;
                        btnIA.innerHTML = "⏳...";
                        btnIA.disabled = true;
                        
                        try {
                            const context = this.ultimoCampo.isContentEditable ? (this.ultimoCampo.innerText || this.ultimoCampo.textContent) : this.ultimoCampo.value;
                            const prompt = `Reescreva esta frase de atendimento ao cliente para torná-la mais profissional, clara e gramaticalmente correta, mantendo o sentido original: "${context}"`;
                            const res = await window.askGemini(prompt);
                            if (res && !res.includes("Erro") && !res.includes("error")) {
                                if (this.ultimoCampo.isContentEditable) this.ultimoCampo.innerText = res;
                                else this.ultimoCampo.value = res;
                                this.dispararEventoDeMudanca();
                                this.popup.style.display = 'none';
                            }
                        } catch (e) { console.error(e); }
                        
                        btnIA.innerHTML = originalHtml;
                        btnIA.disabled = false;
                    };
                    this.popup.style.display = 'flex';
                },
                aplicarCorrecao(erro, sugestao) { this.aplicarCorrecaoMath(erro, sugestao); this.dispararEventoDeMudanca(); this.popup.style.display = 'none'; if (this.panel.style.display === 'flex') this.panel.style.display = 'none'; },
                aplicarCorrecaoMath(erro, sugestao) {
                    if (!this.ultimoCampo) return; 
                    const isCE = this.ultimoCampo.isContentEditable; 
                    const textoAtual = isCE ? (this.ultimoCampo.innerText || this.ultimoCampo.textContent) : this.ultimoCampo.value;
                    
                    // Verifica se o texto ainda bate com o erro (evita duplicidade se o usuário já mudou algo)
                    if (erro.offset > textoAtual.length) return;

                    const novoTexto = textoAtual.substring(0, erro.offset) + sugestao + textoAtual.substring(erro.offset + (erro.length || 0));
                    
                    if (isCE) {
                        this.ultimoCampo.focus();
                        // Modo seguro para ContentEditable: Limpa e reinsere
                        this.ultimoCampo.innerText = novoTexto;
                    } else {
                        this.ultimoCampo.value = novoTexto;
                    }
                    this.camadaIlusao.innerHTML = ""; // Limpa rastro visual imediatamente
                },
                dispararEventoDeMudanca() { this.ultimoCampo.dispatchEvent(new Event('input', { bubbles: true })); this.verificarTextoNaAPI(); },
                renderizarPainel() {
                    this.panel.innerHTML = `
                <div class="panel-header-top">
                    <div class="panel-title">
                        <div style="background:rgba(255,255,255,0.2); color:white; border-radius:50%; width:22px; height:22px; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:bold;">${this.errosEncontrados.length}</div> 
                        Corretor Ortográfico Aja Pro
                    </div>
                    <button class="btn-fix-all" id="btn-fix-all" ${this.errosEncontrados.length === 0 ? 'disabled' : ''}>Fix all</button>
                </div>
                <div class="panel-tabs">
                    <span class="tab-btn-p active" id="tab-errors" style="cursor:pointer;">Tudo (${this.errosEncontrados.length})</span>
                    <span class="tab-btn-p" id="tab-dict" style="cursor:pointer;">Dicionário (${this.dicionarioPessoal.length})</span>
                </div>
                <div class="panel-body" id="panel-content-area" style="background:#f8fafc; min-height:220px;"></div>`;
                    
                    const area = this.panel.querySelector('#panel-content-area');
                    
                    const renderErrors = () => {
                        area.innerHTML = "";
                        if (this.errosEncontrados.length === 0) {
                            area.innerHTML = `<div style="text-align:center; padding:40px; color:#64748b; font-size:13px;">✨ Tudo certo com seu texto!</div>`;
                            return;
                        }
                        this.errosEncontrados.forEach(err => {
                            const card = document.createElement('div'); card.className = 'panel-card';
                            const erroTexto = err.context.text.substr(err.context.offset, err.context.length) || "Ponto/Vírgula";
                            const sugTexto = err.replacements[0] ? err.replacements[0].value : "-";
                            card.innerHTML = `<span class="card-category">${err.rule.category.name}</span><div class="card-change"><span class="card-wrong">${erroTexto}</span> ➔ <span class="card-right" title="Clique para aplicar">${sugTexto}</span></div>`;
                            if (err.replacements[0]) { card.querySelector('.card-right').onclick = () => { this.aplicarCorrecao(err, sugTexto); }; }
                            area.appendChild(card);
                        });
                    };

                    const renderDict = () => {
                        area.innerHTML = "";
                        if (this.dicionarioPessoal.length === 0) {
                            area.innerHTML = `<div style="text-align:center; padding:40px; color:#64748b; font-size:13px;">Seu dicionário está vazio.</div>`;
                            return;
                        }
                        this.dicionarioPessoal.forEach(word => {
                            const item = document.createElement('div');
                            item.style.cssText = "display:flex; justify-content:space-between; padding:8px 12px; background:#f8fafc; border-radius:6px; margin-bottom:5px; font-size:13px; color:#334155; border:1px solid #e2e8f0;";
                            item.innerHTML = `<span>${word}</span> <button style="background:none; border:none; color:#ef4444; cursor:pointer; font-weight:bold;">×</button>`;
                            item.querySelector('button').onclick = () => {
                                this.dicionarioPessoal = this.dicionarioPessoal.filter(w => w !== word);
                                ctx.ajaStorage.setItem('pcs_spell_dict', JSON.stringify(this.dicionarioPessoal));
                                renderDict();
                                this.verificarTextoNaAPI();
                            };
                            area.appendChild(item);
                        });
                    };

                    renderErrors();

                    this.panel.querySelector('#tab-errors').onclick = (e) => {
                        this.panel.querySelectorAll('.tab-btn-p').forEach(b => b.classList.remove('active'));
                        e.target.classList.add('active');
                        renderErrors();
                    };
                    this.panel.querySelector('#tab-dict').onclick = (e) => {
                        this.panel.querySelectorAll('.tab-btn-p').forEach(b => b.classList.remove('active'));
                        e.target.classList.add('active');
                        renderDict();
                    };

                    this.panel.querySelector('#btn-ia-fix').onclick = async () => {
                        if (!this.ultimoCampo) return;
                        const btn = this.panel.querySelector('#btn-ia-fix');
                        const textoOriginal = this.ultimoCampo.isContentEditable ? (this.ultimoCampo.innerText || this.ultimoCampo.textContent) : this.ultimoCampo.value;
                        
                        if (!textoOriginal.trim()) return;
                        
                        const originalBtnText = btn.innerText;
                        btn.innerText = '⌛...';
                        btn.disabled = true;

                        try {
                            if (window.askGemini) {
                                const prompt = `Atue como um revisor profissional. Corrija a gramática, melhore a fluidez e adicione a pontuação correta (vírgulas e pontos) para este texto de atendimento ao cliente, mantendo o tom profissional e o sentido original: "${textoOriginal}"`;
                                const corrigido = await window.askGemini(prompt);
                                
                                if (corrigido && !corrigido.includes("Erro") && !corrigido.includes("error")) {
                                    if (this.ultimoCampo.isContentEditable) this.ultimoCampo.innerText = corrigido;
                                    else this.ultimoCampo.value = corrigido;
                                    this.dispararEventoDeMudanca();
                                    this.verificarTextoNaAPI();
                                } else {
                                    alert("A IA não conseguiu processar o texto agora. Tente novamente.");
                                }
                            } else {
                                alert("O módulo de IA não está ativo.");
                            }
                        } catch (e) { console.error(e); }
                        
                        btn.innerText = originalBtnText;
                        btn.disabled = false;
                    };

                    this.panel.querySelector('#btn-fix-all').onclick = () => { 
                        this.errosEncontrados.forEach(err => { if (err.replacements[0]) this.aplicarCorrecaoMath(err, err.replacements[0].value); }); 
                        this.dispararEventoDeMudanca(); this.panel.style.display = 'none'; 
                    };
                }
            };

            // Inicializa o corretor após injetar o módulo.
            setTimeout(() => {
                window.log("[CORRETOR PRO] Iniciando tracker do corretor...");
                spellCheckerModule.init();
                window.AjaModularSetupSpell?.();
                window.AjaModularCompactSpell?.(spellCheckerModule);
            }, 0);

        })();

    } catch (e) { console.error('[BUILDER] Erro fatal no módulo corretor.js:', e); throw e; }



return { open() { window.AjaModularSetupSpell?.(); return window.toggleCorretorAja?.(); } };
});
