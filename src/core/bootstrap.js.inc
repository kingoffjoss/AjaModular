
// ==UserScript==
// @name         Gerenciador de Contagem e Produtividade (vAjaModular_1.6.36)
// @namespace    http://tampermonkey.net/
// @version      1.0.28.9
// @description  Script focado em Analytics. [Modo Foco + Anti-Caps Lock + Lembretes + Links]
// @author       Kingoffjoss Assess
// @match        https://apps.mypurecloud.com/*
// @match        https://apps.mypurecloud.de/*
// @match        https://apps.mypurecloud.jp/*
// @match        https://apps.mypurecloud.ie/*
// @match        https://apps.mypurecloud.com.au/*
// @grant        GM_xmlhttpRequest
// @connect      api.languagetool.org
// ==/UserScript==

(function () {
    'use strict';
const ajaStorage = window.AjaModularData.adapter(window.localStorage);
const ajaSessionStorage = window.AjaModularData.adapter(window.sessionStorage);


    // --- URL DO CEREBRO (GOOGLE SCRIPT) ---
    const GOOGLE_SCRIPT_URL = ""; // Configure um backend exclusivo para esta versão.
    const SCRIPT_VERSION = 'AjaModular_1.6.36';

    async function safeFetch(url, options = {}) {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
            return new Promise((resolve, reject) => {
                chrome.runtime.sendMessage({ action: "fetchAPI", url: url, options: options }, response => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                    } else if (!response || !response.success) {
                        reject(new Error(response ? response.error : "Unknown error"));
                    } else {
                        resolve({
                            status: response.status,
                            ok: response.status >= 200 && response.status < 300,
                            text: async () => response.text,
                            json: async () => JSON.parse(response.text)
                        });
                    }
                });
            });
        } else {
            return fetch(url, options);
        }
    }

    if (window[`PURECLOUD_SCRIPT_LOADED_FLAG_${SCRIPT_VERSION}`]) {
        console.log(`[NOVO SCRIPT] Script V${SCRIPT_VERSION} já está carregado e em execução.`);
        return;
    }

    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get(['ajamodular_enabled'], function(result) {
            if (result.ajamodular_enabled === false) {
                console.log("[AJA ASSISTANT] Script desativado pelo usuário na extensão.");
                return;
            }
            startScript();
        });
    } else {
        startScript();
    }

    function startScript() {
        window[`PURECLOUD_SCRIPT_LOADED_FLAG_${SCRIPT_VERSION}`] = true;



