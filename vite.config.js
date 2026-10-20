import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' makes the build work under any GitHub Pages sub-path (/<repo>/).
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { chunkSizeWarningLimit: 1500 },
});
