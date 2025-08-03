// 控制面板脚本生成器
// 用于生成注入到页面中的控制面板脚本

import type { ButtonConfig } from './types';

/**
 * SVG 图标定义
 */
const CONTROL_ICONS = {
  home: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>',
  minimize: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
  maximize: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>',
  close: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
  fullscreen: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"></path><path d="M21 8V5a2 2 0 0 0-2-2h-3"></path><path d="M3 16v3a2 2 0 0 0 2 2h3"></path><path d="M16 21h3a2 2 0 0 0 2-2v-3"></path></svg>'
};

/**
 * 默认按钮配置
 */
const DEFAULT_BUTTON_CONFIGS: ButtonConfig[] = [
  { name: 'home', color: '#4361ee', icon: CONTROL_ICONS.home, action: 'return-to-login' },
  { name: 'minimize', color: '#f9c74f', icon: CONTROL_ICONS.minimize, action: 'minimize' },
  { name: 'maximize', color: '#2ec4b6', icon: CONTROL_ICONS.maximize, action: 'maximize' },
  { name: 'close', color: '#e63946', icon: CONTROL_ICONS.close, action: 'close' },
  { name: 'fullscreen', color: '#6a4c93', icon: CONTROL_ICONS.fullscreen, action: 'toggle-fullscreen', fullWidth: true }
];

/**
 * 生成控制面板的主脚本
 * @param hiddenButtons 隐藏的按钮列表
 * @returns 完整的控制面板脚本
 */
export function generateControlPanelScript(hiddenButtons: string[]): string {
  // 如果隐藏列表包含 'control'，则不生成任何控制面板
  if (hiddenButtons.includes('control')) {
    return `
      // 控制面板已被隐藏
      console.log('控制面板已通过 -hide=control 参数隐藏');
    `;
  }
  
  return getSimpleControlScript(hiddenButtons);
}

/**
 * 简化的控制脚本实现
 */
