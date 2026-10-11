(function () {
'use strict';
const definitions = new Map(), instances = new Map(), failures = new Map();
let context;
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
            const instance = definition.factory(context) || {};
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
    } catch (error) { console.error('[AjaModular] ' + id, error); }
}
function status() {
    return Array.from(definitions.keys(), id => ({id, ready: instances.has(id), error: failures.get(id)?.message || null}));
}
window.AjaModular = Object.freeze({register, start, get, open, status});
})();
