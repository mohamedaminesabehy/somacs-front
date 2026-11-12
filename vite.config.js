import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Proxy optionnel (dev uniquement) : activé seulement si VITE_DEV_PROXY_TARGET est défini
  // dans un fichier .env.*.local. Sans cette variable, le comportement reste identique.
  const proxyTarget = env.VITE_DEV_PROXY_TARGET
  const proxyPrefix = env.VITE_API_URL?.startsWith('/') ? env.VITE_API_URL : null

  // Hôtes de prévisualisation v0 (dev uniquement, sans effet sur le build Vercel).
  // '.vercel.run' couvre les sous-domaines dynamiques des sandboxes Vercel (sb-xxxx.vercel.run).
  const previewHosts = [
    'optimisation-du-projet-somacs-somacs-frontend.v0.build',
    'sb-1xfh8o2t5ske.vercel.run',
    '.vercel.run',
  ]

  return {
    plugins: [react()],
    preview: {
      allowedHosts: previewHosts,
    },
    server: {
      allowedHosts: previewHosts,
      proxy: proxyTarget && proxyPrefix
        ? {
            [proxyPrefix]: {
              target: proxyTarget,
              changeOrigin: true,
              rewrite: (path) => path.slice(proxyPrefix.length) || '/',
            },
          }
        : undefined,
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('firebase')) return 'vendor-firebase'
              if (/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(id)) return 'vendor-react'
              if (id.includes('socket.io') || id.includes('engine.io')) return 'vendor-socket'
              // PDF/animation libraries are intentionally not forced into manual chunks:
              // grouping them pulled shared helpers into the entry graph and preloaded ~840 kB
              // on every page. Rollup now splits them along the lazy routes that use them.
            }
          },
        },
      },
    },
  }
})
