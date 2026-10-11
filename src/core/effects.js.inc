    // --- SISTEMA DE SOM E CONFETES (GAMIFICAÇÃO) ---
    const effectsManager = {
        audioContext: null,
        init() {
            if (!this.audioContext && (window.AudioContext || window.webkitAudioContext)) {
                try { this.audioContext = new (window.AudioContext || window.webkitAudioContext)(); log("AudioContext inicializado."); } catch (e) { log("Erro ao inicializar AudioContext:", e); }
            }
        },
        playBeep(type = 'inactive') {
            if (!this.audioContext || !CONFIG.SOUND_ALERTS_ENABLED) return;
            try {
                const oscillator = this.audioContext.createOscillator(); const gainNode = this.audioContext.createGain();
                let frequency = 440, duration = 0.1;
                if (type === 'inactive_client') { frequency = 880; duration = 0.15; } else if (type === 'inactive_operator') { frequency = 660; duration = 0.1; }
                else if (type === 'reminder') { frequency = 1046.50; duration = 0.3; } // Som específico para o lembrete
                oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime); gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
                oscillator.connect(gainNode); gainNode.connect(this.audioContext.destination);
                oscillator.start(this.audioContext.currentTime); oscillator.stop(this.audioContext.currentTime + duration);
            } catch (e) { }
        },
        playSuccess() {
            if (!this.audioContext || !CONFIG.SOUND_ALERTS_ENABLED) return;
            try {
                [440, 554, 659, 880].forEach((freq, i) => {
                    setTimeout(() => {
                        const osc = this.audioContext.createOscillator(); const gain = this.audioContext.createGain();
                        osc.type = 'sine'; osc.frequency.value = freq;
                        gain.gain.setValueAtTime(0.1, this.audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.5);
                        osc.connect(gain); gain.connect(this.audioContext.destination);
                        osc.start(); osc.stop(this.audioContext.currentTime + 0.5);
                    }, i * 100);
                });
            } catch (e) { }
        },
        triggerConfetti() {
            const colors = ['#10b981', '#3b82f6', '#fbbf24', '#ef4444', '#6366f1', '#ec4899'];
            for (let i = 0; i < 120; i++) {
                const confetti = document.createElement('div');
                confetti.style.position = 'fixed'; confetti.style.width = '10px'; confetti.style.height = '12px';
                confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.left = Math.random() * 100 + 'vw'; confetti.style.top = '-20px';
                confetti.style.zIndex = '999999'; confetti.style.pointerEvents = 'none';
                confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
                document.body.appendChild(confetti);
                const duration = Math.random() * 3 + 2;
                confetti.animate([
                    { transform: `translate3d(0, 0, 0) rotate(0deg)`, opacity: 1 },
                    { transform: `translate3d(${Math.random() * 300 - 150}px, 100vh, 0) rotate(${Math.random() * 1080}deg)`, opacity: 0 }
                ], { duration: duration * 1000, easing: 'cubic-bezier(.37,0,.63,1)' });
                setTimeout(() => confetti.remove(), duration * 1000);
            }
        }
    };

