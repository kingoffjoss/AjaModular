window.AjaModular.register('avaliacoes', [], function () {
    'use strict';
    const model=window.AjaEvaluationModel;
    let selectedRange=null;
    let panel=null, timer=null, running=false, cancelled=false, records=[], day='', lastUpdate=null, message='Pronto para consultar Hoje.', frames=[];
    const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const percent=value=>value===null?'Sem dados':value.toLocaleString('pt-BR',{maximumFractionDigits:1})+'%';
    const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
    function deep(root,selector) {
        const all=[...root.querySelectorAll(selector)];
        for(const e of root.querySelectorAll('*'))if(e.shadowRoot)all.push(...deep(e.shadowRoot,selector));
        return all;
    }
    let reader=null;
    const storageKey='ajamodular:avaliacoes:agent';
    function frame(url) {
        if(!reader || reader.closed)throw Error('Abra a aba de consulta pelo botão Conectar e atualizar.');
        reader.location.href=url;
        return reader;
    }
    function roots(win) {
        const docs=[];
        function visit(w){try{const d=w.document;if(!d?.body)return;docs.push(d);for(const f of deep(d,'iframe'))if(f.contentWindow)visit(f.contentWindow);}catch{}}
        visit(win);return docs;
    }
    function nodes(win,selector){return roots(win).flatMap(d=>deep(d,selector));}
    function connect(){
        if(!reader || reader.closed)reader=window.open('about:blank','AjaModularAvaliacoesConsulta');
        if(!reader){message='Permita a abertura da aba de consulta para continuar.';render();return;}
        refresh();
    }
    async function until(fn,timeout=20000) {
        const deadline=Date.now()+timeout;
        while(Date.now()<deadline){if(cancelled)throw Error('Consulta pausada.');if(reader?.closed)throw Error('A aba de consulta foi fechada. Clique em Conectar e atualizar.');try{const value=fn();if(value)return value;}catch(e){if(e.name==='SecurityError')throw Error('O navegador bloqueou a leitura da tela.');throw e;}await wait(350);}
        throw Error('A tela não carregou a tempo. A contagem está incompleta.');
    }
    function removeFrame(el){} // Reuse the authenticated reader tab between requests.
    function parseDate(text) {
        const months=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
        const m=String(text).match(/(\d{1,2}) de (\S+) de (\d{4}) às (\d{2}):(\d{2}):(\d{2})/);
        if(!m||!months.includes(m[2]))return null;
        return Date.parse(`${m[3]}-${String(months.indexOf(m[2])+1).padStart(2,'0')}-${m[1].padStart(2,'0')}T${m[4]}:${m[5]}:${m[6]}-03:00`);
    }
    async function listToday(range) {
        const params=new URLSearchParams({start:range.start,end:range.end,mediaType:'all'});
        const el=frame(location.origin+'/directory/#/analytics/agents/interactions/me?'+params);
        const result=new Map();
        try {
            let previous='',firstPage=true;
            for(let page=0;page<100;page++) {
                const rows=await until(()=>{
                    const docs=roots(el).filter(d=>d.URL.includes('/analytics-ui/') && d.URL.includes('/agents/interactions/me'));
                    const correct=docs.filter(d=>{const p=new URLSearchParams(d.URL.split('?')[1]||'');return Date.parse(p.get('start'))===Date.parse(range.start)&&Date.parse(p.get('end'))===Date.parse(range.end);});
                    if(!correct.length)return null;
                    if(firstPage){const first=correct.flatMap(d=>deep(d,'button[title="Primeira página"]'))[0];if(first&&!first.disabled){firstPage=false;first.click();return null;}firstPage=false;}
                    if(correct.some(d=>deep(d,'.gux-empty-table-message').some(e=>e.textContent.trim()==='Não há dados disponíveis'&&e.getClientRects().length)))return {rows:[],key:'empty'};
                    const rows=correct.flatMap(d=>deep(d,'tbody tr')).filter(r=>r.querySelector('td.column-conversationId'));
                    const key=rows.map(r=>r.querySelector('td.column-conversationId').textContent.trim()).join('|');
                    return rows.length && key!==previous?{rows,key}:null;
                });
                previous=rows.key;
                if(!rows.rows.length)return [...result.values()];
                for(const row of rows.rows) {
                    const id=row.querySelector('td.column-conversationId').textContent.match(/[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}/i)?.[0];
                    if(!id)continue;
                    const text=cls=>row.querySelector('td.column-'+cls)?.textContent.trim()||'';
                    result.set(id,{id,name:text('remote'),date:text('date'),queue:text('queue'),agents:text('users')});
                }
                const next=nodes(el,'button[title="Próxima página"]')[0];
                if(!next)throw Error('Não foi possível confirmar a paginação.');
                if(next.disabled||next.getAttribute('aria-disabled')==='true')return [...result.values()];
                next.click();
            }
            throw Error('A consulta atingiu o limite de páginas; resultado incompleto.');
        } finally {removeFrame(el);}
    }
    async function details(item) {
        const el=frame(location.origin+'/directory/#/analytics/interactions/'+item.id+'/admin');
        try {
            let stable='',samples=0;
            const values=await until(()=>{
                const docs=roots(el).filter(d=>d.URL.includes('/interaction-details-ui/') && d.URL.includes(item.id));
                if(!docs.length)return null;
                const collapsed=docs.flatMap(d=>deep(d,'[role="button"][aria-label="Expandir participante"][aria-expanded="false"]'));
                if(collapsed.length){collapsed.forEach(e=>e.click());return null;}
                const rows=docs.flatMap(d=>deep(d,'.details-row'));
                if(!rows.some(r=>r.querySelector('.details-header')?.textContent.trim()==='Hora de término'))return null;
                const allowed=new Set(['pesquisa','pesquisa_humano','DataPesquisa','userIdPesquisa','UserPesqAtribuida','Hora de término']);
                const values={};
                for(const row of rows){const key=row.querySelector('.details-header')?.textContent.trim();if(allowed.has(key)){const value=row.querySelector('.details-value')?.textContent.trim()||'';if(values[key]&&value&&values[key]!==value)throw Error('Há atribuições ou respostas conflitantes nesta interação.');values[key]=value;}}
                const signature=JSON.stringify(values);
                if(signature!==stable){stable=signature;samples=0;return null;}
                if(++samples<2)return null;
                if(values.userIdPesquisa&&values.UserPesqAtribuida&&values.userIdPesquisa!==values.UserPesqAtribuida)throw Error('A atribuição da pesquisa é ambígua.');
                return values;
            });
            return {...item,rating:values.pesquisa_humano||'',resolved:values.pesquisa||'',surveyDate:values.DataPesquisa||'',assignedTo:values.userIdPesquisa||values.UserPesqAtribuida||'',endedAt:parseDate(values['Hora de término'])};
        }finally{removeFrame(el);}
    }
    function render() {
        if(!panel)return;
        const agentId=panel.querySelector('[data-agent]').value.trim();
        const own=records.filter(r=>agentId && r.assignedTo===agentId);
        const s=model.summarize(own),answered=own.filter(r=>model.status(r)==='respondida');
        panel.querySelector('[data-status]').textContent=message;
        panel.querySelector('[data-last]').textContent=lastUpdate?'Última atualização: '+new Date(lastUpdate).toLocaleTimeString('pt-BR',{timeZone:'America/Fortaleza'}):'Ainda não atualizado';
        panel.querySelector('[data-cards]').innerHTML=[['Pesquisas respondidas',s.answered],['CSAT · notas 4 e 5',percent(s.csat)],['Índice de resolução',percent(s.ir)],['Aguardando · até 15 min',s.pending],['Não avaliados · após 15 min',s.unanswered],['Sem horário confirmado',s.unknownEnd],['Falhas na consulta',records.filter(r=>r.error).length]].map(([label,value])=>`<div class="av-card"><span>${label}</span><strong>${value}</strong></div>`).join('');
        panel.querySelector('[data-base]').textContent=`CSAT: ${s.positive}/${s.ratings} notas válidas. Resolução: ${s.yes}/${s.resolutions} respostas Sim/Não. ${s.total} interações atribuídas ao agente. ${records.length-own.length} interações fora do cálculo por atribuição diferente ou ausente.`;
        panel.querySelector('[data-bars]').innerHTML=['Péssimo (0–1)','Ruim (2)','Neutro (3)','Bom (4)','Ótimo (5)'].map((label,i)=>`<div>${label}<progress max="${Math.max(1,s.ratings)}" value="${s.distribution[i]}"></progress><b>${s.distribution[i]}</b></div>`).join('');
        panel.querySelector('tbody').innerHTML=answered.map(r=>`<tr><td>${escape(r.name||'Cliente')}<small>${escape(r.id)}</small></td><td>${escape(r.date)}</td><td>${escape(r.queue)}</td><td>${escape(r.rating||'Não respondeu')}</td><td>${escape(r.resolved||'Não respondeu')}</td><td><a target="_blank" rel="noopener noreferrer" href="${location.origin}/directory/#/analytics/interactions/${r.id}/admin">Abrir</a></td></tr>`).join('');
        panel.querySelector('[data-empty]').hidden=answered.length>0;
        panel.querySelector('[data-refresh]').disabled=running;
        panel.querySelector('[data-toggle]').disabled=running && !timer;
        panel.querySelectorAll('[data-from],[data-to],[data-apply],[data-today],[data-agent],[data-identify]').forEach(el=>el.disabled=running);
        panel.querySelector('[data-toggle]').textContent=timer?'Pausar atualização':'Ativar a cada 2 minutos';
    }
    async function refresh() {
        if(running)return;
        if(!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(panel.querySelector('[data-agent]').value.trim())){message='Informe seu ID de agente, conforme userIdPesquisa em uma avaliação sua. Nenhum indicador será calculado sem confirmar a atribuição.';render();return;}
        running=true;cancelled=false;
        const range=selectedRange||model.today();if(day!==range.key){records=[];lastUpdate=null;day=range.key;}
        panel.querySelector('[data-period]').textContent=selectedRange ? range.first.split('-').reverse().join('/')+' a '+range.last.split('-').reverse().join('/') : 'Hoje';
        message='Buscando interações do período selecionado…';render();
        try {
            const items=await listToday(range);
            const previous=new Map(records.map(r=>[r.id,r]));const collected=[];
            for(let i=0;i<items.length;i++) {
                if(cancelled)throw Error('Consulta pausada.');
                message=`Consultando avaliações: ${i+1} de ${items.length}…`;render();
                try{collected.push(await details(items[i]));}catch(error){if(cancelled)throw error;collected.push({...previous.get(items[i].id),...items[i],error:error.message});}
            }
            records=collected;lastUpdate=Date.now();message=records.some(r=>r.error)?'Consulta parcial: algumas interações falharam.':'Consulta concluída.';
        }catch(error){message=error.message;}finally{running=false;render();}
    }
    function toggle() {
        if(timer){clearInterval(timer);timer=null;cancelled=true;message='Atualização pausada.';}
        else{timer=setInterval(refresh,120000);if(reader&&!reader.closed)refresh();else message='Vincule seu agente e clique em Conectar e atualizar. A consulta repete a cada 2 minutos.';}
        render();
    }
    function open() {
        if(panel){panel.hidden=false;render();return;}
        panel=document.createElement('section');panel.id='aja-avaliacoes';
        panel.innerHTML=`<style>#aja-avaliacoes{position:fixed;inset:5vh 4vw;z-index:2147483640;background:#102a43;color:#eef7ff;border:1px solid #4797cf;border-radius:14px;box-shadow:0 20px 60px #0008;font:14px system-ui;overflow:auto;padding:18px}#aja-avaliacoes[hidden]{display:none}#aja-avaliacoes header{display:flex;justify-content:space-between;gap:12px;align-items:center}#aja-avaliacoes button{background:#005bbb;border:1px solid #4995cb;color:white;padding:8px 12px;border-radius:7px;cursor:pointer}#aja-avaliacoes [data-cards]{display:flex;flex-wrap:wrap;gap:10px;margin:16px 0}#aja-avaliacoes .av-card{background:#193e60;border-radius:9px;padding:14px;flex:1;min-width:130px}#aja-avaliacoes strong{display:block;font-size:26px}#aja-avaliacoes small{display:block;font-size:10px}#aja-avaliacoes table{border-collapse:collapse;width:100%}#aja-avaliacoes th,#aja-avaliacoes td{text-align:left;padding:10px;border-bottom:1px solid #38617e}#aja-avaliacoes a{color:#83d8ff}#aja-avaliacoes [data-bars]>div{display:flex;gap:12px;align-items:center;margin:7px 0}#aja-avaliacoes progress{flex:1}#aja-avaliacoes .av-scroll{overflow:auto}#aja-avaliacoes button:disabled{opacity:.5}</style><header><h2>Avaliações de clientes · <span data-period>Hoje</span></h2><button data-close aria-label="Fechar avaliações">×</button></header><p>Pesquisas encontradas em Minhas interações. Somente pesquisas atribuídas ao agente vinculado entram nos indicadores. A aba auxiliar deve ficar aberta para a atualização automática.</p><label>Seu ID de agente (userIdPesquisa de uma avaliação sua) <input data-agent autocomplete="off" placeholder="ID do agente"></label><button data-identify>Vincular minha avaliação aberta</button><fieldset><legend>Período de início dos atendimentos · horário de Fortaleza</legend><label>De <input type="date" data-from></label> <label>Até <input type="date" data-to></label> <button data-apply>Consultar período</button> <button data-today>Hoje</button></fieldset><button data-refresh>Conectar e atualizar</button> <button data-toggle></button><p data-status role="status"></p><small data-last></small><div data-cards></div><p data-base></p><div data-bars></div><h3>Clientes que avaliaram</h3><p data-empty>Nenhuma avaliação carregada.</p><div class="av-scroll"><table><thead><tr><th>Cliente / interação</th><th>Início</th><th>Fila</th><th>CSAT</th><th>Resolvido</th><th>Detalhes</th></tr></thead><tbody></tbody></table></div>`;
        document.body.append(panel);
        try{panel.querySelector('[data-agent]').value=localStorage.getItem(storageKey)||'';}catch{}
        panel.querySelector('[data-agent]').onchange=()=>{try{localStorage.setItem(storageKey,panel.querySelector('[data-agent]').value.trim());}catch{}render();};
        panel.querySelector('[data-identify]').onclick=()=>{
            const values=nodes(window,'.details-row').filter(row=>['userIdPesquisa','UserPesqAtribuida'].includes(row.querySelector('.header-text')?.textContent.trim())).map(row=>row.querySelector('.details-value')?.textContent.trim()).filter(Boolean);
            const unique=[...new Set(values)];
            if(unique.length!==1){message='Abra os detalhes de uma pesquisa enviada por você e tente novamente. A atribuição precisa ser única.';render();return;}
            panel.querySelector('[data-agent]').value=unique[0];panel.querySelector('[data-agent]').onchange();
            message='Agente vinculado. Clique em Conectar e atualizar.';render();
        };

        const today=model.today().day;
        panel.querySelector('[data-from]').value=today;panel.querySelector('[data-to]').value=today;
        panel.querySelector('[data-apply]').onclick=()=>{
            if(running)return;
            try{selectedRange=model.dateRange(panel.querySelector('[data-from]').value,panel.querySelector('[data-to]').value);}
            catch(error){message=error.message;render();return;}
            records=[];lastUpdate=null;day='';
            panel.querySelector('[data-period]').textContent=selectedRange.first.split('-').reverse().join('/')+' a '+selectedRange.last.split('-').reverse().join('/');
            refresh();
        };
        panel.querySelector('[data-today]').onclick=()=>{
            if(running)return;
            selectedRange=null;records=[];lastUpdate=null;day='';
            panel.querySelector('[data-from]').value=model.today().day;panel.querySelector('[data-to]').value=model.today().day;
            panel.querySelector('[data-period]').textContent='Hoje';refresh();
        };
        panel.querySelector('[data-close]').onclick=()=>{panel.hidden=true;};
        panel.querySelector('[data-refresh]').onclick=connect;panel.querySelector('[data-toggle]').onclick=toggle;
        toggle();
    }
    return {open};
});
