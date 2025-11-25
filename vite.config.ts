
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // This is crucial to support the existing code that uses process.env.API_KEY
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      'process.env': {}
    },
    server: {
      host: true
    }
  };
});
