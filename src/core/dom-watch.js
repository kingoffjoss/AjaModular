(function(){
'use strict';
const subscriptions=new Map();let scheduled=false;
const options={childList:true,subtree:true,attributes:true,attributeFilter:['class','open','style']};
function run(){scheduled=false;observer.disconnect();for(const [callback,selector] of subscriptions){try{if(!selector||document.querySelector(selector))callback();}catch(error){window.AjaModularReportError?.('Atualização da interface',error);}}queueMicrotask(()=>observer.observe(document.documentElement,options));}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(run);}
const observer=new MutationObserver(schedule);
observer.observe(document.documentElement,options);
function watch(selector,callback){if(typeof callback!=='function')throw new TypeError('Observador sem função');subscriptions.set(callback,selector||'');schedule();return()=>subscriptions.delete(callback);}
window.AjaModularDOM=Object.freeze({watch,refresh:schedule,count:()=>subscriptions.size});
})();
