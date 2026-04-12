import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
