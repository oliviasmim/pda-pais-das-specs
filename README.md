# País das Specs

> "Isso depende bastante de para onde você quer ir", disse o Gato.
> Lewis Carroll, *Alice no País das Maravilhas* (1865)

Laboratórios interativos da **Semana 10 (revisão)** da Especialização em IA da Programadores do Amanhã (PdA). A semana revisa subagents, worktrees, harness, gates de CI e revisão crítica, e acrescenta um tema novo: **requisitos funcionais e não funcionais para quem trabalha com agentes de IA**, com base no capítulo 2 de *Designing Data-Intensive Applications* (2ª edição).

**Abrir o site:** https://oliviasmim.github.io/pda-pais-das-specs/

Inspirado no formato de [AI Engineering from Scratch](https://github.com/rohitg00/ai-engineering-from-scratch): cada lição tem problema, conceito, laboratório interativo, artefato para levar e quiz de entrada, meio e saída.

## A ideia da semana

Agente sem destino é vibe coding com mais tokens. Subagents, worktrees, CI e review aceleram o caminho, mas nenhum deles escolhe o destino. Quem escolhe é você, escrevendo antes do código:

1. o que o sistema faz (requisito funcional),
2. quão bem ele precisa fazer (requisito não funcional, com número),
3. como vamos saber que fez (sensor).

**Requisito sem número é desejo. Requisito sem sensor é promessa.**

## O que tem aqui

| Pasta | Conteúdo |
|---|---|
| `site/` | O site (HTML, CSS e JS puros, sem build). Publicado no GitHub Pages. |
| `site/content/licoes/` | Texto das 7 lições |
| `site/js/labs/` | Os laboratórios interativos |
| `speedrun/agenda-mentorias/` | Projeto inicial do speedrun da Aula 2 (Express, 5 sensores de CI, testes de aceite protegidos) |
| `speedrun/avaliador/` | Avaliador do speedrun (libere só depois da aula) |
| `speedrun/agentes-review/` | Subagents de review prontos para o red team |
| `docs/facilitacao/` | Plano das duas aulas para a facilitadora |
| `docs/specs/` | Domínio do cenário, contrato técnico e backlog |

### As lições

| Aula | # | Lição | Laboratórios |
|---|---|---|---|
| 1 · O Gato e o Coelho | 1 | O Interrogatório do Gato | Diff da IA: pedido, assumido ou inventado? |
| | 2 | O Coelho Branco está atrasado | Simulador de percentis e latência de cauda · Construtor de NFR em EARS |
| | 3 | Beba-me: Agente = LLM + Harness | Guias vs sensores · Janela de contexto e subagents · "Precisa mesmo?" · Carta de Destino |
| 2 · O Chá e o Tribunal | 4 | O Chá Maluco | Terminal de git worktrees |
| | 5 | O Baralho da Rainha | Simulador de orquestração |
| | 6 | Cortem-lhe a cabeça! | Esteira de sensores contra defeitos plantados + gerador de CI |
| | ⏱ | Speedrun | Cronômetro e placar |
| | 7 | O Julgamento do Valete | Diff grande em camadas · Fábrica de revisores · Carta à Rainha |

## O speedrun da Aula 2

```bash
npx degit oliviasmim/pda-pais-das-specs/speedrun/agenda-mentorias agenda-mentorias
cd agenda-mentorias
git init && git add . && git commit -m "chore: projeto inicial"
npm install
npm run gates
```

Depois siga o `README.md` do projeto: três worktrees, três sessões do agente em paralelo, uma task em cada, integração na `main` com CI verde.

## Rodar local

```bash
npm run serve     # http://localhost:4173
npm run check     # verificador do site + testes
```

Requer Node 20 ou mais novo. Não há dependência para instalar no site.

## Contribuir

Leia `AGENTS.md` e `docs/specs/contrato-tecnico.md`. Regras que não mudam:

- O cenário dos exemplos é a **agenda de mentorias**. Não use o domínio da carteira digital (é material de avaliação da OIP). O verificador bloqueia.
- Nada de nome de aluno ou dado individual no site.
- `npm run check` verde antes de abrir PR.

## Créditos

- Lewis Carroll, *Alice's Adventures in Wonderland* (1865). Domínio público. Citações em tradução livre.
- Martin Kleppmann e Chris Riccomini, *Designing Data-Intensive Applications*, 2ª ed., cap. 2 (O'Reilly). Ideias parafraseadas; leia o livro.
- Formato inspirado em [rohitg00/ai-engineering-from-scratch](https://github.com/rohitg00/ai-engineering-from-scratch) (MIT).
