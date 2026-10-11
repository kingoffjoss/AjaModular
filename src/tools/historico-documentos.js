window.AjaModular.register("historico-documentos", [], function(ctx) {
const key = 'purecloudScript_idHistory';
function record(doc) {
    let history; try { history = JSON.parse(ctx.ajaStorage.getItem(key) || '[]'); } catch { history = []; }
    if (!Array.isArray(history)) history = [];
    history.unshift({doc, tipo:doc.length === 11 ? 'CPF' : 'CNPJ', hora:new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})});
    ctx.ajaStorage.setItem(key, JSON.stringify(history.slice(0,30)));
    document.dispatchEvent(new Event('ajamodular:document-saved'));
}
return { record, mount(panel) {
// Lógica Extrator F2 e Histórico
                        const refreshHistoryUI = () => {
                            const list = panel.querySelector('#historico-id-list');
                            list.innerHTML = '';
                            let history = [];
                            try { history = JSON.parse(ctx.ajaStorage.getItem('purecloudScript_idHistory') || '[]'); } catch (e) { }

                            if (!Array.isArray(history)) history = [];
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
                            ctx.ajaStorage.removeItem('purecloudScript_idHistory');
                            refreshHistoryUI();
                        };

                        refreshHistoryUI();

                        
document.addEventListener('ajamodular:document-saved', refreshHistoryUI);
} };
});
