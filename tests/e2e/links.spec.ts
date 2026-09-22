import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import { cells, github, linkedin } from '../../src/lib/pixel';
import { homePath } from '../../src/lib/site';

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

test('ヘッダーロゴリンクに下線が無く、引き続きリンクとして機能する', async ({ page }) => {
  await page.goto('ja/');

  const logo = page.locator('.logo');
  await expect(logo).toHaveJSProperty('tagName', 'A');
  await expect(logo).toHaveAttribute('href', homePath('ja', base));

  const textDecorationLine = await logo.evaluate((el) => getComputedStyle(el).textDecorationLine);
  expect(textDecorationLine).toBe('none');
});

test('本文最下部はサイト内導線が先、連絡先リンクが最も下で、各リンクにドット絵アイコンが付く', async ({
  page,
}) => {
  await page.goto('ja/');

  const navLinks = page.locator('main nav.links a');
  const contactLinks = page.locator('main ul.links li a');

  await expect(navLinks).toHaveCount(3);
  await expect(contactLinks).toHaveCount(2);

  const navTop = await navLinks.first().evaluate((el) => el.getBoundingClientRect().top);
  const contactTop = await contactLinks.first().evaluate((el) => el.getBoundingClientRect().top);
  expect(navTop).toBeLessThan(contactTop);

  for (const locator of [navLinks, contactLinks]) {
    const count = await locator.count();
    for (let i = 0; i < count; i++) {
      const svg = locator.nth(i).locator('svg[aria-hidden="true"]');
      await expect(svg).toHaveCount(1);
      await expect(svg).toHaveAttribute('viewBox', '0 0 16 16');
    }
  }

  const githubLink = contactLinks.filter({ hasText: 'GitHub' });
  const linkedinLink = contactLinks.filter({ hasText: 'LinkedIn' });
  await expect(githubLink).toHaveCount(1);
  await expect(linkedinLink).toHaveCount(1);

  const githubRectCount = await githubLink.locator('svg rect').count();
  const linkedinRectCount = await linkedinLink.locator('svg rect').count();
  expect(githubRectCount).toBe(cells(github).length);
  expect(linkedinRectCount).toBe(cells(linkedin).length);
});

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
