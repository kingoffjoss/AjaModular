// Opens the current ticket URL from the visible platform link.
window.AjaModular.register('chamado-yoda', [], function () {
    const normalize = text => String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
    const visible = element => element.getClientRects().length > 0 && element.ownerDocument.defaultView.getComputedStyle(element).visibility !== 'hidden';
    function findLinks(doc) {
        const links = [];
        for (const label of doc.querySelectorAll('[data-component-type="text"] .text-component')) {
            if (normalize(label.textContent).replace(/:$/, '') !== 'chamado yoda' || !visible(label)) continue;
            const row = label.closest('.children-wrapper');
            if (!row) continue;
            for (const link of row.querySelectorAll('[data-component-type="link"] a')) {
                if (link.closest('.children-wrapper') === row && visible(link)) links.push(link);
            }
        }
        return links;
    }
    function collect(root, found) {
        for (const frame of root.querySelectorAll('iframe[title="Scripts"]')) {
            if (!visible(frame)) continue;
            try { if (frame.contentDocument) found.push(...findLinks(frame.contentDocument)); } catch (_) {}
        }
        for (const host of root.querySelectorAll('*')) {
            if (host.shadowRoot && visible(host)) collect(host.shadowRoot, found);
        }
    }
    function open() {
        const links = []; collect(document, links);
        const unique = [...new Set(links)];
        if (unique.length !== 1) {
            window.AjaModularNotice?.(unique.length ? 'Há mais de um Chamado Yoda visível. Selecione o atendimento desejado.' : 'Abra o painel Scripts da conversa para acessar o Chamado Yoda.', 'error');
            return;
        }
        const link = unique[0];
        if (link.getAttribute('aria-disabled') === 'true') return;
        let url;
        try { url = new URL(link.getAttribute('href') || '', link.ownerDocument.baseURI); } catch { /* link inválido */ }
        if (!url || url.protocol !== 'https:' || url.hostname !== 'revan-atendimento.brisanet.net.br' || !/^#\/yoda\/attendance\/\d+(?:[/?#]|$)/.test(url.hash)) {
            window.AjaModularNotice?.('O link do Yoda não está disponível neste atendimento.', 'warn');
            return;
        }
        window.open(url.href, '_blank', 'noopener,noreferrer');
    }
    return {open};
});
