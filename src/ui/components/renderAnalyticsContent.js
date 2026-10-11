// Shared dependencies: CONFIG, UI, analyticsManager, copyTextToClipboard, getBrazilTime
window.AjaModular.register("ui-renderAnalyticsContent", [], function(ctx) {
const implementation = {renderAnalyticsContent(container) {
            const stats = ctx.analyticsManager.calculateStats();
            container.innerHTML = `<div class="stats-grid"><div class="stat-item"><span>Conversas (Únicas)</span><strong id="analytics-total-count">${stats.count}</strong></div><div class="stat-item"><span>TMA (Geral)</span><strong id="analytics-tma">${stats.tma}</strong></div><div class="stat-item"><span>TME (Ativo)</span><strong id="analytics-tme">${stats.tme}</strong></div><div class="stat-item"><span>Balão (Término)</span><strong id="analytics-balao-clicks">${stats.baloonClicks}</strong></div> <div class="stat-item"><span>Início</span><strong id="analytics-first">${stats.first}</strong></div><div class="stat-item"><span>Última</span><strong id="analytics-last">${stats.last}</strong></div><div class="stat-item"><span>Meta</span><strong id="analytics-target">${ctx.CONFIG.CONVERSATION_TARGET}</strong></div><div class="stat-item"><span>Transferidos</span><strong id="analytics-transfer-count">${stats.transferClicks}</strong></div></div><div style="display:flex; justify-content:space-between; align-items:center;"><p style="font-size: 0.8em; color: var(--purecloud-script-text-secondary); margin-top: 5px;">* Balão (Término) usa o contador integrado (v4.0).</p><button id="export-shift-btn" class="purecloud-script-button" style="padding: 6px 12px; font-size: 0.85em;">📋 Copiar Resumo P/ Lua</button></div><h4>Conversas/Hora (Todas Completas)</h4><div class="analytics-chart-container-main"></div>`;
            ctx.UI.renderBarChart(container.querySelector('.analytics-chart-container-main'), stats.perHour);

            container.querySelector('#export-shift-btn').onclick = () => {
                const s = ctx.analyticsManager.calculateStats();
                const today = ctx.getBrazilTime(new Date()).toLocaleDateString('pt-BR');
                const text = `📊 RESUMO DE TURNO (${today})\nAtendimentos Únicos: ${s.count}\nTMA Geral: ${s.tma}\nTME Ativo: ${s.tme}\nTransferências: ${s.transferClicks}\nCliques Balão T.: ${s.baloonClicks}\nPrimeiro Chat: ${s.first}\nÚltimo Chat: ${s.last}`;
                ctx.copyTextToClipboard(text).then(() => ctx.UI.createNotification("Resumo do turno copiado!", "success"));
            };
        }};
ctx.UI.renderAnalyticsContent = implementation.renderAnalyticsContent;
});
