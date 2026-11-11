// Máquina FIG_REQ · Por dentro de um requisito (O Coelho Branco).
// Do desejo ("tem que ser rápido") ao gate. Requisito sem número é desejo; requisito sem sensor é promessa.
// As latências vêm da mesma simulação do laboratório de percentis (DDIA, 2ª ed., cap. 2).
import { simular as amostrar, estatisticas } from './percentis.js';

const META = 50;
// mediana aproximada de GET /mentores/:id/vagas, em ms, por implementação e número de vagas
const BASE = {
  rapido: { 10: 2, 1000: 9 },
  lento: { 10: 2.5, 1000: 38 },
};
const CODIGO = {
  rapido: ['const livres = vagas.filter((v) => v.livre && (!data || v.inicio.startsWith(data)));', 'livres.sort((a, b) => a.inicio.localeCompare(b.inicio));'],
  lento: ['for (const v of vagas) {', '  vagas.sort((a, b) => a.inicio.localeCompare(b.inicio)); // dentro do loop', '  if (v.livre) livres.push(v);', '}'],
};

export function medir(impl, vagas, { requisicoes = 200, fanout = 1, semente = 7 } = {}) {
  const base = BASE[impl][vagas];
  return estatisticas(amostrar({ requisicoes, fanout, base, cauda: 0.02, lento: base * 6, semente }));
}

const ms = (n) => `${Math.round(n)} ms`;

