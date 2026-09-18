# Box（浏览器 Plus）

[![CI](https://github.com/Y-ASLant/Box/actions/workflows/ci.yml/badge.svg)](https://github.com/Y-ASLant/Box/actions/workflows/ci.yml)
[![Release](https://github.com/Y-ASLant/Box/actions/workflows/release.yml/badge.svg)](https://github.com/Y-ASLant/Box/actions/workflows/release.yml)

Box 是一个兼容性优先的宽松 Electron 浏览器，面向受信任的 Web 应用、内网系统、设备管理页面、大屏展示和固定终端。它可以从本地启动页打开 HTTP(S) 地址、域名或 IP，也可以在启动时直接加载配置的页面，并为应用窗口提供无边框界面和悬浮控制面板。

![应用界面](assets/demo.png)

## 产品定位

Box 不是面向公共互联网的通用浏览器，也不是安全隔离容器。它优先解决受控环境中“页面能打开、Web 程序能运行、窗口便于展示和管理”的需求，适合：

- 运行浏览器承载的 Web 程序、后台系统和业务工具
- 访问局域网、专网、本机服务、IP 地址和设备管理页面
- 展示数据看板、信息大屏、展厅内容和固定终端页面
- 兼容使用自签名证书、宽松同源策略或特殊 CSP 的受信任旧系统
- 通过配置文件和启动参数设置启动地址、全屏、置顶和主页按钮行为

“宽松”表示 Box 主动忽略证书错误、关闭 Electron Web Security，并为页面设置宽松 CSP，以减少 Chromium 默认安全策略对受控 Web 程序的限制。它不会绕过服务器登录、网络 ACL、VPN、防火墙、操作系统权限，也不保证所有要求安全上下文的 Web API 都能在普通 HTTP 页面运行。

## 功能

- HTTP(S)、域名、IP 和本机/内网 Web 服务访问
- 自签名或异常证书页面兼容
- 宽松同源与 CSP 策略，适配受信任 Web 程序
- 无边框主窗口和悬浮控制面板
- 全屏、置顶和可配置的主页按钮行为
- 接管页面新窗口请求并创建受管子窗口
- 浅色、深色主题；未指定时使用已保存偏好，首次使用按系统配色
- 最多三条最近访问地址，以及会话缓存与站点数据清理
- 可配置背景、滚动条、鼠标和控制按钮
- URL 加载失败时显示本地错误页

> [!IMPORTANT]
> Box 面向受控环境，并默认信任加载的页面。应用会忽略证书错误、关闭 Electron Web Security、放宽 CSP，并向页面注入窗口控制能力。请只加载可信的 Web 应用或内网服务，不要用它浏览未知网站，也不要把快捷键、右键菜单或开发者工具限制视为安全边界。

## 环境要求

- Node.js 22.12 或更高版本
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
pnpm check        # 检查 renderer、Electron、shared 和构建配置
pnpm check:node   # 仅检查 Electron、shared 和构建配置
pnpm build        # 类型检查并构建 renderer
```

`pnpm start` 和 Electron 打包命令会按需准备当前平台的 Electron 运行时，首次执行需要联网下载。

项目当前没有单元测试框架以及 lint、格式化命令，`pnpm check` 是提交前和 CI 使用的静态检查入口。

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
pnpm check
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

应用启动时读取**当前工作目录**中的可选 `config.json`，不是固定读取可执行文件所在目录。每个字段的有效配置文件值优先于同名命令行参数；配置文件未提供、为空或枚举值无效时，才使用有效的命令行值，最后回退到默认行为。

```json
{
  "link": "https://example.com",
  "mode": "fullscreen",
  "window": "top",
  "page": "single",
  "theme": "dark",
  "hide": "home,close,scroll",
  "bg": "C:/path/to/background.jpg"
}
```

| 配置字段 | 命令行参数 | 可用值 | 默认行为 | 说明 |
| --- | --- | --- | --- | --- |
| `link` | `-link=<url>` | HTTP(S) 地址、域名或 IP | 显示本地启动页 | 启动后直接加载页面；未写协议时补充 `http://` |
| `mode` | `-mode=<mode>` | `fullscreen`、`normal` | `normal` | 主窗口初始窗口模式 |
| `window` | `-window=<type>` | `top`、`normal` | `normal` | 主窗口是否始终置顶 |
| `page` | `-page=<type>` | `single`、`multi` | `multi` | 只改变主窗口主页按钮行为，见“操作与窗口行为” |
| `theme` | `-theme=<theme>` | `light`、`dark` | 已保存偏好；首次使用按系统配色 | 只影响本地启动页和错误页 |
| `hide` | `-hide=<items>` | 见下表 | 不隐藏 | 逗号分隔，可组合多个隐藏项 |
| `bg` | `-bg=<path>` | 本地文件路径 | 默认背景 | 只影响启动页；相对路径基于当前工作目录 |

配置文件根节点必须是对象，配置值必须是字符串。无效类型、枚举值和未知隐藏项会被忽略并写入主进程日志；不存在或无法解析的背景文件不会显示。`hide` 在配置文件中只要包含至少一个有效项，就整体优先于命令行的 `-hide`。命令行参数和值区分大小写；同名参数重复出现时使用第一个。

### 可隐藏元素

| 值 | 效果 |
| --- | --- |
| `control` | 不注入悬浮控制面板，同时停用其切换快捷键 |
| `theme` | 隐藏本地页面的主题按钮，不影响已配置或已保存的主题 |
| `scroll` | 隐藏滚动条但保留滚动能力 |
| `mouse` | 隐藏鼠标光标，输入区域仍显示文本光标 |
| `home` | 隐藏主页按钮 |
| `minimize` | 隐藏最小化按钮 |
| `maximize` | 隐藏最大化按钮 |
| `close` | 隐藏关闭按钮 |
| `fullscreen` | 隐藏全屏按钮 |

开发模式下可直接传递参数：

```bash
pnpm start -link=https://example.com -theme=dark -hide=scroll
```

安装后的可执行文件使用相同格式，例如：

```powershell
Box.exe -link=http://192.168.1.10 -mode=fullscreen -window=top
```

## 操作与窗口行为

- 按下 `Ctrl + Shift + Alt` 切换悬浮控制面板。
- 主窗口的系统关闭操作会最小化窗口；控制面板的关闭按钮会真正关闭主窗口。在 Windows 和 Linux 上，所有窗口关闭后应用退出；macOS 遵循保留应用进程的常规行为。
- `page=multi` 时，主窗口的主页按钮返回本地启动页；`page=single` 时，该按钮改为在系统文件管理器中打开当前用户目录。这个选项不会禁止页面导航或新窗口。
- 页面通过 `window.open` 等方式请求新窗口时，Box 会阻止默认窗口并创建同样受管的无边框子窗口。子窗口的主页按钮和错误页按钮用于关闭该子窗口。
- 启动页最多保存三条最近地址。点击“最近访问”标题或其清理图标会清除整个 Electron 会话的 HTTP 缓存、Cookie、站点存储、Service Worker 和最近地址，也会移除本地保存的主题偏好，并可能使已登录站点退出。
- F12、`Ctrl/Cmd + Shift + I/J`、右键菜单和 `Alt + F4` 在应用窗口内被拦截；这些限制只是交互约束，不是安全控制。

## 项目结构

```text
src/       Vue 本地启动页、错误页、路由、主题和最近地址
electron/  Electron 主进程、预加载、IPC、配置、窗口和会话策略
shared/    跨进程类型、HTTP URL 规范化、注入脚本和样式
assets/    构建所需图标和 README 截图
```

启动链路为 `electron/main.ts` → `electron/app-lifecycle.ts` → `electron/window-manager.ts`。本地页面和受信任远程页面都运行在启用上下文隔离、关闭 Node 集成的渲染进程中。需要特权能力时保持以下固定边界：

```text
Vue/注入控件 → preload 固定方法 → IPC handler → Electron 操作
```

预加载脚本不会暴露原始 `ipcRenderer`。本地导航、配置读取和清理操作会校验调用方；远程页面的悬浮控件只能调用绑定到当前窗口的固定窗口操作。由于 Box 仍会关闭 Web Security、忽略证书错误并向页面注入脚本，这些边界不能把不受信任页面变成安全内容。

## License

[MIT](LICENSE)
