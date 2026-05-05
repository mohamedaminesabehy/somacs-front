import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('firebase')) return 'vendor-firebase';
            if (id.includes('react-router-dom') || id.includes('react-dom') || (id.includes('/react/') && !id.includes('react-'))) return 'vendor-react';
            if (id.includes('jspdf') || id.includes('react-pdf') || id.includes('pdfjs')) return 'vendor-pdf';
            if (id.includes('framer-motion') || id.includes('gsap') || id.includes('three')) return 'vendor-anim';
            if (id.includes('socket.io')) return 'vendor-socket';
          }
        },
      },
    },
  },
})