export const motion = {
  id: 'motion-requisito',
  fig: 'FIG_REQ',
  titulo: 'Por dentro de um requisito',
  lead: 'Um requisito nada mais é do que uma frase que alguém consegue conferir. Siga o "tem que ser rápido" até a segunda-feira às 9h.',
  dica: 'Escreva como desejo, como número, como número com sensor. Depois esconda a carga ou meça a média.',
  ideia:
    'Requisito sem número é desejo: a IA escolhe o mais simples que passa nos testes funcionais. Requisito sem sensor é promessa: a próxima mudança quebra e ninguém vê. Com número, carga descrita e sensor que bloqueia, o Coelho chega na hora.',
  pronto: 'Aperte Rodar. O pacote é o requisito: ele nasce como desejo e vai virando frase, número, teste e gate.',
  razaoIntro: 'Cada parte do requisito: escrita com número, medida por um sensor, ou ainda só desejo e promessa.',
  nota:
    'Isto é uma simulação. As latências são sorteadas pela mesma função do laboratório de percentis (semente fixa), com medianas escolhidas para lembrar o PR #19 da esteira. Ideias do capítulo 2 de Designing Data-Intensive Applications (Kleppmann e Riccomini, 2ª ed.), parafraseadas.',
  estacoes: [
    { id: 'desejo', rotulo: 'Desejo', tipo: 'entrada', x: 0, y: 0, w: 1.8, d: 1.8, h: 0.7, camadas: ['tem que ser rápido'], oQueE: 'O pedido do jeito que ele chega: objetivo claro, "bem" sem medida.' },
    {
      id: 'gato',
      rotulo: 'Perguntas do Gato',
      tipo: 'humano',
      x: 3,
      y: 0,
      w: 2,
      d: 2,
      h: 1,
      camadas: ['o quê?', 'quão bem?', 'como saber?'],
      oQueE: '"Depende bastante de para onde você quer ir." As três perguntas que transformam desejo em requisito: o que o sistema faz, quão bem precisa fazer, como vamos saber.',
    },
    {
      id: 'funcional',
      rotulo: 'Funcional',
      tipo: 'guia',
      x: 6.2,
      y: 0,
      w: 2,
      d: 2,
      h: 0.9,
      camadas: ['EARS: QUANDO… DEVE…'],
      oQueE: 'O que o sistema faz. Em EARS: QUANDO o jovem pedir as vagas de um mentor, o sistema DEVE devolver só as livres, ordenadas por início.',
      nomeComercial: 'requisito funcional',
    },
    {
      id: 'carga',
      rotulo: 'Carga',
      tipo: 'guia',
      x: 9.4,
      y: 0,
      w: 2,
      d: 2,
      h: 0.9,
      camadas: ['300 jovens', '1.000 vagas', 'pico 9h de segunda'],
      oQueE: 'Antes de falar em escalar, descreva a carga: quantos, quanto, quando. Sem isso, o teste roda com 10 vagas e prova nada.',
      nomeComercial: 'load parameters (DDIA)',
    },
    {
      id: 'nfr',
      rotulo: 'NFR',
      tipo: 'guia',
      x: 12.6,
      y: 0,
      w: 2,
      d: 2,
      h: 1.1,
      camadas: ['p95 < 50 ms', 'até 1.000 vagas'],
      oQueE: 'Quão bem. Tempo de resposta é uma distribuição, então a meta usa percentil: p95 abaixo de 50 ms. Média esconde a cauda.',
      nomeComercial: 'requisito não funcional, SLO',
      arquivo: { nome: 'docs/spec.md', texto: 'NFR-2 (desempenho): ENQUANTO o mentor tiver até 1.000 vagas,\no sistema DEVE responder GET /mentores/:id/vagas\ncom p95 abaixo de 50 ms (200 requisições locais).' },
    },
    { id: 'modelo', rotulo: 'Modelo', tipo: 'modelo', x: 15.8, y: 0, w: 2.1, d: 2.1, h: 1.2, camadas: ['escolhe a implementação'], oQueE: 'Sem número, a IA escolhe o código mais simples que passa nos testes funcionais. Com número na janela, ela escolhe pensando nele. Nos dois casos, a próxima mudança pode desfazer.' },
    {
      id: 'sensor',
      rotulo: 'Teste do NFR',
      tipo: 'sensor',
      x: 19,
      y: 0,
      w: 2,
      d: 2,
      h: 1.1,
      camadas: ['200 requisições', 'mede p95'],
      oQueE: 'Um teste que dispara 200 requisições, ordena os tempos e confere o p95. É o NFR virando sensor.',
      arquivo: { nome: 'tests/nfr.test.js', texto: "test('NFR-2: p95 < 50 ms com 1.000 vagas', async () => {\n  semear({ vagas: 1000 });\n  const tempos = await disparar(200, '/mentores/1/vagas');\n  assert.ok(percentil(tempos, 95) < 50);\n});" },
    },
    { id: 'gate', rotulo: 'Gate', tipo: 'sensor', x: 22.2, y: 0, w: 1.9, d: 1.9, h: 0.9, camadas: ['bloqueia o merge'], oQueE: 'O teste do NFR como check obrigatório da CI. Vermelho bloqueia o merge.' },
    {
      id: 'producao',
      rotulo: 'Segunda, 9h',
      tipo: 'saida',
      x: 25.4,
      y: 0,
      w: 2.2,
      d: 2.2,
      h: 1,
      camadas: ['150 tentativas no 1º minuto'],
      oQueE: 'A abertura da agenda: até 150 tentativas no primeiro minuto. É aqui que o Coelho Branco chega na hora ou atrasado.',
    },
  ],
  trilhos: [
    ['desejo', 'gato'],
    ['gato', 'funcional'],
    ['funcional', 'carga'],
    ['carga', 'nfr'],
    ['nfr', 'modelo'],
    ['modelo', 'sensor'],
    ['sensor', 'gate'],
    ['gate', 'producao'],
    ['sensor', 'modelo', { desvio: 2.6 }],
  ],
  montagem: [
    {
      id: 'escrita',
      rotulo: 'Escrito como',
      padrao: 'desejo',
      opcoes: [
        { valor: 'desejo', rotulo: '"tem que ser rápido"' },
        { valor: 'numero', rotulo: 'p95 < 50 ms' },
        { valor: 'sensor', rotulo: 'p95 < 50 ms + teste' },
      ],
    },
    {
      id: 'tela',
      rotulo: 'A tela do jovem chama',
      opcoes: [
        { valor: '1', rotulo: '1 endpoint' },
        { valor: '5', rotulo: '5 endpoints' },
      ],
    },
  ],
  avarias: [
    { id: 'carga-omitida', estacao: 'carga', rotulo: 'Carga não descrita', descricao: 'A spec não diz quantas vagas. O teste roda com 10.' },
    { id: 'media', estacao: 'sensor', rotulo: 'Sensor mede a média', descricao: 'O teste confere a média em vez do p95.' },
    { id: 'sem-gate', estacao: 'gate', rotulo: 'Teste não bloqueia', descricao: 'O teste do NFR roda, mas não é check obrigatório.' },
  ],
  quebraPadrao: 'media',
  legenda: [
    { tipo: 'escrito', rotulo: 'Escrito', cor: 'tinta', descricao: 'está na spec, com número' },
    { tipo: 'medido', rotulo: 'Medido', cor: 'folha', descricao: 'um sensor confere' },
    { tipo: 'desejo', rotulo: 'Desejo', cor: 'ouro', descricao: 'sem número' },
    { tipo: 'promessa', rotulo: 'Promessa', cor: 'uva', descricao: 'número sem sensor' },
    { tipo: 'surpresa', rotulo: 'Surpresa em produção', cor: 'copas', descricao: 'descoberto pelo usuário' },
  ],
  metricas: [
    { id: 'p50', rotulo: 'p50' },
    { id: 'p95', rotulo: 'p95' },
    { id: 'p99', rotulo: 'p99' },
    { id: 'media', rotulo: 'Média' },
    { id: 'tela', rotulo: 'p95 da tela' },
    { id: 'coelho', rotulo: 'O Coelho' },
  ],
  licoes: [
    { titulo: 'Requisito sem número é desejo.', texto: 'Com "tem que ser rápido", a IA ordena a lista dentro do loop. Passa em todos os testes funcionais e chega à segunda-feira com p95 acima da meta.' },
    { titulo: 'Requisito sem sensor é promessa.', texto: 'Com o número escrito, a primeira versão sai rápida. Duas semanas depois, outro agente reintroduz o loop e ninguém mede.' },
    { titulo: 'A média esconde a cauda.', texto: 'Meça a média e o PR lento passa: a maioria das requisições é rápida. Quem cai nos 5% mais lentos espera muito mais. Por isso a meta é p95.' },
    { titulo: 'A tela espera a mais lenta.', texto: 'Com 5 chamadas, a tela só termina quando a última responde. O p95 da tela fica bem acima do p95 de cada endpoint: é a latência de cauda se amplificando.' },
  ],
  desafios: [
    {
      pergunta: 'Escrito como "tem que ser rápido". O que acontece na segunda às 9h?',
      opcoes: ['Chega na hora: a IA sabe que tem que ser rápido', 'Atrasa: a IA escolheu o código mais simples e ninguém mediu', 'O gate bloqueia', 'Depende do modelo'],
      correta: 1,
      explicacao: '"Rápido" não é critério. Sem número, a IA escolhe o mais simples que passa nos testes funcionais. Sem sensor, ninguém vê até o usuário reclamar.',
      montagem: { escrita: 'desejo', tela: '1' },
    },
    {
      pergunta: 'Número e teste, mas o teste confere a média. O PR lento passa?',
      opcoes: ['Não, o teste pega', 'Sim: a média fica abaixo de 50 ms e o p95 não', 'Só se a carga estiver descrita', 'O lint pega'],
      correta: 1,
      explicacao: 'A maior parte das requisições é rápida e puxa a média para baixo. A cauda (os 5% mais lentos) é justamente o que o p95 olha.',
      montagem: { escrita: 'sensor', tela: '1' },
      avarias: ['media'],
    },
    {
      pergunta: 'Número, teste e gate, mas a spec não descreve a carga. O que o teste prova?',
      opcoes: ['Que aguenta 1.000 vagas', 'Que aguenta 10 vagas', 'Nada, ele não roda', 'Que o p99 está ok'],
      correta: 1,
      explicacao: 'Sem a carga, o teste é semeado com o que estiver à mão. Com 10 vagas, até o loop lento responde em 3 ms.',
      montagem: { escrita: 'sensor', tela: '1' },
      avarias: ['carga-omitida'],
    },
    {
      pergunta: 'Tudo certo no endpoint, mas a tela chama 5 endpoints. O p95 da tela fica…',
      opcoes: ['Igual ao do endpoint', 'Cinco vezes o do endpoint', 'Acima do endpoint: a tela espera a mais lenta das 5', 'Abaixo, porque roda em paralelo'],
      correta: 2,
      explicacao: 'Em paralelo, a tela espera a resposta mais lenta das cinco. A chance de uma delas cair na cauda é cinco vezes maior.',
      montagem: { escrita: 'sensor', tela: '5' },
    },
  ],
  simular,
};

