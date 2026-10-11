// Shared dependencies: ajaStorage
window.AjaModular.register("central", ["compatibility"], function(ctx) {
    /* --- MÓDULO ANEXADO: CENTRAL.JS --- */
    try {
        // ==UserScript==
        // @name         PureCloud - Central de Conhecimento (Módulo Extensão)
        // @description  Base completa de conhecimento integrada ao Menu Unificado.
        // ==/UserScript==

        (function () {
            'use strict';

            // ... (SEUS DADOS 'BRISA_DB' E OS TEMPLATES 'TPL' FICAM AQUI) ...
            // ... (Vou omitir os dados para economizar espaço, mas MANTENHA-OS) ...
            const TPL = {
                sistema: (t, s, c, l) => `<div class="wiki-content system-theme"><div class="wiki-header"><h3 style="color:#8be9fd;">🖥️ ${t}</h3><p class="wiki-subtitle">${s}</p></div><div class="wiki-body">${c}</div>${l && l !== '#' ? `<div class="wiki-footer"><a href="${l}" target="_blank" class="btn-acesso purecloud-script-button">Acessar Agora ↗</a></div>` : ''}</div>`,
                produto: (t, s, c) => `<div class="wiki-content product-theme"><div class="wiki-header"><h3 style="color:#f1fa8c;">📦 ${t}</h3><p class="wiki-subtitle">${s}</p></div><div class="wiki-body">${c}</div></div>`,
                tecnico: (t, r, c, l) => `<div class="wiki-content tech-theme"><div class="wiki-header"><h3 style="color:#ff79c6;">🛠️ ${t}</h3></div><div class="wiki-summary"><strong>RESUMO:</strong> ${r}</div><div class="wiki-body">${c}</div>${l ? `<div class="wiki-footer"><a href="${l}" target="_blank" class="btn-acesso purecloud-script-button">Abrir Documento/Link ↗</a></div>` : ''}</div>`
            };

            // 2. BANCO DE DADOS COMPLETO
            const BRISA_DB = {
                systems: [
                    { label: "YODA", icon: "🧙‍♂️", desc: "ERP Central", url: "https://revan-atendimento.brisanet.net.br/#/yoda/dashboard", details: TPL.sistema("YODA", "Gestão Integrada", `<h4>📌 Funções Principais:</h4><ul><li><b>Financeiro:</b> Verificação de faturas, desbloqueio em confiança e negociação.</li><li><b>Contratos:</b> Status do cliente (Ativo, Bloqueado, Cancelado).</li><li><b>Provisionamento:</b> Reenvio de comandos para a ONU/Modem.</li></ul><p><b>Dica:</b> Sempre verifique se há "OS em Aberto" antes de criar um novo atendimento.</p>`, "https://revan-atendimento.brisanet.net.br/#/yoda/dashboard") },
                    { label: "Genesys", icon: "☁️", desc: "Telefonia", url: "https://apps.sae1.pure.cloud/directory/", details: TPL.sistema("Genesys Cloud", "Contact Center", `<h4>📌 Status do Agente:</h4><ul><li><b>On Queue (Na Fila):</b> Pronto para receber chamadas.</li><li><b>ACW (Pós-atendimento):</b> Tempo para tabular o chamado anterior.</li></ul><p>Se o áudio falhar, pressione F5 ou limpe o cache.</p>`, "https://apps.sae1.pure.cloud/directory/") },
                    { label: "LTM (FWA)", icon: "⚙️", desc: "Gestão 5G", url: "https://mae-ltm.brisanet.net.br/unisso/login.action", details: TPL.tecnico("LTM (Axess)", "Gestão de Modems 5G/4G", `<h4>📡 Parâmetros de Sinal (RSRP):</h4><ul><li><b>-50 a -90 dBm:</b> Excelente.</li><li><b>-91 a -105 dBm:</b> Bom/Regular.</li><li><b>-110 dBm ou mais:</b> Sinal Crítico (Lentidão). Tentar reposicionar o equipamento.</li></ul>`, "https://mae-ltm.brisanet.net.br/unisso/login.action") },
                    { label: "PASTOR", icon: "🐑", desc: "Rede Externa", url: "https://pastor.brisanet.net.br/#/authentication/login", details: TPL.sistema("PASTOR", "Mapeamento", "<p>Georreferenciamento de rede, CTOs e viabilidade técnica.</p>", "https://pastor.brisanet.net.br/#/authentication/login") },
                    { label: "Raumil", icon: "📡", desc: "Campo", url: "https://raumil.brisanet.net.br/#/login", details: TPL.sistema("Raumil", "Field Service", "<p>Gestão de técnicos de campo e OS.</p>", "https://raumil.brisanet.net.br/#/login") },
                    { label: "SASKI", icon: "🧩", desc: "Estoque", url: "https://saski.brisanet.net.br/", details: TPL.sistema("SASKI", "Logística", "<p>Controle de patrimônio e equipamentos.</p>", "https://saski.brisanet.net.br/") },
                    { label: "Meu RH", icon: "👥", desc: "Colaborador", url: "https://brisanetservicos138386.rm.cloudtotvs.com.br/FrameHTML/web/app/RH/PortalMeuRH/#/login", details: TPL.sistema("Meu RH", "Autoatendimento", "<p>Contracheques, ponto e férias.</p>", "https://brisanetservicos138386.rm.cloudtotvs.com.br/FrameHTML/web/app/RH/PortalMeuRH/#/login") },
                    { label: "Jira", icon: "🎫", desc: "Chamados TI", url: "https://brisanet.atlassian.net/servicedesk/customer/portals", details: TPL.sistema("Jira Service", "Suporte Interno", "<p>Abertura de chamados para TI e Sistemas.</p>", "https://brisanet.atlassian.net/servicedesk/customer/portals") },
                    { label: "Looker", icon: "📊", desc: "Métricas", url: "https://lookerstudio.google.com/reporting/b16d26d9-a2c7-48d3-b595-d39737b610ca/page/p_icvajs4fjd?pli=1", details: TPL.sistema("Looker", "Dashboard", "<p>Acompanhamento de métricas (TMA, TME).</p>", "https://lookerstudio.google.com/reporting/b16d26d9-a2c7-48d3-b595-d39737b610ca/page/p_icvajs4fjd?pli=1") }
                ],
                materials: [
                    { label: "Mapa Cobertura 1", icon: "🗺️", desc: "Google Maps", details: TPL.sistema("Mapa 1", "Cobertura Técnica", "<p>Mapa operacional.</p>", "https://www.google.com/maps/d/viewer?mid=1rmfAe5YTRjsPeN9tnkZJzsj3fNGC7QI&femb=1&ll=-5.3780124559692535%2C-36.970868593510744&z=8") },
                    { label: "Mapa Cobertura 2", icon: "🗺️", desc: "Google Maps", details: TPL.sistema("Mapa 2", "Cobertura Técnica", "<p>Mapa operacional.</p>", "https://www.google.com/maps/d/u/0/viewer?hl=pt-BR&ll=-6.02942900614608%2C-38.38409606722841&z=12&mid=1ZaOEDR9_2xOACjZoip1xFkBstS_SSqo") },
                    { label: "Site Cobertura", icon: "🌐", desc: "Site Oficial", details: TPL.sistema("Site Brisanet", "Viabilidade", "<p>Consulta pública de cobertura.</p>", "https://www.brisanet.com.br/mapa-de-area-de-cobertura") },
                    { label: "Abertura IMOC", icon: "📝", desc: "Incidentes", details: TPL.sistema("IMOC", "Abertura de Chamado", "<p>Para eventos massivos e manutenção de rede.</p>", "https://docs.google.com/forms/d/e/1FAIpQLSdOStjaDN5FZ73EaIYCxvA5PA5S3uPqWWWdaOM4ltNzzAamFQ/viewform") },
                    { label: "Regularização Drop", icon: "➰", desc: "Manutenção", details: TPL.sistema("Cabo Drop", "Manutenção", "<p>Solicitar reparo de cabos baixos ou partidos.</p>", "https://docs.google.com/forms/d/e/1FAIpQLSezeLhFUVyh-3W1mkPAxUOBp623O5Yx6Re12vcH0jKpSUFE2g/viewform") },
                    { label: "Reagendamento", icon: "📆", desc: "Solicitação", details: TPL.sistema("Reagendamento", "Reporte", "<p>Quando o agendamento muda sem aviso.</p>", "https://docs.google.com/forms/d/e/1FAIpQLSfN-rzjuS2unjZiIhxfxIdyhlU_S7ypfqh_NwWWLeDTlIKQZg/viewform") },
                    { label: "Cobrança Prazo", icon: "⏰", desc: "SLA", details: TPL.sistema("Cobrança SLA", "Atraso", "<p>Cobrar chamados fora do prazo.</p>", "https://docs.google.com/forms/d/e/1FAIpQLSf7C6JvJW4O-0fodj2rsymzLauNDpMMZIA6Or7ZSri5jS18aQ/viewform") },
                    { label: "Planilha Apoio", icon: "📑", desc: "Geral", details: TPL.sistema("Planilha Apoio", "Controle", "<p>Planilha de apoio operacional.</p>", "https://docs.google.com/spreadsheets/d/1c0BbUVV7oI3f4v3hA-ONea_jJoeqvpBU8mandBEQeR0/edit?gid=1798580531#gid=1798580531") },
                    { label: "Códigos", icon: "🔢", desc: "Tabulação", details: TPL.sistema("Códigos", "Encerramento", "<p>Lista de códigos de tabulação.</p>", "https://docs.google.com/spreadsheets/d/108CeKc84WUCiP0Np6F8htHgwy7Y37jqlCq24LC0Y6no/edit?gid=769704755#gid=769704755") },
                    { label: "Escala", icon: "📅", desc: "Turnos", details: TPL.sistema("Escala", "Horários", "<p>Escala de trabalho da equipe.</p>", "https://docs.google.com/spreadsheets/d/1EKO1APFQXNAjdEzwpC1naoYR4wKUYqj6vYUGGDdihmM/edit?gid=0#gid=0") },
                    { label: "Ramais", icon: "☎️", desc: "Contatos", details: TPL.sistema("Lista de Ramais", "Interno", "<p>Lista de contatos corporativos.</p>", "https://docs.google.com/spreadsheets/d/1-QKtRfxW0EQWTFs967N6EYrvkMDUG4d7gfQNY-uiZ2g/edit?gid=1764454763#gid=1764454763") },
                    { label: "Vagas", icon: "💼", desc: "RH", details: TPL.sistema("Vagas", "Indicação", "<p>Planilha de indicação de vagas.</p>", "https://docs.google.com/spreadsheets/d/17Scc98dmXg8-9bSiSu4ujP1Ig_J51e5Deqj9CD42QiA/edit?gid=1615271674#gid=1615271674") }
                ],
                products_list: [
                    { label: "Netflix", icon: "🔴", desc: "Filmes e Séries", details: TPL.produto("Netflix", "Parceria via Fatura", `<h4>🔑 Como Ativar:</h4><p>O cliente recebe um <b>SMS ou E-mail</b> com o link de ativação após a instalação. Caso não encontre, pode acessar a área do cliente (App Brisanet).</p><h4>⚠️ Problemas Comuns:</h4><ul><li><b>"Atualize sua forma de pagamento":</b> O vínculo com a provedora caiu. Verifique no YODA se o contrato está ativo e peça para o cliente refazer o login pelo link da parceria.</li><li><b>Login em Smart TV:</b> O cliente deve usar o e-mail e senha cadastrados na Netflix, <b>NÃO</b> a senha da central do assinante.</li><li><b>Planos:</b> Padrão (2 telas, HD) | Premium (4 telas, 4K).</li></ul>`) },
                    { label: "Globoplay", icon: "🌍", desc: "Globo e Canais", details: TPL.produto("Globoplay", "Streaming + Canais Ao Vivo", `<h4>🔑 Regras de Acesso:</h4><p>Acesse <b>globoplay.globo.com</b> > Clique no ícone de perfil > "Entrar" > Selecione "Entrar com Operadora" > Escolha Brisanet.</p><h4>🛠️ Erros Conhecidos:</h4><ul><li><b>Erro "Não autorizado" (Canais ao vivo):</b> O cliente provavelmente tem o pacote "Padrão" (só VOD) e está tentando assistir Sportv/Premiere. Confirme a venda.</li><li><b>Erro de Geolocalização (Mobile):</b> O GPS deve estar ativo.</li><li><b>Smart TV:</b> Algumas TVs antigas (antes de 2017) não rodam canais ao vivo, apenas filmes gravados.</li></ul>`) },
                    { label: "Paramount+", icon: "🏔️", desc: "Séries Premium", details: TPL.produto("Paramount+", "Conteúdo CBS/Viacom", `<h4>🎬 O que inclui:</h4><p>Filmes blockbusters, séries exclusivas (Handmaid's Tale, Star Trek) e conteúdo MTV/Nickelodeon.</p><h4>🔑 Acesso:</h4><p>No site/app Paramount+, selecione "Fazer login com parceiro" (Sign in with Partner) e busque por Brisanet.</p>`) },
                    { label: "FWA 5G", icon: "📡", desc: "Internet Rural/Móvel", details: TPL.produto("FWA 5G (Internet Air)", "Sem Cabos / Plug & Play", `<h4>📌 Como Funciona:</h4><p>Um modem (CPE) que capta sinal 4G/5G da torre e cria um Wi-Fi. Ideal para zonas rurais ou onde não passa fibra.</p><h4>⚠️ Atenção à Franquia:</h4><p>Diferente da fibra, este plano possui <b>LIMITE DE DADOS</b> (ex: 400GB). Se o cliente assistir Netflix 4K o dia todo, a internet vai acabar e a velocidade será reduzida.</p><h4>💡 Dica de Sinal:</h4><p>O modem deve ficar próximo à janela ou em local alto. Paredes grossas bloqueiam o sinal 5G.</p>`) },
                    { label: "Fibra (FTTH)", icon: "⚡", desc: "Internet Fixa", details: TPL.produto("Brisa Fibra", "Fiber To The Home", `<h4>🚀 Características:</h4><p>Fibra óptica ponta a ponta (dentro da casa do cliente). Baixa latência (ping) e alta estabilidade.</p><h4>🐢 Cliente reclama de lentidão?</h4><ul><li><b>Teste no Wi-Fi:</b> Não garante velocidade contratada (interferências).</li><li><b>Teste no Cabo:</b> É o único que valida a entrega da banda.</li><li><b>Limitação de Hardware:</b> Celulares/PCs antigos não passam de 40Mbps mesmo em planos de 500Mbps.</li></ul>`) },
                    { label: "Brisafixo", icon: "☎️", desc: "Telefonia Fixa", details: TPL.produto("Brisafixo (VoIP)", "Voz sobre IP", `<h4>📞 Instalação:</h4><p>O aparelho telefônico é conectado na porta <b>TEL1</b> da ONU/Modem. Não usa fiação telefônica antiga da rua.</p><h4>🛠️ Diagnóstico:</h4><ul><li><b>Mudo:</b> Verifique se o LED "TEL" na ONU está aceso fixo. Se piscar ou apagar, há falha de registro (Provisionamento).</li><li><b>Chiado:</b> Geralmente é defeito no aparelho telefônico ou cabo espiral do cliente, não na linha.</li></ul>`) },
                    { label: "Móvel 5G", icon: "📱", desc: "Chips e Planos", details: TPL.produto("Brisa Móvel", "Telefonia Celular", `<h4>📲 Tipos de Chip:</h4><ul><li><b>SIM Card Físico:</b> Chip tradicional.</li><li><b>eSIM:</b> Chip virtual (ativado por QR Code). Exige celular compatível.</li></ul><h4>⚙️ Configuração (APN):</h4><p>Se a internet não funcionar, configure a APN: <b>nome: brisanet / apn: brisanet.br</b>.</p><p><b>Roaming:</b> Para usar fora da área de cobertura própria, ativar "Dados em Roaming" no celular.</p>`) },
                    { label: "Brisamusic", icon: "🎵", desc: "App de Música", details: TPL.produto("Brisamusic", "Streaming de Áudio", `<h4>🎧 O Produto:</h4><p>Concorrente do Spotify/Deezer. Permite baixar músicas para ouvir offline e não tem anúncios.</p><h4>🔑 Acesso:</h4><p>Baixar o app na loja (Play Store/App Store) e logar com as credenciais da Central do Assinante.</p>`) },
                    { label: "Premiere", icon: "⚽", desc: "Futebol", details: TPL.produto("Premiere", "Pay-per-view", "Campeonato Brasileiro.") },
                    { label: "Telecine", icon: "🍿", desc: "Filmes", details: TPL.produto("Telecine", "Cinema", "6 canais de filmes.") },
                    { label: "Saúde 24hs", icon: "🩺", desc: "Telemedicina", details: TPL.produto("Saúde 24hs", "Médico", "Consultas online sem carência.") },
                    { label: "Skeelo", icon: "📚", desc: "Ebooks", details: TPL.produto("Skeelo", "Livros", "Cliente ganha 1 livro digital por mês.") },
                    { label: "Taplingo", icon: "🗣️", desc: "Idiomas", details: TPL.produto("Taplingo", "Cursos", "App de aprendizado de inglês/espanhol.") },
                    { label: "Reforça", icon: "🎓", desc: "Escolar", details: TPL.produto("Reforça", "Educação", "Reforço escolar online.") },
                    { label: "EXA Segurança", icon: "🛡️", desc: "Antivírus", details: TPL.produto("EXA", "Proteção", "Antivírus e VPN para o cliente.") },
                    { label: "Max", icon: "🟣", desc: "HBO", details: TPL.produto("Max", "Streaming", "Antiga HBO Max. Filmes Warner e DC.") }
                ],
                manuals: [
                    { label: "Lentidão", icon: "🐢", desc: "Diagnóstico", details: TPL.tecnico("Lentidão", "Procedimento Obrigatório", `<h4>1. Como testar:</h4><p>O teste deve ser feito via <b>CABO DE REDE (RJ45)</b>. Testes via Wi-Fi não garantem banda contratada.</p><h4>2. Sites Homologados:</h4><p>Utilize <a href="https://fast.com/pt" target="_blank">Fast.com</a> ou <a href="https://www.speedtest.net/" target="_blank">Speedtest</a> (Servidor Brisanet).</p><h4>3. Conclusão:</h4><p>Se a velocidade bater no cabo e não no Wi-Fi, o problema é interferência ou limitação do dispositivo do cliente.</p>`, "https://docs.google.com/document/d/1ryKjpd4lKW1UttU_HxUlRZimCF6R5shqFOvi3b_E4B0/edit?usp=sharing") },
                    { label: "Sem Conexão", icon: "🚫", desc: "Queda Total", details: TPL.tecnico("Cliente sem Acesso", "Verificação de LEDs", `<h4>LED PON Piscando:</h4><p>Sinal atenuado (fibra suja ou dobrada). Agendar visita.</p><h4>LED LOS Vermelho:</h4><p>Rompimento de fibra. Verificar se há massiva na região antes de agendar.</p><h4>LEDs Normais (Verdes):</h4><p>Pode ser travamento do roteador (fazer reset elétrico) ou bloqueio financeiro.</p>`, "https://docs.google.com/document/d/18H0MsbCN6_mguf3zaG0eMUlAeu4RdE5N_xSvA9pSN8U/edit?usp=sharing") },
                    { label: "CGNAT / Jogos", icon: "🎮", desc: "NAT Estrito", details: TPL.tecnico("CGNAT e Jogos Online", "Portas Fechadas", `<h4>O Problema:</h4><p>O CGNAT compartilha IPs, impedindo abertura de portas (NAT Tipo 3/Estrito).</p><h4>A Solução:</h4><p>Ativar <b>IPv6</b> no roteador e no console do cliente. O IPv6 não possui NAT e resolve a conexão.</p>`, "https://docs.google.com/document/d/1evXyscMO_6hhkFQhghiykTWwwC_NhSxP0_4-g-pfxhA/edit?tab=t.0") },
                    { label: "Wi-Fi Oscilando", icon: "📶", desc: "Instabilidade", details: TPL.tecnico("Wi-Fi Caindo", "Melhoria de Sinal", `<h4>Causas:</h4><p>Canal congestionado (muitos vizinhos), espelhos, aquários ou roteador em local fechado.</p><h4>Ação:</h4><p>Alterar canal do Wi-Fi (1, 6, 11 no 2.4GHz) e fixar largura de banda em 20MHz para maior estabilidade.</p>`, "https://docs.google.com/presentation/d/1TUEanxohqbOruZ9OP4E_17x5-1nuew_oHpnKu8_GPG8/edit?slide=id.g1ee83cbd389_2_0") },
                    { label: "Diag. Velocidade", icon: "📘", desc: "Slide", details: TPL.tecnico("Procedimento Velocidade", "Slide Oficial", "<p>Ping, Tracert e Pathping.</p>", "https://docs.google.com/presentation/d/1sFq9AbsG4OXP-6DfpTNUGVUvtShWPInbMFB7us0vHuc/edit?slide=id.g203410fc01f_0_60#slide=id.g203410fc01f_0_60") },
                    { label: "Prob. Roteador", icon: "📘", desc: "Slide", details: TPL.tecnico("Roteador", "Configuração", "<p>Otimização de rede.</p>", "https://docs.google.com/presentation/d/1WMQFP_M8xklLzK9ExBSLUFFv-7DCPd3mWhYpgOmzzmk/edit?slide=id.g28dccbacb76_17_77#slide=id.g28dccbacb76_17_77") },
                    { label: "Rede Mesh", icon: "📘", desc: "Slide", details: TPL.tecnico("Mesh", "Diagnóstico", "<p>Problemas com EasyMesh.</p>", "https://docs.google.com/presentation/d/1EJLJGUKQWmeYOUAgLC12iyBxEzyMMDImnT4WjseUjWA/edit?slide=id.g2820d168d26_32_161#slide=id.g2820d168d26_32_161") },
                    { label: "Troca Equip.", icon: "📘", desc: "Slide", details: TPL.tecnico("Troca", "Política", "<p>Quando solicitar troca.</p>", "https://docs.google.com/presentation/d/136X85ywiAuc9kT4sfwkPwAOOXcSFyXbEsELhoZ9Tb7U/edit?slide=id.g2bca5b4418c_51_63#slide=id.g2bca5b4418c_51_63") },
                    { label: "Manual VPN", icon: "📄", desc: "Doc", details: TPL.tecnico("VPN", "Guia", "<p>Resolvendo problemas com VPN.</p>", "https://docs.google.com/document/d/1-G8z7iq6bKyiVdkVdmM54NkYM-aYH66iJBxZyVP27dQ/edit?tab=t.0") },
                    { label: "IPv6", icon: "📄", desc: "Doc", details: TPL.tecnico("IPv6", "Guia", "<p>Testar conectividade IPv6.</p>", "https://docs.google.com/document/d/1S3Q4wA_lQtolvlfAY09IoaeB6WUXqsMXtxxYfxv2UTs/edit?usp=sharing") },
                    { label: "Smart TVs", icon: "📺", desc: "Soluções de TV", details: TPL.tecnico("Smart TVs (Samsung/LG/TCL)", "Dicas e Resolução", `<h4>1. Ciclo de Energia (Power Cycle):</h4><p>TV travada ou sem rede? Retire da tomada por 2 minutos e ligue novamente. Isso limpa a memória cache e reinicia a placa de rede da TV.</p><h4>2. Problemas na Netflix/Apps:</h4><p>Netflix travada nos 25%? Pode ser falha no servidor deles. Em Android TV, vá em Configurações > Apps > Forçar Parada e "Limpar Cache".</p><h4>3. Wi-Fi x Cabo:</h4><p>Diga ao cliente que conectar o cabo direto na TV melhora 100% o carregamento do 4K. Algumas placas Wi-Fi de TV limitam a banda.</p>`) },
                    { label: "Videogames", icon: "🎮", desc: "Console Online", details: TPL.tecnico("PlayStation e Xbox", "Conexão de Jogos", `<h4>1. Lag e Queda de Partida:</h4><p>Videogame no Wi-Fi <b>SEMPRE</b> sofrerá lag e perda de pacotes (Packet Loss). Aconselhe sempre o uso de <b>Cabo de Rede (RJ45)</b>.</p><h4>2. NAT Tipo 3 / Estrito:</h4><p>Dificulta chats de voz (Party). A solução é ativar IPv6 ou colocar o aparelho em DMZ (Verifique procedimentos da provedora).</p><h4>3. Lentidão em Downloads da PSN/Xbox:</h4><p>Alterar o DNS na rede do videogame para <code>8.8.8.8</code> ou <code>1.1.1.1</code> destrava downloads travados na loja.</p>`) },
                    { label: "Computadores", icon: "💻", desc: "Suporte PC", details: TPL.tecnico("Computadores e Notebooks", "Problemas Comuns", `<h4>1. Conectado mas sem internet (Só no PC):</h4><p>Se o celular funciona e o PC não, rode no Prompt de Comando (CMD) como Administrador:<br><code>ipconfig /flushdns</code><br><code>netsh winsock reset</code><br>Reinicie o PC.</p><h4>2. Disco 100% ou Engasgos:</h4><p>Antivírus do Windows atualizando em segundo plano engole toda a banda de internet do PC.</p><h4>3. Placa Gigabit:</h4><p>Se o PC não passar de 90 Mbps no cabo, a placa de rede dele pode ser Fast Ethernet (antiga). Precisa ser "Gigabit" para passar os 100 Mega.</p>`) },
                    { label: "Smartphones", icon: "📱", desc: "Wi-Fi Celular", details: TPL.tecnico("Smartphones (Android/iPhone)", "Conectividade", `<h4>1. Erro "Senha Incorreta" do Nada:</h4><p>Toque na rede Wi-Fi, escolha "Esquecer a Rede" e reconecte digitando a senha devagar.</p><h4>2. Sinal 5Ghz sumindo:</h4><p>Celulares antigos ou mais básicos não enxergam a rede 5G. Ele deve usar a rede 2.4G normal.</p><h4>3. Troca de Rede Automática (Wi-Fi Assist / Apple):</h4><p>Se a internet oscilar no celular, o aparelho passa automaticamente para o 4G. Peça ao cliente para desativar esta opção nasConfigs de Wi-Fi.</p>`) },
                    { label: "Redes Sociais", icon: "💬", desc: "Mídias não carregam", details: TPL.tecnico("WhatsApp e Instagram", "Imagens/Vídeos Lentos", `<h4>1. IPv6 Falhando:</h4><p>Redes do meta (Facebook, Insta, Whats) dependem pesadamente do IPv6. Se os vídeos não abrem no Wi-Fi mas abrem no 4G, faça um reset ou reconfigure o IPv6 no roteador.</p><h4>2. Fuso Horário e Data Errada:</h4><p>Se o celular ou PC do cliente estiver com a data desatualizada, os certificados de segurança do Google/WhatsApp bloqueiam a conexão.</p>`) }
                ],
                equipment: [
                    { label: "Repetidor vs Mesh", icon: "📡", desc: "Qualidade Wi-Fi", details: TPL.tecnico("Extensores e Redes Mesh", "Arquitetura", `<h4>1. Repetidor de Tomada Padrão:</h4><p>O repetidor normal (geralmente branco com anteninhas curtas) "corta" a internet pela metade. Ele recebe via Wi-Fi e repassa via Wi-Fi, causando muito atraso e gargalo.</p><h4>2. Tecnologia EasyMesh:</h4><p>No Mesh (roteadores interligados), a rede é uma só. A transição do celular de um roteador para o outro é fluida (Roaming Ativo) e entrega a velocidade real. <b>Recomende sempre o Mesh em vez de repetidores velhos.</b></p>`) },
                    { label: "Rot. Particular", icon: "🔌", desc: "Equipamento do Cliente", details: TPL.tecnico("Roteador do Cliente", "Boas Práticas", `<h4>1. Onde espetar o cabo:</h4><p>O cabo que vem do nosso modem deve entrar na porta <b>WAN / Internet</b> (Geralmente de cor diferente, azul ou amarela sozinha) do roteador do cliente.</p><h4>2. Conflito de IP:</h4><p>Se a luz de WAN acende mas não navega, o IP do roteador dele pode ser o mesmo do nosso (Ex: 192.168.1.1). Ele terá que entrar nas configs do próprio roteador e mudar a LAN para 192.168.2.1 ou 192.168.10.1.</p>`) },
                    { label: "Intelbras GX3000", icon: "📡", desc: "Modem 5G", details: TPL.tecnico("Intelbras GX3000", "CPE 5G/Wi-Fi 6", `<h4>🚦 LEDs:</h4><ul><li><b>Azul/Branco:</b> Sinal Ótimo.</li><li><b>Amarelo:</b> Sinal Regular (Pode oscilar).</li><li><b>Vermelho:</b> Sem sinal (Verificar torre).</li></ul><p><b>Botão Wi-Fi:</b> Pressione por 3s se a rede sumir.</p>`) },
                    { label: "TP-Link NX620v", icon: "📡", desc: "Modem 5G", details: TPL.tecnico("NX620v", "FWA", "Suporta EasyMesh e possui botão físico On/Off.") },
                    { label: "ONU Padrão", icon: "📠", desc: "Huawei/Nokia", details: TPL.tecnico("ONU Fibra", "Status", `<h4>🚦 LEDs:</h4><ul><li><b>PON Fixo:</b> Conectado.</li><li><b>PON Piscando:</b> Tentando conectar (Sinal ruim).</li><li><b>LOS Vermelho:</b> Cabo rompido.</li></ul>`) },
                    { label: "Roteadores Wi-Fi 6", icon: "📶", desc: "AX1500/1800", details: TPL.tecnico("Wi-Fi 6", "Tecnologia", `<p>Equipamentos pretos (BSN/TP-Link). Trabalham com duas redes (2.4G e 5G) ou Smart Connect (nome único).</p><p><b>Atenção:</b> Celulares antigos podem não detectar a rede Wi-Fi 6.</p>`) }
                ],
                tools: [
                    { label: "Teste Velocidade", url: "https://fast.com/pt/", icon: "🚀", desc: "Fast.com", details: TPL.tecnico("Teste", "Instruções", "Sempre via CABO de rede.") },
                    { label: "Downdetector", url: "https://downdetector.com.br/", icon: "📉", desc: "Status", details: TPL.tecnico("Downdetector", "Massivas", "Verificar quedas globais (Whatsapp, Google, etc).") },
                    { label: "Anydesk", url: "https://anydesk.com/pt/downloads/windows", icon: "↔️", desc: "Remoto", details: TPL.tecnico("Anydesk", "Acesso", "Suporte remoto leve.") },
                    { label: "TeamViewer", url: "https://www.teamviewer.com/pt-br/download/windows/", icon: "💻", desc: "Remoto", details: TPL.tecnico("TeamViewer", "Acesso", "Suporte remoto robusto.") }
                ],
                contacts: [
                    { label: "Ouvidoria", icon: "📢", desc: "0800 281 4000", details: TPL.sistema("Ouvidoria", "2ª Instância", "<p>Canal para resolução de conflitos não resolvidos no suporte padrão.</p><h2>📞 0800 281 4000</h2>", "#") },
                    { label: "Suporte 10517", icon: "👤", desc: "Atendimento Geral", details: TPL.sistema("Suporte Técnico", "Canal Padrão", "<p>Atendimento geral ao cliente (Residencial).</p><h2>📞 10517</h2>", "#") },
                    { label: "Regional", icon: "🌍", desc: "0800 285 3917", details: TPL.sistema("Atendimento Regional", "Escritórios Locais", "<p>Dúvidas sobre lojas e atendimentos específicos de região.</p><h2>📞 0800 285 3917</h2>", "#") },
                    { label: "Corporativo", icon: "🏢", desc: "0800 282 3017", details: TPL.sistema("B2B / Empresas", "Atendimento VIP", "<p>Canal exclusivo para clientes CNPJ e Grandes Contas.</p><h2>📞 0800 282 3017</h2>", "#") },
                    { label: "Zap Suporte", icon: "💬", desc: "(84) 98111-8525", details: TPL.sistema("Suporte Digital", "WhatsApp Oficial", "<p>Atendimento automatizado e humano via chat.</p>", "https://wa.me/5584981118525") },
                    { label: "Zap Regional", icon: "📱", desc: "(88) 98122-3054", details: TPL.sistema("Regional Digital", "WhatsApp Regional", "<p>Atendimento de demandas regionais via chat.</p>", "https://wa.me/5588981223054") },
                    { label: "Zap Comercial", icon: "💻", desc: "Vendas Fibra", details: TPL.sistema("Comercial Fibra", "(88) 98182-0637", "<p>Canal de vendas para novos planos Fibra.</p>", "https://wa.me/5588981820637") },
                    { label: "Zap Vendas 5G", icon: "📶", desc: "Vendas Móvel", details: TPL.sistema("Comercial 5G", "(88) 98182-2574", "<p>Canal exclusivo para vendas de planos móveis 5G.</p>", "https://wa.me/5588981822574") },
                    { label: "Brisa Móvel", icon: "📵", desc: "(88) 98111-7600", details: TPL.sistema("Suporte Móvel", "Telefonia Celular", "<p>Dúvidas sobre chips, portabilidade e planos móveis.</p>", "https://wa.me/5588981117600") },
                    { label: "Móvel 5G", icon: "📶", desc: "(84) 98111-8525", details: TPL.sistema("Brisa Móvel 5G", "Suporte Avançado", "<p>Atendimento especializado em tecnologia 5G.</p>", "https://wa.me/5584981118525") },
                    { label: "RH Atende", icon: "👥", desc: "Colaborador", details: TPL.sistema("RH Atende", "(84) 98187-0438", "<p>Dúvidas sobre ponto, férias e contracheque.</p>", "https://wa.me/5584981870438") },
                    { label: "Benefícios", icon: "🏦", desc: "Vale/Plano", details: TPL.sistema("Setor Benefícios", "(88) 98140-6250", "<p>Dúvidas sobre Vale Alimentação, Plano de Saúde, etc.</p>", "https://wa.me/5588981406250") }
                ]
            };

            const ICONS = {
                CLOSE: `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
                LINK_EXT: `<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`,
                MAIN_ICON: `💠`
            };

            function createDashboard() {
                if (document.getElementById('central-dashboard')) return;
                const oldOverlay = document.querySelector('.central-modal-overlay');
                if (oldOverlay) oldOverlay.remove();

                const dashboard = document.createElement('div');
                dashboard.id = 'central-dashboard';
                dashboard.innerHTML = `
                    <div class="central-sidebar">
                        <div class="central-logo"><span>${ICONS.MAIN_ICON}</span> Central</div>
                        <ul class="central-menu"></ul>
                        <div class="central-version">v34.2</div>
                    </div>
                    <div class="central-main">
                        <div class="central-topbar">
                            <h3 id="section-title">Início</h3>
                            <div style="flex:1;"></div>
                            <input type="text" id="central-search" placeholder="Pesquisar..." style="margin-right:10px;">
                            <button id="btn-central-theme" title="Mudar Tema">🌗</button>
                            <button id="btn-close-dashboard" title="Fechar">${ICONS.CLOSE}</button>
                        </div>
                        <div class="central-grid" id="central-content"></div>
                    </div>
                `;
                document.body.appendChild(dashboard);

                const themeBtn = dashboard.querySelector('#btn-central-theme');
                const savedTheme = ctx.ajaStorage.getItem('CENTRAL_THEME');
                if (savedTheme === 'light') {
                    dashboard.classList.add('local-light-mode');
                    themeBtn.innerText = '☀️';
                } else if (savedTheme === 'dark') {
                    dashboard.classList.add('cc-escurinho');
                    themeBtn.innerText = '🌗';
                }
                themeBtn.onclick = () => {
                    const isLight = dashboard.classList.contains('local-light-mode');
                    if (isLight) {
                        dashboard.classList.remove('local-light-mode');
                        dashboard.classList.add('cc-escurinho');
                        ctx.ajaStorage.setItem('CENTRAL_THEME', 'dark');
                        themeBtn.innerText = '🌗';
                    } else {
                        dashboard.classList.remove('cc-escurinho');
                        dashboard.classList.add('local-light-mode');
                        ctx.ajaStorage.setItem('CENTRAL_THEME', 'light');
                        themeBtn.innerText = '☀️';
                    }
                };

                dashboard.querySelector('#btn-close-dashboard').onclick = () => dashboard.remove();
                makeDraggable(dashboard, dashboard.querySelector('.central-logo'));

                // Renderização das Categorias ORIGINAIS
                const menuContainer = dashboard.querySelector('.central-menu');
                const contentContainer = dashboard.querySelector('#central-content');
                const searchInput = dashboard.querySelector('#central-search');
                const sectionTitle = dashboard.querySelector('#section-title');

                const CATEGORIES = [
                    { id: 'systems', icon: '🖥️', label: 'Sistemas', data: BRISA_DB.systems || [] },
                    { id: 'materials', icon: '📑', label: 'Materiais', data: BRISA_DB.materials || [] },
                    { id: 'products_list', icon: '📦', label: 'Produtos', data: BRISA_DB.products_list || [] },
                    { id: 'manuals', icon: '📘', label: 'Manuais', data: BRISA_DB.manuals || [] },
                    { id: 'equipment', icon: '📟', label: 'Equipamentos', data: BRISA_DB.equipment || [] },
                    { id: 'tools', icon: '🔧', label: 'Ferramentas', data: BRISA_DB.tools || [] },
                    { id: 'contacts', icon: '📞', label: 'Contatos', data: BRISA_DB.contacts || [] }
                ];

                function render(items, title) {
                    contentContainer.innerHTML = '';
                    sectionTitle.innerText = title;
                    contentContainer.style.opacity = '0';
                    setTimeout(() => contentContainer.style.opacity = '1', 50);

                    if (!items || items.length === 0) {
                        contentContainer.innerHTML = '<div class="empty-state">Nenhum resultado encontrado.</div>';
                        return;
                    }

                    items.forEach(item => {
                        const card = document.createElement('div');
                        card.className = 'central-card';
                        if (title.includes("Produtos")) card.classList.add('product-card-style');
                        if (title.includes("Manuais") || title.includes("Equipamentos")) card.classList.add('tech-card-style');

                        card.innerHTML = `
                            <div class="card-icon">${item.icon}</div>
                            <div class="card-body">
                                <div class="card-title">${item.label}</div>
                                <div class="card-desc">${item.desc || ''}</div>
                            </div>
                        `;
                        card.onclick = () => openModal({ label: item.label, icon: item.icon, details: item.details, url: item.url || '#' });
                        contentContainer.appendChild(card);
                    });
                }

                CATEGORIES.forEach(cat => {
                    const li = document.createElement('li');
                    li.innerHTML = `<span>${cat.icon}</span> ${cat.label}`;
                    li.onclick = () => {
                        dashboard.querySelectorAll('li').forEach(i => i.classList.remove('active'));
                        li.classList.add('active');
                        searchInput.value = '';
                        render(cat.data, cat.label);
                    };
                    menuContainer.appendChild(li);
                });

                searchInput.addEventListener('input', (e) => {
                    const term = e.target.value.toLowerCase();
                    if (!term) { dashboard.querySelector('li.active')?.click(); return; }
                    dashboard.querySelectorAll('li').forEach(i => i.classList.remove('active'));
                    let results = [];
                    CATEGORIES.forEach(cat => {
                        if (!cat.data) return;
                        const matches = cat.data.filter(item => item.label.toLowerCase().includes(term) || (item.desc && item.desc.toLowerCase().includes(term)));
                        results = results.concat(matches);
                    });
                    render(results, `🔍 Busca: "${term}"`);
                });

                if (menuContainer.firstChild) menuContainer.firstChild.click();
            }

            function openModal(item) {
                const oldOverlay = document.querySelector('.central-modal-overlay');
                if (oldOverlay) oldOverlay.remove();

                const overlay = document.createElement('div');
                overlay.className = 'central-modal-overlay';

                const modal = document.createElement('div');
                modal.className = 'central-modal';

                let btnLink = '';
                if (item.url && item.url !== "#") {
                    btnLink = `<a href="${item.url}" target="_blank" class="btn-modal-action purecloud-script-button">Acessar Link Externo ${ICONS.LINK_EXT}</a>`;
                }

                modal.innerHTML = `
            <div class="modal-header"><div class="modal-title"><span>${item.icon}</span> ${item.label}</div><button class="btn-close-modal purecloud-script-button">${ICONS.CLOSE}</button></div>
            <div class="modal-content">${item.details || "<p>Sem detalhes.</p>"}</div>
            <div class="modal-footer">${btnLink}</div>
        `;

                overlay.appendChild(modal);
                document.body.appendChild(overlay);

                const close = () => {
                    overlay.style.opacity = '0';
                    overlay.style.pointerEvents = 'none'; // Desbloqueia a tela imediatamente
                    setTimeout(() => overlay.remove(), 200);
                };

                modal.querySelector('.btn-close-modal').onclick = close;
                overlay.onclick = (e) => { if (e.target === overlay) close(); };

                requestAnimationFrame(() => { overlay.style.opacity = '1'; modal.style.transform = 'translate(-50%, -50%) scale(1)'; });
            }

            function makeDraggable(el, handle) {
                if (!handle) handle = el;
                let isDragging = false, dragOffsetX = 0, dragOffsetY = 0;

                let moveHandler = (e) => {
                    if (!isDragging) return;
                    e.preventDefault();

                    let newLeft = e.clientX - dragOffsetX;
                    let newTop = e.clientY - dragOffsetY;

                    const rect = el.getBoundingClientRect();
                    if (newLeft < 0) newLeft = 0;
                    if (newTop < 0) newTop = 0;
                    if (newLeft + rect.width > window.innerWidth) newLeft = window.innerWidth - rect.width;
                    if (newTop + rect.height > window.innerHeight) newTop = window.innerHeight - rect.height;

                    el.style.left = newLeft + 'px';
                    el.style.top = newTop + 'px';
                };

                let upHandler = () => {
                    if (isDragging) {
                        isDragging = false;
                    }
                };

                handle.addEventListener('mousedown', (e) => {
                    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT' || e.target.closest('.os-btn') || e.target.closest('button')) return;
                    e.preventDefault();
                    isDragging = true;

                    el.style.transition = 'none';
                    el.style.transform = 'none';
                    el.style.margin = '0';

                    const rect = el.getBoundingClientRect();
                    el.style.left = rect.left + 'px';
                    el.style.top = rect.top + 'px';
                    el.style.bottom = 'auto';
                    el.style.right = 'auto';

                    dragOffsetX = e.clientX - rect.left;
                    dragOffsetY = e.clientY - rect.top;
                }, { passive: false });

                // Ensure we don't bind multiple identical listeners if makeDraggable is called multiple times on the same element
                // A quick hack is just bind it globally, it naturally ignores when isDragging is false.
                document.addEventListener('mousemove', moveHandler, { passive: false });
                document.addEventListener('mouseup', upHandler);
            }

            function injectCss() {
                const style = document.createElement('style');
                style.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=Segoe+UI:wght@400;500;600;700&display=swap');
            #central-dashboard { --purecloud-script-header-bg: #0d9488; --purecloud-script-header-text: #ffffff; --purecloud-script-accent-color: #0d9488; position: fixed; top: 10vh; left: 10vw; width: 80vw; height: 80vh; background: var(--purecloud-script-bg-primary); display: flex; color: var(--purecloud-script-text-primary); z-index: 100000; border-radius: 8px; overflow: hidden; box-shadow: 0 8px 30px var(--purecloud-script-shadow-color); border: 1px solid var(--purecloud-script-border-color); font-family: 'Segoe UI', Roboto, sans-serif; }
            #central-dashboard.cc-escurinho { --purecloud-script-bg-primary: #0f172a; --purecloud-script-bg-secondary: #1e293b; --purecloud-script-border-color: #334155; --purecloud-script-text-primary: #f8fafc; --purecloud-script-text-secondary: #94a3b8; }
            #central-dashboard.local-light-mode { --purecloud-script-bg-primary: #f8fafc; --purecloud-script-bg-secondary: #f1f5f9; --purecloud-script-border-color: #e2e8f0; --purecloud-script-text-primary: #0f172a; --purecloud-script-text-secondary: #475569; }
            .central-sidebar { width: 220px; background: var(--purecloud-script-bg-secondary); padding: 20px 0; display: flex; flex-direction: column; border-right: 1px solid var(--purecloud-script-border-color); }
            .central-logo { padding: 0 20px 20px 20px; font-weight: 600; font-size: 16px; border-bottom: 1px solid var(--purecloud-script-border-color); display: flex; align-items: center; gap: 8px; cursor: move; color: var(--purecloud-script-text-primary); user-select: none; }
            .central-menu { list-style: none; padding: 10px 0; margin: 0; flex: 1; background: transparent; }
            .central-menu li { padding: 12px 20px; cursor: pointer; border-left: 3px solid transparent; transition: 0.2s; font-size: 13px; font-weight: 500; color: var(--purecloud-script-text-secondary); }
            .central-menu li:hover { background: rgba(0,0,0,0.03); color: var(--purecloud-script-text-primary); }
            .central-menu li.active { color: var(--purecloud-script-text-primary); border-left-color: var(--purecloud-script-accent-color); font-weight: bold; background: transparent; }
            .central-version { text-align: center; font-size: 11px; color: var(--purecloud-script-text-secondary); padding: 10px; }
            .central-main { flex: 1; display: flex; flex-direction: column; background: var(--purecloud-script-bg-primary); }
            .central-topbar { padding: 12px 16px; border-bottom: 1px solid var(--purecloud-script-border-color); display: flex; justify-content: space-between; align-items: center; background: var(--purecloud-script-header-bg); color: var(--purecloud-script-header-text); }
            .central-topbar h3 { margin: 0; font-size: 15px; font-weight: 600; color: var(--purecloud-script-header-text); }
            #central-search { background: var(--purecloud-script-bg-primary); border: 1px solid var(--purecloud-script-border-color); color: var(--purecloud-script-text-primary); padding: 8px 12px; border-radius: 4px; width: 250px; outline: none; font-size: 13px; transition: border-color 0.2s; }
            #central-search:focus { border-color: var(--purecloud-script-accent-color); box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2); }
            #btn-close-dashboard, #btn-central-theme { background: transparent; border: 1px solid transparent; cursor: pointer; font-size: 15px; color: var(--purecloud-script-header-text); padding: 6px; border-radius: 6px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
            #btn-close-dashboard:hover, #btn-central-theme:hover { background: rgba(255,255,255,0.15); border-color: rgba(255,255,255,0.2); color: #fff; }
            .central-grid { flex: 1; overflow-y: auto; padding: 20px; display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; align-content: start; }
            .central-card { background: var(--purecloud-script-bg-secondary); border-radius: 8px; padding: 15px; cursor: pointer; transition: 0.2s; border-top: 3px solid var(--purecloud-script-accent-color); border-left: 1px solid var(--purecloud-script-border-color); border-right: 1px solid var(--purecloud-script-border-color); border-bottom: 1px solid var(--purecloud-script-border-color); }
            .central-card:hover { transform: translateY(-3px); box-shadow: 0 5px 15px var(--purecloud-script-shadow-color); }
            .central-card h4 { margin: 0; font-size: 14px; color: var(--purecloud-script-text-primary); font-weight: 600; }
            .border-sistema { border-top-color: var(--purecloud-script-accent-color); } .border-produto { border-top-color: var(--purecloud-script-success-color); } .border-tecnico { border-top-color: var(--purecloud-script-warn-color); }
            .central-modal-overlay { 
                position: fixed; inset: 0; background: rgba(0,0,0,0.6); 
                z-index: 100001; 
                display: flex; justify-content: center; align-items: center; 
                opacity: 0; transition: opacity 0.2s; 
                pointer-events: auto; 
            }
            .central-modal { background: var(--purecloud-script-bg-primary); border-radius: 8px; width: 600px; max-width: 90vw; max-height: 80vh; display: flex; flex-direction: column; overflow: hidden; transform: scale(0.9); transition: transform 0.2s; box-shadow: 0 8px 30px var(--purecloud-script-shadow-color); border: 1px solid var(--purecloud-script-border-color); font-family: 'Segoe UI', Roboto, sans-serif; color: var(--purecloud-script-text-primary); }
            .modal-header { padding: 12px 16px; background: var(--purecloud-script-bg-secondary); border-bottom: 1px solid var(--purecloud-script-border-color); display: flex; justify-content: space-between; align-items: center; user-select: none; border-radius: 8px 8px 0 0; }
            .modal-title { font-weight: 600; font-size: 15px; color: var(--purecloud-script-text-primary); display: flex; align-items: center; gap: 8px; }
            .modal-title span { color: var(--purecloud-script-text-primary); display: flex; }
            .btn-close-modal { background: transparent; border: none; cursor: pointer; font-size: 15px; color: var(--purecloud-script-text-secondary); padding: 6px; border-radius: 6px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
            .btn-close-modal:hover { color: var(--purecloud-script-text-primary); }
            .modal-content { padding: 20px; flex: 1; overflow-y: auto; color: var(--purecloud-script-text-primary); font-size: 14px; line-height: 1.6; }
            .modal-footer { padding: 12px 16px; background: var(--purecloud-script-bg-secondary); border-top: 1px solid var(--purecloud-script-border-color); text-align: right; border-radius: 0 0 8px 8px; }
            .wiki-body { margin-top: 10px; } .wiki-body ul, .wiki-body ol { margin-left: 20px; margin-top: 5px; padding-left: 0; }

        `;
                document.head.appendChild(style);
            }

            // Injeção de CSS
            injectCss();

            // Trigger Global
            const createTriggerButton = () => {
                let btn = document.getElementById('central-trigger-btn');
                if (btn) return;
                btn = document.createElement('button');
                btn.id = 'central-trigger-btn';
                btn.style.display = 'none';
                document.body.appendChild(btn);
                btn.onclick = createDashboard;
            };
            createTriggerButton();
        })();

    } catch (e) { console.error('[BUILDER] Erro fatal no módulo central.js:', e); }



return { open() { return document.getElementById('central-trigger-btn')?.click(); } };
});
