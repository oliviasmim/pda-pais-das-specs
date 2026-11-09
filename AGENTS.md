# AGENTS.md

Site estático da Semana 10 da Especialização em IA da PdA. Leia `docs/specs/contrato-tecnico.md` antes de mudar qualquer coisa.

## Comandos

- `npm run serve`: site em http://localhost:4173
- `npm run check`: verificador do site + testes. Precisa passar antes de qualquer commit.
- `cd speedrun/agenda-mentorias && npm ci && npm run gates`: gates do projeto do speedrun.

## Regras

1. Sem framework e sem build. HTML, CSS e ES modules. A única dependência de runtime é `marked` via CDN com versão fixa.
2. Lógica de laboratório vai em `site/js/logic/` sem DOM e com teste em `tests/`. Interface vai em `site/js/labs/`.
3. Laboratório exporta `mount(el, ctx)` e usa só os tokens de `site/css/style.css`. Estilos sob `.lab-<id>`.
4. Lição nova: metadados em `site/content/curriculo.js`, texto em `site/content/licoes/<id>.md`, quiz com 6 perguntas (2 pre, 2 check, 2 pos) em `site/content/quiz/<id>.json`.
5. Cenário dos exemplos: agenda de mentorias (`docs/specs/dominio-agenda-mentorias.md`). Status e mensagens de erro exatamente como lá.
6. Nunca use o domínio da carteira digital nem o endpoint de saldo: é material de avaliação (Encontro 2 da OIP). O verificador bloqueia.
7. Nunca coloque nome de aluno, nota individual ou dado de avaliação no site. Dados da turma só agregados e sem nome.
8. Texto em português do Brasil, frases curtas, sem jargão sem explicação.
9. Não altere testes existentes para fazê-los passar. Se o teste estiver errado, explique no PR por quê.
10. Commits: `feat:`, `fix:`, `docs:`, `test:`, `chore:`.