export function simular(montagem, avarias = new Set()) {
  const escrita = montagem.escrita;
  const temNumero = escrita !== 'desejo';
  const temSensor = escrita === 'sensor';
  const cargaDescrita = temNumero && !avarias.has('carga-omitida');
  const mediaNoSensor = avarias.has('media');
  const gateBloqueia = temSensor && !avarias.has('sem-gate');
  const fanout = Number(montagem.tela) || 1;
  const vagasTeste = cargaDescrita ? 1000 : 10;

  let impl = temNumero ? 'rapido' : 'lento';
  const passos = [];
  let ultima = null;
  const metr = (stats, extra = {}) =>
    stats
      ? {
          p50: ms(stats.p50),
          p95: ms(stats.p95),
          'p95:tom': stats.p95 < META ? 'ok' : 'falha',
          p99: ms(stats.p99),
          media: ms(stats.media),
          'media:tom': stats.media < META ? 'ok' : 'falha',
          ...extra,
        }
      : { p50: '—', p95: '—', p99: '—', media: '—', tela: '—', coelho: '—', ...extra };

  const desligadas = [];
  if (!temNumero) desligadas.push('carga', 'nfr', 'sensor', 'gate');
  else if (!temSensor) desligadas.push('sensor', 'gate');

  passos.push({
    estacao: 'desejo',
    titulo: 'O desejo',
    narracao: 'O pedido chega: "o jovem precisa ver as vagas livres de um mentor, e tem que ser rápido". O Coelho já está olhando o relógio.',
    dentro: { titulo: 'pedido', linhas: ['"Mostrar as vagas livres do mentor. Tem que ser rápido."'] },
    metricas: metr(null),
    razao: [{ tipo: 'desejo', texto: '"Tem que ser rápido."' }],
    rastro: 'desejo: "tem que ser rápido"',
  });

  passos.push({
    estacao: 'gato',
    titulo: 'O Gato pergunta',
    marca: temNumero ? 'ok' : 'alerta',
    narracao: temNumero
      ? 'Antes do código, as três perguntas: o que exatamente, quão bem e como vamos saber. Cada resposta vira uma linha da spec.'
      : 'Ninguém fez as perguntas do Gato. O pedido segue como está: objetivo claro, "rápido" sem medida.',
    dentro: { titulo: 'perguntas', linhas: ['O que exatamente?', 'Quão rápido, para quantos?', 'Como vamos saber que chegou?'], tom: temNumero ? 'ok' : 'alerta' },
    metricas: metr(null),
    rastro: temNumero ? 'perguntas do Gato respondidas' : 'perguntas do Gato puladas',
  });

  passos.push({
    estacao: 'funcional',
    titulo: 'Requisito funcional',
    marca: 'ok',
    narracao: 'O que o sistema faz, em EARS. Esta parte quase todo mundo escreve, e a IA quase sempre acerta.',
    dentro: { titulo: 'EARS', linhas: ['QUANDO o jovem pedir as vagas de um mentor,', 'o sistema DEVE devolver só as livres, ordenadas por início.'] },
    metricas: metr(null),
    razao: [{ tipo: 'escrito', texto: 'Funcional: só vagas livres, ordenadas por início.' }],
    rastro: 'funcional escrito em EARS',
  });

  if (temNumero) {
    passos.push({
      estacao: 'carga',
      titulo: cargaDescrita ? 'Descreve a carga' : 'Carga em branco',
      marca: cargaDescrita ? 'ok' : 'alerta',
      narracao: cargaDescrita
        ? 'Primeiro a carga, depois a meta: 300 jovens, 40 mentores, até 1.000 vagas por mentor, pico de 150 tentativas no primeiro minuto de segunda às 9h.'
        : 'A spec tem a meta, mas não diz para quantas vagas. Quem escrever o teste vai semear com o que estiver à mão.',
      dentro: { titulo: 'carga', linhas: cargaDescrita ? ['300 jovens · 40 mentores', 'até 1.000 vagas por mentor', 'pico: 150 tentativas no 1º minuto'] : ['(não descrita)'], tom: cargaDescrita ? 'ok' : 'alerta' },
      metricas: metr(null),
      razao: [{ tipo: cargaDescrita ? 'escrito' : 'desejo', texto: cargaDescrita ? 'Carga: até 1.000 vagas por mentor, pico às 9h de segunda.' : 'Carga: não descrita.' }],
      rastro: `carga: ${cargaDescrita ? 'descrita' : 'omitida'}`,
    });
  }

  passos.push({
    estacao: temNumero ? 'nfr' : 'funcional',
    titulo: temNumero ? 'NFR com número' : 'Só o desejo',
    marca: temNumero ? 'ok' : 'alerta',
    narracao: temNumero
      ? `Quão bem, com número: p95 abaixo de ${META} ms com até 1.000 vagas. Percentil, porque tempo de resposta é uma distribuição.${temSensor ? '' : ' Repare: ninguém escreveu ainda como medir.'}`
      : 'O "rápido" fica como está. Na spec não há nada que alguém consiga conferir.',
    dentro: { titulo: temNumero ? 'NFR-2' : 'spec', linhas: temNumero ? ['ENQUANTO o mentor tiver até 1.000 vagas,', `o sistema DEVE responder com p95 < ${META} ms.`] : ['"Tem que ser rápido."'], tom: temNumero ? 'ok' : 'alerta' },
    metricas: metr(null),
    razao: [{ tipo: temNumero ? (temSensor ? 'escrito' : 'promessa') : 'desejo', texto: temNumero ? `NFR-2: p95 < ${META} ms${temSensor ? '' : ' (sem sensor)'}.` : 'NFR: só "tem que ser rápido".' }],
    rastro: temNumero ? `NFR-2: p95 < ${META} ms` : 'NFR: desejo',
  });

  passos.push({
    estacao: 'modelo',
    titulo: 'IA implementa',
    marca: impl === 'rapido' ? 'ok' : 'alerta',
    narracao:
      impl === 'rapido'
        ? 'Com a meta na janela, o modelo filtra e ordena uma vez só. Os testes funcionais passam.'
        : 'Sem meta, o modelo escolhe o que parece mais simples: ordena a lista dentro do loop. Os testes funcionais passam do mesmo jeito.',
    dentro: { titulo: 'src/rotas/vagas.js', linhas: CODIGO[impl], tom: impl === 'rapido' ? 'ok' : 'alerta' },
    metricas: metr(null),
    rastro: `implementação inicial: ${impl === 'rapido' ? 'filter + 1 sort' : 'sort dentro do loop'}`,
  });

  const rodarSensor = (rotulo) => {
    const stats = medir(impl, vagasTeste);
    const valor = mediaNoSensor ? stats.media : stats.p95;
    const passa = valor < META;
    ultima = stats;
    passos.push({
      estacao: 'sensor',
      titulo: rotulo,
      marca: passa ? 'ok' : 'falha',
      narracao: passa
        ? `O teste dispara 200 requisições com ${vagasTeste === 1000 ? '1.000' : vagasTeste} vagas: ${mediaNoSensor ? 'média' : 'p95'} = ${ms(valor)}. Verde.${(!cargaDescrita || mediaNoSensor) && impl === 'lento' ? ' Perceba: verde, mas com o código lento. O sensor está olhando para o lugar errado.' : ''}`
        : `O teste dispara 200 requisições com ${vagasTeste === 1000 ? '1.000' : vagasTeste} vagas: p95 = ${ms(stats.p95)}. Acima de ${META} ms. Vermelho.`,
      dentro: { titulo: `tests/nfr.test.js · ${vagasTeste === 1000 ? '1.000' : vagasTeste} vagas`, linhas: [`p50 ${ms(stats.p50)} · p95 ${ms(stats.p95)} · p99 ${ms(stats.p99)}`, `média ${ms(stats.media)}`, `confere: ${mediaNoSensor ? 'média' : 'p95'} < ${META} ms → ${passa ? '✓' : '✗'}`], tom: passa ? 'ok' : 'falha' },
      metricas: metr(stats),
      razao: [{ tipo: 'medido', texto: `Teste do NFR (${vagasTeste === 1000 ? '1.000' : vagasTeste} vagas, ${mediaNoSensor ? 'média' : 'p95'}): ${ms(valor)} ${passa ? 'passa' : 'reprova'}.` }],
      rastro: `teste NFR: ${mediaNoSensor ? 'média' : 'p95'} ${ms(valor)} com ${vagasTeste === 1000 ? '1.000' : vagasTeste} vagas → ${passa ? 'verde' : 'vermelho'}`,
    });
    return passa;
  };

  if (temSensor) rodarSensor('Teste do NFR');

  // regressão: PR #19
  const antes = impl;
  impl = 'lento';
  passos.push({
    estacao: 'modelo',
    titulo: 'Duas semanas depois',
    marca: 'alerta',
    narracao:
      antes === 'lento'
        ? 'Duas semanas depois, outro agente acrescenta o filtro por data. O loop lento continua lá; ninguém nunca mediu.'
        : 'Duas semanas depois, outro agente acrescenta o filtro por data (PR #19) e, sem perceber, ordena dentro do loop. A meta continua escrita na spec.',
    dentro: { titulo: 'PR #19 · feat(T3): filtra vagas por data', linhas: CODIGO.lento, tom: 'alerta' },
    metricas: metr(ultima),
    rastro: 'PR #19: sort dentro do loop',
  });

  let bloqueou = false;
  if (temSensor) {
    const passa = rodarSensor('Teste no PR #19');
    if (!passa && gateBloqueia) {
      bloqueou = true;
      passos.push({
        estacao: 'gate',
        titulo: 'Gate bloqueia',
        marca: 'falha',
        narracao: 'O teste do NFR é check obrigatório. O merge do PR #19 fica bloqueado e a mensagem volta para o agente com o número.',
        dentro: { titulo: 'CI', linhas: [`✗ NFR-2: p95 ${ms(ultima.p95)} (meta < ${META} ms)`, 'merge bloqueado'], tom: 'falha' },
        metricas: metr(ultima),
        rastro: 'gate: merge bloqueado',
      });
      impl = 'rapido';
      ultima = medir(impl, vagasTeste);
      passos.push({
        estacao: 'modelo',
        titulo: 'Agente corrige',
        trilhos: [['sensor', 'modelo']],
        marca: 'ok',
        narracao: 'O agente lê a saída do teste e tira o sort de dentro do loop. Testes funcionais e NFR verdes.',
        dentro: { titulo: 'correção', linhas: CODIGO.rapido, tom: 'ok' },
        metricas: metr(ultima),
        rastro: 'agente corrige: filter + 1 sort',
      });
    } else if (!passa) {
      passos.push({
        estacao: 'gate',
        titulo: 'Vermelho ignorado',
        marca: 'alerta',
        narracao: 'O teste reprova, mas não é check obrigatório. O PR #19 entra com um X vermelho que ninguém abriu.',
        dentro: { titulo: 'CI', linhas: [`✗ NFR-2: p95 ${ms(ultima.p95)}`, 'merge liberado (check opcional)'], tom: 'alerta' },
        metricas: metr(ultima),
        rastro: 'gate: vermelho ignorado',
      });
    } else {
      passos.push({
        estacao: 'gate',
        titulo: 'Gate verde',
        marca: 'alerta',
        narracao: 'O gate fica verde porque o sensor disse verde. O gate é tão bom quanto o que o sensor mede.',
        metricas: metr(ultima),
        rastro: 'gate: verde (sensor enganado)',
      });
    }
  }

  // produção: segunda às 9h
  const prod = medir(impl, 1000, { requisicoes: 2000, semente: 11 });
  const telaStats = medir(impl, 1000, { requisicoes: 2000, fanout, semente: 11 });
  const atrasado = prod.p95 >= META;
  const telaLenta = telaStats.p95 >= META;
  passos.push({
    estacao: 'producao',
    titulo: 'Segunda, 9h',
    marca: atrasado ? 'falha' : telaLenta ? 'alerta' : 'ok',
    narracao: atrasado
      ? `A agenda abre. Com 1.000 vagas, o p95 é ${ms(prod.p95)}${fanout > 1 ? ` e a tela, que espera 5 chamadas, fica em ${ms(telaStats.p95)}` : ''}. O Coelho chegou atrasado e quem avisou foi o jovem.`
      : fanout > 1
        ? `O endpoint responde com p95 ${ms(prod.p95)}. A tela chama 5 endpoints e espera o mais lento: p95 da tela ${ms(telaStats.p95)}. ${telaLenta ? 'O endpoint cumpre a meta e a tela não: a meta precisa existir também para a tela.' : 'Cauda maior, ainda na meta.'}`
        : `A agenda abre. Com 1.000 vagas, p95 de ${ms(prod.p95)}. O Coelho chegou na hora.`,
    dentro: { titulo: 'produção · 1.000 vagas', linhas: [`p50 ${ms(prod.p50)} · p95 ${ms(prod.p95)} · p99 ${ms(prod.p99)}`, `média ${ms(prod.media)}`, fanout > 1 ? `tela (5 chamadas): p95 ${ms(telaStats.p95)}` : 'tela (1 chamada)'], tom: atrasado ? 'falha' : telaLenta ? 'alerta' : 'ok' },
    metricas: metr(prod, {
      tela: ms(telaStats.p95),
      'tela:tom': telaLenta ? (atrasado ? 'falha' : 'alerta') : 'ok',
      coelho: atrasado ? 'atrasado' : telaLenta ? 'no limite' : 'na hora',
      'coelho:tom': atrasado ? 'falha' : telaLenta ? 'alerta' : 'ok',
    }),
    razao: atrasado ? [{ tipo: 'surpresa', texto: `Segunda 9h: p95 ${ms(prod.p95)} com 1.000 vagas.` }] : telaLenta ? [{ tipo: 'surpresa', texto: `A tela com 5 chamadas: p95 ${ms(telaStats.p95)}.` }] : [],
    rastro: `produção: p95 ${ms(prod.p95)}${fanout > 1 ? `, tela ${ms(telaStats.p95)}` : ''} → ${atrasado ? 'atrasado' : 'na hora'}`,
  });

  return {
    entrada: { titulo: 'GET /mentores/:id/vagas', linhas: [`escrito como: ${motion.montagem[0].opcoes.find((o) => o.valor === escrita).rotulo}`, `a tela chama ${fanout} endpoint(s)`] },
    desligadas,
    passos,
    saida: {
      titulo: atrasado ? 'O Coelho chegou atrasado' : telaLenta ? 'Endpoint na meta, tela no limite' : 'O Coelho chegou na hora',
      status: atrasado ? 'falha' : telaLenta ? 'alerta' : 'ok',
      linhas: [
        `Produção (1.000 vagas): p50 ${ms(prod.p50)}, p95 ${ms(prod.p95)}, p99 ${ms(prod.p99)}`,
        fanout > 1 ? `Tela com 5 chamadas: p95 ${ms(telaStats.p95)}` : 'Tela com 1 chamada.',
        bloqueou ? 'O gate bloqueou a regressão do PR #19.' : temSensor ? 'O sensor não bloqueou a regressão.' : temNumero ? 'Número sem sensor: ninguém mediu a regressão.' : 'Sem número: ninguém tinha como medir.',
      ],
    },
    numeros: { p95: prod.p95, media: prod.media, tela: telaStats.p95, atrasado, bloqueou },
  };
}
