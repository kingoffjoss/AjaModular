window.AjaModular.register('manutencao', [], function(){
 let panel,busy=false;
 function download(name,data){const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 function message(text){panel.querySelector('[role="status"]').textContent=text;}
 async function run(action){if(busy)return;busy=true;const buttons=[...panel.querySelectorAll('button')];buttons.forEach(x=>x.disabled=true);try{await action();}catch(error){message(error.message);}finally{busy=false;buttons.forEach(x=>x.disabled=false);}}
 function render(){const list=panel.querySelector('#aja-module-health');list.replaceChildren();for(const item of window.AjaModular.status()){const row=document.createElement('li');row.textContent=item.id+': '+(item.ready?'pronto':item.error||'aguardando');list.appendChild(row);}}
 function open(){
 if(panel?.isConnected){panel.showModal();render();return;}
 panel=document.createElement('dialog');panel.id='aja-maintenance';panel.innerHTML=`<header><strong>Manutenção das ferramentas</strong><button data-close aria-label="Fechar">×</button></header><main><h3>Backup e recuperação</h3><p>O backup reúne configurações, catálogos, favoritos, horários e anotações deste navegador. Chaves de API não são incluídas.</p><button id="aja-export">Exportar backup</button> <button id="aja-import">Importar backup</button> <button id="aja-recover">Recuperar antes da última importação</button><input type="file" accept=".json,application/json" hidden><p>Após importar ou recuperar, recarregue a página para aplicar. A importação mantém os dados que não estão no arquivo.</p><p role="status" aria-live="polite"></p><h3>Módulos</h3><button id="aja-retry">Tentar carregar módulos com falha</button><ul id="aja-module-health"></ul><button id="aja-diagnostic">Exportar diagnóstico</button><h3>Dados preservados</h3><p>Dados inválidos são preservados para revisão, sem impedir o carregamento das ferramentas.</p><button id="aja-invalid">Exportar dados preservados</button></main>`;
 document.body.appendChild(panel);panel.querySelector('[data-close]').onclick=()=>panel.close();
 panel.querySelector('#aja-export').onclick=()=>run(async()=>{download('AjaModular-backup.json',await window.AjaModularData.snapshot());message('Backup exportado.');});
 const input=panel.querySelector('input');panel.querySelector('#aja-import').onclick=()=>input.click();
 input.onchange=()=>run(async()=>{const file=input.files[0];input.value='';if(!file)return;if(file.size>10*1024*1024)throw Error('Arquivo maior que 10 MB');const data=window.AjaModularData.validate(JSON.parse(await file.text()));await window.AjaModularData.apply(data);message('Backup importado. Recarregue a página.');});
 panel.querySelector('#aja-recover').onclick=()=>run(async()=>{await window.AjaModularData.restore();message('Configurações recuperadas. Recarregue a página.');});
 panel.querySelector('#aja-retry').onclick=()=>run(async()=>{window.AjaModular.retry();render();message('Diagnóstico atualizado.');});
 panel.querySelector('#aja-diagnostic').onclick=()=>download('AjaModular-diagnostico.json',{version:'1.6.39',modules:window.AjaModular.status(),date:new Date().toISOString()});
 panel.querySelector('#aja-invalid').onclick=()=>{const data={};for(const storage of [localStorage,sessionStorage])for(let i=0;i<storage.length;i++){const key=storage.key(i);if(key.startsWith('ajamodular:maintenance:invalid:'))data[key]=storage.getItem(key);}download('AjaModular-dados-preservados.json',data);};
 panel.showModal();render();
 }
 return {open};
});


