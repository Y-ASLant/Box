import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { resolveAppConfig, type ConfigLogger } from './app-config.mts';

function createLogger() {
  const messages = { info: [] as string[], warn: [] as string[], error: [] as string[] };
  const logger: ConfigLogger = {
    info: message => messages.info.push(message),
    warn: message => messages.warn.push(message),
    error: (message, error) => messages.error.push(`${message}${error ? `: ${String(error)}` : ''}`)
  };
  return { logger, messages };
}

function createTestDirectory(t: test.TestContext): string {
  const directory = mkdtempSync(join(tmpdir(), 'box-config-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return directory;
}

test('解析新的强类型配置并以配置文件目录解析背景路径', t => {
  const directory = createTestDirectory(t);
  const backgroundPath = join(directory, 'assets', 'background.png');
  mkdirSync(dirname(backgroundPath), { recursive: true });
  writeFileSync(backgroundPath, 'image');
  writeFileSync(join(directory, 'config.json'), JSON.stringify({
    url: 'intranet.local/app',
    fullscreen: true,
    alwaysOnTop: true,
    theme: 'dark',
    background: './assets/background.png',
    compatibilityMode: 'standard'
  }));
  const { logger, messages } = createLogger();

  const config = resolveAppConfig(
    ['electron', '.'],
    false,
    { cwd: directory, executablePath: join(directory, 'electron.exe') },
    logger
  );

  assert.equal(config.url, 'http://intranet.local/app');
  assert.equal(config.fullscreen, true);
  assert.equal(config.alwaysOnTop, true);
  assert.equal(config.theme, 'dark');
  assert.equal(config.backgroundPath, backgroundPath);
  assert.equal(config.compatibilityMode, 'standard');
  assert.deepEqual(messages.warn, []);
});

test('命令行参数覆盖配置文件并支持双横线格式', t => {
  const directory = createTestDirectory(t);
  writeFileSync(join(directory, 'config.json'), JSON.stringify({
    url: 'http://file.example',
    fullscreen: false,
    theme: 'light'
  }));
  const { logger } = createLogger();

  const config = resolveAppConfig(
    [
      'electron',
      '.',
      '--url=https://cli.example/path',
      '--fullscreen=true',
      '--theme=dark'
    ],
    false,
    { cwd: directory, executablePath: join(directory, 'electron.exe') },
    logger
  );

  assert.equal(config.url, 'https://cli.example/path');
  assert.equal(config.fullscreen, true);
  assert.equal(config.theme, 'dark');
});

test('兼容旧配置字段并输出迁移提示', t => {
  const directory = createTestDirectory(t);
  writeFileSync(join(directory, 'config.json'), JSON.stringify({
    link: 'legacy.local',
    mode: 'fullscreen',
    window: 'top',
    bg: ''
  }));
  const { logger, messages } = createLogger();

  const config = resolveAppConfig(
    ['electron', '.'],
    false,
    { cwd: directory, executablePath: join(directory, 'electron.exe') },
    logger
  );

  assert.equal(config.url, 'http://legacy.local/');
  assert.equal(config.fullscreen, true);
  assert.equal(config.alwaysOnTop, true);
  assert.equal(config.backgroundPath, null);
  assert.ok(messages.warn.filter(message => message.includes('已弃用')).length >= 4);
});

test('忽略已移除的单页模式配置', t => {
  const directory = createTestDirectory(t);
  writeFileSync(join(directory, 'config.json'), JSON.stringify({
    singlePage: true,
    page: 'single'
  }));
  const { logger, messages } = createLogger();

  const config = resolveAppConfig(
    ['electron', '.', '--single-page=true', '--page=single'],
    false,
    { cwd: directory, executablePath: join(directory, 'electron.exe') },
    logger
  );

  assert.equal('singlePage' in config, false);
  assert.ok(messages.warn.some(message => message.includes('singlePage')));
  assert.ok(messages.warn.some(message => message.includes('page')));
});

test('打包模式默认读取可执行文件旁的配置', t => {
  const directory = createTestDirectory(t);
  const executablePath = join(directory, 'Box.exe');
  writeFileSync(join(directory, 'config.json'), JSON.stringify({ theme: 'dark' }));
  const { logger } = createLogger();

  const config = resolveAppConfig(
    [executablePath],
    true,
    { cwd: join(directory, 'other-directory'), executablePath },
    logger
  );

  assert.equal(config.configPath, join(directory, 'config.json'));
  assert.equal(config.theme, 'dark');
});

test('显式配置路径不存在时仍应用安全默认值', t => {
  const directory = createTestDirectory(t);
  const { logger, messages } = createLogger();

  const config = resolveAppConfig(
    ['electron', '.', '-config=missing.json'],
    false,
    { cwd: directory, executablePath: join(directory, 'electron.exe') },
    logger
  );

  assert.equal(config.url, null);
  assert.equal(config.fullscreen, false);
  assert.equal(config.compatibilityMode, 'permissive');
  assert.ok(messages.warn.some(message => message.includes('不存在')));
});
