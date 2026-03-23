import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega variáveis de ambiente
  const env = loadEnv(mode, (process as any).cwd(), '');

  // A biblioteca @google/genai espera GEMINI_API_KEY
  const geminiApiKey = env.GEMINI_API_KEY || env.API_KEY || env.VITE_API_KEY || '';
  const huggingFaceApiKey = env.HUGGINGFACE_API_KEY || '';

  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
      sourcemap: false
    }
  };
});
