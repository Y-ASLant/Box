import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { commonBuildConfig, commonServerConfig, getCommonResolveConfig } from './vite.shared.mts'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: getCommonResolveConfig(import.meta.dirname),
  server: commonServerConfig,
  build: commonBuildConfig,
})
