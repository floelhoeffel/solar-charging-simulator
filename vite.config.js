import { defineConfig } from 'vite'

export default defineConfig({
  base: '/solar-charging-simulator/', // This should match your repository name
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
}) 