import type { BrowserLoadError } from './types.mts';

const ERROR_MESSAGES: Readonly<Record<string, string>> = {
  ERR_NAME_NOT_RESOLVED: '找不到该网站的服务器，请检查地址是否拼写正确。',
  ERR_CONNECTION_CLOSED: '网站提前关闭了连接，请检查地址是否拼写正确，或稍后再试。',
  ERR_CONNECTION_RESET: '网站重置了连接，请检查网络或稍后再试。',
  ERR_CONNECTION_REFUSED: '网站拒绝了连接，请确认服务是否正在运行。',
  ERR_CONNECTION_TIMED_OUT: '连接网站超时，请检查网络或稍后再试。',
  ERR_TIMED_OUT: '连接网站超时，请检查网络或稍后再试。',
  ERR_INTERNET_DISCONNECTED: '当前设备没有可用的网络连接。'
};

export function getLoadErrorMessage(error: BrowserLoadError): string {
  if (error.description.startsWith('ERR_CERT_')) {
    return '无法建立安全连接，请检查网站证书或浏览器兼容模式。';
  }
  return ERROR_MESSAGES[error.description]
    ?? '页面暂时无法加载，请检查地址和网络连接后重试。';
}
