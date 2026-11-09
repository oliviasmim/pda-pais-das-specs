import { createApp } from './app.js';

const porta = Number(process.env.PORT ?? 3000);
const servidor = createApp().listen(porta, () => {
  const endereco = servidor.address();
  const portaReal = typeof endereco === 'object' && endereco ? endereco.port : porta;
  console.log(`agenda-mentorias ouvindo na porta ${portaReal}`);
});
