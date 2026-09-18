import { existsSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  HIDDEN_CONTROL_NAMES,
  type CompatibilityMode,
  type HiddenControl,
  type ResolvedConfig,
  type ThemeName
} from '../shared/types.mts';
import { normalizeHttpUrl } from '../shared/url.mts';

const CONFIG_FILE_NAME = 'config.json';
const THEMES = ['light', 'dark'] as const;
const COMPATIBILITY_MODES = ['standard', 'permissive'] as const;
const KNOWN_CONFIG_KEYS = new Set([
  'url',
  'fullscreen',
  'alwaysOnTop',
  'singlePage',
  'theme',
  'hiddenControls',
  'background',
  'compatibilityMode',
  'link',
  'mode',
  'window',
  'page',
  'hide',
  'bg'
]);
const HIDDEN_CONTROL_SET = new Set<string>(HIDDEN_CONTROL_NAMES);

interface ConfigLayer {
  url?: string | null;
  fullscreen?: boolean;
  alwaysOnTop?: boolean;
  singlePage?: boolean;
  theme?: ThemeName | null;
  hiddenControls?: HiddenControl[];
  background?: string | null;
  compatibilityMode?: CompatibilityMode;
}

export interface ConfigEnvironment {
  cwd: string;
  executablePath: string;
}

export interface ConfigLogger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string, error?: unknown): void;
}

const DEFAULT_CONFIG = {
  url: null,
  fullscreen: false,
  alwaysOnTop: false,
  singlePage: false,
  theme: null,
  hiddenControls: [],
  background: null,
  compatibilityMode: 'permissive'
} as const satisfies Required<ConfigLayer>;

function getArgument(args: string[], name: string): string | undefined {
  const prefixes = [`-${name}=`, `--${name}=`];
  const argument = args.find(value => prefixes.some(prefix => value.startsWith(prefix)));
  if (!argument) return undefined;
  const prefix = prefixes.find(value => argument.startsWith(value));
  return prefix ? argument.slice(prefix.length).trim() : undefined;
}

function getRuntimeArgs(argv: string[], isPackaged: boolean): string[] {
  return argv.slice(isPackaged ? 1 : 2);
}

function normalizeChoice<T extends string>(
  value: unknown,
  supportedValues: readonly T[],
  optionName: string,
  logger: ConfigLogger
): T | undefined {
  if (typeof value !== 'string') {
    logger.warn(`忽略无效配置项 ${optionName}：值必须是字符串`);
    return undefined;
  }
  const normalizedValue = value.trim();
  if (supportedValues.includes(normalizedValue as T)) return normalizedValue as T;
  logger.warn(`忽略无效配置项 ${optionName}: ${value}`);
  return undefined;
}

function normalizeBoolean(value: unknown, optionName: string, logger: ConfigLogger): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value === 'true') return true;
    if (value === 'false') return false;
  }
  logger.warn(`忽略无效配置项 ${optionName}：值必须是布尔值`);
  return undefined;
}

function normalizeOptionalString(value: unknown, optionName: string, logger: ConfigLogger): string | null | undefined {
  if (value === null || value === '') return null;
  if (typeof value !== 'string') {
    logger.warn(`忽略无效配置项 ${optionName}：值必须是字符串`);
    return undefined;
  }
  return value.trim() || null;
}

function normalizeUrl(value: unknown, optionName: string, logger: ConfigLogger): string | null | undefined {
  const normalizedValue = normalizeOptionalString(value, optionName, logger);
  if (!normalizedValue) return normalizedValue;
  try {
    return normalizeHttpUrl(normalizedValue);
  } catch {
    logger.warn(`忽略无效配置项 ${optionName}：仅支持有效的 HTTP(S) 地址`);
    return undefined;
  }
}

