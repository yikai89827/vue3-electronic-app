import { defineConfig } from 'electron-vite'
import { resolve } from 'path'

export default defineConfig({
  main: {
    build: {
      lib: {
        entry: resolve(__dirname, 'electron/main.js'),
        formats: ['cjs'],
        fileName: 'main.js'
      },
      outDir: 'dist-electron/main'
    }
  },
  preload: {
    build: {
      lib: {
        entry: resolve(__dirname, 'electron/preload.js'),
        formats: ['cjs'],
        fileName: 'preload.js'
      },
      outDir: 'dist-electron/preload'
    }
  }
})