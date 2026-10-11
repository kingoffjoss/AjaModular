(function(){
'use strict';
const roots=['.qr-script-popup','.pr-script-base-popup','#gemini-modal','#bau-rede','#purecloud-script-tools-panel','#central-dashboard','.central-modal','#pausa-script-config-container','#spell-main-panel','#ajamodular-settings','#car-panel','.queue-monitor-container','#purecloud-script-mini-dashboard','.purecloud-script-settings-panel','#aja-maintenance','#calc-modal'];
const selector=roots.join(',');let sequence=2147483000;const ranks=new WeakMap();let shown=new Set();
const closeSelector='[data-close],.qr-script-popup-close-btn,.pr-script-popup-close-btn,#btn-close,#bau-close-btn,#closeToolsBtn,#btn-close-dashboard,.btn-close-modal,#btn-spell-close,#car-close-btn,.close-btn,[title="Fechar"],[title="Fechar (Esc)"]';
function visible(node){return node.getClientRects().length&&getComputedStyle(node).display!=='none'&&getComputedStyle(node).visibility!=='hidden'&&(!node.matches('dialog')||node.open)&&(!node.matches('#calc-modal')||node.classList.contains('calc-visible'));}
function close(node){if(node.matches('#aja-maintenance,#ajamodular-settings')){node.close();return true;}if(node.id==='calc-modal'){node.shadowRoot?.getElementById('close-btn')?.click();return true;}const button=node.querySelector(closeSelector);if(button){button.click();return true;}return false;}
function constrain(node){if(!visible(node)||node.matches('dialog,.central-modal'))return;const rect=node.getBoundingClientRect();if(rect.left<0||rect.top<0||rect.right>innerWidth||rect.bottom>innerHeight){node.style.left=Math.max(0,Math.min(rect.left,innerWidth-rect.width-8))+'px';node.style.top=Math.max(0,Math.min(rect.top,innerHeight-rect.height-8))+'px';node.style.right='auto';node.style.bottom='auto';}}
function refresh(){const current=new Set();document.querySelectorAll(selector).forEach(node=>{if(visible(node)){current.add(node);if(!shown.has(node))ranks.set(node,++sequence);constrain(node);}});shown=current;}
document.addEventListener('pointerdown',event=>{const node=event.target.closest?.(selector);if(node){ranks.set(node,++sequence);if(!node.matches('dialog'))node.style.setProperty('z-index',String(sequence),'important');}},true);
document.addEventListener('keydown',event=>{if(event.key!=='Escape')return;refresh();const nodes=[...document.querySelectorAll(selector)].filter(visible);const modal=nodes.findLast(x=>x.matches('dialog[open]'));const top=modal||nodes.sort((a,b)=>(ranks.get(a)||0)-(ranks.get(b)||0)).at(-1);if(top&&close(top)){event.preventDefault();event.stopImmediatePropagation();}},true);
window.addEventListener('resize',refresh);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
// Observe insertion/opening only. Text updates from clocks do not trigger window creation or toggling.
let pending=false;new MutationObserver(records=>{if(records.some(r=>r.type==='attributes'?r.target.matches(selector):[...r.addedNodes].some(n=>n.nodeType===1&&(n.matches(selector)||n.querySelector(selector))))&&!pending){pending=true;requestAnimationFrame(()=>{pending=false;refresh();});}}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','open','style']});
const style=document.createElement('style');style.textContent=`
:is(${selector}) {box-sizing:border-box!important;min-width:0!important;min-height:0!important;max-width:calc(100vw - 16px)!important;max-height:calc(100vh - 16px)!important;isolation:isolate}
:is(${selector}) * {box-sizing:border-box}
:is(${selector}) :is(input,textarea,select) {min-width:0;max-width:100%}
:is(${selector}) textarea {resize:vertical}
#pausa-script-conteudo {min-width:0!important;max-width:100%}
#aja-maintenance {width:620px;padding:0;border:1px solid #2873a5;border-radius:12px;background:#102a43;color:#fff;font:14px system-ui;}
#aja-maintenance:not([open]) {display:none!important}
#aja-maintenance::backdrop {background:#0008}
#aja-maintenance header {display:flex;align-items:center;justify-content:space-between;padding:14px 18px;background:#0057b8;color:#fff}
#aja-maintenance main {padding:18px;overflow:auto;max-height:calc(100vh - 110px)}
#aja-maintenance button {font:inherit;background:#0057b8;color:#fff;border:1px solid #57a5e0;border-radius:6px;padding:8px 12px;cursor:pointer;margin:3px 0}
#aja-maintenance h3,#aja-maintenance strong,#aja-maintenance p {color:inherit}
#aja-maintenance [role=status] {color:#8ee9a5;white-space:pre-wrap}
#aja-maintenance input[hidden] {display:none!important}
#aja-maintenance button:focus-visible {outline:3px solid #ffb347}
`;document.head.appendChild(style);
window.AjaModularNotice=text=>{const note=document.createElement('div');note.setAttribute('role','alert');note.textContent=text;Object.assign(note.style,{position:'fixed',bottom:'20px',left:'20px',zIndex:'2147483647',background:'#102a43',color:'#fff',padding:'16px',borderRadius:'8px',maxWidth:'360px'});document.body.appendChild(note);setTimeout(()=>note.remove(),7000);};
window.AjaModularWindows=Object.freeze({close,constrain});
})();
