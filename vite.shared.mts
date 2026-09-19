// 共享构建配置
// 统一管理 Vite 构建配置，避免重复

import { resolve } from 'node:path';

/**
 * 通用的 Vite 构建配置
 */
export const commonBuildConfig = {
  outDir: 'dist',
  emptyOutDir: true,
  minify: 'terser' as const,
  terserOptions: {
    compress: {
      drop_console: true, // 移除所有console语句
      drop_debugger: true // 移除所有debugger语句
    }
  },
  rollupOptions: {
    output: {
      manualChunks(id: string) {
        if (/node_modules[\\/](?:react|react-dom|scheduler)[\\/]/.test(id)) {
          return 'react';
        }
        if (/node_modules[\\/](?:@chakra-ui|@ark-ui|@emotion|@zag-js)[\\/]/.test(id)) {
          return 'chakra';
        }
      },
      chunkFileNames: 'assets/js/[name]-[hash].js',
      entryFileNames: 'assets/js/[name]-[hash].js',
      assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
    }
  }
};

/**
 * 通用的 Vite 服务器配置
 */
export const commonServerConfig = {
  port: 5173,
};

/**
 * 通用的 Vite 解析配置
 */
export function getCommonResolveConfig(dirname: string) {
  return {
    alias: {
      '@': resolve(dirname, 'src'),
    },
  };
}

/**
 * Electron 构建配置
 */
export function getElectronBuildConfig(isProd: boolean) {
  return {
    outDir: 'dist-electron',
    minify: isProd, // 生产环境启用压缩
    sourcemap: false, // 生产环境禁用源码映射
  };
}
