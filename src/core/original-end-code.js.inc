    function runOriginalEndCode() {
void (function(){
(function criarBotaoNinja() {
    // Evita criar botões duplicados na tela
    if (document.getElementById("btn-ninja-encerrar")) {
        return alert("O botão já está na sua tela! Olhe no canto inferior esquerdo.");
    }

    // 1. Interceptador Master: Rouba o Token silenciosamente das requisições
    if (!window.stolenGenesysToken) {
        // Intercepta XMLHttpRequest
        const originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
        XMLHttpRequest.prototype.setRequestHeader = function(header, value) {
            if (header.toLowerCase() === 'authorization' && value.includes('Bearer')) {
                window.stolenGenesysToken = value;
            }
            return originalSetRequestHeader.apply(this, arguments);
        };

        // Intercepta Fetch
        const originalFetch = window.fetch;
        window.fetch = async function(...args) {
            let options = args[1];
            if (options && options.headers) {
                let auth = options.headers.Authorization || options.headers.authorization;
                if (auth && auth.includes("Bearer")) window.stolenGenesysToken = auth;
            }
            return originalFetch.apply(this, args);
        };
    }

    // 2. Cria o Botão Visual flutuante
    let btn = document.createElement("button");
    btn.id = "btn-ninja-encerrar";
    btn.innerText = "💀";
    btn.style.cssText = "position:fixed; bottom:20px; left:20px; z-index:999999; background-color:#d93b3b; color:white; border:none; padding:15px 20px; font-weight:bold; border-radius:8px; cursor:pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.3); font-size:14px; font-family:sans-serif;";
    
    btn.title = "Encerrar sem Avaliação";
    btn.setAttribute("aria-label", "Encerrar sem Avaliação");
    // Efeito de passar o mouse
    btn.onmouseover = () => btn.style.backgroundColor = "#b02a2a";
    btn.onmouseout = () => btn.style.backgroundColor = "#d93b3b";

    // 3. A mágica ao clicar no botão
    btn.onclick = async function() {
        // TENTATIVA 1: O botão original ainda existe? (Mesmo invisível)
        let btnOriginal = document.getElementById("call-control-end-sms-button");
        if (btnOriginal) {
            btnOriginal.click();
            console.log("Encerrado usando o gatilho original do Genesys.");
            return;
        }

        // TENTATIVA 2: Botão não existe mais. Vamos usar a API Interna com o Token roubado!
        if (!window.stolenGenesysToken) {
            return alert("O Rastreador ainda não pegou a chave de segurança.\n\nPor favor, CLIQUE EM QUALQUER OUTRA ABA do Genesys (ex: clique no nome de outro cliente ou no menu) para forçar o sistema a se comunicar com a internet. Depois, clique aqui neste botão vermelho de novo.");
        }

        let authHeader = { "Authorization": window.stolenGenesysToken, "Content-Type": "application/json" };
        
        try {
            btn.innerText = "Buscando...";
            
            // Busca clientes ativos
            let convResponse = await window.fetch(`https://api.sae1.pure.cloud/api/v2/conversations/messages`, { headers: authHeader });
            let convData = await convResponse.json();
            let activeConvs = [];

            if (convData.entities) {
                for (let conv of convData.entities) {
                    let agent = conv.participants.find(p => p.purpose === "agent" && p.state === "connected");
                    if (agent) {
                        let customer = conv.participants.find(p => p.purpose === "customer" || p.purpose === "external");
                        let name = customer ? (customer.name || "Desconhecido") : "Desconhecido";
                        activeConvs.push({ id: conv.id, participantId: agent.id, name: name });
                    }
                }
            }

            if (activeConvs.length === 0) {
                btn.innerText = "💀";
                return alert("Nenhum cliente ativo encontrado no servidor.");
            }

            let target = null;
            if (activeConvs.length === 1) {
                target = activeConvs[0];
            } else {
                let msg = "Qual cliente ENCERRAR SEM AVALIAÇÃO?\n\n";
                for (let i = 0; i < activeConvs.length; i++) msg += `${i + 1} - ${activeConvs[i].name}\n`;
                let escolha = prompt(msg + "\nDigite o número:");
                if (!escolha) { btn.innerText = "💀"; return; }
                
                let idx = parseInt(escolha) - 1;
                if (idx >= 0 && idx < activeConvs.length) target = activeConvs[idx];
                else {
                    btn.innerText = "💀";
                    return alert("Número inválido!");
                }
            }

            // Manda o comando final
            btn.innerText = "Encerrando...";
            let endResponse = await window.fetch(`https://api.sae1.pure.cloud/api/v2/conversations/messages/${target.id}/participants/${target.participantId}`, {
                method: "PATCH",
                headers: authHeader,
                body: JSON.stringify({ state: "disconnected" })
            });

            if (endResponse.ok) alert(`✅ '${target.name}' encerrado internamente!`);
            else alert("❌ A empresa bloqueou essa ação pela API.");
            
            btn.innerText = "💀";
        } catch (err) {
            alert("Erro de conexão ao tentar encerrar internamente.");
            btn.innerText = "💀";
            console.error(err);
        }
    };

    // Coloca o botão na tela
    document.body.appendChild(btn);
    console.log("✅ Botão Ninja criado no canto inferior esquerdo!");
})();
})();
    }
