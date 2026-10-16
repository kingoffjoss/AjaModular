'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
module.exports=function(){
 const root=path.resolve(__dirname,'..');
 const car=fs.readFileSync(path.join(root,'src/tools/car.js'),'utf8');
 const guard=car.slice(car.indexOf('const isScriptMap ='),car.indexOf('\n            let scripts ='));
 assert.ok(guard.startsWith('const isScriptMap ='));
 const context=vm.createContext({});
 vm.runInContext(guard+'\nthis.validate=isScriptMap;',context);
 assert.equal(context.validate({ex1:'Texto válido'}),true);
 for(const invalid of [null,[],['texto'],{ex1:null},{ex1:42},{'':'Sem atalho'}])assert.equal(context.validate(invalid),false);
 const store=vm.createContext({window:{}});
 vm.runInContext(fs.readFileSync(path.join(root,'src/core/catalog-store.js'),'utf8'),store);
 const normalized=store.window.AjaModularCatalogStore.normalize([{title:'TESTE - Texto',text:'Mensagem',requiredData:['CPF',null,17]}]);
 assert.deepEqual(Array.from(normalized[0].requiredData),['CPF']);
 assert.equal(store.window.AjaModularCatalogStore.escapeHTML('<b>'), '&lt;b&gt;');
 return ['CAR rejects malformed backups instead of replacing saved commands', 'Protocol and reply catalogs discard invalid tags while preserving valid entries'];
};
