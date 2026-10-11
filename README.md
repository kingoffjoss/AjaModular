# AjaModular

Versão independente das ferramentas Brisanet do AjaExtension. Origem: commit `e9e65702ba8ce20ff2b2a18f8f7f77fa7b17a96b` de `kingoffjoss/AjaExtension`, preservado sem alterações.

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

Os arquivos `.js.inc` são módulos de fonte compilados na ordem de `build-order.json`. Preservam o escopo lexical do legado e suas dependências; não devem ser carregados isoladamente como scripts ou ES modules. Os arquivos `.js` de corretor/UI têm escopos próprios. Essa separação permite manutenção por ferramenta sem alterar o contrato compartilhado do legado. O carregador e a extensão usam o mesmo bundle gerado.

```sh
npm run build
npm test
```

Edite os módulos, gere o bundle, rode os testes e publique também o bundle. Não publique chaves ou dados de atendimento. O gerenciador administrativo aponta para este novo repositório e aceita credencial somente quando fornecida explicitamente pelo usuário.

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
