window.AjaModular.register("lembretes", [], function(ctx) {
return { mount(panel, notify) { // Lógica dos Lembretes
                        panel.querySelectorAll('.btn-lembrete').forEach(btn => {
                            btn.onclick = (e) => {
                                const minutes = parseInt(e.target.dataset.time);
                                notify(`Alarme configurado! Avisarei em ${minutes} minuto(s).`, "success");

                                setTimeout(() => {
                                    // Play beep / alert
                                    if (window.audioNotificacao) { window.audioNotificacao.play().catch(e => { }); }
                                    alert(`⏰ HORA DE RETORNAR! Verifique o chat do cliente.`);
                                }, minutes * 60000);
                            };
                        });
 } };
});
