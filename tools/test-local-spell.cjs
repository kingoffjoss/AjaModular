const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
module.exports=async function(){
 const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
 const context={window:{},console:{warn(){}},URLSearchParams};vm.createContext(context);vm.runInContext(read('src/corretor/local.js'),context);
 const local=context.window.AjaLocalSpell;
 assert.equal(local.correct('ola voce nao informou o endereco'),'olá, você não informou o endereço');
 assert.equal(local.correct('NAO Voce conexao'),'NÃO Você conexão');
 assert.equal(local.correct('voce nao',['voce']),'voce não');
 const safe='https://exemplo.com/nao voce@exemplo.com `nao` FTTH ONU GPON ABC-nao 192.168.1.1 10,50 nao123';
 assert.equal(local.correct(safe),safe);
 assert.equal(local.correct('eu numero e diagnostico; ele duvida do concerto'),'eu numero e diagnostico; ele duvida do concerto');
 assert.equal(local.correct('por favor reinicie mas aguarde'),'por favor, reinicie, mas aguarde');
 const text='🙂 nao funciona';const match=local.check(text)[0];assert.equal(text.slice(match.offset,match.offset+match.length),'nao');
 const once=local.correct('ola  voce nao sabe,por favor');assert.equal(local.correct(once),once);
 assert.equal(local.merge([match],[{...match,replacements:[{value:'não'}]}]).length,1);
 // Exercise real typing path while offline: local suggestions must remain visible.
 context.window.AjaModularSpell={filterMatches:m=>m};context.ctx={safeFetch:async()=>{throw Error('offline')}};
 const source=read('src/tools/corretor.js');const method=source.slice(source.indexOf('async verificarTextoNaAPI()'),source.indexOf('                atualizarLinhasOnduladas')).trim().replace(/,$/,'').replace('async verificarTextoNaAPI()','async function()');
 const verify=vm.runInContext('('+method+')',context);
 const checker={ultimoCampo:{value:'nao funciona'},dicionarioPessoal:[],panel:{style:{display:'none'}},atualizarLinhasOnduladas(){},atualizarBadge(){}};
 await verify.call(checker);assert.equal(checker.errosEncontrados[0].replacements[0].value,'não');
 // The real voice flow sends locally corrected text to AI and survives both services failing.
 let sent='';context.window.askGemini=async prompt=>{sent=prompt;return 'Olá, você não informou o endereço.';};
 const panel=read('src/corretor/panel.js');vm.runInContext(panel.slice(panel.indexOf('    function normalizarTranscricao('),panel.indexOf('    function obterConstrutorReconhecimento(')),context);
 let result=await context.corrigirTranscricao('ola voce nao informou o endereco');assert.equal(result.mode,'ia');assert.match(sent,/<transcricao>\nolá, você não informou o endereço\n<\/transcricao>/);
 context.window.askGemini=async()=>{throw Error('offline')};context.window.AjaModularSpell.request=async()=>{throw Error('offline')};
 result=await context.corrigirTranscricao('ola voce nao informou o endereco');assert.equal(result.text,'Olá, você não informou o endereço.');
 return ['Local dictionary and punctuation work offline, preserve personal/technical words and offsets, merge without overlaps, and run before AI in voice transcription'];
};
