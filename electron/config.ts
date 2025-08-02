import * as path from 'path';
import * as fs from 'fs';
import type { AppConfig, ParsedConfig } from '../shared/types';

// 默认配置
let appConfig: AppConfig = {};

// 读取配置文件
export function loadConfigFile(): AppConfig {
  // 获取应用程序当前工作目录
  const configPath = path.join(process.cwd(), 'config.json');
  
  // 检查配置文件是否存在
  if (fs.existsSync(configPath)) {
    try {
      // 读取并解析配置文件
      const configContent = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(configContent);
      appConfig = config;
      return config;
    } catch (err) {
      console.error('读取配置文件出错:', err);
    }
  } else {
    console.log('配置文件不存在，使用默认设置');
  }
  
  // 返回空配置
  return {};
}

// 获取当前配置
export function getAppConfig(): AppConfig {
  return appConfig;
}

// 解析命令行参数并合并配置
export function parseAndMergeConfig(argv: string[], isPackaged: boolean): ParsedConfig {
  // 解析命令行参数
  const args = argv.slice(isPackaged ? 1 : 2);
  const linkArg = args.find(arg => arg.startsWith('-link='));
  const modeArg = args.find(arg => arg.startsWith('-mode='));
  const windowArg = args.find(arg => arg.startsWith('-window='));
  const pageArg = args.find(arg => arg.startsWith('-page='));
  const hideArg = args.find(arg => arg.startsWith('-hide='));
  const bgArg = args.find(arg => arg.startsWith('-bg='));

  // 优先使用配置文件中的设置，如果不存在则使用命令行参数
  const startUrl = appConfig.link || (linkArg ? linkArg.split('=')[1] : null);
  const isFullscreen = appConfig.mode === 'fullscreen' || (modeArg ? modeArg.split('=')[1] === 'fullscreen' : false);
  const isPinned = appConfig.window === 'top' || (windowArg ? windowArg.split('=')[1] === 'top' : false);
  const isSinglePageMode = appConfig.page === 'single' || (pageArg ? pageArg.split('=')[1] === 'single' : false);
  const hiddenButtons = appConfig.hide ? appConfig.hide.split(',') : (hideArg ? hideArg.split('=')[1].split(',') : []);
  
  // 解析背景图片路径
  const bgPath = appConfig.bg || (bgArg ? bgArg.split('=')[1] : null);

  return {
    startUrl,
    isFullscreen,
    isPinned,
    isSinglePageMode,
    hiddenButtons,
    bgPath
  };
}

// 获取背景图片路径
export function getBackgroundPath(): string | null {
  if (!appConfig.bg) return null;
  
  try {
    // 获取绝对路径
    let bgPath = appConfig.bg;
    if (!path.isAbsolute(bgPath)) {
      bgPath = path.resolve(process.cwd(), bgPath);
    }
    
    // 检查文件是否存在
    if (fs.existsSync(bgPath)) {
      // 使用自定义协议返回路径
      return `local-file://${bgPath.replace(/\\/g, '/')}`;
    } else {
      return null;
    }
  } catch (err) {
    return null;
  }
}
