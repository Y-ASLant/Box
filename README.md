# Box（浏览器 Plus）

[![CI](https://github.com/Y-ASLant/Box/actions/workflows/ci.yml/badge.svg)](https://github.com/Y-ASLant/Box/actions/workflows/ci.yml)
[![Release](https://github.com/Y-ASLant/Box/actions/workflows/release.yml/badge.svg)](https://github.com/Y-ASLant/Box/actions/workflows/release.yml)

Box 是一个兼容性优先的宽松 Electron 浏览器，面向受信任的 Web 应用、内网系统、设备管理页面、大屏展示和固定终端。它可以从本地新标签页打开 HTTP(S) 地址、域名或 IP，也可以在启动时直接加载配置的页面，并提供标签页、地址栏和常用网页导航能力。

## 产品定位

Box 不是面向公共互联网的通用浏览器，也不是安全隔离容器。它优先解决受控环境中“页面能打开、Web 程序能运行、窗口便于展示和管理”的需求，适合：

- 运行浏览器承载的 Web 程序、后台系统和业务工具
- 访问局域网、专网、本机服务、IP 地址和设备管理页面
- 展示数据看板、信息大屏、展厅内容和固定终端页面
- 兼容使用自签名证书、宽松同源策略或特殊 CSP 的受信任旧系统
- 通过配置文件和启动参数设置启动地址、全屏、置顶和主页按钮行为

默认的 `permissive` 兼容模式会忽略证书错误、关闭 Electron Web Security，并为页面设置宽松 CSP，以减少 Chromium 默认安全策略对受控 Web 程序的限制。也可以切换为遵循浏览器安全策略的 `standard` 模式。两种模式都不会绕过服务器登录、网络 ACL、VPN、防火墙或操作系统权限，也不保证所有要求安全上下文的 Web API 都能在普通 HTTP 页面运行。

## 功能

- HTTP(S)、域名、IP 和本机/内网 Web 服务访问
- 自签名或异常证书页面兼容
- 宽松同源与 CSP 策略，适配受信任 Web 程序
- 浏览器式顶部标签栏、地址栏和前进/后退/刷新导航
- 自定义窗口边框和标题栏控制，支持拖拽、缩放、全屏和置顶
- 接管页面新窗口请求并在新标签页中打开
- 浅色、深色主题；未指定时使用已保存偏好，首次使用按系统配色
- 最多六条最近访问地址，以及会话缓存与站点数据清理
- 可配置新标签页背景
- URL 加载失败时显示本地错误页

> [!IMPORTANT]
> Box 面向受控环境，并在默认的 `permissive` 模式下信任加载的页面。请只加载可信的 Web 应用或内网服务，不要用宽松模式浏览未知网站，也不要把快捷键或开发者工具限制视为安全边界。

## 环境要求

- Node.js 22.18 或更高版本
- pnpm 12.4.2 或更高版本

```bash
corepack enable pnpm
pnpm install
```

## 开发

```bash
pnpm start        # 启动 Electron 开发模式
pnpm dev          # 仅启动 Vue/Vite renderer
pnpm preview      # 预览已经生成的 renderer 生产构建
pnpm test         # 运行配置与 URL 单元测试
pnpm check        # 检查 renderer、Electron、shared 和构建配置
pnpm check:node   # 仅检查 Electron、shared 和构建配置
pnpm build        # 运行测试、类型检查并构建 renderer
```

`pnpm start` 和 Electron 打包命令会按需准备当前平台的 Electron 运行时，首次执行需要联网下载。

项目使用 Node.js 内置测试运行器覆盖配置和 URL 边界；当前没有 lint、格式化或覆盖率命令。`pnpm check` 是静态检查入口，所有构建命令会先运行测试和静态检查。

## 打包

```bash
pnpm build:electron    # 检查并按当前平台的默认目标打包
pnpm build:win         # Windows x64 NSIS（build:win:x64 的别名）
pnpm build:mac:x64     # macOS Intel DMG
pnpm build:mac:arm64   # macOS Apple Silicon DMG
pnpm build:linux:x64   # Linux x64 AppImage、deb 和 rpm
pnpm build:linux:arm64 # Linux arm64 AppImage、deb 和 rpm
```

跨架构命令应在相同 CPU 架构的系统上运行，避免把当前平台的 Electron 运行时装入错误架构的安装包。产物位于 `build/`，文件名包含版本、平台和架构。也可以使用 Make：

```bash
make build       # 完整打包，成功后仅保留发布文件
make clean       # 删除构建产物、缓存、日志和临时文件
make distclean   # clean 后继续删除 node_modules 和仓库内 pnpm store
```

`dist/`、`dist-electron/` 和解包目录是生成内容，不应手动编辑。

### GitHub Actions 测试

- [CI](.github/workflows/ci.yml) 在推送到 `main`、Pull Request 和手动运行时检查 GitHub Actions 工作流、当前版本的中英文 changelog、TypeScript，并构建 renderer。
- [Package Test](.github/workflows/package-test.yml) 仅支持手动运行，会在与正式发布相同的五个原生平台/架构目标中完整打包，并保留产物 7 天。
- Package Test 不会创建 GitHub Release，适合在推送版本标签前验证安装包。

在仓库的 **Actions → Package Test → Run workflow** 中选择需要测试的分支即可启动完整打包。

## 发布

推送 `v1.0.0` 或 `V1.0.0` 这类 SemVer 标签会触发 [Release 工作流](.github/workflows/release.yml)。工作流会先确认标签版本与 `package.json` 一致，并检查 [CHANGELOG.md](CHANGELOG.md) 中存在相同版本的中英文条目；全部平台构建成功后，才会创建 GitHub Release。

发布新版本时：

1. 更新 `package.json` 的 `version`。
2. 将 `CHANGELOG.md` 的未发布内容整理到同一版本号和日期下，中英文部分都要更新。
3. 完成本地检查后提交代码，再创建并推送标签。

```bash
pnpm build
git tag v1.0.0
git push origin v1.0.0
```

正式版本会标记为 Latest Release，带预发布后缀的版本（例如 `v1.1.0-beta.1`）会标记为 Pre-release。Release 正文直接取自对应版本的 `CHANGELOG.md`，并附带以下构建产物：

| 平台 | 架构 | 格式 |
| --- | --- | --- |
| Windows | x64 | NSIS `.exe` |
| macOS | x64、arm64 | `.dmg` |
| Linux | x64、arm64 | `.AppImage`、`.deb`、`.rpm` |

## 配置

开发模式默认读取当前工作目录中的 `config.json`；打包后默认读取 `Box` 可执行文件旁的 `config.json`。可以使用 `-config=<path>` 指定其他文件。相对背景路径基于配置文件目录解析，命令行提供的相对背景路径基于当前工作目录解析。

配置优先级为：内置默认值 < 配置文件 < 命令行参数。命令行支持单横线和双横线形式。

```json
{
  "url": "https://example.com",
  "fullscreen": true,
  "alwaysOnTop": true,
  "singlePage": true,
  "theme": "dark",
  "background": "./background.jpg",
  "compatibilityMode": "permissive"
}
```

| 配置字段 | 命令行参数 | 可用值 | 默认行为 | 说明 |
| --- | --- | --- | --- | --- |
| `url` | `-url=<url>` | HTTP(S) 地址、域名或 IP | 显示本地启动页 | 启动后直接加载页面；未写协议时补充 `http://` |
| `fullscreen` | `-fullscreen=<bool>` | `true`、`false` | `false` | 主窗口是否全屏启动 |
| `alwaysOnTop` | `-always-on-top=<bool>` | `true`、`false` | `false` | 主窗口是否始终置顶 |
| `singlePage` | `-single-page=<bool>` | `true`、`false` | `false` | 新窗口链接复用当前标签页并禁止新增标签 |
| `theme` | `-theme=<theme>` | `light`、`dark` | 已保存偏好；首次使用按系统配色 | 影响浏览器外壳和新标签页 |
| `background` | `-background=<path>` | 本地文件路径 | 默认背景 | 只影响新标签页 |
| `compatibilityMode` | `-compatibility-mode=<mode>` | `permissive`、`standard` | `permissive` | 浏览器兼容与安全策略 |

`permissive` 会忽略证书错误、关闭 Web Security 并放宽 CSP；`standard` 保留 Chromium 默认的证书、同源和 CSP 行为。无效类型、枚举值和未知字段会被忽略并写入主进程日志；不存在的背景文件不会显示。

旧字段 `link`、`mode`、`window`、`page`、`hide`、`bg` 以及对应旧命令行参数仍可被解析以兼容旧配置，但原悬浮控制面板和隐藏控件交互已经移除。

开发模式下可直接传递参数：

```bash
pnpm start --url=https://example.com --theme=dark
```

安装后的可执行文件使用相同格式，例如：

```powershell
Box.exe --url=http://192.168.1.10 --fullscreen=true --always-on-top=true
```

## 操作与窗口行为

- `Ctrl/Cmd + T` 新建标签页，`Ctrl/Cmd + W` 关闭当前标签页，`Ctrl/Cmd + L` 聚焦地址栏。
- 标签栏右侧提供自定义最小化、最大化/还原和关闭按钮；Windows 和 Linux 上关闭最后一个窗口后应用退出，macOS 遵循保留应用进程的常规行为。
- 主页按钮把当前标签恢复为本地新标签页。
- 页面通过 `window.open` 等方式请求 HTTP(S) 新窗口时，普通模式会创建新标签页，单页模式会在当前标签页打开。其他协议会被拒绝。
- 新标签页最多保存六条最近地址。“清除记录”会清除整个 Electron 会话的 HTTP 缓存、Cookie、站点存储、Service Worker 和最近地址，也会移除本地保存的主题偏好，并可能使已登录站点退出。
- F12 和 `Ctrl/Cmd + Shift + I/J` 在应用窗口内被拦截；这些限制只是交互约束，不是安全控制。

## 项目结构

```text
src/       Vue 浏览器外壳、新标签页、路由、主题和最近地址
electron/  Electron 主进程、标签页视图、预加载、IPC、配置和会话策略
shared/    跨进程类型和 HTTP URL 规范化
assets/    构建所需图标和 README 截图
```

启动链路为 `electron/main.ts` → `electron/app-lifecycle.ts` → `electron/window-manager.ts`。浏览器外壳保留在主窗口中，每个远程标签页运行在独立的 `WebContentsView` 中。两者都启用上下文隔离并关闭 Node 集成；远程标签页不加载预加载脚本。需要特权能力时保持以下固定边界：

```text
Vue 浏览器外壳 → preload 固定方法 → IPC handler → Electron 标签页操作
```

预加载脚本不会暴露原始 `ipcRenderer`。标签页导航、配置读取和清理操作都会校验调用方，远程页面不能直接调用浏览器外壳的 IPC。由于默认的 `permissive` 模式会关闭 Web Security、忽略证书错误，这些边界不能把不受信任页面变成安全内容。需要浏览器默认安全策略时应使用 `standard` 模式。

## License

[MIT](LICENSE)
