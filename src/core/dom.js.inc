    const throttle = (func, limit) => { let inThrottle; return function (...args) { if (!inThrottle) { func.apply(this, args); inThrottle = true; setTimeout(() => inThrottle = false, limit); } }; };
    const formatTime = num => String(num).padStart(2, '0');
    const getBrazilTime = (date) => { try { const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'America/Fortaleza' }; const formatter = new Intl.DateTimeFormat('en-US', options); const parts = formatter.formatToParts(date); const year = parseInt(parts.find(p => p.type === 'year').value); const month = parseInt(parts.find(p => p.type === 'month').value) - 1; const day = parseInt(parts.find(p => p.type === 'day').value); const hour = parseInt(parts.find(p => p.type === 'hour').value); const minute = parseInt(parts.find(p => p.type === 'minute').value); const second = parseInt(parts.find(p => p.type === 'second').value); const brazilDateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`; return new Date(brazilDateString + '-03:00'); } catch (e) { return date; } };

    // --- UTILIDADES GERAIS ---
    const escapeHTML = (str) => {
        if (!str || typeof str !== 'string') return str;
        return str.replace(/[&<>'"]/g,
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    };

    const buildSpellOverlayHTML = (textoOriginal, errosEncontrados) => {
        const texto = String(textoOriginal || '');
        const errosOrdenados = [...(errosEncontrados || [])]
            .sort((a, b) => (b.offset || 0) - (a.offset || 0));

        if (errosOrdenados.length === 0) return escapeHTML(texto);

        let htmlMarcado = '';
        let cursor = texto.length;

        errosOrdenados.forEach(err => {
            let offsetVis = Number(err.offset) || 0;
            let lengthVis = Number(err.length) || 0;
            let classeCSS = 'spell-wavy-error';

            if (lengthVis === 0 && offsetVis > 0) {
                offsetVis -= 1;
                lengthVis = 1;
                classeCSS = 'spell-wavy-punct';
            }

            const start = Math.max(0, Math.min(offsetVis, cursor));
            const end = Math.max(start, Math.min(start + lengthVis, cursor));
            htmlMarcado = escapeHTML(texto.substring(end, cursor)) + htmlMarcado;
            htmlMarcado = `<mark class="${classeCSS}">${escapeHTML(texto.substring(start, end))}</mark>` + htmlMarcado;
            cursor = start;
        });

        return escapeHTML(texto.substring(0, cursor)) + htmlMarcado;
    };

