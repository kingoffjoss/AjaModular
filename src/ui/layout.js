(function(){
    const style=document.createElement('style');style.id='ajamodular-layout';
    style.textContent=`
        .pr-script-base-popup, .qr-script-popup {max-width:calc(100vw - 16px)!important;max-height:calc(100vh - 16px)!important;box-sizing:border-box}
        .pr-script-base-popup *, .qr-script-popup * {box-sizing:border-box}
        .pr-script-base-popup .panel-content, .qr-script-popup .panel-content, .qr-script-popup .panel-content-wrapper {min-width:0;min-height:0}
        .pr-script-settings-panel .panel-content {overflow-y:auto}
        .pr-script-settings-panel .pr-reply-controls, .qr-script-settings-panel .reply-controls {flex-wrap:wrap;gap:8px}
        .pr-script-base-popup .panel-header-buttons, .qr-script-popup .panel-header-buttons {background:transparent!important;border:0!important;box-shadow:none!important;padding:0!important}
        .pr-script-base-popup input[type="text"], .pr-script-base-popup textarea, .qr-script-popup input[type="text"], .qr-script-popup textarea {min-width:0;max-width:100%}
        .pr-script-settings-panel .pr-reply-title {min-width:0}
        .qr-script-settings-panel .reply-item {grid-template-columns:auto minmax(0,1fr) minmax(65px,110px) auto}
        .pr-script-base-popup .panel-footer, .qr-script-popup .panel-footer {flex-shrink:0}
        #uni-menu-container {height:60px!important;flex-direction:column!important}
        #uni-menu-container:not([style]) {bottom:100px!important}
        #uni-menu-container .uni-fab-actions {position:absolute;bottom:72px;right:0;margin:0;max-height:max(80px, calc(100vh - 240px));flex-direction:column!important;justify-content:flex-start!important;overflow-y:auto;overflow-x:hidden;padding:8px;width:76px;right:-8px;align-items:center;box-sizing:border-box;overscroll-behavior-y:contain;scrollbar-width:thin;scrollbar-color:#428cc1 transparent}
        @supports selector(::-webkit-scrollbar) { #uni-menu-container .uni-fab-actions {scrollbar-width:auto;scrollbar-color:auto} }
        #uni-menu-container .uni-fab-actions::-webkit-scrollbar {width:6px}
        #uni-menu-container .uni-fab-actions::-webkit-scrollbar-track {background:transparent}
        #uni-menu-container .uni-fab-actions::-webkit-scrollbar-thumb {background:#428cc1;border-radius:8px}
        #uni-menu-container .uni-fab-actions::-webkit-scrollbar-thumb:hover {background:#ff9500}
        #uni-menu-container .uni-fab-actions::-webkit-scrollbar-button {display:none;width:0;height:0}
        #uni-menu-container .uni-fab-btn {flex-shrink:0}
        #uni-menu-container .uni-fab-main {flex-shrink:0}
    `;document.head.appendChild(style);
    const actions=document.querySelector('#uni-menu-container .uni-fab-actions');
    if(actions){actions.tabIndex=0;actions.setAttribute('aria-label','Ferramentas do menu');}
    for(const button of document.querySelectorAll('#uni-menu-container .uni-fab-btn')) button.setAttribute('aria-label',button.dataset.label || button.id);
})();

