'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
module.exports=function(){
 const source=fs.readFileSync(path.join(__dirname,'../Loader.js'),'utf8');
 const timers=new Map(),intervals=new Map();let id=0,oldStopped=0;const injected=[];
 function doc(){return {documentElement:{},body:{},head:{appendChild(s){injected.push(s);s.onload?.();}},createElement(){return {remove(){}}},querySelectorAll(){return this.frames||[]},addEventListener(){},removeEventListener(){}};}
 const main=doc(),win={document:main,addEventListener(){},removeEventListener(){},__AJA_MODULAR_LOADER__:{stop(){oldStopped++}}};
 const env={window:win,document:main,console:{warn(){}},MutationObserver:class{observe(){}disconnect(){}},WeakSet,WeakMap,setTimeout:f=>{timers.set(++id,f);return id},clearTimeout:i=>timers.delete(i),setInterval:f=>{intervals.set(++id,f);return id},clearInterval:i=>intervals.delete(i)};
 vm.createContext(env);vm.runInContext(source,env);assert.equal(oldStopped,1);assert.equal(injected.length,1);win.__AJA_MODULAR_RUNTIME__=true;
 const child={document:doc()};const frame={contentWindow:child,addEventListener(){},removeEventListener(){}};
 const blocked={get document(){throw Error('SecurityError')}};
 main.frames=[{contentWindow:blocked,addEventListener(){},removeEventListener(){}},frame];
 function tick(){for(const f of intervals.values())f();const jobs=[...timers.values()];timers.clear();jobs.forEach(f=>f());}
 tick();assert.equal(injected.length,2);child.__AJA_MODULAR_RUNTIME__=true;
 tick();assert.equal(injected.length,2);
 child.document=doc();delete child.__AJA_MODULAR_RUNTIME__;tick();assert.equal(injected.length,3);child.__AJA_MODULAR_RUNTIME__=true;
 vm.runInContext(source,env);assert.equal(intervals.size,1);assert.equal(injected.length,3);
 win.__AJA_MODULAR_LOADER__.stop();assert.equal(intervals.size,0);assert.equal(timers.size,0);
 return ['Loader upgrades old instances, discovers late frames, survives inaccessible siblings, reloads replaced documents and cleans up'];
};
