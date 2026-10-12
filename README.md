# AjaModular

Versão independente das ferramentas Brisanet do AjaExtension. Origem: commit `e9e65702ba8ce20ff2b2a18f8f7f77fa7b17a96b` de `kingoffjoss/AjaExtension`, preservado sem alterações.

## Relógio flutuante — versão 1.1.2

Correções de arraste com eventos próprios, proteção dos controles do cabeçalho, reposicionamento ao abrir/redimensionar, atualização imediata e cores por status. A lógica visual do relógio fica em `src/tools/relogio.js`; os botões e agendamentos continuam em `src/tools/pausas.js`.

Para testar, recarregue a aba e utilize o favorito atualizado ou a extensão 1.1.1. Verifique arrastar, minimizar/expandir, abrir configurações, redimensionar a janela e retornar de uma aba em segundo plano. Ctrl+Shift+1 funciona fora dos campos de edição. O relógio mostra a hora do computador; a duração do status aparece no painel expandido. Os testes automáticos passaram; o funcionamento no Genesys real aguarda teste pelo usuário.

## Usar

Acesse https://kingoffjoss.github.io/AjaModular/ e crie um novo favorito usando `bookmarklet.txt`. Este favorito carrega exclusivamente `AjaModular/Loader.js`. O favorito antigo continua apontando ao AjaExtension.

Para extensão Chrome/Edge: baixe o ZIP do repositório, extraia e selecione a pasta com `manifest.json` em **Carregar sem compactação** na página de extensões, com modo de desenvolvedor ativo. Cada instalação tem seus próprios controles. Use uma versão por aba de atendimento; ambas compartilham seletores de interface e não foram projetadas para execução simultânea na mesma página.

## Estrutura e manutenção

| Pasta | Responsabilidade |
|---|---|
| `src/core` | Inicialização, armazenamento, seletores, chat, contadores e interface compartilhada |
| `src/tools` | BAR, CAR, Assistant, filas, respostas, protocolos, pausas, menu, gerenciador e ferramentas auxiliares |
| `src/corretor` | Serviços de revisão, painel e voz, interação/arraste e dicionário |
| `src/ui` | Tema azul/laranja, estilos, disposição do menu e ordem das janelas |
| `tools` | Build e testes sem dependências externas |
| `runtime` | Bundle gerado; não editar diretamente |

Cada ferramenta em `src/tools/*.js` registra sua própria função de inicialização. Variáveis locais ficam isoladas; acesso ao núcleo usa `ctx`, com referências atualizadas. O registro em `src/core/module-registry.js` resolve dependências, evita inicialização duplicada e registra falhas por módulo. O menu chama operações públicas `open()`, sem conter a implementação da calculadora.

`module-map.json` mostra arquivos e dependências. `build-order.json` define a montagem. Os componentes de dashboard, configurações, gráficos e notificações ficam em `src/ui/components`. Bloco de notas, lembretes, links e histórico têm módulos próprios. Toolbar e menu utilizam o mesmo painel de ferramentas; existe um único extrator e um único proprietário do F2.

O núcleo compartilhado de chat, métricas e temporizadores ainda usa fragmentos `.js.inc` por responsabilidade. As ferramentas não compartilham suas variáveis locais com esses fragmentos. A extensão e o favorito usam um bundle gerado para distribuição; edite o arquivo de fonte da ferramenta, nunca o bundle.

```sh
npm run build
npm test
```

Edite o módulo, gere o bundle, rode os testes e publique também o bundle. O build recusa registros duplicados, dependências ausentes/circulares e ferramentas fora do mapa. Os testes verificam que uma falha de inicialização não impede módulos independentes. Não publique chaves ou dados de atendimento. O gerenciador administrativo aponta para este novo repositório e aceita credencial somente quando fornecida explicitamente pelo usuário.

## Correções integradas

- Um único corretor, com abas Erros, Dicionário e Tradução (voz para texto revisada).
- Uma única janela de configurações: chave Gemini, salvar, remover e testar.
- Proteção de foco na transcrição e nas configurações; arraste ignora botões e campos.
- Dicionário com adicionar, listar e remover. Comparação sem diferença de maiúsculas, com normalização Unicode; palavras pessoais suprimem erros ortográficos, preservando alertas gramaticais.
- Respostas atrasadas de LanguageTool são descartadas quando o campo ou o texto mudou.
- Gemini consulta ListModels e seleciona somente modelos com `generateContent`. A chave segue em cabeçalho, sem lista fixa de nomes obsoletos. Assistant e corretor usam o mesmo serviço.
- Menu limitado à altura da tela, com lista rolável; carregamento repetido não duplica o runtime.

## Separação de dados

LocalStorage e SessionStorage usam o prefixo `ajamodular:`. Não há importação automática de dados ou credenciais do AjaExtension. Configure as chaves novamente nesta versão. Os nomes internos do legado, como `pcs_spell_dict`, são armazenados sob esse prefixo.

