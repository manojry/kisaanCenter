import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://kisaancenter-backend.whiteisland-e1233153.northeurope.azurecontainerapps.io',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      plugins: [{
          name: 'copy-index-to-404',
          closeBundle: () => {
            if (fs.existsSync('dist/index.html')) {
              fs.copyFileSync('dist/index.html', 'dist/404.html');
            }
          }
      }]
    }
  },
})
import fs from 'fs'
