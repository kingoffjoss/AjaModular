const ajaStorage = window.AjaModularData.adapter(window.localStorage);
const ajaSessionStorage = window.AjaModularData.adapter(window.sessionStorage);
// --- GESTOR DE JANELAS (Z-INDEX GLOBAL) ---
(function () {
    let baseZIndex = 10000;

    // Seletores dos popups
    const popupSelectors = [
        '.qr-script-popup',
        '.pr-script-popup',
        '.ia-script-container',
        '.bau-script-container',
        '.ferramentas-script-container',
        '.central-script-container',
        '#pausa-script-config-container',
        '#corretor-painel'
    ];

    document.addEventListener('mousedown', function (e) {
        let isPopup = false;
        let targetPopup = null;
        for (let sel of popupSelectors) {
            const popup = e.target.closest(sel);
            if (popup) {
                targetPopup = popup;
                break;
            }
        }

        if (targetPopup) {
            baseZIndex += 1;
            targetPopup.style.zIndex = baseZIndex;
        }
    }, true);
})();

