// Clock rendering and viewport positioning; no Genesys status-changing operations.
window.AjaModular.register('relogio', [], function() {
    let interval = null, refresh = null;
    function clampPosition(left, top, width, height, viewportWidth, viewportHeight, margin = 8) {
        const maxLeft = Math.max(0, viewportWidth - width - margin);
        const maxTop = Math.max(0, viewportHeight - height - margin);
        return { left: Math.min(Math.max(Number.isFinite(left) ? left : margin, Math.min(margin,maxLeft)),maxLeft),
                 top: Math.min(Math.max(Number.isFinite(top) ? top : margin, Math.min(margin,maxTop)),maxTop) };
    }
    function keepOnScreen(panel) {
        if (!panel || panel.style.display === 'none') return;
        panel.style.maxWidth = Math.max(1,window.innerWidth-16)+'px';
        panel.style.maxHeight = Math.max(1,window.innerHeight-16)+'px';
        panel.style.overflow = 'auto';
        const rect = panel.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const pos = clampPosition(rect.left,rect.top,rect.width,rect.height,window.innerWidth,window.innerHeight);
        panel.style.left = pos.left + 'px'; panel.style.top = pos.top + 'px';
        panel.style.right = 'auto'; panel.style.bottom = 'auto';
    }
    function constrainPanels() {
        ['pausa-script-container','pausa-script-config-container'].forEach(id=>keepOnScreen(document.getElementById(id)));
    }
    function snapshot(state, now = new Date()) {
        const available = state.tipo === 'Disponível' || state.tipo === 'Na fila';
        const color = available ? '#50fa7b' : state.tipo === 'Logoff' ? '#999' : '#f1fa8c';
        const started = state.inicio instanceof Date ? state.inicio.getTime() : NaN;
        const elapsed = state.ativa && Number.isFinite(started) ? Math.max(0,Math.floor((now.getTime()-started)/1000)) : null;
        return {time:now.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit'}), color, available, active:!!state.ativa, elapsed};
    }
    function render(state, formatDuration) {
        const view = snapshot(state);
        for (const id of ['top-bar-time','pausa-script-header-clock']) {
            const node = document.getElementById(id); if (!node) continue;
            node.textContent = view.time;
            node.style.setProperty('color',view.color,'important');
            node.style.setProperty('text-shadow','none','important');
        }
        const dot = document.getElementById('pausa-script-clock-dot');
        if (dot) { dot.style.display=view.active?'block':'none'; dot.classList.toggle('status-ok',view.available); }
        const status = document.getElementById('current-status');
        if(status) { status.textContent=state.tipo+(view.elapsed===null?'':' ('+formatDuration(view.elapsed)+')');status.style.setProperty('color',view.color,'important'); }
    }
    function start(update) {
        refresh = update;
        update(); constrainPanels();
        if(interval!==null) return;
        interval=setInterval(()=>refresh(),1000);
        window.addEventListener('resize',constrainPanels);
        document.addEventListener('visibilitychange',()=>{if(!document.hidden){refresh();constrainPanels();}});
    }
    return {clampPosition, keepOnScreen, snapshot, render, start};
});
