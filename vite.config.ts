import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Fix: Cast process to any to avoid TS error 'Property cwd does not exist on type Process'
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // CRITICAL FIX: On Vercel, system env vars might not be in 'env' object returned by loadEnv if they don't start with VITE_
  // We must check process.env.API_KEY directly as a fallback.
  const apiKey = process.env.API_KEY || env.API_KEY;

  return {
    plugins: [react()],
    define: {
      // Isso permite que o código continue usando process.env.API_KEY
      // mesmo rodando no navegador, substituindo pelo valor real durante o build na Vercel
      'process.env.API_KEY': JSON.stringify(apiKey)
    }
  };
});
