import { BrowserWindow } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { customScrollbarCSS, hiddenScrollbarCSS, hiddenMouseCSS, disableTextSelectionCSS, dragRegionCSS, newWindowCSS, baseWindowCSS } from '../shared/styles';
import { generateControlPanelScript } from '../shared/control-panel-generator';
import type { ButtonConfig } from '../shared/types';

// 重新导出样式，保持向后兼容
export { customScrollbarCSS, hiddenScrollbarCSS, hiddenMouseCSS };

// 注入控制脚本到webContents
export function injectControlsScript(targetWindow: BrowserWindow, hiddenButtons: string[] = []) {
  if (!targetWindow || targetWindow.isDestroyed()) return;

  try {
    const hiddenButtonsJSON = JSON.stringify(hiddenButtons);
    
    // 检查webContents是否存在且未销毁
    if (!targetWindow.webContents || targetWindow.webContents.isDestroyed()) {
      console.error('无法注入控制脚本：webContents不存在或已销毁');
      return;
    }

    // 检查DOM是否已加载
    targetWindow.webContents.executeJavaScript(`
      !!document && !!document.body
    `).then(domReady => {
      if (!domReady) {
        console.error('无法注入控制脚本：DOM未准备好');
        return;
      }
      
      // DOM已准备好，安全地注入控制脚本
      targetWindow.webContents.executeJavaScript(generateControlPanelScript(hiddenButtons))
        .catch(error => {
          console.error('注入控制脚本时出错:', error);
        });
    }).catch(error => {
      console.error('检查DOM准备情况时出错:', error);
    });
  } catch (error) {
    console.error('注入控制脚本过程中发生异常:', error);
  }
}

// 隐藏控制面板的通用函数
export function hideControlPanel(targetWindow: BrowserWindow) {
  if (!targetWindow || targetWindow.isDestroyed()) return;
  
  targetWindow.webContents.executeJavaScript(`
    if (window.hideControlPanel) {
      window.hideControlPanel();
    }
  `).catch(() => {
    // 忽略错误
  });
}

// 注入基础样式和拖动区域
export function injectBaseStyles(targetWindow: BrowserWindow, hiddenButtons: string[] = []) {
  if (!targetWindow || targetWindow.isDestroyed()) return;

  // 注入基础样式
  targetWindow.webContents.insertCSS(baseWindowCSS).catch(e => console.error('插入CSS错误:', e));

  // 根据隐藏参数决定使用哪种滚动条样式
  const scrollbarCSS = hiddenButtons.includes('scroll') ? hiddenScrollbarCSS : customScrollbarCSS;
  targetWindow.webContents.insertCSS(scrollbarCSS).catch(e => console.error('插入滚动条CSS错误:', e));

  // 根据隐藏参数决定是否隐藏鼠标光标
  if (hiddenButtons.includes('mouse')) {
    targetWindow.webContents.insertCSS(hiddenMouseCSS).catch(e => console.error('插入隐藏鼠标CSS错误:', e));
  }

  // 将disable-select类添加到body并创建拖动区域
  targetWindow.webContents.executeJavaScript(`
    document.body.classList.add('disable-select');

    // 创建拖动区域
    if (!document.querySelector('.drag-region')) {
      const dragRegion = document.createElement('div');
      dragRegion.className = 'drag-region';
      document.body.appendChild(dragRegion);
    }

    // 禁用整个文档的双击最大化功能
    document.addEventListener('dblclick', (e) => {
      e.stopPropagation();
    }, true);
  `).catch(e => console.error('执行JavaScript错误:', e));
}

