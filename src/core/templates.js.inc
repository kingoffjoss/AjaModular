    function getAgentName() {
        const selectors = [
            'div.user-info .name', 
            '[data-qa-id="user-profile-name"]',
            'span.user-name',
            'div.name span.entry-value'
        ];
        for (let sel of selectors) {
            let el = document.querySelector(sel);
            if (el && el.innerText.trim()) {
                const name = el.innerText.trim();
                ajaStorage.setItem('purecloudScript_lastAgentName', name);
                return name;
            }
        }
        return ajaStorage.getItem('purecloudScript_lastAgentName') || "Usuário Anônimo";
    }

    // --- PROCESSADOR DE VARIÁVEIS (MÁGICAS) ---
    const templateProcessor = {
        process: (text) => {
            if (!text.includes('{')) return text;
            const selectedConvEl = findEl(CONFIG.PURECLOUD_SELECTORS.SELECTED_INTERACTION_GROUP);
            let { participantName } = documentExtractor.getNameAndNumber(selectedConvEl);
            if (!participantName || participantName === 'N/A') participantName = 'Cliente';
            let primeiroNome = participantName.split(' ')[0];

            const horaAtual = getBrazilTime(new Date()).getHours();
            let saudacao = "Bom dia";
            if (horaAtual >= 12 && horaAtual < 18) saudacao = "Boa tarde";
            else if (horaAtual >= 18 || horaAtual < 5) saudacao = "Boa noite";

            // Aplica escapeHTML para segurança caso os nomes sejam usados em HTML posteriormente. 
            // Para o chat de texto puro, escapeHTML pode injetar entities ampersand, 
            // então o processador de chat apenas troca.
            return text.replace(/{nome}/gi, participantName)
                .replace(/{primeiro_nome}/gi, primeiroNome)
                .replace(/{saudacao}/gi, saudacao);
        }
    };

    const makeDraggable = (popup, header, popupName) => {
        if (!header) header = popup;
        let isDragging = false, dragOffsetX = 0, dragOffsetY = 0;

        let enforceBounds = (top, left) => {
            const vpW = window.innerWidth, vpH = window.innerHeight;
            const pW = popup.offsetWidth || 300, pH = popup.offsetHeight || 300;
            let safeT = Math.max(5, Math.min(vpH - pH - 5, top));
            let safeL = Math.max(5, Math.min(vpW - pW - 5, left));
            if (pW > vpW) safeL = 0; if (pH > vpH) safeT = 0;
            return { top: safeT, left: safeL };
        };

        try {
            if (typeof CONFIG === 'undefined') window.CONFIG = { POPUP_POSITIONS: {} };
            if (!CONFIG.POPUP_POSITIONS) CONFIG.POPUP_POSITIONS = {};
            let saved = ajaSessionStorage.getItem('qr_popupPositions') || ajaSessionStorage.getItem('popupPositions') || '{}';
            CONFIG.POPUP_POSITIONS = JSON.parse(saved);
        } catch (e) { }

        popup.style.position = 'fixed';
        popup.style.margin = '0';
        popup.style.transform = 'none';

        // Initial Positioning logic
        if (popupName === 'quickReplyPopup') {
            const dW = '650px', dH = '75vh';
            popup.style.width = dW; popup.style.height = dH;
            setTimeout(() => {
                const safe = enforceBounds(Math.max(5, (window.innerHeight - popup.offsetHeight) / 2), Math.max(5, (window.innerWidth - popup.offsetWidth) / 2));
                popup.style.top = safe.top + 'px'; popup.style.left = safe.left + 'px';
            }, 50);
        } else if (CONFIG && CONFIG.POPUP_POSITIONS && CONFIG.POPUP_POSITIONS[popupName]?.top && CONFIG.POPUP_POSITIONS[popupName]?.left) {
            const safe = enforceBounds(parseFloat(CONFIG.POPUP_POSITIONS[popupName].top), parseFloat(CONFIG.POPUP_POSITIONS[popupName].left));
            popup.style.top = safe.top + 'px'; popup.style.left = safe.left + 'px';
            if (CONFIG.POPUP_POSITIONS[popupName].width) popup.style.width = CONFIG.POPUP_POSITIONS[popupName].width;
            if (CONFIG.POPUP_POSITIONS[popupName].height) popup.style.height = CONFIG.POPUP_POSITIONS[popupName].height;
        } else {
            popup.style.top = '10%'; popup.style.left = '10%';
        }

        const savePos = () => {
            if (popupName === 'quickReplyPopup' && !isDragging) return;
            const rect = popup.getBoundingClientRect();
            const safe = enforceBounds(rect.top, rect.left);
            if (typeof CONFIG !== 'undefined' && CONFIG.POPUP_POSITIONS) {
                CONFIG.POPUP_POSITIONS[popupName] = { top: safe.top + 'px', left: safe.left + 'px', width: popup.style.width, height: popup.style.height };
                try {
                    ajaSessionStorage.setItem('qr_popupPositions', JSON.stringify(CONFIG.POPUP_POSITIONS));
                    ajaSessionStorage.setItem('popupPositions', JSON.stringify(CONFIG.POPUP_POSITIONS));
                } catch (e) { }
            }
        };

        header.addEventListener('mousedown', (e) => {
            if (e.target.closest('button') || e.target.closest('.compact-btn') || e.target.closest('input') || e.target.classList.contains('os-btn') || e.button !== 0) return;
            e.preventDefault();
            isDragging = true;
            popup.style.transition = 'none';

            const rect = popup.getBoundingClientRect();
            popup.style.left = rect.left + 'px';
            popup.style.top = rect.top + 'px';
            popup.style.bottom = 'auto';
            popup.style.right = 'auto';

            dragOffsetX = e.clientX - rect.left;
            dragOffsetY = e.clientY - rect.top;
        }, { passive: false });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            const safe = enforceBounds(e.clientY - dragOffsetY, e.clientX - dragOffsetX);
            popup.style.top = safe.top + 'px';
            popup.style.left = safe.left + 'px';
        }, { passive: false });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                savePos();
            }
        });

        try {
            const observer = new ResizeObserver(() => { if (!isDragging) savePos(); });
            observer.observe(popup);
        } catch (e) { }
    };