function normalizeHiddenControls(
  value: unknown,
  optionName: string,
  logger: ConfigLogger
): HiddenControl[] | undefined {
  const controls = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',').map(control => control.trim()).filter(Boolean)
      : null;

  if (!controls || !controls.every(control => typeof control === 'string')) {
    logger.warn(`忽略无效配置项 ${optionName}：值必须是字符串数组`);
    return undefined;
  }

  const invalidControls = controls.filter(control => !HIDDEN_CONTROL_SET.has(control));
  if (invalidControls.length > 0) {
    logger.warn(`忽略未知的隐藏元素: ${invalidControls.join(', ')}`);
  }

  return [...new Set(controls.filter((control): control is HiddenControl => HIDDEN_CONTROL_SET.has(control)))];
}

function warnLegacyConfig(key: string, replacement: string, logger: ConfigLogger) {
  logger.warn(`配置项 ${key} 已弃用，请改用 ${replacement}`);
}

export function parseConfigObject(value: unknown, logger: ConfigLogger = console): ConfigLayer {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('配置文件根节点必须是对象');
  }

  const config = value as Record<string, unknown>;
  const parsed: ConfigLayer = {};

  for (const key of Object.keys(config)) {
    if (!KNOWN_CONFIG_KEYS.has(key)) logger.warn(`忽略未知配置项: ${key}`);
  }

  if ('url' in config) {
    const url = normalizeUrl(config.url, 'url', logger);
    if (url !== undefined) parsed.url = url;
  } else if ('link' in config) {
    warnLegacyConfig('link', 'url', logger);
    const url = normalizeUrl(config.link, 'link', logger);
    if (url !== undefined) parsed.url = url;
  }

  if ('fullscreen' in config) {
    const fullscreen = normalizeBoolean(config.fullscreen, 'fullscreen', logger);
    if (fullscreen !== undefined) parsed.fullscreen = fullscreen;
  } else if ('mode' in config) {
    warnLegacyConfig('mode', 'fullscreen', logger);
    const mode = normalizeChoice(config.mode, ['fullscreen', 'normal'], 'mode', logger);
    if (mode) parsed.fullscreen = mode === 'fullscreen';
  }

  if ('alwaysOnTop' in config) {
    const alwaysOnTop = normalizeBoolean(config.alwaysOnTop, 'alwaysOnTop', logger);
    if (alwaysOnTop !== undefined) parsed.alwaysOnTop = alwaysOnTop;
  } else if ('window' in config) {
    warnLegacyConfig('window', 'alwaysOnTop', logger);
    const windowMode = normalizeChoice(config.window, ['top', 'normal'], 'window', logger);
    if (windowMode) parsed.alwaysOnTop = windowMode === 'top';
  }

  if ('singlePage' in config) {
    const singlePage = normalizeBoolean(config.singlePage, 'singlePage', logger);
    if (singlePage !== undefined) parsed.singlePage = singlePage;
  } else if ('page' in config) {
    warnLegacyConfig('page', 'singlePage', logger);
    const pageMode = normalizeChoice(config.page, ['single', 'multi'], 'page', logger);
    if (pageMode) parsed.singlePage = pageMode === 'single';
  }

  if ('theme' in config) {
    const theme = config.theme === null
      ? null
      : normalizeChoice(config.theme, THEMES, 'theme', logger);
    if (theme !== undefined) parsed.theme = theme;
  }

  if ('hiddenControls' in config) {
    const hiddenControls = normalizeHiddenControls(config.hiddenControls, 'hiddenControls', logger);
    if (hiddenControls !== undefined) parsed.hiddenControls = hiddenControls;
  } else if ('hide' in config) {
    warnLegacyConfig('hide', 'hiddenControls', logger);
    const hiddenControls = normalizeHiddenControls(config.hide, 'hide', logger);
    if (hiddenControls !== undefined) parsed.hiddenControls = hiddenControls;
  }

  if ('background' in config) {
    const background = normalizeOptionalString(config.background, 'background', logger);
    if (background !== undefined) parsed.background = background;
  } else if ('bg' in config) {
    warnLegacyConfig('bg', 'background', logger);
    const background = normalizeOptionalString(config.bg, 'bg', logger);
    if (background !== undefined) parsed.background = background;
  }

  if ('compatibilityMode' in config) {
    const compatibilityMode = normalizeChoice(
      config.compatibilityMode,
      COMPATIBILITY_MODES,
      'compatibilityMode',
      logger
    );
    if (compatibilityMode !== undefined) parsed.compatibilityMode = compatibilityMode;
  }

  return parsed;
}

