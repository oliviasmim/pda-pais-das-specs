import express from 'express';
import { rotasMentores } from './rotas/mentores.js';
import { rotasAgendamento } from './rotas/agendamento.js';
import { rotasCancelamento } from './rotas/cancelamento.js';
import { rotasVagas } from './rotas/vagas.js';

/**
 * Monta o app sem abrir porta. Testes e avaliador usam esta função.
 * @returns {import('express').Express}
 */
export function createApp() {
  const app = express();
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use(rotasMentores());

  // ==== PONTO DE REGISTRO DAS TASKS (T1, T2, T3) ====
  // Cada task importa o próprio arquivo de rotas no topo e registra aqui,
  // numa linha logo abaixo deste comentário. Ex.: app.use(rotasAgendamento());
  app.use(rotasAgendamento());
  app.use(rotasCancelamento());
  app.use(rotasVagas());
  // ==== FIM DO PONTO DE REGISTRO ====

  app.use(tratarErros);
  return app;
}

/**
 * Erros gerais (já existentes, ver docs/spec.md):
 * JSON malformado → 400; qualquer outro erro → 500.
 * @type {import('express').ErrorRequestHandler}
 */
function tratarErros(err, _req, res, _next) {
  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({ erro: 'JSON inválido' });
    return;
  }
  console.error(err);
  res.status(500).json({ erro: 'Erro interno' });
}
