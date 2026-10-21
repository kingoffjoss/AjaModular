// Shared dependencies: UI
window.AjaModular.register('espelho', ['compatibility'], function(ctx) {
    const GROUP='[data-automation-id="message-group"]';
    const TEXT='[data-automation-id="messaging-gadget-message-textbody"]';
    const HEADER='[data-automation-id="message-group-header"]';

    function limparEmojis(texto) {
        return texto.replace(/[\p{Extended_Pictographic}\p{Emoji_Presentation}\uFE0F\u200D\u20E3]/gu,'')
            .replace(/[ \t]+\n/g,'\n').replace(/\n[ \t]+/g,'\n')
            .replace(/\n{3,}/g,'\n\n').trim();
    }

    function extrairMensagens(doc) {
        const grupos=[...doc.querySelectorAll(GROUP)];
        if(!grupos.length)return '';
        const linhas=[];
        for(const grupo of grupos) {
            const mensagens=[...grupo.querySelectorAll(TEXT)]
                .map(el=>limparEmojis(el.innerText||el.textContent||''))
                .filter(Boolean);
            if(!mensagens.length)continue;
            const cabecalho=grupo.querySelector(HEADER);
            const autor=(cabecalho?.innerText||cabecalho?.textContent||'')
                .replace(/Copiar com contexto/gi,'').split('\n')[0]
                .replace(/[|\s]+$/g,'').trim();
            const outbound=/outbound/i.test(cabecalho?.className||'');
            const nome=autor|| (outbound?'Atendente':'Cliente');
            for(const mensagem of mensagens)linhas.push(`${nome}: ${mensagem}`);
        }
        return linhas.join('\n\n');
    }

    function quadroAtual() {
        const quadros=[];
        function visitar(raiz) {
            for(const frame of raiz.querySelectorAll('iframe[src*="messaging-gadget"]')) {
                if(frame.getClientRects().length)quadros.push(frame);
            }
            for(const el of raiz.querySelectorAll('*'))if(el.shadowRoot)visitar(el.shadowRoot);
        }
        visitar(document);
        return quadros[0]||null;
    }

    function pedirAoQuadro(frame) {
        return new Promise(resolve=>{
            const alvo=frame?.contentWindow;
            if(!alvo)return resolve('');
            const id='aja-chat-'+Math.random().toString(36).slice(2);
            let encerrado=false;
            const concluir=texto=>{if(encerrado)return;encerrado=true;clearTimeout(timer);window.removeEventListener('message',receber);resolve(texto||'');};
            const receber=event=>{if(event.source===alvo&&event.origin===location.origin&&event.data?.tipo==='aja-chat-resposta'&&event.data.id===id)concluir(event.data.texto);};
            window.addEventListener('message',receber);
            const timer=setTimeout(()=>concluir(''),1200);
            try {alvo.postMessage({tipo:'aja-chat-pedir',id},location.origin);} catch {concluir('');}
        });
    }

    window.addEventListener('message',event=>{
        if(event.origin!==location.origin||event.data?.tipo!=='aja-chat-pedir'||!event.data.id)return;
        if(!/\/messaging-gadget\//i.test(location.pathname))return;
        event.source?.postMessage({tipo:'aja-chat-resposta',id:event.data.id,texto:extrairMensagens(document)},event.origin);
    });

    window.executarCopiaEspelho=async function() {
        let texto='';
        if(/\/messaging-gadget\//i.test(location.pathname))texto=extrairMensagens(document);
        else {
            const frame=quadroAtual();
            if(frame)texto=await pedirAoQuadro(frame);
        }
        if(!texto) {
            ctx.UI?.createNotification?.('Nenhuma mensagem da conversa aberta foi encontrada.','warn');
            return false;
        }
        try {
            await navigator.clipboard.writeText(texto);
            ctx.UI?.createNotification?.('Conversa copiada sem emojis.','success');
            return true;
        } catch {
            ctx.UI?.createNotification?.('Não foi possível copiar a conversa.','error');
            return false;
        }
    };

    document.addEventListener('keydown',event=>{
        if(event.ctrlKey&&event.shiftKey&&event.code==='KeyC') {
            event.preventDefault();event.stopPropagation();
            window.executarCopiaEspelho();
        }
    });
    return {open(){return window.executarCopiaEspelho();}};
});