function parseCommandLine(args: string[], logger: ConfigLogger): ConfigLayer {
  const parsed: ConfigLayer = {};
  const canonicalUrl = getArgument(args, 'url');
  const legacyUrl = getArgument(args, 'link');
  const url = canonicalUrl ?? legacyUrl;
  const fullscreen = getArgument(args, 'fullscreen');
  const alwaysOnTop = getArgument(args, 'always-on-top');
  const singlePage = getArgument(args, 'single-page');
  const canonicalHiddenControls = getArgument(args, 'hidden-controls');
  const legacyHiddenControls = getArgument(args, 'hide');
  const hiddenControls = canonicalHiddenControls ?? legacyHiddenControls;
  const canonicalBackground = getArgument(args, 'background');
  const legacyBackground = getArgument(args, 'bg');
  const background = canonicalBackground ?? legacyBackground;
  const compatibilityMode = getArgument(args, 'compatibility-mode');
  const theme = getArgument(args, 'theme');

  if (canonicalUrl === undefined && legacyUrl !== undefined) warnLegacyConfig('-link', '-url', logger);
  if (canonicalHiddenControls === undefined && legacyHiddenControls !== undefined) {
    warnLegacyConfig('-hide', '-hidden-controls', logger);
  }
  if (canonicalBackground === undefined && legacyBackground !== undefined) {
    warnLegacyConfig('-bg', '-background', logger);
  }

  if (url !== undefined) {
    const normalizedUrl = normalizeUrl(url, 'url', logger);
    if (normalizedUrl !== undefined) parsed.url = normalizedUrl;
  }
  if (fullscreen !== undefined) {
    const normalizedFullscreen = normalizeBoolean(fullscreen, 'fullscreen', logger);
    if (normalizedFullscreen !== undefined) parsed.fullscreen = normalizedFullscreen;
  } else {
    const mode = getArgument(args, 'mode');
    if (mode !== undefined) {
      warnLegacyConfig('-mode', '-fullscreen', logger);
      const normalizedMode = normalizeChoice(mode, ['fullscreen', 'normal'], 'mode', logger);
      if (normalizedMode) parsed.fullscreen = normalizedMode === 'fullscreen';
    }
  }
  if (alwaysOnTop !== undefined) {
    const normalizedAlwaysOnTop = normalizeBoolean(alwaysOnTop, 'always-on-top', logger);
    if (normalizedAlwaysOnTop !== undefined) parsed.alwaysOnTop = normalizedAlwaysOnTop;
  } else {
    const windowMode = getArgument(args, 'window');
    if (windowMode !== undefined) {
      warnLegacyConfig('-window', '-always-on-top', logger);
      const normalizedWindow = normalizeChoice(windowMode, ['top', 'normal'], 'window', logger);
      if (normalizedWindow) parsed.alwaysOnTop = normalizedWindow === 'top';
    }
  }
  if (singlePage !== undefined) {
    const normalizedSinglePage = normalizeBoolean(singlePage, 'single-page', logger);
    if (normalizedSinglePage !== undefined) parsed.singlePage = normalizedSinglePage;
  } else {
    const pageMode = getArgument(args, 'page');
    if (pageMode !== undefined) {
      warnLegacyConfig('-page', '-single-page', logger);
      const normalizedPage = normalizeChoice(pageMode, ['single', 'multi'], 'page', logger);
      if (normalizedPage) parsed.singlePage = normalizedPage === 'single';
    }
  }
  if (theme !== undefined) {
    const normalizedTheme = normalizeChoice(theme, THEMES, 'theme', logger);
    if (normalizedTheme !== undefined) parsed.theme = normalizedTheme;
  }
  if (hiddenControls !== undefined) {
    const normalizedHiddenControls = normalizeHiddenControls(hiddenControls, 'hidden-controls', logger);
    if (normalizedHiddenControls !== undefined) parsed.hiddenControls = normalizedHiddenControls;
  }
  if (background !== undefined) {
    const normalizedBackground = normalizeOptionalString(background, 'background', logger);
    if (normalizedBackground !== undefined) parsed.background = normalizedBackground;
  }
  if (compatibilityMode !== undefined) {
    const normalizedCompatibilityMode = normalizeChoice(
      compatibilityMode,
      COMPATIBILITY_MODES,
      'compatibility-mode',
      logger
    );
    if (normalizedCompatibilityMode !== undefined) {
      parsed.compatibilityMode = normalizedCompatibilityMode;
    }
  }

  return parsed;
}

