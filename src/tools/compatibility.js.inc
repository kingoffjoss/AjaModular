    /* --- MÓDULO ANEXADO: COMPATIBILITY.JS --- */
    try {
        // compatibility.js
        // Configuração Centralizada

        console.log("[Compatibility] Carregando configurações globais...");

        window.GENESYS_CONFIG = {
            // URL do teu Google Apps Script
            API_URL: "",

            // Configurações do Repositório GitHub (Para o Admin.js)
            REPO_USER: "kingoffjoss",
            REPO_NAME: "AjaModular",

            VERSION: "6.8-Stable"
        };

        // Adaptadores para funcionar como Extensão
        window.GM_addStyle = function (css) {
            const style = document.createElement('style');
            style.textContent = css;
            (document.head || document.body).appendChild(style);
        };

        window.GM_setClipboard = function (text) {
            if (navigator.clipboard) {
                navigator.clipboard.writeText(text).catch(e => console.error(e));
            }
        };

        window.GM_openInTab = function (url) {
            window.open(url, '_blank');
        };

        // Polyfill global para storage (resolve erro do gerente.js e ia.js no Tampermonkey)
        window.GM_storage = {
            local: {
                get: function (keys, callback) {
                    let result = {};
                    if (typeof keys === 'string') keys = [keys];
                    if (Array.isArray(keys)) {
                        keys.forEach(k => {
                            let val = ajaStorage.getItem(k);
                            result[k] = val !== null ? JSON.parse(val) : undefined;
                        });
                    } else if (typeof keys === 'object' && keys !== null) {
                        Object.keys(keys).forEach(k => {
                            let val = ajaStorage.getItem(k);
                            result[k] = val !== null ? JSON.parse(val) : keys[k];
                        });
                    }
                    if (callback) callback(result);
                },
                set: function (obj, callback) {
                    if (obj && typeof obj === 'object') {
                        Object.keys(obj).forEach(k => {
                            ajaStorage.setItem(k, JSON.stringify(obj[k]));
                        });
                    }
                    if (callback) callback();
                },
                remove: function (keys, callback) {
                    if (typeof keys === 'string') keys = [keys];
                    if (Array.isArray(keys)) {
                        keys.forEach(k => ajaStorage.removeItem(k));
                    }
                    if (callback) callback();
                }
            },
            onChanged: {
                addListener: function (listener) {
                    // Dummy listener to avoid "undefined" errors
                    console.log("[Polyfill] GM_storage.onChanged addListener mock chamado.");
                }
            }
        };

        window.unsafeWindow = window;

    } catch (e) { console.error('[BUILDER] Erro fatal no módulo compatibility.js:', e); }

