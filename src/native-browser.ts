import { CwcError } from './errors.js';

export interface NativePageAsset {
  id: string;
  kind: string;
  name: string;
  url: string;
  sources?: unknown;
}

export interface NativeAssetInventory {
  id: string;
  assets: NativePageAsset[];
  pageUrl?: string;
}

export interface NativeExportedAsset extends NativePageAsset {
  path: string;
  contentType: string;
}

export interface NativeAssetBundle {
  assets: NativeExportedAsset[];
  failures: unknown[];
  directoryPath: string;
  manifestPath: string;
  summary: {
    downloadedCount: number;
    failedCount: number;
    requestedCount: number;
    elapsedMs: number;
  };
}

export interface NativeImageTab {
  capabilities: {
    get(name: 'pageAssets'): Promise<{
      list(): Promise<NativeAssetInventory>;
      bundle(options: { inventoryId: string; assetIds: string[] }): Promise<NativeAssetBundle>;
    }>;
  };
}

export interface ObservedImages {
  imageUrls: string[];
  baselineUrls?: string[];
  expectedCount: number;
}

// The caller must observe these exact URLs in the current turn's full-size UI.
// Exporting an asset does not establish original quality or validate its file.
export async function exportObservedImages(tab: NativeImageTab, options: ObservedImages) {
  if (!Number.isInteger(options.expectedCount) || options.expectedCount < 1) {
    throw new CwcError('NATIVE_IMAGE_COUNT', 'Expected image count must be a positive integer.');
  }
  if (options.imageUrls.some(url => typeof url !== 'string' || url.trim().length === 0)) {
    throw new CwcError('NATIVE_IMAGE_URL', 'Observed image URLs must be nonempty exact strings.');
  }
  const baseline = new Set(options.baselineUrls ?? []);
  const urls = [...new Set(options.imageUrls.filter(url => !baseline.has(url)))];
  if (urls.length !== options.expectedCount) {
    throw new CwcError('NATIVE_IMAGE_COUNT', 'Current-turn image URLs do not match the expected count.', {
      expectedCount: options.expectedCount, observedCount: urls.length,
    });
  }

  const pageAssets = await tab.capabilities.get('pageAssets');
  const inventory = await pageAssets.list();
  const selected = urls.map(url => {
    const matches = inventory.assets.filter(asset => asset.kind === 'image' && asset.url === url);
    if (matches.length !== 1 || !matches[0]!.id.trim()) {
      throw new CwcError('NATIVE_IMAGE_MATCH', 'Each observed URL must match exactly one inventory image.', {
        url, inventory,
      });
    }
    return matches[0]!;
  });
  const assetIds = selected.map(asset => asset.id);
  if (new Set(assetIds).size !== options.expectedCount) {
    throw new CwcError('NATIVE_IMAGE_MATCH', 'Observed images must have distinct inventory IDs.', { inventory });
  }

  const bundle = await pageAssets.bundle({ inventoryId: inventory.id, assetIds });
  const summary = bundle.summary;
  if (bundle.failures.length || summary.failedCount !== 0 ||
      summary.requestedCount !== options.expectedCount || summary.downloadedCount !== options.expectedCount ||
      bundle.assets.length !== options.expectedCount || !bundle.directoryPath.trim()) {
    throw new CwcError('NATIVE_IMAGE_EXPORT', 'Native image export was incomplete.', { inventory, bundle });
  }
  const assets = selected.map(selectedAsset => {
    const matches = bundle.assets.filter(asset => asset.id === selectedAsset.id);
    const asset = matches[0];
    if (matches.length !== 1 || !asset || asset.kind !== 'image' || asset.url !== selectedAsset.url ||
        !asset.path.trim() || !asset.contentType.trim()) {
      throw new CwcError('NATIVE_IMAGE_EXPORT', 'Native export did not return the exact requested image.', {
        inventory, bundle,
      });
    }
    return asset;
  });
  if (new Set(assets.map(asset => asset.path)).size !== options.expectedCount) {
    throw new CwcError('NATIVE_IMAGE_EXPORT', 'Native export returned duplicate image paths.', { inventory, bundle });
  }
  return { assets, directoryPath: bundle.directoryPath, manifestPath: bundle.manifestPath, inventory, bundle };
}
