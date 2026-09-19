# 更新日志

本文件记录 Box（浏览器 Plus）的版本更新，格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [未发布]

### 变更

- 将 renderer 从 Vue 3 全面迁移到 React 19 与 Chakra UI 3，浏览器外壳、新标签页、表单、按钮、主题和明暗模式均使用 Chakra 默认系统、语义 Token、组件 recipe 与原生动效实现。
- 更新 Vite、TypeScript、Lucide 与文档中的 renderer 架构说明，保持既有 Electron IPC 边界、浏览器行为和持久化键不变。

### 移除

- 移除 Vue、Vue TypeScript 检查器、Vue Vite 插件、旧 Vue 单文件组件、Vue composable 以及旧版手写 UI Token 和组件样式。

## [1.1.0] - 2026-09-19

### 新增

- 新增 `standard` 与 `permissive` 浏览器兼容模式。
- 新增基于 Node.js 内置测试运行器的配置和 URL 单元测试。
- 新增持久化浏览器外壳、顶部标签页、地址栏、网页导航和弹窗转标签页能力。
- 新增自定义全屏按钮和 `F11` 全屏快捷键，并与最小化、最大化和关闭控件统一管理窗口状态。

### 变更

- 产品重新定位为面向受信任 Web 应用、内网系统和展示终端的宽松兼容浏览器，并统一相关界面与文档文案。
- 配置重构为强类型布尔值、数组和单一解析结果，命令行参数现在优先于配置文件。
- 打包应用默认从可执行文件目录读取配置，相对背景路径基于配置文件目录解析。
- 单页模式现在复用当前标签页打开新链接，主页按钮返回本地新标签页。
- 窗口采用自定义边框和浏览器式顶部标签栏，移除界面中的品牌字母块。
- 全局图标统一为 Lucide，颜色、字体、间距、圆角、阴影与动效统一由语义化 UI Token 管理。

### 修复

- 修复宽松 CSP 可能与服务器原有 CSP 并存的问题，并阻止非 HTTP(S) 子窗口。

### 移除

- 移除旧页面控件注入、隐藏控件配置、未使用的 Vue Router、本地错误页组件和过时界面截图。

## [1.0.0] - 2026-09-18

### 新增

- 新增由 SemVer 标签触发的 GitHub Actions 发布流程。
- 新增 main/PR 自动检查和手动五个原生平台/架构目标打包测试工作流。
- 新增 Windows x64、macOS x64/arm64 和 Linux x64/arm64 原生构建。
- 新增配置值校验、URL 规范化和统一的本地错误页回退。

### 变更

- 重构主进程、预加载、IPC、窗口管理与远程页面控件注入边界。
- 迁移至 pnpm，并更新 Electron、Vue、Vite、TypeScript 和构建工具链。
- 精简打包资源与清理流程，发布文件名现在包含平台和架构。
- 重写项目文档，明确运行模式、配置项与安全边界。

### 修复

- 修复主窗口与受管子窗口之间不一致的加载失败、快捷键和清理行为。
- 修复主题、最近地址与自定义背景的持久化和异常输入处理。

### 移除

- 移除旧 Inno Setup、npm 锁文件、重复注入模板、历史安装脚本和过时截图。

---

# Changelog

This file records changes to Box (Browser Plus). Its format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and version numbers follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Changed

- Migrated the renderer completely from Vue 3 to React 19 and Chakra UI 3; Chakra's default system, semantic tokens, component recipes, and native motion now own the browser shell, new-tab page, forms, buttons, themes, and color modes.
- Updated the Vite, TypeScript, Lucide, and documentation renderer architecture while preserving the existing Electron IPC boundary, browser behavior, and persistence keys.

### Removed

- Removed Vue, the Vue TypeScript checker, the Vue Vite plugin, legacy Vue single-file components and composable, and the old handwritten UI tokens and component styles.

## [1.1.0] - 2026-09-19

### Added

- Added `standard` and `permissive` browser compatibility modes.
- Added configuration and URL unit tests using the built-in Node.js test runner.
- Added a persistent browser shell with top tabs, an address bar, Web navigation, and popup-to-tab handling.
- Added a custom fullscreen control and `F11` shortcut, with synchronized state for fullscreen, minimize, maximize, and close controls.

### Changed

- Repositioned the product as a permissive compatibility browser for trusted Web applications, intranet systems, and display terminals, with matching UI and documentation copy.
- Refactored configuration into typed booleans, arrays, and one resolved model, with command-line options taking precedence over the file.
- Packaged builds now load configuration beside the executable, and relative backgrounds resolve from the configuration directory.
- Single-page mode now reuses the current tab for new links, and the Home action returns to the local new-tab page.
- The window now uses a custom border and browser-style top tab strip, with letter-brand blocks removed from the interface.
- All interface icons now use Lucide, while semantic UI tokens define colors, typography, spacing, radii, shadows, and motion globally.

### Fixed

- Fixed relaxed CSP coexisting with an original server policy, and blocked non-HTTP(S) child windows.

### Removed

- Removed legacy page-control injection, hidden-control configuration, unused Vue Router code, the local error-page component, and an outdated interface screenshot.

## [1.0.0] - 2026-09-18

### Added

- Added a SemVer tag-triggered GitHub Actions release workflow.
- Added automatic checks for main/PR changes and a manual packaging test workflow covering five native platform/architecture targets.
- Added native builds for Windows x64, macOS x64/arm64, and Linux x64/arm64.
- Added configuration validation, URL normalization, and a consistent local error-page fallback.

### Changed

- Refactored the main process, preload, IPC, window management, and remote-page control injection boundaries.
- Migrated to pnpm and updated Electron, Vue, Vite, TypeScript, and the build toolchain.
- Simplified packaged resources and cleanup, with platform and architecture in release filenames.
- Rewrote project documentation to clarify runtime modes, configuration, and security boundaries.

### Fixed

- Fixed inconsistent load-failure, shortcut, and cleanup behavior between the main and managed child windows.
- Fixed persistence and invalid-input handling for themes, recent URLs, and custom backgrounds.

### Removed

- Removed the legacy Inno Setup project, npm lockfile, duplicate injection templates, old installer script, and outdated screenshots.

[未发布]: https://github.com/Y-ASLant/Box/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/Y-ASLant/Box/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/Y-ASLant/Box/releases/tag/v1.0.0
[Unreleased]: https://github.com/Y-ASLant/Box/compare/v1.1.0...HEAD
