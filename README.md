# 浏览器Plus
- 屏蔽调试模式
- 屏蔽快捷键
- 屏蔽Alt+F4关闭窗口
- 屏蔽鼠标文字选中
- 屏蔽鼠标右键菜单
- 美化滚动条
- 无边框设计+悬浮式控制面板
- 去除SSL警告
- 支持本地配置文件

## 部署

本项目使用 `electron-builder` 进行打包。

### 环境准备

首先，请确保您已安装 [Node.js](https://nodejs.org/) 和 `npm`。然后安装项目依赖：

```bash
npm install
```

### 运行
```bash
npm run start
```

### 打包命令
```bash
npm run build:electron-fast
```

您可以根据目标平台运行以下命令：

- **打包为 Windows 应用:**
  ```bash
  npm run build:win
  ```

- **打包为 macOS 应用:**
  ```bash
  npm run build:mac
  ```

- **打包为 Linux 应用:**
  ```bash
  npm run build:linux
  ```

打包后的文件将位于 `build` 目录下。

## 使用说明

### 配置文件

您可以在应用程序根目录创建一个 `config.json` 文件来配置应用的启动行为。配置文件中的设置将优先于命令行参数。

配置文件示例：
```json
{
  "link": "asdasd.com",
  "mode": "fullscreen",
  "window": "top",
  "page": "single",
  "hide": "home,close",
  "bg": "C:/path/to/background.jpg"
}
```

支持的配置项：
- `link`: 指定启动时加载的URL
- `mode`: 设置为 "fullscreen" 以全屏模式启动
- `window`: 设置为 "top" 使窗口保持在最顶层
- `page`: 设置为 "single" 启用单页模式
- `hide`: 指定要隐藏的控制按钮，用逗号分隔
- `bg`: 指定登录界面的背景图片路径

### 命令行参数

您可以在执行程序时附加以下参数来自定义启动行为：

- `-link=<url>`: 指定启动时加载的URL。
  - **示例:** `Box.exe -link=www.bing.com`

- `-mode=fullscreen`: 以全屏模式启动。
  - **示例:** `Box.exe -mode=fullscreen`

- `-window=top`: 使窗口保持在最顶层。
  - **示例:** `Box.exe -window=top`

- `-page=single`: 启用单页模式。在此模式下，点击"主页"按钮将打开系统的用户主目录，而不是返回应用的登录页。
  - **示例:** `Box.exe -page=single`

- `-hide=<button1>,<button2>`: 隐藏悬浮控制面板中的一个或多个按钮。可隐藏的按钮包括 `home`, `minimize`, `maximize`, `close`, `fullscreen`。
  - **示例:** `Box.exe -hide=home,close`

- `-bg=<path>`: 设置登录界面的背景图片。
  - **示例:** `Box.exe -bg=C:/backgrounds/image.jpg`

### 快捷键

应用内置了以下快捷键以方便操作：

- `Ctrl + Shift + Alt`: 切换应用内悬浮控制面板的显示与隐藏。
