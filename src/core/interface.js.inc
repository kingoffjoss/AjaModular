    const UI = {};

    const defaultTheme = { bgPrimary: '#ffffff', bgSecondary: '#f8fafc', textPrimary: '#1e293b', textSecondary: '#64748b', borderColor: '#e2e8f0', accent: '#6366f1', accentText: '#ffffff', success: '#10b981', error: '#ef4444', warn: '#f59e0b', info: '#3b82f6', timerBg: '#f8fafc', timerNormalText: '#1e293b', timerActiveText: '#6366f1', timerPausedText: '#f59e0b', timerInactiveClientText: '#ef4444', timerCompletedBg: '#10b981', miniDashboardProgress: '#10b981' };
    let theme;
    try {
        theme = JSON.parse(ajaStorage.getItem('gcp_themeColors_v2')) || JSON.parse(ajaStorage.getItem('timerColors')) || defaultTheme;
    } catch (e) { theme = defaultTheme; }

