(function(){
'use strict';
const prefix='ajamodular:', reserved=prefix+'maintenance:', recovery=reserved+'recovery';
const arrays=new Set(['bau_favorites_v1','bau_recent_v1','menu_favorites_v1','menu_order_v1','bau_commandDatabase_v1','quickReplies','pr_protocolos','qr_quickReplies','qr_recentReplies_v3','pr_recentProtocols_v1','purecloudScript_idHistory','gerenciadorPausas_horarios','pcs_spell_dict','smart-ultimate-h','genesys_offline_queue_v1']);
const objects=new Set(['window_layout_v1','hotkeys','gcp_themeColors_v2','timerColors','popupPositions','car_data_v8_master','gerenciadorPausas_notifConfig','gerenciadorPausas_posMain','gerenciadorPausas_posConfig','uniMenuPos','qr_customThemeColors','dailyAnalytics_v2_data','achievements_v2','encerramentoCounters_v4_balao']);
const extensionKeys=['car_data_v8_master','car_theme_v8','agentName','IA_THEME','geminiHistory','ajamodular_enabled','SHOW_AGENT_TOOLS','MOD_CRONOMETROS','MOD_PAUSAS','MOD_PROTOCOLOS','MOD_RESPOSTAS','MOD_BAR','MOD_IA','MOD_CAR','MOD_ID','MOD_MENU','MOD_CALC'];
const secret=k=>/api.?key|geminikey|token|password|senha|credential/i.test(k);
function valid(key,value){
 const name=key.startsWith(prefix)?key.slice(prefix.length):key;
 if(typeof value!=='string') throw Error('Valor inválido: '+name);
 let parsed;
 if(arrays.has(name)||objects.has(name)){parsed=JSON.parse(value);if(arrays.has(name)&&!Array.isArray(parsed))throw Error('Lista inválida: '+name);if(objects.has(name)&&(!parsed||Array.isArray(parsed)||typeof parsed!=='object'))throw Error('Configuração inválida: '+name);}
 if(name==='pr_protocolos'||name==='qr_quickReplies') {if(parsed.some(x=>!x||typeof x.title!=='string'||typeof x.text!=='string'))throw Error('Catálogo inválido: '+name);}
 if(name==='bau_commandDatabase_v1'&&parsed.some(group=>!group||typeof group.title!=='string'||!Array.isArray(group.commands)||group.commands.some(c=>!c||typeof c.id!=='string'||typeof c.label!=='string'||!c.os||typeof c.os!=='object'||Array.isArray(c.os)||!Object.keys(c.os).length||Object.entries(c.os).some(([os,cmd])=>!['win','mac','linux'].includes(os)||typeof cmd!=='string'))))throw Error('Catálogo de comandos inválido');
 if(name==='gerenciadorPausas_horarios'&&parsed.some(x=>!x||!/^([01]\d|2[0-3]):[0-5]\d$/.test(x.hora)||typeof x.status!=='string'))throw Error('Horário inválido');
 if(name==='dailyAnalytics_v2_data'&&parsed.conversations!==undefined&&!Array.isArray(parsed.conversations))throw Error('Histórico de conversas inválido');
 if(name==='encerramentoCounters_v4_balao'&&parsed.balao!==undefined&&!Array.isArray(parsed.balao))throw Error('Contadores inválidos');
 if(name==='car_data_v8_master'&&Object.values(parsed).some(x=>typeof x!=='string'))throw Error('Comando CAR inválido');
 return value;
}
function adapter(storage){return {getItem(key){const value=storage.getItem(prefix+key);if(value===null)return null;try{return valid(key,value);}catch(error){
 // Never overwrite an earlier recovery entry or discard data when the recovery write fails.
 const backup=reserved+'invalid:'+key;
 try {if(storage.getItem(backup)===null)storage.setItem(backup,value);storage.removeItem(prefix+key);}catch(e){console.error('[AjaModular] Não foi possível preservar dados',e);}
 console.warn('[AjaModular] Dado preservado para recuperação: '+key,error);return null;
}},setItem:(key,value)=>storage.setItem(prefix+key,String(value)),removeItem:key=>storage.removeItem(prefix+key)};}
function collect(storage){const data={};for(let i=0;i<storage.length;i++){const key=storage.key(i);if(key.startsWith(prefix)&&!key.startsWith(reserved)&&!secret(key))data[key]=storage.getItem(key);}return data;}
function chromeRead(){return new Promise((resolve,reject)=>{if(!window.chrome?.storage?.local)return resolve({});chrome.storage.local.get(extensionKeys,data=>chrome.runtime.lastError?reject(Error(chrome.runtime.lastError.message)):resolve(JSON.parse(JSON.stringify(data))));});}
function chromeWrite(data){return new Promise((resolve,reject)=>{if(!Object.keys(data).length)return resolve();if(!window.chrome?.storage?.local)return reject(Error('Este backup contém dados da extensão. Importe pela extensão.'));chrome.storage.local.set(data,()=>chrome.runtime.lastError?reject(Error(chrome.runtime.lastError.message)):resolve());});}
async function snapshot(){return {format:'AjaModular-backup',schema:1,createdAt:new Date().toISOString(),local:collect(localStorage),session:collect(sessionStorage),extension:await chromeRead()};}
function validate(data){
 if(!data||data.format!=='AjaModular-backup'||data.schema!==1)throw Error('Backup AjaModular incompatível');
 for(const section of ['local','session','extension'])if(!data[section]||Array.isArray(data[section])||typeof data[section]!=='object')throw Error('Seção inválida: '+section);
 for(const section of ['local','session'])for(const [key,value]of Object.entries(data[section])){if(!key.startsWith(prefix)||key.startsWith(reserved)||secret(key))throw Error('Chave não permitida: '+key);valid(key,value);}
 for(const [key,value]of Object.entries(data.extension)){if(!extensionKeys.includes(key))throw Error('Configuração da extensão inválida');if(key==='car_data_v8_master')valid(key,JSON.stringify(value));else if(key==='geminiHistory'&&!Array.isArray(value))throw Error('Histórico IA inválido');else if((key.startsWith('MOD_')||['ajamodular_enabled','SHOW_AGENT_TOOLS'].includes(key))&&typeof value!=='boolean')throw Error('Preferência inválida');else if(key==='agentName'&&typeof value!=='string')throw Error('Nome inválido');else if(['car_theme_v8','IA_THEME'].includes(key)&&!['dark','light'].includes(value))throw Error('Tema CAR inválido');}
 return data;
}
async function apply(data,replace=false){validate(data);const old=await snapshot();const undo=[];
 // Preserve the complete prior state before changing any live settings.
 localStorage.setItem(recovery,JSON.stringify(old));
 try{if(replace)for(const [name,storage]of [['local',localStorage],['session',sessionStorage]])for(const key of Object.keys(collect(storage)))if(!Object.hasOwn(data[name],key)){undo.push([storage,key,storage.getItem(key)]);storage.removeItem(key);}
 for(const [name,storage]of [['local',localStorage],['session',sessionStorage]])for(const [key,value]of Object.entries(data[name])){undo.push([storage,key,storage.getItem(key)]);storage.setItem(key,value);}await chromeWrite(data.extension);if(replace&&window.chrome?.storage?.local){const missing=Object.keys(old.extension).filter(k=>!Object.hasOwn(data.extension,k));if(missing.length)await new Promise((resolve,reject)=>chrome.storage.local.remove(missing,()=>chrome.runtime.lastError?reject(Error(chrome.runtime.lastError.message)):resolve()));}}
 catch(error){for(const [storage,key,value]of undo.reverse())value===null?storage.removeItem(key):storage.setItem(key,value);throw error;}
}
async function restore(){const value=localStorage.getItem(recovery);if(!value)throw Error('Nenhum backup anterior disponível');await apply(JSON.parse(value),true);}
window.AjaModularData=Object.freeze({adapter,valid,snapshot,validate,apply,restore});
})();
