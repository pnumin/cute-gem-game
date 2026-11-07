import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages 주소(https://pnumin.github.io/cute-gem-game/)에 맞춘 base 경로
export default defineConfig({
  plugins: [react()],
  base: '/cute-gem-game/',
});
