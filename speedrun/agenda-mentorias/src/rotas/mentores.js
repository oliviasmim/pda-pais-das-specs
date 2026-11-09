import { Router } from 'express';
import { repo } from '../repo.js';

/**
 * Rotas de mentores. Este arquivo é o padrão a seguir nas tasks:
 * um Router por arquivo, handlers async, erros no formato { erro }.
 */
export function rotasMentores() {
  const router = Router();

  router.get('/mentores', async (_req, res) => {
    const mentores = await repo.listarMentores();
    mentores.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    res.status(200).json(mentores.map(({ id, nome, area }) => ({ id, nome, area })));
  });

  return router;
}
