import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

// cwd（テスト実行時のカレントディレクトリ）に依存せず、このファイルの位置から
// リポジトリルート基準で dist を解決する。
const dist = fileURLToPath(new URL('../../dist', import.meta.url));
const base = '/portfolio/';

function htmlFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return htmlFiles(full);
    return full.endsWith('.html') ? [full] : [];
  });
}

/** `/portfolio/ja/career/` → `dist/ja/career/index.html` */
function resolveToDist(ref: string): string {
  const path = ref.split('#')[0]?.split('?')[0] ?? '';
  const relative = path.slice(base.length);
  const target = join(dist, relative);
  return path.endsWith('/') || relative === '' ? join(target, 'index.html') : target;
}

test('ビルド出力の内部参照がすべて解決する', () => {
  const files = htmlFiles(dist);
  expect(files.length).toBeGreaterThan(0);

  const missing: string[] = [];
  for (const file of files) {
    const html = readFileSync(file, 'utf8');
    const refs = [
      ...[...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((m) => m[1] ?? ''),
      ...[...html.matchAll(/srcset="([^"]+)"/g)].flatMap((m) =>
        (m[1] ?? '').split(',').map((part) => part.trim().split(/\s+/)[0] ?? ''),
      ),
      ...[...html.matchAll(/url\((['"]?)([^)'"]+)\1\)/g)].map((m) => m[2] ?? ''),
    ];
    for (const ref of refs) {
      if (!ref.startsWith('/')) continue;
      if (!ref.startsWith(base)) {
        missing.push(`${file}: ${ref}（接頭辞 ${base} が無い）`);
        continue;
      }
      if (!existsSync(resolveToDist(ref))) missing.push(`${file}: ${ref}`);
    }
  }
  expect(missing).toEqual([]);
});
