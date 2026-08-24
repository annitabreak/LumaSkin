import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// Plain Vite config. The original export carried four Figma-internal plugins
// (site.json head injection, HMR error-overlay replay, refresh-boundary
// fallback, and the /.figma/make/kit.html story surface). All four only exist
// to serve the Figma Make editor preview, so they are dropped here.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 4096,
  },
})
