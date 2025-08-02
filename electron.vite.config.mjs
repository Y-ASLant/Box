import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import { rmSync } from 'node:fs';
import {
  commonBuildConfig,
  commonServerConfig,
  getCommonResolveConfig,
  getElectronBuildConfig,
  getDirname
} from './shared/build-config.ts';

// 获取当前文件的目录路径
const __dirname = getDirname(import.meta.url);

// 清除之前的构建目录
rmSync('dist-electron', { recursive: true, force: true });

// 是否为生产环境
const isProd = process.env.NODE_ENV === 'production';

export default defineConfig({
  plugins: [
    vue(),
    electron([
      {
        // 主进程配置
        entry: 'electron/main.ts',
        vite: {
          build: getElectronBuildConfig(isProd),
        },
      },
      {
        // 预加载脚本配置
        entry: 'electron/preload.ts',
        onstart(options) {
          options.reload();
        },
        vite: {
          build: getElectronBuildConfig(isProd),
        },
      },
    ]),
    renderer(),
  ],
  base: './',
  resolve: getCommonResolveConfig(__dirname),
  server: commonServerConfig,
  build: commonBuildConfig,
});