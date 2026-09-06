import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';
import type { AppConfig, ParsedConfig } from '../shared/types';

const CONFIG_FILE_NAME = 'config.json';
let appConfig: AppConfig = {};

function getArgument(args: string[], name: string): string | null {
  const prefix = `-${name}=`;
  const argument = args.find(value => value.startsWith(prefix));
  return argument ? argument.slice(prefix.length) : null;
}

export function loadConfigFile(): AppConfig {
  const configPath = join(process.cwd(), CONFIG_FILE_NAME);
  appConfig = {};

  if (!existsSync(configPath)) {
    console.log('配置文件不存在，使用默认设置');
    return appConfig;
  }

  try {
    const parsedConfig: unknown = JSON.parse(readFileSync(configPath, 'utf-8'));
    if (!parsedConfig || typeof parsedConfig !== 'object' || Array.isArray(parsedConfig)) {
      throw new TypeError('配置文件根节点必须是对象');
    }
    appConfig = parsedConfig as AppConfig;
  } catch (error) {
    console.error('读取配置文件出错:', error);
  }

  return appConfig;
}

export function getAppConfig(): AppConfig {
  return appConfig;
}

export function parseAndMergeConfig(argv: string[], isPackaged: boolean): ParsedConfig {
  const args = argv.slice(isPackaged ? 1 : 2);
  const link = appConfig.link ?? getArgument(args, 'link');
  const mode = appConfig.mode ?? getArgument(args, 'mode');
  const windowMode = appConfig.window ?? getArgument(args, 'window');
  const pageMode = appConfig.page ?? getArgument(args, 'page');
  const theme = appConfig.theme ?? getArgument(args, 'theme');
  const hide = appConfig.hide ?? getArgument(args, 'hide');
  const bgPath = appConfig.bg ?? getArgument(args, 'bg');

  return {
    link,
    mode,
    theme,
    hide,
    isFullscreen: mode === 'fullscreen',
    isPinned: windowMode === 'top',
    isSinglePageMode: pageMode === 'single',
    hiddenButtons: hide
      ? hide.split(',').map(button => button.trim()).filter(Boolean)
      : [],
    bgPath
  };
}

export function getBackgroundPath(configuredPath: string | null): string | null {
  if (!configuredPath) return null;

  try {
    const absolutePath = isAbsolute(configuredPath)
      ? configuredPath
      : resolve(process.cwd(), configuredPath);
    return existsSync(absolutePath)
      ? `local-file://${absolutePath.replace(/\\/g, '/')}`
      : null;
  } catch (error) {
    console.warn('解析背景图片路径失败:', error);
    return null;
  }
}
