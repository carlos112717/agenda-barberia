// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        // Archivo de entrada para el Proceso Principal de Electron
        entry: 'electron/main.ts',
      },
      {
        entry: 'electron/preload.ts',
        onstart(options) {
          // Este script recargará la ventana de Electron cuando el preload cambie
          options.reload()
        },
      },
    ]),
    renderer(),
  ],
})