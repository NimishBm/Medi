import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        // LOCAL DEV: proxy API calls to local Express server
        target: 'http://localhost:5000',
        changeOrigin: true,
        // PRODUCTION (Vercel): this proxy is ignored — vercel.json rewrites handle /api/* routing
        // Uncomment below and comment above when you want local dev to hit the live Vercel backend instead:
        // target: 'https://medi-ecru.vercel.app',
      }
    }
  }
})
