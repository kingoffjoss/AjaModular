// Shared dependencies: ajaStorage
window.AjaModular.register("menu", ["compatibility"], function(ctx) {
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
        #bau-trigger-button, #central-trigger-btn, #car-float-btn {
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
        #uni-btn-off { background:#334155; }
        #uni-btn-id { background: linear-gradient(135deg, #667eea, #764ba2); }
        #uni-btn-bar { background: linear-gradient(135deg, #ff6b6b, #ee5253); }
        #uni-btn-central { background: linear-gradient(135deg, #06B6D4, #3B82F6); }
        #uni-btn-copy { background: linear-gradient(135deg, #FF00CC, #333399); }
        #uni-btn-car { background: linear-gradient(135deg, #10b981, #059669); } 
        #uni-btn-calc { background: linear-gradient(135deg, #00c6ff, #0072ff); }
        #uni-btn-pingo { background: linear-gradient(135deg, #5cad7c, #317d65); }
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

            const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style); window.AjaModular.scopeStyle('menu',style);

            // --- LIMPEZA DE LIXO E CONFLITOS ---
            if (document.getElementById('uni-menu-container')) document.getElementById('uni-menu-container').remove();

            // Remove calculadora anterior se existir
            const oldCalc = document.getElementById('calc-modal');
            if (oldCalc) oldCalc.remove();

            const div = document.createElement('div'); div.id = 'uni-menu-container';
            div.innerHTML = `
        <div class="uni-fab-actions">
            
            <button class="uni-fab-btn" id="uni-btn-calc" data-label="Calculadora"><span style="font-size:24px;">🧮</span></button>
            <button class="uni-fab-btn" id="uni-btn-off" data-label="Suporte" aria-label="Suporte"><svg class="uni-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2v10"></path><path d="M5.6 5.6a9 9 0 1 0 12.8 0"></path></svg></button>
            <button class="uni-fab-btn" id="uni-btn-central" data-label="Central de Ajuda"><span style="font-size:26px;">💠</span></button>
            <button class="uni-fab-btn" id="uni-btn-copy" data-label="Copiar Chat"><svg class="uni-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg></button>
            <button class="uni-fab-btn" id="uni-btn-car" data-label="Automação (CAR)"><span style="font-size:18px;">⌨️</span></button>
            <button class="uni-fab-btn" id="uni-btn-id" data-label="Copiar ID"><span style="font-size:20px;font-weight:800;">🆔</span></button>
            <button class="uni-fab-btn" id="uni-btn-bar" data-label="Ferramentas (Bar)"><svg class="uni-icon" viewBox="0 0 24 24"><path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"/></svg></button>
            <button class="uni-fab-btn" id="uni-btn-pingo" data-label="Pingo" aria-label="Pingo"><span aria-hidden="true" style="font-size:25px">💚</span></button>
            <button class="uni-fab-btn" id="uni-btn-tools" data-label="Avaliações" aria-label="Avaliações"><svg class="uni-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 3v17h17M8 16v-5M13 16V7M18 16V4"></path></svg></button>
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
                    ctx.ajaStorage.setItem('uniMenuPos', JSON.stringify({ left: container.style.left, top: container.style.top }));
                    setTimeout(() => { isDragging = false; }, 50);
                }
            }

            trigger.addEventListener('click', function (e) {
                if (isDragging) { e.stopImmediatePropagation(); e.preventDefault(); return; }
                container.classList.toggle('active'); trigger.classList.toggle('active');
            });

            try { const savedPos = ctx.ajaStorage.getItem('uniMenuPos'); if (savedPos) { const p = JSON.parse(savedPos); container.style.left = p.left; container.style.top = p.top; container.style.bottom = 'auto'; container.style.right = 'auto'; } } catch (e) { }

            // Navigation uses module contracts rather than private trigger identifiers.
const routes = { 'uni-btn-off':'simulacao-desligar', 'uni-btn-calc':'calculadora', 'uni-btn-bar':'bar', 'uni-btn-central':'central', 'uni-btn-tools':'avaliacoes', 'uni-btn-car':'car', 'uni-btn-id':'extrator', 'uni-btn-copy':'espelho', 'uni-btn-pingo':'pingo' };
for (const [buttonId, moduleId] of Object.entries(routes)) {
    document.getElementById(buttonId).onclick = () => {
        container.classList.remove('active');
        trigger.classList.remove('active');
        window.AjaModular.open(moduleId);
    };
}
/* Calculator registered separately. */

        })();

    } catch (e) { console.error('[BUILDER] Erro fatal no módulo menu.js:', e); throw e; }


});
