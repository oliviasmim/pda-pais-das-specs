// Sensor "rosas pintadas": confere se os testes de aceite continuam iguais aos originais.
// Compara o sha256 de cada arquivo listado em tests/aceite/CHECKSUMS.
import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** @param {string} arquivo */
export function hashNormalizado(arquivo) {
  const texto = readFileSync(arquivo, 'utf8').replace(/\r\n/g, '\n');
  return createHash('sha256').update(texto).digest('hex');
}

const linhas = readFileSync(path.join(raiz, 'tests/aceite/CHECKSUMS'), 'utf8')
  .split('\n')
  .map((l) => l.trim())
  .filter(Boolean);

const pintadas = [];
for (const linha of linhas) {
  const [esperado, relativo] = linha.split(/\s+/);
  const arquivo = path.join(raiz, relativo);
  if (!existsSync(arquivo) || hashNormalizado(arquivo) !== esperado) pintadas.push(relativo);
}

if (pintadas.length > 0) {
  console.error('🌹 Rosas pintadas! Estes testes de aceite foram alterados ou apagados:');
  for (const p of pintadas) console.error(`   - ${p}`);
  console.error('Volte o arquivo ao original (git checkout -- <arquivo>) e corrija o código, não o teste.');
  process.exit(1);
}
console.log(`guarda: ${linhas.length} testes de aceite intactos.`);
