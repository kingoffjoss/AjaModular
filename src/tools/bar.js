// Shared dependencies: ajaStorage, safeFetch
window.AjaModular.register("bar", ["compatibility", "bau-catalogo"], function(ctx) {
    /* --- MÓDULO ANEXADO: BAR.JS --- */
    try {
        (function () {
            // Catálogos independentes incorporados durante o build.
            const catalog = window.AjaModular.get('bau-catalogo');
            window.commandDatabase = catalog.defaults();
            const savedCatalog = ctx.ajaStorage.getItem('bau_commandDatabase_v1');
            if (savedCatalog) {
                try { window.commandDatabase = catalog.validate(JSON.parse(savedCatalog)); }
                catch (error) { console.warn('[Baú] Catálogo salvo inválido; usando o padrão.', error); }
            }

            // --- 1. A LÓGICA DO "BAÚ" ---
            let currentOS = 'auto'; // 'auto', 'win', 'mac', 'linux'

            // VARIÁVEIS DE REDIMENSIONAMENTO
            const MIN_WIDTH = 300;
            const MIN_HEIGHT = 200;
            let resizeHandle;

            const ICONS = {
                COMPUTER: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="bau-svg-icon"><path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"/></svg>`,
                CLOSE: `<svg class="bau-svg-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg>`,
            };

            const DESIGN_COLORS = {
                '--cor-acento-primario': '#00BFFF', '--cor-acento-hover': '#40E0D0', '--cor-acento-texto': '#0D1117', '--cor-fundo-primario': '#0D1117', '--cor-fundo-secundario': '#161B22', '--cor-fundo-terciario': '#21262D', '--cor-fundo-hover': '#21262d55', '--cor-borda': '#30363D', '--cor-texto-primario': '#C9D1D9', '--cor-texto-secundario': '#8B949E', '--cor-texto-desabilitado': '#484F58', '--cor-perigo': '#F47067', '--cor-perigo-hover': '#FF8080', '--cor-sucesso': '#3FB950', '--cor-info': '#58A6FF', '--glow-color': 'rgba(0, 191, 255, 0.2)', '--glow-hover-color': 'rgba(64, 224, 208, 0.3)', '--sombra-popup': '0 0 15px rgba(0, 191, 255, 0.1), 0 4px 8px rgba(0,0,0,0.3)'
            };

            function applyThemeColors(colors) {
                const root = document.documentElement;
                if (!colors) return;
                for (const [key, value] of Object.entries(colors)) {
                    if (key.startsWith('--')) {
                        root.style.setProperty(key, value);
                    }
                }
            }

            function getActiveOS() {
                if (currentOS !== 'auto') {
                    return currentOS;
                }
                const platform = navigator.platform.toLowerCase();
                if (platform.includes('win')) return 'win';
                if (platform.includes('mac')) return 'mac';
                if (platform.includes('linux')) return 'linux';
                return 'unknown';
            }

            function openBauTab(evt, tabName) {
                let i, tabcontent, tablinks;
                tabcontent = document.getElementsByClassName("bau-tab-content");
                for (i = 0; i < tabcontent.length; i++) tabcontent[i].style.display = "none";

                tablinks = document.getElementsByClassName("bau-sidebar-btn"); // Original

                for (i = 0; i < tablinks.length; i++) tablinks[i].className = tablinks[i].className.replace(" active", "");
                document.getElementById(tabName).style.display = "block";
                evt.currentTarget.className += " active";
            }

            function copyCommand(inputId, buttonElement) {
                const inputElement = document.getElementById(inputId);
                const copyButton = buttonElement;

                inputElement.select();

                try {
                    navigator.clipboard.writeText(inputElement.value).then(() => {
                        const originalText = copyButton.textContent;
                        copyButton.textContent = 'Copiado!';
                        copyButton.style.backgroundColor = 'var(--cor-sucesso)';
                        setTimeout(() => {
                            copyButton.textContent = originalText;
                            if (copyButton.id.includes('install')) copyButton.style.backgroundColor = 'var(--cor-sucesso)';
                            else if (copyButton.id.includes('force-auto')) copyButton.style.backgroundColor = 'var(--cor-sucesso)';
                            else if (copyButton.id.includes('force-1g')) copyButton.style.backgroundColor = 'var(--cor-perigo)';
                            else if (copyButton.classList.contains('run-test')) copyButton.style.backgroundColor = 'var(--cor-info)';
                            else copyButton.style.backgroundColor = 'var(--cor-acento-primario)';
                        }, 2000);
                    });
                } catch (e) {
                    alert("Não foi possível copiar. Por favor, copie manualmente (Ctrl+C).");
                }
            }

            // ***
            // *** FUNÇÃO makeDraggable ATUALIZADA (ORIGINAL PARA A JANELA)
            // ***
            function makeDraggable(element, header, onClickCallback) {
                if (!header) header = element;
                let isDragging = false, dragOffsetX = 0, dragOffsetY = 0;

                let moveHandler = (e) => {
                    if (!isDragging) return;
                    e.preventDefault();

                    let newLeft = e.clientX - dragOffsetX;
                    let newTop = e.clientY - dragOffsetY;

                    const rect = element.getBoundingClientRect();
                    if (newLeft < 0) newLeft = 0;
                    if (newTop < 0) newTop = 0;
                    if (newLeft + rect.width > window.innerWidth) newLeft = window.innerWidth - rect.width;
                    if (newTop + rect.height > window.innerHeight) newTop = window.innerHeight - rect.height;

                    element.style.left = newLeft + 'px';
                    element.style.top = newTop + 'px';
                };

                let upHandler = () => {
                    if (isDragging) {
                        isDragging = false;
                    }
                };

                header.addEventListener('mousedown', (e) => {
                    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT' || e.target.closest('.os-btn') || e.target.closest('button')) return;
                    e.preventDefault();
                    isDragging = true;

                    element.style.transition = 'none';
                    element.style.transform = 'none';
                    element.style.margin = '0';

                    const rect = element.getBoundingClientRect();
                    element.style.left = rect.left + 'px';
                    element.style.top = rect.top + 'px';
                    element.style.bottom = 'auto';
                    element.style.right = 'auto';

                    dragOffsetX = e.clientX - rect.left;
                    dragOffsetY = e.clientY - rect.top;
                }, { passive: false });

                // Ensure we don't bind multiple identical listeners if makeDraggable is called multiple times on the same element
                // A quick hack is just bind it globally, it naturally ignores when isDragging is false.
                document.addEventListener('mousemove', moveHandler, { passive: false });
                document.addEventListener('mouseup', upHandler);
            }

            // ***
            // *** FUNÇÃO makeResizable (ORIGINAL)
            // ***
            function makeResizable(element, handle) {
                let startX, startY, startWidth, startHeight;

                handle.onmousedown = function (e) {
                    e = e || window.event;
                    e.preventDefault();

                    startX = e.clientX;
                    startY = e.clientY;
                    startWidth = parseInt(document.defaultView.getComputedStyle(element).width, 10);
                    startHeight = parseInt(document.defaultView.getComputedStyle(element).height, 10);

                    element.style.transition = 'none';

                    document.onmousemove = resizeElement;
                    document.onmouseup = stopResize;
                };

                function resizeElement(e) {
                    e = e || window.event;
                    e.preventDefault();

                    let newWidth = startWidth + e.clientX - startX;
                    let newHeight = startHeight + e.clientY - startY;

                    // Aplicar limites mínimos
                    if (newWidth > MIN_WIDTH) {
                        element.style.width = newWidth + 'px';
                    }
                    if (newHeight > MIN_HEIGHT) {
                        element.style.height = newHeight + 'px';

                        // Ajustar a altura do body da janela para que o conteúdo preencha a nova altura
                        const headerHeight = parseInt(document.defaultView.getComputedStyle(document.getElementById('bau-rede-header')).height, 10);
                        const newBodyHeight = newHeight - headerHeight - 1; // 1px para a borda
                        document.getElementById('bau-rede-body').style.height = newBodyHeight + 'px';
                    }
                }

                function stopResize() {
                    element.style.transition = 'var(--transicao-padrao)';
                    document.onmousemove = null;
                    document.onmouseup = null;
                }
            }
            // *** FIM DAS FUNÇÕES PRINCIPAIS ***

            function escapeHTML(str) {
                if (str === null || str === undefined) return '';
                return str.replace(/[&<>"']/g, function (m) {
                    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
                });
            }

            // --- 2. O ESTILO (CSS) V20.1 (ORIGINAL) ---
            const styles = `
                #bau-command-search, #bau-command-category { box-sizing:border-box; width:100%; margin:8px 0; padding:10px; border:1px solid #6485a5; border-radius:6px; background:var(--cor-fundo-secundario, #173859); color:inherit; }
                #bau-command-count { font-weight:600; }
                #bau-command-results .command-block { border:1px solid #6485a5; border-radius:8px; padding:12px; margin:12px 0; overflow-wrap:anywhere; }
                .bau-command-text { box-sizing:border-box; width:100%; max-width:100%; resize:vertical; font-family:Consolas,monospace; padding:8px; }
                .bau-command-impact { border-left:3px solid #ff9900; padding-left:8px; }

        :root {
            --raio-borda: 4px;
            --transicao-padrao: all 0.2s ease-in-out;
        }
        
        /* *** BOTÃO FLUTUANTE *** */
        #bau-trigger-button {
            position: fixed;
            width: 48px; /* Aumentado */
            height: 48px; /* Aumentado */
            bottom: 20px;
            right: 20px;
            background: linear-gradient(145deg, var(--cor-fundo-terciario), var(--cor-fundo-primario));
            color: var(--cor-acento-primario);
            border: 1px solid var(--cor-borda);
            border-radius: 50%;
            font-size: 24px; /* Aumentado */
            cursor: pointer;
            box-shadow: 0 5px 15px rgba(0,0,0,0.5), 0 0 5px var(--glow-color) inset;
            z-index: 2147483646;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: var(--transicao-padrao);
            user-select: none;
        }
        #bau-trigger-button:hover {
            transform: scale(1.1);
            box-shadow: 0 8px 20px rgba(0,0,0,0.6), 0 0 15px var(--glow-color), 0 0 8px var(--glow-color) inset;
            border-color: var(--cor-acento-hover);
        }
        .bau-svg-icon { width: 1.2em; height: 1.2em; fill: currentColor; }
        
        #bau-rede { 
            position: fixed; 
            z-index: 2147483647; 
            background-color: var(--cor-fundo-primario); 
            border: 1px solid var(--cor-borda); 
            text-align: left; 
            top: 10%; 
            left: 10%; 
            width: 700px; /* Aumentado */
            height: 550px; /* Aumentado */
            font-family: 'Segoe UI', Tahoma, sans-serif; 
            box-shadow: var(--sombra-popup); 
            border-radius: 8px; 
            color: var(--cor-texto-primario); 
            overflow: hidden; 
            display: none; 
        }
        
        /* CABEÇALHO V20.1 */
        #bau-rede-header { 
            padding: 12px 18px; /* Aumentado */ 
            cursor: move; 
            z-index: 10; 
            background-color: var(--cor-fundo-secundario); 
            border-bottom: 1px solid var(--cor-borda); 
            line-height: 28px; /* Aumentado */
            display: flex; 
            justify-content: space-between; 
            align-items: center;
            flex-shrink: 0;
            height: 50px; /* Altura fixa para cálculo do redimensionamento */
        }
        #bau-rede-header h1 { 
            font-size: 18px; /* Aumentado */
            margin: 0; 
            padding: 0; 
            font-weight: 600;
            display: inline-block;
            vertical-align: middle;
        }
        /* Grupo de botões da direita */
        .header-controls-group {
            display: flex;
            align-items: center;
            gap: 15px; /* Aumentado */
        }
        .window-controls { }
        .window-controls span { cursor: pointer; font-weight: bold; font-size: 20px; /* Aumentado */ color: var(--cor-texto-secundario); margin-left: 10px; /* Aumentado */ transition: color 0.2s; font-family: monospace; vertical-align: middle; }
        .window-controls span:hover { color: var(--cor-perigo-hover); }
        
        /* *** CORREÇÃO DE LAYOUT: FORÇAR OS BOTÕES A FICAREM NA LINHA *** */
        .os-switcher { 
            display: flex; 
            align-items: center;
            vertical-align: middle;
        }
        .os-btn {
            background: var(--cor-fundo-primario);
            color: var(--cor-texto-secundario);
            border: 1px solid var(--cor-borda);
            padding: 4px 10px; /* Aumentado */
            font-size: 13px; /* Aumentado */
            border-radius: 5px; cursor: pointer; margin: 0 3px; transition: all 0.2s;
        }
        .os-btn:hover { background: var(--cor-fundo-hover); color: var(--cor-texto-primario); }
        .os-btn.active { background: var(--cor-acento-primario); color: var(--cor-acento-texto); border-color: var(--cor-acento-primario); font-weight: bold; }
        
        /* ALÇAS DE REDIMENSIONAMENTO */
        .bau-resizer-handle {
            position: absolute;
            z-index: 2147483649; 
            background: transparent;
        }
        .bau-resizer-se { 
            bottom: -5px; 
            right: -5px; 
            width: 15px; 
            height: 15px; 
            cursor: nwse-resize; 
        }

        /* Layout original (barra lateral) */
        #bau-rede-body { 
            display: flex; 
            height: calc(100% - 51px); /* 50px do header + 1px da borda */
            flex-grow: 1; 
        }
        
        .bau-sidebar { flex-basis: 160px; /* Aumentado */ flex-shrink: 0; background-color: var(--cor-fundo-secundario); padding: 10px 0; border-right: 1px solid var(--cor-borda); overflow-y: auto; }
        
        .bau-sidebar-btn { 
            background-color: transparent; 
            display: block; 
            width: 100%; 
            border: none; 
            outline: none; 
            cursor: pointer; 
            padding: 15px 20px; /* Aumentado */
            transition: 0.3s; 
            font-size: 15px; /* Aumentado */
            color: var(--cor-texto-secundario); 
            text-align: left; 
            border-left: 4px solid transparent; 
        }
        .bau-sidebar-btn:hover { color: var(--cor-texto-primario); background-color: var(--cor-fundo-hover); }
        .bau-sidebar-btn.active { 
            color: var(--cor-acento-primario); 
            background-color: var(--cor-fundo-primario); 
            border-left: 4px solid var(--cor-acento-primario); 
            font-weight: bold; 
        }
        .bau-sidebar-divider { height: 1px; background-color: var(--cor-borda); margin: 10px; /* Aumentado */ }
        .bau-sidebar-divider.testes-internos { border-top: 1px dashed var(--cor-borda); height: auto; margin: 10px 0; /* Aumentado */ }
        
        /* Wrapper de Conteúdo (Original) */
        .bau-content-wrapper { display: flex; flex-direction: column; flex-grow: 1; overflow: hidden; background: var(--cor-fundo-primario); }
        .bau-content-area { 
            flex-grow: 1; 
            padding: 20px; /* Aumentado */
            overflow-y: auto; 
        }

        .bau-tab-content { display: none; }
        .bau-tab-content p, .bau-tab-content label { font-size: 14px; /* Aumentado */ color: var(--cor-texto-secundario); margin-top: 0; margin-bottom: 8px; /* Aumentado */ display: block; }
        .bau-tab-content input[type="text"] { width: 95%; padding: 10px; /* Aumentado */ margin-bottom: 15px; /* Aumentado */ font-family: "Courier New", monospace; border: 1px solid var(--cor-borda); border-radius: var(--raio-borda); background-color: var(--cor-fundo-secundario); color: var(--cor-texto-primario); font-size: 16px; /* Aumentado */ }
        .input-group { display: flex; justify-content: space-between; }
        .input-half { width: 45% !important; }
        .bau-tab-content h3 { color: var(--cor-texto-primario); font-size: 18px; /* Aumentado */ margin-top: 20px; margin-bottom: 15px; /* Aumentado */ }
        .bau-tab-content h4 { color: var(--cor-texto-primario); border-bottom: 1px solid var(--cor-borda); padding-bottom: 5px; /* Aumentado */ margin-top: 25px; /* Aumentado */ font-size: 16px; /* Aumentado */ }
        .bau-tab-content ul { color: var(--cor-texto-secundario); padding-left: 20px; /* Aumentado */ font-size: 14px; /* Aumentado */ }
        .bau-tab-content li { margin-bottom: 5px; /* Aumentado */ }
        .bau-tab-content code { background: var(--cor-fundo-secundario); padding: 2px 5px; border-radius: 3px; font-family: "Courier New", monospace; }

        .bau-tab-content button { background-color: var(--cor-acento-primario); color: var(--cor-acento-texto); padding: 12px 15px; /* Aumentado */ border: none; border-radius: var(--raio-borda); cursor: pointer; font-size: 16px; /* Aumentado */ font-weight: bold; width: auto; transition: var(--transicao-padrao); }
        .bau-tab-content button:hover { background-color: var(--cor-acento-hover); box-shadow: 0 0 10px var(--glow-hover-color); }
        
        .command-block { margin-bottom: 15px; /* Aumentado */ }
        .command-block label { font-size: 14px; /* Aumentado */ color: var(--cor-texto-primario); }
        .command-block p { font-size: 12px; /* Aumentado */ color: var(--cor-texto-secundario); margin-bottom: 5px; /* Aumentado */ }
        .command-block input { margin-bottom: 8px; /* Aumentado */ }
        .command-block button { width: 95%; }

        .bau-installer-box { background-color: var(--cor-fundo-terciario); border: 1px solid var(--cor-borda); border-radius: var(--raio-borda); padding: 15px; /* Aumentado */ margin-top: 20px; /* Aumentado */ }
        .bau-installer-box label { font-size: 16px; /* Aumentado */ color: var(--cor-texto-primario); font-weight: bold; }
        .bau-installer-box p { font-size: 12px; /* Aumentado */ color: var(--cor-texto-secundario); margin-bottom: 10px; /* Aumentado */ }

        .bau-warning-box { background-color: var(--cor-fundo-terciario); border-left: 4px solid var(--cor-perigo); border-radius: var(--raio-borda); padding: 15px; /* Aumentado */ margin-top: 20px; /* Aumentado */ }
        .bau-warning-box h4 { font-size: 16px; /* Aumentado */ color: var(--cor-perigo); margin: 0 0 10px 0; /* Aumentado */ }
        .bau-warning-box p { font-size: 12px; /* Aumentado */ color: var(--cor-texto-secundario); margin-bottom: 10px; /* Aumentado */ }
        .bau-warning-box label { font-size: 14px; /* Aumentado */ color: var(--cor-texto-primario); font-weight: bold; }

        .registro-box { width: 95%; height: 60px; /* Aumentado */ background: var(--cor-fundo-secundario); color: var(--cor-texto-primario); border: 1px solid var(--cor-borda); border-radius: var(--raio-borda); font-family: "Courier New", monospace; margin-bottom: 10px; /* Aumentado */ padding: 8px; /* Aumentado */ font-size: 14px; /* Aumentado */ }
        .teste-interno-output { width: 95%; height: 100px; /* Aumentado */ background: var(--cor-fundo-secundario); color: var(--cor-texto-primario); border: 1px solid var(--cor-borda); border-radius: var(--raio-borda); font-family: "Courier New", monospace; padding: 10px; /* Aumentado */ white-space: pre-wrap; word-wrap: break-word; font-size: 16px; /* Aumentado */ }

        .bau-radio-group { margin-bottom: 15px; /* Aumentado */ }
        .bau-radio-group label { display: inline-block; margin-right: 20px; /* Aumentado */ color: var(--cor-texto-primario); cursor: pointer; font-size: 12px; /* Aumentado */ }
        .bau-radio-group input[type="radio"] { margin-right: 5px; /* Aumentado */ vertical-align: middle; accent-color: var(--cor-acento-primario); }
        .bau-divider-horizontal { height: 1px; background-color: var(--cor-borda); margin: 30px 0 20px 0; /* Aumentado */ }
        
        .os-commands-block { display: block !important; } /* CORREÇÃO FINAL DE VISIBILIDADE */
        
        #import-export-box { padding: 15px; margin-top: 20px; }
        #import-export-box button { margin-right: 10px; padding: 8px 12px; font-size: 13px; }
        #import-json-area { display: none; width: 95%; height: 150px; margin-top: 10px; background: var(--cor-fundo-secundario); color: var(--cor-texto-primario); font-size: 13px; padding: 8px; }
    `;

            // --- 3. O CONTEÚDO (HTML) V20.1 (Criado via DOM) ---

            const bauElement = document.createElement('div');
            bauElement.id = 'bau-rede';
            bauElement.style.display = 'none'; // Começa escondido

            // -- Header --
            const header = document.createElement('div');
            header.id = 'bau-rede-header';
            const title = document.createElement('h1');
            title.textContent = 'Baú de Acesso Remoto - BAR';
            header.appendChild(title);

            const headerControlsGroup = document.createElement('div');
            headerControlsGroup.className = 'header-controls-group';

            const osSwitcher = document.createElement('div');
            osSwitcher.className = 'os-switcher';
            const btnAuto = document.createElement('button');
            btnAuto.className = 'os-btn active';
            btnAuto.id = 'os-auto';
            btnAuto.textContent = 'Auto';
            osSwitcher.appendChild(btnAuto);
            const btnWin = document.createElement('button');
            btnWin.className = 'os-btn';
            btnWin.id = 'os-win';
            btnWin.textContent = 'Win';
            osSwitcher.appendChild(btnWin);
            const btnMac = document.createElement('button');
            btnMac.className = 'os-btn';
            btnMac.id = 'os-mac';
            btnMac.textContent = 'Mac';
            osSwitcher.appendChild(btnMac);
            const btnLin = document.createElement('button');
            btnLin.className = 'os-btn';
            btnLin.id = 'os-lin';
            btnLin.textContent = 'Lin';
            osSwitcher.appendChild(btnLin);
            headerControlsGroup.appendChild(osSwitcher);

            const controls = document.createElement('div');
            controls.className = 'window-controls';
            const closeBtn = document.createElement('span');
            closeBtn.id = 'bau-close-btn';
            closeBtn.title = 'Fechar Baú';
            closeBtn.innerHTML = ICONS.CLOSE;
            controls.appendChild(closeBtn);
            headerControlsGroup.appendChild(controls);

            header.appendChild(headerControlsGroup);
            bauElement.appendChild(header);

            // -- Body --
            const body = document.createElement('div');
            body.id = 'bau-rede-body';

            // -- Sidebar --
            const sidebar = document.createElement('div');
            sidebar.className = 'bau-sidebar';

            // Lista de abas
            const tabs = [
                { id: 'btn-tab-info', text: 'Info' },
                { id: 'btn-tab-ip-publico', text: 'IP Público' },
                { id: 'btn-tab-velocidade', text: 'Velocidade' },
                { id: 'divider-1', text: '' },
                { id: 'btn-tab-placa-rede', text: 'Placa de Rede' },
                { id: 'btn-tab-ping', text: 'Ping' },
                { id: 'btn-tab-traceroute', text: 'Traceroute' },
                { id: 'btn-tab-pathping', text: 'PathPing/MTR' },
                { id: 'btn-tab-dns', text: 'DNS' },
                { id: 'btn-tab-nmap', text: 'Nmap' },
                { id: 'btn-tab-test-port', text: 'Testar Porta' },
                { id: 'btn-tab-arp', text: 'ARP' },
                { id: 'btn-tab-route', text: 'Route' },
                { id: 'btn-tab-netstat', text: 'Netstat' },
                { id: 'btn-tab-atualizacoes', text: 'Atualizações' },
                { id: 'btn-tab-comandos', text: 'Comandos' },
                { id: 'divider-2', text: '' },
                { id: 'btn-tab-registro', text: 'Registro' }
            ];

            tabs.forEach(tab => {
                if (tab.id.startsWith('divider')) {
                    const divider = document.createElement('div');
                    divider.className = (tab.id === 'divider-1') ? 'bau-sidebar-divider testes-internos' : 'bau-sidebar-divider';
                    sidebar.appendChild(divider);
                } else {
                    const btn = document.createElement('button');
                    btn.className = 'bau-sidebar-btn';
                    btn.id = tab.id;
                    btn.textContent = tab.text;
                    sidebar.appendChild(btn);
                }
            });
            body.appendChild(sidebar); // Adicionado ao 'body'

            // -- Content Wrapper --
            const contentWrapper = document.createElement('div');
            contentWrapper.className = 'bau-content-wrapper';

            // -- Content Area --
            const contentArea = document.createElement('div');
            contentArea.className = 'bau-content-area';

            // *** ALÇA DE REDIMENSIONAMENTO (Handle) ***
            resizeHandle = document.createElement('div');
            resizeHandle.className = 'bau-resizer-handle bau-resizer-se';
            bauElement.appendChild(resizeHandle);
            // *** FIM DA ALÇA DE REDIMENSIONAMENTO ***

            // (Funções Helper de criação de elementos)
            function createTabContent(id, titleText) { const d = document.createElement('div'); d.id = id; d.className = 'bau-tab-content'; const h = document.createElement('h3'); h.textContent = titleText; d.appendChild(h); return d; }
            function createP(text) { const p = document.createElement('p'); p.textContent = text; return p; }
            function createH4(text) { const h = document.createElement('h4'); h.textContent = text; return h; }
            function createUL() { return document.createElement('ul'); }
            function createLI(text) { const l = document.createElement('li'); l.textContent = text; return l; }
            function createLabel(text) { const l = document.createElement('label'); l.textContent = text; return l; }
            function createInput(id, value, isReadOnly = false, className) { const i = document.createElement('input'); i.type = 'text'; i.id = id; if (value) i.value = value; if (isReadOnly) i.readOnly = true; if (className) i.className = className; return i; }
            function createButton(id, text, className) { const b = document.createElement('button'); b.id = id; b.textContent = text; if (className) b.className = className; return b; }
            function createTextarea(id, placeholder, className = 'registro-box') { const t = document.createElement('textarea'); t.id = id; t.className = className; t.placeholder = placeholder; return t; }
            function createPre(id, text) { const p = document.createElement('pre'); p.id = id; p.className = 'teste-interno-output'; if (text) p.textContent = text; return p; }
            function createCommandEntry(os, label, desc, cmd, id, metadata = {}) {
                const div = document.createElement('div');
                div.className = 'command-block os-commands-block os-' + os;
                div.appendChild(createLabel(label));
                if (desc) div.appendChild(createP(desc));
                const inputId = `${os}-${id}`;
                div.appendChild(createP('Terminal: ' + (metadata.shell || 'Consulte a documentação do comando.')));
                div.appendChild(createP('Resultado esperado: ' + (metadata.result || 'Consulte a documentação do comando.')));
                if (metadata.requires) div.appendChild(createP('Requisitos: ' + metadata.requires));
                if (metadata.impact) { const impact = createP('Efeito: ' + metadata.impact); impact.className = 'bau-command-impact'; div.appendChild(impact); }
                const commandField = createTextarea(inputId, '', 'bau-command-text');
                commandField.readOnly = true; commandField.value = cmd;
                commandField.setAttribute('aria-label', 'Comando: ' + label);
                commandField.rows = Math.min(5, Math.max(2, Math.ceil(cmd.length / 68)));
                div.appendChild(commandField);
                const btn = createButton('copy-' + id, 'Copiar Comando', 'bau-copy-btn');
                btn.setAttribute('data-input-id', inputId);
                div.appendChild(btn);
                return div;
            }
            function createInstallerBox(idPrefix, descId, inputId, btnId) {
                const box = document.createElement('div'); box.id = idPrefix + '-installer-box'; box.className = 'bau-installer-box';
                box.appendChild(createLabel('Instalação (Se necessário)'));
                const descP = document.createElement('p'); descP.id = descId; box.appendChild(descP);
                box.appendChild(createInput(inputId, '', true));
                const btn = createButton(btnId, 'Copiar Comando de Instalação', 'bau-copy-btn');
                btn.setAttribute('data-input-id', inputId);
                box.appendChild(btn);
                return box;
            }
            function createWarningBox(content) {
                const box = document.createElement('div'); box.className = 'bau-warning-box';
                const h4 = document.createElement('h4'); h4.textContent = 'Avançado: Forçar Velocidade (Risco)'; box.appendChild(h4);
                box.appendChild(createP('AVISO: Só use isto se souber o que está a fazer. Se forçar 1.0 Gbps e o seu cabo/router não suportar, a sua rede VAI FALHAR. Use o comando "Voltar ao Automático" para reverter.'));
                box.appendChild(createP('No Windows, execute no PowerShell como administrador. Consulte Get-NetAdapterAdvancedProperty -Name ADAPTADOR | Format-List DisplayName,RegistryKeyword,ValidDisplayValues,ValidRegistryValues e substitua os valores conforme o driver. A alteração pode reiniciar a interface e interromper o acesso remoto. No Mac, o "Nome da Placa" é o "Service Name" (ex: "Ethernet"). Encontre-o com: networksetup -listallnetworkservices'));
                box.appendChild(createLabel('1. Nome da Placa (visto no teste acima):'));
                box.appendChild(createInput('placa-nome-input', '', false));
                box.appendChild(createLabel('2. Comando (Admin) para Forçar 1 Gbps Full:'));
                box.appendChild(createInput('placa-force-1g-cmd', '', true));
                const btn1g = createButton('copy-placa-force-1g-btn', 'Copiar Comando (Admin)', 'bau-copy-btn');
                btn1g.setAttribute('data-input-id', 'placa-force-1g-cmd');
                box.appendChild(btn1g);
                box.appendChild(createLabel('3. Comando (Admin) para Voltar ao Automático:'));
                box.appendChild(createInput('placa-force-auto-cmd', '', true));
                const btnAuto = createButton('copy-placa-force-auto-btn', 'Copiar Comando (Admin)', 'bau-copy-btn auto-btn');
                btnAuto.setAttribute('data-input-id', 'placa-force-auto-cmd');
                box.appendChild(btnAuto);
                return box;
            }

            // --- Aba de Informação ---
            const tabInfo = createTabContent('tab-info', 'Informações');
            tabInfo.appendChild(createP('Bem-vindo ao Baú de Acesso Remoto (BAR). Esta ferramenta ajuda-o a diagnosticar problemas de rede.'));
            tabInfo.appendChild(createH4('Como Usar'));
            const ulUse = createUL();
            ulUse.appendChild(createLI('Testes Internos (IP Público, Velocidade): São executados aqui no navegador. Clique no botão para iniciar.'));
            ulUse.appendChild(createLI('Testes Externos (Ping, Nmap, etc.): O "Baú" gera o comando. Você deve copiá-lo e colá-lo no seu terminal (CMD, PowerShell, etc.).'));
            ulUse.appendChild(createLI('Seletor de SO (Win/Mac/Lin): No topo, pode trocar o sistema para ver os comandos de outra pessoa.'));
            ulUse.appendChild(createLI('Registro: Cole os resultados dos seus testes do terminal nas caixas corretas e gere um relatório para imprimir/salvar.'));
            tabInfo.appendChild(ulUse);
            tabInfo.appendChild(createH4('Como Abrir o Terminal'));
            const ulTerm = createUL();
            ulTerm.appendChild(createLI('Windows: Pressione a tecla Windows + R, digite "cmd" (para Prompt) ou "powershell" (recomendado) e pressione Enter.'));
            ulTerm.appendChild(createLI('Mac: Pressione Cmd + Espaço, digite "Terminal" e pressione Enter.'));
            ulTerm.appendChild(createLI('Linux (Ubuntu): Pressione Ctrl + Alt + T.'));
            tabInfo.appendChild(ulTerm);

            // Caixa de Import/Export
            const ieBox = document.createElement('div');
            ieBox.id = 'import-export-box';
            ieBox.appendChild(createH4('Importar/Exportar Comandos'));
            ieBox.appendChild(createP('Guarde ou carregue o seu banco de dados de comandos em formato JSON.'));
            ieBox.appendChild(createButton('btn-export-json', 'Exportar JSON', 'run-test'));
            ieBox.appendChild(createButton('btn-import-json', 'Importar JSON', 'auto-btn'));
            const importArea = createTextarea('import-json-area', 'Cole o conteúdo do seu comandos.json aqui...');
            importArea.style.display = 'none'; // Começa escondido
            ieBox.appendChild(importArea);
            tabInfo.appendChild(ieBox);

            contentArea.appendChild(tabInfo);


            // --- Abas Internas ---
            const tabIpPublico = createTabContent('tab-ip-publico', 'Descobrir Meu IP Público');
            tabIpPublico.appendChild(createP('Este teste usa uma API (api.ipify.org) para descobrir o seu IP público.'));
            tabIpPublico.appendChild(createButton('btn-descobrir-ip-publico', 'Descobrir IP Público', 'run-test'));
            tabIpPublico.appendChild(createPre('meu-ip-publico-output', 'Clique no botão para iniciar...'));
            contentArea.appendChild(tabIpPublico);

            const tabVelocidade = createTabContent('tab-velocidade', 'Teste de Velocidade');
            tabVelocidade.appendChild(createLabel('Teste Interno (Navegador)'));
            tabVelocidade.appendChild(createP('Este teste baixa um ficheiro para estimar a sua velocidade de download.'));
            const radioGroup = document.createElement('div');
            radioGroup.className = 'bau-radio-group';
            radioGroup.appendChild(createLabel('Tamanho do Ficheiro de Teste:'));
            const sizes = ['10', '50', '100'];
            sizes.forEach(size => {
                const label = document.createElement('label');
                const radio = document.createElement('input');
                radio.type = 'radio'; radio.name = 'speedtest-size'; radio.value = size;
                if (size === '50') radio.checked = true;
                label.appendChild(radio); label.appendChild(document.createTextNode(` ${size} MB`));
                radioGroup.appendChild(label);
            });
            tabVelocidade.appendChild(radioGroup);
            tabVelocidade.appendChild(createButton('btn-teste-velocidade', 'Iniciar Teste de Velocidade', 'run-test'));
            tabVelocidade.appendChild(createPre('velocidade-output', 'Clique no botão para iniciar...'));
            const divider = document.createElement('div');
            divider.className = 'bau-divider-horizontal';
            tabVelocidade.appendChild(divider);
            tabVelocidade.appendChild(createLabel('Teste Externo (Terminal)'));
            tabVelocidade.appendChild(createP('Este comando usa o "speedtest-cli" no seu terminal para um teste mais preciso. Requer instalação.'));
            tabVelocidade.appendChild(createLabel('Comando de Teste:'));
            tabVelocidade.appendChild(createInput('speedtest-command-output', '', true));
            const btnSpdCmd = createButton('copy-speedtest-cmd-btn', 'Copiar Comando', 'bau-copy-btn');
            btnSpdCmd.setAttribute('data-input-id', 'speedtest-command-output');
            tabVelocidade.appendChild(btnSpdCmd);
            tabVelocidade.appendChild(createInstallerBox('speedtest', 'speedtest-installer-desc', 'speedtest-install-command', 'copy-speedtest-install-btn'));
            contentArea.appendChild(tabVelocidade);

            // --- Abas de Comando ---

            const tabPlacaRede = createTabContent('tab-placa-rede', 'Info da Placa de Rede');
            tabPlacaRede.appendChild(createP('Este comando verifica as suas placas de rede ativas, o tipo (Cabo/Wi-Fi) e a velocidade negociada (100/1000 Mbps).'));
            tabPlacaRede.appendChild(createP('NOTA: O comando do Windows deve ser colado no "Prompt de Comando" (CMD).'));
            tabPlacaRede.appendChild(createLabel('1. Comando de Diagnóstico:'));
            tabPlacaRede.appendChild(createInput('placa-rede-command-output', '', true));
            const btnPlaca = createButton('copy-placa-rede-btn', 'Copiar Comando', 'bau-copy-btn');
            btnPlaca.setAttribute('data-input-id', 'placa-rede-command-output');
            tabPlacaRede.appendChild(btnPlaca);
            tabPlacaRede.appendChild(createWarningBox());
            contentArea.appendChild(tabPlacaRede);

            const tabPing = createTabContent('tab-ping', 'Teste de Ping');
            tabPing.appendChild(createP('Este comando testa a latência para um host.'));
            tabPing.appendChild(createLabel('IP ou Host Alvo:'));
            tabPing.appendChild(createInput('ping-host-input', '8.8.8.8'));
            tabPing.appendChild(createLabel('Comando de Teste:'));
            tabPing.appendChild(createInput('ping-command-output', '', true));
            const btnPing = createButton('copy-ping-btn', 'Copiar Comando de Teste', 'bau-copy-btn');
            btnPing.setAttribute('data-input-id', 'ping-command-output');
            tabPing.appendChild(btnPing);
            contentArea.appendChild(tabPing);

            const tabTr = createTabContent('tab-traceroute', 'Teste de Traceroute');
            tabTr.appendChild(createP('Este comando mapeia a rota da sua rede até o host.'));
            tabTr.appendChild(createLabel('IP ou Host Alvo:'));
            tabTr.appendChild(createInput('tr-host-input', 'google.com'));
            tabTr.appendChild(createLabel('Comando de Teste:'));
            tabTr.appendChild(createInput('tr-command-output', '', true));
            const btnTr = createButton('copy-tr-btn', 'Copiar Comando de Teste', 'bau-copy-btn');
            btnTr.setAttribute('data-input-id', 'tr-command-output');
            tabTr.appendChild(btnTr);
            contentArea.appendChild(tabTr);

            const tabPp = createTabContent('tab-pathping', 'Teste de PathPing / MTR');
            tabPp.appendChild(createP('Combina Ping e Traceroute.'));
            tabPp.appendChild(createLabel('IP ou Host Alvo:'));
            tabPp.appendChild(createInput('pp-host-input', 'google.com'));
            tabPp.appendChild(createLabel('Comando de Teste:'));
            tabPp.appendChild(createInput('pp-command-output', '', true));
            const btnPp = createButton('copy-pp-btn', 'Copiar Comando de Teste', 'bau-copy-btn');
            btnPp.setAttribute('data-input-id', 'pp-command-output');
            tabPp.appendChild(btnPp);
            tabPp.appendChild(createInstallerBox('pp', 'pp-installer-desc', 'pp-install-command', 'copy-pp-install-btn'));
            contentArea.appendChild(tabPp);

            const tabNmap = createTabContent('tab-nmap', 'Scan de Portas (Nmap)');
            tabNmap.appendChild(createP('Escaneia portas abertas. Requer instalação prévia.'));
            tabNmap.appendChild(createLabel('IP Alvo (ex: 192.168.1.1):'));
            tabNmap.appendChild(createInput('nmap-host-input', '127.0.0.1'));
            tabNmap.appendChild(createLabel('Comando de Teste:'));
            tabNmap.appendChild(createInput('nmap-command-output', '', true));
            const btnNmap = createButton('copy-nmap-btn', 'Copiar Comando de Teste', 'bau-copy-btn');
            btnNmap.setAttribute('data-input-id', 'nmap-command-output');
            tabNmap.appendChild(btnNmap);
            tabNmap.appendChild(createInstallerBox('nmap', 'nmap-installer-desc', 'nmap-install-command', 'copy-nmap-install-btn'));
            contentArea.appendChild(tabNmap);

            const tabTestPort = createTabContent('tab-test-port', 'Testar Porta Única');
            tabTestPort.appendChild(createP('Verifica rapidamente se uma porta específica está aberta num host.'));
            const inputGroup = document.createElement('div');
            inputGroup.className = 'input-group';
            const hostGroup = document.createElement('div');
            hostGroup.className = 'input-half';
            hostGroup.appendChild(createLabel('IP ou Host Alvo:'));
            hostGroup.appendChild(createInput('port-host-input', 'google.com', false));
            inputGroup.appendChild(hostGroup);
            const portGroup = document.createElement('div');
            portGroup.className = 'input-half';
            portGroup.appendChild(createLabel('Porta (ex: 80, 443):'));
            portGroup.appendChild(createInput('port-num-input', '443', false));
            inputGroup.appendChild(portGroup);
            tabTestPort.appendChild(inputGroup);
            tabTestPort.appendChild(createLabel('Comando de Teste:'));
            tabTestPort.appendChild(createInput('port-command-output', '', true));
            const btnPort = createButton('copy-port-btn', 'Copiar Comando de Teste', 'bau-copy-btn');
            btnPort.setAttribute('data-input-id', 'port-command-output');
            tabTestPort.appendChild(btnPort);
            contentArea.appendChild(tabTestPort);

            const tabNetstat = createTabContent('tab-netstat', 'Conexões Ativas (Netstat)');
            tabNetstat.appendChild(createP('Mostra as conexões de rede ativas na sua máquina.'));
            tabNetstat.appendChild(createLabel('Comando de Teste:'));
            tabNetstat.appendChild(createInput('netstat-command-output', 'netstat -an', true));
            const btnNetstat = createButton('copy-netstat-btn', 'Copiar Comando de Teste', 'bau-copy-btn');
            btnNetstat.setAttribute('data-input-id', 'netstat-command-output');
            tabNetstat.appendChild(btnNetstat);
            contentArea.appendChild(tabNetstat);

            const tabDns = createTabContent('tab-dns', 'Teste de DNS (nslookup)');
            tabDns.appendChild(createP('Verifica a resolução de nomes de domínio para IP.'));
            tabDns.appendChild(createLabel('Domínio para consultar (ex: google.com):'));
            tabDns.appendChild(createInput('dns-host-input', 'google.com', false));
            tabDns.appendChild(createLabel('Comando de Teste:'));
            tabDns.appendChild(createInput('dns-command-output', '', true));
            const btnDns = createButton('copy-dns-btn', 'Copiar Comando de Teste', 'bau-copy-btn');
            btnDns.setAttribute('data-input-id', 'dns-command-output');
            tabDns.appendChild(btnDns);
            contentArea.appendChild(tabDns);

            const tabArp = createTabContent('tab-arp', 'Tabela ARP');
            tabArp.appendChild(createP('Mostra a cache ARP (mapeamento de IP para MAC) da rede local.'));
            tabArp.appendChild(createLabel('Comando de Teste:'));
            tabArp.appendChild(createInput('arp-command-output', 'arp -a', true));
            const btnArp = createButton('copy-arp-btn', 'Copiar Comando de Teste', 'bau-copy-btn');
            btnArp.setAttribute('data-input-id', 'arp-command-output');
            tabArp.appendChild(btnArp);
            contentArea.appendChild(tabArp);

            const tabRoute = createTabContent('tab-route', 'Tabela de Roteamento');
            tabRoute.appendChild(createP('Mostra as rotas de rede do seu sistema.'));
            tabRoute.appendChild(createLabel('Comando de Teste:'));
            tabRoute.appendChild(createInput('route-command-output', '', true));
            const btnRoute = createButton('copy-route-btn', 'Copiar Comando de Teste', 'bau-copy-btn');
            btnRoute.setAttribute('data-input-id', 'route-command-output');
            tabRoute.appendChild(btnRoute);
            contentArea.appendChild(tabRoute);

            const tabAtualizacoes = createTabContent('tab-atualizacoes', 'Atualização de Sistema e Pacotes');
            tabAtualizacoes.appendChild(createP('Manter o sistema e os pacotes atualizados é crucial para a segurança e performance.'));
            const winUpdates1 = document.createElement('div');
            winUpdates1.id = 'win-updates1-cmd';
            winUpdates1.className = 'os-commands-block os-win';
            winUpdates1.appendChild(createLabel('Abrir configurações do Windows Update (PowerShell):'));
            winUpdates1.appendChild(createInput('win-update-cmd', '', true));
            const btnWinUp = createButton('copy-win-update-cmd', 'Copiar Comando', 'bau-copy-btn');
            btnWinUp.setAttribute('data-input-id', 'win-update-cmd');
            winUpdates1.appendChild(btnWinUp);
            tabAtualizacoes.appendChild(winUpdates1);
            const winUpdates2 = document.createElement('div');
            winUpdates2.id = 'win-updates2-cmd';
            winUpdates2.className = 'os-commands-block os-win';
            winUpdates2.appendChild(createLabel('Comando 2 (Pacotes Winget):'));
            winUpdates2.appendChild(createInput('win-pkg-cmd', '', true));
            const btnWinPkg = createButton('copy-win-pkg-cmd', 'Copiar Comando', 'bau-copy-btn');
            btnWinPkg.setAttribute('data-input-id', 'win-pkg-cmd');
            winUpdates2.appendChild(btnWinPkg);
            tabAtualizacoes.appendChild(winUpdates2);
            const nixUpdates = document.createElement('div');
            nixUpdates.id = 'nix-updates-cmd';
            nixUpdates.className = 'os-commands-block os-mac os-linux';
            nixUpdates.appendChild(createLabel('Comando de Atualização (Mac/Linux):'));
            nixUpdates.appendChild(createInput('nix-update-cmd', '', true));
            const btnNixUp = createButton('copy-nix-update-cmd', 'Copiar Comando', 'bau-copy-btn');
            btnNixUp.setAttribute('data-input-id', 'nix-update-cmd');
            nixUpdates.appendChild(btnNixUp);
            tabAtualizacoes.appendChild(nixUpdates);
            contentArea.appendChild(tabAtualizacoes);

            // Aba Comandos (Container Vazio)
            const tabComandos = createTabContent('tab-comandos', 'Comandos de Acesso Rápido');
            tabComandos.appendChild(createP('Escolha Win, Mac ou Lin. Copie no terminal indicado e substitua os campos em MAIÚSCULAS. Resultado esperado não é uma execução real.'));
            const commandSearch = createInput('bau-command-search', '');
            commandSearch.type = 'search'; commandSearch.placeholder = 'Pesquisar comando, finalidade ou resultado...';
            commandSearch.setAttribute('aria-label', 'Pesquisar comandos');
            const commandCategory = document.createElement('select'); commandCategory.id = 'bau-command-category';
            commandCategory.setAttribute('aria-label', 'Categoria dos comandos');
            const commandCount = createP(''); commandCount.id = 'bau-command-count'; commandCount.setAttribute('aria-live', 'polite');
            const commandResults = document.createElement('div'); commandResults.id = 'bau-command-results';
            const restoreCommands = createButton('bau-command-restore', 'Restaurar catálogo padrão');
            restoreCommands.onclick = () => {
                if (restoreCommands.dataset.confirm !== 'yes') { restoreCommands.dataset.confirm = 'yes'; restoreCommands.textContent = 'Confirmar restauração do catálogo'; return; }
                delete restoreCommands.dataset.confirm; restoreCommands.textContent = 'Restaurar catálogo padrão';
                ctx.ajaStorage.removeItem('bau_commandDatabase_v1'); window.commandDatabase = catalog.defaults();
                commandSearch.value = ''; commandCategory.value = ''; populateCommandsTab();
            };
            tabComandos.append(commandSearch, commandCategory, commandCount, restoreCommands, commandResults);
            commandSearch.addEventListener('input', populateCommandsTab);
            commandCategory.addEventListener('change', populateCommandsTab);
            contentArea.appendChild(tabComandos);


            // Aba Registro (Atualizada)
            const tabRegistro = createTabContent('tab-registro', 'Registro de Testes');
            tabRegistro.appendChild(createP('Cole o resultado de cada teste na sua caixa correspondente.'));
            tabRegistro.appendChild(createLabel('Resultado do IP Público:'));
            tabRegistro.appendChild(createTextarea('registro-ip-publico-input', 'Cole o resultado do teste "IP Público" aqui...'));
            tabRegistro.appendChild(createLabel('Resultado da Velocidade (Navegador):'));
            tabRegistro.appendChild(createTextarea('registro-velocidade-input', 'Cole o resultado do "Teste de Velocidade" aqui...'));
            tabRegistro.appendChild(createLabel('Resultado da Placa de Rede:'));
            tabRegistro.appendChild(createTextarea('registro-placa-rede-input', 'Cole o resultado do teste da Placa de Rede aqui...'));
            tabRegistro.appendChild(createLabel('Resultado do Ping:'));
            tabRegistro.appendChild(createTextarea('registro-ping-input', 'Cole o resultado do Ping aqui...'));
            tabRegistro.appendChild(createLabel('Resultado do Traceroute:'));
            tabRegistro.appendChild(createTextarea('registro-tr-input', 'Cole o resultado do Traceroute aqui...'));
            tabRegistro.appendChild(createLabel('Resultado do PathPing/MTR:'));
            tabRegistro.appendChild(createTextarea('registro-pp-input', 'Cole o resultado do PathPing/MTR aqui...'));
            tabRegistro.appendChild(createLabel('Resultado do Nmap:'));
            tabRegistro.appendChild(createTextarea('registro-nmap-input', 'Cole o resultado do Nmap aqui...'));
            tabRegistro.appendChild(createLabel('Resultado do Teste de Porta:'));
            tabRegistro.appendChild(createTextarea('registro-test-port-input', 'Cole o resultado do "Teste de Porta" aqui...'));
            tabRegistro.appendChild(createLabel('Resultado do Netstat:'));
            tabRegistro.appendChild(createTextarea('registro-netstat-input', 'Cole o resultado do Netstat aqui...'));
            tabRegistro.appendChild(createLabel('Resultado do DNS (nslookup):'));
            tabRegistro.appendChild(createTextarea('registro-dns-input', 'Cole o resultado do "DNS" aqui...'));
            tabRegistro.appendChild(createLabel('Resultado da Tabela ARP:'));
            tabRegistro.appendChild(createTextarea('registro-arp-input', 'Cole o resultado do "ARP" aqui...'));
            tabRegistro.appendChild(createLabel('Resultado da Tabela de Roteamento:'));
            tabRegistro.appendChild(createTextarea('registro-route-input', 'Cole o resultado do "Route" aqui...'));
            tabRegistro.appendChild(createLabel('Resultado do Speedtest-CLI (Terminal):'));
            tabRegistro.appendChild(createTextarea('registro-speedtest-cli-input', 'Cole o resultado do "speedtest-cli" aqui...'));
            tabRegistro.appendChild(createLabel('Resultado das Atualizações:'));
            tabRegistro.appendChild(createTextarea('registro-updates-input', 'Cole o resultado das atualizações aqui...'));
            tabRegistro.appendChild(createLabel('Resultados dos Comandos:'));
            tabRegistro.appendChild(createTextarea('registro-comandos-input', 'Cole o resultado dos "Comandos" aqui...'));

            tabRegistro.appendChild(document.createElement('br'));
            tabRegistro.appendChild(document.createElement('br'));
            tabRegistro.appendChild(createButton('print-registro-btn', 'Gerar Relatório para Print'));
            contentArea.appendChild(tabRegistro);

            contentWrapper.appendChild(contentArea); // Adiciona a área de conteúdo ao wrapper
            body.appendChild(contentWrapper); // Adiciona o wrapper ao body
            bauElement.appendChild(body); // Adiciona o body ao elemento principal

            // *** ALÇA DE REDIMENSIONAMENTO (Handle) ***
            resizeHandle = document.createElement('div'); // <<< USADO A VARIÁVEL DECLARADA NO INÍCIO
            resizeHandle.className = 'bau-resizer-handle bau-resizer-se';
            bauElement.appendChild(resizeHandle);
            // *** FIM DA ALÇA DE REDIMENSIONAMENTO ***

            // --- 4. INJETAR O BAÚ E O BOTÃO ---
            const styleSheet = document.createElement("style");
            styleSheet.id = "bau-rede-styles";
            styleSheet.innerText = styles;
            document.head.appendChild(styleSheet); window.AjaModular.scopeStyle('bar',styleSheet);
            document.body.appendChild(bauElement);

            // --- 5. ATIVAR A LÓGICA V20.1 ---

            applyThemeColors(DESIGN_COLORS);

            // 2. Torna a janela principal arrastável (JANELA)
            makeDraggable(bauElement, header);

            // 4. Torna a janela redimensionável (usando a nova alça)
            makeResizable(bauElement, resizeHandle);

            // O closeBtn ainda precisa da sua própria função para fechar diretamente.
            closeBtn.onclick = function () {
                bauElement.style.display = 'none';
                const triggerBtn = document.getElementById('bau-trigger-button');
                if (triggerBtn && getComputedStyle(triggerBtn).opacity !== '0') { // VERIFICACAO NOVA
                    triggerBtn.style.display = 'flex';
                }
            };

            // Event Listener Único para todos os botões "Copiar"
            bauElement.addEventListener('click', function (e) {
                if (e.target.classList.contains('bau-copy-btn')) {
                    const inputId = e.target.getAttribute('data-input-id');
                    if (inputId) {
                        copyCommand(inputId, e.target);
                    }
                }
            });

            // --- Lógica dos Testes Internos ---
            document.getElementById('btn-descobrir-ip-publico').onclick = async function () {
                const btn = document.getElementById('btn-descobrir-ip-publico');
                const output = document.getElementById('meu-ip-publico-output');
                btn.disabled = true; btn.textContent = 'Aguarde...';
                output.textContent = 'A contactar api.ipify.org...';
                try {
                    const response = await ctx.safeFetch('https://api.ipify.org');
                    if (!response.ok) throw new Error(`Status da resposta: ${response.status}`);
                    const ip = await response.text();
                    output.textContent = `Seu IP Público é: ${ip}`;
                } catch (e) {
                    output.textContent = `Erro ao encontrar IP: ${e.message}`;
                } finally {
                    btn.disabled = false; btn.textContent = 'Descobrir IP Público';
                }
            };

            document.getElementById('btn-teste-velocidade').onclick = async function () {
                const btn = document.getElementById('btn-teste-velocidade');
                const output = document.getElementById('velocidade-output');
                btn.disabled = true; btn.textContent = 'A testar...';
                const sizeValue = document.querySelector('input[name="speedtest-size"]:checked').value;
                let testUrl, fileSizeInBytes;
                switch (sizeValue) {
                    case '10': testUrl = 'https://cachefly.cachefly.net/10mb.test'; fileSizeInBytes = 10 * 1024 * 1024; break;
                    case '100': testUrl = 'https://cachefly.cachefly.net/100mb.test'; fileSizeInBytes = 100 * 1024 * 1024; break;
                    case '50': default: testUrl = 'https://cachefly.cachefly.net/50mb.test'; fileSizeInBytes = 50 * 1024 * 1024;
                }
                output.textContent = `A iniciar download de ${fileSizeInBytes / 1024 / 1024}MB...`;
                try {
                    const startTime = performance.now();
                    const response = await ctx.safeFetch(testUrl + '?t=' + new Date().getTime());
                    if (!response.ok) throw new Error(`Erro no servidor: ${response.status}`);
                    await response.blob();
                    const endTime = performance.now();
                    const durationInSeconds = (endTime - startTime) / 1000;
                    const bitsPerSecond = (fileSizeInBytes * 8) / durationInSeconds;
                    const mbps = (bitsPerSecond / 1000000).toFixed(2);
                    output.textContent = `Velocidade de Download: ${mbps} Mbps\n(Tamanho: ${sizeValue}MB / Tempo: ${durationInSeconds.toFixed(2)}s)`;
                } catch (e) {
                    output.textContent = `Erro no teste: ${e.message}. Tente novamente.`;
                } finally {
                    btn.disabled = false; btn.textContent = 'Iniciar Teste de Velocidade';
                }
            };

            // --- Lógica dos Comandos (Funções de Atualização) ---
            const placaRedeCmdOutput = document.getElementById('placa-rede-command-output');
            const placaNomeInput = document.getElementById('placa-nome-input');
            const placaForce1gCmd = document.getElementById('placa-force-1g-cmd');
            const placaForceAutoCmd = document.getElementById('placa-force-auto-cmd');
            function updatePlacaRedeCmd() {
                const os = getActiveOS();
                if (os === 'win') {
                    placaRedeCmdOutput.value = "powershell -Command \"Get-NetAdapter -Physical | Where-Object Status -eq 'Up' | Format-Table Name, LinkSpeed, MediaType -AutoSize\"";
                } else if (os === 'mac') {
                    placaRedeCmdOutput.value = "system_profiler SPNetworkDataType | grep -E 'Interfaces:|Ethernet:|Type:|Speed:|Media Subtype:'";
                } else { // linux
                    placaRedeCmdOutput.value = "ip a | grep 'state UP' -A 2 && echo \"--- Velocidade Ethernet (1000=1Gbs) ---\" && cat /sys/class/net/e*/speed 2>/dev/null && echo \"--- Info Wi-Fi ---\" && iwconfig 2>/dev/null";
                }
            }
            function updatePlacaForceCmds() {
                const os = getActiveOS();
                const adapterName = placaNomeInput.value || 'NOME_DA_PLACA';
                if (os === 'win') {
                    placaForce1gCmd.value = `Set-NetAdapterAdvancedProperty -Name '${adapterName.replace(/'/g, "''")}' -RegistryKeyword '*SpeedDuplex' -RegistryValue 'VALOR_1G_DO_DRIVER'`;
                    placaForceAutoCmd.value = `Set-NetAdapterAdvancedProperty -Name '${adapterName.replace(/'/g, "''")}' -RegistryKeyword '*SpeedDuplex' -RegistryValue 'VALOR_AUTO_DO_DRIVER'`;
                } else if (os === 'mac') {
                    placaForce1gCmd.value = `sudo networksetup -setmedia '${adapterName}' 1000baseT`;
                    placaForceAutoCmd.value = `sudo networksetup -setmedia '${adapterName}' autoselect`;
                } else { // linux
                    placaForce1gCmd.value = `sudo ethtool -s ${adapterName} speed 1000 duplex full autoneg off`;
                    placaForceAutoCmd.value = `sudo ethtool -s ${adapterName} autoneg on`;
                }
            }
            placaNomeInput.onkeyup = updatePlacaForceCmds;

            const pingHostInput = document.getElementById('ping-host-input');
            const pingCmdOutput = document.getElementById('ping-command-output');
            function updatePingCmd() { const os = getActiveOS(); pingCmdOutput.value = (os === 'win') ? `ping -n 4 ${pingHostInput.value}` : `ping -c 4 ${pingHostInput.value}`; }
            pingHostInput.onkeyup = updatePingCmd;

            const trHostInput = document.getElementById('tr-host-input');
            const trCmdOutput = document.getElementById('tr-command-output');
            function updateTrCmd() { const os = getActiveOS(); trCmdOutput.value = (os === 'win') ? `tracert ${trHostInput.value}` : `traceroute ${trHostInput.value}`; }
            trHostInput.onkeyup = updateTrCmd;

            const ppHostInput = document.getElementById('pp-host-input');
            const ppCmdOutput = document.getElementById('pp-command-output');
            const ppInstallerBox = document.getElementById('pp-installer-box');
            const ppInstallerDesc = document.getElementById('pp-installer-desc');
            const ppInstallCommand = document.getElementById('pp-install-command');
            function updatePpCmd() {
                const os = getActiveOS();
                const host = ppHostInput.value;
                if (os === 'win') {
                    ppCmdOutput.value = `pathping ${host}`;
                    ppInstallerBox.style.display = 'block';
                    ppInstallerDesc.textContent = "O 'pathping' já vem instalado por padrão no Windows.";
                    document.getElementById('copy-pp-install-btn').style.display = 'none';
                } else {
                    ppCmdOutput.value = `mtr -r -c 10 ${host}`;
                    ppInstallerBox.style.display = 'block';
                    document.getElementById('copy-pp-install-btn').style.display = 'block';
                    if (os === 'mac') {
                        ppInstallerDesc.textContent = "Se o 'mtr' não for encontrado, instale-o com Homebrew:";
                        ppInstallCommand.value = "brew install mtr";
                    } else { // linux
                        ppInstallerDesc.textContent = "Se o 'mtr' não for encontrado (Ubuntu/Debian):";
                        ppInstallCommand.value = "sudo apt update && sudo apt install mtr";
                    }
                }
            }
            ppHostInput.onkeyup = updatePpCmd;

            const nmapHostInput = document.getElementById('nmap-host-input');
            const nmapCmdOutput = document.getElementById('nmap-command-output');
            const nmapInstallerDesc = document.getElementById('nmap-installer-desc');
            const nmapInstallCommand = document.getElementById('nmap-install-command');
            function updateNmapCmd() {
                const os = getActiveOS();
                nmapCmdOutput.value = `nmap -sT ${nmapHostInput.value}`;
                if (os === 'win') {
                    nmapInstallerDesc.textContent = "O Nmap precisa de ser instalado. Use o Winget (Windows 10/11):";
                    nmapInstallCommand.value = "winget install Insecure.Nmap";
                } else if (os === 'mac') {
                    nmapInstallerDesc.textContent = "Instale o Nmap com Homebrew:";
                    nmapInstallCommand.value = "brew install nmap";
                } else { // linux
                    nmapInstallerDesc.textContent = "Instale o Nmap (Ubuntu/Debian):";
                    nmapInstallCommand.value = "sudo apt update && sudo apt install nmap";
                }
            }
            nmapHostInput.onkeyup = updateNmapCmd;

            const portHostInput = document.getElementById('port-host-input');
            const portNumInput = document.getElementById('port-num-input');
            const portCmdOutput = document.getElementById('port-command-output');
            function updatePortCmd() {
                const os = getActiveOS();
                const host = portHostInput.value || 'HOST';
                const port = portNumInput.value || 'PORTA';
                if (os === 'win') {
                    portCmdOutput.value = `powershell -Command "Test-NetConnection -ComputerName ${host} -Port ${port}"`;
                } else { // mac/linux
                    portCmdOutput.value = `nc -vz ${host} ${port}`;
                }
            }
            portHostInput.onkeyup = updatePortCmd;
            portNumInput.onkeyup = updatePortCmd;

            const dnsHostInput = document.getElementById('dns-host-input');
            const dnsCmdOutput = document.getElementById('dns-command-output');
            function updateDnsCmd() { dnsCmdOutput.value = `nslookup ${dnsHostInput.value}`; }
            dnsHostInput.onkeyup = updateDnsCmd;

            const arpCmdOutput = document.getElementById('arp-command-output');
            function updateArpCmd() { arpCmdOutput.value = "arp -a"; }

            const routeCmdOutput = document.getElementById('route-command-output');
            function updateRouteCmd() {
                const os = getActiveOS();
                routeCmdOutput.value = (os === 'win') ? "route print" : "netstat -r";
            }

            const speedtestCmdOutput = document.getElementById('speedtest-command-output');
            const speedtestInstallerDesc = document.getElementById('speedtest-installer-desc');
            const speedtestInstallCommand = document.getElementById('speedtest-install-command');
            function updateSpeedtestCmd() {
                const os = getActiveOS();
                speedtestCmdOutput.value = "speedtest.exe"; // Comando para Ookla
                if (os === 'win') {
                    speedtestInstallerDesc.textContent = "Instale com Winget (Windows 10/11):";
                    speedtestInstallCommand.value = "winget install Ookla.Speedtest.CLI";
                } else if (os === 'mac') {
                    speedtestInstallerDesc.textContent = "Instale com Homebrew:";
                    speedtestInstallCommand.value = "brew install speedtest";
                    speedtestCmdOutput.value = "speedtest";
                } else { // linux
                    speedtestInstallerDesc.textContent = "Instale com apt (Ubuntu/Debian):";
                    speedtestInstallCommand.value = "sudo apt update && sudo apt install speedtest-cli";
                    speedtestCmdOutput.value = "speedtest-cli";
                }
            }

            const winUp1 = document.getElementById('win-updates1-cmd');
            const winUp2 = document.getElementById('win-updates2-cmd');
            const nixUp = document.getElementById('nix-updates-cmd');
            const nixUpCmd = document.getElementById('nix-update-cmd');
            function updateAtualizacoesCmd() {
                const os = getActiveOS();
                if (os === 'win') {
                    winUp1.style.display = 'block';
                    winUp2.style.display = 'block';
                    nixUp.style.display = 'none';
                    document.getElementById('win-update-cmd').value = "Start-Process 'ms-settings:windowsupdate'";
                    document.getElementById('win-pkg-cmd').value = "winget upgrade --all";
                } else {
                    winUp1.style.display = 'none';
                    winUp2.style.display = 'none';
                    nixUp.style.display = 'block';
                    if (os === 'mac') {
                        nixUpCmd.value = "brew update && brew upgrade";
                    } else { // linux
                        nixUpCmd.value = "sudo apt update && sudo apt upgrade";
                    }
                }
            }

            // Lógica para a aba Comandos
            function populateCommandsTab() {
                const os = getActiveOS();
                const titles = window.commandDatabase.filter(group => group.commands.some(cmd => cmd.os[os])).map(group => group.title);
                const selected = titles.includes(commandCategory.value) ? commandCategory.value : '';
                commandCategory.replaceChildren();
                for (const title of ['', ...new Set(titles)]) { const option = document.createElement('option'); option.value = title; option.textContent = title || 'Todas as categorias'; commandCategory.appendChild(option); }
                commandCategory.value = selected;
                const found = catalog.search(window.commandDatabase, os, commandSearch.value, selected);
                const total = window.commandDatabase.reduce((count,group) => count + group.commands.filter(cmd => cmd.os[os]).length,0);
                const visible = found.reduce((count,group) => count + group.commands.length,0);
                commandCount.textContent = `${visible} de ${total} comandos — ${ {win:'Windows',mac:'macOS',linux:'Linux'}[os] || 'selecione um sistema' }`;
                commandResults.replaceChildren();
                if (!visible) commandResults.appendChild(createP('Nenhum comando encontrado. Ajuste a pesquisa ou escolha outro sistema.'));
                found.forEach(category => {
                    commandResults.appendChild(createH4(category.title));
                    category.commands.forEach(cmd => commandResults.appendChild(createCommandEntry(os, cmd.label, cmd.desc, cmd.os[os], cmd.id, cmd)));
                });
            }

            // Lógica da Aba de Registro
            document.getElementById('print-registro-btn').onclick = function () {
                // Coletar dados
                const ipResult = document.getElementById('registro-ip-publico-input').value;
                const velResult = document.getElementById('registro-velocidade-input').value;
                const placaResult = document.getElementById('registro-placa-rede-input').value;
                const pingResult = document.getElementById('registro-ping-input').value;
                const trResult = document.getElementById('registro-tr-input').value;
                const ppResult = document.getElementById('registro-pp-input').value;
                const nmapResult = document.getElementById('registro-nmap-input').value;
                const portResult = document.getElementById('registro-test-port-input').value;
                const netstatResult = document.getElementById('registro-netstat-input').value;
                const dnsResult = document.getElementById('registro-dns-input').value;
                const arpResult = document.getElementById('registro-arp-input').value;
                const routeResult = document.getElementById('registro-route-input').value;
                const speedCliResult = document.getElementById('registro-speedtest-cli-input').value;
                const updatesResult = document.getElementById('registro-updates-input').value;
                const comandosResult = document.getElementById('registro-comandos-input').value;

                const reportWindow = window.open('', 'PrintWindow', 'width=800,height=600');
                reportWindow.document.write('<html><head><title>Relatório de Testes de Rede</title>');
                reportWindow.document.write(`
            <style>
                body { font-family: 'Segoe UI', Tahoma, sans-serif; margin: 20px; /*bg-removido*/; color: #000; }
                pre { font-family: "Courier New", monospace; /*bg-removido*/; padding: 15px; border: 1px solid #ccc; border-radius: 5px; white-space: pre-wrap; word-wrap: break-word; }
                h1 { border-bottom: 2px solid #666; padding-bottom: 5px; color: #333; }
                h2 { /*bg-removido*/; padding: 5px 10px; border-radius: 5px; color: #000; margin-top: 10px; }
                button { /*bg-removido*/; color: white; padding: 10px 15px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; }
                #report-container { display: flex; flex-wrap: wrap; justify-content: space-between; }
                .test-block { width: 48%; margin-bottom: 20px; vertical-align: top; display: inline-block; page-break-inside: avoid; }
                @media print { .no-print { display: none; } h1, h2 { page-break-after: avoid; } pre { page-break-inside: avoid; } }
            </style>
        `);
                reportWindow.document.write('</head><body>');
                reportWindow.document.write('<h1>Relatório de Testes de Rede</h1>');
                reportWindow.document.write('<p class="no-print">Resultados colados do terminal. Use Ctrl+P para imprimir ou salvar como PDF.</p>');
                reportWindow.document.write('<button class="no-print" onclick="window.print()">Imprimir Relatório / Salvar como PDF</button>');
                reportWindow.document.write('<div id="report-container">');

                if (ipResult) { reportWindow.document.write('<div class="test-block"><h2>Resultado do IP Público</h2><pre>' + escapeHTML(ipResult) + '</pre></div>'); }
                if (velResult) { reportWindow.document.write('<div class="test-block"><h2>Velocidade (Navegador)</h2><pre>' + escapeHTML(velResult) + '</pre></div>'); }
                if (placaResult) { reportWindow.document.write('<div class="test-block"><h2>Resultados da Placa de Rede</h2><pre>' + escapeHTML(placaResult) + '</pre></div>'); }
                if (pingResult) { reportWindow.document.write('<div class="test-block"><h2>Resultados do Ping</h2><pre>' + escapeHTML(pingResult) + '</pre></div>'); }
                if (trResult) { reportWindow.document.write('<div class="test-block"><h2>Resultados do Traceroute</h2><pre>' + escapeHTML(trResult) + '</pre></div>'); }
                if (ppResult) { reportWindow.document.write('<div class="test-block"><h2>Resultados do PathPing / MTR</h2><pre>' + escapeHTML(ppResult) + '</pre></div>'); }
                if (nmapResult) { reportWindow.document.write('<div class="test-block"><h2>Resultados do Nmap</h2><pre>' + escapeHTML(nmapResult) + '</pre></div>'); }
                if (portResult) { reportWindow.document.write('<div class="test-block"><h2>Resultados do Teste de Porta</h2><pre>' + escapeHTML(portResult) + '</pre></div>'); }
                if (netstatResult) { reportWindow.document.write('<div class="test-block"><h2>Resultados do Netstat</h2><pre>' + escapeHTML(netstatResult) + '</pre></div>'); }
                if (dnsResult) { reportWindow.document.write('<div class="test-block"><h2>Resultados do DNS (nslookup)</h2><pre>' + escapeHTML(dnsResult) + '</pre></div>'); }
                if (arpResult) { reportWindow.document.write('<div class="test-block"><h2>Resultados da Tabela ARP</h2><pre>' + escapeHTML(arpResult) + '</pre></div>'); }
                if (routeResult) { reportWindow.document.write('<div class="test-block"><h2>Resultados da Tabela de Roteamento</h2><pre>' + escapeHTML(routeResult) + '</pre></div>'); }
                if (speedCliResult) { reportWindow.document.write('<div class="test-block"><h2>Speedtest-CLI (Terminal)</h2><pre>' + escapeHTML(speedCliResult) + '</pre></div>'); }
                if (updatesResult) { reportWindow.document.write('<div class="test-block"><h2>Resultados das Atualizações</h2><pre>' + escapeHTML(updatesResult) + '</pre></div>'); }
                if (comandosResult) { reportWindow.document.write('<div class="test-block"><h2>Resultados dos Comandos</h2><pre>' + escapeHTML(comandosResult) + '</pre></div>'); }

                reportWindow.document.write('</div>'); // Fecha o container principal
                reportWindow.document.write('</body></html>');
                reportWindow.document.close();
            };

            // --- Lógica de Import/Export ---
            document.getElementById('btn-export-json').onclick = function () {
                try {
                    const jsonString = JSON.stringify(window.commandDatabase, null, 2);
                    const reportWindow = window.open('', 'PrintWindow', 'width=800,height=600');
                    reportWindow.document.write('<html><head><title>Banco de Dados de Comandos JSON</title></head><body>');
                    reportWindow.document.write('<p>Copie este conteúdo ou use Ctrl+S para salvar como comandos.json</p>');
                    reportWindow.document.write('<pre>' + escapeHTML(jsonString) + '</pre>');
                    reportWindow.document.write('</body></html>');
                    reportWindow.document.close();
                } catch (e) {
                    alert('Erro ao exportar: ' + e.message);
                }
            };

            document.getElementById('btn-import-json').onclick = function () {
                const btn = document.getElementById('btn-import-json');
                const area = document.getElementById('import-json-area');

                if (area.style.display === 'none') {
                    area.style.display = 'block';
                    btn.textContent = 'Salvar Importação';
                    btn.style.backgroundColor = 'var(--cor-sucesso)';
                } else {
                    try {
                        const newDB = JSON.parse(area.value);
                        if (Array.isArray(newDB)) {
                            area.setCustomValidity('');
                            const validated = catalog.validate(newDB);
                            ctx.ajaStorage.setItem('bau_commandDatabase_v1', JSON.stringify(validated));
                            window.commandDatabase = validated;
                            window.AjaModularNotice?.('Catálogo validado e salvo neste navegador.');
                            area.value = '';
                            area.style.display = 'none';
                            btn.textContent = 'Importar JSON';
                            btn.style.backgroundColor = 'var(--cor-sucesso)';
                            updateAllCommands();
                            document.getElementById('btn-tab-comandos').click();
                        } else {
                            throw new Error('O JSON não é um array.');
                        }
                    } catch (e) {
                        window.AjaModularNotice?.('Erro na importação: ' + e.message);
                        area.setCustomValidity(e.message); area.reportValidity();
                    }
                }
            };


            // --- Lógica das Abas (Inicialização) ---
            function updateAllCommands() {
                updatePlacaRedeCmd();
                updatePlacaForceCmds();
                updatePingCmd();
                updateTrCmd();
                updatePpCmd();
                updateNmapCmd();
                updatePortCmd();
                updateDnsCmd();
                updateArpCmd();
                updateRouteCmd();
                updateSpeedtestCmd();
                updateAtualizacoesCmd();
                populateCommandsTab();
            }

            function setOS(os) {
                currentOS = os;
                document.getElementById('os-auto').classList.toggle('active', os === 'auto');
                document.getElementById('os-win').classList.toggle('active', os === 'win');
                document.getElementById('os-mac').classList.toggle('active', os === 'mac');
                document.getElementById('os-lin').classList.toggle('active', os === 'linux');
                updateAllCommands();
            }

            document.getElementById('os-auto').onclick = () => setOS('auto');
            document.getElementById('os-win').onclick = () => setOS('win');
            document.getElementById('os-mac').onclick = () => setOS('mac');
            document.getElementById('os-lin').onclick = () => setOS('linux');

            document.getElementById('btn-tab-info').onclick = (e) => openBauTab(e, 'tab-info');
            document.getElementById('btn-tab-ip-publico').onclick = (e) => openBauTab(e, 'tab-ip-publico');
            document.getElementById('btn-tab-velocidade').onclick = (e) => openBauTab(e, 'tab-velocidade');
            document.getElementById('btn-tab-placa-rede').onclick = (e) => openBauTab(e, 'tab-placa-rede');
            document.getElementById('btn-tab-ping').onclick = (e) => openBauTab(e, 'tab-ping');
            document.getElementById('btn-tab-traceroute').onclick = (e) => openBauTab(e, 'tab-traceroute');
            document.getElementById('btn-tab-pathping').onclick = (e) => openBauTab(e, 'tab-pathping');
            document.getElementById('btn-tab-nmap').onclick = (e) => openBauTab(e, 'tab-nmap');
            document.getElementById('btn-tab-test-port').onclick = (e) => openBauTab(e, 'tab-test-port');
            document.getElementById('btn-tab-netstat').onclick = (e) => openBauTab(e, 'tab-netstat');
            document.getElementById('btn-tab-dns').onclick = (e) => openBauTab(e, 'tab-dns');
            document.getElementById('btn-tab-arp').onclick = (e) => openBauTab(e, 'tab-arp');
            document.getElementById('btn-tab-route').onclick = (e) => openBauTab(e, 'tab-route');
            document.getElementById('btn-tab-atualizacoes').onclick = (e) => openBauTab(e, 'tab-atualizacoes');
            document.getElementById('btn-tab-comandos').onclick = (e) => openBauTab(e, 'tab-comandos');
            document.getElementById('btn-tab-registro').onclick = (e) => openBauTab(e, 'tab-registro');

            // Abre a primeira aba (Info) e preenche todos os comandos
            document.getElementById('btn-tab-info').click();
            updateAllCommands(); // Função unificada

            console.log("Baú de Acesso Remoto (V20.5 - Original + Drag) carregado!");

            // --- 6. BOTÃO FLUTUANTE (MODIFICADO) ---

            // Cria o botão se não existir
            if (window.self === window.top) {
                let triggerBtn = document.getElementById('bau-trigger-button');
                if (!triggerBtn) {
                    triggerBtn = document.createElement('button');
                    triggerBtn.id = 'bau-trigger-button'; 
                    triggerBtn.innerHTML = ICONS.COMPUTER;
                    triggerBtn.title = "Abrir BAR";
                    document.body.appendChild(triggerBtn);
                }

                // 1. CLIQUE (Compatível com Menu Unificado)
                triggerBtn.onclick = function () {
                const janela = document.getElementById('bau-rede');
                if (janela.style.display === 'none' || !janela.style.display) {
                    janela.style.display = 'flex';
                    janela.style.flexDirection = 'column';

                    // Se o botão estiver visível (não controlado pelo Menu Unificado), esconde-o
                    if (getComputedStyle(triggerBtn).display !== 'none' && getComputedStyle(triggerBtn).opacity !== '0') {
                        triggerBtn.style.display = 'none';
                    }
                } else {
                    janela.style.display = 'none';
                    // Mostra o botão de volta (se não controlado pelo Menu Unificado)
                    if (getComputedStyle(triggerBtn).opacity !== '0') {
                        triggerBtn.style.display = 'flex';
                    }
                }
            };

            // 3. ARRASTAR (Lógica simples)
            let isBtnDrag = false;
            let bStartX, bStartY, bInitL, bInitT;

            triggerBtn.onmousedown = function (e) {
                if (e.button !== 0) return;
                isBtnDrag = false;
                bStartX = e.clientX; bStartY = e.clientY;
                const r = triggerBtn.getBoundingClientRect();
                bInitL = r.left; bInitT = r.top;
                triggerBtn.style.transition = 'none';

                function onMove(me) {
                    const dx = me.clientX - bStartX;
                    const dy = me.clientY - bStartY;
                    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                        isBtnDrag = true;
                        triggerBtn.onclick = null; // Desativa clique no arrasto
                        triggerBtn.style.left = (bInitL + dx) + 'px';
                        triggerBtn.style.top = (bInitT + dy) + 'px';
                        triggerBtn.style.right = 'auto'; triggerBtn.style.bottom = 'auto';
                    }
                }
                function onUp() {
                    document.removeEventListener('mousemove', onMove);
                    document.removeEventListener('mouseup', onUp);
                    triggerBtn.style.transition = '';
                    if (isBtnDrag) {
                        ctx.ajaStorage.setItem('bauTriggerPos', JSON.stringify({ left: triggerBtn.style.left, top: triggerBtn.style.top }));
                        setTimeout(() => {
                            triggerBtn.onclick = function () {
                                const j = document.getElementById('bau-rede');
                                if (j.style.display === 'none' || !j.style.display) {
                                    j.style.display = 'flex';
                                    j.style.flexDirection = 'column';
                                    if (getComputedStyle(triggerBtn).display !== 'none' && getComputedStyle(triggerBtn).opacity !== '0') triggerBtn.style.display = 'none';
                                } else {
                                    j.style.display = 'none';
                                    if (getComputedStyle(triggerBtn).opacity !== '0') triggerBtn.style.display = 'flex';
                                }
                            };
                        }, 100);
                    }
                }
                document.addEventListener('mousemove', onMove);
                document.addEventListener('mouseup', onUp);
            };

            // 4. Restaurar Posição
            const savedPos = ctx.ajaStorage.getItem('bauTriggerPos');
            if (savedPos) {
                const p = JSON.parse(savedPos);
                triggerBtn.style.left = p.left;
                triggerBtn.style.top = p.top;
                triggerBtn.style.right = 'auto';
                triggerBtn.style.bottom = 'auto';
            }
        }
    })();

    } catch (e) { console.error('[BUILDER] Erro fatal no módulo bar.js:', e); throw e; }



return { open() { return document.getElementById('bau-trigger-button')?.click(); } };
});
