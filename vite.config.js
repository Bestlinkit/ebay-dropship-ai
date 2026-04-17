import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
    proxy: {
      '/api/ebay': {
        target: 'https://api.ebay.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ebay/, ''),
      },
      '/ws/ebay': {
        target: 'https://api.ebay.com/ws/api.dll',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ws\/ebay/, ''),
      },
      '/api/ali-ds-proxy': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  },
  preview: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
    proxy: {
      '/api/ebay': {
        target: 'https://api.ebay.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ebay/, ''),
      }
    }
  },
})
