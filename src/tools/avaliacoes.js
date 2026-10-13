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
    function identifyAgent(docs){
        const ids=[...new Set(docs.flatMap(d=>deep(d,'a[href]')).map(a=>a.getAttribute('href').match(/#\/person\/([a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12})(?:[/?#]|$)/i)?.[1]).filter(Boolean))];
        if(ids.length!==1)return false;
        panel.querySelector('[data-agent]').value=ids[0];
        panel.querySelector('[data-agent]').onchange();
        return true;
    }
    function listUrl(range){
        return location.origin+'/directory/#/analytics/agents/interactions/me?'+new URLSearchParams({start:range.start,end:range.end,mediaType:'all'});
    }
    function connect(){
        if(running)return;
        if(!reader || reader.closed)reader=window.open(listUrl(selectedRange||model.today()),'AjaModularAvaliacoesConsulta');
        if(!reader){message='Permita a abertura da aba de consulta para continuar.';render();return;}
        refresh();
    }
    async function until(fn,timeout=45000) {
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
        const el=frame(listUrl(range));
        const result=new Map();
        try {
            let previous='',firstPage=true,emptySince=0,stableKey='',stableSince=0;
            for(let page=0;page<100;page++) {
                const rows=await until(()=>{
                    const docs=roots(el).filter(d=>d.URL.includes('/analytics-ui/') && d.URL.includes('/agents/interactions/me'));
                    const correct=docs.filter(d=>{const p=new URLSearchParams(d.URL.split('?')[1]||'');return Date.parse(p.get('start'))===Date.parse(range.start)&&Date.parse(p.get('end'))===Date.parse(range.end);});
                    if(!correct.length)return null;
                    if(!identifyAgent(correct))return null;
                    if(correct.some(d=>deep(d,'[aria-busy="true"], [role="progressbar"]').some(e=>e.getClientRects().length && e.ownerDocument.defaultView.getComputedStyle(e).visibility==='visible'))){emptySince=0;stableKey='';return null;}
                    if(firstPage){const first=correct.flatMap(d=>deep(d,'button[title="Primeira página"]'))[0];if(first&&!first.disabled){firstPage=false;first.click();return null;}firstPage=false;}
                    const rows=correct.flatMap(d=>deep(d,'tbody tr')).filter(r=>r.querySelector('td.column-conversationId'));
                    const key=rows.map(r=>r.querySelector('td.column-conversationId').textContent.trim()).join('|');
                    if(rows.length){
                        emptySince=0;
                        if(key===previous)return null;
                        if(key!==stableKey){stableKey=key;stableSince=Date.now();return null;}
                        return Date.now()-stableSince>=700?{rows,key}:null;
                    }
                    stableKey='';
                    const empty=correct.some(d=>deep(d,'.gux-empty-table-message').some(e=>e.textContent.trim()==='Não há dados disponíveis'&&e.getClientRects().length));
                    if(!empty){emptySince=0;return null;}
                    if(!emptySince)emptySince=Date.now();
                    return Date.now()-emptySince>=5000?{rows:[],key:'empty'}:null;
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
    async function timing(item){
        const docs=()=>roots(reader).filter(d=>d.URL.includes('/interaction-details-ui/')&&d.URL.includes(item.id));
        const tab=await until(()=>docs().flatMap(d=>deep(d,'[role="tab"]')).find(e=>e.textContent.trim()==='Cronograma'));
        tab.click();
        let last='',since=0;
        const segments=await until(()=>{
            const nodes=docs().flatMap(d=>deep(d,'.segment-item'));
            if(!nodes.length)return null;
            const data=nodes.map(e=>({id:e.id,group:e.getAttribute('group')||'',purpose:e.getAttribute('purpose'),type:e.getAttribute('segmenttype'),start:e.hasAttribute('startms')?Number(e.getAttribute('startms')):NaN,end:e.hasAttribute('endms')?Number(e.getAttribute('endms')):NaN}));
            const key=JSON.stringify(data);if(key!==last){last=key;since=Date.now();return null;}
            return Date.now()-since>=700?data:null;
        });
        return model.agentTimes(segments,panel.querySelector('[data-agent]').value.trim());
    }
    function render() {
        if(!panel)return;
        const agentId=panel.querySelector('[data-agent]').value.trim();
        const own=records.filter(r=>agentId && r.assignedTo===agentId);
        const times=model.timeSummary(records);
        const s=model.summarize(own),answered=own.filter(r=>model.status(r)==='respondida');
        panel.querySelector('[data-status]').textContent=message;
        panel.querySelector('[data-last]').textContent=lastUpdate?'Última atualização: '+new Date(lastUpdate).toLocaleTimeString('pt-BR',{timeZone:'America/Fortaleza'}):'Ainda não atualizado';
        panel.querySelector('[data-cards]').innerHTML=[['Respondidas',s.answered],['CSAT · notas 4 e 5',percent(s.csat)],['Resolução',percent(s.ir)],['TMA · sua etapa',model.formatTime(times.handle.value)],['TME · fila da sua etapa',model.formatTime(times.wait.value)],['Aguardando · 15 min',s.pending],['Não avaliados',s.unanswered],['Sem horário confirmado',s.unknownEnd],['Falhas na consulta',records.filter(r=>r.error).length]].map(([label,value])=>`<div class="av-card"><span>${label}</span><strong>${value}</strong></div>`).join('');
        panel.querySelector('[data-time-base]').textContent=`Tempos de todas as interações consultadas, com ou sem avaliação. TMA: ${times.handle.count}/${records.length}. TME: ${times.wait.count}/${records.length}. Valores ausentes ou ambíguos não entram na média.`;
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
                try{let value;try{value=await details(items[i]);}catch(error){if(cancelled)throw error;await wait(700);value=await details(items[i]);}collected.push(value);}catch(error){if(cancelled)throw error;collected.push({...previous.get(items[i].id),...items[i],error:error.message});}
                try{Object.assign(collected[collected.length-1],await timing(items[i]));}catch(error){if(cancelled)throw error;Object.assign(collected[collected.length-1],{handleMs:null,waitMs:null,timingError:error.message});}
            }
            records=collected;lastUpdate=Date.now();message=records.some(r=>r.error||r.timingError)?'Consulta parcial: algumas interações falharam.':'Consulta concluída.';
        }catch(error){message=error.message;}finally{running=false;render();}
    }
    function toggle() {
        if(timer){clearInterval(timer);timer=null;cancelled=true;message='Atualização pausada.';}
        else{timer=setInterval(refresh,120000);connect();}
        render();
    }
    function open() {
        if(panel){panel.hidden=false;if(!timer)toggle();else connect();render();return;}
        panel=document.createElement('section');panel.id='aja-avaliacoes';
        panel.innerHTML=`<style>
#aja-avaliacoes{position:fixed;inset:72px 24px auto auto;width:min(620px,calc(100vw - 24px));max-height:calc(100vh - 96px);z-index:2147483640;background:#102a47;color:#edf5ff;border:1px solid #ff8200;border-radius:13px;box-shadow:0 14px 38px #00152d66;font:12px/1.45 'Segoe UI',sans-serif;overflow:hidden;display:flex;flex-direction:column}
#aja-avaliacoes[hidden],#aja-avaliacoes [hidden]{display:none!important}
#aja-avaliacoes *{box-sizing:border-box}
#aja-avaliacoes header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 14px;background:linear-gradient(110deg,#005bbb 15%,#0878bc 48%,#ff8200);flex-shrink:0;color:white}
#aja-avaliacoes h2{margin:0;font:700 15px 'Segoe UI',sans-serif;color:inherit}
#aja-avaliacoes header small{display:block;font-size:11px;opacity:.9;margin-top:2px}
#aja-avaliacoes button{border:1px solid #3872a3;border-radius:7px;padding:6px 10px;background:#173b63;color:#fff;font:600 11px 'Segoe UI',sans-serif;cursor:pointer;min-height:29px}
#aja-avaliacoes button:hover{background:#225583}
#aja-avaliacoes button:focus-visible,#aja-avaliacoes input:focus-visible,#aja-avaliacoes summary:focus-visible{outline:2px solid #ffb04b;outline-offset:2px}
#aja-avaliacoes [data-refresh],#aja-avaliacoes [data-apply]{background:linear-gradient(120deg,#005bbb 35%,#ff8200);border-color:#ff9b32}
#aja-avaliacoes [data-close]{width:28px;height:28px;min-height:28px;padding:0;font-size:19px;background:#005bbb;border-color:#ffffff55}
#aja-avaliacoes button:disabled{opacity:.5;cursor:default}
#aja-avaliacoes .av-body{padding:12px;overflow:auto;min-height:0;scrollbar-width:thin;scrollbar-color:#427aa5 #102a47}
#aja-avaliacoes .av-filters{display:flex;flex-wrap:wrap;align-items:end;gap:7px;margin-bottom:10px}
#aja-avaliacoes label{display:grid;gap:3px;font-size:10px;color:#b8cee2}
#aja-avaliacoes input{min-width:0;max-width:100%;padding:5px 7px;background:#173b63;color:#fff;border:1px solid #38678f;border-radius:6px;font:12px 'Segoe UI',sans-serif;color-scheme:dark;min-height:29px}
#aja-avaliacoes .av-actions{display:flex;flex-wrap:wrap;align-items:center;gap:6px}
#aja-avaliacoes [data-last]{font-size:10px;color:#a6c1db;margin-left:auto}
#aja-avaliacoes [data-status]{font-size:11px;color:#bfd6e9;margin:8px 0 10px;overflow-wrap:anywhere}
#aja-avaliacoes [data-cards]{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:7px;margin-bottom:10px}
#aja-avaliacoes .av-card{grid-column:span 3;border-radius:8px;padding:8px;background:#153755;border:1px solid #284f72;min-width:0}
#aja-avaliacoes .av-card:nth-child(-n+3){grid-column:span 4;border-top:2px solid #ff8200;background:#173b63;padding:10px}
#aja-avaliacoes .av-card:nth-child(4),#aja-avaliacoes .av-card:nth-child(5){grid-column:span 6;border-left:2px solid #ff8200}
#aja-avaliacoes .av-card span{display:block;font-size:10px;color:#bfd6e9}
#aja-avaliacoes .av-card strong{display:block;font-size:17px;line-height:1.2;margin-top:4px;color:#f1f7ff}
#aja-avaliacoes .av-card:nth-child(-n+3) strong{font-size:25px}
#aja-avaliacoes details{border:1px solid #284f72;border-radius:8px;margin:8px 0;background:#112e4d}
#aja-avaliacoes summary{padding:8px 10px;cursor:pointer;font-weight:600;color:#c8ddf0;font-size:11px}
#aja-avaliacoes details .av-detail{padding:0 10px 10px}
#aja-avaliacoes .av-account{display:flex;align-items:end;flex-wrap:wrap;gap:7px}
#aja-avaliacoes .av-account label{flex:1;min-width:160px}
#aja-avaliacoes details p{margin:7px 0;color:#a6c1db;font-size:10px}
#aja-avaliacoes [data-bars]>div{display:flex;gap:10px;align-items:center;margin:6px 0;font-size:11px}
#aja-avaliacoes progress{flex:1;height:7px;accent-color:#ff9500;min-width:20px}
#aja-avaliacoes h3{font-size:12px;margin:14px 0 8px;color:#edf5ff}
#aja-avaliacoes .av-scroll{max-height:210px;overflow:auto;border:1px solid #284f72;border-radius:8px;scrollbar-width:thin;scrollbar-color:#427aa5 #102a47}
#aja-avaliacoes table{border-collapse:collapse;width:100%;font-size:11px}
#aja-avaliacoes th{position:sticky;top:0;background:#173b63;color:#abc9e3;font-size:10px;font-weight:600;white-space:nowrap}
#aja-avaliacoes th,#aja-avaliacoes td{padding:7px 8px;text-align:left;border-bottom:1px solid #284f72}
#aja-avaliacoes td small{display:block;font-size:9px;color:#8daec9;max-width:135px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#aja-avaliacoes a{color:#8ed4ff;text-decoration:none;white-space:nowrap}
#aja-avaliacoes a:hover{text-decoration:underline}
#aja-avaliacoes [data-empty]{padding:14px;text-align:center;color:#91b1cc;border:1px dashed #38678f;border-radius:8px;font-size:11px}
@media(max-width:440px){#aja-avaliacoes{inset:60px 12px auto auto;max-height:calc(100vh - 72px)}#aja-avaliacoes .av-card{grid-column:span 6}#aja-avaliacoes .av-card:nth-child(-n+3){grid-column:span 4;padding:7px}#aja-avaliacoes .av-card:nth-child(-n+3) strong{font-size:21px}#aja-avaliacoes [data-last]{margin-left:0;flex-basis:100%}}
</style>
<header><div><h2>▥ Avaliações</h2><small data-period>Hoje</small></div><button data-close aria-label="Fechar avaliações">×</button></header>
<div class="av-body">
<div class="av-filters"><label>De<input type="date" data-from></label><label>Até<input type="date" data-to></label><button data-apply>Filtrar</button><button data-today>Hoje</button></div>
<div class="av-actions"><button data-refresh>Atualizar agora</button><button data-toggle></button><small data-last></small></div>
<p data-status role="status"></p><div data-cards></div>
<details><summary>Distribuição das notas e cálculo</summary><div class="av-detail"><div data-bars></div><p data-base></p><p data-time-base></p></div></details>
<h3>Clientes que avaliaram</h3><p data-empty>Nenhuma avaliação carregada.</p><div class="av-scroll"><table><thead><tr><th>Cliente</th><th>Início</th><th>Fila</th><th>Nota</th><th>Resolvido</th><th></th></tr></thead><tbody></tbody></table></div>
<details data-settings><summary>Agente identificado automaticamente</summary><div class="av-detail"><div class="av-account"><label>ID do agente<input data-agent readonly autocomplete="off" placeholder="Identificando…"></label></div><p>O agente é identificado em Minhas interações. Apenas pesquisas atribuídas a ele entram nos indicadores. Mantenha a aba auxiliar aberta. O período considera o início do atendimento no horário de Fortaleza.</p></div></details>
</div>`;
        document.body.append(panel);
        try{panel.querySelector('[data-agent]').value=localStorage.getItem(storageKey)||'';}catch{}
        panel.querySelector('[data-agent]').onchange=()=>{try{localStorage.setItem(storageKey,panel.querySelector('[data-agent]').value.trim());}catch{}render();};
        const today=model.today().day;
        panel.querySelector('[data-from]').value=today;panel.querySelector('[data-to]').value=today;
        panel.querySelector('[data-apply]').onclick=()=>{
            if(running)return;
            try{selectedRange=model.dateRange(panel.querySelector('[data-from]').value,panel.querySelector('[data-to]').value);}
            catch(error){message=error.message;render();return;}
            records=[];lastUpdate=null;day='';
            panel.querySelector('[data-period]').textContent=selectedRange.first.split('-').reverse().join('/')+' a '+selectedRange.last.split('-').reverse().join('/');
            connect();
        };
        panel.querySelector('[data-today]').onclick=()=>{
            if(running)return;
            selectedRange=null;records=[];lastUpdate=null;day='';
            panel.querySelector('[data-from]').value=model.today().day;panel.querySelector('[data-to]').value=model.today().day;
            panel.querySelector('[data-period]').textContent='Hoje';connect();
        };
        panel.querySelector('[data-close]').onclick=()=>{panel.hidden=true;};
        panel.querySelector('[data-refresh]').onclick=connect;panel.querySelector('[data-toggle]').onclick=toggle;
        toggle();
    }
    return {open};
});
