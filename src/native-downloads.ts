import { lstat, readdir } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { CwcError } from './errors.js';

export interface ImageDownloadSnapshot {
  directoryPath: string;
  expectedName: string;
  baselineNames: string[];
  capturedAt: number;
}

const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif', '.bmp', '.tif', '.tiff', '.heic', '.heif']);

function downloadNamePattern(expectedName: string) {
  const extension = extname(expectedName);
  if (!expectedName.trim() || /[\\/\0]/.test(expectedName) || !imageExtensions.has(extension.toLowerCase())) {
    throw new CwcError('NATIVE_DOWNLOAD_NAME', 'Expected download name must be an image basename without path separators.');
  }
  const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const stem = expectedName.slice(0, -extension.length);
  return new RegExp(`^${escape(stem)}(?: \\([1-9]\\d*\\))?${escape(extension)}$`);
}

async function matchingFiles(root: string, expectedName: string) {
  const pattern = downloadNamePattern(expectedName);
  const directoryPath = resolve(root);
  const directory = await lstat(directoryPath);
  if (directory.isSymbolicLink() || !directory.isDirectory()) {
    throw new CwcError('NATIVE_DOWNLOAD_ROOT', 'Download root must be an existing nonsymlink directory.');
  }
  const names: string[] = [];
  for (const name of await readdir(directoryPath)) {
    if (!pattern.test(name)) continue;
    const entry = await lstat(join(directoryPath, name));
    if (entry.isSymbolicLink()) {
      throw new CwcError('NATIVE_DOWNLOAD_SYMLINK', 'Matching download entries must not be symlinks.', { name });
    }
    if (entry.isFile()) names.push(name);
  }
  return { directoryPath, names };
}

// Call before the native download click. This records names only, not file content.
export async function snapshotImageDownload(root: string, expectedName: string): Promise<ImageDownloadSnapshot> {
  const { directoryPath, names } = await matchingFiles(root, expectedName);
  return { directoryPath, expectedName, baselineNames: names, capturedAt: Date.now() };
}

// One observation only; the caller controls any waiting and repeated observations.
export async function findImageDownload(snapshot: ImageDownloadSnapshot) {
  const { directoryPath, names } = await matchingFiles(snapshot.directoryPath, snapshot.expectedName);
  const baseline = new Set(snapshot.baselineNames);
  const candidates = names.filter(name => !baseline.has(name));
  if (candidates.length > 1) {
    throw new CwcError('NATIVE_DOWNLOAD_AMBIGUOUS', 'Multiple new matching downloads appeared; inspect them before importing.', {
      directoryPath, names: candidates,
    });
  }
  const name = candidates[0];
  return name ? { path: join(directoryPath, name), directoryPath, name } : null;
}
