import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { commonBuildConfig, commonServerConfig, getCommonResolveConfig } from './shared/build-config.mts'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: './',
  resolve: getCommonResolveConfig(import.meta.dirname),
  server: commonServerConfig,
  build: commonBuildConfig,
})
