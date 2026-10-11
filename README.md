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
