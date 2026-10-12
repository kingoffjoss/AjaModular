'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
module.exports=async function(){
const source=fs.readFileSync(path.join(__dirname,'../src/tools/pausas.js'),'utf8');
const code=source.slice(source.indexOf('            const normalizarPresenca'),source.indexOf('            // --- Lógica "Na Fila"'));
for(const scenario of ['closed','open','submenu','missing','disabled','unconfirmed']){
 let opened=scenario==='open',statusOpen=false,sub=false,actual='Em fila',history=[],clicks=[],notices=[];
 const el=(name,fn)=>({id:name,value:name,disabled:scenario==='disabled',getClientRects:()=>[{}],closest(){return {getClientRects:()=>[{}],querySelector:()=>({click(){clicks.push(name);fn?.();if(name!=='Intervalo'&&scenario!=='unconfirmed')actual=name;}})}},getAttribute:()=>null,click(){throw Error('input.click must not be used')}});
 const toggle={id:'user-settings-button',getAttribute:a=>a==='aria-expanded'?String(opened):'Configurações, Agente, '+actual,click(){opened=true}};
 const entry={id:'presence-button',click(){statusOpen=true}};
 const category=el('Intervalo',()=>sub=true),meal=el('Refeição'),pause=el('Pausa auricular');
 const document={querySelector:s=>s==='#presence-button'?(opened&&!statusOpen?entry:null):toggle,querySelectorAll:s=>s.includes('input.presence-input')?(statusOpen?(scenario==='missing'?[]:scenario==='submenu'?(sub?[pause]:[category]):[meal]):[]):[]};
 const env={document,SELECTORES:{MENU_STATUS_TOGGLE:'#user-settings-button',STATUS_LABEL_TEXT:'span.presence-label-text'},setTimeout:fn=>fn(),console:{warn(){}},window:{AjaModularNotice:(...x)=>notices.push(x)},registrarPausa:x=>history.push(x)};
 vm.createContext(env);vm.runInContext(code,env);
 await vm.runInContext(scenario==='submenu'?"executarMudancaPresenca('Intervalo','Pausa auricular','Pausa auricular')":"executarMudancaPresenca('Refeição',null,'Refeição')",env);
 if(['missing','disabled','unconfirmed'].includes(scenario)){assert.equal(history.length,0,scenario);assert.equal(notices.length,1,scenario)}else {assert.equal(history.length,1,scenario);assert.ok(clicks.includes(scenario==='submenu'?'Pausa auricular':'Refeição'))}
}
return ['Presence clicks slotted labels and records only platform-confirmed changes; missing, disabled and unconfirmed targets fail safely'];
};
