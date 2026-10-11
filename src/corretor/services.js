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
        if (modal) {
            modal.dataset.theme = storage.getItem(key('aja_voice_panel_theme')) || 'dark';
            modal.querySelector('#am-key').value = storage.getItem(key('aja_voice_gemini_api_key')) || '';
            modal.showModal(); return;
        }
        modal = document.createElement('dialog');
        modal.id = 'ajamodular-settings';
        const style = document.createElement('style');
        style.textContent = `
            #ajamodular-settings {z-index:2147483647;position:fixed;inset:0;margin:auto;width:min(560px,calc(100vw - 24px));max-height:calc(100vh - 24px);overflow:auto;border:1px solid #ff8200;border-radius:14px;padding:0;background:#102a47;color:#fff;font:14px/1.5 'Segoe UI',sans-serif;box-shadow:0 20px 60px #0008;}
            #ajamodular-settings::backdrop {background:#00152d66;}
            #ajamodular-settings:not([open]) {display:none!important;}
            #ajamodular-settings, #ajamodular-settings * {box-sizing:border-box;}
            #ajamodular-settings header {display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 20px;background:linear-gradient(110deg,#0057b8,#ff8200);color:#fff;}
            #ajamodular-settings h2 {margin:0;color:inherit;font:700 17px 'Segoe UI',sans-serif;}
            #ajamodular-settings .am-body {padding:20px;display:grid;gap:16px;}
            #ajamodular-settings label {display:block;color:inherit;font-weight:600;}
            #ajamodular-settings input {display:block;width:100%;min-width:0;margin-top:8px;padding:10px 12px;background:#173b63;color:#fff;border:1px solid #5783ac;border-radius:7px;font:inherit;}
            #ajamodular-settings p {margin:0;color:inherit;}
            #ajamodular-settings .am-actions {display:flex;flex-wrap:wrap;gap:8px;}
            #ajamodular-settings button {display:inline-flex;align-items:center;justify-content:center;min-height:36px;padding:8px 12px;border:1px solid #ff8200;border-radius:7px;background:#0057b8;color:#fff;cursor:pointer;font:600 13px 'Segoe UI',sans-serif;}
            #ajamodular-settings button:disabled {opacity:.55;cursor:wait;}
            #ajamodular-settings[data-theme="light"] {background:#f8fbff;color:#173b63;}
            #ajamodular-settings[data-theme="light"] input {background:#fff;color:#173b63;border-color:#9eb8d1;}
            #ajamodular-settings #am-status {min-height:24px;overflow-wrap:anywhere;}
        `;
        modal.appendChild(style);
        modal.insertAdjacentHTML('beforeend', '<header><h2>Configurações do corretor e tradutor</h2><button id="am-close" aria-label="Fechar configurações">×</button></header><div class="am-body"><section><label for="am-key">Chave Gemini</label><input type="password" autocomplete="off" id="am-key" placeholder="Cole sua chave Gemini"><p>A chave fica neste navegador. A revisão por IA envia o texto ao Gemini.</p></section><div class="am-actions"><button id="am-save">Salvar chave</button><button id="am-test">Testar Gemini</button><button id="am-remove">Remover chave</button></div><section><label>Aparência do corretor</label><div class="am-actions"><button id="am-dark">Tema escuro</button><button id="am-light">Tema claro</button></div></section><p id="am-status" role="status" aria-live="polite"></p></div>');
        modal.dataset.theme = storage.getItem(key('aja_voice_panel_theme')) || 'dark';
        document.body.appendChild(modal);
        const input = modal.querySelector('#am-key'); input.value = storage.getItem(key('aja_voice_gemini_api_key')) || '';
        const status = modal.querySelector('#am-status');
        modal.querySelector('#am-save').onclick = () => { storage.setItem(key('aja_voice_gemini_api_key'), input.value.trim()); storage.removeItem(key('aja_voice_gemini_model')); status.textContent='Chave salva.'; };
        modal.querySelector('#am-remove').onclick = () => { input.value=''; storage.removeItem(key('aja_voice_gemini_api_key')); storage.removeItem(key('aja_voice_gemini_model')); status.textContent='Chave removida.'; };
        const closeSettings = () => { modal.close(); modal.remove(); };
        modal.querySelector('#am-close').onclick = event => { event.preventDefault(); event.stopPropagation(); closeSettings(); };
        modal.addEventListener('cancel', event => { event.preventDefault(); closeSettings(); });
        const setTheme = theme => {
            storage.setItem(key('aja_voice_panel_theme'), theme); modal.dataset.theme = theme;
            const panel = document.getElementById('spell-main-panel');
            panel?.classList.toggle('aja-voice-dark', theme === 'dark');
            panel?.classList.toggle('aja-voice-light', theme === 'light');
            const button = panel?.querySelector('#btn-voice-theme');
            if (button) { button.textContent = theme === 'dark' ? '☀' : '🌙'; button.title = theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'; }
        };
        modal.querySelector('#am-dark').onclick = () => setTheme('dark');
        modal.querySelector('#am-light').onclick = () => setTheme('light');
        modal.querySelector('#am-test').onclick = async event => {
            event.target.disabled=true; status.textContent='Consultando modelos compatíveis…';
            try { await api.askGemini('Responda somente OK'); status.textContent='Gemini respondeu usando ' + storage.getItem(key('aja_voice_gemini_model')); }
            catch(error) { status.textContent=error.message; }
            finally { event.target.disabled=false; }
        };
        modal.showModal();
    };
})();
