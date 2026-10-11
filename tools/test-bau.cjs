'use strict';
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
module.exports = function() {
 const root = path.resolve(__dirname,'..'), read = name => fs.readFileSync(path.join(root,name),'utf8');
 const database = ['legacy','windows','linux','macos'].flatMap(name=>JSON.parse(read('src/catalogs/bau/'+name+'.json')));
 let factory; const sandbox = {window:{AjaModular:{register:(id,deps,fn)=>{assert.equal(id,'bau-catalogo');factory=fn;}}}};
 vm.runInNewContext(read('src/tools/bau-catalogo.js').replace('/* bundled-defaults:bau */ []',JSON.stringify(database)),sandbox);
 const api=factory({}), defaults=api.defaults(), checks=[];
 for (const [os,expected,added] of [['win',154,100],['linux',144,103],['mac',145,106]]) {
  const rows=defaults.flatMap(g=>g.commands).filter(c=>c.os[os]);
  assert.equal(rows.length,expected);assert.equal(rows.filter(c=>c.added).length,added);
  assert.equal(new Set(rows.map(c=>c.os[os])).size,rows.length);
  for(const row of rows) for(const field of ['label','desc','result','shell','requires']) assert.ok(row[field]?.trim(),row.id+':'+field);
  checks.push('Baú '+os+': '+expected+' distinct reviewed commands, '+added+' new, complete metadata');
 }
 const found=api.search(defaults,'win','dns ipv6'); assert.ok(found.some(g=>g.commands.some(c=>c.os.win.includes('AAAA'))));
 assert.ok(api.search(defaults,'mac','sincronizacao').some(g=>g.commands.some(c=>c.label==='Sincronização de horário')));
 assert.equal(api.search(defaults,'linux','nenhumxyz').length,0);
 for (const group of api.search(defaults,'linux','', 'Logs e usuários')) assert.equal(group.title,'Logs e usuários');
 checks.push('Baú search handles accents, multiple terms, categories, OS and empty results');
 for (const invalid of [null,[],[{title:'x',commands:[{id:'x',label:'x',os:{win:5}}]}],[{title:'x',commands:[{id:'x',label:'x',os:{android:'x'}}]}]]) assert.throws(()=>api.validate(invalid));
 const sample={title:'x',commands:[{id:'x',label:'x',os:{win:'hostname'}}]}; const imported=api.validate([sample]);assert.match(imported[0].commands[0].result,/não informado/);
 assert.throws(()=>api.validate([sample,sample]));
 checks.push('Baú import rejects malformed/duplicate records and accepts legacy format with explicit missing metadata');
 const legacy=JSON.parse(read('src/catalogs/bau/legacy.json')).flatMap(g=>g.commands);
 assert.ok(!legacy.some(c=>Object.values(c.os).some(cmd=>/\bwmic\b|systemd-resolve\s|PrivateFrameworks|resetUserPermissions|repairVolume \/$/.test(cmd))));
 assert.match(legacy.find(c=>c.id==='cmd-lin-fsck-linux').os.linux,/fsck -n/);
 assert.match(legacy.find(c=>c.id==='cmd-shutdown-r-mac').desc,/imediatamente/);
 assert.match(legacy.find(c=>c.id==='cmd-shutdown-r-win').desc,/60 segundos/);
 assert.match(read('src/tools/bar.js'),/Set-NetAdapterAdvancedProperty/);assert.ok(!read('src/tools/bar.js').includes('Set-NetAdapter -Name'));
 checks.push('Baú legacy corrections cover CIM, resolved, macOS tools, offline fsck and OS-specific shutdown timing');
 const bundle=read('runtime/content.bundle.js');assert.ok(bundle.includes('bau-command-search'));assert.ok(!bundle.includes('/* bundled-defaults:bau */ []'));assert.ok(bundle.includes('Test-WSMan'));
 checks.push('Baú catalogs embedded in bundle, no runtime catalog fetch needed');
 return checks;
};
