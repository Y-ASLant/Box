// 控制面板脚本模块
// 用于注入到页面中的控制面板功能

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
 * 按钮配置定义
 */
const BUTTON_CONFIGS = [
  { name: 'home', color: '#4361ee', icon: CONTROL_ICONS.home, action: 'return-to-login' },
  { name: 'minimize', color: '#f9c74f', icon: CONTROL_ICONS.minimize, action: 'minimize' },
  { name: 'maximize', color: '#2ec4b6', icon: CONTROL_ICONS.maximize, action: 'maximize' },
  { name: 'close', color: '#e63946', icon: CONTROL_ICONS.close, action: 'close' },
  { name: 'fullscreen', color: '#6a4c93', icon: CONTROL_ICONS.fullscreen, action: 'toggle-fullscreen', fullWidth: true }
];

/**
 * 创建控制按钮元素
 * @param {string} color - 按钮颜色
 * @param {string} iconSvg - 图标SVG
 * @param {string} action - 操作动作
 * @param {boolean} fullWidth - 是否全宽
 * @returns {HTMLElement} 按钮元素
 */
function createControlButton(color, iconSvg, action, fullWidth = false) {
  const button = document.createElement('div');

  // 基础样式
  let basicStyle = `background-color: ${color}; ` +
    'border-radius: 12px; ' +
    'padding: 12px; ' +
    'display: flex; ' +
    'align-items: center; ' +
    'justify-content: center; ' +
    'cursor: pointer; ' +
    'color: white; ' +
    'height: 52px; ' +
    'box-sizing: border-box; ' +
    'box-shadow: 0 2px 10px rgba(0,0,0,0.15); ' +
    'transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); ' +
    'position: relative; ' +
    'overflow: hidden;';

  // 设置宽度
  basicStyle += fullWidth ? 'width: 118px;' : 'width: 52px;';
  button.style.cssText = basicStyle;

  // 悬停效果
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

  // 点击效果
  button.onmousedown = () => button.style.transform = 'scale(0.95)';
  button.onmouseup = () => button.style.transform = 'scale(1)';

  // 点击处理
  button.onclick = (e) => {
    // 创建涟漪效果
    createRippleEffect(button, e);
    
    // 执行操作
    handleButtonAction(action);
    
    e.stopPropagation();
  };

  button.innerHTML = iconSvg;
  button.className = 'no-select';
  
  return button;
}

/**
 * 创建涟漪效果
 * @param {HTMLElement} button - 按钮元素
 * @param {MouseEvent} event - 鼠标事件
 */
function createRippleEffect(button, event) {
  const ripple = document.createElement('div');
  const rect = button.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const diameter = Math.max(button.clientWidth, button.clientHeight) * 2.5;

  ripple.style.cssText = 
    'position: absolute;' +
    `width: ${diameter}px;` +
    `height: ${diameter}px;` +
    `left: ${x - diameter / 2}px;` +
    `top: ${y - diameter / 2}px;` +
    'background-color: rgba(255, 255, 255, 0.5);' +
    'border-radius: 50%;' +
    'transform: scale(0);' +
    'transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1);' +
    'pointer-events: none;' +
    'opacity: 0.7;';

  button.appendChild(ripple);

  setTimeout(() => {
    ripple.style.transform = 'scale(1)';
    ripple.style.opacity = '0';
  }, 10);

  setTimeout(() => {
    if (ripple.parentNode === button) {
      button.removeChild(ripple);
    }
  }, 600);
}

/**
 * 处理按钮操作
 * @param {string} action - 操作动作
 */
function handleButtonAction(action) {
  if (window.hideControlPanel) {
    window.isProcessingAction = true;
    window.hideControlPanel();

    setTimeout(() => {
      window.postMessage({ type: 'electron-control', action: action }, '*');
      setTimeout(() => {
        window.isProcessingAction = false;
      }, 300);
    }, 50);
  } else {
    window.postMessage({ type: 'electron-control', action: action }, '*');
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CONTROL_ICONS,
    BUTTON_CONFIGS,
    createControlButton,
    createRippleEffect,
    handleButtonAction
  };
}
