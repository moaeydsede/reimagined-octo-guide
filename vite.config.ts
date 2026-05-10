import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// مهم جدًا لـ GitHub Pages لأن اسم المستودع هو reimagined-octo-guide
export default defineConfig({
  plugins: [react()],
  base: '/reimagined-octo-guide/',
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});
