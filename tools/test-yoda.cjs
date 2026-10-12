const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
module.exports=function(){
 let api,clicked=0,notices=0;const view={getComputedStyle:()=>({visibility:'visible'})};
 const element=()=>({getClientRects:()=>[{}],ownerDocument:{defaultView:view}});
 const row={querySelectorAll:()=>[link]};const link={...element(),closest:()=>row,getAttribute:()=>null,click:()=>clicked++};
 const label={...element(),textContent:'Chamado Yoda:',closest:()=>row};
 const frame={...element(),contentDocument:{querySelectorAll:()=>[label]}};
 let frames=[frame];const document={querySelectorAll:s=>s==='*'?[]:frames};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/tools/chamado-yoda.js'),'utf8'),{window:{AjaModular:{register:(id,deps,fn)=>api=fn()},AjaModularNotice:()=>notices++},document});
 api.open();assert.equal(clicked,1);
 frames=[];api.open();assert.equal(clicked,1);assert.equal(notices,1);
 frames=[frame];label.textContent='Outro link:';api.open();assert.equal(clicked,1);
 label.textContent='Chamado Yoda:';frame.getClientRects=()=>[];api.open();assert.equal(clicked,1);
 frame.getClientRects=()=>[{}];api.open();assert.equal(clicked,2);
 return ['Yoda action uses current visible Scripts link and refuses missing, unrelated and hidden links'];
};
