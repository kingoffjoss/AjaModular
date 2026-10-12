(function(){
'use strict';
window.AjaModularCompactSpell=function(checker){
 if(checker.compactReady)return;checker.compactReady=true;
 const badge=document.createElement('button');badge.id='spell-badge';badge.type='button';badge.setAttribute('aria-haspopup','dialog');badge.setAttribute('aria-controls','aja-spell-compact');checker.badge.replaceWith(badge);checker.badge=badge;
 const panel=document.createElement('section');panel.id='aja-spell-compact';panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Revisão rápida');panel.hidden=true;document.body.append(panel);
 let paused=false,view='errors',snapshot='',source=null,request=0;
 const text=field=>field?(field.isContentEditable?(field.innerText||field.textContent):field.value):'';
 function element(tag,value){const el=document.createElement(tag);if(value!==undefined)el.textContent=value;return el;}
 function button(label,action,title){const el=element('button',label);el.type='button';el.title=title||label;el.setAttribute('aria-label',title||label);el.onclick=action;return el;}
 function dismiss(){panel.hidden=true;badge.setAttribute('aria-expanded','false');request++;}
 function position(){if(panel.hidden)return;const b=badge.getBoundingClientRect(),height=panel.offsetHeight,width=panel.offsetWidth;panel.style.left=Math.max(8,Math.min(b.right-width,innerWidth-width-8))+'px';panel.style.top=Math.max(8,b.top-height-8>=8?b.top-height-8:Math.min(b.bottom+8,innerHeight-height-8))+'px';}
 function valid(){return source===checker.ultimoCampo&&source?.isConnected&&text(source)===snapshot;}
 function changed(){checker.errosEncontrados=[];checker.dispararEventoDeMudanca();dismiss();}
 function apply(error){if(!valid())return render();checker.aplicarCorrecaoMath(error,error.replacements[0].value);changed();}
 function render(){
  if(panel.hidden)return;source=checker.ultimoCampo;snapshot=text(source);panel.replaceChildren();
  const head=element('header');head.append(element('strong','Revisão rápida'),button('×',dismiss,'Fechar revisão rápida'));panel.append(head);
  const actions=element('nav');actions.setAttribute('aria-label','Ações do corretor');
  const fix=button('Corrigir tudo',()=>{if(!valid())return render();[...checker.errosEncontrados].sort((a,b)=>b.offset-a.offset).forEach(err=>{if(err.replacements?.[0])checker.aplicarCorrecaoMath(err,err.replacements[0].value);});changed();});fix.disabled=paused||!checker.errosEncontrados.some(e=>e.replacements?.length);
  actions.append(fix,button('Reescrever',rewrite),button(paused?'Retomar':'Pausar',()=>{paused=!paused;checker.__revision=(checker.__revision||0)+1;checker.errosEncontrados=[];checker.camadaIlusao.innerHTML='';checker.atualizarBadge();if(!paused)checker.verificarTextoNaAPI();render();}),button('⚙',()=>{dismiss();window.AjaModularOpenSettings?.();},'Configurações do corretor'));panel.append(actions);
  const tabs=element('nav');tabs.className='compact-tabs';for(const [key,label] of [['errors','Erros ('+checker.errosEncontrados.length+')'],['dictionary','Dicionário']]){const tab=button(label,()=>{view=key;render();});tab.setAttribute('aria-pressed',String(view===key));tabs.append(tab);}panel.append(tabs);
  const body=element('div');body.className='compact-body';panel.append(body);
  if(view==='dictionary'){
   const form=element('form'),input=element('input');input.placeholder='Adicionar palavra';input.setAttribute('aria-label','Palavra do dicionário');const add=button('Adicionar',()=>{});add.type='submit';form.append(input,add);form.onsubmit=e=>{e.preventDefault();if(input.value.trim()){checker.adicionarAoDicionario(input.value);render();}};body.append(form);
   if(!checker.dicionarioPessoal.length)body.append(element('p','Seu dicionário está vazio.'));
   checker.dicionarioPessoal.forEach(word=>{const row=element('article');row.append(element('span',word),button('Remover',()=>{checker.dicionarioPessoal=checker.dicionarioPessoal.filter(w=>w!==word);localStorage.setItem('ajamodular:pcs_spell_dict',JSON.stringify(checker.dicionarioPessoal));checker.verificarTextoNaAPI();render();},'Remover '+word));body.append(row);});
  }else{
   if(paused)body.append(element('p','Revisão pausada. Clique em Retomar para continuar.'));
   else if(!checker.errosEncontrados.length)body.append(element('p','Nenhuma sugestão para este texto.'));
   else checker.errosEncontrados.forEach(error=>{const card=element('article'),original=snapshot.slice(error.offset,error.offset+error.length),suggestion=error.replacements?.[0]?.value;card.append(element('small',error.message||'Revisão sugerida'),element('p',original+(suggestion!==undefined?' → '+suggestion:'')));const row=element('div');if(suggestion!==undefined)row.append(button('Aceitar',()=>apply(error)));row.append(button('Ignorar',()=>{if(!valid())return render();checker.errosEncontrados=checker.errosEncontrados.filter(e=>e!==error);checker.atualizarLinhasOnduladas(snapshot);checker.atualizarBadge();}),button('Salvar palavra',()=>{if(!valid())return render();checker.adicionarAoDicionario(original);},'Salvar '+original+' no dicionário'));card.append(row);body.append(card);});
  }
  const footer=element('footer');footer.append(button('Abrir corretor completo',()=>{dismiss();checker.panel.style.display='flex';checker.renderizarPainel();}));panel.append(footer);position();
 }
 async function rewrite(){
  const field=checker.ultimoCampo,original=text(field),token=++request;if(!original.trim())return;
  const body=panel.querySelector('.compact-body');body.replaceChildren(element('p','Preparando sugestão…'));
  try{const result=await window.askGemini?.('Reescreva em português do Brasil, com clareza e tom profissional. Preserve sentido e fatos. Retorne somente o texto revisado:\n'+original);if(token!==request||panel.hidden)return;if(!result||/^(Erro|Error)/i.test(result))throw Error(result||'Configure a chave Gemini nas configurações.');if(checker.ultimoCampo!==field||text(field)!==original){body.replaceChildren(element('p','O texto mudou. Solicite uma nova revisão.'));return;}
   const preview=element('textarea');preview.value=result;preview.setAttribute('aria-label','Prévia da reescrita');body.replaceChildren(preview,button('Aplicar sugestão',()=>{if(checker.ultimoCampo!==field||text(field)!==original){body.replaceChildren(element('p','O texto mudou. Solicite uma nova revisão.'));return;}if(field.isContentEditable)field.innerText=preview.value;else field.value=preview.value;changed();}));position();
  }catch(error){if(token===request&&!panel.hidden){body.replaceChildren(element('p',error.message));position();}}
 }
 const verify=checker.verificarTextoNaAPI;checker.verificarTextoNaAPI=function(){if(paused)return;return verify.apply(this,arguments);};
 checker.atualizarBadge=function(){const count=this.errosEncontrados.length;badge.className=paused?'paused':count?'has-errors':'clean';badge.textContent=paused?'Ⅱ':String(count);badge.setAttribute('aria-label',paused?'Revisão pausada':count+' sugestões de revisão');badge.title=paused?'Revisão pausada':count+' sugestões — abrir revisão rápida';this.posicionarBadge();if(!panel.hidden&&view==='errors')render();else if(!panel.hidden){panel.querySelector('.compact-tabs button').textContent='Erros ('+count+')';panel.querySelector('nav button').disabled=paused||!count;}};
 checker.posicionarBadge=function(){const field=this.ultimoCampo;if(!field||!this.isVisible(field)){badge.style.display='none';dismiss();return;}const r=field.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight||r.right<0||r.left>innerWidth){badge.style.display='none';dismiss();return;}badge.style.left=Math.max(0,Math.min(r.right-27,innerWidth-25))+'px';badge.style.top=Math.max(0,Math.min(r.bottom-27,innerHeight-25))+'px';badge.style.display='flex';position();};
 document.addEventListener('input',e=>{if(e.target===checker.ultimoCampo){request++;badge.textContent=paused?'Ⅱ':'…';}});
 badge.onclick=()=>{if(!panel.hidden){dismiss();return;}view='errors';panel.hidden=false;badge.setAttribute('aria-expanded','true');checker.popup.style.display='none';render();};
 badge.addEventListener('mousedown',e=>e.preventDefault());panel.addEventListener('mousedown',e=>{if(e.target.closest('button'))e.preventDefault();});
 document.addEventListener('pointerdown',e=>{if(!panel.contains(e.target)&&e.target!==badge)dismiss();},true);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden){dismiss();badge.focus();e.preventDefault();e.stopImmediatePropagation();}},true);
 const hide=checker.ocultarTudo;checker.ocultarTudo=function(){dismiss();return hide.apply(this,arguments);};
 const style=element('style');style.textContent=`
 #spell-badge{position:fixed!important;width:24px!important;min-width:24px!important;height:24px!important;padding:0!important;margin:0!important;border-radius:50%!important;font:600 12px system-ui!important;border:1px solid #fff8!important;box-shadow:0 2px 6px #0003!important;transform:none!important;background:#e83e63!important;color:white!important;animation:none!important}
 #spell-badge.clean{background:#138567!important}#spell-badge.paused{background:#64748b!important}
 #aja-spell-compact{position:fixed;z-index:2147483647;width:min(340px,calc(100vw - 16px));max-height:calc(100vh - 16px);overflow:auto;background:#fff;color:#182b43;border:1px solid #d8e2ee;border-radius:12px;box-shadow:0 10px 35px #0003;font:13px/1.45 system-ui;isolation:isolate}
 #aja-spell-compact[hidden]{display:none!important}#aja-spell-compact *{box-sizing:border-box}
 #aja-spell-compact header,#aja-spell-compact nav,#aja-spell-compact footer{display:flex;align-items:center;gap:6px;padding:10px;border-bottom:1px solid #e4eaf1;flex-wrap:wrap}#aja-spell-compact header{justify-content:space-between}#aja-spell-compact button{font:inherit;color:#123c60;background:#edf4fa;border:1px solid #d5e3ee;border-radius:6px;padding:6px 8px;cursor:pointer;width:auto;min-width:0;box-shadow:none}#aja-spell-compact button:disabled{opacity:.5;cursor:default}#aja-spell-compact button:hover{background:#dfeefa}#aja-spell-compact button:focus-visible{outline:2px solid #005bbb;outline-offset:2px}#aja-spell-compact [aria-pressed=true]{color:#fff;background:#005bbb}
 #aja-spell-compact .compact-body{max-height:280px;overflow:auto;padding:10px}#aja-spell-compact article{padding:10px;margin-bottom:8px;border:1px solid #e0e7ef;border-radius:8px;overflow-wrap:anywhere}#aja-spell-compact article div{display:flex;gap:6px;flex-wrap:wrap}#aja-spell-compact p{margin:6px 0}#aja-spell-compact form{display:flex;gap:6px;margin-bottom:10px}#aja-spell-compact input{min-width:0;width:100%;padding:8px;border:1px solid #bdcede;border-radius:6px}#aja-spell-compact textarea{width:100%;min-height:130px;padding:8px;border:1px solid #bdcede;border-radius:6px;resize:vertical;font:inherit;color:#182b43;background:#fff}
 `;document.head.append(style);checker.atualizarBadge();
};
})();
