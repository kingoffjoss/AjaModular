(function () {
    'use strict';
    const key = '__AJA_MODULAR_LOADER__';
    if (window[key]) { window[key].refresh?.(); return; }
    const pending = new WeakSet();
    const observed = new WeakSet();
    const frames = new WeakSet();
    const observers = [];
    const frameListeners = [];
    const failures = new WeakMap();
    const base = 'https://kingoffjoss.github.io/AjaModular/';
    let timer = null, stopped = false;
    function schedule() {
        if (stopped || timer !== null) return;
        timer = setTimeout(() => { timer = null; scan(window); }, 200);
    }
    function scan(win) {
        if (stopped) return;
        let doc;
        try { doc = win.document; } catch { return; }
        if (!doc?.documentElement) return;
        if (!observed.has(doc)) {
            observed.add(doc);
            const observer = new MutationObserver(schedule);
            observer.observe(doc.documentElement, {childList:true, subtree:true, attributes:true, attributeFilter:['src','srcdoc']});
            observers.push(observer);
        }
        // Wait for the editor document body; its navigation may replace about:blank.
        if (doc.body && !pending.has(doc) && !win.__AJA_MODULAR_RUNTIME__ && (failures.get(doc) || 0) < 3) {
            pending.add(doc);
            const script = doc.createElement('script');
            script.id = 'ajamodular-runtime';
            script.src = base + 'runtime/content.bundle.js?v=1.6.6';
            script.onerror = () => {
                pending.delete(doc); failures.set(doc, (failures.get(doc) || 0) + 1); script.remove();
                console.warn('[AjaModular] Falha no carregamento do quadro. Verifique rede e CSP.');
                schedule();
            };
            script.onload = () => pending.delete(doc);
            (doc.head || doc.documentElement).appendChild(script);
        }
        for (const frame of doc.querySelectorAll('iframe')) {
            if (!frames.has(frame)) {
                frames.add(frame);
                const onload = () => { if (frame.contentWindow) scan(frame.contentWindow); };
                frame.addEventListener('load', onload);
                frameListeners.push([frame,onload]);
            }
            if (frame.contentWindow) scan(frame.contentWindow);
        }
    }
    window[key] = {
        refresh(){ scan(window); },
        stop(){ stopped=true; observers.forEach(o=>o.disconnect()); frameListeners.forEach(([f,l])=>f.removeEventListener('load',l)); clearTimeout(timer); delete window[key]; }
    };
    scan(window);
})();
