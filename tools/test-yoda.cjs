const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
module.exports=async function(){
 let api,clicked=0,notices=0,opened=[];const view={getComputedStyle:()=>({visibility:'visible'})};
 const element=()=>({getClientRects:()=>[{}],ownerDocument:{defaultView:view}});
 const row={querySelectorAll:()=>[link]};const link={...element(),closest:()=>row,getAttribute:name=>name==='href'?'https://revan-atendimento.brisanet.net.br/#/yoda/attendance/57058271':null,click:()=>clicked++};
 link.ownerDocument.baseURI='https://apps.sae1.pure.cloud/directory/';
 const label={...element(),textContent:'Chamado Yoda:',closest:()=>row};
 const frame={...element(),contentDocument:{querySelectorAll:()=>[label]}};
 let frames=[frame];const document={querySelectorAll:s=>s==='*'?[]:frames};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/tools/chamado-yoda.js'),'utf8'),{URL,window:{AjaModular:{register:(id,deps,fn)=>api=fn()},AjaModularNotice:()=>notices++,open:(...args)=>opened.push(args)},document});
 await api.open();assert.equal(clicked,0);assert.equal(opened.length,1);assert.equal(opened[0][0],'https://revan-atendimento.brisanet.net.br/#/yoda/attendance/57058271');assert.equal(opened[0][1],'_blank');
 frames=[];await api.open();assert.equal(clicked,0);assert.equal(notices,1);
 frames=[frame];label.textContent='Outro link:';await api.open();assert.equal(clicked,0);
 label.textContent='Chamado Yoda:';frame.getClientRects=()=>[];await api.open();assert.equal(clicked,0);
 frame.getClientRects=()=>[{}];link.getAttribute=name=>name==='href'?'javascript:alert(1)':null;await api.open();assert.equal(opened.length,1);assert.equal(clicked,0);
 return ['Yoda action opens only the current visible ticket in a new tab and rejects missing or unsafe links'];
};
