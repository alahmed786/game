Import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  
  // ✅ FIX 1: Use './' so it works on any domain or folder (GitHub Pages, Vercel, etc.)
  base: './',

  resolve: {
    alias: {
      // ✅ FIX 2: Point '@' to the CURRENT directory (root), since you don't have a 'src' folder
      '@': path.resolve(__dirname, './'),
    },
  },

  build: {
    outDir: 'dist',
    sourcemap: true, // Keep true for debugging if needed
  },

  server: {
    port: 3000,
    host: true,
    fs: {
      // ✅ FIX 3: Allow serving files from the root directory without security blocking
      strict: false,
    }
  }
});

Update this code
