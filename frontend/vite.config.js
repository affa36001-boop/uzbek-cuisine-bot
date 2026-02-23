import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5174,
    host: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        secure: false,
      }
    }
  },

  build: {
    outDir: 'dist',
    sourcemap: false,
    // Optimize chunk splitting for faster initial load
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
        }
      }
    },
    // Use esbuild (built-in, faster than terser)
    minify: 'esbuild',
  },

  // Remove console.log in production
  esbuild: {
    drop: ['console', 'debugger'],
  },

  // Base path (keep '/' for Vercel)
  base: '/',
})
