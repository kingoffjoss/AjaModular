(function () {
    'use strict';
    // Curated corrections only: unknown words are not considered spelling errors.
    const dictionary = {
        'nao':'não','voce':'você','voces':'vocês','tambem':'também','ninguem':'ninguém',
        'alguem':'alguém','ateh':'até','obrigadoo':'obrigado','obrigadaa':'obrigada',
        'ola':'olá','possivel':'possível',
        'impossivel':'impossível','disponivel':'disponível','indisponivel':'indisponível',
        'necessario':'necessário','necessaria':'necessária','necessarios':'necessários',
        'necessarias':'necessárias','tecnico':'técnico','tecnica':'técnica','tecnicos':'técnicos',
        'tecnicas':'técnicas','numeros':'números','usuario':'usuário',
        'usuarios':'usuários','horario':'horário','horarios':'horários','endereco':'endereço',
        'enderecos':'endereços','servico':'serviço','servicos':'serviços','conexao':'conexão',
        'conexoes':'conexões','configuracao':'configuração','configuracoes':'configurações',
        'informacao':'informação','informacoes':'informações','solicitacao':'solicitação',
        'solicitacoes':'solicitações','verificacao':'verificação','verificacoes':'verificações',
        'instalacao':'instalação','instalacoes':'instalações','manutencao':'manutenção',
        'atualizacao':'atualização','atualizacoes':'atualizações','autenticacao':'autenticação',
        'interrupcao':'interrupção','interrupcoes':'interrupções','situacao':'situação',
        'situacoes':'situações','orientacao':'orientação','orientacoes':'orientações',
        'resolucao':'resolução','confirmacao':'confirmação','permissao':'permissão',
        'permissoes':'permissões','avaliacao':'avaliação','avaliacoes':'avaliações',
        'seguranca':'segurança','lentidao':'lentidão','oscilacao':'oscilação',
        'oscilacoes':'oscilações','reinicializacao':'reinicialização',
        'diagnosticos':'diagnósticos','relatorio':'relatório','relatorios':'relatórios',
        'proxima':'próxima',
        'ja':'já','apos':'após','atraves':'através','porem':'porém','alem':'além',
        'qaundo':'quando','qunado':'quando','concerteza':'com certeza',
        'derrepente':'de repente','agenteamento':'agendamento','agendamentoo':'agendamento',
        'exelente':'excelente','excelete':'excelente','nescessario':'necessário',
        'nescessaria':'necessária','precizo':'preciso','problemaa':'problema',
        'funcionndo':'funcionando','funcionamneto':'funcionamento','feramenta':'ferramenta',
        'feramentas':'ferramentas','coneccao':'conexão','conecao':'conexão',
        'excessao':'exceção','exceçao':'exceção','excessão':'exceção'
    };
    const normalize = value => String(value).normalize('NFC').toLocaleLowerCase('pt-BR');
    const sameCase = (from, to) => from === from.toLocaleUpperCase('pt-BR') ? to.toLocaleUpperCase('pt-BR') : /^[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ]/.test(from) ? to[0].toLocaleUpperCase('pt-BR') + to.slice(1) : to;
    const rules = [
        {id:'GREETING', pattern: /(^|[.!?]\s+)(olá|bom dia|boa tarde|boa noite)\s+(?=\p{L})/giu, value:m=>m[1]+m[2]+', ', message:'Separe a saudação com uma vírgula.'},
        {id:'INTRO', pattern: /(^|[.!?]\s+)(por favor|por gentileza|nesse caso|neste caso|diante disso|além disso|no entanto|portanto)\s+(?=\p{L})/giu, value:m=>m[1]+m[2]+', ', message:'Separe a expressão inicial com uma vírgula.'},
        {id:'MAS', pattern: /(\p{L})\s+(mas)\s+/giu, value:m=>m[1]+', '+m[2]+' ', message:'Use vírgula antes da conjunção adversativa.'},
        {id:'PLEASE', pattern: /(\p{L})\s+(por favor|por gentileza)(?=[.!?]|$)/giu, value:m=>m[1]+', '+m[2], message:'Separe a expressão de cortesia com uma vírgula.'},
        {id:'SPACE_BEFORE', pattern: /[ \t]+([,;!?])/g, value:m=>m[1], message:'Remova o espaço antes da pontuação.'},
        {id:'SPACE_AFTER', pattern: /([,;!?])(?=\p{L})/gu, value:m=>m[1]+' ', message:'Acrescente um espaço depois da pontuação.'},
        {id:'DOUBLE_SPACE', pattern: /(\p{L})[ \t]{2,}(?=\p{L})/gu, value:m=>m[1]+' ', message:'Use apenas um espaço entre palavras.'}
    ];
    function check(text, personal = []) {
        text = String(text || '');
        const accepted = new Set(personal.map(normalize));
        // Exclude URLs, emails, identifiers and backtick-delimited code from all rules.
        const protectedRanges = [...text.matchAll(/(?:https?:\/\/|www\.)\S+|[\p{L}\d._%+-]+@[\p{L}\d.-]+|`[^`]*`|[\p{L}\d_./:-]*\d[\p{L}\d_./:-]*|[\p{L}]+(?:[_/-][\p{L}]+)+/gu)].map(m=>[m.index,m.index+m[0].length]);
        const matches=[];
        function add(offset, length, value, id, message, spelling=false) {
            const end=offset+length;
            if (protectedRanges.some(([a,b])=>offset<b && end>a) || matches.some(m=>offset<m.offset+m.length && end>m.offset)) return;
            matches.push({offset,length,message,replacements:[{value}],rule:{id:'AJA_LOCAL_'+id,issueType:spelling?'misspelling':'grammar',category:{id:spelling?'TYPOS':'PUNCTUATION'}},source:'local'});
        }
        for (const m of text.matchAll(/\p{L}[\p{L}\p{M}]*/gu)) {
            const word=normalize(m[0]);
            if (!accepted.has(word) && Object.hasOwn(dictionary,word)) add(m.index,m[0].length,sameCase(m[0],dictionary[word]),'SPELL','Grafia sugerida pelo dicionário local.',true);
        }
        for (const rule of rules) {
            rule.pattern.lastIndex=0;
            for (const m of text.matchAll(rule.pattern)) add(m.index,m[0].length,rule.value(m),rule.id,rule.message);
        }
        return matches.sort((a,b)=>b.offset-a.offset);
    }
    function correct(text, personal=[]) {
        let result=String(text || '');
        // A second pass applies punctuation after an accent correction, using new offsets.
        for (let pass=0;pass<3;pass++) {
            const matches=check(result,personal);
            if (!matches.length) break;
            for (const m of matches) result=result.slice(0,m.offset)+m.replacements[0].value+result.slice(m.offset+m.length);
        }
        return result;
    }
    function merge(local, remote) {
        const result=[...local];
        for (const item of remote) {
            if (!result.some(m=>item.offset===m.offset || (item.offset<m.offset+m.length && item.offset+item.length>m.offset))) result.push(item);
        }
        return result.sort((a,b)=>b.offset-a.offset);
    }
    window.AjaLocalSpell={check,correct,merge,wordCount:Object.keys(dictionary).length,ruleCount:rules.length};
})();
