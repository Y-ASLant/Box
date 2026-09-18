import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { AppConfig, ParsedConfig } from '../shared/types';

const CONFIG_FILE_NAME = 'config.json';
const CONFIG_STRING_KEYS = ['link', 'mode', 'window', 'page', 'hide', 'bg', 'theme'] as const;
const HIDDEN_BUTTONS = new Set([
  'control',
  'theme',
  'scroll',
  'mouse',
  'home',
  'minimize',
  'maximize',
  'close',
  'fullscreen'
]);
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
    appConfig = validateConfigFile(parsedConfig as Record<string, unknown>);
  } catch (error) {
    console.error('读取配置文件出错:', error);
  }

  return appConfig;
}

function validateConfigFile(config: Record<string, unknown>): AppConfig {
  const validatedConfig: AppConfig = {};

  for (const key of CONFIG_STRING_KEYS) {
    const value = config[key];
    if (value === undefined) continue;
    if (typeof value !== 'string') {
      console.warn(`忽略无效配置项 ${key}：值必须是字符串`);
      continue;
    }

    const normalizedValue = value.trim();
    if (normalizedValue) {
      validatedConfig[key] = normalizedValue;
    }
  }

  return validatedConfig;
}

function normalizeChoice(
  value: string | null | undefined,
  supportedValues: readonly string[],
  optionName: string
): string | null {
  if (!value) return null;
  if (supportedValues.includes(value)) return value;
  console.warn(`忽略无效配置项 ${optionName}: ${value}`);
  return null;
}

function normalizeHiddenButtons(value: string | null | undefined): string[] {
  if (!value) return [];

  const buttons = value
    .split(',')
    .map(button => button.trim())
    .filter(Boolean);
  const invalidButtons = buttons.filter(button => !HIDDEN_BUTTONS.has(button));
  if (invalidButtons.length > 0) {
    console.warn(`忽略未知的隐藏元素: ${invalidButtons.join(', ')}`);
  }
  return [...new Set(buttons.filter(button => HIDDEN_BUTTONS.has(button)))];
}

export function getAppConfig(): AppConfig {
  return appConfig;
}

export function parseAndMergeConfig(argv: string[], isPackaged: boolean): ParsedConfig {
  const args = argv.slice(isPackaged ? 1 : 2);
  const link = (appConfig.link ?? getArgument(args, 'link')?.trim()) || null;
  const mode = normalizeChoice(appConfig.mode, ['fullscreen', 'normal'], 'mode')
    ?? normalizeChoice(getArgument(args, 'mode'), ['fullscreen', 'normal'], 'mode');
  const windowMode = normalizeChoice(appConfig.window, ['top', 'normal'], 'window')
    ?? normalizeChoice(getArgument(args, 'window'), ['top', 'normal'], 'window');
  const pageMode = normalizeChoice(appConfig.page, ['single', 'multi'], 'page')
    ?? normalizeChoice(getArgument(args, 'page'), ['single', 'multi'], 'page');
  const theme = normalizeChoice(appConfig.theme, ['light', 'dark'], 'theme')
    ?? normalizeChoice(getArgument(args, 'theme'), ['light', 'dark'], 'theme');
  const configuredHiddenButtons = normalizeHiddenButtons(appConfig.hide);
  const hiddenButtons = configuredHiddenButtons.length > 0
    ? configuredHiddenButtons
    : normalizeHiddenButtons(getArgument(args, 'hide'));
  const hide = hiddenButtons.length > 0 ? hiddenButtons.join(',') : null;
  const bgPath = (appConfig.bg ?? getArgument(args, 'bg')?.trim()) || null;

  return {
    link,
    mode,
    theme,
    hide,
    isFullscreen: mode === 'fullscreen',
    isPinned: windowMode === 'top',
    isSinglePageMode: pageMode === 'single',
    hiddenButtons,
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
      ? pathToFileURL(absolutePath).toString()
      : null;
  } catch (error) {
    console.warn('解析背景图片路径失败:', error);
    return null;
  }
}
