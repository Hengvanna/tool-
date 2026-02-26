import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/moodle-api': {
        target: 'https://elearning.cadt.edu.kh',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/moodle-api/, ''),
      },
    },
  },
})
