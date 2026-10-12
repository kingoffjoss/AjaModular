// Shared dependencies: ajaStorage
window.AjaModular.register("pausas", ["compatibility","relogio"], function(ctx) {
    /* --- MÓDULO ANEXADO: PAUSAS.JS --- */
    try {
        // =================================================================
        // Parceiro de Programação: SCRIPT FINAL (V49.2 - MERGE)
        // Mudanças:
        // 1. MERGE (V49.1 + V48.4): Aplicadas todas as correções de
        //    "Pausa auricular" (V49.0) e do "Modal de Automação" (V49.1)
        //    na versão do usuário que contém o "Relógio no Cabeçalho" (V48.4).
        // 2. MANTIDO (V48.4): Relógio no cabeçalho do painel.
        // 3. MANTIDO (V49.1): Lógica de clique correta e correção do modal.
        // =================================================================

        (function () {

            // --- INÍCIO: KILL SWITCH (V48.2) ---
            // Remove à força qualquer UI antiga antes de construir a nova
            console.log("[GERENCIADOR V49.2] Forçando a remoção de UIs antigas...");
            try {
                const old_ui = document.getElementById('pausa-script-container');
                if (old_ui) old_ui.remove();
                const old_config = document.getElementById('pausa-script-config-container');
                if (old_config) old_config.remove();
                console.log("[GERENCIADOR V49.2] UIs antigas removidas com sucesso.");
            } catch (e) {
                console.warn("[GERENCIADOR V49.2] Erro ao limpar UI antiga:", e.message);
            }
            // --- FIM: KILL SWITCH ---


            // ----------------------------------------------------
            // CONSTANTES E CONFIGURAÇÕES
            // ----------------------------------------------------

            // ATUALIZADA V49.0
            const SELECTORES = {
                MENU_STATUS_TOGGLE: '#user-settings-button, #toggleUserDropdownTarget',
                DISPONIVEL: 'button.presence-available',
                REFEICAO: 'button.presence-meal',
                INTERVALO_MENU: 'button.presence-break',
                OCUPADO_MENU: 'button.presence-busy',
                LOGOFF: 'span.menu-label',
                NA_FILA_TOGGLE_HOST: 'gux-toggle#command-bar-queue-toggle',
                NA_FILA_DIRETO: 'gux-button.onQueueButton',
                VOLTAR_SUBMENU: 'button[title="Volte às presenças primárias"]',
                STATUS_LABEL_TEXT: 'span.presence-label-text',
                TREINAMENTO: 'button.presence-training',
                REUNIAO: 'button.presence-meeting',
            };

            // ATUALIZADA V48.8
            const PAUSAS_AGENDADAS_DEFAULT = [
                { hora: "17:40", status: "Na fila" }, { hora: "18:35", status: "Pausa out" },
                { hora: "18:40", status: "Pausa auricular" }, { hora: "18:50", status: "Na fila" },
                { hora: "19:45", status: "Pausa out" }, { hora: "19:50", status: "Refeição" },
                { hora: "20:10", status: "Na fila" }, { hora: "22:25", status: "Pausa out" },
                { hora: "22:30", status: "Pausa auricular" }, { hora: "22:40", status: "Na fila" },
                { hora: "00:00", status: "Logoff" }
            ];

            let estadoAtual = { tipo: 'Disponível', inicio: new Date(), ativa: false };
            let historicoPausas = [];
            let isAgendamentoAtivo = false;
            let schedulerInterval = null;
            let syncTimeout = null;
            let ultimoEventoProcessado = null;
            let isConfigPainelAberto = false;
            let dragElement = null;
            let offsetX = 0, offsetY = 0;
            let isDragging = false;
            let isAutomacaoPausada = false;
            let confirmModalTimeout = null;
            const STORAGE_KEY_HORARIOS = 'gerenciadorPausas_horarios';
            const STORAGE_KEY_POS_MAIN = 'gerenciadorPausas_posMain';
            const STORAGE_KEY_POS_CONFIG = 'gerenciadorPausas_posConfig';
            const STORAGE_KEY_NOTIF_CONFIG = 'gerenciadorPausas_notifConfig';

            const NOTIF_CONFIG_DEFAULT = { ativadas: true, somAtivado: false, antecedenciaSegundos: 15 };
            let configNotificacao = { ...NOTIF_CONFIG_DEFAULT };
            const SOM_NOTIFICACAO_URL = 'https://www.soundjay.com/button/sounds/beep-07a.mp3';
            let audioNotificacao = new Audio(SOM_NOTIFICACAO_URL);
            let audioDesbloqueado = false;

            // --- Funções de LocalStorage ---
            function salvarHorariosLocalStorage(h) { try { ctx.ajaStorage.setItem(STORAGE_KEY_HORARIOS, JSON.stringify(h)); console.log("[LS] Horários salvos.") } catch (e) { console.error("[LS] Erro save horários:", e) } }
            function carregarHorariosLocalStorage() { try { const h = ctx.ajaStorage.getItem(STORAGE_KEY_HORARIOS); if (h) { const p = JSON.parse(h); if (Array.isArray(p)) { if (p.every(i => typeof i.hora === 'string' && typeof i.status === 'string')) { console.log("[LS] Horários carregados."); return p } else { console.warn("[LS] Formato interno inválido."); ctx.ajaStorage.removeItem(STORAGE_KEY_HORARIOS) } } else { console.warn("[LS] Formato JSON inválido."); ctx.ajaStorage.removeItem(STORAGE_KEY_HORARIOS) } } } catch (e) { console.error("[LS] Erro load horários:", e); ctx.ajaStorage.removeItem(STORAGE_KEY_HORARIOS) } console.log("[LS] Nenhum horário salvo. Usando padrão."); return [...PAUSAS_AGENDADAS_DEFAULT] }
            function salvarPosicaoPainelLocalStorage(k, el) { if (!el) return; try { let p = {}; if (el.style.top && el.style.left) { p = { top: el.style.top, left: el.style.left } } else if (el.style.bottom && el.style.right) { p = { bottom: el.style.bottom, right: el.style.right } } else { const r = el.getBoundingClientRect(); p = { top: r.top + 'px', left: r.left + 'px' } } ctx.ajaStorage.setItem(k, JSON.stringify(p)) } catch (e) { console.error(`[LS] Erro save pos ${k}:`, e) } }
            function carregarPosicaoPainelLocalStorage(k) { try { const pS = ctx.ajaStorage.getItem(k); if (pS) { const p = JSON.parse(pS); if (p && (p.top || p.bottom)) return p } } catch (e) { console.error(`[LS] Erro load pos ${k}:`, e); ctx.ajaStorage.removeItem(k) } return null }
            function salvarConfiguracoesNotificacaoLocalStorage(c) { try { ctx.ajaStorage.setItem(STORAGE_KEY_NOTIF_CONFIG, JSON.stringify(c)); console.log("[LS] Config Notif salva.") } catch (e) { console.error("[LS] Erro save config notif:", e) } }
            function carregarConfiguracoesNotificacaoLocalStorage() { try { const cS = ctx.ajaStorage.getItem(STORAGE_KEY_NOTIF_CONFIG); if (cS) { const c = JSON.parse(cS); if (typeof c.ativadas === 'boolean' && typeof c.somAtivado === 'boolean' && typeof c.antecedenciaSegundos === 'number') { console.log("[LS] Config Notif carregada."); return { ...NOTIF_CONFIG_DEFAULT, ...c } } else { console.warn("[LS] Formato config notif inválido."); ctx.ajaStorage.removeItem(STORAGE_KEY_NOTIF_CONFIG) } } } catch (e) { console.error("[LS] Erro load config notif:", e); ctx.ajaStorage.removeItem(STORAGE_KEY_NOTIF_CONFIG) } console.log("[LS] Nenhuma config notif salva. Usando padrão."); return { ...NOTIF_CONFIG_DEFAULT } }

            let PAUSAS_AGENDADAS = carregarHorariosLocalStorage();
            configNotificacao = carregarConfiguracoesNotificacaoLocalStorage();

            // ----------------------------------------------------
            // FUNÇÕES DE UTILIDADE E INTERAÇÃO COM A PLATAFORMA
            // ----------------------------------------------------

            function tocarSomNotificacao() { if (!configNotificacao.somAtivado) return; if (!audioDesbloqueado) { console.warn("[Notif Som] Áudio não desbloqueado."); desbloquearAudio(true); return } audioNotificacao.currentTime = 0; audioNotificacao.play().catch(e => { console.error("[Notif Som] Erro:", e.message); audioDesbloqueado = !1; document.addEventListener('click', desbloquearAudio, { once: !0 }) }) }
            function desbloquearAudio(forcePlay = !1) { if (audioDesbloqueado && !forcePlay) return; let p = audioNotificacao.play(); if (p !== undefined) { p.then(() => { audioNotificacao.pause(); audioNotificacao.currentTime = 0; if (!audioDesbloqueado) { audioDesbloqueado = !0; console.log("[Audio] Contexto desbloqueado.") } }).catch(e => { }); } if (audioDesbloqueado) { document.removeEventListener('click', desbloquearAudio) } }
            async function mostrarNotificacao(evento) { if (!configNotificacao.ativadas) { console.log("[Notif] Desativadas."); return } if (!("Notification" in window)) { console.warn("[Notif] Navegador não suporta."); return } let p = Notification.permission; if (p === "granted") { tocarSomNotificacao(); new Notification("Gerenciador - Próxima Ação", { body: `${evento.status} às ${evento.hora}`, tag: `gdp-${evento.hora}-${evento.status}` }); console.log(`[Notif] Exibida: ${evento.status}`) } else if (p === "default") { console.log("[Notif] Pedindo permissão..."); try { p = await Notification.requestPermission(); if (p === "granted") { console.log("[Notif] Permissão OK!"); mostrarNotificacao(evento) } else { console.warn("[Notif] Permissão Negada."); ctx.ajaStorage.setItem('notif_negada', '1') } } catch (err) { console.error("[Notif] Erro ao pedir:", err) } } else { if (!ctx.ajaStorage.getItem('notif_negada')) { console.warn("[Notif] Permissão negada antes."); ctx.ajaStorage.setItem('notif_negada', '1') } } }

            // ATUALIZADA V49.0 (Revertida para V46.1)
            function clicarElemento(s, t = null) {
                let e = null;
                if (t) {
                    const l = document.querySelectorAll(s);
                    if (l.length === 0) {
                        console.warn(`[AÇÃO V49.2] Nenhum elemento encontrado com o seletor: ${s}`);
                    }
                    for (const o of l) {
                        if (o.textContent.trim().toLowerCase() === t.toLowerCase()) {
                            e = o;
                            // Lógica V46.1: Sobe até encontrar um <button>
                            while (e && e.parentElement && e.tagName !== 'BUTTON') {
                                e = e.parentElement;
                            }
                            if (e && e.tagName === 'BUTTON') break; // Encontramos
                            e = null; // Não é um botão, continua procurando
                        }
                    }
                } else {
                    e = document.querySelector(s);
                }

                if (e) {
                    console.log(`[AÇÃO V49.2] Clicando: ${s}` + (t ? ` (Texto: ${t})` : ''));
                    const c = new MouseEvent('click', { view: window, bubbles: true, cancelable: true });
                    e.dispatchEvent(c);
                    return true;
                }
                console.warn(`[AÇÃO V49.2] Não encontrado: ${s}` + (t ? ` (Texto: ${t})` : ''));
                return false;
            }

            function forcarCliquePorTexto(t) { const s = SELECTORES.STATUS_LABEL_TEXT; const e = document.querySelectorAll(s); for (const l of e) { if (l.textContent.trim() === t) { let o = l; while (o && o.parentElement && o.tagName !== 'BUTTON') { o = o.parentElement } if (o && o.tagName === 'BUTTON') { const c = new MouseEvent('click', { view: window, bubbles: !0, cancelable: !0 }); o.dispatchEvent(c); return !0 } } } return !1 }

            // ATUALIZADO V46.2
            function clicarVoltarSubmenu() { if (clicarElemento(SELECTORES.VOLTAR_SUBMENU)) { console.log("[AÇÃO] Clicado Voltar."); return !0 } console.warn("[AÇÃO] Voltar não encontrado."); return !1 }

            function formatarDuracao(s) { const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), c = Math.max(0, s % 60); const p = n => String(n).padStart(2, '0'); return `${p(h)}:${p(m)}:${p(c)}` }
            function converterDuracaoParaSegundos(d) { if (!d || typeof d !== 'string') return 0; const p = d.split(':'); if (p.length !== 3) return 0; const h = parseInt(p[0], 10) || 0, m = parseInt(p[1], 10) || 0, s = parseInt(p[2], 10) || 0; return (h * 3600) + (m * 60) + s }

            // ATUALIZADA V46.4
            function registrarPausa(n) {
                const a = new Date;
                console.log(`[PAUSA V46.4] Registrando: ${n}`);

                if (estadoAtual.ativa) {
                    const f = a;
                    const d = f.getTime() - estadoAtual.inicio.getTime();
                    if (d > 500) {
                        historicoPausas.push({
                            tipo: estadoAtual.tipo,
                            inicio: estadoAtual.inicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                            fim: f.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                            duracao: formatarDuracao(Math.round(d / 1000))
                        });
                        renderizarHistoricoLog();
                        renderizarEstatisticas();
                    } else {
                        console.log(`[PAUSA] Anterior (${estadoAtual.tipo}) muito curta. Descartada.`);
                    }
                }

                estadoAtual = {
                    tipo: n,
                    inicio: a,
                    ativa: (n !== 'Logoff')
                };

                atualizarUI();
            }

            function adicionarAtalho() { document.addEventListener('keydown', function (e) { const c = e.ctrlKey || e.metaKey, s = e.shiftKey, o = e.code === 'Digit1' || e.key === '1'; if (document.activeElement && (document.activeElement.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName))) return; if (c && s && o) { e.preventDefault(); toggleVisibilidade() } }) }

            // --- Funções de Agendamento ---

            // ATUALIZADA V48.8
            function mapearEexecutarAcao(s) {
                console.log(`[AGENDAMENTO V49.2] Mapeando: ${s}`);
                const status = s.toLowerCase().trim();

                switch (status) {
                    case "na fila": iniciarNaFila(true); break;
                    case "disponível": voltarDisponivel(true); break;
                    case "pausa out": iniciarPausaOut(true); break;
                    case "pausa auricular": // NOVO NOME V48.8
                    case "pausa pessoal":   // NOME ANTIGO (Compatibilidade)
                    case "descanso":        // NOME ANTIGO (Compatibilidade)
                        iniciarDescanso(true); break;
                    case "refeição": iniciarRefeicao(true); break;
                    case "treinamento": iniciarTreinamento(true); break;
                    case "reunião": iniciarReuniao(true); break;
                    case "logoff": realizarLogoff(true); break;
                    case "atividade backoffice":
                    case "ativ. backoffice":
                    case "backoffice":
                        iniciarBackoffice(true); break;
                    case "feedback": iniciarFeedback(true); break;
                    case "particular": iniciarParticular(true); break;
                    case "questões de saúde":
                    case "questoes de saude":
                    case "saúde":
                    case "saude":
                        iniciarQuestoesSaude(true); break;
                    default:
                        console.warn(`[AGENDAMENTO V49.2] Status '${s}' não mapeado.`);
                }
            }

            // ATUALIZADA V48.0
            function verificarEExecutarAgendamentos() { if (!isAgendamentoAtivo || isAutomacaoPausada) { if (isAutomacaoPausada) console.log("[AGENDAMENTO CHECK V49.2] Pausado."); return } const a = new Date, h = `${String(a.getHours()).padStart(2, '0')}:${String(a.getMinutes()).padStart(2, '0')}`, s = a.getSeconds(); console.log(`[AGENDAMENTO CHECK V49.2] Verificando ${h}:${String(s).padStart(2, '0')}`); Object.keys(window).forEach(k => { if (k.startsWith('notif_')) { const e = k.split('_')[1]; if (e < h) { clearTimeout(window[k]); delete window[k]; } } }); const eA = PAUSAS_AGENDADAS.find(p => p.hora === h); if (eA && ultimoEventoProcessado !== h) { console.warn(`[AGENDAMENTO DISPARADO V49.2] EXECUTANDO: ${eA.status} às ${eA.hora}`); mapearEexecutarAcao(eA.status); ultimoEventoProcessado = h; if (eA.status.toLowerCase() === 'logoff') { setTimeout(() => { if (isAgendamentoAtivo) toggleAgendamento() }, 500) } return } if (!eA && ultimoEventoProcessado) { ultimoEventoProcessado = null; } if (s < 15) { const pM = new Date(a.getTime() + 6e4), hP = `${String(pM.getHours()).padStart(2, '0')}:${String(pM.getMinutes()).padStart(2, '0')}`; const eP = PAUSAS_AGENDADAS.find(p => p.hora === hP); if (eP) { const antecedencia = configNotificacao.antecedenciaSegundos; const sN = Math.max(0, (60 - antecedencia) - s), tId = `notif_${eP.hora}_${eP.status}`; if (sN > 0 && !window[tId]) { console.log(`[Notif V49.2] Agendando ${eP.status} às ${eP.hora} em ${sN} seg. (Antecedência: ${antecedencia}s)`); window[tId] = setTimeout(() => { mostrarNotificacao(eP); delete window[tId] }, sN * 1e3) } } } }
            function iniciarSchedulerSincronizado() { console.log("[Scheduler V49.2] Sincronizado!"); if (!isAgendamentoAtivo) { console.log("[Scheduler V49.2] Automação desligada pós-sinc."); return } verificarEExecutarAgendamentos(); schedulerInterval = setInterval(verificarEExecutarAgendamentos, 60000) }
            function sincronizarEIniciarScheduler() { if (schedulerInterval) clearInterval(schedulerInterval); if (syncTimeout) clearTimeout(syncTimeout); const sA = new Date().getSeconds(); const dMs = (60 - sA) * 1000; console.log(`[Scheduler V49.2] Aguardando ${dMs / 1000}s para sincronizar...`); syncTimeout = setTimeout(iniciarSchedulerSincronizado, dMs) }

            // ATUALIZADA V48.0
            function toggleAgendamento() {
                console.log("[AÇÃO V49.2] toggleAgendamento.");
                const b = document.getElementById('btn-toggle-agendamento'), p = document.getElementById('btn-pause-resume-agendamento');
                if (isAgendamentoAtivo) {
                    if (schedulerInterval) clearInterval(schedulerInterval); if (syncTimeout) clearTimeout(syncTimeout);
                    schedulerInterval = null; syncTimeout = null; isAgendamentoAtivo = !1; isAutomacaoPausada = !1;
                    console.warn("[AGENDAMENTO V49.2] OFF.");
                    if (b) { b.textContent = "Ligar Automação"; b.style.background = 'linear-gradient(135deg, #23a745, #2dc24f)'; }
                    if (p) p.style.display = 'none';
                } else {
                    PAUSAS_AGENDADAS = carregarHorariosLocalStorage();
                    console.log(`[AGENDAMENTO V49.2] ${PAUSAS_AGENDADAS.length} horários carregados.`);
                    ultimoEventoProcessado = null; isAutomacaoPausada = !1; isAgendamentoAtivo = !0;
                    console.info("[AGENDAMENTO V49.2] ON. Sincronizando...");
                    if (b) { b.textContent = "Desligar Automação"; b.style.background = 'linear-gradient(135deg, #dc3545, #e84a5f)'; }
                    if (p) {
                        p.textContent = "Pausar ⏸️";
                        p.style.background = 'linear-gradient(135deg, #ffc107, #ffd25a)';
                        p.style.color = '#000';
                        p.style.display = 'inline-block';
                    }
                    sincronizarEIniciarScheduler();
                }
            }
            // ATUALIZADA V48.0
            function togglePausaAutomacao() {
                if (!isAgendamentoAtivo) return;
                isAutomacaoPausada = !isAutomacaoPausada;
                const b = document.getElementById('btn-pause-resume-agendamento');
                if (isAutomacaoPausada) {
                    console.warn("[AGENDAMENTO] PAUSADO.");
                    if (b) {
                        b.textContent = "Retomar ▶️";
                        b.style.background = 'linear-gradient(135deg, #007FFF, #009cff)';
                        b.style.color = '#fff';
                    }
                } else {
                    console.info("[AGENDAMENTO] RETOMADO.");
                    if (b) {
                        b.textContent = "Pausar ⏸️";
                        b.style.background = 'linear-gradient(135deg, #ffc107, #ffd25a)';
                        b.style.color = '#000';
                    }
                    verificarEExecutarAgendamentos();
                }
            }

            // --- Funções de Edição ---
            function adicionarNovoHorario() { const iH = document.getElementById('novo-horario-hora'), iS = document.getElementById('novo-horario-status'); if (!iH || !iS) return; const h = iH.value, s = iS.value.trim(); if (!h) { alert("Insira hora."); iH.focus(); return } if (!s) { alert("Insira status."); iS.focus(); return } if (PAUSAS_AGENDADAS.some(p => p.hora === h)) { if (!confirm(`Já existe ${h}. Substituir?`)) return; PAUSAS_AGENDADAS = PAUSAS_AGENDADAS.filter(p => p.hora !== h) } PAUSAS_AGENDADAS.push({ hora: h, status: s }); PAUSAS_AGENDADAS.sort((a, b) => a.hora.localeCompare(b.hora)); salvarHorariosLocalStorage(PAUSAS_AGENDADAS); iH.value = ''; iS.value = ''; renderizarAgendamentos(); console.log(`Adicionado/Atualizado: ${h} - ${s}`); alert("Horário salvo! Desligue e Ligue a Automação para aplicar.") }
            function removerHorario(idx) { if (idx < 0 || idx >= PAUSAS_AGENDADAS.length) return; const item = PAUSAS_AGENDADAS[idx]; if (confirm(`Remover: ${item.hora} - ${item.status}?`)) { PAUSAS_AGENDADAS.splice(idx, 1); salvarHorariosLocalStorage(PAUSAS_AGENDADAS); renderizarAgendamentos(); console.log(`Removido: ${item.hora} - ${item.status}`); alert("Horário removido! Desligue e Ligue a Automação para aplicar.") } }
            function carregarHorarioParaEdicao(idx) { if (idx < 0 || idx >= PAUSAS_AGENDADAS.length) return; const item = PAUSAS_AGENDADAS[idx]; const iH = document.getElementById('novo-horario-hora'), iS = document.getElementById('novo-horario-status'); if (!iH || !iS) return; iH.value = item.hora; iS.value = item.status; console.log(`[Editor] Carregado: ${item.hora}`); iS.focus(); iS.select() }

            // --- Funções de Exportar/Importar ---
            function exportarConfiguracoes() { console.log("[Backup] Exportando..."); try { const c = { pausas: carregarHorariosLocalStorage(), notificacoes: carregarConfiguracoesNotificacaoLocalStorage(), posicoes: { main: carregarPosicaoPainelLocalStorage(STORAGE_KEY_POS_MAIN) || { bottom: '30px', right: '30px' }, config: carregarPosicaoPainelLocalStorage(STORAGE_KEY_POS_CONFIG) || { bottom: '30px', right: '340px' } } }; const d = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(c, null, 2)); const l = document.createElement('a'); l.setAttribute('href', d); l.setAttribute('download', 'config_gerenciador_pausas.json'); document.body.appendChild(l); l.click(); l.remove(); console.log("[Backup] Exportado.") } catch (e) { console.error("[Backup] Erro exportar:", e); alert("Erro ao exportar.") } }
            function importarConfiguracoes() { const i = document.getElementById('import-file-input'); if (i) i.click(); else console.error("[Backup] Input não encontrado.") }
            function handleArquivoImportado(event) { const a = event.target.files[0]; if (!a) { console.log("[Backup] Nenhum arquivo."); return } const r = new FileReader(); r.onload = function (e) { try { const c = JSON.parse(e.target.result); if (c && c.pausas && c.notificacoes && c.posicoes) { salvarHorariosLocalStorage(c.pausas); salvarConfiguracoesNotificacaoLocalStorage(c.notificacoes); salvarPosicaoPainelLocalStorage(STORAGE_KEY_POS_MAIN, c.posicoes.main); salvarPosicaoPainelLocalStorage(STORAGE_KEY_POS_CONFIG, c.posicoes.config); console.log("[Backup] Importado e salvo."); alert("Configurações importadas!\n\nRecarregue a página (F5) agora."); event.target.value = null } else { throw new Error("Arquivo inválido.") } } catch (err) { console.error("[Backup] Erro importar:", err.message); alert("Erro ao importar: arquivo inválido."); event.target.value = null } }; r.readAsText(a) }

            // ----------------------------------------------------
            // FUNÇÕES DE AÇÃO PRINCIPAIS
            // ----------------------------------------------------
            const DELAY_ABRIR_MENU = 700; const DELAY_ABRIR_SUBMENU = 500; const DELAY_FECHAR_MENU = 200;

            // ======================================================
            // MODAL DE CONFIRMAÇÃO GENÉRICO (ATUALIZADO V49.1)
            // ======================================================

            function exibirModalConfirmacao(statusNome, callbackFuncao) {
                removerModalConfirmacao();
                console.log(`[AÇÃO V49.2] Exibindo confirmação customizada para '${statusNome}'...`);

                const cId = 'pausa-script-confirm-modal';
                const dialog = document.createElement('div');
                dialog.id = cId;
                dialog.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            width: 320px; background-color: rgba(20, 30, 45, 0.95); color: #FFFFFF;
            border: 2px solid #0FF; border-radius: 10px; padding: 20px;
            z-index: 2147483648; box-shadow: 0 0 25px rgba(0, 255, 255, 0.3), 0 5px 15px rgba(0, 0, 0, 0.6);
            font-family: 'Segoe UI', Tahoma, sans-serif; backdrop-filter: blur(8px); box-sizing: border-box;
        `;

                dialog.innerHTML = `
            <style>
                #${cId} h4 { color: #0FF; margin: 0 0 10px 0; font-size: 18px; text-shadow: 0 0 5px #0FF; }
                #${cId} p { margin: 0 0 20px 0; font-size: 14px; line-height: 1.5; }
                #${cId} strong { color: #f1fa8c; }
                #${cId} .confirm-buttons { display: flex; justify-content: space-between; gap: 10px; }
                #${cId} .confirm-btn {
                    flex-grow: 1; padding: 10px; border: none; border-radius: 6px; cursor: pointer;
                    font-size: 14px; font-weight: 700; transition: all .2s;
                }
                #${cId} #btn-confirm-permitir { /*bg-removido*/; color: white; }
                #${cId} #btn-confirm-permitir:hover { filter: brightness(1.15); }
                #${cId} #btn-confirm-cancelar { /*bg-removido*/; color: white; }
                #${cId} #btn-confirm-cancelar:hover { filter: brightness(1.15); }
            </style>
            <h4>🚨 Alerta de Automação</h4>
            <p>O script agendado quer alterar seu status para <strong>${statusNome}</strong>. Deseja permitir?</p>
            <div class="confirm-buttons purecloud-script-button">
                <button id="btn-confirm-cancelar" class="confirm-btn purecloud-script-button">Cancelar</button>
                <button id="btn-confirm-permitir" class="confirm-btn purecloud-script-button">Permitir</button>
            </div>
        `;

                document.body.appendChild(dialog);

                // --- INÍCIO DA CORREÇÃO V49.1 ---
                document.getElementById('btn-confirm-permitir').onclick = () => {
                    console.log(`[AÇÃO V49.2] Permissão concedida (custom) para '${statusNome}'.`);

                    // 1. Remove o modal PRIMEIRO.
                    removerModalConfirmacao();

                    // 2. Espera a UI estabilizar e DEPOIS executa a lógica de clique.
                    setTimeout(() => {
                        if (callbackFuncao) callbackFuncao();
                    }, 150); // 150ms de delay
                };
                // --- FIM DA CORREÇÃO V49.1 ---

                document.getElementById('btn-confirm-cancelar').onclick = () => {
                    console.warn(`[AÇÃO V49.2] Ação '${statusNome}' automática CANCELADA (custom).`);
                    removerModalConfirmacao();
                };

                const autoCloseTime = 30000;
                confirmModalTimeout = setTimeout(() => {
                    console.warn(`[AÇÃO V49.2] Confirmação '${statusNome}' expirou (sem resposta em ${autoCloseTime / 1000}s).`);
                    removerModalConfirmacao();
                }, autoCloseTime);
            }

            function removerModalConfirmacao() {
                if (confirmModalTimeout) {
                    clearTimeout(confirmModalTimeout);
                    confirmModalTimeout = null;
                }
                const dialog = document.getElementById('pausa-script-confirm-modal');
                if (dialog) {
                    dialog.remove();
                }
            }

            // ======================================================
            // FUNÇÕES DE LÓGICA DE CLIQUE (V46.3)
            // ======================================================

            const normalizarPresenca = texto => String(texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/\s+/g, ' ').toLowerCase();
            const visivelPresenca = el => el && el.getClientRects().length > 0;
            function procurarPresenca(nome, seletorLegado) {
                const alvo = normalizarPresenca(nome);
                const radios = [...document.querySelectorAll('input.presence-input, input[name="presence-selector"]')];
                const radio = radios.find(el => normalizarPresenca(el.value) === alvo && visivelPresenca(el.closest('gux-form-field-radio') || el));
                if (radio) return radio;
                if (seletorLegado) {
                    const antigo = [...document.querySelectorAll(seletorLegado)].find(visivelPresenca);
                    if (antigo) return antigo;
                }
                const label = [...document.querySelectorAll(SELECTORES.STATUS_LABEL_TEXT)].find(el => normalizarPresenca(el.textContent) === alvo && visivelPresenca(el));
                return label?.closest('button') || null;
            }
            function clicarPresenca(controle) {
                if (controle.disabled || controle.getAttribute('aria-disabled') === 'true') throw new Error('Status indisponível na plataforma.');
                // Genesys attaches navigation/selection to the slotted label, not input.click().
                const label = controle.closest('gux-form-field-radio')?.querySelector('label[slot="label"]');
                const alvo = label || controle;
                alvo.dispatchEvent(new PointerEvent('pointerdown', {bubbles:true, composed:true, pointerType:'mouse'}));
                for (const tipo of ['mousedown', 'mouseup']) {
                    alvo.dispatchEvent(new MouseEvent(tipo, {bubbles:true, composed:true, button:0}));
                }
                alvo.click();
            }
            function statusConfirmado(nome) {
                const label = document.querySelector(SELECTORES.MENU_STATUS_TOGGLE)?.getAttribute('aria-label') || '';
                return normalizarPresenca(label.split(',').pop()) === normalizarPresenca(nome);
            }
            async function aguardarPresenca(encontrar) {
                for (let tentativa = 0; tentativa < 30; tentativa++) {
                    const elemento = encontrar();
                    if (elemento) return elemento;
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                throw new Error('O controle de status não apareceu na plataforma.');
            }
            async function abrirMenuPresenca(nome, seletor) {
                if (procurarPresenca(nome, seletor)) return;
                const toggle = document.querySelector(SELECTORES.MENU_STATUS_TOGGLE);
                if (!toggle) throw new Error('Menu de usuário não encontrado.');
                if (toggle.getAttribute('aria-expanded') !== 'true') toggle.click();
                const entrada = await aguardarPresenca(() => procurarPresenca(nome, seletor) || document.querySelector('#presence-button'));
                if (entrada.id === 'presence-button') entrada.click();
            }
            let mudandoPresenca = false;
            async function executarMudancaPresenca(categoria, item, nomePausa, seletor) {
                if (mudandoPresenca) return;
                mudandoPresenca = true;
                try {
                    if (!procurarPresenca(item || categoria, seletor)) await abrirMenuPresenca(categoria, seletor);
                    let destino = procurarPresenca(item || categoria, seletor);
                    if (!destino && item) {
                        const principal = await aguardarPresenca(() => procurarPresenca(categoria));
                        clicarPresenca(principal);
                    }
                    destino = await aguardarPresenca(() => procurarPresenca(item || categoria, seletor));
                    clicarPresenca(destino);
                    await aguardarPresenca(() => statusConfirmado(item || categoria));
                    registrarPausa(nomePausa);
                } catch (error) {
                    console.warn('[Gerenciador] ' + nomePausa, error);
                    window.AjaModularNotice?.('Não foi possível selecionar ' + nomePausa + ': ' + error.message, 'error');
                } finally { mudandoPresenca = false; }
            }
            function executarLogicaMenuSimples(seletorBotao, nomePausa, isAutomatico = false) {
                return executarMudancaPresenca(nomePausa, null, nomePausa, seletorBotao);
            }
            function executarLogicaSubMenu(categoria, item, nomePausa, isAutomatico = false) {
                return executarMudancaPresenca(categoria, item, nomePausa);
            }

            // --- Lógica "Na Fila" ---
            function executarLogicaNaFila(isAutomatico = false) {
                try {
                    const guxToggle = document.querySelector(SELECTORES.NA_FILA_TOGGLE_HOST);
                    const clickableSlider = guxToggle?.shadowRoot?.querySelector('div[role="checkbox"]');
                    if (clickableSlider) {
                        const jaEstaNaFila = clickableSlider.getAttribute('aria-checked') === 'true';
                        if (!jaEstaNaFila) clickableSlider.click();
                        console.log(jaEstaNaFila ? "[AÇÃO] O agente já está na fila." : "[AÇÃO] Controle 'Na Fila' ativado.");
                        return true;
                    }

                    const elDireto = document.querySelector(SELECTORES.NA_FILA_DIRETO);
                    if (elDireto && elDireto.getClientRects().length) {
                        elDireto.click();
                        console.log("[AÇÃO] Botão direto 'Entrar na fila' acionado.");
                        return true;
                    }
                } catch (e) {
                    console.error("[AÇÃO] Erro ao ativar 'Na Fila':", e);
                }
                console.warn("[AÇÃO] Controle 'Na Fila' não encontrado.");
                window.AjaModularNotice?.("Não encontrei o controle Na Fila da plataforma.", "error");
                return false;
            }

            // --- Lógica Ações Antigas ---
            function executarLogicaRefeicao(isAutomatico = false) { executarLogicaMenuSimples(SELECTORES.REFEICAO, 'Refeição', isAutomatico); }
            function executarLogicaDisponivel(isAutomatico = false) { executarLogicaMenuSimples(SELECTORES.DISPONIVEL, 'Disponível', isAutomatico); }
            function executarLogicaTreinamento(isAutomatico = false) { executarLogicaMenuSimples(SELECTORES.TREINAMENTO, 'Treinamento', isAutomatico); }
            function executarLogicaReuniao(isAutomatico = false) { executarLogicaMenuSimples(SELECTORES.REUNIAO, 'Reunião', isAutomatico); }
            // ATUALIZADA V48.8
            function executarLogicaDescanso(isAutomatico = false) { executarLogicaSubMenu("Intervalo", "Pausa auricular", "Pausa auricular", isAutomatico); }
            function executarLogicaPausaOut(isAutomatico = false) { executarLogicaSubMenu("Ocupado", "Pausa out", "Pausa out", isAutomatico); }

            // --- Lógica Ações NOVAS (V48.0) ---
            function executarLogicaBackoffice(isAutomatico = false) { executarLogicaSubMenu("Ocupado", "Atividade backoffice", "Backoffice", isAutomatico); }
            function executarLogicaFeedback(isAutomatico = false) { executarLogicaSubMenu("Ocupado", "Feedback", "Feedback", isAutomatico); }
            function executarLogicaParticular(isAutomatico = false) { executarLogicaSubMenu("Ausente", "Particular", "Particular", isAutomatico); }
            function executarLogicaQuestoesSaude(isAutomatico = false) { executarLogicaSubMenu("Ausente", "Questões de saúde", "Saúde", isAutomatico); }

            // --- Lógica Logoff (ATUALIZADA V48.3) ---
            function executarLogicaLogoff(isAutomatico = false) {
                if (!isAutomatico && !confirm("Tem certeza que deseja fazer logoff?\nO histórico será zerado.")) {
                    console.log("[AÇÃO] Logoff manual cancelado.");
                    return;
                }

                if (document.querySelector(SELECTORES.MENU_STATUS_TOGGLE)?.getAttribute('aria-expanded') === 'true' || clicarElemento(SELECTORES.MENU_STATUS_TOGGLE)) {
                    setTimeout(() => {
                        // CORREÇÃO V48.3: Usa o seletor de texto correto
                        if (clicarElemento('[data-testid="user-setting-logout-button"]') || clicarElemento(SELECTORES.LOGOFF, "Fazer logoff")) {
                            historicoPausas = [];
                            estadoAtual = { tipo: 'Logoff', inicio: new Date, ativa: !1 };
                            atualizarUI(); renderizarHistoricoLog(); renderizarEstatisticas();
                            if (isAgendamentoAtivo) toggleAgendamento();
                            console.log("[AÇÃO] Logoff iniciado.");
                        } else {
                            console.warn("Botão 'Logoff' não encontrado.");
                            clicarElemento(SELECTORES.MENU_STATUS_TOGGLE);
                        }
                    }, DELAY_ABRIR_MENU);
                }
            }

            // ======================================================
            // FUNÇÕES ORQUESTRADORAS (V46.3)
            // ======================================================

            function iniciarNaFila(isAutomatico = false) {
                const status = "Na fila";
                if (isAutomatico) {
                    exibirModalConfirmacao(status, () => {
                        if (executarLogicaNaFila(true)) registrarPausa(status);
                    });
                } else {
                    if (executarLogicaNaFila(false)) registrarPausa(status);
                }
            }

            function iniciarRefeicao(isAutomatico = false) {
                const status = "Refeição";
                if (isAutomatico) {
                    exibirModalConfirmacao(status, () => {
                        executarLogicaRefeicao(true);
                    });
                } else {
                    executarLogicaRefeicao(false);
                }
            }

            function voltarDisponivel(isAutomatico = false) {
                const status = "Disponível";
                if (isAutomatico) {
                    exibirModalConfirmacao(status, () => {
                        executarLogicaDisponivel(true);
                    });
                } else {
                    executarLogicaDisponivel(false);
                }
            }

            function iniciarTreinamento(isAutomatico = false) {
                const status = "Treinamento";
                if (isAutomatico) {
                    exibirModalConfirmacao(status, () => {
                        executarLogicaTreinamento(true);
                    });
                } else {
                    executarLogicaTreinamento(false);
                }
            }

            function iniciarReuniao(isAutomatico = false) {
                const status = "Reunião";
                if (isAutomatico) {
                    exibirModalConfirmacao(status, () => {
                        executarLogicaReuniao(true);
                    });
                } else {
                    executarLogicaReuniao(false);
                }
            }

            // ATUALIZADA V48.8
            function iniciarDescanso(isAutomatico = false) {
                const status = "Pausa auricular"; // <-- MUDANÇA V48.8
                if (isAutomatico) {
                    exibirModalConfirmacao(status, () => {
                        executarLogicaDescanso(true);
                    });
                } else {
                    executarLogicaDescanso(false);
                }
            }

            function iniciarPausaOut(isAutomatico = false) {
                const status = "Pausa out";
                if (isAutomatico) {
                    exibirModalConfirmacao(status, () => {
                        executarLogicaPausaOut(true);
                    });
                } else {
                    executarLogicaPausaOut(false);
                }
            }

            // --- NOVAS Orquestradoras (V48.0) ---

            function iniciarBackoffice(isAutomatico = false) {
                const status = "Backoffice";
                if (isAutomatico) {
                    exibirModalConfirmacao(status, () => {
                        executarLogicaBackoffice(true);
                    });
                } else {
                    executarLogicaBackoffice(false);
                }
            }

            function iniciarFeedback(isAutomatico = false) {
                const status = "Feedback";
                if (isAutomatico) {
                    exibirModalConfirmacao(status, () => {
                        executarLogicaFeedback(true);
                    });
                } else {
                    executarLogicaFeedback(false);
                }
            }

            function iniciarParticular(isAutomatico = false) {
                const status = "Particular";
                if (isAutomatico) {
                    exibirModalConfirmacao(status, () => {
                        executarLogicaParticular(true);
                    });
                } else {
                    executarLogicaParticular(false);
                }
            }

            function iniciarQuestoesSaude(isAutomatico = false) {
                const status = "Saúde";
                if (isAutomatico) {
                    exibirModalConfirmacao(status, () => {
                        executarLogicaQuestoesSaude(true);
                    });
                } else {
                    executarLogicaQuestoesSaude(false);
                }
            }

            // --- Logoff (Especial) ---
            function realizarLogoff(isAutomatico = false) {
                if (isAutomatico) {
                    exibirModalConfirmacao("Logoff", () => {
                        executarLogicaLogoff(true);
                    });
                } else {
                    executarLogicaLogoff(false);
                }
            }


            // ----------------------------------------------------
            // FUNÇÕES DE VISIBILIDADE, ARRASTE E UI
            // ----------------------------------------------------

            let dragStartX = 0, dragStartY = 0, previousUserSelect = '', previousDragTransition = '';
            function dragMouseDown(e) {
                if(e.button !== 0 || e.target.closest('button, input, textarea, select, a, [id^="btn-"], #config-btn-theme')) return;
                const panel=e.target.closest('#pausa-script-container, #pausa-script-config-container');
                if(!panel || !e.target.closest('#pausa-script-header, #pausa-script-config-header, #pausa-script-icone')) return;
                const rect=panel.getBoundingClientRect();
                dragElement=panel; isDragging=false; dragStartX=e.clientX; dragStartY=e.clientY;
                offsetX=e.clientX-rect.left;offsetY=e.clientY-rect.top;
                previousUserSelect=document.body.style.userSelect;previousDragTransition=panel.style.transition;
                document.addEventListener('mousemove',elementDrag);
                document.addEventListener('mouseup',closeDragElement);
                window.addEventListener('blur',closeDragElement);
            }
            function elementDrag(e) {
                if(!dragElement) return;
                if(!isDragging && Math.hypot(e.clientX-dragStartX,e.clientY-dragStartY)<5) return;
                isDragging=true;dragElement.style.transition='none';e.preventDefault();document.body.style.userSelect='none';
                const pos=window.AjaModular.get('relogio').clampPosition(e.clientX-offsetX,e.clientY-offsetY,dragElement.offsetWidth,dragElement.offsetHeight,window.innerWidth,window.innerHeight);
                dragElement.style.left=pos.left+'px';dragElement.style.top=pos.top+'px';
                dragElement.style.right='auto';dragElement.style.bottom='auto';dragElement.style.cursor='grabbing';
            }
            function closeDragElement() {
                document.removeEventListener('mousemove',elementDrag);
                document.removeEventListener('mouseup',closeDragElement);
                window.removeEventListener('blur',closeDragElement);
                document.body.style.userSelect=previousUserSelect;
                if(dragElement) {
                    if(isDragging) salvarPosicaoPainelLocalStorage(dragElement.id==='pausa-script-container'?STORAGE_KEY_POS_MAIN:STORAGE_KEY_POS_CONFIG,dragElement);
                    dragElement.style.cursor='';dragElement.style.transition=previousDragTransition;
                }
                dragElement=null;
                setTimeout(()=>{isDragging=false;},50);
            }

            // ATUALIZADA V47.0
            function toggleVisibilidade() {
                const c = document.getElementById('pausa-script-container'), o = document.getElementById('pausa-script-conteudo'), i = document.getElementById('pausa-script-icone');
                if (!c || !o || !i) { console.error("UI Principal não encontrada."); return }
                const m = 15;
                if (o.style.display !== 'none') {
                    // --- MINIMIZAR ---
                    o.style.display = 'none';
                    i.style.display = 'flex';
                    c.style.width = 'auto';
                    c.style.height = 'auto';
                    c.style.cursor = 'grab';
                } else {
                    // --- MAXIMIZAR ---
                    o.style.display = 'block';
                    i.style.display = 'none';
                    c.style.width = 'auto';
                    c.style.height = 'auto';
                    c.style.cursor = 'default';

                    const h = c.querySelector('#pausa-script-header');
                    if (h) h.style.cursor = 'move';

                    window.AjaModular.get('relogio').keepOnScreen(c);

                }
            }

            function toggleVisibilidadeConfig() { const c = document.getElementById('pausa-script-config-container'); if (!c) { console.error("UI Config não encontrada."); return } isConfigPainelAberto = !isConfigPainelAberto; c.style.display = isConfigPainelAberto ? 'block' : 'none'; if (isConfigPainelAberto) { renderizarAgendamentos(); renderizarHistoricoLog(); renderizarEstatisticas(); window.AjaModular.get('relogio').keepOnScreen(c); } }
            function renderizarAgendamentos() { const l = document.getElementById('agendamento-lista'); if (!l) return; l.innerHTML = ''; if (PAUSAS_AGENDADAS.length === 0) { l.innerHTML = '<p style="color:#999;margin:5px 0;font-size:11px;text-align:center;">Nenhum horário agendado.</p>' } else { const r = document.createDocumentFragment(); PAUSAS_AGENDADAS.forEach((p, idx) => { const i = document.createElement('div'); i.style.cssText = `display:flex;justify-content:space-between;align-items:center;border-bottom:1px dashed #ffffff15;padding:4px 2px;font-size:11px;`; const tD = document.createElement('div'); tD.style.flexGrow = '1'; tD.innerHTML = `<strong>${p.hora}</strong>: ${p.status}`; const bD = document.createElement('div'); bD.style.flexShrink = '0'; bD.style.marginLeft = '10px'; const bE = document.createElement('button'); bE.innerHTML = '✏️'; bE.title = `Editar ${p.hora} - ${p.status}`; bE.style.cssText = `background:0 0;border:none;color:#ffc107;cursor:pointer;font-size:14px;padding:0 4px;opacity:.7;transition:opacity .2s;`; bE.onmouseover = function () { this.style.opacity = '1' }; bE.onmouseout = function () { this.style.opacity = '.7' }; bE.onclick = () => carregarHorarioParaEdicao(idx); const bR = document.createElement('button'); bR.innerHTML = '❌'; bR.title = `Remover ${p.hora} - ${p.status}`; bR.style.cssText = `background:0 0;border:none;color:#ff6b6b;cursor:pointer;font-size:14px;padding:0 4px;margin-left:5px;opacity:.7;transition:opacity .2s;`; bR.onmouseover = function () { this.style.opacity = '1' }; bE.onmouseout = function () { this.style.opacity = '.7' }; bR.onclick = () => removerHorario(idx); bD.appendChild(bE); bD.appendChild(bR); i.appendChild(tD); i.appendChild(bD); r.appendChild(i) }); l.appendChild(r) } }
            function renderizarHistoricoLog() { const l = document.getElementById('historico-log'); if (!l) return; l.innerHTML = ''; if (historicoPausas.length === 0) { l.innerHTML = '<p style="color:#999;margin:5px 0;font-size:11px;">Nenhum registro.</p>'; return } const f = document.createDocumentFragment(); historicoPausas.slice().reverse().forEach(p => { const i = document.createElement('div'); i.style.cssText = `border-bottom:1px dashed #ffffff15;padding:4px 0;font-size:11px;line-height:1.4;`; i.innerHTML = `<strong>${p.tipo}</strong>: ${p.inicio} às ${p.fim} <span style="color:#00b0ff;">(Dur: ${p.duracao})</span>`; f.appendChild(i) }); l.appendChild(f); }
            function renderizarEstatisticas() { const s = document.getElementById('estatisticas-pausas'); if (!s) return; s.innerHTML = ''; if (historicoPausas.length === 0) { s.innerHTML = '<p style="color:#999;font-style:italic;margin:5px 0;font-size:11px;">Sem estatísticas.</p>'; return } const r = {}; historicoPausas.forEach(p => { const t = p.tipo; if (!r[t]) r[t] = { c: 0, s: 0 }; r[t].c++; r[t].s += converterDuracaoParaSegundos(p.duracao) }); const d = document.createElement('details'); d.style.marginTop = '10px'; d.open = !0; const m = document.createElement('summary'); m.style.cssText = 'cursor:pointer;color:#00b0ff;font-weight:700;margin-bottom:5px;'; m.textContent = 'Estatísticas'; d.appendChild(m); const c = document.createElement('div'); c.style.cssText = `/*bg-removido*/;padding:8px;border-radius:8px;font-size:11px;`; const f = document.createDocumentFragment(); const k = Object.keys(r).sort(); k.forEach((t, x) => { const o = r[t]; const u = formatarDuracao(o.s); const i = document.createElement('div'); i.style.cssText = `display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px dashed #ffffff15;line-height:1.4;`; if (x === k.length - 1) i.style.borderBottom = 'none'; i.innerHTML = `<strong>${t} (x${o.c})</strong> <span style="color:#00b0ff;">${u}</span>`; f.appendChild(i) }); c.appendChild(f); d.appendChild(c); s.appendChild(d); }
            function criarUIRelogio() { /* Removido V44.0 */ }
            function verificarSeletoresEAtualizarUI() { const rD = document.getElementById('seletores-resultados'); if (!rD) { console.error("Div resultados não encontrado."); return } console.log("[Diagnóstico V49.2] Verificando..."); rD.innerHTML = '<p style="font-style:italic;color:#bbb;">Verificando...</p>'; let hR = '<ul style="list-style:none;padding:0;margin:5px 0 0 0;font-size:11px;">', tO = !0; setTimeout(() => { Object.keys(SELECTORES).forEach(k => { const s = SELECTORES[k]; if (k === 'CLOCK_CONTAINER_PARENT') return; const e = document.querySelector(s); const f = e !== null && (e.offsetParent !== null || e.tagName === 'DIV' || e.tagName === 'SPAN'); hR += `<li style="padding:3px 0;border-bottom:1px dashed #ffffff15;display:flex;justify-content:space-between;align-items:center;"><span style="color:#ccc; max-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${k}">${k}:</span><span><code style="font-size:10px;background-color:rgba(0,255,255,.1);border:1px solid rgba(0,255,255,.2);color:#9fefef;padding:1px 3px;border-radius:3px; max-width: 120px; display: inline-block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${s}">${s}</code><span style="margin-left:8px;font-weight:700;color:${f ? '#50fa7b' : '#ff5555'};">${f ? '✔️ Ok' : '❌ Falha'}</span></span></li>`; if (!f) { tO = !1; console.warn(`[Diagnóstico V49.2] Falha ${k}: ${s}`) } }); hR += '</ul>'; if (tO) { hR = '<p style="color:#50fa7b;font-weight:700;margin:5px 0;">✔️ Todos OK!</p>' + hR; console.log("[Diagnóstico V49.2] OK.") } else { hR = '<p style="color:#ff5555;font-weight:700;margin:5px 0;">❌ Atenção: Falha em um ou mais seletores!</p>' + hR; console.warn("[Diagnóstico V49.2] Falha(s) encontrada(s).") } rD.innerHTML = hR }, 50) }

            // --- CRIAR UI PRINCIPAL (ATUALIZADA V49.2 - MERGE) ---
            function criarUI() {
                const cId = 'pausa-script-container'; let cA = document.getElementById(cId); if (cA) cA.remove(); const c = document.createElement('div'); c.id = cId; document.body.appendChild(c);

                const pS = carregarPosicaoPainelLocalStorage(STORAGE_KEY_POS_MAIN);
                let cssPos = `position:fixed; ${pS ? (pS.top ? `top:${pS.top};left:${pS.left};` : `bottom:${pS.bottom};right:${pS.right};`) : 'bottom:30px;right:30px;'}`;

                c.style.cssText = `${cssPos} 
            width: auto; height: auto; 
            color: var(--ger-text-primary, #f8fafc);
            font-family: 'Segoe UI', Roboto, Helvetica, sans-serif;
            padding: 0;
            border-radius: 16px; 
            border: 1px solid var(--ger-border, #334155); 
            background: var(--ger-bg-primary, #0f172a); 
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
            z-index: 2147483647; 
            cursor: grab; user-select: none; 
            transition: all .2s ease-out; 
            box-sizing: border-box;`;

                c.onmouseenter = (e) => { if (document.getElementById('pausa-script-conteudo').style.display !== 'none') c.style.background = 'var(--ger-bg-hover, #1e293b)' };
                c.onmouseleave = () => { if (document.getElementById('pausa-script-conteudo').style.display !== 'none') c.style.background = 'var(--ger-bg-primary, #0f172a)' };

                const savedTheme = ctx.ajaStorage.getItem('GERENCIADOR_THEME');
                if (savedTheme === 'light') c.classList.add('local-light-mode');
                else c.classList.add('cc-escurinho');

                // ======================================
                // INÍCIO: ESTILOS (V49.0 - DASHBOARD SYNC)
                // ======================================
                c.innerHTML = `<style>
            #${cId}.cc-escurinho {
                --ger-bg-primary: #0f172a;
                --ger-bg-hover: #1e293b;
                --ger-border: #334155;
                --ger-text-primary: #f8fafc;
                --ger-header-bg: #0284c7;
                --ger-header-text: #ffffff;
            }
            #${cId}.local-light-mode {
                --ger-bg-primary: #ffffff;
                --ger-bg-hover: #f1f5f9;
                --ger-border: #cbd5e1;
                --ger-text-primary: #0f172a;
                --ger-header-bg: #0284c7;
                --ger-header-text: #ffffff;
            }
            #${cId} * { box-sizing: border-box; }
            #${cId} .script-btn {
                display: flex; align-items: center; justify-content: center; 
                gap: 6px; padding: 10px 8px; border: none;
                border-radius: 8px; cursor: pointer;
                font-size: 12.5px; font-weight: 600; color: #FFFFFF;
                text-shadow: 0 1px 2px rgba(0,0,0,0.3);
                background-image: none; 
                box-shadow: 0 3px 5px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.1); 
                transition: all 0.15s ease-out;
                width: 100%;
                white-space: nowrap;
            }
            #${cId} .script-btn:hover {
                filter: brightness(1.1);
                transform: translateY(-2px); 
                box-shadow: 0 5px 12px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.1);
            }
            #${cId} .script-btn:active {
                transform: translateY(1px); 
                filter: brightness(0.95);
                box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3); 
            }
            #${cId} #btn-disponivel, #${cId} #btn-toggle-agendamento[style*="background: linear-gradient(135deg, rgb(35, 167, 69)"] { background: linear-gradient(135deg, #23a745, #2dc24f); }
            #${cId} #btn-toggle-agendamento[style*="background: linear-gradient(135deg, rgb(220, 53, 69)"] { background: linear-gradient(135deg, #dc3545, #e84a5f); }
            #${cId} #btn-pause-resume-agendamento[style*="background: linear-gradient(135deg, rgb(255, 193, 7)"] { background: linear-gradient(135deg, #ffc107, #ffd25a); color: #000; }
            #${cId} #btn-pause-resume-agendamento[style*="background: linear-gradient(135deg, rgb(0, 127, 255)"] { background: linear-gradient(135deg, #007FFF, #009cff); color: #fff; }
            #${cId} #btn-na-fila { background: linear-gradient(135deg, #0096C7, #00bfff); }
            #${cId} #btn-refeicao { background: linear-gradient(135deg, #fd7e14, #ff9a40); }
            #${cId} #btn-descanso { background: linear-gradient(135deg, #ffc107, #ffd25a); color: #000; }
            #${cId} #btn-pausa-out { background: linear-gradient(135deg, #e63946, #f45b69); }
            #${cId} #btn-treinamento { background: linear-gradient(135deg, #6a00c9, #8e2de2); }
            #${cId} #btn-backoffice { background: linear-gradient(135deg, #c94b4b, #d46a6a); }
            #${cId} #btn-feedback { background: linear-gradient(135deg, #e85d04, #fa7e30); }
            #${cId} #btn-particular { background: linear-gradient(135deg, #8338ec, #9f60f0); }
            #${cId} #btn-saude { background: linear-gradient(135deg, #5e60ce, #7b7de0); }
            #${cId} #btn-reuniao { background: linear-gradient(135deg, #00c9c9, #30dede); color: #000; }
            #${cId} #btn-logoff { background: linear-gradient(135deg, #6c757d, #868e96); }
            #${cId} .automation-controls { display: flex; gap: 8px; }
            #${cId} .automation-controls .script-btn {
                width: auto; flex-grow: 1;
                font-size: 13px;
                justify-content: center;
                padding: 10px 8px;
            }
            #${cId} #pausa-script-header {
                display: flex; justify-content: space-between; align-items: center;
                margin: 0; padding: 12px 14px;
                background-color: var(--ger-header-bg, #0284c7);
                border-radius: 15px 15px 0 0;
                cursor: move;
            }
            #${cId} #pausa-script-header h3 {
                color: var(--ger-header-text, #ffffff); text-shadow: none;
                margin: 0; font-size: 14px; font-weight: 600;
            }
            #${cId} #pausa-script-header-clock { color: var(--ger-header-text, #ffffff) !important; text-shadow: none !important; }
            #${cId} #status-display { color: var(--ger-text-primary, #FFF); }
            #${cId} #pausa-script-header span { transition: color .2s; }
            #${cId} #pausa-script-header span#btn-abrir-config, #${cId} #pausa-script-header span#btn-tema-gerenciador { cursor: pointer; color: var(--ger-header-text, #ffffff); font-size: 16px; opacity: 0.8; }
            #${cId} #pausa-script-header span#btn-abrir-config:hover, #${cId} #pausa-script-header span#btn-tema-gerenciador:hover { opacity: 1; }
            #${cId} #pausa-script-header span#btn-minimizar { cursor: pointer; color: var(--ger-header-text, #ffffff); opacity: 0.9; font-size: 16px; font-weight: 700; margin-left: 4px; }
            #${cId} #pausa-script-header span#btn-minimizar:hover { color: #ff8080; opacity: 1; }
            #${cId} #status-display {
                background-color: rgba(0, 0, 0, 0.2);
                border: 1px solid rgba(0, 0, 0, 0.3);
                box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.4);
                color: #FFF;
                padding: 10px; border-radius: 8px;
                margin-bottom: 15px; text-align: center;
                font-size: 14px;
            }
            #${cId} #current-status { font-weight: 700; }
            #${cId} #current-status[style*="rgb(80, 250, 123)"] { color: #50fa7b; }
            #${cId} #current-status[style*="rgb(241, 250, 140)"] { color: #f1fa8c; }
            #${cId} #pausa-script-icone {
                display: flex; align-items: center; justify-content: center;
                width: 100%; height: 100%; cursor: grab;
            }
            #${cId} #top-bar-time {
                font-size: 1.5em;
                font-weight: 700; white-space: nowrap;
                color: #0FF;
                text-shadow: 0 0 5px rgba(0, 255, 255, 0.5);
            }
            #${cId} #pausa-script-clock-dot {
                width: 8px; height: 8px;
                /*bg-removido*/;
                border-radius: 50%;
                margin-right: 8px;
                box-shadow: 0 0 5px #f1fa8c, 0 0 10px #f1fa8c;
                animation: blink-animation 1.5s infinite ease-in-out;
            }
            #${cId} #pausa-script-clock-dot.status-ok {
                /*bg-removido*/;
                box-shadow: 0 0 5px #50fa7b, 0 0 10px #50fa7b;
            }
            @keyframes blink-animation {
                0% { opacity: 1; }
                50% { opacity: 0.3; }
                100% { opacity: 1; }
            }
            </style>
        
            <div id="pausa-script-icone" style="display:flex; padding: 10px 14px;">
                 <span id="pausa-script-clock-dot" style="display: none;"></span> 
                 <span id="top-bar-time">--:--:--</span>
            </div>
            
            <div id="pausa-script-conteudo" style="display:none; padding:0; min-width: 320px;">
                
                <div id="pausa-script-header">
                    <h3 style="font-size: 14px; margin: 0; white-space: nowrap;">🛠️ Gerenciador</h3>
                    
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span id="pausa-script-header-clock" style="
                            font-size: 13px; 
                            font-family: 'Courier New', Courier, monospace; 
                            color: #f1fa8c; 
                            text-shadow: 0 0 5px rgba(241, 250, 140, 0.5);
                            line-height: 1;
                        ">--:--:--</span>
                        
                        <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
                            <span id="btn-tema-gerenciador" title="Mudar Tema" style="cursor: pointer; font-size: 16px;">${ctx.ajaStorage.getItem('GERENCIADOR_THEME') === 'light' ? '☀️' : '🌗'}</span>
                            <span id="btn-abrir-config" title="Configurações">⚙️</span>
                            <span id="btn-minimizar" title="Fechar Painel">[X]</span>
                        </div>
                    </div>
                </div>
                <div style="padding: 14px;">
                    <div id="status-display">Status: <strong id="current-status" style="color:#50fa7b;">${estadoAtual.tipo}</strong></div>
                    
                    <div class="automation-controls" style="margin-bottom:15px; text-align:center;">
                    <button id="btn-toggle-agendamento" class="script-btn" style="flex-basis:65%;">Ligar Automação</button>
                    <button id="btn-pause-resume-agendamento" class="script-btn" style="display:none;flex-basis:35%;">Pausar ⏸️</button>
                </div>
                
                <div id="buttons-container" style="display:grid;grid-template-columns:repeat(2, 1fr);gap:10px;margin-bottom:10px;">
                    <button id="btn-disponivel" class="script-btn purecloud-script-button">🟢 Disponível</button>
                    <button id="btn-na-fila" class="script-btn purecloud-script-button">🎧 Na Fila</button>
                    <button id="btn-refeicao" class="script-btn purecloud-script-button">🍔 Refeição</button>
                    <button id="btn-descanso" class="script-btn purecloud-script-button">☕ Pausa auricular</button>
                    <button id="btn-pausa-out" class="script-btn purecloud-script-button">⛔ Pausa Out</button>
                    <button id="btn-treinamento" class="script-btn purecloud-script-button">📚 Treinamento</button>
                    <button id="btn-backoffice" class="script-btn purecloud-script-button">📁 Backoffice</button>
                    <button id="btn-feedback" class="script-btn purecloud-script-button">📝 Feedback</button>
                    <button id="btn-particular" class="script-btn purecloud-script-button">🔒 Particular</button>
                    <button id="btn-saude" class="script-btn purecloud-script-button">🩺 Saúde</button>
                </div>
                
                <div id="buttons-extra" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                    <button id="btn-reuniao" class="script-btn purecloud-script-button">🧑‍🤝‍🧑 Reunião</button>
                    <button id="btn-logoff" class="script-btn purecloud-script-button">🚪 Fazer Logoff</button>
                </div>
            </div>
        `;

                const header = c.querySelector('#pausa-script-header');
                const icone = c.querySelector('#pausa-script-icone');
                if (header) header.onmousedown = dragMouseDown;
                if (icone) icone.onmousedown = dragMouseDown;

                c.addEventListener('click', function (e) {
                    if (isDragging) { isDragging = false; return; }
                    const t = e.target.closest('button'), n = e.target.closest('span#btn-minimizar, span#btn-abrir-config, span#btn-tema-gerenciador'), o = e.target.closest('div#pausa-script-icone'); let l = t || n || o; if (!l) return;
                    const d = document.getElementById('pausa-script-conteudo');
                    if (o && d && d.style.display === 'none') { toggleVisibilidade(); return; }
                    const a = document.getElementById('pausa-script-header');
                    if (d.style.display !== 'none' && a && a.contains(e.target) && !n && !t) return;

                    const i = l.id; switch (i) {
                        case 'btn-na-fila': iniciarNaFila(false); break;
                        case 'btn-refeicao': iniciarRefeicao(false); break;
                        case 'btn-descanso': iniciarDescanso(false); break;
                        case 'btn-pausa-out': iniciarPausaOut(false); break;
                        case 'btn-disponivel': voltarDisponivel(false); break;
                        case 'btn-logoff': realizarLogoff(false); break;
                        case 'btn-treinamento': iniciarTreinamento(false); break;
                        case 'btn-reuniao': iniciarReuniao(false); break;
                        case 'btn-backoffice': iniciarBackoffice(false); break;
                        case 'btn-feedback': iniciarFeedback(false); break;
                        case 'btn-particular': iniciarParticular(false); break;
                        case 'btn-saude': iniciarQuestoesSaude(false); break;
                        case 'btn-toggle-agendamento': toggleAgendamento(); break;
                        case 'btn-pause-resume-agendamento': togglePausaAutomacao(); break;
                        case 'btn-minimizar': toggleVisibilidade(); break;
                        case 'btn-abrir-config': toggleVisibilidadeConfig(); break;
                        case 'btn-tema-gerenciador':
                            const isLight = c.classList.contains('local-light-mode');
                            const themeBtn = document.getElementById('btn-tema-gerenciador');
                            if (isLight) {
                                c.classList.remove('local-light-mode');
                                c.classList.add('cc-escurinho');
                                ctx.ajaStorage.setItem('GERENCIADOR_THEME', 'dark');
                                if (themeBtn) themeBtn.innerText = '🌗';
                            } else {
                                c.classList.remove('cc-escurinho');
                                c.classList.add('local-light-mode');
                                ctx.ajaStorage.setItem('GERENCIADOR_THEME', 'light');
                                if (themeBtn) themeBtn.innerText = '☀️';
                            }
                            break;
                    }
                });

                const bTg = c.querySelector('#btn-toggle-agendamento'), bP = c.querySelector('#btn-pause-resume-agendamento');
                if (bTg && bP) {
                    if (isAgendamentoAtivo) {
                        bTg.textContent = "Desligar Automação";
                        bTg.style.background = 'linear-gradient(135deg, #dc3545, #e84a5f)';
                        bP.style.display = 'inline-block';
                        if (isAutomacaoPausada) {
                            bP.textContent = "Retomar ▶️";
                            bP.style.background = 'linear-gradient(135deg, #007FFF, #009cff)';
                            bP.style.color = '#fff';
                        } else {
                            bP.textContent = "Pausar ⏸️";
                            bP.style.background = 'linear-gradient(135deg, #ffc107, #ffd25a)';
                            bP.style.color = '#000';
                        }
                    } else {
                        bTg.textContent = "Ligar Automação";
                        bTg.style.background = 'linear-gradient(135deg, #23a745, #2dc24f)';
                        bP.style.display = 'none';
                    }
                }

                registrarPausa(estadoAtual.tipo);
                adicionarAtalho();
                window.AjaModular.get('relogio').start(atualizarUI);
            }

            // --- CRIAR UI CONFIGURAÇÕES (ATUALIZADA REDESIGN) ---
            function criarUIConfiguracoes() {
                const cId = 'pausa-script-config-container'; let cA = document.getElementById(cId); if (cA) cA.remove(); const cC = document.createElement('div'); cC.id = cId; document.body.appendChild(cC); const pSC = carregarPosicaoPainelLocalStorage(STORAGE_KEY_POS_CONFIG);
                let cssPos = `position:fixed; ${pSC ? (pSC.top ? `top:${pSC.top};left:${pSC.left};` : `bottom:${pSC.bottom};right:${pSC.right};`) : 'bottom:30px;right:340px;'}`;

                // Injeta leitura de tema local
                const saveCfgTheme = ctx.ajaStorage.getItem('GERCONFIG_THEME');
                if (saveCfgTheme === 'light') cC.classList.add('local-light-mode');
                else cC.classList.add('cc-escurinho');

                cC.style.cssText = `${cssPos} 
            width:380px; 
            background: var(--gerconfig-bg, rgba(15, 23, 42, 0.95));
            color: var(--gerconfig-text, #f8fafc);
            border: 1px solid var(--gerconfig-border, #334155);
            border-radius:16px; padding:20px;
            z-index:2147483646;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
            font-family: 'Segoe UI', Roboto, Helvetica, sans-serif;
            font-size:13px; height:auto; max-height:calc(100vh - 60px);
            backdrop-filter: blur(12px);
            transition:all .3s ease-in-out; display:none; overflow-y:auto;
            box-sizing:border-box; cursor:default;`;

                // V48.0 -> Redesign UI CSS
                cC.innerHTML = `<style>
            #${cId}.cc-escurinho {
                --gerconfig-bg: #0f172a;
                --gerconfig-text: #f8fafc;
                --gerconfig-text-muted: #94a3b8;
                --gerconfig-border: #334155;
                --gerconfig-card-bg: #1e293b;
                --gerconfig-card-hover: #334155;
                --gerconfig-accent: #0ea5e9;
                --gerconfig-input-bg: #0f172a;
                --gerconfig-header-bg: #0284c7;
                --gerconfig-header-text: #ffffff;
            }
            #${cId}.local-light-mode {
                --gerconfig-bg: #ffffff;
                --gerconfig-text: #0f172a;
                --gerconfig-text-muted: #64748b;
                --gerconfig-border: #cbd5e1;
                --gerconfig-card-bg: #f8fafc;
                --gerconfig-card-hover: #f1f5f9;
                --gerconfig-accent: #0284c7;
                --gerconfig-input-bg: #ffffff;
                --gerconfig-header-bg: #0284c7;
                --gerconfig-header-text: #ffffff;
            }
            
            #${cId} * { box-sizing:border-box; }
            #${cId} ::-webkit-scrollbar { width: 6px; }
            #${cId} ::-webkit-scrollbar-thumb { background: var(--gerconfig-border); border-radius: 4px; }

            #${cId} .script-btn-config {
                padding: 10px 15px; border: none; border-radius: 8px; cursor: pointer;
                font-size: 13px; font-weight: 600; color: #fff;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1); 
                transition: all .2s ease; width: 100%; box-sizing: border-box;
            }
            #${cId} .script-btn-config:hover { filter: brightness(1.1); transform: translateY(-1px); box-shadow: 0 4px 8px rgba(0,0,0,0.15); }
            #${cId} .script-btn-config:active { transform: translateY(1px); filter: brightness(.95); box-shadow: none; }
            
            #${cId} details {
                margin-top: 12px;
                border: 1px solid var(--gerconfig-border);
                border-radius: 10px;
                background-color: var(--gerconfig-card-bg);
                overflow: hidden;
                transition: all 0.2s ease;
            }
            #${cId} details[open] {
                box-shadow: 0 4px 12px rgba(0,0,0,0.05);
            }
            #${cId} summary {
                padding: 12px 14px; cursor: pointer; color: var(--gerconfig-accent); font-weight: 600; font-size: 14px;
                list-style: none; display: flex; align-items: center; user-select: none;
                transition: background-color 0.2s ease;
            }
            #${cId} summary:hover { background-color: var(--gerconfig-card-hover); }
            #${cId} summary::-webkit-details-marker { display: none; }
            #${cId} summary::before {
                content: '›'; margin-right: 12px; font-size: 20px; line-height: 1; 
                transition: transform 0.2s ease; color: var(--gerconfig-text-muted); display: inline-block;
            }
            #${cId} details[open] > summary::before { transform: rotate(90deg); }
            #${cId} details > div {
                padding: 14px; border-top: 1px solid var(--gerconfig-border);
                background-color: var(--gerconfig-bg);
            }
            
            #${cId} .add-schedule-form { display: flex; gap: 8px; margin-top: 10px; align-items: center; }
            #${cId} .add-schedule-form input[type=time], #${cId} .add-schedule-form input[type=text] {
                background-color: var(--gerconfig-input-bg);
                border: 1px solid var(--gerconfig-border);
                color: var(--gerconfig-text); padding: 10px; border-radius: 8px; font-size: 13px;
                outline: none; transition: border-color .2s;
            }
            #${cId} .add-schedule-form input[type=time]:focus, #${cId} .add-schedule-form input[type=text]:focus { border-color: var(--gerconfig-accent); }
            #${cId} .add-schedule-form input[type=time] { flex-basis: 90px; flex-shrink: 0; }
            #${cId} .add-schedule-form input[type=text] { flex-grow: 1; min-width: 0; width: 100%; }
            #${cId} .add-schedule-form button { 
                flex-shrink: 0; padding: 10px 16px!important; font-size: 16px!important; font-weight: 700!important;
                width: auto!important; background: linear-gradient(135deg, #10b981, #059669) !important;
            }

            #${cId} #agendamento-lista {
                max-height: 160px; overflow-y: auto; margin-bottom: 15px; border-radius: 8px; 
                padding: 8px; background-color: var(--gerconfig-input-bg); border: 1px solid var(--gerconfig-border);
            }
            #${cId} #agendamento-lista div button { background: none; border: none; cursor: pointer; font-size: 15px; padding: 0 4px; margin-left: 5px; opacity: 0.7; transition: opacity .2s; }
            #${cId} #agendamento-lista div button:hover { opacity: 1; }
            #${cId} #agendamento-lista button[title*=Editar]{color:#f59e0b}
            #${cId} #agendamento-lista button[title*=Remover]{color:#ef4444}
            
            #${cId} #historico-log div, #${cId} #seletores-resultados li { border-bottom: 1px dashed var(--gerconfig-border) !important; padding: 6px 0 !important; }
            
            #${cId} #pausa-script-config-header {
                display:flex; justify-content:space-between; align-items:center;
                background-color: var(--gerconfig-header-bg); padding: 12px 20px;
                cursor:move; border-bottom: 1px solid var(--gerconfig-border);
            }
            #${cId} #pausa-script-config-header h3 { color: var(--gerconfig-header-text); margin: 0; font-size: 15px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
            #${cId} .panel-actions span { cursor: pointer; font-size: 16px; margin-left: 12px; transition: opacity 0.2s; color: var(--gerconfig-header-text); opacity: 0.8; }
            #${cId} .panel-actions span:hover { opacity: 1; }
            #${cId} #btn-fechar-config { font-weight: 700; margin-left: 14px!important; opacity: 0.9; }
            #${cId} #btn-fechar-config:hover { color: #ff8080; }
            
            #${cId} code { background-color: var(--gerconfig-border); color: var(--gerconfig-text); padding: 2px 5px; border-radius: 4px; font-size: 11px; }
            
            #${cId} .config-item { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 13.5px; }
            #${cId} .config-item label { color: var(--gerconfig-text); }
            #${cId} .config-item input[type=checkbox] { width: 18px; height: 18px; accent-color: var(--gerconfig-accent); cursor: pointer; }
            #${cId} .config-item input[type=number] {
                width: 60px; background-color: var(--gerconfig-input-bg); border: 1px solid var(--gerconfig-border);
                color: var(--gerconfig-text); padding: 6px 8px; border-radius: 6px; font-size: 13px; outline: none; text-align: center;
            }

            #${cId} #btn-exportar-config { background: linear-gradient(135deg, #3b82f6, #2563eb); }
            #${cId} #btn-importar-config { background: linear-gradient(135deg, #64748b, #475569); }
            #${cId} #btn-verificar-seletores { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
            
            #${cId} .section-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--gerconfig-text-muted); font-weight: 700; margin: 0 0 8px 0; }
            </style>
            <div id="pausa-script-config-header">
                <h3>⚙️ Config & Histórico</h3>
                <div class="panel-actions" style="display:flex; align-items:center;">
                    <span id="config-btn-theme" title="Mudar Tema">${ctx.ajaStorage.getItem('GERCONFIG_THEME') === 'dark' ? '🌗' : '☀️'}</span>
                    <span id="btn-fechar-config" title="Fechar">[X]</span>
                </div>
            </div>
            
            <div style="padding: 20px; overflow-y: auto; max-height: calc(100vh - 120px);">
            <div id="estatisticas-pausas" style="margin-bottom:8px;"></div>
            
            <details><summary>🔔 Notificações</summary><div>
                <p class="section-label">Ajuste de Alertas</p>
                <div class="config-item"><label for="notif-ativadas">Alertas Visuais:</label><input type="checkbox" id="notif-ativadas"></div>
                <div class="config-item"><label for="notif-som">Avisos Sonoros:</label><input type="checkbox" id="notif-som"></div>
                <div class="config-item"><label for="notif-tempo">Aviso Antecipado (s):</label><input type="number" id="notif-tempo" min="5" max="55" step="5"></div>
            </div></details>
            
            <details open><summary>⏰ Editar Horários</summary><div>
                <p class="section-label" style="font-size:11px; margin-bottom: 8px;">Agendamentos Atuais</p>
                <div id="agendamento-edit">
                    <div id="agendamento-lista"></div>
                    <p class="section-label" style="margin-top: 15px;">Novo Agendamento</p>
                    <div class="add-schedule-form">
                        <input type="time" id="novo-horario-hora" required>
                        <input type="text" id="novo-horario-status" placeholder="Ex: Refeição, Pausa..." required>
                        <button id="btn-adicionar-horario" class="script-btn-config" title="Adicionar">+</button>
                    </div>
                </div>
            </div></details>
            
            <details open><summary>📋 Histórico Diário</summary><div>
                <div id="historico-log" style="max-height:160px; overflow-y:auto; background:transparent; padding:0;"></div>
            </div></details>
            
            <details><summary>🩺 Diagnóstico Téc.</summary><div>
                <p class="section-label">Verificador de Estrutura</p>
                <p style="font-size:12px; color:var(--gerconfig-text-muted); margin:0 0 12px 0;">Use isso se os botões não estiverem lendo o site corretamente.</p>
                <button id="btn-verificar-seletores" class="script-btn-config" style="margin-bottom:12px;">Fazer Varredura</button>
                <div id="seletores-resultados" style="max-height:150px; overflow-y:auto; background:var(--gerconfig-input-bg); border-radius: 8px; padding: 10px; border: 1px solid var(--gerconfig-border);">
                    <p style="color:var(--gerconfig-text-muted); font-style:italic; font-size:11px; margin:0; text-align:center;">Resultados aparecerão aqui.</p>
                </div>
            </div></details>
            
            <details><summary>💾 Backup de Dados</summary><div>
                <p class="section-label">Configurações Locais</p>
                <p style="font-size:12px; color:var(--gerconfig-text-muted); margin:0 0 12px 0;">Backup apenas das suas pausas agendadas e layout.</p>
                <div style="display:flex; gap:10px;">
                    <button id="btn-exportar-config" class="script-btn-config" style="flex:1;">📤 Exportar</button>
                    <button id="btn-importar-config" class="script-btn-config" style="flex:1;">📥 Importar</button>
                </div>
                <input type="file" id="import-file-input" accept=".json" style="display:none;">
            </div></details>
            </div>
        `;

                const hC = cC.querySelector('#pausa-script-config-header'); if (hC) hC.onmousedown = dragMouseDown;
                const configThemeButton = cC.querySelector('#config-btn-theme');
                if (configThemeButton) configThemeButton.onclick = () => {
                    const isLight = cC.classList.toggle('local-light-mode');
                    cC.classList.toggle('cc-escurinho', !isLight);
                    cC.classList.remove('gcp-tema-escuro');
                    ctx.ajaStorage.setItem('GERCONFIG_THEME', isLight ? 'light' : 'dark');
                    configThemeButton.textContent = isLight ? '☀️' : '🌗';
                    configThemeButton.title = isLight ? 'Mudar para Tema Escuro' : 'Mudar para Tema Claro';
                };
                const bF = cC.querySelector('#btn-fechar-config'); if (bF) bF.onclick = toggleVisibilidadeConfig;
                const bV = cC.querySelector('#btn-verificar-seletores'); if (bV) bV.onclick = verificarSeletoresEAtualizarUI;
                const bA = cC.querySelector('#btn-adicionar-horario'); if (bA) bA.onclick = adicionarNovoHorario;
                const cN = cC.querySelector('#notif-ativadas'), cS = cC.querySelector('#notif-som'), iT = cC.querySelector('#notif-tempo'); if (cN) cN.checked = configNotificacao.ativadas; if (cS) cS.checked = configNotificacao.somAtivado; if (iT) iT.value = configNotificacao.antecedenciaSegundos;
                function sM() { configNotificacao.ativadas = cN.checked; configNotificacao.somAtivado = cS.checked; let t = parseInt(iT.value, 10); if (isNaN(t) || t < 5) t = 5; if (t > 55) t = 55; iT.value = t; configNotificacao.antecedenciaSegundos = t; salvarConfiguracoesNotificacaoLocalStorage(configNotificacao); console.log("[Config Notif] Salvas:", configNotificacao) }
                if (cN) cN.onchange = sM; if (cS) cS.onchange = sM; if (iT) iT.onchange = sM;
                const bE = cC.querySelector('#btn-exportar-config'); if (bE) bE.onclick = exportarConfiguracoes;
                const bI = cC.querySelector('#btn-importar-config'); if (bI) bI.onclick = importarConfiguracoes;
                const fI = cC.querySelector('#import-file-input'); if (fI) fI.onchange = handleArquivoImportado;

                renderizarAgendamentos(); renderizarHistoricoLog(); renderizarEstatisticas();
            }

            // ATUALIZADA V48.4 (Controla o novo relógio do cabeçalho)
            function atualizarUI() {
                window.AjaModular.get('relogio').render(estadoAtual, formatarDuracao);
            }

            // ----------------------------------------------------
            // INÍCIO DO SCRIPT
            // ----------------------------------------------------
            console.log("[GERENCIADOR DE PAUSAS V49.2] Aguardando para injetar UI...");
            const delayInicial = 2800;

            setTimeout(() => {
                if (window.self !== window.top) return;
                try {
                    configNotificacao = carregarConfiguracoesNotificacaoLocalStorage();
                    PAUSAS_AGENDADAS = carregarHorariosLocalStorage();

                    console.log("[GERENCIADOR] Solicitando permissão para notificações...");
                    if (configNotificacao.ativadas && "Notification" in window && Notification.permission === 'default') { Notification.requestPermission().then(p => { if (p === 'granted') { console.log("[Notificação] Permissão OK!"); new Notification("Gerenciador", { body: "Notificações Ativadas!" }) } else { console.warn("[Notificação] Permissão Negada."); ctx.ajaStorage.setItem('notificacao_permissao_negada_aviso', 'true'); } }); }
                    else if ('Notification' in window && Notification.permission === 'denied') { console.warn("[Notificação] Permissão Negada Anteriormente."); ctx.ajaStorage.setItem('notificacao_permissao_negada_aviso', 'true'); }

                    console.log("[GERENCIADOR] Injetando UI...");
                    criarUI();
                    criarUIConfiguracoes(); // Esta é a função que foi corrigida
                    renderizarAgendamentos();
                    console.log("[GERENCIADOR] UI Injetada.");

                    audioNotificacao.volume = 0.5;
                    document.addEventListener('click', desbloquearAudio, { once: true });
                    console.log("[Audio] Pronto para desbloquear no próximo clique.");

                } catch (error) {
                    console.error("[GERENCIADOR] Erro crítico ao iniciar:", error);
                    alert("Erro grave ao iniciar o Gerenciador. Verifique o console (F12).");
                }
            }, delayInicial);

        })(); // Fim do IIFE

    } catch (e) { console.error('[BUILDER] Erro fatal no módulo pausas.js:', e); throw e; }


});
