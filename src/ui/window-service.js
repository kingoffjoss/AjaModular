(function(){
'use strict';
const roots=['.qr-script-popup','.pr-script-base-popup','#gemini-modal','#bau-rede','#purecloud-script-tools-panel','#central-dashboard','.central-modal','#pausa-script-config-container','#spell-main-panel','#ajamodular-settings','#car-panel','.queue-monitor-container','.purecloud-script-settings-panel','#aja-maintenance','#calc-modal','#aja-menu-options','#aja-avaliacoes'];
const selector=roots.join(',');let sequence=2147483000;const ranks=new WeakMap();let shown=new Set();
const closeSelector='#am-close,#closeSettingsPanelBtn,.purecloud-script-popup-close-btn,[data-close],.qr-script-popup-close-btn,.pr-script-popup-close-btn,#btn-close,#bau-close-btn,#closeToolsBtn,#btn-close-dashboard,.btn-close-modal,#btn-spell-close,#car-close-btn,.close-btn,[title="Fechar"],[title="Fechar (Esc)"]';
function windows(){const all=[...document.querySelectorAll(selector)],calc=document.getElementById('calc-ultimate-host')?.shadowRoot?.getElementById('modal');if(calc)all.push(calc);return all;}
function isCalculator(node){return node.getRootNode()?.host?.id==='calc-ultimate-host';}
function visible(node){return node.getClientRects().length&&getComputedStyle(node).display!=='none'&&getComputedStyle(node).visibility!=='hidden'&&(!node.matches('dialog')||node.open)&&(!node.matches('#calc-modal')||node.classList.contains('calc-visible'));}
function close(node){if(node.matches('#aja-maintenance,#ajamodular-settings')){node.close();return true;}if(isCalculator(node)){node.classList.remove('calc-visible');return true;}const button=node.querySelector(closeSelector);if(button){button.click();return true;}return false;}
function constrain(node){if(!visible(node)||node.matches('dialog,.central-modal'))return;const rect=node.getBoundingClientRect();if(rect.left<0||rect.top<0||rect.right>innerWidth||rect.bottom>innerHeight){node.style.left=Math.max(0,Math.min(rect.left,innerWidth-rect.width-8))+'px';node.style.top=Math.max(0,Math.min(rect.top,innerHeight-rect.height-8))+'px';node.style.right='auto';node.style.bottom='auto';}}
function refresh(){const current=new Set();windows().forEach(node=>{if(visible(node)){current.add(node);if(!shown.has(node)){ranks.set(node,++sequence);restoreLayout(node);attachControls(node);const old=minimized.get(node);if(old){old.button.remove();minimized.delete(node);}}attachControls(node);constrain(node);}});shown=current;}
document.addEventListener('pointerdown',event=>{const node=event.target.closest?.(selector);if(node){ranks.set(node,++sequence);if(!node.matches('dialog'))node.style.setProperty('z-index',String(sequence),'important');}},true);
document.addEventListener('keydown',event=>{if(event.key!=='Escape'||document.getElementById('aja-spell-compact')?.hidden===false)return;refresh();const nodes=windows().filter(visible);const modal=nodes.findLast(x=>x.matches('dialog[open]'));const top=modal||nodes.sort((a,b)=>(ranks.get(a)||0)-(ranks.get(b)||0)).at(-1);if(top&&close(top)){event.preventDefault();event.stopImmediatePropagation();}},true);
window.addEventListener('resize',refresh);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
// Observe insertion/opening only. Text updates from clocks do not trigger window creation or toggling.
let pending=false;new MutationObserver(records=>{if(records.some(r=>r.type==='attributes'?r.target.matches(selector):(r.target.closest?.(selector)||[...r.addedNodes].some(n=>n.nodeType===1&&(n.matches(selector)||n.querySelector(selector)))))&&!pending){pending=true;requestAnimationFrame(()=>{pending=false;refresh();});}}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','open','style']});

const layoutKey='ajamodular:window_layout_v1';let layouts={};try{const saved=JSON.parse(localStorage.getItem(layoutKey)||'{}');if(saved&&typeof saved==='object'&&!Array.isArray(saved))layouts=saved;}catch{}
const minimized=new Map(),controls=new WeakSet();
const dock=document.createElement('div');dock.id='aja-window-dock';dock.setAttribute('aria-label','Janelas minimizadas');document.body.appendChild(dock);
function keyFor(node){return isCalculator(node)?'calc-ultimate-host':node.id||[...node.classList].filter(c=>!/(active|visible|dark|escuro|light|claro)/i.test(c)).sort().join('.');}
function remember(node){if(!visible(node)||minimized.has(node))return;const r=node.getBoundingClientRect();if(r.width<60||r.height<40)return;layouts[keyFor(node)]={left:r.left,top:r.top,width:r.width,height:r.height};try{localStorage.setItem(layoutKey,JSON.stringify(layouts));}catch(error){console.warn('[AjaModular] Posição não salva',error);}}
function restoreLayout(node){const saved=layouts[keyFor(node)];if(!saved||!['left','top','width','height'].every(k=>Number.isFinite(saved[k])))return;const width=Math.max(60,Math.min(saved.width,innerWidth-16)),height=Math.max(40,Math.min(saved.height,innerHeight-16));Object.assign(node.style,{position:'fixed',margin:'0',left:Math.max(8,Math.min(saved.left,innerWidth-width-8))+'px',top:Math.max(8,Math.min(saved.top,innerHeight-height-8))+'px',right:'auto',bottom:'auto',width:width+'px',height:height+'px'});}
function restoreMinimized(node){const item=minimized.get(node);if(!item)return;item.button.remove();minimized.delete(node);if(!node.isConnected)return;if(node.matches('dialog'))node.showModal();else if(isCalculator(node))node.classList.add('calc-visible');else {node.style.setProperty('display',item.display,item.priority);node.style.visibility=item.visibility;}restoreLayout(node);constrain(node);ranks.set(node,++sequence);}
function attachControls(node){if(node.querySelector('.aja-minimize-window')||node.matches('#purecloud-script-mini-dashboard'))return;controls.add(node);const title=(isCalculator(node)?'Calculadora':node.id==='gemini-modal'?'Aja Assistant':node.querySelector('header strong,h1,h2,h3,.panel-title,.header-title')?.textContent||node.getAttribute('aria-label')||'Ferramenta').trim().slice(0,60);const button=node.querySelector('.minimize-btn')||document.createElement('button');button.classList.add('aja-minimize-window');button.type='button';button.textContent='−';button.title='Minimizar janela';button.setAttribute('aria-label','Minimizar '+title);button.addEventListener('pointerdown',e=>e.stopPropagation());button.addEventListener('mousedown',e=>e.stopPropagation());button.onclick=e=>{e.stopPropagation();remember(node);const restoreButton=document.createElement('button');restoreButton.textContent=title;restoreButton.title='Restaurar '+title;restoreButton.onclick=()=>restoreMinimized(node);minimized.set(node,{button:restoreButton,display:node.style.display,priority:node.style.getPropertyPriority('display'),visibility:node.style.visibility});dock.appendChild(restoreButton);if(node.matches('dialog'))node.close();else if(isCalculator(node))node.classList.remove('calc-visible');else node.style.setProperty('display','none','important');};placeControls(node,button);if(!node.matches('dialog')){node.style.resize='both';if(getComputedStyle(node).overflow==='visible')node.style.overflow='auto';}}

// Keep minimize and close in the same flow, including headers without a named class.
function placeControls(node,button){
 const closeButton=node.querySelector(closeSelector);
 const group=document.createElement('span');group.className='aja-window-actions';
 group.style.cssText='display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:4px!important;flex:0 0 auto!important;vertical-align:middle!important;';
 if(closeButton){
  const css=getComputedStyle(closeButton),parent=closeButton.parentElement;
  if(css.position==='absolute'){
   group.style.position='absolute';group.style.top=css.top;group.style.right=css.right==='auto'?'8px':css.right;group.style.zIndex='10';
  }else if(parent===node){group.style.cssText+='position:absolute;top:8px;right:8px;z-index:10;';}
  closeButton.before(group);
  if(parent!==node&&getComputedStyle(parent).display.includes('flex'))parent.style.alignItems='center';
  group.append(button,closeButton);
  // Explicit dimensions override broad tool/theme button rules without touching handlers.
  const icons=parent===node?[]:[...parent.children].filter(el=>el!==group&&el.matches('button')&&el.textContent.trim().length<=2&&!/[\p{L}\p{N}]/u.test(el.textContent.trim()));
  for(const control of [button,closeButton,...icons]){
   control.classList.add('aja-window-control');
   const props={position:'static',inset:'auto',width:'30px','min-width':'30px','max-width':'30px',height:'30px','min-height':'30px','max-height':'30px',padding:'0',margin:'0',display:'inline-flex','align-items':'center','justify-content':'center',flex:'0 0 30px','box-sizing':'border-box','line-height':'1','font-size':'20px','border-radius':'6px',transform:'none'};
   for(const [key,value] of Object.entries(props))control.style.setProperty(key,value,'important');
  }
  for(const prop of ['background','color','border','box-shadow'])button.style.setProperty(prop,css.getPropertyValue(prop),'important');
  button.style.cursor='pointer';
 }else{
  group.style.cssText+='position:absolute;top:8px;right:8px;z-index:10;';group.append(button);node.append(group);
 }
 for(const name of ['pointerdown','mousedown'])group.addEventListener(name,event=>event.stopPropagation());
}

function reset(){for(const node of [...minimized.keys()])restoreMinimized(node);layouts={};localStorage.removeItem(layoutKey);let offset=0;windows().forEach(node=>{if(!visible(node))return;const r=node.getBoundingClientRect();Object.assign(node.style,{position:'fixed',margin:'0',right:'auto',bottom:'auto',left:Math.max(8,Math.min((innerWidth-r.width)/2+offset,innerWidth-r.width-8))+'px',top:Math.max(8,Math.min((innerHeight-r.height)/2+offset,innerHeight-r.height-8))+'px'});offset=(offset+24)%120;remember(node);});}
let dragWindow;
document.addEventListener('pointerdown',event=>{dragWindow=event.composedPath().find(n=>n?.nodeType===1&&windows().includes(n));},true);
document.addEventListener('pointerup',()=>{if(dragWindow)remember(dragWindow);dragWindow=null;},true);
const calculator=document.getElementById('calc-ultimate-host')?.shadowRoot?.getElementById('modal');if(calculator)new MutationObserver(refresh).observe(calculator,{attributes:true,attributeFilter:['class']});
window.addEventListener('pagehide',()=>windows().forEach(remember));

const style=document.createElement('style');style.textContent=`
.aja-minimize-window {width:30px;min-width:30px;height:30px;padding:0;margin:0;display:inline-flex;align-items:center;justify-content:center;border:1px solid #69a5d0;border-radius:6px;background:#173b63;color:#fff;font:20px system-ui;cursor:pointer;flex-shrink:0}
.aja-window-control:focus-visible {outline:2px solid #ffb347!important;outline-offset:2px}
.aja-window-control:hover {filter:brightness(1.12)}
#aja-window-dock {position:fixed;bottom:8px;left:8px;max-width:calc(100vw - 96px);display:flex;gap:6px;overflow-x:auto;z-index:2147483646} #aja-window-dock:empty{display:none} #aja-window-dock button{flex-shrink:0;background:#173b63;color:white;border:1px solid #428cc1;border-radius:8px;padding:10px;cursor:pointer}
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
window.AjaModularWindows=Object.freeze({close,constrain,reset,restore:restoreMinimized});
})();


