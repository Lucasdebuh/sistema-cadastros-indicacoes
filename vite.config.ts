import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// O site é publicado em https://<usuario>.github.io/<repositorio>/
// O base path precisa bater com o nome do repositório.
// Em desenvolvimento local usamos '/' para facilitar.
const base = process.env.VITE_BASE_PATH ?? '/sistema-cadastros-indicacoes/'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? base : '/',
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 900,
  },
}))
