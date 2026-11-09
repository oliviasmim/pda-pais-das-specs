# Próxima sessão: o que falta e como continuar

Para retomar com um agente: abra este repositório e peça "leia docs/specs/PROXIMA-SESSAO.md e continue pelo item de maior prioridade". Leia antes `AGENTS.md`, `docs/specs/contrato-tecnico.md` e `docs/facilitacao/semana-10-plano.md`.

## Estado atual (sessão de 09/11/2026)

Pronto e publicado:

- Site com início, 7 lições da Semana 10, Baralho do Gato, trilha das 14 semanas, glossário e speedrun.
- 16 laboratórios interativos com lógica testada (`npm test`).
- Projeto inicial do speedrun (`speedrun/agenda-mentorias`) com 5 sensores + guarda de testes de aceite + hook do Claude Code.
- Avaliador do speedrun com implementação de referência.
- Plano de facilitação das duas aulas.
- CI do repositório e publicação no GitHub Pages.

Ver a seção "Pendências conhecidas" no fim para o que ficou de fora da sessão.

## Backlog, em ordem de prioridade

### P1 · Antes da aula (semana 10)

1. **Ensaio completo do speedrun numa máquina limpa** (Windows e macOS). Medir quanto tempo leva `npx degit` + `npm install` + `npm run gates`. Se passar de 5 min, gerar um zip com `node_modules` para quem tem internet ruim.
2. **Teste de usabilidade com 2 alunos** em cada laboratório da Aula 1 (5 min cada). Pergunta única: "o que você acha que é para fazer aqui?". Ajustar instruções que travarem.
3. **Modo projetor por lição**: tecla de atalho para avançar seção por seção (hoje o modo projetor só aumenta a fonte e esconde o índice).

### P2 · Depois da aula

4. **Modo sala (respostas da turma ao vivo)**. Hoje cada aluno vê só o próprio resultado. Proposta: um laboratório pode publicar a resposta (ex.: classificação de cada linha no Interrogatório) e a facilitadora vê o agregado no projetor ("62% marcaram a linha 14 como pedido"). Opções: reaproveitar o `kahoot-pda`, ou um backend mínimo (Supabase, Firebase) com sala por código. Requisitos: sem login, sem nome real (apelido), dados apagados ao fim da aula. Escrever a spec com EARS e NFR antes (latência p95 < 1 s para 45 alunos).
5. **Coleta das Cartas de Destino e Cartas à Rainha**. Hoje ficam no navegador do aluno (exportam Markdown). Juntar com o modo sala ou com um formulário.
6. **Teste de ponta a ponta do site na CI**: abrir cada rota em navegador headless e falhar se houver erro no console ou laboratório que não montou. Hoje a CI verifica estrutura e lógica, mas não a interface.
7. **Folhas de consulta para imprimir** (uma página A4 por lição), no estilo dos *cheatsheets* do repositório de referência.

### P3 · Expandir para o curso inteiro

8. **Uma "fase" por semana**, como no repositório de referência (que tem 20 fases e 500+ lições). A estrutura já suporta: acrescentar lições em `curriculo.js` com o campo `semana`, e transformar a rota `#/trilha` em índice de fases. Ordem sugerida, pela matriz de revisão: S8 (gates e TDD), S2 (contexto), S9 (review), S7 (SDD), S3 (AGENTS.md e skills), S4 (MCP e OWASP), S5, S6, S1. Depois S11 a S14 conforme forem dadas.
9. **Laboratórios que faltam para as outras semanas** (ideias já validadas na turma):
   - S1: tokenizador e temperatura (mesmo prompt 5 vezes) visual.
   - S2: "faxina de contexto": arrastar fichas para dentro e fora do prompt e ver o efeito.
   - S3: disparo de skill: dado um pedido, a skill dispara ou não? (dispara quando deve, não dispara quando não deve, falso positivo).
   - S4: classificar 6 necessidades em skill ou MCP/tool; prompt injection numa resposta de ferramenta.
   - S6: escrever EARS com validação automática dos 5 padrões.
   - S11: chamada à API com streaming e structured output simulados; evals com 5 casos.
   - S13: chunking interativo e similaridade de cosseno com vetores 2D.
10. **Trilha de empregabilidade** ligada aos pilares High Agency: explicar uma decisão técnica do próprio projeto no formato STAR, treinando para seleções com entrevista por IA (dúvida recorrente da turma).
11. **Certificado de conclusão da semana** gerado no navegador quando todas as lições e quizzes estiverem feitos.

## Decisões já tomadas (não reabrir sem motivo)

| Decisão | Motivo |
|---|---|
| Site estático sem framework e sem build | A facilitadora edita Markdown e JSON direto no GitHub; GitHub Pages grátis; nada para instalar. |
| Cenário único: agenda de mentorias | Evita contaminar o Encontro 2 da OIP (carteira digital) e dá continuidade entre laboratórios e speedrun. |
| Progresso só no navegador (localStorage) | Sem login e sem dado pessoal. O modo sala (item 4) é a exceção planejada. |
| Metáfora de Alice com ícones próprios | Domínio público, sem imagens de terceiros. |
| DDIA 2ª ed. cap. 2 parafraseado | Direitos autorais: só ideias, sem trechos longos. A facilitadora tem o livro para citações em aula. |

## Pendências conhecidas

- **Cloudflare Pages não publicado.** O login do wrangler expirou (erro 400 ao renovar o token). Para publicar: `npx wrangler login`, depois `npx wrangler pages project create pda-pais-das-specs --production-branch main` e `npx wrangler pages deploy site --project-name pda-pais-das-specs`. O GitHub Pages já está no ar: https://oliviasmim.github.io/pda-pais-das-specs/
- **Revisão de voz dos textos.** As 7 lições foram escritas por agentes seguindo o plano. Vale uma passada com a skill `voz-iasmim` antes da aula.
- **Menção à OIP na lição 2.** `coelho-branco.md` diz, sem nomes, que a orientação de escala do Encontro 1 foi a mais mal lida pela turma. A facilitadora decide se mantém.
- **`code` dentro de laboratórios.** A regra global `:not(pre) > code` do `style.css` põe borda em código dentro de linhas de diff. Os labs do Julgamento contornam; o ideal é limitar a regra a `.prosa`.
- **Sem teste de interface na CI** (ver item 6 do backlog). O teste de ponta a ponta foi feito à mão, em navegador headless, no site publicado: 7 lições, 16 laboratórios montados, 0 erros.
- **Speedrun não ensaiado no Windows.** O hook do Claude Code é em Node (sem `jq`) justamente para funcionar lá, mas não foi testado.
