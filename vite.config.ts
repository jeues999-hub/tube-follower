import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    port: 3000,
    host: '0.0.0.0',
    headers: {
      "Content-Security-Policy": "frame-ancestors 'self' https://*.google.com https://localhost.corp.google.com:26001;"
    }
  },
  preview: {
    port: 3000,
    host: '0.0.0.0'
  }
})
