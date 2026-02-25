import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  
  // ✅ FIX: Must be absolute '/' for Vercel. Telegram WebApp crashes if it sees './' here!
  base: '/',

  resolve: {
    alias: {
      // Point '@' to the CURRENT directory (root), since you don't have a 'src' folder
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
      // Allow serving files from the root directory without security blocking
      strict: false,
    }
  }
});
