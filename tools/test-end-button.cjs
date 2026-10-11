'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
module.exports=function(){
 let factory,created=0,clicked=0,alerts=0,button;
 const native={disabled:false,getAttribute:()=>null,getClientRects:()=>[{}],click:()=>clicked++,insertAdjacentElement(position,element){assert.equal(position,'afterend');this.nextElementSibling=element;}};
 const toolbar={querySelector:()=>native};
 const document={getElementById:id=>id==='ajamodular-mensagens-termino'?button:null,querySelector:()=>native,createElement:()=>{created++;return button={style:{},setAttribute(){}};}};
 const sandbox={document,alert:()=>alerts++,window:{AjaModular:{register:(id,deps,fn)=>factory=fn}}};vm.createContext(sandbox);
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/tools/mensagens-termino.js'),'utf8'),sandbox);
 const module=factory({CONFIG:{PURECLOUD_SELECTORS:{TOOLBAR:[]}},findEl:()=>toolbar});
 module.open();module.mount(toolbar);assert.equal(created,1);assert.equal(native.nextElementSibling,button);assert.equal(button.textContent,'X');
 button.onclick();assert.equal(clicked,1);native.disabled=true;button.onclick();assert.equal(clicked,1);assert.equal(native.disabled,true);assert.equal(alerts,1);
 return ['Separate X module mounts beside native termination button without duplicates and respects native disabled state'];
};
