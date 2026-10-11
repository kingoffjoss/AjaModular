(function () {
    'use strict';
    const key = '__AJA_MODULAR_LOADER__';
    if (window[key]) return;
    const documents = new WeakSet();
    const frames = new WeakSet();
    const observers = [];
    const failures = new WeakMap();
    const base = 'https://kingoffjoss.github.io/AjaModular/';
    let timer;
    function scan(win) {
        let doc;
        try { doc = win.document; } catch { return; }
        const mount = doc.head || doc.documentElement;
        if (!mount) return;
        if (!documents.has(doc) && !win.__AJA_MODULAR_RUNTIME__ && (failures.get(doc) || 0) < 3) {
            documents.add(doc);
            const script = doc.createElement('script');
            script.id = 'ajamodular-runtime';
            script.src = base + 'runtime/content.bundle.js?v=1.0.0';
            script.onerror = () => {
                documents.delete(doc); failures.set(doc,(failures.get(doc)||0)+1); script.remove();
                console.warn('[AjaModular] Falha no carregamento. Verifique rede, publicação e CSP.');
            };
            mount.appendChild(script);
            const observer = new MutationObserver(() => {
                clearTimeout(timer); timer=setTimeout(()=>scan(window),400);
            });
            observer.observe(doc.documentElement,{childList:true,subtree:true});
            observers.push(observer);
        }
        for (const frame of doc.querySelectorAll('iframe')) {
            if (!frames.has(frame)) { frames.add(frame); frame.addEventListener('load',()=>scan(win)); }
            if (frame.contentWindow) scan(frame.contentWindow);
        }
    }
    window[key] = {stop(){ observers.forEach(o=>o.disconnect());clearTimeout(timer);delete window[key]; }};
    scan(window);
})();
