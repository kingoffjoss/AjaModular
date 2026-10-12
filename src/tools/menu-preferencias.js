window.AjaModular.register('menu-preferencias',['menu'],function(ctx){
 'use strict';
 const version='1.6.7',root=document.getElementById('uni-menu-container'),actions=root?.querySelector('.uni-fab-actions');
 if(!actions)return {};
 const load=key=>{try{const v=JSON.parse(ctx.ajaStorage.getItem(key)||'[]');return Array.isArray(v)?v.filter(x=>typeof x==='string'):[];}catch{return [];}};
 let favorites=load('menu_favorites_v1'),order=load('menu_order_v1'),panel,checking=false,lastCheck=0;
 function button(id,label,text,onClick){const b=document.createElement('button');b.id=id;b.className='uni-fab-btn';b.dataset.label=label;b.setAttribute('aria-label',label);b.title=label;b.textContent=text;b.onclick=onClick;actions.appendChild(b);return b;}
 button('uni-btn-preferences','Organizar menu','☷',open);
 button('uni-btn-timer-settings','Configurações dos cronômetros','⏱',()=>ctx.UI.createSettingsPanel());
 function buttons(){return [...actions.querySelectorAll('.uni-fab-btn')];}
 function arrange(){
  const list=buttons();for(const b of list){if(!order.includes(b.id))order.push(b.id);b.title=b.dataset.label||b.getAttribute('aria-label');b.classList.toggle('aja-menu-favorite',favorites.includes(b.id));}
  const sorted=[...list].sort((a,b)=>Number(favorites.includes(b.id))-Number(favorites.includes(a.id))||order.indexOf(a.id)-order.indexOf(b.id));
  if(sorted.some((b,i)=>b!==list[i]))for(const b of sorted)actions.appendChild(b);
  place();
 }
 function place(){const rect=root.getBoundingClientRect(),above=rect.top-12,below=innerHeight-rect.bottom-12,up=above>=below,width=Math.min(138,innerWidth-16);actions.style.setProperty('width',width+'px','important');actions.style.left=(Math.max(8,Math.min(rect.right-width+8,innerWidth-width-8))-rect.left)+'px';actions.style.right='auto';actions.style.setProperty('max-height',Math.max(80,up?above:below)+'px','important');actions.style.bottom=up?'72px':'auto';actions.style.top=up?'auto':'72px';}
 function save(){ctx.ajaStorage.setItem('menu_favorites_v1',JSON.stringify(favorites));ctx.ajaStorage.setItem('menu_order_v1',JSON.stringify(order));arrange();render();}
 function render(){if(!panel)return;const list=panel.querySelector('#aja-menu-order');list.replaceChildren();const current=buttons();for(const item of current){const row=document.createElement('div');row.className='aja-menu-row';const star=document.createElement('button');star.textContent=favorites.includes(item.id)?'★':'☆';star.setAttribute('aria-label','Favoritar '+item.title);star.setAttribute('aria-pressed',String(favorites.includes(item.id)));star.onclick=()=>{favorites=favorites.includes(item.id)?favorites.filter(x=>x!==item.id):[...favorites,item.id];save();};const label=document.createElement('span');label.textContent=item.title;row.append(star,label);for(const [delta,text] of [[-1,'↑'],[1,'↓']]){const move=document.createElement('button');move.textContent=text;move.setAttribute('aria-label',(delta<0?'Subir ':'Descer ')+item.title);const group=current.filter(b=>favorites.includes(b.id)===favorites.includes(item.id)),i=group.indexOf(item),other=group[i+delta];move.disabled=!other;move.onclick=()=>{const a=order.indexOf(item.id),b=order.indexOf(other.id);[order[a],order[b]]=[order[b],order[a]];save();};row.appendChild(move);}list.appendChild(row);}panel.querySelector('#aja-timer-shortcut').textContent='Configurações dos cronômetros: '+(ctx.CONFIG.HOTKEYS.openSettings||'Control+Shift+S').replace('Control','Ctrl')+'. Use fora de campos de texto.';}
 function compare(a,b){const x=a.split('.').map(Number),y=b.split('.').map(Number);for(let i=0;i<3;i++)if(x[i]!==y[i])return x[i]>y[i]?1:-1;return 0;}
 async function check(){if(checking)return;checking=true;const label=panel.querySelector('#aja-version-status'),btn=panel.querySelector('#aja-version-check');label.textContent='Consultando atualização…';btn.disabled=true;let timer;try{
  const result=await Promise.race([ctx.safeFetch('https://kingoffjoss.github.io/AjaModular/manifest.json?check='+Date.now()).then(async r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json();}),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Tempo de consulta excedido')),10000);})]);
  if(!/^\d+\.\d+\.\d+$/.test(result.version||''))throw Error('Versão recebida inválida');
  label.textContent=compare(result.version,version)>0?'Atualização disponível: '+result.version+'. Atualize o favorito pelo site, ou recarregue a pasta atualizada da extensão. Depois recarregue a plataforma.':compare(result.version,version)===0?'Você está na versão publicada mais recente ('+version+').':'Versão instalada '+version+'; a publicação ainda informa '+result.version+'.';lastCheck=Date.now();
 }catch(error){label.textContent='Não foi possível conferir a atualização: '+error.message+'. Versão instalada: '+version+'.';}finally{clearTimeout(timer);checking=false;btn.disabled=false;}}
 function open(){
  if(!panel){panel=document.createElement('dialog');panel.id='aja-menu-options';panel.innerHTML='<header><strong>Organizar ferramentas</strong><button data-close aria-label="Fechar organização">×</button></header><main><p>Marque ★ para manter no topo. As setas ordenam os itens dentro do grupo de favoritos ou das demais ferramentas.</p><div id="aja-menu-order"></div><h3>Janelas</h3><button id="aja-reset-windows">Trazer janelas para a tela</button><p>Restaura janelas minimizadas e reposiciona as abertas. Tamanho e posição são lembrados neste navegador.</p><h3>Cronômetros</h3><p id="aja-timer-shortcut"></p><button id="aja-open-timer-settings">Abrir configurações dos cronômetros</button><h3>Atualização</h3><p>Versão instalada: <strong>'+version+'</strong></p><p id="aja-version-status" role="status" aria-live="polite">Clique para conferir a versão publicada.</p><button id="aja-version-check">Verificar atualização</button> <a href="https://kingoffjoss.github.io/AjaModular/" target="_blank" rel="noopener noreferrer">Abrir site de atualização</a></main>';document.body.appendChild(panel);panel.querySelector('[data-close]').onclick=()=>panel.close();panel.querySelector('#aja-reset-windows').onclick=()=>{window.AjaModularWindows.reset();window.AjaModularNotice?.('Janelas reposicionadas.');};panel.querySelector('#aja-open-timer-settings').onclick=()=>{panel.close();ctx.UI.createSettingsPanel();};panel.querySelector('#aja-version-check').onclick=check;}
  render();panel.showModal();if(Date.now()-lastCheck>1800000)check();
 }
 const style=document.createElement('style');style.textContent=`
 #uni-menu-container .uni-fab-actions {display:grid!important;grid-template-columns:repeat(2,48px);gap:10px!important;justify-content:center!important;align-content:start;padding:10px!important;background:rgba(16,42,67,.94);border:1px solid #3373a5;border-radius:18px;box-shadow:0 6px 20px #0003}
 #uni-menu-container .uni-fab-btn {margin:0!important;min-width:48px;min-height:48px}
 #uni-menu-container .uni-fab-btn:focus-visible {outline:3px solid #ffb347;outline-offset:2px}
 #uni-menu-container .aja-menu-favorite {box-shadow:0 0 0 2px #ffd36e!important}
 #uni-menu-container .uni-fab-btn::after {display:none}
 #aja-menu-options {position:fixed;max-width:calc(100vw - 24px);max-height:calc(100vh - 24px);width:540px;padding:0;border:1px solid #428cc1;border-radius:12px;background:#102a43;color:white;font:14px system-ui;z-index:2147483647}
 #aja-menu-options:not([open]){display:none} #aja-menu-options::backdrop{background:#0007}
 #aja-menu-options header{display:flex;justify-content:space-between;align-items:center;padding:12px;background:#0057b8} #aja-menu-options main{padding:16px;overflow:auto;max-height:calc(100vh - 100px)}
 #aja-menu-options button{padding:7px 10px;border:1px solid #428cc1;border-radius:6px;background:#173b63;color:white;cursor:pointer;font:inherit} #aja-menu-options button:disabled{opacity:.4;cursor:default} #aja-menu-options a{color:#8edaff}
 #aja-menu-options .aja-menu-row{display:grid;grid-template-columns:34px 1fr 34px 34px;align-items:center;gap:6px;margin:6px 0}
 `;document.head.appendChild(style);
 arrange();new MutationObserver(arrange).observe(actions,{childList:true});new MutationObserver(place).observe(root,{attributes:true,attributeFilter:['class']});window.addEventListener('resize',place);document.addEventListener('pointerup',place);
 return {open,compareVersions:compare};
});


