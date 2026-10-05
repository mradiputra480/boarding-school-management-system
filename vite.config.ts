import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/boarding-school-management-system/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('react-dom') || id.includes('react-router-dom')) {
            return 'vendor';
          }
          if (id.includes('/react/')) {
            return 'vendor';
          }
          if (id.includes('zustand') || id.includes('@tanstack/react-query')) {
            return 'state';
          }
          if (id.includes('lucide-react')) {
            return 'ui';
          }
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
})
