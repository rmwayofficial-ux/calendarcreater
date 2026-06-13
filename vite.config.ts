import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 静的ホスティング（GitHub Pages など）でサブパス配信できるよう base は相対指定
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
})
