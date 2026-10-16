// Shared dependencies: ajaStorage
window.AjaModular.register("car", ["compatibility"], function(ctx) {
    /* --- MÓDULO ANEXADO: CAR.JS --- */
    try {
        // ==UserScript==
        // @name         PureCloud - CAR (Automação Rápida v3.1)
        // @description  Módulo de Automação Híbrido com Importador de Texto Restaurado.
        // ==/UserScript==

        (function () {
            'use strict';

            const STORAGE_KEY = 'car_data_v8_master';
            const THEME_KEY = 'car_theme_v8';
            const SYNC_CONFIG_KEY = 'car_github_sync_v1';
            const SYNC_TOKEN_KEY = 'car_github_token_v1';
            const SYNC_BASE_KEY = 'car_github_base_v1';

            // DETECTOR DE AMBIENTE
            const isExtension = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;

            // COMANDOS PADRÃO
            const defaultScripts = {
                "ex1": "Exemplo de texto expandido automaticamente.",
                "ajuda": "Digite o atalho e aperte ESPAÇO para expandir."
            };
            const isScriptMap = value => value !== null && typeof value === 'object' && !Array.isArray(value) &&
                Object.entries(value).every(([key, text]) => key.length > 0 && typeof text === 'string');

            let scripts = {};
            let isDark = true;
            let syncTimer, syncing = false, revision = 0;
            const readJSON = (key, fallback) => { try { return JSON.parse(ctx.ajaStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; } };
            const syncConfig = () => readJSON(SYNC_CONFIG_KEY, null);
            const syncToken = () => { try { return sessionStorage.getItem(SYNC_TOKEN_KEY) || ctx.ajaStorage.getItem(SYNC_TOKEN_KEY) || ''; } catch { return ctx.ajaStorage.getItem(SYNC_TOKEN_KEY) || ''; } };
            const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
            function mergeScriptMaps(base, local, remote) {
                const merged = {};
                for (const key of new Set([...Object.keys(base), ...Object.keys(local), ...Object.keys(remote)])) {
                    const value = local[key] !== base[key] ? local[key] : remote[key];
                    if (value !== undefined) merged[key] = value;
                }
                return merged;
            }
            const utf8Base64 = text => { const bytes = new TextEncoder().encode(text); let binary = ''; for (const byte of bytes) binary += String.fromCharCode(byte); return btoa(binary); };
            const fromBase64 = text => new TextDecoder().decode(Uint8Array.from(atob(text.replace(/\s/g, '')), char => char.charCodeAt(0)));
            function syncStatus(message, error = false) {
                const node = document.getElementById('car-sync-status');
                if (node) { node.textContent = message; node.style.color = error ? '#f87171' : 'var(--box-text)'; }
            }
            function scheduleSync(delay = 500) {
                if (window.self !== window.top) return;
                if (!syncConfig()?.repository || !syncToken()) return;
                clearTimeout(syncTimer);
                syncStatus('Alterações locais salvas. Sincronizando…');
                syncTimer = setTimeout(syncGitHub, delay);
            }
            async function syncGitHub() {
                if (syncing) { scheduleSync(1000); return; }
                const config = syncConfig(), token = syncToken();
                if (!config?.repository || !token) return;
                syncing = true;
                const startedAt = revision;
                const local = { ...scripts };
                const base = readJSON(SYNC_BASE_KEY, null) || (ctx.ajaStorage.getItem(STORAGE_KEY) ? {} : defaultScripts);
                const headers = { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
                try {
                    const repositoryResponse = await fetch(`https://api.github.com/repos/${config.repository}`, { headers, cache: 'no-store' });
                    if (!repositoryResponse.ok) throw Error(`Não foi possível acessar o repositório (${repositoryResponse.status})`);
                    const repository = await repositoryResponse.json();
                    if (!repository.private) throw Error('Use um repositório privado para não publicar os textos de atendimento');
                    const branch = repository.default_branch;
                    const url = `https://api.github.com/repos/${config.repository}/contents/${config.path.split('/').map(encodeURIComponent).join('/')}?ref=${encodeURIComponent(branch)}`;
                    let merged, sha, remote;
                    for (let attempt = 0; attempt < 3; attempt++) {
                        const get = await fetch(url, { headers, cache: 'no-store' });
                        if (get.status === 404) { remote = {}; sha = undefined; }
                        else {
                            if (!get.ok) throw Error(`GitHub respondeu ${get.status} ao ler os comandos`);
                            const file = await get.json();
                            sha = file.sha;
                            remote = JSON.parse(fromBase64(file.content || ''));
                            if (!isScriptMap(remote)) throw Error('O arquivo remoto não contém um mapa de comandos válido');
                        }
                        merged = mergeScriptMaps(base, local, remote);
                        if (same(merged, remote)) break;
                        const put = await fetch(url.split('?')[0], { method: 'PUT', headers, body: JSON.stringify({ message: 'Atualizar atalhos do CAR', branch, content: utf8Base64(JSON.stringify(merged, null, 2) + '\n'), ...(sha ? { sha } : {}) }) });
                        if (put.status === 409 && attempt < 2) continue;
                        if (!put.ok) throw Error(`GitHub respondeu ${put.status} ao salvar os comandos`);
                        break;
                    }
                    ctx.ajaStorage.setItem(SYNC_BASE_KEY, JSON.stringify(merged));
                    if (revision === startedAt) {
                        scripts = merged;
                        Storage.set({ scripts: merged }, false);
                        if (document.getElementById('car-panel')) window.updateVisualList?.();
                    } else scheduleSync(1000);
                    syncStatus('Sincronizado com GitHub agora.');
                } catch (error) {
                    syncStatus('Falha na sincronização: ' + error.message + '. Seus comandos continuam salvos neste navegador.', true);
                } finally { syncing = false; }
            }

            // --- ARMAZENAMENTO HÍBRIDO ---
            const Storage = {
                get: (callback) => {
                    if (isExtension) {
                        chrome.storage.local.get([STORAGE_KEY, THEME_KEY], (res) => {
                            callback({ scripts: isScriptMap(res[STORAGE_KEY]) ? res[STORAGE_KEY] : defaultScripts, theme: res[THEME_KEY] || 'dark' });
                        });
                    } else {
                        const s = ctx.ajaStorage.getItem(STORAGE_KEY);
                        const t = ctx.ajaStorage.getItem(THEME_KEY);
                        let saved;
                        try { saved = s ? JSON.parse(s) : null; } catch { saved = null; }
                        callback({ scripts: isScriptMap(saved) ? saved : defaultScripts, theme: t || 'dark' });
                    }
                },
                set: (data, sync = true) => {
                    if (isExtension) {
                        let saveObj = {};
                        if (data.scripts) saveObj[STORAGE_KEY] = data.scripts;
                        if (data.theme) saveObj[THEME_KEY] = data.theme;
                        chrome.storage.local.set(saveObj);
                    } else {
                        if (data.scripts) ctx.ajaStorage.setItem(STORAGE_KEY, JSON.stringify(data.scripts));
                        if (data.theme) ctx.ajaStorage.setItem(THEME_KEY, data.theme);
                    }
                    if (data.scripts) { scripts = data.scripts; if (sync) { revision++; scheduleSync(); } }
                    if (data.theme) isDark = (data.theme === 'dark');
                }
            };

            function loadData() {
                Storage.get((data) => {
                    scripts = data.scripts;
                    isDark = (data.theme === 'dark');
                    if (isExtension && !data.scripts) Storage.set({ scripts: defaultScripts });
                    scheduleSync(1500);
                });
            }

            // --- CSS CORRIGIDO (Importador Fixo) ---
            const styles = `
                #car-panel {
                    --bg-panel: #ffffff; --text-main: #1f2937; --text-sec: #6b7280;
                    --bg-input: #f3f4f6; --border-input: #e5e7eb; --bg-item: #ffffff;
                    --accent: #10b981; --accent-grad: linear-gradient(135deg, #10b981, #3b82f6);
                    --box-bg: #eff6ff; --box-border: #bfdbfe; --box-text: #1e40af;
                    
                    font-family: 'Segoe UI', sans-serif; position: fixed; bottom: 100px; right: 90px;
                    width: 360px; height: 650px; background: var(--bg-panel); border-radius: 16px;
                    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.4); display: none; flex-direction: column;
                    z-index: 2147483648; border: 1px solid rgba(0,0,0,0.1); transition: opacity 0.2s;
                }
                #car-panel.dark-mode {
                    --bg-panel: #1f2937; --text-main: #f9fafb; --text-sec: #9ca3af;
                    --bg-input: #374151; --border-input: #4b5563; --bg-item: #111827;
                    --box-bg: #1e293b; --box-border: #334155; --box-text: #93c5fd;
                    border: 1px solid rgba(255,255,255,0.1);
                }
                .car-header { background: var(--accent-grad); padding: 15px; color: white; display: flex; justify-content: space-between; align-items: center; cursor: move; border-radius: 15px 15px 0 0; flex-shrink: 0; }
                .car-title { font-weight: 700; font-size: 15px; display: flex; align-items: center; gap: 8px; }
                .header-actions { display: flex; gap: 8px; }
                .btn-icon-header { background: rgba(255,255,255,0.2); border: none; color: white; width: 28px; height: 28px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; font-size: 14px; }
                .btn-icon-header:hover { background: rgba(255,255,255,0.4); transform: scale(1.1); }
                
                .car-body { flex: 1; display: flex; flex-direction: column; padding: 15px; gap: 10px; overflow: hidden; background: var(--bg-panel); border-radius: 0 0 15px 15px; }
                
                .info-box { display: none; background: var(--box-bg); border: 1px solid var(--box-border); color: var(--box-text); padding: 12px; border-radius: 8px; font-size: 12px; margin-bottom: 5px; animation: carFadeIn 0.3s; flex-shrink: 0; }
                @keyframes carFadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
        
                #car-panel, #car-panel * { box-sizing: border-box; }
                #car-panel { max-width: calc(100vw - 16px); max-height: calc(100vh - 16px); }
                .car-inputs { display: flex; flex-direction: column; gap: 8px; flex-shrink: 0; min-width: 0; }
                #car-panel .car-input { width: 100%; min-width: 0; flex: none; }
                #car-panel #car-new-val { min-height: 76px; max-height: 220px; resize: vertical; white-space: pre-wrap; overflow-wrap: anywhere; }
                .car-input { background: var(--bg-input); border: 1px solid var(--border-input); color: var(--text-main); padding: 10px; border-radius: 8px; font-size: 13px; outline: none; flex: 1; transition: 0.2s; }
                .car-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2); }
                .input-key { flex: 0 0 30%; font-weight: bold; }
                
                .btn-save { background: var(--accent-grad); border: none; color: white; padding: 10px; border-radius: 8px; font-weight: 600; cursor: pointer; width: 100%; transition: 0.2s; flex-shrink: 0; }
                .btn-save:hover { filter: brightness(1.1); transform: translateY(-1px); }
                
                #car-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding-right: 5px; margin-top: 5px; min-height: 100px; }
                .car-item { background: var(--bg-item); padding: 10px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05); border-left: 3px solid transparent; border: 1px solid var(--border-input); transition: 0.2s; }
                .car-item:hover { border-left-color: #10b981; transform: translateX(2px); }
                
                .item-content { overflow: hidden; display:flex; gap:10px; align-items:center; }
                .item-key { font-weight: 800; color: #10b981; display: block; font-size: 13px; min-width: 50px;}
                .item-val { color: var(--text-sec); font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; max-width: 170px; }
                .item-actions button { background: none; border: none; cursor: pointer; font-size: 14px; opacity: 0.6; transition: 0.2s; padding: 4px; }
                .item-actions button:hover { opacity: 1; transform: scale(1.2); background: rgba(0,0,0,0.05); border-radius: 4px; }
        
                /* IMPORTADOR (Restaurado e Fixo) */
                .import-section { 
                    border-top: 1px solid var(--border-input); 
                    padding-top: 10px; 
                    margin-top: auto; /* Empurra para o fundo */
                    flex-shrink: 0; 
                }
                .toggle-import { 
                    font-size: 12px; color: var(--text-sec); text-align: center; cursor: pointer; 
                    padding: 8px; border-radius: 6px; transition: 0.2s; background: var(--bg-input); 
                    font-weight: 600; 
                }
                .toggle-import:hover { color: #10b981; background: var(--bg-item); border: 1px solid var(--border-input); }
                
                #import-area { display: none; flex-direction: column; gap: 8px; margin-top: 8px; }
                .area-bulk { 
                    width: 100%; height: 100px; background: var(--bg-input); color: var(--text-main); 
                    border: 1px solid var(--border-input); border-radius: 6px; padding: 8px; 
                    font-size: 11px; resize: none; font-family: monospace;
                }
                .btn-settings-action { width: 100%; padding: 8px; margin-top: 5px; border-radius: 6px; border: 1px solid var(--box-border); background: var(--bg-item); cursor: pointer; color: var(--text-main); display: flex; align-items: center; justify-content: center; gap: 8px; transition: 0.2s; }
                .btn-settings-action:hover { background: var(--box-bg); }
                #car-settings-box { max-height: min(390px, 55vh); overflow-y: auto; }
                #car-settings-box .car-input { display: block; width: 100%; margin: 6px 0; }
        
                #car-panel ::-webkit-scrollbar { width: 5px; }
                #car-panel ::-webkit-scrollbar-thumb { background: #ccc; border-radius: 10px; }
            `;

            function createUI() {
                if (window.self !== window.top || document.getElementById('car-panel')) return;

                const styleSheet = document.createElement("style");
                styleSheet.innerText = styles;
                document.head.appendChild(styleSheet); window.AjaModular.scopeStyle('car',styleSheet);

                const container = document.createElement('div');
                container.id = 'car-panel';
                if (isDark) container.classList.add('dark-mode');

                container.innerHTML = `
                    <div class="car-header">
                        <div class="car-title"><span style="font-size:18px">💻</span> CAR Automação</div>
                        <div class="header-actions">
                            <button id="car-theme-btn" class="btn-icon-header" title="Alternar Tema">🌓</button>
                            <button id="car-settings-btn" class="btn-icon-header" title="Backup e Restaurar">⚙️</button>
                            <button id="car-help-btn" class="btn-icon-header" title="Ajuda">?</button>
                            <button id="car-close-btn" class="btn-icon-header" title="Fechar">✖</button>
                        </div>
                    </div>
                    <div class="car-body">
                        
                        <div id="car-settings-box" class="info-box">
                            <strong style="display:block; margin-bottom:5px; border-bottom:1px solid var(--box-border); padding-bottom:3px;">Gerenciar Backup</strong>
                            <button id="car-btn-export" class="btn-settings-action">⬇️ Exportar JSON</button>
                            <button id="car-btn-restore" class="btn-settings-action">⬆️ Importar JSON</button>
                            <input type="file" id="car-file-restore" style="display:none" accept=".json">
                            <strong style="display:block; margin:12px 0 5px;">Sincronização com GitHub</strong>
                            <input id="car-sync-repo" class="car-input" type="text" placeholder="usuario/repositorio-privado" aria-label="Repositório GitHub">
                            <input id="car-sync-path" class="car-input" type="text" placeholder="car-comandos.json" aria-label="Arquivo de comandos no repositório">
                            <input id="car-sync-token" class="car-input" type="password" autocomplete="off" placeholder="Token de acesso do GitHub" aria-label="Token de acesso do GitHub">
                            <label style="display:block;margin:6px 0;"><input id="car-sync-remember" type="checkbox"> Lembrar token neste navegador</label>
                            <small>Use um repositório privado e um token limitado a ele, com permissão Contents: Read and write. O token nunca entra no arquivo de comandos.</small>
                            <button id="car-sync-connect" class="btn-settings-action">Conectar e sincronizar</button>
                            <button id="car-sync-now" class="btn-settings-action">Sincronizar agora</button>
                            <button id="car-sync-disconnect" class="btn-settings-action">Desconectar GitHub</button>
                            <div id="car-sync-status" role="status" aria-live="polite" style="margin-top:6px;font-size:12px;"></div>
                        </div>
        
                        <div id="car-help-box" class="info-box">
                            <strong style="display:block; margin-bottom:5px; border-bottom:1px solid var(--box-border); padding-bottom:3px;">Como usar:</strong>
                            1. Digite o atalho no chat (ex: <b>ex1</b>)<br>
                            2. Aperte a tecla <b>ESPAÇO</b>.<br>
                            3. O texto será substituído magicamente! ✨
                        </div>
        
                        <div class="car-inputs">
                            <input id="car-new-key" class="car-input input-key" type="text" placeholder="Atalho">
                            <textarea id="car-new-val" class="car-input" rows="3" placeholder="Texto da mensagem..."></textarea>
                        </div>
                        <button id="car-btn-add" class="btn-save">💾 Salvar Comando</button>
        
                        <div id="car-list"></div>
        
                        <div class="import-section">
                            <div class="toggle-import" id="car-toggle-imp">📥 Importar Lista em Massa (Texto) ▼</div>
                            <div id="import-area">
                                <textarea id="car-bulk-text" class="area-bulk" placeholder="atalho texto da mensagem... (uma por linha)&#10;ex1 Olá Cliente&#10;ex2 Tudo bem?"></textarea>
                                <button id="car-btn-bulk" class="btn-save" style="font-size:12px; padding:6px;">Processar Lista</button>
                            </div>
                        </div>
                    </div>
                `;
                document.body.appendChild(container);

                // Drag Logic
                const header = container.querySelector('.car-header');
                let isDragging = false, startX, startY, initialLeft, initialTop;
                header.onmousedown = (e) => {
                    if (e.target.tagName === 'BUTTON') return;
                    e.preventDefault(); isDragging = true;
                    startX = e.clientX; startY = e.clientY;
                    const rect = container.getBoundingClientRect();
                    initialLeft = rect.left; initialTop = rect.top;
                    container.style.bottom = 'auto'; container.style.right = 'auto';
                    container.style.left = initialLeft + 'px'; container.style.top = initialTop + 'px';
                    document.onmousemove = (ev) => {
                        if (!isDragging) return;
                        container.style.left = (initialLeft + ev.clientX - startX) + 'px';
                        container.style.top = (initialTop + ev.clientY - startY) + 'px';
                    };
                    document.onmouseup = () => { isDragging = false; document.onmousemove = null; };
                };

                setupEvents(container);
                updateVisualList();
            }

            function setupEvents(container) {
                const listContainer = container.querySelector('#car-list');
                const inpKey = container.querySelector('#car-new-key');
                const inpVal = container.querySelector('#car-new-val');
                const settingsBox = container.querySelector('#car-settings-box');
                const helpBox = container.querySelector('#car-help-box');
                const importArea = container.querySelector('#import-area');
                const config = syncConfig();
                if (config) {
                    container.querySelector('#car-sync-repo').value = config.repository;
                    container.querySelector('#car-sync-path').value = config.path;
                    container.querySelector('#car-sync-remember').checked = !!ctx.ajaStorage.getItem(SYNC_TOKEN_KEY);
                    syncStatus(syncToken() ? 'Conectado. Novas alterações serão enviadas automaticamente.' : 'Informe o token para continuar a sincronização.');
                }
                container.querySelector('#car-sync-connect').onclick = () => {
                    const repository = container.querySelector('#car-sync-repo').value.trim();
                    const path = container.querySelector('#car-sync-path').value.trim() || 'car-comandos.json';
                    const token = container.querySelector('#car-sync-token').value.trim() || syncToken();
                    if (!/^[\w.-]+\/[\w.-]+$/.test(repository) || !/^[\w.\-/]+\.json$/.test(path) || path.includes('..') || !token) {
                        syncStatus('Informe repositório (usuário/nome), caminho .json e token válidos.', true); return;
                    }
                    if (config?.repository !== repository || config?.path !== path) ctx.ajaStorage.removeItem(SYNC_BASE_KEY);
                    ctx.ajaStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify({ repository, path }));
                    try { sessionStorage.setItem(SYNC_TOKEN_KEY, token); } catch { /* token persistente abaixo */ }
                    if (container.querySelector('#car-sync-remember').checked) ctx.ajaStorage.setItem(SYNC_TOKEN_KEY, token);
                    else ctx.ajaStorage.removeItem(SYNC_TOKEN_KEY);
                    container.querySelector('#car-sync-token').value = '';
                    syncStatus('Conectando…'); scheduleSync(0);
                };
                container.querySelector('#car-sync-now').onclick = () => {
                    if (!syncConfig()?.repository || !syncToken()) { syncStatus('Conecte o GitHub antes de sincronizar.', true); return; }
                    scheduleSync(0);
                };
                container.querySelector('#car-sync-disconnect').onclick = () => {
                    clearTimeout(syncTimer);
                    ctx.ajaStorage.removeItem(SYNC_CONFIG_KEY);
                    ctx.ajaStorage.removeItem(SYNC_TOKEN_KEY);
                    ctx.ajaStorage.removeItem(SYNC_BASE_KEY);
                    try { sessionStorage.removeItem(SYNC_TOKEN_KEY); } catch { /* sem sessão */ }
                    syncStatus('GitHub desconectado. Os comandos locais foram mantidos.');
                };

                // Tema
                container.querySelector('#car-theme-btn').onclick = () => {
                    isDark = !isDark;
                    if (isDark) container.classList.add('dark-mode'); else container.classList.remove('dark-mode');
                    Storage.set({ theme: isDark ? 'dark' : 'light' });
                };

                // Toggles
                container.querySelector('#car-help-btn').onclick = () => {
                    settingsBox.style.display = 'none';
                    helpBox.style.display = (helpBox.style.display === 'block') ? 'none' : 'block';
                };
                container.querySelector('#car-settings-btn').onclick = () => {
                    helpBox.style.display = 'none';
                    settingsBox.style.display = (settingsBox.style.display === 'block') ? 'none' : 'block';
                };
                container.querySelector('#car-close-btn').onclick = () => {
                    container.style.display = 'none';
                    if (window.spellCheckerModule) window.spellCheckerModule.ocultarTudo();
                };

                // --- LÓGICA DO IMPORTADOR EM MASSA ---
                container.querySelector('#car-toggle-imp').onclick = () => {
                    const isHidden = (importArea.style.display === 'none' || importArea.style.display === '');
                    importArea.style.display = isHidden ? 'flex' : 'none';
                    // Rola para baixo se abrir
                    if (isHidden) {
                        setTimeout(() => {
                            const body = container.querySelector('.car-body');
                            body.scrollTop = body.scrollHeight;
                        }, 100);
                    }
                };

                container.querySelector('#car-btn-bulk').onclick = () => {
                    const text = container.querySelector('#car-bulk-text').value;
                    if (!text.trim()) return alert("Cole a lista primeiro!");

                    const lines = text.split('\n');
                    let count = 0;

                    lines.forEach(l => {
                        l = l.trim();
                        if (!l) return;

                        // Tenta separar pelo separador '➡' ou pelo primeiro espaço
                        let k = '', v = '';
                        if (l.includes('➡')) {
                            const parts = l.split('➡');
                            k = parts[0].trim();
                            v = parts.slice(1).join('➡').trim();
                        } else {
                            const firstSpace = l.indexOf(' ');
                            if (firstSpace > 0) {
                                k = l.substring(0, firstSpace).trim();
                                v = l.substring(firstSpace).trim();
                            }
                        }

                        if (k && v) {
                            scripts[k] = v;
                            count++;
                        }
                    });

                    Storage.set({ scripts: scripts });
                    updateVisualList();
                    alert(`✅ ${count} comandos importados com sucesso!`);
                    container.querySelector('#car-bulk-text').value = '';
                    importArea.style.display = 'none'; // Fecha após importar
                };

                // Salvar Novo
                container.querySelector('#car-btn-add').onclick = () => {
                    const k = inpKey.value.trim(); const v = inpVal.value.trim();
                    if (k && v) {
                        scripts[k] = v;
                        Storage.set({ scripts: scripts });
                        inpKey.value = ''; inpVal.value = '';
                        updateVisualList();
                    }
                };

                // Exportar JSON
                container.querySelector('#car-btn-export').onclick = () => {
                    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(scripts, null, 2));
                    const a = document.createElement('a'); a.href = dataStr; a.download = "car_backup.json";
                    document.body.appendChild(a); a.click(); a.remove();
                };

                // Importar JSON
                const fileInput = container.querySelector('#car-file-restore');
                container.querySelector('#car-btn-restore').onclick = () => fileInput.click();
                fileInput.onchange = (e) => {
                    const file = e.target.files[0]; if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        try {
                            const imported = JSON.parse(ev.target.result);
                            if (!isScriptMap(imported)) throw new Error('Backup de comandos inválido');
                            scripts = { ...scripts, ...imported };
                            Storage.set({ scripts: scripts });
                            updateVisualList();
                            alert('✅ Backup restaurado e mesclado!'); settingsBox.style.display = 'none';
                        } catch (err) { alert('❌ Arquivo inválido.'); }
                    };
                    reader.readAsText(file); fileInput.value = '';
                };

                // Atualizar Lista Visual
                window.updateVisualList = () => {
                    listContainer.innerHTML = '';
                    const keys = Object.keys(scripts).sort();
                    if (keys.length === 0) listContainer.innerHTML = '<div style="text-align:center; color:var(--text-sec); padding:20px;">Nenhum comando salvo.</div>';

                    keys.forEach(key => {
                        const item = document.createElement('div'); item.className = 'car-item';
                        item.innerHTML = `
                            <div class="item-content"><span class="item-key"></span><span class="item-val"></span></div>
                            <div class="item-actions"><button class="btn-edit" title="Editar">✏️</button><button class="btn-del" title="Excluir">🗑️</button></div>
                        `;
                        item.querySelector('.item-key').textContent = key;
                        item.querySelector('.item-val').textContent = scripts[key];
                        item.querySelector('.item-val').title = scripts[key];
                        item.querySelector('.btn-edit').onclick = () => { inpKey.value = key; inpVal.value = scripts[key]; inpVal.focus(); };
                        item.querySelector('.btn-del').onclick = () => {
                            if (confirm(`Apagar atalho "${key}"?`)) {
                                delete scripts[key];
                                Storage.set({ scripts: scripts });
                                updateVisualList();
                            }
                        };
                        listContainer.appendChild(item);
                    });
                };
            }

            // Expand only the command immediately before the caret.
            document.addEventListener('keydown', (e) => {
                if (e.key !== ' ' || e.isComposing || e.repeat || e.ctrlKey || e.altKey || e.metaKey) return;
                const active = (e.composedPath?.() || [e.target]).find(el => el?.matches?.('textarea, input, [contenteditable="true"], [contenteditable=""]'));
                if (!active || active.disabled || active.readOnly || active.closest('#car-panel')) return;
                if (active.tagName === 'INPUT' && !['text','search','url','tel'].includes(active.type)) return;
                const doc = active.ownerDocument;
                let before, selection, range;
                if (active.isContentEditable) {
                    selection = active.getRootNode().getSelection?.() || doc.getSelection();
                    if (!selection?.rangeCount || !selection.isCollapsed) return;
                    range = selection.getRangeAt(0);
                    if (!active.contains(range.endContainer)) return;
                    const prefix = range.cloneRange(); prefix.selectNodeContents(active); prefix.setEnd(range.endContainer, range.endOffset);
                    before = prefix.toString();
                } else {
                    if (active.selectionStart == null || active.selectionStart !== active.selectionEnd) return;
                    before = active.value.slice(0, active.selectionStart);
                }
                const trigger = before.match(/(?:^|\s)(\S+)$/)?.[1];
                // Bookmarklet storage is synchronous and shared by same-origin editor frames.
                if (!isExtension) Storage.get(data => { scripts = data.scripts; });
                if (!trigger || !Object.prototype.hasOwnProperty.call(scripts, trigger)) return;
                if (active.isContentEditable) {
                    const start = before.length - trigger.length;
                    const walker = doc.createTreeWalker(active, 4);
                    let node, offset = 0, found = false;
                    while ((node = walker.nextNode())) {
                        if (offset + node.length >= start) { range.setStart(node, start-offset); found = true; break; }
                        offset += node.length;
                    }
                    if (!found) return;
                    selection.removeAllRanges(); selection.addRange(range);
                } else active.setSelectionRange(active.selectionStart-trigger.length, active.selectionEnd);
                e.preventDefault();
                doc.execCommand('insertText', false, scripts[trigger]);
            }, true);
            if (isExtension) chrome.storage.onChanged?.addListener(loadData);

            window.toggleCAR = function () {
                createUI();
                const p = document.getElementById('car-panel');
                if (p) {
                    p.style.display = (p.style.display === 'none' || p.style.display === '') ? 'flex' : 'none';
                    if (p.style.display === 'flex') window.updateVisualList();
                }
            };

            loadData();
            console.log("[CAR v3.1] Módulo Híbrido Carregado.");
        })();

    } catch (e) { console.error('[BUILDER] Erro fatal no módulo car.js:', e); throw e; }



return { open() { return window.toggleCAR(); } };
});
