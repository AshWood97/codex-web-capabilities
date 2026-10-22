import test from 'node:test';
import assert from 'node:assert/strict';
import { exportObservedImages } from '../src/native-browser.js';
import type { NativeAssetBundle, NativeAssetInventory, NativeImageTab, NativePageAsset } from '../src/native-browser.js';

const current = 'https://images.example.invalid/current.png';
const second = 'https://images.example.invalid/second.png';
const old = 'https://images.example.invalid/old.png';
const foreign = 'https://images.example.invalid/foreign.png';
const image = (id: string, url: string): NativePageAsset => ({ id, kind: 'image', name: `${id}.png`, url });
const inventory: NativeAssetInventory = {
  id: 'inventory-1', pageUrl: 'https://chatgpt.com/c/current',
  assets: [image('old', old), image('foreign', foreign), image('current', current), image('second', second)],
};
function bundleFor(assets: NativePageAsset[]): NativeAssetBundle {
  return {
    assets: assets.map(asset => ({ ...asset, path: `/native-export/${asset.id}.png`, contentType: 'image/png' })),
    failures: [], directoryPath: '/native-export', manifestPath: '/native-export/manifest.json',
    summary: { downloadedCount: assets.length, failedCount: 0, requestedCount: assets.length, elapsedMs: 1 },
  };
}
function nativeTab(listed: NativeAssetInventory, exported: NativeAssetBundle) {
  const calls: { inventoryId: string; assetIds: string[] }[] = [];
  let listedCount = 0;
  const tab: NativeImageTab = { capabilities: { get: async name => {
    assert.equal(name, 'pageAssets');
    return {
      list: async () => { listedCount++; return listed; },
      bundle: async options => { calls.push(options); return exported; },
    };
  } } };
  return { tab, calls, get listedCount() { return listedCount; } };
}
const rejects = (promise: Promise<unknown>, code: string) => assert.rejects(promise, (error: any) => error.code === code);

test('stale, duplicate and empty observed URLs cannot satisfy the expected count', async () => {
  const native = nativeTab(inventory, bundleFor([]));
  await rejects(exportObservedImages(native.tab, { imageUrls: [old], baselineUrls: [old], expectedCount: 1 }), 'NATIVE_IMAGE_COUNT');
  await rejects(exportObservedImages(native.tab, { imageUrls: [current, current], expectedCount: 2 }), 'NATIVE_IMAGE_COUNT');
  await rejects(exportObservedImages(native.tab, { imageUrls: [' '], expectedCount: 1 }), 'NATIVE_IMAGE_URL');
  assert.equal(native.listedCount, 0);
  assert.deepEqual(native.calls, []);
});

test('foreign images and source URLs cannot stand in for an exact observed image', async () => {
  const listed = { ...inventory, assets: [image('foreign', foreign), { ...image('source-only', foreign), sources: [current] }] };
  const native = nativeTab(listed, bundleFor([image('foreign', foreign)]));
  await rejects(exportObservedImages(native.tab, { imageUrls: [current], expectedCount: 1 }), 'NATIVE_IMAGE_MATCH');
  assert.deepEqual(native.calls, []);
});

test('partial bundles and missing or substituted requested assets are rejected', async () => {
  const requested = image('current', current);
  const complete = bundleFor([requested]);
  const partial: NativeAssetBundle = {
    ...complete, assets: [], failures: [{ id: requested.id, error: 'download failed' }],
    summary: { ...complete.summary, downloadedCount: 0, failedCount: 1 },
  };
  for (const exported of [
    partial,
    { ...complete, assets: [] },
    bundleFor([image('foreign', foreign)]),
    bundleFor([{ ...requested, url: foreign }]),
  ]) {
    const native = nativeTab(inventory, exported);
    await rejects(exportObservedImages(native.tab, { imageUrls: [current], expectedCount: 1 }), 'NATIVE_IMAGE_EXPORT');
    assert.deepEqual(native.calls, [{ inventoryId: inventory.id, assetIds: ['current'] }]);
  }
});

test('exports only exact new image IDs and preserves native metadata without a quality claim', async () => {
  const exported = bundleFor([image('current', current), image('second', second)]);
  const native = nativeTab(inventory, exported);
  const result = await exportObservedImages(native.tab, {
    imageUrls: [second, old, current, current], baselineUrls: [old], expectedCount: 2,
  });
  assert.deepEqual(native.calls, [{ inventoryId: inventory.id, assetIds: ['second', 'current'] }]);
  assert.deepEqual(result.assets.map(asset => ({ id: asset.id, path: asset.path, contentType: asset.contentType })), [
    { id: 'second', path: '/native-export/second.png', contentType: 'image/png' },
    { id: 'current', path: '/native-export/current.png', contentType: 'image/png' },
  ]);
  assert.equal(result.directoryPath, exported.directoryPath);
  assert.equal(result.manifestPath, exported.manifestPath);
  assert.equal(result.inventory, inventory);
  assert.equal(result.bundle, exported);
  assert.equal('original' in result.assets[0]!, false);
});
