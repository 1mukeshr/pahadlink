import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Project site: https://1mukeshr.github.io/uk-ecommerce/
const PAGES_BASE = '/uk-ecommerce/'

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? PAGES_BASE : '/',
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
}))
