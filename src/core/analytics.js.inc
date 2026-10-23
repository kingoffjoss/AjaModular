    const DataSyncer = {
        QUEUE_KEY: 'genesys_offline_queue_v1',
        async send(payload) { if (!GOOGLE_SCRIPT_URL) return; if (navigator.onLine) { try { await this._post(payload); } catch (e) { this._addToQueue(payload); } } else { this._addToQueue(payload); } this.updateIndicator(); },
        async _post(payload) { 
            return await safeFetch(GOOGLE_SCRIPT_URL, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify(payload) 
            }); 
        },
        _addToQueue(payload) { let queue = JSON.parse(ajaStorage.getItem(this.QUEUE_KEY) || "[]"); payload._queuedAt = Date.now(); queue.push(payload); ajaStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue)); },
        async processQueue() { if (!GOOGLE_SCRIPT_URL) return; if (!navigator.onLine) return; let queue = JSON.parse(ajaStorage.getItem(this.QUEUE_KEY) || "[]"); if (queue.length === 0) return; let failedQueue = []; for (let item of queue) { try { await this._post(item); await new Promise(r => setTimeout(r, 500)); } catch (e) { failedQueue.push(item); } } ajaStorage.setItem(this.QUEUE_KEY, JSON.stringify(failedQueue)); if (failedQueue.length === 0 && typeof UI !== 'undefined') { UI.createNotification("Sincronização offline concluída!", "success"); } this.updateIndicator(); },
        updateIndicator() { let queue = JSON.parse(ajaStorage.getItem(this.QUEUE_KEY) || "[]"); let indicator = document.getElementById('offline-indicator'); if (queue.length > 0) { if (!indicator) { indicator = document.createElement('div'); indicator.id = 'offline-indicator'; indicator.style.cssText = "position:fixed; bottom:80px; right:20px; background:var(--purecloud-script-warn-color); color:#000; padding:8px 14px; border-radius:20px; font-size:12px; z-index:9999; box-shadow:0 4px 10px rgba(0,0,0,0.3); font-weight:bold; cursor:pointer;"; indicator.title = "Clique para tentar forçar o envio"; indicator.onclick = () => DataSyncer.processQueue(); document.body.appendChild(indicator); } indicator.innerText = `📡 ${queue.length} Pendentes`; indicator.style.display = 'block'; } else if (indicator) { indicator.style.display = 'none'; } }
    };

    const analyticsManager = {
        isQualifiedConversation(conv) { return Number(conv?.activeDuration) >= CONFIG.CHECKMARK_THRESHOLD_MS; },
        getData() { const today = getBrazilTime(new Date()).toLocaleDateString('pt-BR'); const storedData = JSON.parse(ajaStorage.getItem('dailyAnalytics_v2_data') || '{}'); if (storedData.date !== today) { return { date: today, conversations: [], docCopies: 0, hotkeysUsed: [], baloonClicks: 0, transferClicks: 0, evaluatedClicks: 0, diagnosticRepliesUsed: 0 }; } storedData.conversations = (storedData.conversations || []).map(conv => ({ ...conv, activeDuration: conv.activeDuration || 0, isRecurrence: conv.isRecurrence || false, participantName: conv.participantName || 'N/A', phoneNumber: conv.phoneNumber || 'N/A', endedByAgent: conv.endedByAgent || 'HIBERNADO', interactionUrl: conv.interactionUrl || 'N/A', timestamp: typeof conv.timestamp === 'string' ? (new Date(conv.timestamp).getTime() || Date.now()) : conv.timestamp, interactionType: conv.interactionType || 'unknown' })); return storedData; },
        saveData(data) { try { ajaStorage.setItem('dailyAnalytics_v2_data', JSON.stringify(data)); } catch (e) { log("Erro ao salvar dados:", e); } },
        getAchievements() { return JSON.parse(ajaStorage.getItem('achievements_v2') || '{}'); },
        logConversation(duration, activeDuration, participantName, phoneNumber, interactionUrl, classification, interactionType) {
            const previousStats = this.calculateStats();
            const data = this.getData();
            const isRecurrence = phoneNumber !== 'N/A' && data.conversations.some(conv => conv.phoneNumber === phoneNumber && this.isQualifiedConversation(conv));
            data.conversations.push({ timestamp: Date.now(), duration: duration, activeDuration: activeDuration, participantName: participantName, phoneNumber: phoneNumber, isRecurrence: isRecurrence, endedByAgent: classification, interactionUrl: interactionUrl, interactionType: interactionType });
            this.saveData(data); this._updateDashboard();

            // --- CELEBRAÇÃO DE META VIRTUAL ---
            const newStats = this.calculateStats();
            if (previousStats.count < CONFIG.CONVERSATION_TARGET && newStats.count >= CONFIG.CONVERSATION_TARGET) {
                effectsManager.triggerConfetti();
                effectsManager.playSuccess();
                UI.createNotification("🎉 Parabéns! Você atingiu sua meta diária de atendimentos!", "success", 8000);
            }
        },
        logBaloonClick() { const data = this.getData(); data.baloonClicks = (data.baloonClicks || 0) + 1; this.saveData(data); this._updateDashboard(); },
        logTransferClick() { const data = this.getData(); data.transferClicks = (data.transferClicks || 0) + 1; this.saveData(data); this._updateDashboard(); },
        logEvaluatedClick() { const data = this.getData(); data.evaluatedClicks = (data.evaluatedClicks || 0) + 1; this.saveData(data); this._updateDashboard(); },
        _updateDashboard() { if (document.getElementById('purecloud-script-mini-dashboard')) { document.getElementById('purecloud-script-mini-dashboard')._updateStatsInternal(); } },
        calculateStats() { const data = this.getData(); const conversations = data.conversations; let completedConvos = conversations.filter(c => this.isQualifiedConversation(c)); const consolidatedConvos = completedConvos.filter(conv => !conv.isRecurrence); const uniqueCount = consolidatedConvos.length; const recurrenceCount = completedConvos.filter(conv => conv.isRecurrence).length; const baloonClicksCount = v4_counters.balao.length; if (completedConvos.length === 0) { return { count: 0, tma: '00:00', tme: '00:00', perHour: {}, first: 'N/A', last: 'N/A', docCopies: data.docCopies, hotkeysUsed: (data.hotkeysUsed || []).length, baloonClicks: baloonClicksCount, transferClicks: data.transferClicks, evaluatedClicks: data.evaluatedClicks, allConversations: conversations, endedByAgentCount: 0, recurrenceCount: 0, tmaSeconds: 0, tmeSeconds: 0 }; } const divisor = completedConvos.length > 0 ? completedConvos.length : 1; const totalDuration = completedConvos.reduce((sum, conv) => sum + conv.duration, 0); const tmaSeconds = Math.floor((totalDuration / divisor) / 1000); const totalActiveDuration = completedConvos.reduce((sum, conv) => sum + (conv.activeDuration || 0), 0); const tmeSeconds = Math.floor((totalActiveDuration / divisor) / 1000); const tma = `${formatTime(Math.floor(tmaSeconds / 60))}:${formatTime(tmaSeconds % 60)}`; const tme = `${formatTime(Math.floor(tmeSeconds / 60))}:${formatTime(tmeSeconds % 60)}`; const perHour = {}; for (let hour = 0; hour < 24; hour++) { perHour[hour] = 0; } completedConvos.forEach(conv => { const convDate = getBrazilTime(new Date(conv.timestamp)); const hour = convDate.getHours(); perHour[hour] = (perHour[hour] || 0) + 1; }); const sortedByTimestamp = [...completedConvos].sort((a, b) => b.timestamp - a.timestamp); const first = sortedByTimestamp.length > 0 ? getBrazilTime(new Date(sortedByTimestamp[0].timestamp)).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'N/A'; const last = sortedByTimestamp.length > 0 ? getBrazilTime(new Date(sortedByTimestamp[sortedByTimestamp.length - 1].timestamp)).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'N/A'; return { count: uniqueCount, tma, tme, perHour, first, last, docCopies: data.docCopies, hotkeysUsed: (data.hotkeysUsed || []).length, baloonClicks: baloonClicksCount, transferClicks: data.transferClicks, evaluatedClicks: data.evaluatedClicks, endedByAgentCount: 0, recurrenceCount: recurrenceCount, allConversations: conversations, tmaSeconds: tmaSeconds, tmeSeconds: tmeSeconds }; },
        clearAllData() { ajaStorage.removeItem('dailyAnalytics_v2_data'); ajaStorage.removeItem('achievements_v2'); v4_counters = { balao: [] }; saveV4Counters(); UI.createMiniDashboard(); }
    };


    const documentExtractor = {
        getNameAndNumber: (convEl = document) => { if (!convEl || convEl === document) { convEl = findEl(CONFIG.PURECLOUD_SELECTORS.SELECTED_INTERACTION_GROUP) || document; } const nameEl = findEl(CONFIG.PURECLOUD_SELECTORS.PARTICIPANT_NAME_BADGE, convEl); const rawText = nameEl?.textContent.trim() || 'N/A'; const match = rawText.match(/^(.*?)\s*\|\s*(\(\d{2}\)\s*\d{4,5}[-.\s]*\d{4,5}|\d{8,14})$/); let participantName = rawText; let phoneNumber = 'N/A'; if (match) { participantName = match[1].trim(); phoneNumber = match[2].replace(/\D/g, ''); } else { const numberMatch = rawText.match(/(\(\d{2}\)\s*\d{4,5}[-.\s]*\d{4,5}|\d{8,14})/); if (numberMatch) { phoneNumber = numberMatch[0].replace(/\D/g, ''); participantName = rawText.replace(numberMatch[0], '').replace(/|/g, '').trim() || 'N/A'; } } if (participantName.endsWith('|')) { participantName = participantName.slice(0, -1).trim(); } let formattedPhoneNumber = 'N/A'; if (phoneNumber.length === 11) { formattedPhoneNumber = `(${phoneNumber.substring(0, 2)}) ${phoneNumber.substring(2, 7)}-${phoneNumber.substring(7)}`; } else if (phoneNumber.length === 10) { formattedPhoneNumber = `(${phoneNumber.substring(0, 2)}) ${phoneNumber.substring(2, 6)}-${phoneNumber.substring(6)}`; } else if (phoneNumber !== 'N/A') { formattedPhoneNumber = phoneNumber; } return { participantName, phoneNumber: phoneNumber || 'N/A', formattedPhoneNumber: formattedPhoneNumber }; },
        getInteractionId: (parentEl = document) => { const el = findEl(CONFIG.PURECLOUD_SELECTORS.INTERACTION_ID_EL, parentEl); return el?.textContent.trim().replace(/#/g, ''); },
    };

    async function copyTextToClipboard(text) { try { await navigator.clipboard.writeText(text); return true; } catch (err) { return false; } }
    function parseInteractionUrl(value) {
        if (typeof value !== 'string' || value.length > 4096) return null;
        const match = value.trim().match(/https:\/\/[^\s<>"']+/i);
        if (!match) return null;
        try {
            const url = new URL(match[0].replace(/[),.;]+$/, ''));
            if (url.protocol !== 'https:' || !/(^|\.)pure\.cloud$|(^|\.)mypurecloud\.com$/.test(url.hostname)) return null;
            if (!/\/(?:interactions|conversations)\/[a-f\d-]{10,}(?:[/?#]|$)/i.test(url.pathname + url.hash)) return null;
            return url.href.length <= 2048 ? url.href : null;
        } catch { return null; }
    }
    async function getNativeInteractionUrl() {
        const btn = findEl(CONFIG.PURECLOUD_SELECTORS.NATIVE_COPY_BUTTON);
        if (!btn) return null;
        let original = null;
        try { original = await navigator.clipboard.readText(); } catch { /* leitura indisponível */ }
        btn.click();
        let copied = null, url = null;
        for (let attempt = 0; attempt < 5; attempt++) {
            await new Promise(resolve => setTimeout(resolve, 150));
            try { copied = await navigator.clipboard.readText(); } catch { break; }
            if (copied === original) continue;
            url = parseInteractionUrl(copied);
            break;
        }
        if (copied !== original && original !== null) {
            try { await navigator.clipboard.writeText(original); } catch { /* preservação indisponível */ }
        }
        return url;
    }

