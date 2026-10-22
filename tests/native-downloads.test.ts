import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, symlink, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { findImageDownload, snapshotImageDownload } from '../src/native-downloads.js';

const expectedName = '蓝色方块与橙色小球.png';
const rejects = (promise: Promise<unknown>, code: string) => assert.rejects(promise, (error: any) => error.code === code);

test('existing images, partial downloads and foreign filenames are ignored', async t => {
  const root = await mkdtemp(join(tmpdir(), 'cwc-download-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(join(root, expectedName), 'existing');
  await writeFile(join(root, 'unrelated.png'), 'foreign');
  const snapshot = await snapshotImageDownload(root, expectedName);
  assert.deepEqual(snapshot.baselineNames, [expectedName]);
  assert(Number.isFinite(snapshot.capturedAt));
  await writeFile(join(root, `${expectedName}.crdownload`), 'partial');
  await writeFile(join(root, '蓝色方块与橙色小球 (1).png.crdownload'), 'partial');
  await writeFile(join(root, 'another-new.png'), 'foreign');
  assert.equal(await findImageDownload(snapshot), null);
});

test('a unique newly appeared Chrome collision filename is returned inside the root', async t => {
  const root = await mkdtemp(join(tmpdir(), 'cwc-download-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(join(root, expectedName), 'existing');
  const snapshot = await snapshotImageDownload(root, expectedName);
  const name = '蓝色方块与橙色小球 (1).png';
  await writeFile(join(root, name), 'new image');
  assert.deepEqual(await findImageDownload(snapshot), { path: join(root, name), directoryPath: root, name });
});

test('ambiguous new files, matching symlinks, symlink roots and unsafe names are rejected', async t => {
  const root = await mkdtemp(join(tmpdir(), 'cwc-download-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const snapshot = await snapshotImageDownload(root, expectedName);
  const collision = join(root, '蓝色方块与橙色小球 (1).png');
  await writeFile(join(root, expectedName), 'new');
  await writeFile(collision, 'second new');
  await rejects(findImageDownload(snapshot), 'NATIVE_DOWNLOAD_AMBIGUOUS');
  await unlink(collision);
  await symlink(join(root, expectedName), collision);
  await rejects(findImageDownload(snapshot), 'NATIVE_DOWNLOAD_SYMLINK');
  const linkedRoot = join(root, 'linked-root');
  await symlink(root, linkedRoot);
  await rejects(snapshotImageDownload(linkedRoot, expectedName), 'NATIVE_DOWNLOAD_ROOT');
  for (const name of ['../escape.png', 'folder\\escape.png', 'image.png.crdownload']) {
    await rejects(snapshotImageDownload(root, name), 'NATIVE_DOWNLOAD_NAME');
  }
});
