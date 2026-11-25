import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: { outDir: 'build' },
  test: {
    environment: 'jsdom',
    include: ['scripts/*.test.jsx', 'src/features/**/*.test.js'],
    setupFiles: ['scripts/setup.js'],
    restoreMocks: true,
  },
});
