// Catálogo incorporado ao bundle: sem dependência de links para carregar comandos.
window.AjaModular.register('bau-catalogo', [], function(ctx) {
    'use strict';
    const defaults = /* bundled-defaults:bau */ [];
    const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    function validate(data) {
        if (!Array.isArray(data) || !data.length || data.length > 200) throw Error('Informe uma lista de categorias não vazia (até 200).');
        const ids = new Set(); let count = 0;
        const text = (value, field, max = 6000) => {
            if (typeof value !== 'string' || !value.trim() || value.length > max) throw Error('Campo inválido: ' + field);
            return value;
        };
        return data.map(group => ({title: text(group?.title, 'categoria', 200), commands: (() => {
            if (!Array.isArray(group.commands)) throw Error('Categoria sem lista de comandos.');
            return group.commands.map(item => {
                if (++count > 5000) throw Error('Limite de 5000 comandos.');
                const id = text(item?.id, 'id', 100);
                if (!/^[a-zA-Z0-9_-]+$/.test(id) || ids.has(id)) throw Error('ID inválido ou repetido: ' + id);
                ids.add(id);
                if (!item.os || typeof item.os !== 'object' || Array.isArray(item.os) || !Object.keys(item.os).length) throw Error('Comando sem sistema.');
                const os = {};
                for (const [key, command] of Object.entries(item.os)) {
                    if (!['win','linux','mac'].includes(key)) throw Error('Sistema desconhecido: ' + key);
                    os[key] = text(command, 'comando');
                }
                const optional = (key, fallback) => item[key] == null ? fallback : text(item[key] || fallback, key);
                return {id, label: text(item.label, 'nome', 300), os,
                    desc: optional('desc', 'Finalidade não informada no arquivo importado.'),
                    result: optional('result', 'Resultado esperado não informado no arquivo importado.'),
                    shell: optional('shell', 'Consulte a documentação do comando para escolher o terminal.'),
                    requires: optional('requires', 'Substitua os campos de exemplo antes de usar.'),
                    impact: item.impact == null || item.impact === '' ? '' : text(item.impact, 'impacto'), added: item.added === true};
            });
        })()}));
    }
    function search(database, os, query, category = '') {
        const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
        return database.filter(group => !category || group.title === category).map(group => ({title:group.title,
            commands: group.commands.filter(item => item.os[os] && terms.every(term => normalize([group.title,item.label,item.desc,item.result,item.shell,item.requires,item.os[os]].join(' ')).includes(term)))
        })).filter(group => group.commands.length);
    }
    const api = {defaults: () => validate(defaults), validate, search, normalize};
    return api;
});