O backend Google Apps Script antigo não é reutilizado: sincronização/restauração em nuvem ficam inativas por padrão. Para ativá-las, provisione um backend independente e configure `GOOGLE_SCRIPT_URL` em `src/core/bootstrap.js.inc` (e o endereço correspondente em compatibility se necessário), depois gere o bundle. Os dados locais e exportações continuam disponíveis.

Não há captura de tokens Genesys nem ocultação de auditoria na nova implementação. O botão do legado que acionava encerramento “sem avaliação”, seu seletor e o script `encerrar-cliente-nativo.js` foram excluídos. As métricas de cliques nativos continuam somente como observação local.

## Validação e limites

`validation.json` registra verificações de sintaxe, referências do manifesto, unicidade de corretor/configurações, isolamento, dicionário, seleção de modelos Gemini e restrição de hosts do background. `tests/fixture.html` permite testar a interface com respostas simuladas, sem conta Genesys ou chamadas externas.

Também foram verificados no navegador: menu após iniciar o relógio, janela do corretor, adicionar/remover palavra e retornar alertas, configurações, aba de voz, criação e expansão de atalho CAR, abertura do Assistant e monitor de filas. O runtime foi carregado duas vezes no teste, mantendo uma única janela. `ui-validation.json` registra esses cenários.

Não houve login no Genesys, teste real com chave Gemini, uso de microfone nem validação completa contra o DOM de produção. Faça uma rodada de aceite no seu ambiente com esta versão em uma aba separada antes de adotá-la diariamente.

## Publicação

GitHub Pages: branch `main`, pasta `/ (root)`. A raiz contém `.nojekyll`. O runtime e os dados JSON são publicados neste repositório. O AjaExtension mantém seu próprio carregador, publicação e favoritos.

Na versão 1.1.2, os botões de tema do Gerenciador e de Config & Histórico alternam entre claro e escuro e salvam a preferência.

## Versão 1.1.3

CAR usa campo de mensagem com expansão vertical. Configurações do corretor têm layout próprio e tema claro/escuro. Protocolos e Respostas incluem os catálogos dentro do código gerado, sem buscar dados de links. Fonte dos catálogos: kingoffjoss/Meus-Scripts. Preferências e listas personalizadas existentes têm prioridade. Gerenciar Protocolos oferece restaurar padrão, importar e exportar JSON.

## Versão 1.1.4

Configurações do corretor fecham pelo X e por Escape. Ferramentas do Agente usam abertura idempotente: atualizações dos cronômetros não alternam a visibilidade. Fechar sincroniza a preferência e preserva a janela para reabrir com a mesma aba e anotações.

## Versão 1.1.5

Módulo mensagens-termino: botão X ao lado do botão oficial Mensagens de término, respeitando seu estado desabilitado. Removidos o escudo e o bloqueio criado pelo AjaModular.

## Versão 1.1.6

Removido o módulo do botão X. AjaModular não acrescenta botão de encerramento nem escudo de bloqueio à barra.

## Versão 1.1.7

Botão de simulação de desligar no menu, em módulo separado. Exibe apenas uma mensagem; não encerra conversas e não intercepta requisições.


## Versão 1.2.0 — manutenção e recuperação

No menu, abra **Manutenção (⚙️)** para exportar/importar um backup de configurações, catálogos, favoritos, horários e anotações. Chaves de API não são exportadas. A importação valida o arquivo inteiro antes de alterar dados, mantém entradas ausentes e preserva uma cópia do estado anterior. Use “Recuperar antes da última importação” e recarregue a página para aplicar. Dados do CAR salvos pela extensão também são incluídos; importe esses backups pela extensão.

Dados inválidos conhecidos são preservados separadamente e podem ser exportados para revisão. O diagnóstico mostra quais módulos carregaram e permite tentar novamente os que falharam, mantendo os módulos saudáveis.

Os estilos das ferramentas são delimitados às próprias janelas. Esc fecha a janela em primeiro plano por seu controle de fechamento; redimensionar a tela reposiciona janelas fora dos limites. Os cronômetros das conversas são atualizados ao retornar à aba e não mostram duração negativa.

Arquivos de manutenção: `src/core/data-safety.js`, `src/tools/manutencao.js`, `src/ui/window-service.js` e `src/core/module-registry.js`. Execute `npm run build` e `npm test` antes de publicar. O teste de interface usa `tests/fixture.html`; a validação em atendimento real continua necessária.


### Baú: catálogo de comandos (1.3.0)

A aba **Comandos** reúne 154 comandos Windows, 144 Linux e 145 macOS. Foram acrescentados 100, 103 e 106, respectivamente. Cada item informa finalidade, resultado esperado, terminal, requisitos e efeitos relevantes. O catálogo é incorporado ao bundle: não precisa buscar arquivos externos para aparecer.

