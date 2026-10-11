window.AjaModular.register('ui-createAgentToolsPanel', [], function(ctx) {
    ctx.UI.createAgentToolsPanel = function() {
        if (!ctx.CONFIG.TOOLS_VISIBLE) { return window.AjaModular.get('ferramentas')?.close(); }
        return window.AjaModular.open('ferramentas');
    };
});
