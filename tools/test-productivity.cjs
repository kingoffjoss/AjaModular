'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
module.exports=function(){const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');let factory;const workflows=JSON.parse(read('src/catalogs/bau/roteiros.json'));
vm.runInNewContext(read('src/tools/bau-assistente.js').replace('/* bundled-defaults:bauRoteiros */ []',JSON.stringify(workflows)),{window:{AjaModular:{register:(id,deps,fn)=>factory=fn}}});const api=factory();
assert.equal(api.render("Test-WSMan -ComputerName 'HOST'",{HOST:'pc.local'},'win'),"Test-WSMan -ComputerName 'pc.local'");
assert.equal(api.render("Get-Item -LiteralPath 'CAMINHO'",{CAMINHO:"C:\\O'Brien\\arquivo.txt"},'win'),"Get-Item -LiteralPath 'C:\\O''Brien\\arquivo.txt'");
assert.equal(api.render('ping -c 4 HOST',{HOST:'example.org; touch /tmp/a'},'linux'),"ping -c 4 'example.org; touch /tmp/a'");
assert.equal(api.render("cat 'CAMINHO'",{CAMINHO:"/tmp/O'Brien"},'linux'),"cat '/tmp/O'\\''Brien'");
assert.equal(api.render('echo "HOST"',{HOST:'$(whoami)'},'win'),'echo "`$(whoami)"');
assert.equal(api.render('echo "HOST"',{HOST:'$(whoami)'},'linux'),'echo "\\$(whoami)"');
assert.throws(()=>api.render('nc HOST PORTA',{HOST:'localhost',PORTA:'70000'},'mac'),/PORTA/);
assert.throws(()=>api.render('kill PID',{PID:'1;echo'},'linux'),/PID/);
assert.throws(()=>api.render('ping HOST',{HOST:'a\nb'},'win'),/linha/);
assert.equal(api.fields('sysctl hw.memsize; echo "$HOME"; dig HOST AAAA').join(','),'HOST');
const commands=['legacy','windows','linux','macos'].flatMap(n=>JSON.parse(read('src/catalogs/bau/'+n+'.json')).flatMap(g=>g.commands));
for(const workflow of workflows){assert.ok(workflow.steps.length>=3);for(const step of workflow.steps){assert.ok(step.why&&step.inspect);for(const os of ['win','linux','mac'])assert.ok(commands.some(c=>c.id===step.commands[os]&&c.os[os]),workflow.id+':'+os+':'+step.title);}}
return ['Filled commands escape quoted paths and shell metacharacters for PowerShell and Unix shells','Command fields preserve literals and reject invalid port/PID/multiline values','Four diagnostic workflows reference existing commands for all three operating systems'];};
