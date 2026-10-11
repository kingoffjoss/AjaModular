'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
module.exports=async function(){
 const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
 const bundle=read('runtime/content.bundle.js'),checks=[];
 for(const spec of [{file:'protocolos',constant:'initialProtocolos',property:'PROTOCOLOS',key:'pr_protocolos',data:JSON.parse(read('protocolos_brisanet_v1_9.json')).protocols},{file:'respostas',constant:'initialQuickReplies',property:'QUICK_REPLIES',key:'qr_quickReplies',data:JSON.parse(read('respostas_COMPLETAS.json'))}]){
  const source=read('src/tools/'+spec.file+'.js').replace(/\r\n/g,'\n');
  const start=source.indexOf('const loadData = async () => {'),end=source.indexOf('\n                // 3. Carregar',start)>0?source.indexOf('\n                // 3. Carregar',start):source.indexOf('\n                    try {\n                        CONFIG.LAST_COPIED',start);
  const loading=source.slice(start,end)+'\n}; loadData();';
  const embedded=bundle.match(new RegExp('const '+spec.constant+' = (.*);'));
  assert.ok(embedded,'Missing embedded catalog');assert.deepEqual(JSON.parse(embedded[1]),spec.data);
  for(const custom of [null,[{title:'PERSONALIZADO - Exemplo',text:'Meu texto',isFavorite:true}]]){
   const values=new Map(custom?[[spec.key,JSON.stringify(custom)]]:[]);let requests=0;
   const sandbox={CONFIG:{},[spec.constant]:spec.data,ctx:{ajaStorage:{getItem:k=>values.get(k)||null,removeItem:k=>values.delete(k)},safeFetch:()=>{requests++;throw Error('Network forbidden');}},log:()=>{}};
   vm.createContext(sandbox);await vm.runInContext(loading,sandbox);
   assert.equal(requests,0);assert.equal(sandbox.CONFIG[spec.property].length,custom?1:spec.data.length);
   if(custom)assert.equal(sandbox.CONFIG[spec.property][0].isFavorite,true);
  }
  checks.push(spec.file+' defaults load without network and preserve saved custom items and favorites');
 }
 return checks;
};
