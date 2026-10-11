    function injectCss() {
        document.getElementById('purecloud-script-injected-style')?.remove();
        const theme = validateConfigValue('THEME_COLORS', CONFIG.THEME_COLORS);
        const css = Object.values(CONFIG_CSS).join('\n');

        // Substituindo as variáveis lidas do theme no texto do CSS
        const processedCss = css.replace(/\$\{theme\.([a-zA-Z]+)\}/g, (match, p1) => theme[p1]);

        const style = document.createElement('style');
        style.id = 'purecloud-script-injected-style';
        document.head.appendChild(style);
        style.textContent = processedCss;
    }

    function initializeDailyCounters(forceReset = false) {
        const todayKey = getBrazilTime(new Date()).toLocaleDateString('pt-BR');
        const lastSavedDate = ajaStorage.getItem('purecloudScript_lastActivityDate');
        if (lastSavedDate !== todayKey || forceReset) { 
            ajaStorage.setItem('purecloudScript_lastActivityDate', todayKey); 
            analyticsManager.clearAllData(); 
        } else { 
            analyticsManager.getData(); 
            loadV4Counters(); 
        }
    }

