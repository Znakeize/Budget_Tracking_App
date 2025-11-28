
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Safely expose API_KEY without overwriting the entire process.env object.
      // Default to empty string to prevent build crashes if the env var is missing.
      'process.env.API_KEY': JSON.stringify(env.API_KEY || '')
    },
    server: {
      host: true
    }
  };
});
