// Pure calculations. Missing, pending and failed queries never become negative votes.
window.AjaEvaluationModel = (() => {
    const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
    function score(value) {
        const text=normalize(value);
        if (/^[0-5]$/.test(text)) return Number(text);
        return ({pessimo:1,ruim:2,neutro:3,bom:4,otimo:5})[text] ?? null;
    }
    function resolution(value) { return ({sim:true,nao:false})[normalize(value)] ?? null; }
    function status(item,now=Date.now()) {
        if (item.error) return 'falha';
        if (score(item.rating)!==null || resolution(item.resolved)!==null) return 'respondida';
        if (!Number.isFinite(item.endedAt)) return 'sem-horario';
        return now-item.endedAt<=15*60*1000 ? 'aguardando' : 'nao-avaliada';
    }
    function summarize(items,now=Date.now()) {
        const result={total:items.length,answered:0,pending:0,unanswered:0,failed:0,unknownEnd:0,ratings:0,positive:0,resolutions:0,yes:0,distribution:[0,0,0,0,0]};
        for(const item of items) {
            const state=status(item,now);
            if(state==='falha'){result.failed++;continue;}
            if(state==='aguardando')result.pending++;
            if(state==='nao-avaliada')result.unanswered++;
            if(state==='sem-horario')result.unknownEnd++;
            if(state==='respondida')result.answered++;
            const s=score(item.rating),r=resolution(item.resolved);
            if(s!==null){result.ratings++;result.distribution[Math.max(1,s)-1]++;if(s>=4)result.positive++;}
            if(r!==null){result.resolutions++;if(r)result.yes++;}
        }
        result.csat=result.ratings?100*result.positive/result.ratings:null;
        result.ir=result.resolutions?100*result.yes/result.resolutions:null;
        return result;
    }
    function dateRange(first,last) {
        const valid=value=>/^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value+'T00:00:00Z')) && new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;
        if(!valid(first)||!valid(last))throw Error('Informe duas datas válidas.');
        if(first>last)throw Error('A data inicial não pode ser posterior à final.');
        const start=new Date(first+'T00:00:00-03:00');
        const end=new Date(+new Date(last+'T00:00:00-03:00')+86400000);
        return {day:first,first,last,key:first+'/'+last,start:start.toISOString(),end:end.toISOString()};
    }
    function today(now=new Date()) {
        const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Fortaleza',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
        const part=type=>parts.find(p=>p.type===type).value;
        const day=`${part('year')}-${part('month')}-${part('day')}`;
        return dateRange(day,day);
    }
    function agentTimes(segments,agentId){
        const unique=[...new Map(segments.map(s=>[s.id,s])).values()];
        const own=unique.filter(s=>s.purpose==='agent'&&s.group.startsWith(agentId+'_'));
        const handled=own.filter(s=>['interact','hold','wrapup','dialing','contacting'].includes(s.type));
        if(!handled.length||handled.some(s=>!Number.isFinite(s.start)||!Number.isFinite(s.end)||s.end<s.start))return {handleMs:null,waitMs:null};
        const handleMs=handled.reduce((sum,s)=>sum+s.end-s.start,0);
        const sessions=new Map();
        for(const s of own.filter(s=>['interact','hold','alert'].includes(s.type))){const key=s.id.split('_')[0];sessions.set(key,Math.min(sessions.get(key)??Infinity,s.start));}
        const queues=unique.filter(s=>s.purpose==='acd'&&s.type==='interact'&&Number.isFinite(s.start)&&Number.isFinite(s.end)&&s.end>=s.start);
        const matched=[];
        for(const start of sessions.values()){
            const candidates=queues.filter(q=>q.start<=start&&Math.abs(q.end-start)<=1000);
            if(candidates.length!==1||matched.includes(candidates[0]))return {handleMs,waitMs:null};
            matched.push(candidates[0]);
        }
        return {handleMs,waitMs:matched.length?matched.reduce((n,q)=>n+q.end-q.start,0):null};
    }
    function timeSummary(records){
        const mean=key=>{const values=records.filter(r=>!r.timingError&&Number.isFinite(r[key])&&r[key]>=0).map(r=>r[key]);return {value:values.length?values.reduce((a,b)=>a+b,0)/values.length:null,count:values.length};};
        return {handle:mean('handleMs'),wait:mean('waitMs')};
    }
    function formatTime(ms){if(!Number.isFinite(ms))return 'Sem dados';const sec=Math.round(ms/1000);return [Math.floor(sec/3600),Math.floor(sec/60)%60,sec%60].map(v=>String(v).padStart(2,'0')).join(':');}
    return {score,resolution,status,summarize,today,dateRange,agentTimes,timeSummary,formatTime};
})();
