import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev proxy: requests to /api are forwarded to the FastAPI server (uvicorn) on :8000
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': { target: 'http://localhost:8000', changeOrigin: true } } },
  build: { target: 'es2020', sourcemap: false, chunkSizeWarningLimit: 700 },
})
