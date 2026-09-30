import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// Builds the design board (showcase.html), not the extension. The output folder comes from
// SHOWCASE_OUT so exports never land inside the extension build.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, './src') } },
  build: {
    outDir: process.env.SHOWCASE_OUT || 'showcase-dist',
    emptyOutDir: true,
    rollupOptions: { input: path.resolve(import.meta.dirname, 'showcase.html') },
  },
})
