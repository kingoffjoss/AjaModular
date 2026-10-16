const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
module.exports=async function(){
 let api,clicked=0,notices=0,copied='';const view={getComputedStyle:()=>({visibility:'visible'})};
 const element=()=>({getClientRects:()=>[{}],ownerDocument:{defaultView:view}});
 const row={querySelectorAll:()=>[link]};const link={...element(),closest:()=>row,getAttribute:name=>name==='href'?'https://revan-atendimento.brisanet.net.br/#/yoda/attendance/57058271':null,click:()=>clicked++};
 link.ownerDocument.baseURI='https://apps.sae1.pure.cloud/directory/';
 const label={...element(),textContent:'Chamado Yoda:',closest:()=>row};
 const frame={...element(),contentDocument:{querySelectorAll:()=>[label]}};
 let frames=[frame];const document={querySelectorAll:s=>s==='*'?[]:frames};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/tools/chamado-yoda.js'),'utf8'),{URL,navigator:{clipboard:{writeText:async value=>{copied=value;}}},window:{AjaModular:{register:(id,deps,fn)=>api=fn()},AjaModularNotice:()=>notices++},document});
 await api.open();assert.equal(clicked,0);assert.equal(copied,'https://revan-atendimento.brisanet.net.br/#/yoda/attendance/57058271');
 frames=[];await api.open();assert.equal(clicked,0);assert.equal(notices,2);
 frames=[frame];label.textContent='Outro link:';await api.open();assert.equal(clicked,0);
 label.textContent='Chamado Yoda:';frame.getClientRects=()=>[];await api.open();assert.equal(clicked,0);
 frame.getClientRects=()=>[{}];link.getAttribute=name=>name==='href'?'javascript:alert(1)':null;copied='';await api.open();assert.equal(copied,'');assert.equal(clicked,0);
 return ['Yoda action copies the current visible ticket URL without opening a page and rejects missing or unsafe links'];
};
