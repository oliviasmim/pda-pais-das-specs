# Agentes de review do speedrun

Dois subagents de review prontos, gerados pelo laboratório "Fábrica de revisores" (lição 7, O Julgamento do Valete).

| Arquivo | Pergunta que ele faz |
|---|---|
| `rastreador-de-spec.md` | Onde, na spec, está escrito isso? |
| `cetico-de-testes.md` | Que bug este teste pegaria? Algum teste de aceite mudou? |

## Como usar

```bash
mkdir -p .claude/agents
cp rastreador-de-spec.md cetico-de-testes.md .claude/agents/
```

Reinicie a sessão do Claude Code e peça:

```text
Use o subagent cetico-de-testes para revisar os arquivos alterados nesta branch.
```

Os dois são só leitura (`tools: Read, Grep, Glob` e `disallowedTools: Edit, Write`). Revise à mão **antes** de rodar, e compare.
