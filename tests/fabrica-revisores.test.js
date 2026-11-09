import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ESPECIALIDADES,
  RUBRICA,
  configPadrao,
  validar,
  podeGerar,
  gerarAgente,
  yamlTexto,
  caminhoArquivo,
} from '../site/js/logic/fabrica-revisores.js';

function frontmatter(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---\n/);
  assert.ok(m, 'sem frontmatter');
  return Object.fromEntries(m[1].split('\n').map((l) => {
    const i = l.indexOf(': ');
    return [l.slice(0, i), l.slice(i + 2)];
  }));
}

test('as quatro especialidades geram agentes válidos por padrão', () => {
  for (const id of Object.keys(ESPECIALIDADES)) {
    const cfg = configPadrao(id);
    assert.deepEqual(validar(cfg), [], id);
    const fm = frontmatter(gerarAgente(cfg));
    assert.equal(fm.name, id);
    assert.equal(fm.tools, 'Read, Grep, Glob');
    assert.equal(fm.disallowedTools, 'Edit, Write');
    assert.equal(fm.model, 'sonnet');
    assert.match(fm.description, /Use /);
  }
});

test('toda rubrica padrão aponta para itens que existem', () => {
  const ids = new Set(RUBRICA.map((r) => r.id));
  for (const e of Object.values(ESPECIALIDADES)) {
    for (const r of e.rubrica) assert.ok(ids.has(r), r);
  }
});

test('description sem "quando usar" gera aviso, vazia gera erro', () => {
  const sem = { ...configPadrao(), description: 'Revisa código com cuidado.' };
  assert.ok(validar(sem).some((m) => m.nivel === 'aviso' && m.campo === 'description'));
  const vazia = { ...configPadrao(), description: '  ' };
  assert.ok(validar(vazia).some((m) => m.nivel === 'erro' && m.campo === 'description'));
  assert.equal(podeGerar(vazia), false);
});

test('dar Edit ou Write a um revisor gera aviso sobre virar autor', () => {
  const cfg = { ...configPadrao(), ferramentas: ['Read', 'Edit'], bloquearEdicao: false };
  const aviso = validar(cfg).find((m) => m.campo === 'ferramentas');
  assert.match(aviso.msg, /vira autor/);
  const md = gerarAgente(cfg);
  assert.equal(frontmatter(md).tools, 'Read, Edit');
  assert.equal(frontmatter(md).disallowedTools, undefined);
});

test('com bloqueio ligado, Edit e Write saem de tools e o conflito é avisado', () => {
  const cfg = { ...configPadrao(), ferramentas: ['Read', 'Write'], bloquearEdicao: true };
  assert.match(validar(cfg).find((m) => m.campo === 'ferramentas').msg, /Conflito/);
  assert.equal(frontmatter(gerarAgente(cfg)).tools, 'Read');
});

test('nome precisa ser kebab-case e modelo precisa ser conhecido', () => {
  assert.equal(podeGerar({ ...configPadrao(), nome: 'Revisor Top' }), false);
  assert.equal(podeGerar({ ...configPadrao(), modelo: 'gpt' }), false);
  assert.equal(podeGerar({ ...configPadrao(), ferramentas: [] }), false);
});

test('Bash muda a instrução para comandos só de leitura', () => {
  const md = gerarAgente({ ...configPadrao(), ferramentas: ['Read', 'Grep', 'Glob', 'Bash'] });
  assert.match(md, /git diff main\.\.\.HEAD/);
  assert.match(md, /Nunca escreva arquivos/);
  const semBash = gerarAgente(configPadrao());
  assert.match(semBash, /pergunte antes de revisar/);
});

test('o corpo traz a rubrica escolhida e o formato', () => {
  const md = gerarAgente({ ...configPadrao('cetico-de-testes'), formato: 'veredito' });
  assert.match(md, /Rosas pintadas/);
  assert.match(md, /Falsa Tartaruga/);
  assert.match(md, /Comece com VEREDITO/);
  assert.ok(!md.includes('Navalha.'));
});

test('yamlTexto põe aspas quando o texto quebraria o YAML', () => {
  assert.equal(yamlTexto('Revisa testes. Use antes do PR.'), 'Revisa testes. Use antes do PR.');
  assert.equal(yamlTexto('Atenção: revisa'), '"Atenção: revisa"');
  assert.equal(yamlTexto('"citado"'), '"\\"citado\\""');
  assert.equal(yamlTexto('linha\nquebrada'), 'linha quebrada');
});

test('caminho do arquivo segue .claude/agents/<nome>.md', () => {
  assert.equal(caminhoArquivo(configPadrao('navalha-de-complexidade')), '.claude/agents/navalha-de-complexidade.md');
});
