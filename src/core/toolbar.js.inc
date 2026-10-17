    function createToolbarUI(toolbar) {
        if (toolbar.dataset.scriptVersion === SCRIPT_VERSION) { return; } toolbar.querySelectorAll('.purecloud-script-custom-btn, #purecloud-script-toolbar-counter, .purecloud-script-menu-container').forEach(el => el.remove()); toolbar.dataset.scriptVersion = SCRIPT_VERSION;
        const createMainToolbarBtn = (id, title, svg, onClick) => { const btn = document.createElement("button"); btn.id = id; btn.className = 'purecloud-script-custom-btn'; btn.title = title; btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">${svg}</svg>`; btn.onclick = onClick; btn; toolbar.appendChild(btn); return btn; };
        createMainToolbarBtn('purecloud-script-btn-copyInteraction', featureDescriptions.copyInteraction.title, '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"/>', actions.copyInteraction);
        createMainToolbarBtn('purecloud-script-btn-openSettings', featureDescriptions.openSettings.title, '<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2 2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>', actions.openSettings);
        const yodaButton = createMainToolbarBtn('purecloud-script-btn-yoda', 'Abrir Chamado Yoda', '<path d="M14 3h7v7M21 3l-9 9"/><path d="M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5"/>', () => window.AjaModular.open('chamado-yoda'));
        yodaButton.setAttribute('aria-label', 'Abrir Chamado Yoda');
        const endButton = createMainToolbarBtn('purecloud-script-btn-endCustomer', 'Encerrar sem avaliação', '<circle cx="12" cy="12" r="10"/><path d="M7 7l10 10M17 7L7 17"/>', () => {
            let originalButton = document.getElementById('btn-ninja-encerrar');
            if (!originalButton) {
                runOriginalEndCode();
                originalButton = document.getElementById('btn-ninja-encerrar');
            }
            if (originalButton) {
                originalButton.style.display = 'none';
                originalButton.click();
            }
        });
        endButton.setAttribute('aria-label', 'Encerrar sem avaliação');
    }

