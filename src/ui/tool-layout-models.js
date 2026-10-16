(function applyToolLayoutModels() {
    'use strict';
    if (document.getElementById('aja-tool-layout-models')) return;

    // Only AjaModular-owned windows are selected. Genesys controls are never restyled.
    const roots = [
        '#purecloud-script-tools-panel', '.purecloud-script-settings-panel',
        '.qr-script-popup', '.qr-script-settings-panel',
        '.pr-script-base-popup', '.pr-script-settings-panel',
        '#spell-main-panel', '#gemini-wrapper #gemini-modal',
        '.queue-monitor-container', '#car-panel', '#bau-rede',
        '#central-dashboard', '.central-modal',
        '#pausa-script-container', '#pausa-script-config-container',
        '#aja-avaliacoes', '#aja-menu-options', '#aja-maintenance'
    ];
    const shells = `:is(${roots.join(',')})`;
    const headers = '.panel-header,.panel-header-top,.car-header,#bau-rede-header,.central-topbar,.monitor-header,.header-top,#pausa-script-header,#pausa-script-config-header,#gemini-drag-handle,.modal-header';
    const tabs = '.tab-btn,.tab-btn-p,.nav-tab,.tab-button,.qr-category-item,.pr-category-item,.bau-sidebar-btn,.central-menu li,.os-btn';
    const cards = '.central-card,.queue-card,.av-card,.car-item,.info-box,.reply-item,.bau-installer-box,.bau-warning-box,.settings-group';
    const model = (id) => `:root[data-aja-theme="${id}"] ${shells}`;
    const themeData = {
        brisanet: {radius:'10px', header:'46px', pad:'11px 15px', tab:'6px', card:'10px', gap:'11px', sidebar:'160px', symbol:'24px', outline:'2px solid var(--aja-orange)', shadow:'none'},
        atlantico: {radius:'5px', header:'42px', pad:'8px 13px', tab:'3px', card:'4px', gap:'7px', sidebar:'138px', symbol:'24px', outline:'2px solid var(--aja-orange)', shadow:'none'},
        aurora: {radius:'20px', header:'56px', pad:'14px 19px', tab:'999px', card:'17px', gap:'15px', sidebar:'190px', symbol:'29px', outline:'1px solid var(--aja-orange)', shadow:'0 7px 22px rgba(109,40,217,.22)'},
        solar: {radius:'13px', header:'49px', pad:'10px 16px', tab:'9px', card:'12px', gap:'9px', sidebar:'150px', symbol:'25px', outline:'1px solid var(--aja-orange)', shadow:'0 4px 14px rgba(163,68,11,.12)'}
    };
    let css = '';
    for (const [id, data] of Object.entries(themeData)) {
        const scope = model(id);
        css += `
            ${scope} {
                --aja-model-radius:${data.radius};--aja-model-tab:${data.tab};
                --aja-model-card:${data.card};--aja-model-gap:${data.gap};
                --aja-model-sidebar:${data.sidebar};
                border-radius:var(--aja-model-radius)!important;
            }
            ${scope} :is(${headers}), ${scope} > header {
                min-height:${data.header}!important;padding:${data.pad}!important;
                border-radius:var(--aja-model-radius) var(--aja-model-radius) 0 0!important;
                gap:9px!important;
            }
            ${scope} :is(${headers})::before, ${scope} > header::before {
                content:var(--aja-tool-symbol,"◆");
                display:inline-flex;align-items:center;justify-content:center;
                flex:0 0 ${data.symbol};width:${data.symbol};height:${data.symbol};
                border-radius:${id === 'atlantico' ? '3px' : id === 'aurora' ? '50%' : id === 'solar' ? '7px' : '8px'};
                border:${data.outline};background:${id === 'solar' ? 'var(--aja-light-2)' : 'rgba(255,255,255,.14)'};
                color:${id === 'solar' ? 'var(--aja-dark)' : '#fff'};
                font:700 14px system-ui;box-sizing:border-box;pointer-events:none;
            }
            ${scope} :is(${tabs}) {
                border-radius:var(--aja-model-tab)!important;
                transition:background .18s,border-color .18s,transform .18s!important;
            }
            ${scope} :is(${cards}) {
                border-radius:var(--aja-model-card)!important;
                box-shadow:${data.shadow}!important;
            }
            ${scope} :is(input:not([type="checkbox"]):not([type="radio"]):not([type="color"]):not([type="file"]),textarea,select) {
                border-radius:var(--aja-model-tab)!important;
            }
            ${scope} button:not(.panel-header-btn):not([data-close]) {
                border-radius:var(--aja-model-tab)!important;
            }
            ${scope} :is(.panel-content,.av-body,.car-body,.monitor-content,.central-grid,#pr-main-content,#qr-main-content) {
                gap:var(--aja-model-gap);
            }
            :root[data-aja-theme="${id}"] :where(${roots.join(',')}) :where(#pr-sidebar,#qr-sidebar,.central-sidebar,.bau-sidebar) {
                width:var(--aja-model-sidebar)!important;
            }
            ${scope} .bau-sidebar { flex-basis:var(--aja-model-sidebar)!important; }
        `;
    }

    // Tool-specific symbols appear beside each window title, without replacing its controls.
    const symbols = {
        '#purecloud-script-tools-panel':'⚒', '.purecloud-script-settings-panel':'⚙',
        '.qr-script-popup':'✉', '.qr-script-settings-panel':'✉',
        '.pr-script-base-popup':'≡', '.pr-script-settings-panel':'≡',
        '#spell-main-panel':'✓', '#gemini-wrapper #gemini-modal':'✦',
        '.queue-monitor-container':'▤', '#car-panel':'↗', '#bau-rede':'▦',
        '#central-dashboard':'◇', '.central-modal':'◇',
        '#pausa-script-container':'◷', '#pausa-script-config-container':'◷',
        '#aja-avaliacoes':'▥', '#aja-menu-options':'☷', '#aja-maintenance':'⚙'
    };
    for (const [selector, symbol] of Object.entries(symbols)) {
        css += `${selector}{--aja-tool-symbol:"${symbol}"}`;
    }

    css += `
        :root[data-aja-theme="atlantico"] :is(#pr-sidebar,#qr-sidebar,.central-sidebar,.bau-sidebar) { border-right:3px solid var(--aja-orange)!important; }
        :root[data-aja-theme="atlantico"] :is(.central-menu li.active,.bau-sidebar-btn.active,.pr-category-item.active,.qr-category-item.active) { border-left:3px solid var(--aja-orange)!important;box-shadow:none!important; }
        :root[data-aja-theme="atlantico"] #central-dashboard .central-grid { grid-template-columns:repeat(auto-fill,minmax(260px,1fr))!important;gap:8px!important; }
        :root[data-aja-theme="atlantico"] #aja-avaliacoes .av-card { grid-column:span 6!important; }
        :root[data-aja-theme="atlantico"] #aja-avaliacoes .av-card:nth-child(n+7) { grid-column:span 3!important; }
        :root[data-aja-theme="atlantico"] :is(#pausa-script-container,#pausa-script-config-container,#car-panel) button { box-shadow:none!important; }

        :root[data-aja-theme="aurora"] :is(.central-menu li.active,.bau-sidebar-btn.active,.pr-category-item.active,.qr-category-item.active,.tab-btn.active,.nav-tab.active) { border-radius:999px!important;box-shadow:0 4px 14px rgba(109,40,217,.32)!important; }
        :root[data-aja-theme="aurora"] #central-dashboard .central-grid { grid-template-columns:repeat(auto-fill,minmax(180px,1fr))!important;gap:17px!important; }
        :root[data-aja-theme="aurora"] #aja-avaliacoes .av-card:nth-child(-n+4) { grid-column:span 6!important; }
        :root[data-aja-theme="aurora"] :is(#gemini-wrapper #ia-nav-tabs,.queue-monitor-container .tabs-container,#spell-main-panel .tabs-container) { padding:7px!important;gap:6px!important; }
        :root[data-aja-theme="aurora"] :is(#pausa-script-container #buttons-container,#pausa-script-container #buttons-extra) { gap:13px!important; }

        :root[data-aja-theme="solar"] #central-dashboard { flex-direction:column!important; }
        :root[data-aja-theme="solar"] #central-dashboard .central-sidebar { width:100%!important;flex-direction:row!important;align-items:center!important;flex:0 0 auto;padding:5px 9px!important;border-right:0!important;border-bottom:1px solid var(--aja-border-dark)!important;min-width:0; }
        :root[data-aja-theme="solar"] #central-dashboard .central-logo { padding:5px 10px!important;border:0!important;white-space:nowrap; }
        :root[data-aja-theme="solar"] #central-dashboard .central-menu { display:flex!important;align-items:center;gap:5px;overflow-x:auto;overflow-y:hidden;white-space:nowrap;padding:0!important;min-width:0; }
        :root[data-aja-theme="solar"] #central-dashboard .central-menu li { flex:0 0 auto;padding:7px 10px!important;border-left:0!important;border-bottom:2px solid transparent; }
        :root[data-aja-theme="solar"] #central-dashboard .central-menu li.active { border-bottom-color:var(--aja-orange)!important; }
        :root[data-aja-theme="solar"] #central-dashboard .central-version { display:none; }
        :root[data-aja-theme="solar"] #central-dashboard .central-grid { grid-template-columns:repeat(auto-fill,minmax(170px,1fr))!important;gap:10px!important; }
        :root[data-aja-theme="solar"] :is(.pr-popup-body,.qr-script-popup .qr-popup-body) { flex-direction:column!important; }
        :root[data-aja-theme="solar"] :is(#pr-sidebar,.qr-script-popup #qr-sidebar) { width:100%!important;height:69px!important;max-height:69px!important;flex:0 0 69px!important;overflow:hidden;border-right:0!important;border-bottom:1px solid var(--aja-border-dark)!important; }
        :root[data-aja-theme="solar"] #pr-sidebar .pr-sidebar-title { display:none!important; }
        :root[data-aja-theme="solar"] :is(#pr-category-list,.qr-script-popup #qr-category-list) { display:flex!important;align-items:center;gap:5px;overflow-x:auto!important;overflow-y:hidden!important;white-space:nowrap;padding:5px!important;margin:0!important;height:100%; }
        :root[data-aja-theme="solar"] :is(.pr-category-item,.qr-script-popup .qr-category-item) { flex:0 0 auto!important;border:1px solid var(--aja-border-dark)!important; }
        :root[data-aja-theme="solar"] #aja-avaliacoes .av-card:nth-child(n+7) { grid-column:span 4!important; }
        :root[data-aja-theme="solar"] #pausa-script-container #buttons-container { gap:6px!important; }
    `;

    const style = document.createElement('style');
    style.id = 'aja-tool-layout-models';
    style.textContent = css;
    document.documentElement.appendChild(style);
})();
