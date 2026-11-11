# Auditoria da lição beba-me

Fontes: aula1-fundamentos, aula3-prompts-contexto-projeto, aula5-agents-md-skills, aula15-verificadores, aula19-orquestracao-mcp-client.
Legenda: coberto, parcial, ausente. "Depois" é o estado após esta passada.

| Conceito ou exercício (fonte) | Antes | Depois | Onde |
|---|---|---|---|
| Agente = LLM + harness (aula 1) | coberto | coberto | texto + lab `ciclo-harness` (novo) |
| Loop do agente narrado: Read, Edit, Bash(test), falha, Edit (aula 1, Lab 3 passo 5) | ausente | coberto | lab `ciclo-harness` |
| Tokenização ao vivo (aula 1, Lab 1) | ausente | parcial | link Tiktokenizer em Para ir além; sem lab próprio (um tokenizador real não cabe sem dependência) |
| Temperatura: 5x o mesmo prompt, não-determinismo (aula 1, Lab 2) | ausente | coberto | lab `temperatura` (novo) + parágrafo |
| Setup: CLAUDE.md, skill, MCP, tarefa real (aula 1, Lab 3) | ausente | ausente | fora do tema do site (é instalação) |
| Prompt vago vs específico + exemplo + formato (aula 3, Lab 1) | ausente | ausente | pertence a outra lição (prompts); não entra aqui |
| Contexto sujo vs limpo, /context, queda de qualidade (aula 3, Lab 2) | parcial | coberto | lab `contexto` (já existia) + lab `faxina-contexto` (novo) |
| Smart zone, dumb zone; 40% é empírico (aula 3, referências 8 e 9) | parcial | coberto | texto agora marca o 40% como observação da turma |
| CLAUDE.md como memória entre sessões, curto (aula 3) | parcial | coberto | tabela "Onde cada guia mora" |
| Regra ou ruído: "se a linha sumir, ele volta a errar?" e teste antes/depois (aula 5, Lab 1) | ausente | coberto | pergunta no texto + item 4 da Trilha da Toca |
| AGENTS.md vs CLAUDE.md, import `@AGENTS.md` (aula 5) | ausente | coberto | texto + tabela |
| Sempre carregado vs sob demanda, custo em toda sessão (aula 5) | parcial | coberto | tabela "Onde cada guia mora" |
| Progressive disclosure em 3 níveis (aula 5, Lab 2) | ausente | coberto | tabela "Skill em três níveis" |
| Skill dispara quando deve, não dispara quando não deve, falso positivo (aula 5, referência 6) | ausente | coberto | lab `disparo-skill` (novo) |
| Skill vs MCP/tool (aula 5) | ausente | parcial | linhas da tabela; classificação interativa fica para a S4 |
| Red team de skills em duplas (aula 6) | ausente | ausente | dinâmica de sala, não de site |
| Guias e sensores, computacional vs inferencial (aula 15) | coberto | coberto | texto + lab `guias-sensores` |
| TDD, teste antes é guia e sensor (aula 15) | coberto | coberto | texto |
| Os 4 sensores locais, CI, branch protection (aula 15) | parcial | parcial | sensores listados; gate e CI estão na lição cortem-lhe-a-cabeca |
| Slopsquatting, dependency review (aula 15) | ausente | ausente | tema da lição dos gates |
| Subagent: janela própria, resumo volta, custo (aula 19) | coberto | coberto | texto + lab `contexto` |
| Supervisor, paralelo, swarm (aula 19) | coberto | coberto | tabela "Precisa mesmo?" + lab `precisa-mesmo` |
| Custo de coordenação com número: 4x e 15x tokens (aula 19, referência 8) | ausente | coberto | uma frase na seção "Precisa mesmo?" |
| Worktrees, MCP client próprio, speedrun (aula 19) | ausente | ausente | lições cha-do-chapeleiro e baralho-da-rainha |
| Faxina de contexto: fichas para dentro e para fora (PROXIMA-SESSAO, item 9) | ausente | coberto | lab `faxina-contexto` |

Resumo: 26 itens. Antes, 7 cobertos, 4 parciais, 15 ausentes. Depois, 16 cobertos, 4 parciais, 6 ausentes (todos fora do tema ou de outra lição).

## Decisões

- Números dos labs (tokens das fichas, probabilidades da temperatura) são ilustrativos e avisados na tela.
- `disparo-skill` é simulação por palavras-gatilho. O aviso na tela diz que o modelo real decide pelo sentido.
- Tempo da lição subiu de 35 para 50 min (8 práticas, 4 delas novas e curtas).
- Quiz não foi alterado.
