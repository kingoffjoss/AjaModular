'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
module.exports=function(){
 const s=fs.readFileSync(path.join(__dirname,'../src/tools/pausas.js'),'utf8');
 const mode=s.slice(s.indexOf('            const STORAGE_KEY_CONFIRMAR'),s.indexOf('            const NOTIF_CONFIG_DEFAULT'));
 const modal=s.slice(s.indexOf('            function exibirModalConfirmacao'),s.indexOf('            function removerModalConfirmacao'));
 let saved=null,failSave=false,actions=0;const button={textContent:'',setAttribute(){}};
 const env={ctx:{ajaStorage:{getItem:()=>saved,setItem:(k,v)=>{if(failSave)throw Error('storage');saved=v}}},window:{AjaModularNotice(){}},document:{getElementById:()=>button,createElement:()=>{throw Error('confirmation requested')}},console:{log(){}},removerModalConfirmacao(){},action:()=>actions++};
 const create=()=>{const c=vm.createContext({...env});vm.runInContext(mode+modal,c);return c};let c=create();
 assert.throws(()=>vm.runInContext("exibirModalConfirmacao('Refeição',action)",c),/confirmation requested/);assert.equal(actions,0);
 vm.runInContext('alternarModoConfirmacao()',c);assert.equal(saved,'false');assert.match(button.textContent,/100% automático/);
 vm.runInContext("exibirModalConfirmacao('Refeição',action)",c);assert.equal(actions,1);
 c=create();vm.runInContext("exibirModalConfirmacao('Pausa auricular',action)",c);assert.equal(actions,2);
 assert.throws(()=>vm.runInContext("exibirModalConfirmacao('Logoff',action)",c),/confirmation requested/);
 failSave=true;vm.runInContext('alternarModoConfirmacao()',c);assert.equal(vm.runInContext('pedirConfirmacao',c),false);failSave=false;
 vm.runInContext('alternarModoConfirmacao()',c);assert.equal(saved,'true');
 assert.throws(()=>vm.runInContext("exibirModalConfirmacao('Na fila',action)",c),/confirmation requested/);assert.equal(actions,2);
 return ['Scheduled pauses default to confirmation, support persisted automatic mode and switching back, retain logout confirmation and handle storage failures'];
};
