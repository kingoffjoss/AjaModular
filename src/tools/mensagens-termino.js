window.AjaModular.register('mensagens-termino', [], function (ctx) {
    const ID = 'ajamodular-mensagens-termino';
    function activate() {
        const native = document.querySelector('#call-control-end-sms-button, button[aria-label="Mensagens de término"]');
        if (!native || native.disabled || native.getAttribute('aria-disabled') === 'true' || native.getClientRects().length === 0) {
            alert('O botão oficial Mensagens de término não está disponível. Selecione uma conversa no Genesys.');
            return;
        }
        native.click();
    }
    function mount(toolbar) {
        if (!toolbar) return null;
        document.getElementById('purecloud-script-btn-toggleLock')?.remove();
        let button = document.getElementById(ID);
        if (!button) {
        button = document.createElement('button'); button.id = ID; button.type = 'button'; button.className = 'purecloud-script-custom-btn';
        button.textContent = 'X'; button.title = 'Mensagens de término'; button.setAttribute('aria-label', 'Abrir mensagens de término');
        button.style.cssText = 'flex-shrink:0;width:36px;height:36px;background:#d93b3b;color:white;border:0;border-radius:8px;cursor:pointer;font:bold 18px sans-serif;';
        button.onclick = activate;
        }
        const native = toolbar.querySelector('#call-control-end-sms-button, button[aria-label="Mensagens de término"]');
        if (native) {
            if (native.nextElementSibling !== button) native.insertAdjacentElement('afterend', button);
        } else if (button.parentElement !== toolbar) toolbar.appendChild(button);
        return button;
    }
    function open() { return mount(ctx.findEl(ctx.CONFIG.PURECLOUD_SELECTORS.TOOLBAR)); }
    return {open, mount, activate};
});
