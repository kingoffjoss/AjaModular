window.AjaModular.register('ui-createAgentToolsPanel', [], function(ctx) {
    ctx.UI.createAgentToolsPanel = function() {
        if (!ctx.CONFIG.TOOLS_VISIBLE) { document.getElementById('purecloud-script-tools-panel')?.remove(); return; }
        return window.AjaModular.open('ferramentas');
    };
});
