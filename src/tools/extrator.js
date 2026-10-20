// Shared dependencies: none
window.AjaModular.register("extrator", ["compatibility","historico-documentos"], function(ctx) {
    /* --- MÓDULO ANEXADO: EXTRATOR.JS --- */
    try {
        // ==UserScript==
        // @name         Extrator Pro de CPF/CNPJ (V7.4 - Atalho F2)
        // @namespace    http://tampermonkey.net/
        // @version      7.4
        // @description  Varre Iframes e painéis para copiar CPFs/CNPJs pressionando F2.
        // @author       Parceiro de Programacao
        // @match        https://*.mypurecloud.*/*
        // @match        https://*.genesys.cloud/*
        // @grant        GM_setClipboard
        // ==/UserScript==

        (function () {
            'use strict';

            // --- 1. FUNÇÕES AUXILIARES (DEEP SCAN) ---
            function coletarTextos() {
                const fontes=[],vistos=new Set(),raizes=new Set();
                function visitarDocumento(doc,conversa=false) {
                    if(!doc?.body||vistos.has(doc))return;
                    vistos.add(doc);
                    const origem=String(doc.URL||'');
                    const ehConversa=conversa||/\/messaging-gadget\//i.test(origem);
                    const selecionada=doc.querySelector?.('.interaction-content-wrapper, .interaction-content');
                    const textoSelecionado=selecionada?.innerText||selecionada?.textContent||'';
                    if(textoSelecionado.trim())fontes.push({texto:textoSelecionado,prioridade:3,conversa:ehConversa,doc});
                    const texto=doc.body.innerText||doc.body.textContent||'';
                    if(texto.trim())fontes.push({texto,prioridade:ehConversa?2:0,conversa:ehConversa,doc});
                    visitarRaiz(doc,ehConversa);
                }
                function visitarRaiz(raiz,conversa) {
                    if(raizes.has(raiz))return;
                    raizes.add(raiz);
                    for(const iframe of raiz.querySelectorAll('iframe')){
                        try{visitarDocumento(iframe.contentDocument||iframe.contentWindow?.document,conversa||/messaging-gadget/i.test(iframe.getAttribute('src')||''));}
                        catch{} // Quadros de outra origem não podem ser lidos pelo navegador.
                    }
                    for(const elemento of raiz.querySelectorAll('*'))if(elemento.shadowRoot){
                        const texto=[...elemento.shadowRoot.children].map(filho=>filho.innerText||filho.textContent||'').join(' ');
                        if(texto.trim())fontes.push({texto,prioridade:conversa?2:1,conversa});
                        visitarRaiz(elemento.shadowRoot,conversa);
                    }
                }
                visitarDocumento(document);
                return fontes.sort((a,b)=>b.prioridade-a.prioridade);
            }

            // --- 2. VALIDADORES MATEMÁTICOS ---
            function validarCPF(cpf) {
                cpf = cpf.replace(/[^\d]+/g, '');
                if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

                let soma = 0, resto;
                for (let i = 1; i <= 9; i++) soma = soma + parseInt(cpf.substring(i - 1, i)) * (11 - i);
                resto = (soma * 10) % 11;
                if ((resto === 10) || (resto === 11)) resto = 0;
                if (resto !== parseInt(cpf.substring(9, 10))) return false;

                soma = 0;
                for (let i = 1; i <= 10; i++) soma = soma + parseInt(cpf.substring(i - 1, i)) * (12 - i);
                resto = (soma * 10) % 11;
                if ((resto === 10) || (resto === 11)) resto = 0;
                if (resto !== parseInt(cpf.substring(10, 11))) return false;

                return true;
            }

            function validarCNPJ(cnpj) {
                cnpj = cnpj.replace(/[^\d]+/g, '');
                if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;

                let tamanho = cnpj.length - 2;
                let numeros = cnpj.substring(0, tamanho);
                let digitos = cnpj.substring(tamanho);
                let soma = 0;
                let pos = tamanho - 7;

                for (let i = tamanho; i >= 1; i--) {
                    soma += numeros.charAt(tamanho - i) * pos--;
                    if (pos < 2) pos = 9;
                }
                let resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
                if (resultado != digitos.charAt(0)) return false;

                tamanho = tamanho + 1;
                numeros = cnpj.substring(0, tamanho);
                soma = 0;
                pos = tamanho - 7;
                for (let i = tamanho; i >= 1; i--) {
                    soma += numeros.charAt(tamanho - i) * pos--;
                    if (pos < 2) pos = 9;
                }
                resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
                if (resultado != digitos.charAt(1)) return false;

                return true;
            }

            // --- 3. SISTEMA DE BUSCA INTELIGENTE ---
            const regexDoc = /(?<!\d)(?:\d{2}[\s.]?\d{3}[\s.]?\d{3}[\s/]?\d{4}[\s-]?\d{2}|\d{3}[\s.]?\d{3}[\s.]?\d{3}[\s-]?\d{2})(?!\d)/g;
            function buscarNoTexto(textoTotal) {
                const encontrados = [...textoTotal.matchAll(regexDoc)];
                if (!encontrados.length) return null;

                let melhorCandidato = null;
                let maiorPontuacao = -1000;

                encontrados.forEach(encontrado => {
                    const rawDoc = encontrado[0];
                    const docLimpo = rawDoc.replace(/\D/g, '');
                    let ehValido = false;

                    if (docLimpo.length === 11 && validarCPF(docLimpo)) ehValido = true;
                    if (docLimpo.length === 14 && validarCNPJ(docLimpo)) ehValido = true;

                    if (!ehValido) return;

                    let pontos = 0;
                    const index = encontrado.index;
                    const contexto = textoTotal.substring(Math.max(0, index - 60), index + rawDoc.length + 60).toLowerCase();

                    if (contexto.includes('cpf') || contexto.includes('cnpj') || contexto.includes('documento')) pontos += 200;
                    if (contexto.includes('cliente') || contexto.includes('titular')) pontos += 50;
                    if (rawDoc.includes('.') || rawDoc.includes('-')) pontos += 50;

                    if (contexto.includes('tel') || contexto.includes('cel') || contexto.includes('zap') || contexto.includes('contato')) pontos -= 1000;

                    if (contexto.includes('documento:')) pontos += 500;

                    pontos += 5;

                    if (pontos >= maiorPontuacao) {
                        maiorPontuacao = pontos;
                        melhorCandidato = docLimpo;
                    }
                });

                if (melhorCandidato && maiorPontuacao > -500) {
                    return melhorCandidato;
                }
                return null;
            }
            function buscarNasMensagensRecebidas(doc) {
                const grupos=[...doc.querySelectorAll('[data-automation-id="message-group"]')];
                if(!grupos.length)return {encontrouGrupos:false,documento:null};
                const mensagem=grupo=>[...grupo.querySelectorAll('[data-automation-id="messaging-gadget-message-textbody"]')].map(el=>el.innerText||el.textContent||'').join(' ');
                const saiu=grupo=>/outbound/i.test(grupo.querySelector('[data-automation-id="message-group-header"]')?.className||'');
                let ultimoPedido=-1;
                grupos.forEach((grupo,i)=>{if(saiu(grupo)&&/\b(?:cpf|cnpj)\b/i.test(mensagem(grupo)))ultimoPedido=i;});
                for(let i=grupos.length-1;i>ultimoPedido;i--){
                    if(saiu(grupos[i]))continue;
                    const texto=mensagem(grupos[i]);
                    if(![...texto.matchAll(regexDoc)].length)continue;
                    // Um número recente inválido não autoriza copiar um CPF antigo ou de outra conversa.
                    return {encontrouGrupos:true,documento:buscarNoTexto(texto)};
                }
                return {encontrouGrupos:true,documento:null};
            }
            function buscarMelhorDocumento() {
                const fontes=coletarTextos();
                const conversas=fontes.filter(fonte=>fonte.conversa);
                if(conversas.length){
                    const docs=[...new Set(conversas.map(fonte=>fonte.doc).filter(Boolean))];
                    for(const doc of docs){
                        const resultado=buscarNasMensagensRecebidas(doc);
                        if(resultado.encontrouGrupos)return resultado.documento;
                    }
                    for(const fonte of conversas){const documento=buscarNoTexto(fonte.texto);if(documento)return documento;}
                    return null;
                }
                for(const fonte of fontes) {
                    const documento=buscarNoTexto(fonte.texto);
                    if(documento)return documento;
                }
                return null;
            }
            function documentoDesteQuadro() {
                if(/\/messaging-gadget\//i.test(location.pathname))return buscarNasMensagensRecebidas(document).documento;
                if(/\/scripter\//i.test(location.pathname)){
                    const texto=document.body?.innerText||'';
                    const campo=texto.match(/\bDocumento\s*:\s*(?:CPF|CNPJ)?\s*([\d.\-/\s]{11,22})/i);
                    if(campo)return buscarNoTexto(campo[1]);
                }
                return null;
            }
            window.addEventListener('message',event=>{
                if(event.origin!==location.origin||event.data?.tipo!=='aja-documento-pedir'||!event.data.id)return;
                event.source?.postMessage({tipo:'aja-documento-resposta',id:event.data.id,documento:documentoDesteQuadro()},event.origin);
            });
            function quadrosVisiveis() {
                const encontrados=[];
                function visitar(raiz) {
                    for(const quadro of raiz.querySelectorAll('iframe'))if(quadro.getClientRects().length&&/\/(?:messaging-gadget|scripter)\//i.test(quadro.src))encontrados.push(quadro);
                    for(const elemento of raiz.querySelectorAll('*'))if(elemento.shadowRoot)visitar(elemento.shadowRoot);
                }
                visitar(document);
                // O documento exibido pelo script do atendimento é a fonte principal;
                // a conversa serve de alternativa quando esse campo não estiver aberto.
                return encontrados.sort((a,b)=>/\/scripter\//i.test(a.src)?-1:/\/scripter\//i.test(b.src)?1:0);
            }
            function pedirAoQuadro(quadro) {
                return new Promise(resolve=>{
                    const alvo=quadro.contentWindow;
                    if(!alvo)return resolve(null);
                    const id='aja-doc-'+Math.random().toString(36).slice(2);
                    let encerrado=false;
                    const concluir=valor=>{if(encerrado)return;encerrado=true;clearTimeout(timer);window.removeEventListener('message',receber);resolve(valor)};
                    const receber=event=>{if(event.source===alvo&&event.origin===location.origin&&event.data?.tipo==='aja-documento-resposta'&&event.data.id===id)concluir(event.data.documento||null)};
                    window.addEventListener('message',receber);
                    const timer=setTimeout(()=>concluir(null),900);
                    try{alvo.postMessage({tipo:'aja-documento-pedir',id},location.origin)}catch{concluir(null)}
                });
            }
            async function buscarDocumentoNosQuadros() {
                for(const quadro of quadrosVisiveis()){
                    const documento=await pedirAoQuadro(quadro);
                    if(documento)return documento;
                }
                return null;
            }
            async function copiarDocumento(documento) {
                try { await navigator.clipboard.writeText(documento); return true; } catch {}
                const campo=document.createElement('textarea');
                campo.value=documento;
                campo.style.cssText='position:fixed;left:-9999px;top:0;opacity:0';
                document.body.appendChild(campo);
                campo.select();
                let copiado=false;
                try { copiado=document.execCommand('copy'); } catch {}
                campo.remove();
                if(copiado)return true;
                if(typeof GM_setClipboard!=='undefined') { GM_setClipboard(documento); return true; }
                return false;
            }

            // --- 4. EXECUTAR E VISUALIZAR ---
            window.executarExtracaoDocumento = async function () {
                const quadros=quadrosVisiveis();
                const documento = quadros.length ? await buscarDocumentoNosQuadros() : buscarMelhorDocumento();

                if (documento) {
                    const feedbackText = documento.length === 11 ? `CPF: ${documento}` : `CNPJ: ${documento}`;

                    if(await copiarDocumento(documento)) {
                        window.AjaModular.get('historico-documentos').record(documento);
                        mostrarFeedback(`Copiado! ${feedbackText}`, 'sucesso');
                    } else mostrarFeedback("Erro de Clipboard.", 'erro');
                } else {
                    mostrarFeedback("Nenhum CPF/CNPJ válido encontrado.", 'erro');
                }
            };

            function mostrarFeedback(texto, tipo) {
                const id = 'extrator-feedback-box';
                const old = document.getElementById(id);
                if (old) old.remove();

                const div = document.createElement('div');
                div.id = id;
                div.style.cssText = `
            position: fixed; bottom: 50px; left: 50%; transform: translateX(-50%); z-index: 999999;
            padding: 12px 24px; border-radius: 50px; font-family: 'Segoe UI', sans-serif; font-size: 14px; font-weight: 600;
            color: white; box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            background: ${tipo === 'sucesso' ? '#2ecc71' : '#e74c3c'};
            display: flex; align-items: center; gap: 10px;
            animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        `;
                div.innerHTML = `<span>${tipo === 'sucesso' ? '✔' : '✖'}</span> <span>${texto}</span>`;
                document.body.appendChild(div);

                setTimeout(() => {
                    div.style.opacity = '0';
                    div.style.transform = 'translateX(-50%) translateY(20px)';
                    setTimeout(() => div.remove(), 500);
                }, 3000);
            }

            const style = document.createElement('style');
            style.innerHTML = `@keyframes popIn { from { transform: translateX(-50%) scale(0.8); opacity: 0; } to { transform: translateX(-50%) scale(1); opacity: 1; } }`;
            document.head.appendChild(style);

            // --- 5. NOVO ATALHO (Apenas F2) ---
            document.addEventListener('keydown', (e) => {
                // Verifica se a tecla é APENAS o F2
                if (e.key === 'F2') {
                    e.preventDefault(); // Impede o comportamento padrão do navegador
                    e.stopPropagation();
                    window.executarExtracaoDocumento();
                }
            });

            console.log("[Extrator V7.4] Deep Scan Ativado. Pressione F2 para copiar.");

        })();

    } catch (e) { console.error('[BUILDER] Erro fatal no módulo extrator.js:', e); throw e; }



return { open() { return window.executarExtracaoDocumento(); } };
});
