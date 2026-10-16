'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
module.exports=function(){
    const source=fs.readFileSync(path.join(__dirname,'../src/core/conversations.js.inc'),'utf8');
    const code=source.slice(source.indexOf('    function nextConversationForRotation('),source.indexOf('    const timerManager ='));
    let now=100000,selected=null,clicks=0,confirmSelection=true;
    const button={attrs:{},setAttribute(k,v){this.attrs[k]=v;}};
const groups=[0,1,2].map(top=>{const group={isConnected:true,getBoundingClientRect:()=>({top}),querySelector(selector){assert.equal(selector,'button.acd-interaction-card-v2-container');return {click(){clicks++;if(confirmSelection)selected=group;}};},click(){throw Error('A rotação não deve clicar no contêiner da conversa.');}};return group;});
    const timers=new Map(groups.map((g,i)=>[g,{startTime:i?50000:30000,pausedAt:100000,isPaused:i!==0}]));
    selected=groups[0];
    const notices=[];
    const context={window:{},Date:{now:()=>now},document:{getElementById:()=>button,querySelectorAll:()=>groups},findEl:()=>selected,CONFIG:{CHECKMARK_THRESHOLD_MS:70000,PURECLOUD_SELECTORS:{SELECTED_INTERACTION_GROUP:'selected',INTERACTION_GROUP:['group']}},conversationTimers:timers,UI:{createNotification:(...args)=>notices.push(args)}};
    vm.createContext(context);vm.runInContext(code,context);
    assert.equal(context.window.AjaModularAutoRotation.enabled,false);
    vm.runInContext('autoRotation.tick()',context);assert.equal(clicks,0);
    context.window.AjaModularAutoRotation.toggle();assert.equal(button.attrs['aria-pressed'],'true');
    vm.runInContext('autoRotation.tick()',context);assert.equal(clicks,1);assert.equal(selected,groups[1]);
    vm.runInContext('autoRotation.tick()',context);assert.equal(clicks,1); // Confirm and mark the first conversation.
    timers.get(groups[0]).isPaused=true;timers.get(groups[0]).pausedAt=now;
    timers.get(groups[1]).isPaused=false;
    now=120000;vm.runInContext('autoRotation.tick()',context);assert.equal(clicks,2);assert.equal(selected,groups[2]);
    vm.runInContext('autoRotation.tick()',context);
    now=170000;timers.get(groups[2]).isPaused=false;vm.runInContext('autoRotation.tick()',context);assert.equal(clicks,2); // The pending switch is confirmed first.
    vm.runInContext('autoRotation.tick()',context);assert.equal(clicks,2); // All other conversations were visited.
    context.window.AjaModularAutoRotation.toggle();assert.equal(button.attrs['aria-pressed'],'false');
    context.window.AjaModularAutoRotation.toggle();selected=groups[0];timers.get(groups[0]).isPaused=false;timers.get(groups[0]).startTime=now-70000;timers.get(groups[1]).startTime=now-1000;timers.get(groups[1]).pausedAt=now;timers.get(groups[1]).isPaused=true;confirmSelection=false;
    vm.runInContext('autoRotation.tick()',context);assert.equal(clicks,3);
    now+=3501;vm.runInContext('autoRotation.tick()',context);assert.equal(context.window.AjaModularAutoRotation.enabled,false);assert.equal(button.attrs['aria-pressed'],'false');assert.ok(notices.some(n=>String(n[0]).includes('não confirmou')));
    confirmSelection=true;context.window.AjaModularAutoRotation.toggle();selected=groups[0];timers.get(groups[0]).startTime=now-80000;timers.get(groups[1]).startTime=now-90000;timers.get(groups[1]).pausedAt=now;timers.get(groups[1]).isPaused=true;timers.get(groups[2]).startTime=now-90000;timers.get(groups[2]).pausedAt=now;timers.get(groups[2]).isPaused=true;
    vm.runInContext('autoRotation.tick()',context);assert.equal(clicks,4);assert.equal(selected,groups[1]); // Fall back to an older unvisited conversation.
    assert.match(fs.readFileSync(path.join(__dirname,'../src/ui/components/createMiniDashboard.js'),'utf8'),/mini-dashboard-auto-rotate-btn/);
    return ['Automatic conversation rotation stays off by default, switches once after 70 seconds, skips completed conversations and stops when the platform does not confirm selection'];
};
