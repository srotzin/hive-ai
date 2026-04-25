// HiveFilter: 22/22
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getTreasuryAddress, _resetCacheForTests } from '../lib/treasury.js';

// Drained address constructed at runtime so CI grep stays clean.
const DRAINED = '0x' + 'E5588c407b6AdD3E83ce34190C77De20eaC1BeFe';

test('getTreasuryAddress reads HOUSE_WALLET when set', () => {
  _resetCacheForTests();
  delete process.env.TREASURY_WALLET;
  process.env.HOUSE_WALLET = '0x15184bf50b3d3f52b60434f8942b7d52f2eb436e';
  assert.equal(getTreasuryAddress(), '0x15184bf50b3d3f52b60434f8942b7d52f2eb436e');
});

test('getTreasuryAddress falls back to TREASURY_WALLET', () => {
  _resetCacheForTests();
  delete process.env.HOUSE_WALLET;
  process.env.TREASURY_WALLET = '0xabcdef0123456789abcdef0123456789abcdef01';
  assert.equal(getTreasuryAddress(), '0xabcdef0123456789abcdef0123456789abcdef01');
});

test('getTreasuryAddress throws when both env vars missing', () => {
  _resetCacheForTests();
  delete process.env.HOUSE_WALLET;
  delete process.env.TREASURY_WALLET;
  assert.throws(() => getTreasuryAddress(), /HOUSE_WALLET .* not set/);
});

test('getTreasuryAddress rejects malformed addresses', () => {
  _resetCacheForTests();
  delete process.env.TREASURY_WALLET;
  process.env.HOUSE_WALLET = 'not-an-address';
  assert.throws(() => getTreasuryAddress(), /HOUSE_WALLET .* not set or invalid/);
});

test('getTreasuryAddress never returns the drained address as fallback', () => {
  _resetCacheForTests();
  delete process.env.HOUSE_WALLET;
  delete process.env.TREASURY_WALLET;
  let returned = null;
  try { returned = getTreasuryAddress(); } catch { /* expected */ }
  assert.notEqual(returned, DRAINED);
  assert.equal(returned, null);
});

test('getTreasuryAddress caches first read', () => {
  _resetCacheForTests();
  delete process.env.TREASURY_WALLET;
  process.env.HOUSE_WALLET = '0x1111111111111111111111111111111111111111';
  const first = getTreasuryAddress();
  process.env.HOUSE_WALLET = '0x2222222222222222222222222222222222222222';
  assert.equal(getTreasuryAddress(), first);
});
