import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  
  // ✅ CRITICAL FIX: This tells the app it lives in the "/game/" folder
  base: '/game/',

  resolve: {
    alias: {
      // ✅ RECOMMENDATION: Point '@' to 'src' so imports work correctly
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
  },
  server: {
    port: 3000,
    host: true
  }
});
