import assert from 'node:assert/strict';
import test from 'node:test';
import { getLoadErrorMessage } from './load-error.mts';

test('为常见网页加载错误提供明确提示', () => {
  assert.match(getLoadErrorMessage({
    code: -105,
    description: 'ERR_NAME_NOT_RESOLVED',
    url: 'https://missing.example/'
  }), /地址是否拼写正确/);
  assert.match(getLoadErrorMessage({
    code: -100,
    description: 'ERR_CONNECTION_CLOSED',
    url: 'https://closed.example/'
  }), /关闭了连接/);
  assert.match(getLoadErrorMessage({
    code: -202,
    description: 'ERR_CERT_AUTHORITY_INVALID',
    url: 'https://certificate.example/'
  }), /安全连接/);
});

test('未知加载错误使用通用恢复提示', () => {
  assert.match(getLoadErrorMessage({
    code: -2,
    description: 'ERR_FAILED',
    url: 'https://failed.example/'
  }), /检查地址和网络连接/);
});
