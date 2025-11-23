import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Fix: Cast process to any to avoid TS error 'Property cwd does not exist on type Process'
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Isso permite que o código continue usando process.env.API_KEY
      // mesmo rodando no navegador, substituindo pelo valor real durante o build na Vercel
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  };
});