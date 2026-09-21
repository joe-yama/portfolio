import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

const PUBLIC_PREFIX = 'https://joe-yama.github.io/portfolio/';

/** dist の下から index.html を探し、末尾スラッシュ付きの相対パスにして返す */
function builtPages(dir: string, prefix: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) return builtPages(join(dir, entry.name), `${prefix}${entry.name}/`);
    return entry.name === 'index.html' ? [prefix] : [];
  });
}

/** ビルド出力のうちロケール接頭辞を持つページ。サイトマップに載るべき集合 */
function expectedLocs(): string[] {
  return ['ja', 'en']
    .flatMap((lang) => builtPages(join('dist', lang), `${lang}/`))
    .map((path) => `${PUBLIC_PREFIX}${path}`);
}

test('サイトマップは XML として配信される', async ({ request }) => {
  const response = await request.get('./sitemap.xml');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('xml');
  expect(await response.text()).toContain(
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
  );
});

test('loc の集合がビルド出力のロケール配下ページと一致する', async ({ request }) => {
  const xml = await (await request.get('./sitemap.xml')).text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const expected = expectedLocs();

  expect(expected.length).toBeGreaterThan(0);
  expect(locs).toHaveLength(expected.length);
  expect(new Set(locs)).toEqual(new Set(expected));
});

test('振り分けページと 404 は載っていない', async ({ request }) => {
  const xml = await (await request.get('./sitemap.xml')).text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  expect(locs).not.toContain(PUBLIC_PREFIX);
  expect(locs.some((loc) => loc.includes('404'))).toBe(false);
});

test('すべての loc が 200 を返す', async ({ request }) => {
  const xml = await (await request.get('./sitemap.xml')).text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

  for (const loc of locs) {
    expect(loc.startsWith(PUBLIC_PREFIX)).toBe(true);
    const response = await request.get(`./${loc.slice(PUBLIC_PREFIX.length)}`);
    expect(response.status(), `${loc} が 200 を返さない`).toBe(200);
  }
});
