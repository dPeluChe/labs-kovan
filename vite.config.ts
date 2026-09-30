import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (/[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom)[\\/]/.test(id)) {
              return 'react-vendor';
            }
            if (id.includes('framer-motion') || id.includes('lucide-react')) {
              return 'ui-vendor';
            }
            if (id.includes('convex') || id.includes('zod') || id.includes('uuid')) {
              return 'utils-vendor';
            }
            if (id.includes('@ai-sdk') || id.includes('ai/') || id.includes('langchain') || id.includes('google')) {
              return 'ai-vendor';
            }
            return 'vendor';
          }
        }
      }
    }
  }
})
