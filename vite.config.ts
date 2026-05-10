import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages يحتاج base باسم المستودع.
// لو غيرت اسم المستودع، غيّر القيمة في VITE_BASE_PATH داخل GitHub Action.
const base = process.env.VITE_BASE_PATH || '/reimagined-octo-guide/';

export default defineConfig({
  plugins: [react()],
  base,
  server: { port: 5173 },
  build: { outDir: 'dist' }
});
