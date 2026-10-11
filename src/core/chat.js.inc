    // --- ENCONTRAR O CAMPO DE CHAT RAPIDAMENTE ---
    function getChatInput() {
        let chatInputField = null; const messagingIframe = document.querySelector(CONFIG.PURECLOUD_SELECTORS.MESSAGING_GADGET_IFRAME);
        if (messagingIframe && messagingIframe.contentDocument) { chatInputField = findEl('textarea[aria-label="Digitar uma mensagem"]', messagingIframe.contentDocument); }
        if (!chatInputField) { chatInputField = findEl('textarea[aria-label="Digitar uma mensagem"]'); }
        return chatInputField;
    }

    const actions = {
        copyInteraction: async () => {
            const selectedConvEl = findEl(CONFIG.PURECLOUD_SELECTORS.SELECTED_INTERACTION_GROUP);
            const { participantName, phoneNumber, formattedPhoneNumber } = documentExtractor.getNameAndNumber(selectedConvEl);
            if (participantName === 'N/A' || !findEl(CONFIG.PURECLOUD_SELECTORS.NATIVE_COPY_BUTTON)) { UI.createNotification(CONFIG.MESSAGES.NOT_FOUND_INTERACTION_DATA, 'error'); return; }
            const url = await getNativeInteractionUrl();
            if (url && (url.includes('interactions/') || url.includes('conversations/'))) {
                const tData = conversationTimers.get(selectedConvEl);
                if (tData) { tData.interactionUrl = url; tData.participantName = participantName; tData.phoneNumber = phoneNumber; UI.createNotification("Link salvo!", 'info', 1500); }
                const nameAndPhone = formattedPhoneNumber !== 'N/A' ? `${participantName} | ${formattedPhoneNumber}` : (participantName !== 'N/A' ? participantName : 'Nome Indisponível');
                const finalCopyText = `${nameAndPhone}\n${url}`;
                if (await copyTextToClipboard(finalCopyText)) { UI.createNotification(CONFIG.MESSAGES.INTERACTION_COPIED, 'success'); } else { UI.createNotification(CONFIG.MESSAGES.COPY_ERROR, 'error'); }
            } else {
                UI.createNotification("Link não encontrado.", 'warn');
                if (participantName !== 'N/A' && await copyTextToClipboard(participantName)) { UI.createNotification(`Nome (${participantName}) copiado.`, 'info'); }
            }
        },
        openSettings: () => UI.createSettingsPanel(),
        toggleMiniDashboard: () => { const dashboard = document.getElementById('purecloud-script-mini-dashboard'); if (dashboard) { clearInterval(dashboard._updateInterval); dashboard.remove(); CONFIG.MINI_DASHBOARD_VISIBLE = false; saveData(); } else { CONFIG.MINI_DASHBOARD_VISIBLE = true; saveData(); UI.createMiniDashboard(); } },
        toggleDarkMode: () => {
            CONFIG.DARK_MODE = !CONFIG.DARK_MODE;
            saveData();
        },
        quickGreeting: () => { const chatInputField = getChatInput(); if (chatInputField) { chatInputField.value = templateProcessor.process(CONFIG.QUICK_REPLIES[0] ? CONFIG.QUICK_REPLIES[0].text : "Olá!"); chatInputField.dispatchEvent(new Event('input', { bubbles: true })); chatInputField.focus(); } else { UI.createNotification("Campo de chat não encontrado.", "warn"); } },
        exportData: () => { const dataToExport = analyticsManager.getData().conversations; if (!dataToExport || dataToExport.length === 0) { UI.createNotification("Não há dados para exportar.", "warn"); return; } const filename = `purecloud_script_attendances_${getBrazilTime(new Date()).toISOString().split('T')[0]}.json`; const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); UI.createNotification("Download iniciado!", "success"); },

        // --- NOVAS AÇÕES: MODO FOCO E FORMATADOR DE TEXTO ---
        toggleZenMode: () => {
            document.body.classList.toggle('sys-zen-active');
            const isActive = document.body.classList.contains('sys-zen-active');
            UI.createNotification(`Modo Foco ${isActive ? 'Ativado 🧘' : 'Desativado'}`, "info");
        },
        formatText: () => {
            const chatInputField = getChatInput();
            if (chatInputField && chatInputField.value) {
                // Transforma texto em minúsculo e capitaliza a primeira letra de cada frase
                let txt = chatInputField.value.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, c => c.toUpperCase());
                chatInputField.value = txt;
                chatInputField.dispatchEvent(new Event('input', { bubbles: true }));
                UI.createNotification("Texto formatado e corrigido! ✨", "success");
            } else {
                UI.createNotification("Nenhum texto para formatar no campo de chat.", "warn");
            }
        }
    };

