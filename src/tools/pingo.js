// Integra a distribuição original do Pingo 282.0 sem alterar seu código.
window.AjaModular.register('pingo', ['menu'], function () {
    if (window.self !== window.top) return { open() {} };
    let loading = null;

    function open() {
        const existing = document.getElementById('pingo-flutuante');
        if (existing) {
            existing.dispatchEvent(new Event('pingo-toggle'));
            return Promise.resolve(existing);
        }
        if (loading) return loading;
        loading = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://kingoffjoss.github.io/AjaModular/runtime/pingo-flutuante.js?v=282.0';
            script.onload = () => {
                const root = document.getElementById('pingo-flutuante');
                if (root) resolve(root);
                else reject(new Error('O Pingo não iniciou nesta página.'));
                script.remove();
            };
            script.onerror = () => {
                script.remove();
                reject(new Error('Não foi possível carregar o Pingo.'));
            };
            document.documentElement.appendChild(script);
        }).catch(error => {
            console.error('[AjaModular] Pingo:', error);
            window.AjaModularNotice?.(error.message);
            return null;
        }).finally(() => { loading = null; });
        return loading;
    }

    return { open };
});
