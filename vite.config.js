import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Project Pages URL: https://1mukeshr.github.io/pahadlink/
const PAGES_BASE = '/pahadlink/'

export default defineConfig(({ command }) => ({
  // Absolute base avoids broken asset URLs on GitHub Pages.
  base: command === 'build' ? PAGES_BASE : '/',
  plugins: [react()],
  build: {
    sourcemap: false,
    cssCodeSplit: true,
    modulePreload: { polyfill: true },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
}))
