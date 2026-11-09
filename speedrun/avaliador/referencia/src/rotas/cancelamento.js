import { Router } from 'express';
import { repo } from '../repo.js';

/** T2 · DELETE /agendamentos/:id (docs/tasks/T2.md) */
export function rotasCancelamento() {
  const router = Router();

  router.delete('/agendamentos/:id', async (req, res) => {
    const id = Number(req.params.id);
    const agendamento = Number.isInteger(id) ? await repo.buscarAgendamento(id) : undefined;
    if (!agendamento) return res.status(404).json({ erro: 'Agendamento não encontrado' });
    if (agendamento.status === 'cancelado') return res.status(409).json({ erro: 'Agendamento já cancelado' });

    await repo.atualizarAgendamento(id, { status: 'cancelado' });
    await repo.atualizarVaga(agendamento.vagaId, { livre: true });
    return res.status(200).json({ id, status: 'cancelado' });
  });

  return router;
}
