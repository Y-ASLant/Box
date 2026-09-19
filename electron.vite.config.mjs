import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import { rmSync } from 'node:fs';
import {
  commonBuildConfig,
  commonServerConfig,
  getCommonResolveConfig,
  getElectronBuildConfig
} from './vite.shared.mts';

// 清除之前的构建目录
rmSync('dist-electron', { recursive: true, force: true });

// 是否为生产环境
const isProd = process.env.NODE_ENV === 'production';

export default defineConfig({
  plugins: [
    react(),
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
  ],
  base: './',
  resolve: getCommonResolveConfig(import.meta.dirname),
  server: commonServerConfig,
  build: commonBuildConfig,
});
