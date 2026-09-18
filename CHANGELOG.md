# 更新日志

本文件记录 Box（浏览器 Plus）的版本更新，格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [未发布]

### 新增

### 变更

- 产品重新定位为面向受信任 Web 应用、内网系统和展示终端的宽松兼容浏览器，并统一相关界面与文档文案。
- 根据当前实现校正文档中的配置优先级、主页按钮、窗口关闭、缓存清理和受管子窗口行为，移除“单页模式”等过时表述。

### 修复

### 移除

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

### Added

### Changed

- Repositioned the product as a permissive compatibility browser for trusted Web applications, intranet systems, and display terminals, with matching UI and documentation copy.
- Aligned the documentation with current configuration precedence, home-button, window-closing, cache-clearing, and managed-child-window behavior, removing outdated “single-page mode” claims.

### Fixed

### Removed

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

[未发布]: https://github.com/Y-ASLant/Box/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/Y-ASLant/Box/releases/tag/v1.0.0
[Unreleased]: https://github.com/Y-ASLant/Box/compare/v1.0.0...HEAD
