import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite config with React plugin
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true
  },
  preview: {
    port: 4173
  }
});


