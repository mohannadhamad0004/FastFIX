import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Forward /api calls to the Node server so the browser never needs its URL or keys
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
})
