import assert from 'node:assert/strict';
import test from 'node:test';
import { isHttpUrl, normalizeHttpUrl } from './url.mts';

test('normalizeHttpUrl 为无协议地址补充 HTTP', () => {
  assert.equal(normalizeHttpUrl(' 192.168.1.10/path '), 'http://192.168.1.10/path');
  assert.equal(normalizeHttpUrl('https://example.com?q=1'), 'https://example.com/?q=1');
});

test('normalizeHttpUrl 拒绝空值、无效地址和非 HTTP(S) 协议', () => {
  assert.throws(() => normalizeHttpUrl(''));
  assert.throws(() => normalizeHttpUrl('not a valid host'));
  assert.throws(() => normalizeHttpUrl('ftp://example.com'));
});

test('isHttpUrl 只接受绝对 HTTP(S) 地址', () => {
  assert.equal(isHttpUrl('http://intranet.local/'), true);
  assert.equal(isHttpUrl('https://example.com/'), true);
  assert.equal(isHttpUrl('mailto:user@example.com'), false);
  assert.equal(isHttpUrl('example.com'), false);
});