function resolveConfigPath(args: string[], isPackaged: boolean, environment: ConfigEnvironment): string {
  const configuredPath = getArgument(args, 'config');
  if (configuredPath) {
    return isAbsolute(configuredPath) ? configuredPath : resolve(environment.cwd, configuredPath);
  }
  return isPackaged
    ? join(dirname(environment.executablePath), CONFIG_FILE_NAME)
    : join(environment.cwd, CONFIG_FILE_NAME);
}

function resolveBackgroundPath(
  configuredPath: string | null,
  baseDirectory: string,
  logger: ConfigLogger
): string | null {
  if (!configuredPath) return null;
  const absolutePath = isAbsolute(configuredPath) ? configuredPath : resolve(baseDirectory, configuredPath);
  if (existsSync(absolutePath)) return absolutePath;
  logger.warn(`背景图片不存在，已忽略: ${absolutePath}`);
  return null;
}

export function resolveAppConfig(
  argv: string[],
  isPackaged: boolean,
  environment: ConfigEnvironment = { cwd: process.cwd(), executablePath: process.execPath },
  logger: ConfigLogger = console
): ResolvedConfig {
  const args = getRuntimeArgs(argv, isPackaged);
  const configPath = resolveConfigPath(args, isPackaged, environment);
  const hasExplicitConfigPath = getArgument(args, 'config') !== undefined;
  let fileConfig: ConfigLayer = {};

  if (existsSync(configPath)) {
    try {
      fileConfig = parseConfigObject(JSON.parse(readFileSync(configPath, 'utf8')) as unknown, logger);
      logger.info(`已加载配置文件: ${configPath}`);
    } catch (error) {
      logger.error(`读取配置文件失败: ${configPath}`, error);
    }
  } else if (hasExplicitConfigPath) {
    logger.warn(`指定的配置文件不存在: ${configPath}`);
  }

  const commandLineConfig = parseCommandLine(args, logger);
  const mergedConfig = { ...DEFAULT_CONFIG, ...fileConfig, ...commandLineConfig };
  const backgroundBaseDirectory = commandLineConfig.background !== undefined
    ? environment.cwd
    : dirname(configPath);

  return {
    url: mergedConfig.url,
    fullscreen: mergedConfig.fullscreen,
    alwaysOnTop: mergedConfig.alwaysOnTop,
    singlePage: mergedConfig.singlePage,
    theme: mergedConfig.theme,
    hiddenControls: [...mergedConfig.hiddenControls],
    backgroundPath: resolveBackgroundPath(mergedConfig.background, backgroundBaseDirectory, logger),
    compatibilityMode: mergedConfig.compatibilityMode,
    configPath
  };
}

export function getBackgroundUrl(backgroundPath: string | null): string | null {
  return backgroundPath ? pathToFileURL(backgroundPath).toString() : null;
}
