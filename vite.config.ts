import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/proxy/lovable': {
        target: 'https://docs.lovable.dev',
        changeOrigin: true,
        rewrite: (path) => path.replace('/proxy/lovable', '')
      },
      '/proxy/anthropic-news': {
        target: 'https://www.anthropic.com',
        changeOrigin: true,
        rewrite: (path) => path.replace('/proxy/anthropic-news', '')
      },
      '/proxy/anthropic-docs': {
        target: 'https://docs.anthropic.com',
        changeOrigin: true,
        rewrite: (path) => path.replace('/proxy/anthropic-docs', '')
      }
    }
  }
})
