import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  base: '/',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    proxy: {
      'https://dispatch-worker.stevenman.us': {
        target: 'https://dispatch-worker.stevenman.us',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/dispatch/, ''),
      },
    },
  },
})