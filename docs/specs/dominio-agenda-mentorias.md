# Domínio: Agenda de Mentorias da PdA

Cenário único usado em todos os laboratórios e no speedrun. **Não use o domínio da carteira digital nem o endpoint de saldo** (são material do Encontro 2 da OIP).

## Glossário (linguagem ubíqua)

| Termo | Significado |
|---|---|
| Jovem | Aluno da PdA que agenda mentorias. Identificado por e-mail. |
| Mentor | Profissional voluntário. Tem `id`, `nome`, `area`. |
| Vaga | Um horário oferecido por um mentor. Tem `id`, `mentorId`, `inicio` (`YYYY-MM-DDTHH:mm`, horário de Brasília) e `livre`. |
| Agendamento | Uma vaga reservada por um jovem. Tem `id`, `vagaId`, `mentorId`, `jovemEmail`, `status` (`confirmado` ou `cancelado`). |

## Fonte de dados

Repositório em memória em `src/repo.js` (ADR-001). Decisão da equipe para o speedrun. Em produção seria PostgreSQL. **A fonte de dados está escrita na spec; a IA não precisa assumir nada.**

## Endpoints existentes (padrão a seguir)

| Método | Rota | Resposta |
|---|---|---|
| GET | `/health` | `200 {"status":"ok"}` |
| GET | `/mentores` | `200 [{"id","nome","area"}]` ordenado por `nome` |

Erros sempre no formato `{"erro": "<mensagem>"}`.

## T1 · Agendar mentoria: `POST /agendamentos`

Corpo: `{"vagaId": number, "jovemEmail": string}`

| Quando | Status | Corpo |
|---|---|---|
| `vagaId` ausente ou não inteiro | 400 | `{"erro":"vagaId é obrigatório"}` |
| `jovemEmail` ausente ou vazio | 400 | `{"erro":"jovemEmail é obrigatório"}` |
| `jovemEmail` sem formato `a@b.c` | 400 | `{"erro":"jovemEmail inválido"}` |
| vaga não existe | 404 | `{"erro":"Vaga não encontrada"}` |
| vaga não está livre | 409 | `{"erro":"Vaga indisponível"}` |
| sucesso | 201 | `{"id","vagaId","mentorId","jovemEmail","status":"confirmado"}` e a vaga passa a `livre: false` |

Validações na ordem da tabela. NFR-1 (concorrência): QUANDO duas requisições pedirem a mesma vaga livre ao mesmo tempo, o sistema DEVE confirmar exatamente uma (201) e recusar a outra (409).

## T2 · Cancelar agendamento: `DELETE /agendamentos/:id`

| Quando | Status | Corpo |
|---|---|---|
| agendamento não existe | 404 | `{"erro":"Agendamento não encontrado"}` |
| já cancelado | 409 | `{"erro":"Agendamento já cancelado"}` |
| sucesso | 200 | `{"id","status":"cancelado"}` e a vaga volta a `livre: true` |

## T3 · Listar vagas livres: `GET /mentores/:id/vagas?data=YYYY-MM-DD`

| Quando | Status | Corpo |
|---|---|---|
| mentor não existe | 404 | `{"erro":"Mentor não encontrado"}` |
| `data` presente e não é uma data válida `YYYY-MM-DD` | 400 | `{"erro":"data inválida"}` |
| sucesso | 200 | `[{"id","inicio"}]` só vagas livres, ordenadas por `inicio` crescente; com `data`, só as daquele dia |

NFR-2 (desempenho): ENQUANTO o mentor tiver até 1.000 vagas, o sistema DEVE responder `GET /mentores/:id/vagas` com p95 abaixo de 50 ms (200 requisições locais).

## Fora do escopo (a IA não deve criar)

Envio de e-mail, autenticação, limite de agendamentos por jovem, regra de dia da semana, notificações, fuso horário diferente de Brasília. Se parecer necessário, **pergunte**.

## Carga esperada (para requisitos não funcionais)

300 jovens, 40 mentores, cerca de 25 vagas por mentor por mês. Pico: abertura da agenda às 9h de segunda, com até 150 tentativas de agendamento no primeiro minuto.
