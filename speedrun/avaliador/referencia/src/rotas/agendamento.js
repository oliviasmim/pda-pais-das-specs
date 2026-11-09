import { Router } from 'express';
import { repo } from '../repo.js';

const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** T1 · POST /agendamentos (docs/tasks/T1.md) */
export function rotasAgendamento() {
  const router = Router();

  router.post('/agendamentos', async (req, res) => {
    const { vagaId, jovemEmail } = req.body ?? {};
    if (!Number.isInteger(vagaId)) return res.status(400).json({ erro: 'vagaId é obrigatório' });
    if (typeof jovemEmail !== 'string' || jovemEmail === '') {
      return res.status(400).json({ erro: 'jovemEmail é obrigatório' });
    }
    if (!FORMATO_EMAIL.test(jovemEmail)) return res.status(400).json({ erro: 'jovemEmail inválido' });

    const reserva = await repo.reservarVaga(vagaId);
    if (reserva.resultado !== 'ok') {
      return reserva.resultado === 'inexistente'
        ? res.status(404).json({ erro: 'Vaga não encontrada' })
        : res.status(409).json({ erro: 'Vaga indisponível' });
    }

    const agendamento = await repo.criarAgendamento({
      vagaId,
      mentorId: reserva.vaga.mentorId,
      jovemEmail,
      status: 'confirmado',
    });
    return res.status(201).json(agendamento);
  });

  return router;
}
