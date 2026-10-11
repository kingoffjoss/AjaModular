(function () {
'use strict';
const definitions = new Map(), instances = new Map(), failures = new Map();
let context;
const styleRoots={menu:'#uni-menu-container,#qr-trigger-button,#pr-trigger-button,#bau-trigger-button,#gemini-float-btn,#monitor-trigger-btn,#central-trigger-btn,#car-float-btn',bar:'#bau-rede,#bau-trigger-button',car:'#car-panel,#car-float-btn',ia:'#gemini-wrapper',monitor:'.queue-monitor-container,#monitor-trigger-btn',central:'#central-dashboard,.central-modal-overlay,#central-trigger-btn',protocolos:'.pr-script-base-popup,#pr-trigger-button,#pr-script-notification-container',respostas:'.qr-script-popup,#qr-trigger-button,#qr-script-notification-container',pausas:'#pausa-script-container,#pausa-script-config-container,#pausa-script-confirm-dialog',corretor:'#spell-main-panel,#spell-badge,#spell-inline-popup,#spell-overlay-layer',ferramentas:'#purecloud-script-tools-panel'};
function isolateStyles(id,previous){
 const roots=styleRoots[id];if(!roots||!document.querySelectorAll)return;
 for(const style of document.querySelectorAll('style'))if(!previous.has(style)&&style.dataset.ajaScoped!==id){
  style.dataset.ajaOwner=id;
  function scope(rules){for(const rule of rules||[]){if(rule.selectorText){const original=rule.selectorText;rule.selectorText=original===':root'?roots:':where('+roots+'):is('+original+'), :where('+roots+') :is('+original+')';}else if(rule.cssRules&&!(typeof CSSKeyframesRule!=='undefined'&&rule instanceof CSSKeyframesRule))scope(rule.cssRules);}}
  try{scope(style.sheet?.cssRules);style.dataset.ajaScoped=id;}catch(error){console.warn('[AjaModular] Estilo não isolado: '+id,error);}
 }
}
function register(id, dependencies, factory) {
    if (definitions.has(id)) throw new Error('Módulo duplicado: ' + id);
    if (!Array.isArray(dependencies) || typeof factory !== 'function') throw new TypeError('Contrato inválido: ' + id);
    definitions.set(id, { dependencies, factory });
}
function start(shared) {
    context = shared;
    const active = new Set();
    function load(id) {
        if (instances.has(id)) return instances.get(id);
        if (failures.has(id)) throw failures.get(id);
        const definition = definitions.get(id);
        if (!definition) throw new Error('Dependência ausente: ' + id);
        if (active.has(id)) throw new Error('Dependência circular: ' + id);
        active.add(id);
        try {
            definition.dependencies.forEach(load);
            const previous = new Set(document.querySelectorAll?.('style') || []);
            const instance = definition.factory(context) || {};
            isolateStyles(id,previous);
            instances.set(id, instance);
            return instance;
        } catch (error) { failures.set(id, error); throw error; }
        finally { active.delete(id); }
    }
    for (const id of definitions.keys()) {
        try { load(id); }
        catch (error) { console.error('[AjaModular] Falha no módulo ' + id, error); }
    }
    document.documentElement.dataset.ajaModules = JSON.stringify(status());
    if(failures.size)window.AjaModularNotice?.('Há módulos com falha. Abra Manutenção no menu para conferir.');
}
function get(id) {
    if (!instances.has(id)) throw new Error('Módulo indisponível: ' + id);
    return instances.get(id);
}
function open(id) {
    document.documentElement.dataset.ajaLastAction = id;
    try {
        const instance = get(id);
        if (typeof instance.open !== 'function') throw new Error('Módulo sem ação de abertura: ' + id);
        return instance.open();
    } catch (error) { console.error('[AjaModular] ' + id, error); window.AjaModularNotice?.('Não foi possível abrir '+id+'. Consulte Manutenção no menu.'); }
}
function scopeStyle(id,style){if(!style||!document.querySelectorAll)return;delete style.dataset.ajaScoped;isolateStyles(id,new Set([...document.querySelectorAll('style')].filter(x=>x!==style)));}
function retry() {
    if (!context) throw new Error('A inicialização ainda não começou');
    failures.clear();
    start(context); // Healthy instances are retained, never initialized twice.
    return status();
}
function status() {
    return Array.from(definitions.keys(), id => ({id, ready: instances.has(id), error: failures.get(id)?.message || null}));
}
window.AjaModular = Object.freeze({register, start, get, open, status, retry, scopeStyle});
})();
