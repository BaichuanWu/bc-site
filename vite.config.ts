import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path' // Add this line to import the 'path' module

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      Src: resolve(__dirname, './src'),
      Consts: resolve(__dirname, './config/consts'),
      Components: resolve(__dirname, './src/renderer/components'),
      Utils: resolve(__dirname, './src/renderer/utils'),
      Pages: resolve(__dirname, './src/renderer/pages'),
      Store: resolve(__dirname, './src/renderer/store'),
      Services: resolve(__dirname, './src/renderer/services'),
      Hooks: resolve(__dirname, './src/renderer/hooks'),
      react: resolve(__dirname, './node_modules/react'),
      'react-dom': resolve(__dirname, './node_modules/react-dom'),
      'react-router': resolve(__dirname, './node_modules/react-router'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, '')
      },
    },
    watch: {
      // 允许监听软链
      followSymlinks: true,
    },
  },
})
