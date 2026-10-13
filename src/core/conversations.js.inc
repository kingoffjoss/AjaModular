    async function handleBalaoClick(e) { const endChatButton = findEl(LOCKDOWN_CONFIG.END_CHAT_BUTTON_SELECTOR); if (endChatButton && endChatButton.disabled) return; const { participantName, phoneNumber } = documentExtractor.getNameAndNumber(document.body); let interactionUrl = 'N/A'; try { const urlFromButton = await getNativeInteractionUrl(); if (urlFromButton) { interactionUrl = urlFromButton; } else { const id = documentExtractor.getInteractionId(document.body); if (id && id !== 'N/A') { interactionUrl = `${window.location.origin}/directory/conversations/${id}`; } else { interactionUrl = window.location.href.includes('/conversations/') ? window.location.href : 'N/A'; } } } catch (error) { } v4_counters.balao.push({ timestamp: Date.now(), participantName: participantName, phoneNumber: phoneNumber, interactionUrl: interactionUrl }); saveV4Counters(); analyticsManager._updateDashboard(); }

    const conversationListenerManager = {
        states: new Map(),
        updateListeners: (conv) => { const currentConvState = conversationListenerManager.states.get(conv); const getScriptIframeDoc = () => { const conversationRoot = findEl(CONFIG.PURECLOUD_SELECTORS.CONVERSATION_ROOT); if (!conversationRoot) return null; const scriptIframe = findEl(CONFIG.PURECLOUD_SELECTORS.SCRIPT_IFRAME, conversationRoot); if (scriptIframe && scriptIframe.contentDocument) { return scriptIframe.contentDocument; } return null; }; const scriptDoc = getScriptIframeDoc(); const addAnalyticsListener = (btn, type) => { if (btn.dataset.gmListenerAdded || !currentConvState) return; btn.addEventListener('click', (e) => { if (btn.disabled) return; const id = documentExtractor.getInteractionId(); if (!id || id === 'N/A') return; if (type === 'TRANSFERIDO') { analyticsManager.logTransferClick(); CONFIG.LAST_ENDED_INTERACTIONS.set(id, { type: 'TRANSFERIDO', timestamp: Date.now() }); } else if (type === 'AVALIACAO') { analyticsManager.logEvaluatedClick(); CONFIG.LAST_ENDED_INTERACTIONS.set(id, { type: 'AVALIACAO', timestamp: Date.now() }); } }, { signal: currentConvState.controller.signal }); btn.dataset.gmListenerAdded = true; }; const addBalaoListener = (btn) => { if (btn.dataset.gmBalaoListenerAdded || !currentConvState) return; btn.addEventListener('click', handleBalaoClick, { signal: currentConvState.controller.signal }); btn.dataset.gmBalaoListenerAdded = true; }; document.querySelectorAll(LOCKDOWN_CONFIG.END_CHAT_BUTTON_SELECTOR.join(',')).forEach(btn => addBalaoListener(btn)); document.querySelectorAll(CONFIG.PURECLOUD_SELECTORS.TRANSFER_BUTTON_SELECTOR.join(',')).forEach(btn => addAnalyticsListener(btn, 'TRANSFERIDO')); document.querySelectorAll(CONFIG.PURECLOUD_SELECTORS.EVALUATION_BUTTON_SELECTOR.join(',')).forEach(btn => addAnalyticsListener(btn, 'AVALIACAO')); if (scriptDoc) { scriptDoc.querySelectorAll(CONFIG.PURECLOUD_SELECTORS.EVALUATION_BUTTON_SELECTOR.join(',')).forEach(btn => addAnalyticsListener(btn, 'AVALIACAO')); } },
        initState: (conv) => { if (!conversationListenerManager.states.has(conv)) { conversationListenerManager.states.set(conv, { controller: new AbortController() }); } }
    };

    const conversationTimers = new Map();
    let currentChatObserverInstance = null;
    let currentChatInputField = null;

    function updateTimerDisplay(timerData) {
        if (!timerData.div?.isConnected || !timerData.numDiv?.isConnected || !timerData.bubblesContainer?.isConnected) { return; }
        let currentElapsed; if (timerData.isPaused) { currentElapsed = timerData.pausedAt - timerData.startTime; } else { currentElapsed = Date.now() - timerData.startTime; }
        currentElapsed = Math.max(0, currentElapsed);
        const secs = Math.floor(currentElapsed / 1000); timerData.div.textContent = `${formatTime(Math.floor(secs / 60))}:${formatTime(secs % 60)}`;
        timerData.div.classList.remove('paused-alert', 'inactive-client-alert', 'normal-timer', 'inactive-operator-alert'); timerData.div.style.removeProperty('animation');

        if (timerData.isPaused) { timerData.div.classList.add('paused-alert'); } else {
            const inactivityOperatorSeconds = (Date.now() - (timerData.lastOperatorActivityTimestamp || timerData.startTime)) / 1000;
            const inactivityClientSeconds = (Date.now() - (timerData.lastCustomerReplyTimestamp || timerData.startTime)) / 1000;
            if (inactivityOperatorSeconds >= CONFIG.INACTIVITY_OPERATOR_ALERT_SECONDS) {
                timerData.div.classList.add('inactive-operator-alert'); if (!timerData.operatorAlertPlayed) { effectsManager.playBeep('inactive_operator'); timerData.operatorAlertPlayed = true; }
            } else if (inactivityClientSeconds >= CONFIG.INACTIVITY_CLIENT_ALERT_SECONDS) {
                timerData.div.classList.add('inactive-client-alert'); if (!timerData.clientAlertPlayed) { effectsManager.playBeep('inactive_client'); timerData.clientAlertPlayed = true; }
            } else { timerData.div.classList.add('normal-timer'); timerData.operatorAlertPlayed = false; timerData.clientAlertPlayed = false; }
        }
        if (currentElapsed >= CONFIG.CHECKMARK_THRESHOLD_MS) {
            if (!timerData.completedVisual) {
                if (!timerData.checkmarkDiv) {
                    const existents = timerData.bubblesContainer.querySelectorAll('.injected-checkmark');
                    existents.forEach(e => e.remove());
                    timerData.checkmarkDiv = document.createElement('div');
                    timerData.checkmarkDiv.className = 'injected-element injected-checkmark';
                    timerData.checkmarkDiv.innerHTML = '✔️';
                    timerData.bubblesContainer.appendChild(timerData.checkmarkDiv);
                } timerData.checkmarkDiv.style.display = 'flex'; timerData.completedVisual = true;
            }
        } else { if (timerData.checkmarkDiv) { timerData.checkmarkDiv.style.display = 'none'; timerData.completedVisual = false; } }

        const longConvoMs = CONFIG.LONG_CONVO_ALERT_MIN * 60000;
        if (currentElapsed >= (longConvoMs - 60000) && currentElapsed < longConvoMs) {
            if (!timerData.div.classList.contains('warning-pulse-alert')) timerData.div.classList.add('warning-pulse-alert');
        } else {
            timerData.div.classList.remove('warning-pulse-alert');
        }

        if (currentElapsed > longConvoMs && !timerData.longConvoNotified) { UI.createNotification(`A conversa com ${timerData.participantName || 'o cliente'} está longa (${CONFIG.LONG_CONVO_ALERT_MIN} min).`, 'warn', 5000); timerData.longConvoNotified = true; }
    }

    function nextConversationForRotation(groups,selected,timers,visited,threshold) {
        if(groups.length<2)return null;
        const start=groups.indexOf(selected);
        if(start<0)return null;
        for(let step=1;step<groups.length;step++) {
            const candidate=groups[(start+step)%groups.length];
            const timer=timers.get(candidate);
            if(candidate.isConnected && timer && !visited.has(candidate) && (timer.isPaused?timer.pausedAt:Date.now())-timer.startTime<threshold)return candidate;
        }
        return null;
    }
    const autoRotation={
        enabled:false,visited:new WeakSet(),pending:null,
        updateButton(){const button=document.getElementById('mini-dashboard-auto-rotate-btn');if(!button)return;button.setAttribute('aria-pressed',String(this.enabled));button.title=this.enabled?'Desligar troca automática de conversas':'Ligar troca automática de conversas após 1:10';button.textContent=this.enabled?'🔄':'⇄';},
        toggle(){this.enabled=!this.enabled;this.pending=null;this.visited=new WeakSet();this.updateButton();UI.createNotification(this.enabled?'Troca automática ligada: próxima conversa após 1:10.':'Troca automática desligada.','info',3000);return this.enabled;},
        tick(){
            if(!this.enabled)return;
            const selected=findEl(CONFIG.PURECLOUD_SELECTORS.SELECTED_INTERACTION_GROUP);
            if(this.pending){
                if(selected===this.pending.target){this.visited.add(this.pending.source);this.pending=null;}
                else if(Date.now()-this.pending.at>3000){this.enabled=false;this.pending=null;this.updateButton();UI.createNotification('A plataforma não confirmou a troca de conversa. Troca automática desligada.','warn',5000);}
                return;
            }
            const timer=conversationTimers.get(selected);
            if(!selected||!timer||timer.isPaused||this.visited.has(selected)||Date.now()-timer.startTime<CONFIG.CHECKMARK_THRESHOLD_MS)return;
            const groups=[...document.querySelectorAll(CONFIG.PURECLOUD_SELECTORS.INTERACTION_GROUP.join(', '))].sort((a,b)=>a.getBoundingClientRect().top-b.getBoundingClientRect().top);
            const target=nextConversationForRotation(groups,selected,conversationTimers,this.visited,CONFIG.CHECKMARK_THRESHOLD_MS);
            if(!target)return;
            this.pending={source:selected,target,at:Date.now()};
            try{
                const action=target.querySelector('button.acd-interaction-card-v2-container');
                if(!action)throw new Error('Botão de abrir interação não encontrado');
                action.click();
            }
            catch{this.enabled=false;this.pending=null;this.updateButton();UI.createNotification('Não foi possível selecionar a próxima conversa. Troca automática desligada.','warn',5000);}
        }
    };
    window.AjaModularAutoRotation={toggle:()=>autoRotation.toggle(),get enabled(){return autoRotation.enabled;}};
    const timerManager = {
        globalIntervalId: null,
        refreshAll() { conversationTimers.forEach(updateTimerDisplay); },
        startGlobalTimer() {
            if (!this.globalIntervalId) {
                document.addEventListener('visibilitychange', () => { if (!document.hidden) this.refreshAll(); });
                window.addEventListener('pageshow', () => this.refreshAll());
                this.globalIntervalId = setInterval(() => {
                    conversationTimers.forEach((tData) => {
                        updateTimerDisplay(tData);
                    });
                    autoRotation.tick();
                }, CONFIG.TIMER_UPDATE_INTERVAL_MS);
            }
        },
        initTimer(convEl, index, total) {
            let tData = conversationTimers.get(convEl); if (!tData) {
                let bubblesContainer = convEl.querySelector('.injected-bubbles-container'); let tDiv = convEl.querySelector('.injected-conversation-timer'); let nDiv = convEl.querySelector('.injected-conversation-number'); let checkmarkDiv = convEl.querySelector('.injected-checkmark'); let recurrenceDiv = convEl.querySelector('.injected-recurrence-icon'); let iconDiv = convEl.querySelector('.injected-interaction-icon');
                if (!bubblesContainer) { bubblesContainer = document.createElement('div'); bubblesContainer.className = 'injected-bubbles-container'; nDiv = document.createElement('div'); nDiv.className = 'injected-element injected-conversation-number'; bubblesContainer.appendChild(nDiv); iconDiv = document.createElement('div'); iconDiv.className = 'injected-element injected-interaction-icon'; iconDiv.innerHTML = '💬'; bubblesContainer.appendChild(iconDiv); tDiv = document.createElement('div'); tDiv.className = 'injected-element injected-conversation-timer'; bubblesContainer.appendChild(tDiv); let contentWrapper = findEl(CONFIG.PURECLOUD_SELECTORS.CONVERSATION_CONTENT_WRAPPER, convEl); if (contentWrapper) { contentWrapper.appendChild(bubblesContainer); } else { convEl.appendChild(bubblesContainer); } setTimeout(() => { if (contentWrapper && !contentWrapper.contains(bubblesContainer)) { contentWrapper.appendChild(bubblesContainer); } else if (!convEl.contains(bubblesContainer)) { convEl.appendChild(bubblesContainer); } }, 100); } else { if (!nDiv) { nDiv = document.createElement('div'); nDiv.className = 'injected-element injected-conversation-number'; bubblesContainer.prepend(nDiv); } if (!iconDiv) { iconDiv = document.createElement('div'); iconDiv.className = 'injected-element injected-interaction-icon'; iconDiv.innerHTML = '💬'; if (nDiv && nDiv.nextSibling) { bubblesContainer.insertBefore(iconDiv, nDiv.nextSibling); } else { bubblesContainer.appendChild(iconDiv); } } if (!tDiv) { tDiv = document.createElement('div'); tDiv.className = 'injected-element injected-conversation-timer'; bubblesContainer.appendChild(tDiv); } }
                bubblesContainer.classList.toggle('gcp-tema-escuro', CONFIG.DARK_MODE);
                const { participantName, phoneNumber } = documentExtractor.getNameAndNumber(convEl); const interactionId = documentExtractor.getInteractionId(convEl);
                const isRecurrence = phoneNumber !== 'N/A' && analyticsManager.getData().conversations.some(conv => conv.phoneNumber === phoneNumber && conv.duration >= CONFIG.CHECKMARK_THRESHOLD_MS);
                if (isRecurrence) { if (!recurrenceDiv) { recurrenceDiv = document.createElement('div'); recurrenceDiv.className = 'injected-element injected-recurrence-icon'; recurrenceDiv.innerHTML = '🔁'; recurrenceDiv.title = 'Cliente recorrente hoje'; bubblesContainer.appendChild(recurrenceDiv); } recurrenceDiv.style.display = 'flex'; } else if (recurrenceDiv) { recurrenceDiv.style.display = 'none'; }
                tData = { div: tDiv, numDiv: nDiv, iconDiv: iconDiv, checkmarkDiv: checkmarkDiv, recurrenceDiv: recurrenceDiv, bubblesContainer: bubblesContainer, element: convEl, creationTime: Date.now(), startTime: Date.now(), pausedAt: Date.now(), isPaused: true, completedVisual: false, tmaLogged: false, activeDuration: 0, activeSessionStart: null, lastOperatorActivityTimestamp: Date.now(), lastCustomerReplyTimestamp: Date.now(), longConvoNotified: false, operatorAlertPlayed: false, clientAlertPlayed: false, participantName: participantName, phoneNumber: phoneNumber, interactionUrl: 'N/A', interactionId: interactionId, isRecurrence: isRecurrence, interactionType: 'chat' };
                conversationTimers.set(convEl, tData);
            }
            tData.bubblesContainer.classList.toggle('gcp-tema-escuro', CONFIG.DARK_MODE);
            tData.numDiv.textContent = total - index;
            if (tData.isRecurrence && tData.recurrenceDiv) { tData.recurrenceDiv.style.display = 'flex'; }
            return tData;
        },
        updateState(tData, isSelected) { if (isSelected) { if (tData.isPaused) { tData.startTime += (Date.now() - tData.pausedAt); tData.isPaused = false; tData.activeSessionStart = Date.now(); tData.lastOperatorActivityTimestamp = Date.now(); } } else { if (!tData.isPaused) { if (tData.activeSessionStart) { tData.activeDuration += (Date.now() - tData.activeSessionStart); tData.activeSessionStart = null; } tData.pausedAt = Date.now(); tData.isPaused = true; } } updateTimerDisplay(tData); },
        cleanupTimers(activeConversationElements) {
            const timersToDelete = []; const AGENT_END_WINDOW_MS = 5000;
            conversationTimers.forEach((timerData, convEl) => {
                if (!document.body.contains(convEl)) {
                    // clearInterval(timerData.intervalId); -> agora usamos o Global Timer
                    if (!timerData.tmaLogged) {
                        if (!timerData.isPaused && timerData.activeSessionStart) { timerData.activeDuration += (Date.now() - timerData.activeSessionStart); timerData.activeSessionStart = null; }
                        const duration = Date.now() - timerData.creationTime; const currentTime = Date.now();
                        const clickData = CONFIG.LAST_ENDED_INTERACTIONS.get(timerData.interactionId); let classification = 'HIBERNADO';
                        if (clickData && (currentTime - clickData.timestamp) < AGENT_END_WINDOW_MS) { if (clickData.type === 'BALAO') { classification = 'BALAO'; } else if (clickData.type === 'TRANSFERIDO') { classification = 'TRANSFERIDO'; } else if (clickData.type === 'AVALIACAO') { classification = 'AVALIACAO'; } CONFIG.LAST_ENDED_INTERACTIONS.delete(timerData.interactionId); }
                        analyticsManager.logConversation(duration, timerData.activeDuration, timerData.participantName, timerData.phoneNumber, timerData.interactionUrl, classification, timerData.interactionType);
                        timerData.tmaLogged = true; if (CONFIG.LAST_ENDED_INTERACTIONS.has(timerData.interactionId)) { CONFIG.LAST_ENDED_INTERACTIONS.delete(timerData.interactionId); }
                    }
                    timersToDelete.push(convEl); timerData.div?.remove(); timerData.numDiv?.remove(); timerData.iconDiv?.remove(); timerData.checkmarkDiv?.remove(); timerData.recurrenceDiv?.remove(); timerData.bubblesContainer?.remove();
                }
            });
            timersToDelete.forEach(convEl => { conversationTimers.delete(convEl); const lockState = conversationListenerManager.states.get(convEl); if (lockState && lockState.controller) lockState.controller.abort(); conversationListenerManager.states.delete(convEl); });
        }
    }

    function observeCurrentChatMessages(timerData) {
        if (currentChatObserverInstance) { currentChatObserverInstance.disconnect(); currentChatObserverInstance = null; } if (currentChatInputField) { currentChatInputField.removeEventListener('input', handleOperatorActivity); currentChatInputField.removeEventListener('keypress', handleOperatorActivity); currentChatInputField = null; } let chatMessagesContainer = null; let chatInputField = null; const messagingIframe = document.querySelector(CONFIG.PURECLOUD_SELECTORS.MESSAGING_GADGET_IFRAME); if (messagingIframe && messagingIframe.contentDocument) { try { chatMessagesContainer = findEl('.chat-messages-container', messagingIframe.contentDocument); chatInputField = findEl('textarea[aria-label="Digitar uma mensagem"]', messagingIframe.contentDocument); } catch (e) { } } if (!chatMessagesContainer) { chatMessagesContainer = findEl('.chat-messages-container'); chatInputField = findEl('textarea[aria-label="Digitar uma mensagem"]'); }

        const handleOperatorActivity = (e) => {
            if (timerData.lastOperatorActivityTimestamp !== Date.now()) { timerData.lastOperatorActivityTimestamp = Date.now(); updateTimerDisplay(timerData); }

            // --- LÓGICA DE SNIPPETS (AUTO-EXPANSÃO DE TEXTO) ---
            if (e && e.type === 'input' && chatInputField) {
                let val = chatInputField.value;
                let replaced = false;
                CONFIG.QUICK_REPLIES.forEach(qr => {
                    // Verifica se o operador digitou o atalho com um espaço no final
                    if (qr.shortcut && val.includes(qr.shortcut + ' ')) {
                        val = val.replace(qr.shortcut + ' ', templateProcessor.process(qr.text) + ' ');
                        replaced = true;
                    }
                });
                if (replaced) {
                    chatInputField.value = val;
                    chatInputField.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }
        };

        if (chatMessagesContainer) { if (chatMessagesContainer.dataset.observedByScript === 'true') { if (chatInputField && currentChatInputField !== chatInputField) { chatInputField.addEventListener('input', handleOperatorActivity); chatInputField.addEventListener('keypress', handleOperatorActivity); currentChatInputField = chatInputField; } return; } currentChatObserverInstance = new MutationObserver((mutations) => { for (const mutation of mutations) { if (mutation.type === 'childList' && mutation.addedNodes.length > 0) { const newClientMessages = Array.from(mutation.addedNodes).filter(node => node.nodeType === 1 && node.matches('.chat-message-group.remote')); if (newClientMessages.length > 0) { timerData.lastCustomerReplyTimestamp = Date.now(); updateTimerDisplay(timerData); } } } }); currentChatObserverInstance.observe(chatMessagesContainer, { childList: true, subtree: true }); chatMessagesContainer.dataset.observedByScript = 'true'; if (chatInputField) { chatInputField.addEventListener('input', handleOperatorActivity); chatInputField.addEventListener('keypress', handleOperatorActivity); currentChatInputField = chatInputField; } }
    }

    const channelIcon={
        instagram:'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="18" cy="6" r="1" fill="currentColor" stroke="none"/></svg>',
        whatsapp:'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 11.5a8.5 8.5 0 0 1-12.4 7.5L3 20l1.2-4.6A8.5 8.5 0 1 1 20.5 11.5Z"/><path d="M8.2 8.5c.4 3 3 5.6 6.1 6.1l1.4-1.3-1.7-1-1.1 1c-1.1-.5-2-1.4-2.5-2.5l1-1.1-1-1.7-1.3 1.5Z"/></svg>',
        site:'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c-3 3-3 15 0 18M12 3c3 3 3 15 0 18"/></svg>',
        app:'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M10 18h4"/></svg>'
    };
    function interactionChannel(conv) {
        if(conv.querySelector(CONFIG.PURECLOUD_SELECTORS.ICON_SELECTOR_CALL))return 'call';
        const metadata=[conv,...conv.querySelectorAll('gux-icon, [data-channel], [data-qa-id*="channel" i], [class*="channel" i], [aria-label], [title], img, svg use')];
        const text=metadata.filter(el=>!el.closest?.('.injected-bubbles-container')).map(el=>{
            const attributes=['data-channel','data-qa-id','icon-name','aria-label','title','alt','src','href','xlink:href'].map(name=>el.getAttribute?.(name)||'').join(' ');
            const label=el.matches?.('[data-qa-id*="channel" i], [class*="channel" i]')?el.textContent||'':'';
            return attributes+' '+label;
        }).join(' ').toLowerCase();
        if(/instagram|insta(?:gram)?[_-]?(?:dm|message)/.test(text))return 'instagram';
        if(/whats(?:app)?/.test(text))return 'whatsapp';
        if(/(?:^|[^a-z])(?:webchat|website|site|web)(?:$|[^a-z])/.test(text))return 'site';
        if(/(?:^|[^a-z])(?:app|aplicativo|mobileapp)(?:$|[^a-z])/.test(text))return 'app';
        return 'chat';
    }
    function mainLoop() {
        const toolbar = findEl(CONFIG.PURECLOUD_SELECTORS.TOOLBAR); if (toolbar) { createToolbarUI(toolbar); }
        let conversationsNodeList = document.querySelectorAll(CONFIG.PURECLOUD_SELECTORS.INTERACTION_GROUP.join(', ')); const sortedConversationsArray = Array.from(conversationsNodeList).sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
        const activeConversationElements = new Set(sortedConversationsArray); timerManager.cleanupTimers(activeConversationElements); const selectedConvEl = findEl(CONFIG.PURECLOUD_SELECTORS.SELECTED_INTERACTION_GROUP);
        sortedConversationsArray.forEach((conv, index) => {
            const nativeTimeElementsInConv = conv.querySelectorAll(CONFIG.PURECLOUD_SELECTORS.NATIVE_TIMER_SELECTORS.join(', ')); nativeTimeElementsInConv.forEach(el => { if (el.classList.contains('injected-element') || el.classList.contains('injected-bubbles-container')) { return; } if (el.textContent.match(/\d+\s*(min|hr|seg|now|agora)/i) || el.matches('.duration, .message-timestamp')) { el.style.display = 'none'; } });
            const tData = timerManager.initTimer(conv, index, sortedConversationsArray.length);
            if (tData.iconDiv) { const channel=interactionChannel(conv); tData.iconDiv.innerHTML=channelIcon[channel]||(channel==='call'?'📞':'💬'); tData.iconDiv.title=({instagram:'Instagram',whatsapp:'WhatsApp',site:'Site',app:'Aplicativo',call:'Ligação',chat:'Mensagem'})[channel]; tData.interactionType=channel; }
            const isSelected = conv === selectedConvEl; timerManager.updateState(tData, isSelected); conversationListenerManager.initState(conv); if (isSelected) { observeCurrentChatMessages(tData); conversationListenerManager.updateListeners(conv); }
        });
        if (!selectedConvEl) { const pepperButton = document.getElementById('purecloud-script-btn-endCustomer'); if (pepperButton) pepperButton.title = 'Selecione uma conversa para encerrar'; }
        if (CONFIG.MINI_DASHBOARD_VISIBLE) { UI.createMiniDashboard(); }
        if (CONFIG.TOOLS_VISIBLE) { UI.createAgentToolsPanel(); }
    }

    const getHotkeyCombo = (e) => { const pressedKeys = []; if (e.ctrlKey) pressedKeys.push('Control'); if (e.shiftKey) pressedKeys.push('Shift'); if (e.altKey) pressedKeys.push('Alt'); const key = e.key === ' ' ? 'Space' : (e.key.length === 1 ? e.key.toUpperCase() : e.key); if (!['Control', 'Shift', 'Alt', 'Meta'].includes(key)) { pressedKeys.push(key); } const primaryKey = pressedKeys.pop(); pressedKeys.sort(); if (primaryKey) pressedKeys.push(primaryKey); return pressedKeys.join('+'); };
    const keyboardEventHandler = (e) => { if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) { return; } const currentCombo = getHotkeyCombo(e); if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) { return; } for (const actionName in CONFIG.HOTKEYS) { if (CONFIG.HOTKEYS[actionName] === currentCombo) { e.preventDefault(); if (actions[actionName]) { actions[actionName](); UI.createNotification(featureDescriptions[actionName]?.title || actionName, 'info', 1000); return; } } } };

