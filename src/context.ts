import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { lstatSync, realpathSync, readFileSync, statSync } from 'node:fs';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { assert, CwcError } from './errors.js';
import type { Snapshot, SourceFile } from './types.js';

export const hash = (value: string | Uint8Array) => createHash('sha256').update(value).digest('hex');
const excluded = /(^|\/)(\.git|\.env(?:\..*)?|node_modules|\.venv|venv|dist|build|target|\.next|\.cwc|\.ssh|\.aws|\.codex|\.agents|\.cache|coverage)(\/|$)|(?:^|\/)(?:credentials|secrets?|auth)(?:\.[^/]*)?$|\.(?:pem|key|p12|pfx|keystore)$/i;
export function hasSecret(text: string): boolean {
  return /-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----|\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{24,}|\bAKIA[0-9A-Z]{16}\b|\bgh[pousr]_[A-Za-z0-9]{30,}|\bgithub_pat_[A-Za-z0-9_]{30,}|(?:api[_-]?key|access[_-]?token|client[_-]?secret|password)\s*[=:]\s*["'](?!example|placeholder|redacted|test|dummy|your[-_ ])[A-Za-z0-9_+\/.=-]{20,}["']/i.test(text);
}
export function inside(root: string, file: string) { const rel = relative(root, file); return rel === '' || (!rel.startsWith(`..${sep}`) && rel !== '..' && !isAbsolute(rel)); }
export function safePath(root: string, rel: string): string {
  assert(!isAbsolute(rel) && !rel.includes('\0') && !rel.split(/[\\/]/).includes('..'), 'PATH_OUTSIDE_WORKSPACE', 'Use a repository-relative path without traversal.');
  const normalized = rel.replaceAll('\\', '/');
  assert(!excluded.test(normalized), 'PATH_EXCLUDED', `Excluded path: ${normalized}`);
  const target = resolve(root, normalized);
  assert(inside(root, target), 'PATH_OUTSIDE_WORKSPACE', 'Path is outside the workspace.');
  if (lstatSync(target).isSymbolicLink()) throw new CwcError('SYMLINK_BLOCKED', `Symlink excluded: ${normalized}`);
  assert(inside(root, realpathSync(target)), 'PATH_OUTSIDE_WORKSPACE', 'Path resolves outside the workspace.');
  assert(statSync(target).isFile(), 'NOT_FILE', `Not a regular file: ${normalized}`);
  return target;
}
function git(root: string, args: string[], optional = false): string {
  try { return execFileSync('git', ['--literal-pathspecs', '-C', root, ...args], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, timeout: 20_000, stdio: ['ignore','pipe','pipe'], env: { ...process.env, GIT_OPTIONAL_LOCKS: '0' } }); }
  catch { if (optional) return ''; throw new CwcError('GIT_FAILED', `Cannot read repository state (${args[0]}).`); }
}
function list(root: string, args: string[]) { return git(root, args).split('\0').filter(Boolean); }
export interface ContextInput { root: string; scope?: Snapshot['scope']; files?: string[]; baseline?: string; maxBytes?: number }
export function snapshot(input: ContextInput): Snapshot {
  const root = realpathSync(input.root);
  assert(git(root, ['rev-parse','--show-toplevel']).trim() === root, 'REPO_ROOT_REQUIRED', 'Pass the git repository root.');
  const head = git(root, ['rev-parse','--verify','HEAD'], true).trim();
  let baseline = head;
  if (input.baseline) {
    assert(!input.baseline.startsWith('-') && /^[\w./~^{}@-]+$/.test(input.baseline), 'INVALID_BASELINE', 'Invalid revision.');
    baseline = git(root, ['rev-parse','--verify', `${input.baseline}^{commit}`]).trim();
  }
  const scope = input.scope ?? 'changes';
  const inventory = list(root, ['ls-files','-z','--cached','--others','--exclude-standard']);
  const changed = baseline ? list(root, ['diff','--name-only','-z','--no-renames',baseline,'--']) : inventory;
  const untracked = list(root, ['ls-files','-z','--others','--exclude-standard']);
  const requestedFiles = [...new Set(input.files ?? [])].sort();
  const selected = [...new Set(scope === 'repository' ? inventory : scope === 'files' ? requestedFiles : [...changed, ...untracked, ...requestedFiles])].sort();
  const files: SourceFile[] = []; const omitted: Snapshot['omitted'] = []; let bytes = 0;
  for (const path of selected) {
    try {
      const target = safePath(root, path);
      assert(statSync(target).size <= 1024 * 1024, 'FILE_TOO_LARGE', 'File exceeds 1 MiB.');
      const buffer = readFileSync(target);
      assert(!buffer.includes(0), 'BINARY_FILE', 'Binary file excluded.');
      const text = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
      assert(!hasSecret(text), 'SECRET_DETECTED', 'Secret-like content excluded.');
      bytes += buffer.length;
      assert(bytes <= (input.maxBytes ?? 4 * 1024 * 1024), 'CONTEXT_TOO_LARGE', 'Context exceeds limit. Select a narrower scope; nothing was silently truncated.');
      files.push({ path, text, sha256: hash(buffer), lines: text.split('\n').length });
    } catch (e) {
      if (e instanceof CwcError && e.code === 'CONTEXT_TOO_LARGE') throw e;
      omitted.push({ path, reason: e instanceof CwcError ? e.code : (e as NodeJS.ErrnoException).code === 'ENOENT' ? 'DELETED_OR_MISSING' : 'UNREADABLE' });
    }
  }
  // Deleted paths are included in the diff only after checking their old content.
  const deletedSafe = omitted.filter(x => x.reason === 'DELETED_OR_MISSING' && !excluded.test(x.path)).filter(x => {
    const old = baseline ? git(root, ['show',`${baseline}:${x.path}`], true) : '';
    return !hasSecret(old);
  }).map(x => x.path);
  const diffPaths = [...files.map(x => x.path), ...deletedSafe];
  const diff = baseline && diffPaths.length ? git(root, ['diff','--no-ext-diff','--no-textconv','--no-renames','--unified=5',baseline,'--', ...diffPaths]) : '';
  assert(!hasSecret(diff), 'SECRET_IN_DIFF', 'Diff contains secret-like material; narrow the review scope.');
  const fingerprint = hash(JSON.stringify({ head, baseline, inventory, files: files.map(({ path, sha256 }) => ({ path, sha256 })), diff, omitted }));
  return { id: hash(`${root}:${fingerprint}`), root, head, baseline, scope, requestedFiles, files, diff, omitted, fingerprint, maxBytes: input.maxBytes ?? 4 * 1024 * 1024,
    coverage: `${files.length} files included; ${omitted.length} omitted. Scope=${scope}; baseline=${baseline || 'unborn'}.` };
}
export function isStale(s: Snapshot): boolean {
  try { return snapshot({ root: s.root, scope: s.scope, files: s.requestedFiles, baseline: s.baseline || undefined, maxBytes: s.maxBytes }).fingerprint !== s.fingerprint; } catch { return true; }
}
export function bundle(s: Snapshot): string {
  const lines = ['# Repository review snapshot', `Snapshot: ${s.id}`, s.coverage, '', '## Diff', '```diff', s.diff, '```', '', '## Source files'];
  for (const file of s.files) {
    lines.push('', `### ${file.path}`, `SHA-256: ${file.sha256}`, '```text');
    file.bundleStart = lines.join('\n').split('\n').length + 1;
    lines.push(...file.text.split('\n').map((line, i) => `${i + 1}: ${line}`), '```');
  }
  lines.push('', '## Omissions', ...s.omitted.map(x => `${x.path}: ${x.reason}`));
  return lines.join('\n');
}
