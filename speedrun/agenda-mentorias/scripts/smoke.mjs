// Sensor "smoke": sobe o servidor de verdade (src/server.js) e chama /health.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const filho = spawn(process.execPath, ['src/server.js'], {
  cwd: raiz,
  env: { ...process.env, PORT: '0' },
  stdio: ['ignore', 'pipe', 'pipe'],
});

const prazo = setTimeout(() => falhar('o servidor não subiu em 10 s'), 10_000);
let saida = '';

/** @param {string} motivo */
function falhar(motivo) {
  console.error(`smoke: FALHOU, ${motivo}`);
  if (saida) console.error(saida);
  filho.kill();
  process.exit(1);
}

filho.stderr.on('data', (d) => { saida += d; });
filho.on('exit', (codigo) => {
  if (codigo !== null && codigo !== 0) falhar(`o servidor saiu com código ${codigo}`);
});
filho.stdout.on('data', async (d) => {
  saida += d;
  const achou = /porta (\d+)/.exec(saida);
  if (!achou) return;
  try {
    const resposta = await fetch(`http://127.0.0.1:${achou[1]}/health`);
    const corpo = await resposta.json();
    if (resposta.status !== 200 || corpo.status !== 'ok') falhar(`/health respondeu ${resposta.status}`);
    clearTimeout(prazo);
    console.log('smoke: servidor subiu e /health respondeu 200.');
    filho.kill();
    process.exit(0);
  } catch (erro) {
    falhar(String(erro));
  }
});
