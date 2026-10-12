(function(){
'use strict';
const clone=value=>JSON.parse(JSON.stringify(value));
function normalize(items){if(!Array.isArray(items))throw Error('O catálogo não é uma lista');return items.map((item,index)=>{if(!item||typeof item.title!=='string'||typeof item.text!=='string')throw Error('Item inválido na posição '+(index+1));return {...item,isFavorite:Boolean(item.isFavorite),requiredData:Array.isArray(item.requiredData)?item.requiredData:[],hotkey:typeof item.hotkey==='string'&&item.hotkey.trim()?item.hotkey.trim():null};});}
function load(storage,key,defaults,area){const raw=storage.getItem(key);if(!raw)return normalize(clone(defaults));try{const items=normalize(JSON.parse(raw));if(!items.length){storage.removeItem(key);window.AjaModularNotice?.(area+' restaurado com os dados padrão.');return normalize(clone(defaults));}return items;}catch(error){window.AjaModularReportError?.(area+' — dados salvos inválidos',error);storage.removeItem(key);return normalize(clone(defaults));}}
function save(storage,key,items,area){try{const normalized=normalize(items);storage.setItem(key,JSON.stringify(normalized));return normalized;}catch(error){window.AjaModularReportError?.(area+' — não foi possível salvar',error);throw error;}}
function escapeHTML(value){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));}
window.AjaModularCatalogStore=Object.freeze({clone,normalize,load,save,escapeHTML});
})();
