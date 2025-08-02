import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { commonBuildConfig, commonServerConfig, getCommonResolveConfig } from './shared/build-config'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: './',
  resolve: getCommonResolveConfig(__dirname),
  server: commonServerConfig,
  build: commonBuildConfig,
})