// 为新窗口注入样式（包含更严格的文本选择禁用）
export function injectNewWindowStyles(targetWindow: BrowserWindow, hiddenButtons: string[] = []) {
  if (!targetWindow || targetWindow.isDestroyed()) return;

  targetWindow.webContents.insertCSS(newWindowCSS).catch(e => console.error('插入CSS错误:', e));

  // 根据隐藏参数决定是否隐藏鼠标光标
  if (hiddenButtons.includes('mouse')) {
    targetWindow.webContents.insertCSS(hiddenMouseCSS).catch(e => console.error('插入隐藏鼠标CSS错误:', e));
  }
}

// 为新窗口注入JavaScript行为
export function injectNewWindowBehaviors(targetWindow: BrowserWindow) {
  if (!targetWindow || targetWindow.isDestroyed()) return;

  targetWindow.webContents.executeJavaScript(`
    // 添加拖动区域
    if (!document.querySelector('.drag-region')) {
      const dragRegion = document.createElement('div');
      dragRegion.className = 'drag-region';
      document.body.appendChild(dragRegion);
    }
    
    // 禁用文本选择的JavaScript处理
    document.addEventListener('selectstart', (e) => {
      // 允许在输入框中选择文本
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.contentEditable === 'true') {
        return true;
      }
      e.preventDefault();
      return false;
    }, false);
    
    // 禁用拖拽选择
    document.addEventListener('dragstart', (e) => {
      if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA' && e.target.contentEditable !== 'true') {
        e.preventDefault();
        return false;
      }
    }, false);
    
    // 禁用右键菜单
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      return false;
    }, false);
    
    // 禁用双击最大化
    document.addEventListener('dblclick', (e) => {
      e.stopPropagation();
    }, true);
    
    // 禁用复制快捷键和Alt+F4关闭快捷键（除了在输入框中）
    document.addEventListener('keydown', (e) => {
      // 检查是否在可编辑元素中
      const isEditableElement = e.target.tagName === 'INPUT' ||
                               e.target.tagName === 'TEXTAREA' ||
                               e.target.contentEditable === 'true';

      // 禁用Alt+F4关闭窗口
      if (e.altKey && e.key === 'F4') {
        console.log('页面级别拦截Alt+F4');
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // 禁用Ctrl+A, Ctrl+C, Ctrl+V等复制相关快捷键（除了在输入框中）
      if (!isEditableElement && e.ctrlKey && (e.key === 'a' || e.key === 'c' || e.key === 'v' || e.key === 'x')) {
        e.preventDefault();
        return false;
      }

    });
    
    // 添加disable-select类到body
    document.body.classList.add('disable-select');
    
  `).catch(e => console.error('执行JavaScript错误:', e));
}

// 创建控制按钮HTML内容（保留用于悬浮控制窗口）
function createControlsHTML(): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Controls</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          background-color: rgba(0, 0, 0, 0.6);
          border-radius: 8px;
          overflow: hidden;
        }
        .controls {
          display: flex;
          padding: 10px;
          gap: 10px;
          justify-content: center;
        }
        .control-btn {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          position: relative;
        }
        .back-btn { background-color: #4a90e2; }
        .minimize-btn { background-color: #ffbd44; }
        .maximize-btn { background-color: #00ca56; }
        .close-btn { background-color: #ff605c; }
      </style>
    </head>
    <body>
      <div class="controls">
        <button class="control-btn back-btn" id="back"></button>
        <button class="control-btn minimize-btn" id="minimize"></button>
        <button class="control-btn maximize-btn" id="maximize"></button>
        <button class="control-btn close-btn" id="close"></button>
      </div>
      <script>
        const back = document.getElementById('back');
        const minimize = document.getElementById('minimize');
        const maximize = document.getElementById('maximize');
        const close = document.getElementById('close');

        if (window.electronAPI) {
          back.addEventListener('click', () => window.electronAPI.returnToLogin());
          minimize.addEventListener('click', () => window.electronAPI.minimizeWindow());
          maximize.addEventListener('click', () => window.electronAPI.maximizeWindow());
          close.addEventListener('click', () => window.electronAPI.closeWindow());
        }
      </script>
    </body>
    </html>
  `;
}


