(function () {
    'use strict';
    const storage = window.localStorage;
    const key = name => 'ajamodular:' + name;
    const normalize = value => String(value || '').trim().normalize('NFC').toLocaleLowerCase('pt-BR');
    const api = window.AjaModularSpell = {
        normalize,
        readDictionary() {
            try {
                const value = JSON.parse(storage.getItem(key('pcs_spell_dict')) || '[]');
                return Array.isArray(value) ? [...new Set(value.filter(v => typeof v === 'string').map(normalize).filter(Boolean))] : [];
            } catch { return []; }
        },
        filterMatches(matches, text, dictionary) {
            const words = new Set((dictionary || []).map(normalize));
            return matches.filter(match => {
                // Personal words suppress spelling errors only, preserving grammar/punctuation warnings.
                const spelling = match.rule?.issueType === 'misspelling' || /TYPOS|SPELL/i.test(match.rule?.category?.id || '');
                return !spelling || !words.has(normalize(text.slice(match.offset, match.offset + match.length)));
            });
        },
        async request(url, options = {}) {
            if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
                return new Promise((resolve, reject) => chrome.runtime.sendMessage({action:'fetchAPI',url,options}, response => {
                    if (chrome.runtime.lastError || !response?.success) return reject(new Error('Não foi possível consultar o serviço.'));
                    resolve({ok:response.status >= 200 && response.status < 300,status:response.status,json:async()=>JSON.parse(response.text)});
                }));
            }
            return fetch(url, options);
        },
        async askGemini(prompt, providedKey) {
            const secret = providedKey || storage.getItem(key('aja_voice_gemini_api_key')) || '';
            if (!secret) throw new Error('Configure sua chave Gemini.');
            const headers = {'x-goog-api-key':secret};
            const response = await api.request('https://generativelanguage.googleapis.com/v1beta/models', {headers});
            const list = await response.json();
            if (!response.ok) throw new Error('ListModels: ' + response.status);
            const models = (list.models || []).filter(m => m.supportedGenerationMethods?.includes('generateContent'));
            models.sort((a,b) => Number(/flash/.test(b.name)) - Number(/flash/.test(a.name)));
            const remembered = storage.getItem(key('aja_voice_gemini_model'));
            models.sort((a,b) => Number(b.name === remembered) - Number(a.name === remembered));
            for (const model of models) {
                const result = await api.request('https://generativelanguage.googleapis.com/v1beta/' + model.name + ':generateContent', {
                    method:'POST',headers:{...headers,'Content-Type':'application/json'},
                    body:JSON.stringify({contents:[{parts:[{text:String(prompt)}]}],generationConfig:{temperature:0.2,maxOutputTokens:2048}})
                });
                if (!result.ok) {
                    if ([400,404].includes(result.status)) continue;
                    throw new Error('Gemini: ' + result.status);
                }
                const data = await result.json();
                const text = (data.candidates?.[0]?.content?.parts || []).map(p=>p.text || '').join('\n').trim();
                if (text) { storage.setItem(key('aja_voice_gemini_model'), model.name); return text; }
            }
            throw new Error('Nenhum modelo compatível respondeu com texto.');
        }
    };
    const original = window.askGemini;
    window.askGemini = prompt => storage.getItem(key('aja_voice_gemini_api_key')) ? api.askGemini(prompt) : original ? original(prompt) : Promise.reject(new Error('Configure sua chave Gemini.'));
    window.AjaModularOpenSettings = () => {
        let modal = document.getElementById('ajamodular-settings');
        if (modal) { modal.showModal(); return; }
        modal = document.createElement('dialog');
        modal.id = 'ajamodular-settings';
        modal.style.cssText = 'z-index:2147483647;border:2px solid #ff8200;border-radius:16px;padding:24px;background:#102a47;color:white;width:min(480px,85vw)';
        modal.innerHTML = '<h2>Configurações do corretor</h2><label>Chave Gemini <input type="password" autocomplete="off" id="am-key" style="display:block;width:100%;margin:12px 0"></label><p>A revisão envia o texto ao serviço escolhido. A chave fica neste navegador.</p><button id="am-save">Salvar</button> <button id="am-test">Testar Gemini</button> <button id="am-remove">Remover chave</button> <button id="am-close">Fechar</button><p id="am-status" aria-live="polite"></p>';
        document.body.appendChild(modal);
        const input = modal.querySelector('#am-key'); input.value = storage.getItem(key('aja_voice_gemini_api_key')) || '';
        const status = modal.querySelector('#am-status');
        modal.querySelector('#am-save').onclick = () => { storage.setItem(key('aja_voice_gemini_api_key'), input.value.trim()); storage.removeItem(key('aja_voice_gemini_model')); status.textContent='Chave salva.'; };
        modal.querySelector('#am-remove').onclick = () => { input.value=''; storage.removeItem(key('aja_voice_gemini_api_key')); storage.removeItem(key('aja_voice_gemini_model')); status.textContent='Chave removida.'; };
        modal.querySelector('#am-close').onclick = () => modal.close();
        modal.querySelector('#am-test').onclick = async event => {
            event.target.disabled=true; status.textContent='Consultando modelos compatíveis…';
            try { await api.askGemini('Responda somente OK'); status.textContent='Gemini respondeu usando ' + storage.getItem(key('aja_voice_gemini_model')); }
            catch(error) { status.textContent=error.message; }
            finally { event.target.disabled=false; }
        };
        modal.showModal();
    };
})();
