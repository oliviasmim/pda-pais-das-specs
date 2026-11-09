// Hook PreToolUse do Claude Code: impede o agente de editar os testes de aceite.
// Recebe o JSON da ferramenta no stdin. Sair com código 2 bloqueia a edição
// e devolve a mensagem do stderr para o agente.
let entrada = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (pedaco) => { entrada += pedaco; });
process.stdin.on('end', () => {
  let caminho = '';
  try {
    caminho = JSON.parse(entrada)?.tool_input?.file_path ?? '';
  } catch {
    process.exit(0);
  }
  const normalizado = String(caminho).replace(/\\/g, '/');
  const protegido = /(^|\/)tests\/aceite\//.test(normalizado) && !normalizado.endsWith('.ativa');
  if (protegido) {
    console.error(
      `Bloqueado: ${caminho} é um teste de aceite protegido. ` +
        'Corrija o código em src/, não o teste. Se o teste parece errado, pare e pergunte à pessoa.',
    );
    process.exit(2);
  }
  process.exit(0);
});
