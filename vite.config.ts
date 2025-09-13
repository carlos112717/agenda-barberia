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
          // Main-Process entry file of the Electron App.
          entry: 'electron/main.ts',
          // ⬇️ HERE IS THE FIX
          vite: {
            build: {
              rollupOptions: {
                // Le decimos a Vite que no intente incluir este paquete en el build del main process.
                external: ['better-sqlite3']
              }
            }
          }
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
    // ⬆️ REMOVE THE `build` CONFIGURATION FROM HERE
  }
})