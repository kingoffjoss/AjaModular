    const CONFIG_CSS = {
        VARIAVEIS: `
            :root { 
                --purecloud-script-bg-primary: ${theme.bgPrimary}; --purecloud-script-bg-secondary: ${theme.bgSecondary}
            .gcp-tema-escuro { 
                --purecloud-script-bg-primary: #121212 !important; 
                --purecloud-script-bg-secondary: #1e1e1e !important; 
                --purecloud-script-text-primary: #e2e8f0 !important; 
                --purecloud-script-text-secondary: #94a3b8 !important; 
                --purecloud-script-border-color: #334155 !important; 
                --purecloud-script-header-bg: #0f172a !important; 
                --purecloud-script-bubble-bg-normal: #1e1e1e !important; 
                --purecloud-script-bubble-text-normal: #ffffff !important; 
                --purecloud-script-shadow-color: rgba(0,0,0,0.8) !important;
            }
            ; --purecloud-script-text-primary: ${theme.textPrimary}; --purecloud-script-text-secondary: ${theme.textSecondary}; --purecloud-script-border-color: ${theme.borderColor}; --purecloud-script-accent-color: ${theme.accent}; --purecloud-script-accent-text: ${theme.accentText}; --purecloud-script-success-color: ${theme.success}; --purecloud-script-error-color: ${theme.error}; --purecloud-script-warn-color: ${theme.warn}; --purecloud-script-info-color: ${theme.info}; --purecloud-script-bubble-bg-normal: ${theme.timerBg}; --purecloud-script-bubble-bg-selected: ${theme.accent}; --purecloud-script-bubble-text-normal: ${theme.timerNormalText}; --purecloud-script-bubble-text-active: ${theme.timerActiveText}; --purecloud-script-bubble-text-paused: ${theme.timerPausedText}; --purecloud-script-bubble-text-timer-inactive: ${theme.timerInactiveClientText}; --purecloud-script-shadow-color: rgba(0,0,0,0.08); --mini-dashboard-progress-color: ${theme.miniDashboardProgress}; --font-family-modern: 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            }
            .hide-scrollbar::-webkit-scrollbar { display: none; }
            .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `,
        ZEN_MODE: `
            body.sys-zen-active { background-color: #121212 !important; }
            body.sys-zen-active .sidebar, body.sys-zen-active .navbar, body.sys-zen-active .topbar, body.sys-zen-active header { opacity: 0.15; pointer-events: none; transition: opacity 0.4s ease; }
            body.sys-zen-active .interaction-list { opacity: 0.15; transition: opacity 0.4s ease; }
            body.sys-zen-active .interaction-list:hover { opacity: 1; }
            body.sys-zen-active .interaction-content-wrapper { box-shadow: 0 0 0 9999px rgba(0,0,0,0.85); z-index: 9999; position: relative; border-radius: 8px; }
        `,
        ANIMATIONS: `
            @keyframes alertPulseGlow { 0% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.6); transform: scale(1); } 50% { transform: scale(1.02); } 70% { box-shadow: 0 0 0 6px rgba(251, 191, 36, 0); } 100% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0); transform: scale(1); } }
            @keyframes warningPulseGlow { 0% { box-shadow: 0 0 0 0 rgba(234, 179, 8, 0.7); } 70% { box-shadow: 0 0 0 8px rgba(234, 179, 8, 0); } 100% { box-shadow: 0 0 0 0 rgba(234, 179, 8, 0); } }
            .warning-pulse-alert { animation: warningPulseGlow 1.5s infinite !important; border-color: var(--purecloud-script-warn-color) !important; color: #000 !important; background-color: var(--purecloud-script-warn-color) !important; }
            @keyframes fadeInRight { from { opacity: 0; transform: translateX(120%); } to { opacity: 0.98; transform: translateX(0); } } 
            @keyframes fadeEffect { from {opacity: 0; transform: translateY(5px);} to {opacity: 1; transform: translateY(0);} }
        `,
        SCROLLBAR: `
            .purecloud-script-popup, .purecloud-script-notification, .injected-element { font-family: var(--font-family-modern); }
            .panel-content, .mini-dashboard-content, .details-table-wrapper, .chart-scroll-container, .hide-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
            .panel-content::-webkit-scrollbar, .mini-dashboard-content::-webkit-scrollbar, .details-table-wrapper::-webkit-scrollbar, .chart-scroll-container::-webkit-scrollbar, .hide-scrollbar::-webkit-scrollbar { display: none; }
            textarea::-webkit-scrollbar { width: 6px; height: 6px; }
            textarea::-webkit-scrollbar-track { background: transparent; }
            textarea::-webkit-scrollbar-thumb { background-color: var(--purecloud-script-border-color); border-radius: 10px; }
        `,
        BUTTONS: `
            .purecloud-script-button { background-color: var(--purecloud-script-accent-color); color: var(--purecloud-script-accent-text); border: none; padding: 10px 18px; border-radius: 8px; cursor: pointer; font-size: 0.9em; font-weight: 600; letter-spacing: 0.3px; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); } 
            .purecloud-script-button:hover { transform: translateY(-2px); box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15); filter: brightness(1.05); }
            .purecloud-script-button:active { transform: translateY(0); box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .purecloud-script-button.button-danger { background-color: var(--purecloud-script-error-color); color: #fff; }
        `,
        NOTIFICATIONS: `
            .purecloud-script-notification { position: relative; z-index: 10005; width: 320px; padding: 16px 20px; margin: 12px; border-radius: 12px; box-shadow: 0 10px 25px var(--purecloud-script-shadow-color); font-size: 0.9em; font-weight: 500; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); opacity: 0.98; transition: opacity 0.3s, transform 0.3s; animation: fadeInRight 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); background-color: var(--purecloud-script-bg-secondary); color: var(--purecloud-script-text-primary); } 
            #purecloud-script-notification-container { position: fixed; top: 15px; right: 15px; z-index: 10004; } 
            .purecloud-script-notification-success { border-left: 4px solid var(--purecloud-script-success-color); } .purecloud-script-notification-error { border-left: 4px solid var(--purecloud-script-error-color); } .purecloud-script-notification-info { border-left: 4px solid var(--purecloud-script-info-color); } .purecloud-script-notification-warn { border-left: 4px solid var(--purecloud-script-warn-color); }
        `,
        BUBBLES: `
            .injected-element { font-weight: 600; font-size: 11px !important; padding: 2px 8px !important; border-radius: 12px; display: flex; align-items: center; justify-content: center; height: 22px; line-height: 1; box-shadow: 0 2px 5px rgba(0,0,0,0.05); border: 1px solid rgba(0,0,0,0.05) !important; transition: all 0.3s ease; white-space: nowrap; background-color: var(--purecloud-script-bubble-bg-normal) !important; color: var(--purecloud-script-bubble-text-normal) !important; }
            .injected-bubbles-container { position: absolute; bottom: 6px; left: 12px; display: flex; gap: 6px; z-index: 10; pointer-events: none; user-select: none; } 
            .interaction-content-wrapper, .interaction-content { position: relative !important; padding-bottom: 28px !important; }
            .injected-conversation-number { min-width: 22px; } .injected-interaction-icon { font-size: 11px !important; }
            .injected-bubbles-container:has(.injected-conversation-timer.normal-timer) .injected-element { color: var(--purecloud-script-bubble-text-active) !important; }
            .injected-bubbles-container:has(.injected-conversation-timer.paused-alert) .injected-element { color: var(--purecloud-script-bubble-text-paused) !important; }
            .injected-bubbles-container:has(.injected-conversation-timer.inactive-client-alert) .injected-element, .injected-bubbles-container:has(.injected-conversation-timer.inactive-operator-alert) .injected-element { color: var(--purecloud-script-bubble-text-timer-inactive) !important; border-color: var(--purecloud-script-bubble-text-timer-inactive) !important; animation: alertPulseGlow 1.5s infinite ease-out; }
            .injected-checkmark { background-color: var(--purecloud-script-success-color) !important; color: #fff !important; }
            .injected-recurrence-icon { background-color: var(--purecloud-script-warn-color) !important; color: #000 !important; } 
            /* Regra removida para evitar o "bug do cronômetro roxo" ao selecionar a conversa */
            /* div.interaction-group.is-selected .injected-element { background-color: var(--purecloud-script-bubble-bg-selected) !important; color: var(--purecloud-script-accent-text) !important; border-color: rgba(255,255,255,0.2) !important; box-shadow: 0 4px 10px rgba(0,0,0,0.15); } */
        `,
        PANELS: `
            /* Paleta Customizada por Módulo */
            .purecloud-script-settings-panel { --purecloud-script-header-bg: #475569; --purecloud-script-header-text: #ffffff; }
            #purecloud-script-tools-panel { --purecloud-script-header-bg: #7c3aed; --purecloud-script-header-text: #ffffff; }
            
            .purecloud-script-popup { position: fixed; background: var(--purecloud-script-bg-primary); border-radius: 16px; box-shadow: 0 16px 40px var(--purecloud-script-shadow-color); z-index: 10002; display: flex; flex-direction: column; border: 1px solid var(--purecloud-script-border-color); transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); margin: 0; overflow: hidden; } 
            .purecloud-script-settings-panel { resize: none; width: 90%; max-width: 850px; min-height: 550px; height: 85vh; } 
            #purecloud-script-tools-panel { width: 400px; height: auto; max-height: 85vh; resize: both; min-width: 280px; min-height: 250px; }
            .panel-header { cursor: move; background: var(--purecloud-script-header-bg, var(--purecloud-script-bg-secondary)); padding: 16px 20px; border-bottom: 1px solid var(--purecloud-script-border-color); display: flex; justify-content: space-between; align-items: center; } 
            .panel-header h2, .panel-header h3 { margin: 0; color: var(--purecloud-script-header-text, var(--purecloud-script-text-primary)); font-size: 16px; font-weight: 700; letter-spacing: -0.5px; } 
            .panel-header-buttons { display: flex; gap: 8px; } 
            .panel-header-btn { background: transparent; border: 1px solid rgba(255,255,255,0.2); border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-size: 0.9em; cursor: pointer; color: var(--purecloud-script-header-text, var(--purecloud-script-text-secondary)); transition: all 0.2s; } 
            .panel-header-btn:hover { color: #fff; background: rgba(255,255,255,0.1); transform: scale(1.1); } 
            .panel-content { padding: 24px; overflow-y: auto; flex-grow: 1; background: var(--purecloud-script-bg-primary); color: var(--purecloud-script-text-primary); } 
            .panel-footer { padding: 16px 24px; background: var(--purecloud-script-bg-secondary); border-top: 1px solid var(--purecloud-script-border-color); text-align: right; }
            .panel-content h4 { color: var(--purecloud-script-text-primary); font-size: 1.1em; margin-top: 15px; margin-bottom: 10px; border-bottom: 1px solid var(--purecloud-script-border-color); padding-bottom: 5px; }
            .purecloud-script-tabs { display: flex; flex-wrap: wrap; background: var(--purecloud-script-bg-secondary); border-bottom: 1px solid var(--purecloud-script-border-color); padding: 0 10px; overflow-x: hidden; } 
            .purecloud-script-tab-button { background-color: transparent; color: var(--purecloud-script-text-secondary); border: none; padding: 10px 14px; cursor: pointer; transition: all 0.2s ease; font-size: 0.95em; font-weight: 600; position: relative; display: flex; align-items: center; gap: 6px; white-space: nowrap; } 
            .purecloud-script-tab-button svg { width: 16px; height: 16px; transition: stroke 0.2s ease; }
            .purecloud-script-tab-button::after { content: ''; position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 0; height: 3px; background-color: var(--purecloud-script-accent-color); transition: width 0.3s ease; border-radius: 3px 3px 0 0; }
            .purecloud-script-tab-button.active { color: var(--purecloud-script-accent-color); } .purecloud-script-tab-button.active::after { width: 80%; }
            .purecloud-script-tab-button:hover:not(.active) { color: var(--purecloud-script-text-primary); } 
            .purecloud-script-tab-content { display: none; animation: fadeEffect 0.4s; flex-direction: column; flex-grow: 1; } 
            .purecloud-script-tab-content.active { display: flex; }
            .settings-group { margin-bottom: 24px; display: flex; flex-direction: column; } 
            .settings-group label { color: var(--purecloud-script-text-primary); font-size: 0.95em; margin-bottom: 8px; font-weight: 600; } 
            .settings-group input[type="number"], .settings-group input[type="text"], textarea { background: var(--purecloud-script-bg-primary); color: var(--purecloud-script-text-primary); border: 1px solid var(--purecloud-script-border-color); padding: 10px 14px; border-radius: 8px; transition: all 0.2s; width: 100%; box-sizing: border-box; font-size: 0.95em; font-family: inherit;} 
            .settings-group input:focus, textarea:focus { border-color: var(--purecloud-script-accent-color); outline: none; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2); }
        `,
        TABLES_COLORS: `
            .details-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 0.85em; } 
            .details-table th, .details-table td { padding: 10px 12px; text-align: left; border-bottom: 1px solid var(--purecloud-script-border-color); } 
            .details-table th { background-color: var(--purecloud-script-bg-secondary); color: var(--purecloud-script-text-primary); font-weight: 600; } 
            .details-table tr:hover { background-color: rgba(0, 0, 0, 0.02); } 
            .recurrence-tag, .first-tag { padding: 3px 8px; border-radius: 4px; font-weight: 600; font-size: 0.8em; display: inline-block; } 
            .recurrence-tag { background-color: var(--purecloud-script-warn-color); color: #000; } .first-tag { background-color: var(--purecloud-script-success-color); color: #fff; } 
            .is-recurrence-row { opacity: 0.85; } 
            .details-table th.col-num, .details-table td.col-num { text-align: right; width: 40px; font-weight: bold; color: var(--purecloud-script-text-secondary); } 
            .details-table th.col-type, .details-table td.col-type { text-align: center; width: 40px; font-size: 1.2em; }
            .theme-section { margin-bottom: 24px; } .theme-section h4 { margin-bottom: 15px; padding-bottom: 8px; border-bottom: 1px solid var(--purecloud-script-border-color); color: var(--purecloud-script-text-primary); } 
            .settings-group.color-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; } 
            .color-picker-group { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: var(--purecloud-script-bg-secondary); border: 1px solid var(--purecloud-script-border-color); border-radius: 8px; } 
            .color-picker-group label { margin-bottom: 0; font-size: 0.85em; color: var(--purecloud-script-text-secondary); margin-right: 10px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } 
            .color-picker-group input[type="color"] { min-width: 44px; height: 28px; padding: 2px; border: 1px solid var(--purecloud-script-border-color); cursor: pointer; background: var(--purecloud-script-bg-primary); border-radius: 4px; flex-shrink: 0; } 
        `,
        DASHBOARD: `
            .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 16px; margin-bottom: 24px; } 
            .stat-item { background: var(--purecloud-script-bg-secondary); padding: 18px; border-radius: 12px; border: 1px solid var(--purecloud-script-border-color); transition: transform 0.2s, box-shadow 0.2s; display: flex; flex-direction: column; align-items: center; justify-content: center; } 
            .stat-item:hover { transform: translateY(-3px); box-shadow: 0 8px 16px rgba(0,0,0,0.06); }
            .stat-item span { font-size: 0.85em; color: var(--purecloud-script-text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;} 
            .stat-item strong { font-size: 1.8em; display: block; margin-top: 8px; color: var(--purecloud-script-accent-color); }
            .analytics-chart-container-main { padding: 15px 0 5px 0; } .chart-scroll-container { overflow-x: auto; width: 100%; padding-bottom: 5px; } 
            .chart-bars-wrapper { display: flex; align-items: flex-end; height: 150px; min-width: 800px; padding-bottom: 20px; border-bottom: 1px solid var(--purecloud-script-border-color); } 
            .chart-bar-wrapper { width: 4.1666%; margin-right: 1px; text-align: center; position: relative; font-size: 0.7em; height: 100%; flex-shrink: 0; } 
            .chart-bar { background-color: var(--purecloud-script-accent-color); border-radius: 4px 4px 0 0; transition: height 0.4s ease-out; } 
            .bar-count { position: absolute; top: -18px; left: 50%; transform: translateX(-50%); font-size: 0.9em; font-weight: bold; color: var(--purecloud-script-text-primary); } 
            .bar-label { position: absolute; bottom: -20px; left: 0; width: 100%; color: var(--purecloud-script-text-secondary); font-size: 1.1em; }
            div.interaction-group{position:relative!important;} 
            #purecloud-script-mini-dashboard { padding: 0; background-color: var(--purecloud-script-bg-primary) !important; border: 1px solid var(--purecloud-script-border-color); } 
            #purecloud-script-mini-dashboard.collapsed { border-radius: 50px; box-shadow: 0 6px 16px var(--purecloud-script-shadow-color); height: 42px; padding: 0 16px; width: auto; min-width: 80px; cursor: move; overflow: hidden; } 
            #purecloud-script-mini-dashboard.expanded { --purecloud-script-header-bg: #0284c7; --purecloud-script-header-text: #ffffff; border-radius: 16px; width: 320px; max-width: 320px; cursor: default; resize: none; bottom: auto; left: auto; } 
            .mini-dashboard-header { height: 100%; padding: 8px 16px; display: flex; align-items: center; justify-content: center; background-color: transparent; border-bottom: none; border-radius: inherit; transition: all 0.2s; } 
            #purecloud-script-mini-dashboard.collapsed .mini-dashboard-header { cursor: move; } 
            #purecloud-script-mini-dashboard.expanded .mini-dashboard-header { height: 46px; background-color: var(--purecloud-script-header-bg); border-bottom: 1px solid var(--purecloud-script-border-color); justify-content: space-between; cursor: move; }
            .mini-dashboard-content { padding: 15px; background-color: var(--purecloud-script-bg-primary); border-radius: 0 0 16px 16px; flex-grow: 1; overflow-y: auto; display: none; } 
            #purecloud-script-mini-dashboard.expanded .mini-dashboard-content { display: block; } 
            .counter-display { display: flex; align-items: center; flex-grow: 1; margin-right: 0; overflow: hidden; justify-content: center; gap: 8px; } 
            #purecloud-script-mini-dashboard.expanded .counter-display { justify-content: flex-start; margin-right: 10px; } 
            .counter-text { color: var(--purecloud-script-text-primary); font-weight: 700; font-size: 1.15em; white-space: nowrap; } 
            #purecloud-script-mini-dashboard.expanded .counter-text { color: var(--purecloud-script-header-text); }
            #purecloud-script-mini-dashboard.expanded .stat-icon { color: var(--purecloud-script-header-text) !important; }
            .progress-bar-container-compact { flex-grow: 1; height: 6px; border-radius: 3px; background-color: var(--purecloud-script-border-color); display: none; } 
            #purecloud-script-mini-dashboard.expanded .progress-bar-container-compact { display: block; overflow: visible; } 
            .progress-bar-compact { background: linear-gradient(90deg, var(--purecloud-script-accent-color), var(--mini-dashboard-progress-color)); border-radius: 3px; height: 100%; transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 0 8px rgba(14, 165, 233, 0.4); }
            .mini-dashboard-controls { display: flex; align-items: center; gap: 6px; } 
            #purecloud-script-mini-dashboard.collapsed .mini-dashboard-controls { display: none; } 
            #purecloud-script-mini-dashboard.expanded .mini-dashboard-controls { display: flex; } 
            .compact-btn { border-radius: 6px; width: 28px; height: 28px; background: var(--purecloud-script-bg-secondary); border: 1px solid var(--purecloud-script-border-color); color: var(--purecloud-script-text-secondary); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; padding: 0; } 
            .compact-btn:hover { background: var(--purecloud-script-border-color); color: var(--purecloud-script-accent-color); }
            #purecloud-script-mini-dashboard.expanded .compact-btn { background: transparent; border-color: rgba(255,255,255,0.2); color: rgba(255,255,255,0.8); }
            #purecloud-script-mini-dashboard.expanded .compact-btn:hover { background: rgba(255,255,255,0.15); color: #fff; }
            .stats-grid-original.mini-dashboard-stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin: 0; } 
            .stat-label { display: flex; align-items: center; justify-content: center; gap: 6px; color: var(--purecloud-script-text-secondary); font-size: 0.8em; font-weight: 600; text-transform: uppercase; margin-bottom: 6px; } 
            .stat-icon { width: 14px; height: 14px; color: var(--purecloud-script-accent-color); stroke-width: 2px; }
            .stat-item-original strong { font-size: 1.4em; color: var(--purecloud-script-text-primary); font-weight: 700; }
            .stat-item-original { text-align: center; background: linear-gradient(145deg, var(--purecloud-script-bg-secondary), var(--purecloud-script-bg-primary)); padding: 14px 10px; border-radius: 12px; margin: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 1px solid var(--purecloud-script-border-color); box-shadow: 0 4px 6px rgba(0,0,0,0.02); transition: transform 0.2s, box-shadow 0.2s; } 
            .stat-item-original:hover { transform: translateY(-2px); box-shadow: 0 6px 12px rgba(0,0,0,0.05); border-color: var(--purecloud-script-accent-color); }
        `,
        TOOLBAR: `
            .purecloud-script-custom-btn { background: var(--purecloud-script-bg-secondary) !important; border: 1px solid var(--purecloud-script-border-color) !important; border-radius: 8px !important; margin: 0 4px !important; height: 34px; padding: 0 10px !important; transition: all 0.2s ease !important; cursor: pointer; display: inline-flex; align-items: center; color: var(--purecloud-script-text-secondary) !important; order: 3; position: relative; overflow: hidden; }
            .purecloud-script-custom-btn:hover { background: var(--purecloud-script-accent-color) !important; color: #fff !important; transform: translateY(-2px) !important; box-shadow: 0 4px 8px rgba(0,0,0,0.1) !important; border-color: transparent !important; }
            .purecloud-script-custom-btn:active { transform: translateY(0) !important; box-shadow: none !important; }
            .purecloud-script-custom-btn svg { stroke: currentColor !important; width: 18px; height: 18px; flex-shrink: 0; } 
        `,
        SPELL_PRO: `
            #spell-overlay-layer { position: absolute; pointer-events: none; color: transparent !important; background: transparent !important; z-index: 2147483640; overflow: hidden; white-space: pre-wrap; word-wrap: break-word; }
            .spell-wavy-error { text-decoration: underline wavy #ef4444;  text-decoration-skip-ink: none; text-underline-offset: 3px; }
            .spell-wavy-punct { border-bottom: 2px dashed #10b981;  display: inline-block; min-width: 4px; }
            #spell-badge { position: absolute; width: 22px; height: 22px; border-radius: 50%; color: white; display: none; align-items: center; justify-content: center; font-family: sans-serif; font-size: 11px; font-weight: bold; z-index: 2147483645; cursor: pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.2); background: #ef4444; transition: all 0.2s ease; }
            #spell-badge.loading { background: #f59e0b; animation: spellPulse 1.5s infinite; }
            #spell-badge.clean { background: #10b981; }
            #spell-badge:hover { transform: scale(1.1); box-shadow: 0 3px 8px rgba(0,0,0,0.3); }
            @keyframes spellPulse { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(0.95); } 100% { opacity: 1; transform: scale(1); } }
            
            #spell-inline-popup { position: absolute; background: white; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); width: 250px; display: none; flex-direction: column; z-index: 2147483648; font-family: sans-serif; overflow: hidden; animation: spellPopIn 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
            @keyframes spellPopIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
            .popup-header { background: #f8fafc; padding: 10px 12px; font-size: 11px; color: #64748b; font-weight: 600; border-bottom: 1px solid #e5e7eb; text-transform: uppercase; letter-spacing: 0.5px; }
            .popup-body { padding: 12px; }
            .popup-sug-btn { width: 100%; text-align: left; padding: 8px 12px; background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.2s; display: flex; align-items: center; gap: 8px; }
            .popup-sug-btn:hover { background: #dbeafe; border-color: #93c5fd; }
            .popup-footer { display: flex; gap: 5px; padding: 8px 12px; background: #f8fafc; border-top: 1px solid #e5e7eb; }
            .popup-action-btn { flex: 1; padding: 6px; font-size: 11px; border: 1px solid #e5e7eb; background: white; border-radius: 4px; cursor: pointer; color: #475569; transition: background 0.2s; }
            .popup-action-btn:hover { background: #f1f5f9; color: #0f172a; }
            #btn-rewrite { font-weight: 600; color: #8b5cf6; border-color: #ede9fe; background: #f5f3ff; }
            #btn-rewrite:hover { background: #ede9fe; }
            .ai-loading { background: linear-gradient(90deg, #f5f3ff, #ddd6fe, #f5f3ff); background-size: 200% 100%; animation: spellAILoading 1.5s infinite linear; pointer-events: none; }
            @keyframes spellAILoading { 0% { background-position: 100% 0; } 100% { background-position: -100% 0; } }

            #spell-main-panel { --purecloud-script-header-bg: #059669; --purecloud-script-header-text: #ffffff; position: fixed; top: 80px; right: 20px; width: 340px; max-height: 80vh; background: white; border-radius: 12px; box-shadow: 0 20px 40px rgba(0,0,0,0.15); border: 1px solid #e5e7eb; z-index: 2147483649; display: none; flex-direction: column; font-family: sans-serif; overflow: hidden; }
            .panel-header-top { display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; background: var(--purecloud-script-header-bg, #f8fafc); border-bottom: 1px solid #e5e7eb; }
            .panel-title { font-weight: 700; color: var(--purecloud-script-header-text, #0f172a); display: flex; align-items: center; gap: 8px; }
            .btn-fix-all { background: white; color: var(--purecloud-script-header-bg, #3b82f6); border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; }
            .btn-fix-all:hover { background: #f1f5f9; }
            .panel-tabs { display: flex; border-bottom: 1px solid #e5e7eb; padding: 0 10px; }
            .tab-active { padding: 10px 15px; font-size: 12px; font-weight: 600; color: #10b981; border-bottom: 2px solid #10b981; cursor: default; }
            .panel-body { overflow-y: auto; padding: 10px; background: #f1f5f9; flex: 1; display: flex; flex-direction: column; gap: 10px; }
            .panel-card { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
            .card-category { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 6px; display: block; }
            .card-change { font-size: 14px; color: #0f172a; line-height: 1.5; }
            .card-wrong { text-decoration: line-through; color: #ef4444; background: #fef2f2; padding: 2px 4px; border-radius: 4px; }
            .card-right { color: #10b981; background: #ecfdf5; padding: 2px 4px; border-radius: 4px; font-weight: 500; cursor: pointer; transition: background 0.2s; border: 1px dashed #6ee7b7; margin-left: 5px; }
            .card-right:hover { background: #d1fae5; border-style: solid; }
        `
    };

