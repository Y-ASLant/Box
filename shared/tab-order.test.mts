import assert from 'node:assert/strict';
import test from 'node:test';
import { reorderIds } from './tab-order.mts';

test('reorderIds 将标签插入目标标签之前或之后', () => {
  const ids = ['tab-1', 'tab-2', 'tab-3'];

  assert.deepEqual(reorderIds(ids, 'tab-3', 'tab-1', 'before'), ['tab-3', 'tab-1', 'tab-2']);
  assert.deepEqual(reorderIds(ids, 'tab-1', 'tab-2', 'after'), ['tab-2', 'tab-1', 'tab-3']);
  assert.deepEqual(ids, ['tab-1', 'tab-2', 'tab-3']);
});

test('reorderIds 拒绝相同或不存在的标签', () => {
  const ids = ['tab-1', 'tab-2'];

  assert.equal(reorderIds(ids, 'tab-1', 'tab-1', 'before'), null);
  assert.equal(reorderIds(ids, 'missing', 'tab-1', 'before'), null);
  assert.equal(reorderIds(ids, 'tab-1', 'missing', 'after'), null);
});
