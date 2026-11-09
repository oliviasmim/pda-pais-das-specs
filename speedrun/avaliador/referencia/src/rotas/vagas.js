import { Router } from 'express';
import { repo } from '../repo.js';

/** @param {unknown} texto */
function dataValida(texto) {
  if (typeof texto !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;
  const [ano, mes, dia] = texto.split('-').map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  return data.getUTCFullYear() === ano && data.getUTCMonth() === mes - 1 && data.getUTCDate() === dia;
}

/** T3 · GET /mentores/:id/vagas?data=YYYY-MM-DD (docs/tasks/T3.md) */
export function rotasVagas() {
  const router = Router();

  router.get('/mentores/:id/vagas', async (req, res) => {
    const mentor = await repo.buscarMentor(Number(req.params.id));
    if (!mentor) return res.status(404).json({ erro: 'Mentor não encontrado' });

    const { data } = req.query;
    if (data !== undefined && !dataValida(data)) return res.status(400).json({ erro: 'data inválida' });

    const vagas = await repo.listarVagasDoMentor(mentor.id);
    const livres = vagas
      .filter((v) => v.livre && (data === undefined || v.inicio.startsWith(`${data}T`)))
      .sort((a, b) => a.inicio.localeCompare(b.inicio))
      .map(({ id, inicio }) => ({ id, inicio }));
    return res.status(200).json(livres);
  });

  return router;
}