Use Win/Mac/Lin no cabeçalho e pesquise por nome, comando, finalidade ou resultado, com ou sem acento. O filtro por categoria combina com a busca. O Baú só copia o comando: substitua os campos HOST, PORTA, CAMINHO, INTERFACE, SERVICO etc. antes de colar no terminal remoto. As saídas descritas são esperadas, não resultados de uma execução no computador do cliente.

Manutenção:

- `src/catalogs/bau/windows.json`, `linux.json`, `macos.json`: comandos novos organizados por categoria.
- `src/catalogs/bau/legacy.json`: comandos anteriores revisados, com metadados por sistema.
- `src/catalogs/bau/review.json`: registro das principais substituições na revisão.
- `src/tools/bau-catalogo.js`: validação e pesquisa.
- `src/tools/bar.js`: interface, cópia, importação/exportação e filtros.
- `tools/test-bau.cjs`: contagens, unicidade, metadados, busca e validação.

A importação continua aceitando o formato antigo `{title,commands:[{id,label,desc,os:{win,linux,mac}}]}` e passa a validar registros e guardar o catálogo no navegador. A opção Restaurar catálogo padrão remove a personalização importada; o backup geral inclui o catálogo salvo. Importações antigas sem metadados mostram explicitamente que finalidade ou resultado não foram informados.

Na revisão, consultas WMIC foram substituídas por CIM, a limpeza de DNS Linux usa resolvectl, ferramentas privadas/legadas do macOS deram lugar às alternativas descritas em cada item, e a definição de velocidade no Windows usa Set-NetAdapterAdvancedProperty. Os valores de velocidade dependem do driver e precisam ser obtidos pelas propriedades da própria placa. A variante macOS de liberar IP foi removida porque repetia a renovação DHCP.

Referências de revisão: [comandos Windows](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/windows-commands), [NetAdapter](https://learn.microsoft.com/en-us/powershell/module/netadapter/set-netadapteradvancedproperty), [NetworkManager](https://networkmanager.dev/docs/api/latest/nmcli.html), [systemd](https://www.freedesktop.org/software/systemd/man/255/journalctl.html), [curl](https://curl.se/docs/manpage.html), [OpenSSH](https://man.openbsd.org/ssh), [Terminal Apple](https://support.apple.com/guide/terminal/welcome/mac), [network_cmds Apple](https://github.com/apple-oss-distributions/network_cmds) e [system_cmds Apple](https://github.com/apple-oss-distributions/system_cmds). Ferramentas opcionais, edições Windows, distribuições Linux, drivers e permissões variam; os requisitos de cada item explicitam esses casos. Nenhum comando de manutenção foi executado em computadores reais durante a validação do catálogo.


### Versão 1.4.0 — organização e atendimento

- Menu em duas colunas, com nomes nos títulos dos botões, favoritos e ordem configurável em **Organizar menu**. A grade escolhe o espaço disponível acima ou abaixo do botão principal.
- Baú: campos preenchíveis com prévia, favoritos por sistema e últimos 30 comandos copiados. Os campos do atendimento ficam somente em memória; favoritos e recentes ficam salvos no navegador e entram no backup.
- Quatro roteiros incorporados: sem internet, lentidão, DNS e acesso remoto, com orientação para interpretar cada etapa e acesso ao comando do sistema selecionado.
- Janelas: tamanho e posição salvos, minimização para uma faixa inferior e recuperação em **Organizar menu → Trazer janelas para a tela**. A calculadora com Shadow DOM participa da recuperação; os indicadores compactos dos cronômetros continuam com seus controles próprios.
- Versão instalada e consulta de atualização em **Organizar menu**. A consulta exibe falhas de conexão explicitamente. Atualize o favorito pelo site ou os arquivos da extensão; depois recarregue a plataforma.

O atalho padrão das configurações dos cronômetros é **Ctrl+Shift+S**, fora de campos de texto. Também há o botão **Configurações dos cronômetros** no menu. O atalho atual aparece em Organizar menu e pode ser alterado em Configurações → Atalhos. **Ctrl+Shift+J** alterna o minidashboard e **Ctrl+Shift+D** alterna o tema dos cronômetros, salvo personalização.

Arquivos de manutenção desta versão: `src/tools/menu-preferencias.js`, `src/tools/bau-assistente.js`, `src/catalogs/bau/roteiros.json`, `src/tools/bar.js` e `src/ui/window-service.js`. Validação: `tools/test-productivity.cjs` e `productivity-ui-validation.json`.

### Versão 1.5.0 — revisão compacta

A calculadora preserva o estado aberto do menu de ferramentas. A bolinha no campo mostra somente a contagem; clicar abre a revisão rápida com aceitar, ignorar, corrigir tudo, dicionário, pausa, configurações e reescrita com prévia antes de aplicar. O painel completo mantém voz/tradução. Manutenção da interface compacta: `src/corretor/compact.js`.
