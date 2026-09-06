import { BrowserWindow } from 'electron';
import { baseWindowCSS, customScrollbarCSS, hiddenMouseCSS, hiddenScrollbarCSS, newWindowCSS } from '../shared/styles';
import { generateControlPanelScript } from '../shared/control-panel-generator';

// 注入控制脚本到webContents
export async function injectControlsScript(targetWindow: BrowserWindow, hiddenButtons: string[] = []): Promise<void> {
  if (targetWindow.isDestroyed() || targetWindow.webContents.isDestroyed()) return;

  try {
    const domReady = await targetWindow.webContents.executeJavaScript('Boolean(document?.body)');
    if (!domReady) {
      console.error('无法注入控制脚本：DOM未准备好');
      return;
    }
    const script = generateControlPanelScript(hiddenButtons);
    if (!script) return;
    await targetWindow.webContents.executeJavaScript(script);
  } catch (error) {
    console.error('注入控制脚本时出错:', error);
  }
}

// 注入基础样式和拖动区域
export function injectBaseStyles(targetWindow: BrowserWindow, hiddenButtons: string[] = []) {
  if (targetWindow.isDestroyed()) return;

  const scrollbarCSS = hiddenButtons.includes('scroll') ? hiddenScrollbarCSS : customScrollbarCSS;
  targetWindow.webContents.insertCSS(baseWindowCSS).catch(error => console.error('插入基础CSS错误:', error));
  targetWindow.webContents.insertCSS(scrollbarCSS).catch(error => console.error('插入滚动条CSS错误:', error));

  if (hiddenButtons.includes('mouse')) {
    targetWindow.webContents.insertCSS(hiddenMouseCSS).catch(error => console.error('插入隐藏鼠标CSS错误:', error));
  }

  targetWindow.webContents.executeJavaScript(`
    document.body.classList.add('disable-select');
    if (!document.querySelector('.drag-region')) {
      const dragRegion = document.createElement('div');
      dragRegion.className = 'drag-region';
      document.body.appendChild(dragRegion);
    }
    document.addEventListener('dblclick', (event) => {
      event.stopPropagation();
    }, true);
  `).catch(error => console.error('注入基础行为错误:', error));
}

// 为新窗口注入样式（包含更严格的文本选择禁用）
export function injectNewWindowStyles(targetWindow: BrowserWindow, hiddenButtons: string[] = []) {
  if (targetWindow.isDestroyed()) return;

  const scrollbarCSS = hiddenButtons.includes('scroll') ? hiddenScrollbarCSS : customScrollbarCSS;
  targetWindow.webContents.insertCSS(newWindowCSS).catch(error => console.error('插入新窗口CSS错误:', error));
  targetWindow.webContents.insertCSS(scrollbarCSS).catch(error => console.error('插入滚动条CSS错误:', error));

  if (hiddenButtons.includes('mouse')) {
    targetWindow.webContents.insertCSS(hiddenMouseCSS).catch(error => console.error('插入隐藏鼠标CSS错误:', error));
  }
}

// 为新窗口注入JavaScript行为
export function injectNewWindowBehaviors(targetWindow: BrowserWindow) {
  if (targetWindow.isDestroyed()) return;

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
