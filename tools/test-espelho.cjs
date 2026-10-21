const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
module.exports=async function(){
    const source=fs.readFileSync(path.join(__dirname,'../src/tools/espelho.js'),'utf8');
    let init,copied='';
    const message=text=>({innerText:text});
    const group=(author,outbound,texts)=>({
        querySelector:()=>({innerText:`${author} | Copiar com contexto`,className:outbound?'_outbound_':'_inbound_'}),
        querySelectorAll:()=>texts.map(message)
    });
    const groups=[group('Ana',false,['Olá 😃','Preciso de ajuda']),group('Bot',true,['Um momento 😊'])];
    const doc={querySelectorAll:selector=>selector==='[data-automation-id="message-group"]'?groups:[],addEventListener(){}};
    const win={AjaModular:{register:(id,deps,fn)=>{assert.equal(id,'espelho');init=fn;}},addEventListener(){}};
    const context={window:win,document:doc,location:{origin:'https://apps.sae1.pure.cloud',pathname:'/messaging-gadget/messaging-gadget.html'},navigator:{clipboard:{writeText:async text=>{copied=text;}}},setTimeout,clearTimeout};
    vm.createContext(context);vm.runInContext(source,context);init({UI:{createNotification(){}}});
    assert.equal(await win.executarCopiaEspelho(),true);
    assert.equal(copied,'Ana: Olá\n\nAna: Preciso de ajuda\n\nBot: Um momento');
    groups.length=0;copied='';
    assert.equal(await win.executarCopiaEspelho(),false);
    assert.equal(copied,'','unrelated page controls must never be copied');
    assert.ok(!source.includes('contentDocument.body.innerText'));
    return ['Copy chat includes only message bodies, removes emojis and never falls back to page text'];
};
