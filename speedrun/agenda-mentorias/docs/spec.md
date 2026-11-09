# Spec · Agenda de Mentorias

## Glossário

| Termo | Significado |
|---|---|
| Jovem | Aluno da PdA que agenda mentorias. Identificado por e-mail. |
| Mentor | Profissional voluntário. Tem `id`, `nome`, `area`. |
| Vaga | Um horário oferecido por um mentor. Tem `id`, `mentorId`, `inicio` (`YYYY-MM-DDTHH:mm`, horário de Brasília) e `livre`. |
| Agendamento | Uma vaga reservada por um jovem. Tem `id`, `vagaId`, `mentorId`, `jovemEmail`, `status` (`confirmado` ou `cancelado`). |

## Fonte de dados

`src/repo.js`, em memória (ADR-001).

## Já existe

| Método | Rota | Resposta |
|---|---|---|
| GET | `/health` | `200 {"status":"ok"}` |
| GET | `/mentores` | `200 [{"id","nome","area"}]` ordenado por `nome` |

Erros gerais: JSON malformado → `400 {"erro":"JSON inválido"}`; erro inesperado → `500 {"erro":"Erro interno"}`. Todo erro usa o formato `{"erro": "<mensagem>"}`.

## Tasks

| Task | Rota | Detalhe |
|---|---|---|
| T1 | `POST /agendamentos` | [docs/tasks/T1.md](tasks/T1.md) |
| T2 | `DELETE /agendamentos/:id` | [docs/tasks/T2.md](tasks/T2.md) |
| T3 | `GET /mentores/:id/vagas?data=YYYY-MM-DD` | [docs/tasks/T3.md](tasks/T3.md) |

## Requisitos não funcionais

- **NFR-1 (concorrência):** QUANDO várias requisições pedirem a mesma vaga livre ao mesmo tempo, o sistema DEVE confirmar exatamente uma (201) e recusar as outras (409).
- **NFR-2 (desempenho):** ENQUANTO o mentor tiver até 1.000 vagas, o sistema DEVE responder `GET /mentores/:id/vagas` com p95 abaixo de 50 ms (200 requisições locais).

## Carga esperada

300 jovens, 40 mentores, cerca de 25 vagas por mentor por mês. Pico: abertura da agenda às 9h de segunda, com até 150 tentativas de agendamento no primeiro minuto.

## Fora do escopo

Envio de e-mail, autenticação, limite de agendamentos por jovem, regra de dia da semana, notificações, fuso horário diferente de Brasília. **Se parecer necessário, pergunte.**
