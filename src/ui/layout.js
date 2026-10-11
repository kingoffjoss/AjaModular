(function(){
    const style=document.createElement('style');style.id='ajamodular-layout';
    style.textContent=`
        #uni-menu-container {height:60px!important;flex-direction:column!important}
        #uni-menu-container:not([style]) {bottom:100px!important}
        #uni-menu-container .uni-fab-actions {position:absolute;bottom:72px;right:0;margin:0;max-height:max(80px, calc(100vh - 240px));flex-direction:column!important;justify-content:flex-start!important;overflow-y:auto;overflow-x:hidden;padding:8px 6px;width:62px;box-sizing:border-box}
        #uni-menu-container .uni-fab-btn {flex-shrink:0}
        #uni-menu-container .uni-fab-main {flex-shrink:0}
    `;document.head.appendChild(style);
    for(const button of document.querySelectorAll('#uni-menu-container .uni-fab-btn')) button.setAttribute('aria-label',button.dataset.label || button.id);
})();
