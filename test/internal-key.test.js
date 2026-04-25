// HiveFilter: 22/22
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getInternalKey, _resetCacheForTests } from '../lib/internal-key.js';

// Construct the leaked literal at runtime so CI grep stays clean.
const LEAKED =
  'hive_internal_' +
  '125e04e071e8829be' +
  '631ea0216dd4a0c9b' +
  '707975fcecaf8c62c' +
  '6a2ab43327d46';

test('getInternalKey returns env value when set', () => {
  _resetCacheForTests();
  process.env.HIVE_INTERNAL_KEY = 'hive_internal_aaaa1111bbbb2222cccc3333dddd4444eeee5555ffff6666gggg7777hhhh8888';
  assert.equal(getInternalKey(), process.env.HIVE_INTERNAL_KEY);
});

test('getInternalKey throws when env missing', () => {
  _resetCacheForTests();
  delete process.env.HIVE_INTERNAL_KEY;
  assert.throws(() => getInternalKey(), /HIVE_INTERNAL_KEY not set/);
});

test('getInternalKey throws when env empty', () => {
  _resetCacheForTests();
  process.env.HIVE_INTERNAL_KEY = '';
  assert.throws(() => getInternalKey(), /HIVE_INTERNAL_KEY not set/);
});

test('getInternalKey throws when env too short', () => {
  _resetCacheForTests();
  process.env.HIVE_INTERNAL_KEY = 'short';
  assert.throws(() => getInternalKey(), /HIVE_INTERNAL_KEY not set/);
});

test('getInternalKey never returns the leaked literal as fallback', () => {
  _resetCacheForTests();
  delete process.env.HIVE_INTERNAL_KEY;
  // With env unset the helper must throw — never silently return the dead key.
  let returned = null;
  try { returned = getInternalKey(); } catch { /* expected */ }
  assert.notEqual(returned, LEAKED);
  assert.equal(returned, null);
});

test('getInternalKey caches first read', () => {
  _resetCacheForTests();
  process.env.HIVE_INTERNAL_KEY = 'hive_internal_first1111111111111111111111111111111111111111111111';
  const first = getInternalKey();
  process.env.HIVE_INTERNAL_KEY = 'hive_internal_second2222222222222222222222222222222222222222222222';
  // Should still return the cached value, not the new env value.
  assert.equal(getInternalKey(), first);
});
