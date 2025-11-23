import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega variáveis do .env (local) ou do sistema (Vercel)
  // O terceiro argumento '' diz para carregar TODAS as variáveis, não só as que começam com VITE_
  const env = loadEnv(mode, process.cwd(), '');
  
  // Tenta pegar do .env carregado, ou do process.env do sistema
  // Se não existir, define como string vazia "" para não quebrar o código com undefined
  const apiKey = env.API_KEY || process.env.API_KEY || "";

  return {
    plugins: [react()],
    define: {
      // Injeta a variável globalmente no código do cliente
      'process.env.API_KEY': JSON.stringify(apiKey)
    }
  };
});
