import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5051,
    host: '127.0.0.1', // Bind to IPv4 to avoid IPv6 permission issues
    strictPort: false, // Try next available port if 3000 is taken
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})