function getSimpleControlScript(hiddenButtons: string[]): string {
  return `
    const hiddenButtons = ${JSON.stringify(hiddenButtons)};

    // 创建一个自定义事件来触发控制面板显示
    window.toggleControlPanel = function() {
      const event = new CustomEvent('toggle-control-panel');
      window.dispatchEvent(event);
    };

    // 创建浮动控制按钮元素
    const createControlsElement = () => {
      // 如果已存在控制面板，直接返回
      let existingPanel = document.getElementById('electron-floating-controls');
      if (existingPanel) return existingPanel;

      // 添加全局样式以禁用文本选择
      let styleElement = document.getElementById('electron-controls-style');
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = 'electron-controls-style';
        styleElement.textContent = '.no-select { -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; cursor: default; }';
        document.head.appendChild(styleElement);
      }

      const controlsDiv = document.createElement('div');
      controlsDiv.id = 'electron-floating-controls';
      controlsDiv.className = 'no-select';
      controlsDiv.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 999999; display: none; background-color: rgba(23, 25, 35, 0.85); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); padding: 16px; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); box-sizing: content-box;';

      // SVG图标定义
      const icons = {
        home: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>',
        minimize: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
        maximize: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>',
        close: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
        fullscreen: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"></path><path d="M21 8V5a2 2 0 0 0-2-2h-3"></path><path d="M3 16v3a2 2 0 0 0 2 2h3"></path><path d="M16 21h3a2 2 0 0 0 2-2v-3"></path></svg>'
      };

      // 创建一个固定宽度的容器
      const containerDiv = document.createElement('div');
      containerDiv.style.cssText = 'width: 118px; box-sizing: border-box;';
      controlsDiv.appendChild(containerDiv);

      // 使用Flexbox布局，使其能自适应
      const controlsLayout = document.createElement('div');
      controlsLayout.style.cssText = 'display: flex; flex-wrap: wrap; justify-content: center; gap: 14px; box-sizing: border-box;';
      containerDiv.appendChild(controlsLayout);

      // 按钮创建函数
      const createButton = (color, iconSvg, action, fullWidth = false) => {
        const button = document.createElement('div');
        let basicStyle = 'background-color: ' + color + '; border-radius: 12px; padding: 12px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: white; height: 52px; box-sizing: border-box; box-shadow: 0 2px 10px rgba(0,0,0,0.15); transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); position: relative; overflow: hidden;';
        basicStyle += fullWidth ? 'width: 118px;' : 'width: 52px;';
        button.style.cssText = basicStyle;

        button.onmouseover = () => {
          button.style.transform = 'translateY(-3px)';
          button.style.boxShadow = '0 6px 15px rgba(0,0,0,0.2)';
          button.style.filter = 'brightness(1.1)';
        };
        button.onmouseout = () => {
          button.style.transform = 'translateY(0)';
          button.style.boxShadow = '0 2px 10px rgba(0,0,0,0.15)';
          button.style.filter = 'brightness(1)';
        };
        button.onmousedown = () => button.style.transform = 'scale(0.95)';
        button.onmouseup = () => button.style.transform = 'scale(1)';

        button.onclick = (e) => {
          if (window.hideControlPanel) {
            isProcessingAction = true;
            window.hideControlPanel();
            setTimeout(() => {
              window.postMessage({ type: 'electron-control', action: action }, '*');
              setTimeout(() => { isProcessingAction = false; }, 300);
            }, 50);
          } else {
            window.postMessage({ type: 'electron-control', action: action }, '*');
          }
          e.stopPropagation();
        };

        button.innerHTML = iconSvg;
        button.className = 'no-select';
        return button;
      };

      const allButtons = [
        { name: 'home', color: '#4361ee', icon: icons.home, action: 'return-to-login' },
        { name: 'minimize', color: '#f9c74f', icon: icons.minimize, action: 'minimize' },
        { name: 'maximize', color: '#2ec4b6', icon: icons.maximize, action: 'maximize' },
        { name: 'close', color: '#e63946', icon: icons.close, action: 'close' },
        { name: 'fullscreen', color: '#6a4c93', icon: icons.fullscreen, action: 'toggle-fullscreen', fullWidth: true }
      ];

      const visibleButtons = allButtons.filter(btnConfig => !hiddenButtons.includes(btnConfig.name));
      visibleButtons.forEach(btnConfig => {
        const button = createButton(btnConfig.color, btnConfig.icon, btnConfig.action, btnConfig.fullWidth || false);
        controlsLayout.appendChild(button);
      });

      document.body.appendChild(controlsDiv);
      return controlsDiv;
    };

    // 全局变量，用于跟踪控制面板状态
    let controlsElement;
    let dragRegionElement;
    let isVisible = false;
    let isProcessingAction = false;

    // 全局函数，用于隐藏控制面板
    window.hideControlPanel = () => {
      if (controlsElement) {
        isVisible = false;
        controlsElement.style.display = 'none';
        if (dragRegionElement) {
          dragRegionElement.style.height = '5px';
          dragRegionElement.style.opacity = '0';
        }
      }
    };

    // 处理自定义事件
    window.addEventListener('toggle-control-panel', () => {
      if (isProcessingAction) return;
      controlsElement = controlsElement || createControlsElement();
      dragRegionElement = dragRegionElement || document.querySelector('.drag-region');
      isVisible = !isVisible;

      if (isVisible) {
        controlsElement.style.display = 'block';
        if (dragRegionElement) {
          dragRegionElement.style.height = '128px';
          dragRegionElement.style.opacity = '0.1';
        }
      } else {
        controlsElement.style.display = 'none';
        if (dragRegionElement) {
          dragRegionElement.style.height = '5px';
          dragRegionElement.style.opacity = '0';
        }
      }
    });

    // 监听键盘事件
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.altKey) {
        if (e.repeat) return;
        if (isProcessingAction) return;
        window.toggleControlPanel();
      }
    });

    // 点击外部隐藏
    document.addEventListener('click', (e) => {
      if (isProcessingAction) return;
      if (controlsElement && isVisible) {
        if (!controlsElement.contains(e.target) && !e.target.classList.contains('drag-region')) {
          isVisible = false;
          controlsElement.style.display = 'none';
          if (dragRegionElement) {
            dragRegionElement.style.height = '5px';
            dragRegionElement.style.opacity = '0';
          }
        }
      }
    });

    // 接收来自iframe的消息
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'show-control-panel') {
        window.toggleControlPanel();
      } else if (event.data && event.data.type === 'electron-control') {
        window.postMessage({
          type: 'electron-ipc-control',
          action: event.data.action
        }, '*');
      }
    });
  `;
}
