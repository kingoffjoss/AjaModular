// Shared dependencies: none
window.AjaModular.register("ui-renderBarChart", [], function(ctx) {
const implementation = {renderBarChart(container, perHourData) {
            container.innerHTML = ''; if (Object.keys(perHourData).length === 0) { container.innerHTML = '<div class="chart-placeholder">Nenhuma conversa para exibir gráfico.</div>'; return; } const maxCount = Math.max(...Object.values(perHourData)); const chartWrapper = document.createElement('div'); chartWrapper.className = 'chart-bars-wrapper'; for (let hour = 0; hour < 24; hour++) { const count = perHourData[hour] || 0; const height = (count / (maxCount || 1)) * 90; const barWrapper = document.createElement('div'); barWrapper.className = 'chart-bar-wrapper'; barWrapper.title = `${count} conversas às ${String(hour).padStart(2, '0')}h`; barWrapper.style.height = '100%'; barWrapper.style.position = 'relative'; barWrapper.innerHTML = `<div class="chart-bar building-bar" style="height: ${height}%; position: absolute; bottom: 0; width: 90%;"><span class="bar-count">${count > 0 ? count : ''}</span></div><span class="bar-label">${String(hour).padStart(2, '0')}h</span>`; chartWrapper.appendChild(barWrapper); } container.innerHTML = `<div class="chart-scroll-container">${chartWrapper.outerHTML}</div>`;
        }};
ctx.UI.renderBarChart = implementation.renderBarChart;
});
