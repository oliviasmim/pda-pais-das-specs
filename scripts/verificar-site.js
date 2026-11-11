import { readFile, readdir, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { licoes, cartas, aulas, semanas } from '../site/content/curriculo.js';
import { termos } from '../site/content/glossario.js';
import { validarQuiz } from '../site/js/quiz.js';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const site = join(raiz, 'site');
const erros = [];
const avisos = [];

const existe = (p) =>
  access(p).then(
    () => true,
    () => false,
  );

const idsCartas = new Set(cartas.map((c) => c.id));
const idsLicoes = new Set(licoes.map((l) => l.id));
const PROIBIDOS = [/carteira digital/i, /GET \/saldo/i, /\/saldo\b/];

if (idsLicoes.size !== licoes.length) erros.push('curriculo: há ids de lição repetidos');
if (semanas.length !== 14) erros.push(`curriculo: esperava 14 semanas, tem ${semanas.length}`);
for (const a of aulas) for (const id of a.licoes) if (!idsLicoes.has(id)) erros.push(`curriculo: ${a.id} cita lição inexistente "${id}"`);
for (const t of termos) if (t.licao && !idsLicoes.has(t.licao)) erros.push(`glossario: "${t.termo}" aponta para lição inexistente "${t.licao}"`);

async function conferirLab(labId, onde) {
  const js = join(site, 'js', 'labs', `${labId}.js`);
  if (!(await existe(js))) {
    erros.push(`${onde}: laboratório "${labId}" sem site/js/labs/${labId}.js`);
    return;
  }
  const codigo = await readFile(js, 'utf8');
  if (!/export\s+(async\s+)?function\s+mount\s*\(/.test(codigo) && !/export\s*\{[^}]*\bmount\b/.test(codigo)) erros.push(`${onde}: site/js/labs/${labId}.js não exporta mount()`);
  if (!(await existe(join(site, 'css', 'labs', `${labId}.css`)))) avisos.push(`${onde}: laboratório "${labId}" sem css/labs/${labId}.css`);
}

function conferirLinksInternos(texto, onde) {
  for (const m of texto.matchAll(/#\/licao\/([a-z0-9-]+)/g)) if (!idsLicoes.has(m[1])) erros.push(`${onde}: link para lição inexistente "${m[1]}"`);
  for (const m of texto.matchAll(/#\/baralho\?carta=([a-z0-9-]+)/g)) if (!idsCartas.has(m[1])) erros.push(`${onde}: link para carta inexistente "${m[1]}"`);
  for (const m of texto.matchAll(/#\/([a-z]+)/g)) if (!['licao', 'baralho', 'glossario', 'maquinas', 'maquina'].includes(m[1])) erros.push(`${onde}: rota desconhecida "#/${m[1]}"`);
}

for (const l of licoes) {
  const onde = `lição ${l.id}`;
  const mdPath = join(site, 'content', 'licoes', `${l.id}.md`);
  if (!(await existe(mdPath))) {
    erros.push(`${onde}: falta content/licoes/${l.id}.md`);
    continue;
  }
  const md = await readFile(mdPath, 'utf8');

  for (const secao of ['## O problema', '## O conceito', '## Pratique', '## Leve com você', '## Termos-chave']) {
    if (!md.includes(secao)) avisos.push(`${onde}: sem a seção "${secao}"`);
  }

  const labsNoTexto = [...md.matchAll(/data-lab="([a-z0-9-]+)"/g)].map((m) => m[1]);
  for (const lab of labsNoTexto) await conferirLab(lab, onde);
  for (const lab of l.labs) if (!labsNoTexto.includes(lab)) erros.push(`${onde}: curriculo lista o lab "${lab}", mas o texto não monta`);
  for (const lab of labsNoTexto) if (!l.labs.includes(lab)) avisos.push(`${onde}: o texto monta "${lab}", mas o curriculo não lista`);

  for (const m of md.matchAll(/data-cartas="([^"]+)"/g)) {
    for (const id of m[1].split(',').map((s) => s.trim())) if (!idsCartas.has(id)) erros.push(`${onde}: carta inexistente "${id}"`);
  }

  conferirLinksInternos(md, onde);
  for (const p of PROIBIDOS) if (p.test(md)) erros.push(`${onde}: usa o domínio do Encontro 2 da OIP (${p}). Use a agenda de mentorias.`);

  const quizPath = join(site, 'content', 'quiz', `${l.id}.json`);
  if (!(await existe(quizPath))) {
    erros.push(`${onde}: falta content/quiz/${l.id}.json`);
  } else {
    try {
      const quiz = JSON.parse(await readFile(quizPath, 'utf8'));
      if (quiz.licao !== l.id) erros.push(`${onde}: quiz com "licao" = "${quiz.licao}"`);
      for (const e of validarQuiz(quiz)) erros.push(`${onde}: quiz: ${e}`);
    } catch (e) {
      erros.push(`${onde}: quiz não é JSON válido (${e.message})`);
    }
  }
}

const labsJs = (await readdir(join(site, 'js', 'labs')).catch(() => [])).filter((f) => f.endsWith('.js')).map((f) => f.replace(/\.js$/, ''));
const usados = new Set(licoes.flatMap((l) => l.labs));
for (const lab of labsJs) if (!usados.has(lab)) avisos.push(`site/js/labs/${lab}.js não é usado por nenhuma lição`);

for (const dir of ['js/labs', 'js/logic', 'js/views', 'content/licoes']) {
  const arquivos = await readdir(join(site, dir)).catch(() => []);
  for (const f of arquivos) {
    const texto = await readFile(join(site, dir, f), 'utf8');
    for (const p of PROIBIDOS) if (p.test(texto)) erros.push(`site/${dir}/${f}: usa o domínio do Encontro 2 da OIP (${p})`);
  }
}


const { maquinas } = await import('../site/content/maquinas.js');
const { validarMotion } = await import('../site/js/logic/motion.js');
for (const m of maquinas) {
  if (!idsLicoes.has(m.licao)) erros.push(`maquinas: "${m.id}" aponta para lição inexistente "${m.licao}"`);
  else if (!licoes.find((l) => l.id === m.licao).labs.includes(m.id)) erros.push(`maquinas: "${m.id}" não está na lição "${m.licao}"`);
  await conferirLab(m.id, `máquina ${m.id}`);
  try {
    const { motion } = await import(`../site/js/logic/${m.id}.js`);
    if (motion.id !== m.id) erros.push(`máquina ${m.id}: o id da definição é "${motion.id}"`);
    for (const e of validarMotion(motion)) erros.push(`máquina ${m.id}: ${e}`);
  } catch (e) {
    erros.push(`máquina ${m.id}: falta site/js/logic/${m.id}.js (${e.message})`);
  }
}

for (const a of avisos) console.log(`aviso  ${a}`);
for (const e of erros) console.log(`ERRO   ${e}`);
console.log(`\n${licoes.length} lições, ${usados.size} laboratórios, ${erros.length} erro(s), ${avisos.length} aviso(s).`);
process.exit(erros.length ? 1 : 0);
