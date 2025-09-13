// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import { rmSync } from 'node:fs'

export default defineConfig(() => {
  rmSync('dist-electron', { recursive: true, force: true })

  return {
    plugins: [
      react(),
      electron([
        {
          entry: 'electron/main.ts',
        },
        {
          entry: 'electron/preload.ts',
          onstart(options) {
            options.reload()
          },
        },
      ]),
      renderer(),
    ],
    build: {
      rollupOptions: {
        // Le decimos a Vite que no intente incluir este paquete en el build
        external: ['better-sqlite3']
      }
    }
  }
})