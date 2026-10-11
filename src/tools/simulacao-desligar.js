// Módulo: simulacao-desligar.js
window.AjaModular.register('simulacao-desligar', [], function (ctx) {

    // 1. Interceptador Master (CORRIGIDO)
    // Agora grava diretamente na variável 'stolenGenesysToken' (com N)
    if (!window.stolenGenesysToken) {
        // Intercepta XMLHttpRequest
        const originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
        XMLHttpRequest.prototype.setRequestHeader = function(header, value) {
            if (header.toLowerCase() === 'authorization' && value.includes('Bearer')) {
                window.stolenGenesysToken = value; // CORRIGIDO: de Toquem para Token
            }
            return originalSetRequestHeader.apply(this, arguments);
        };

        // Intercepta Fetch
        const originalFetch = window.fetch;
        window.fetch = async function(...args) {
            let options = args[1];
            if (options && options.headers) {
                let auth = options.headers.Authorization || options.headers.authorization;
                if (auth && auth.includes("Bearer")) window.stolenGenesysToken = auth; // CORRIGIDO: de Toquem para Token
            }
            return originalFetch.apply(this, args);
        };
    }

    // 2. Ação executada ao clicar no botão do menu
    async function open() {
        // TENTATIVA 1: O botão original ainda existe? (Mesmo invisível)
        let btnOriginal = document.getElementById("call-control-end-sms-button");
        if (btnOriginal) {
            btnOriginal.click();
            console.log("Encerrado usando o gatilho original do Genesys.");
            return;
        }

        // TENTATIVA 2: Verifica se o Token foi capturado
        if (!window.stolenGenesysToken) {
            return alert("O Rastreador ainda não pegou a chave de segurança.\n\nPor favor, CLIQUE EM QUALQUER OUTRA ABA do Genesys (ex: clique no nome de outro cliente ou no menu) para forçar o sistema a se comunicar com a internet. Depois, clique aqui neste botão vermelho de novo.");
        }

        let authHeader = { 
            "Authorization": window.stolenGenesysToken, 
            "Content-Type": "application/json" 
        };
        
        try {
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
                return alert("Nenhum cliente ativo encontrado no servidor.");
            }

            let target = null;
            if (activeConvs.length === 1) {
                target = activeConvs[0];
            } else {
                let msg = "Qual cliente ENCERRAR SEM AVALIAÇÃO?\n\n";
                for (let i = 0; i < activeConvs.length; i++) msg += `${i + 1} - ${activeConvs[i].name}\n`;
                let escolha = prompt(msg + "\nDigite o número:");
                if (!escolha) return;
                
                let idx = parseInt(escolha) - 1;
                if (idx >= 0 && idx < activeConvs.length) target = activeConvs[idx];
                else {
                    return alert("Número inválido!");
                }
            }

            // Envia comando de desconexão via API Genesys
            let endResponse = await window.fetch(`https://api.sae1.pure.cloud/api/v2/conversations/messages/${target.id}/participants/${target.participantId}`, {
                method: "PATCH",
                headers: authHeader,
                body: JSON.stringify({ state: "disconnected" })
            });

            if (endResponse.ok) alert(`✅ '${target.name}' encerrado internamente!`);
            else alert("❌ A empresa bloqueou essa ação pela API.");

        } catch (err) {
            alert("Erro de conexão ao tentar encerrar internamente.");
            console.error(err);
        }
    }

    return { open };
});
