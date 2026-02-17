import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  
  // 1. ADD THIS LINE: It tells the app it is hosted at https://alahmed786.github.io/game/
  base: '/game/', 

  resolve: {
    alias: {
      // 2. CHECK THIS: Standard React apps usually point '@' to the 'src' folder.
      // If your code imports things like "@/components/Button", change './' to './src'
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
