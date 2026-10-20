(function () {
    'use strict';
    const key = '__AJA_MODULAR_LOADER__';
    const version = '1.6.46';
    if (window[key]?.version === version) { window[key].refresh(); return; }
    window[key]?.stop?.();
    const pending = new WeakSet();
    const observed = new WeakSet();
    const frames = new WeakSet();
    const observers = [];
    const frameListeners = [];
    const failures = new WeakMap();
    const warned = new WeakSet();
    const base = 'https://kingoffjoss.github.io/AjaModular/';
    let timer = null, stopped = false;
    function schedule() {
        if (stopped || timer !== null) return;
        timer = setTimeout(() => { timer = null; scan(window); }, 200);
    }
    function scan(win) {
        if (stopped) return;
        let doc;
        try { doc = win.document; } catch {
            if (!warned.has(win)) { warned.add(win); console.warn('[AjaModular] Quadro inacessível pelas regras do navegador; carregamento automático indisponível nesse quadro.'); }
            return;
        }
        if (!doc?.documentElement) return;
        // Wait for the editor document body; its navigation may replace about:blank.
        if (doc.body && !pending.has(doc) && !win.__AJA_MODULAR_RUNTIME__ && (failures.get(doc) || 0) < 3) {
            pending.add(doc);
            const script = doc.createElement('script');
            script.id = 'ajamodular-runtime';
            script.src = base + 'runtime/content.bundle.js?v=1.6.46';
            script.onerror = () => {
                pending.delete(doc); failures.set(doc, (failures.get(doc) || 0) + 1); script.remove();
                console.warn('[AjaModular] Falha no carregamento do quadro. Verifique rede e CSP.');
                schedule();
            };
            script.onload = () => pending.delete(doc);
            (doc.head || doc.documentElement).appendChild(script);
        }
        scanRoot(doc);
    }
    function scanRoot(root) {
        if (stopped) return;
        if (!observed.has(root)) {
            observed.add(root);
            const observer = new MutationObserver(schedule);
            observer.observe(root.documentElement || root, {childList:true, subtree:true, attributes:true, attributeFilter:['src','srcdoc']});
            observers.push(observer);
        }
        for (const frame of root.querySelectorAll('iframe')) {
            if (frame.hasAttribute?.('data-aja-evaluation-reader')) continue;
            if (!frames.has(frame)) {
                frames.add(frame);
                const onload = () => { if (frame.contentWindow) scan(frame.contentWindow); };
                frame.addEventListener('load', onload);
                frameListeners.push([frame,onload]);
            }
            try { if (frame.contentWindow) scan(frame.contentWindow); }
            catch (error) { console.warn('[AjaModular] Falha ao examinar um quadro:', error.name); }
        }
            // Genesys puts the messaging iframe in an open APP-VIEW-STACK shadow root.
        // querySelectorAll and document observers do not cross this boundary.
        for (const host of root.querySelectorAll('*')) {
            if (host.shadowRoot) scanRoot(host.shadowRoot);
        }
    }
    // A document can be replaced without a parent DOM mutation. Reconcile periodically,
    // including after the tab resumes, while retaining one runtime per document.
    const reconcile = setInterval(schedule, 2000);
    window.addEventListener('pageshow', schedule);
    document.addEventListener('visibilitychange', schedule);
    window[key] = {
        version,
        refresh(){ scan(window); },
        stop(){ stopped=true; observers.forEach(o=>o.disconnect()); frameListeners.forEach(([f,l])=>f.removeEventListener('load',l)); clearTimeout(timer); clearInterval(reconcile); window.removeEventListener('pageshow', schedule); document.removeEventListener('visibilitychange', schedule); delete window[key]; }
    };
    scan(window);
})();

