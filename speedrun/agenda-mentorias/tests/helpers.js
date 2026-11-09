import { createApp } from '../src/app.js';

/**
 * Sobe o app numa porta livre e devolve a URL base e uma função para fechar.
 * @returns {Promise<{ url: string, fechar: () => Promise<void> }>}
 */
export async function subir() {
  const servidor = createApp().listen(0);
  await new Promise((resolve) => servidor.once('listening', resolve));
  const endereco = servidor.address();
  const porta = typeof endereco === 'object' && endereco ? endereco.port : 0;
  return {
    url: `http://127.0.0.1:${porta}`,
    fechar: () => new Promise((resolve) => servidor.close(() => resolve())),
  };
}

/**
 * Faz uma requisição JSON e devolve status e corpo já lido.
 * @param {string} url
 * @param {{ method?: string, body?: unknown }} [opcoes]
 */
export async function pedir(url, { method = 'GET', body } = {}) {
  const resposta = await fetch(url, {
    method,
    headers: body === undefined ? {} : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const texto = await resposta.text();
  let corpo;
  try {
    corpo = texto ? JSON.parse(texto) : undefined;
  } catch {
    corpo = texto;
  }
  return { status: resposta.status, corpo };
}
