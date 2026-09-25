import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, type Locator, test } from '@playwright/test';
import { briefcase, type Cell, camera, cells, github, globe, linkedin } from '../../src/lib/pixel';
import { homePath } from '../../src/lib/site';
import { pagePaths } from './paths';

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

/** リンク内の svg rect の (x, y) 列を、描画順のまま取り出す */
function rectCells(link: Locator): Promise<Cell[]> {
  return link.locator('svg rect').evaluateAll((rects) =>
    rects.map((rect) => ({
      x: Number(rect.getAttribute('x')),
      y: Number(rect.getAttribute('y')),
    })),
  );
}

/**
 * サイト内導線の行き先 → アイコン（design D3）。並び順ではなく行き先で選ぶ。
 * /ja/photos/ では言語切り替えの href も /photos/ で終わるので、hreflang を持つものを除く。
 * 言語切り替えはリンクではなくまとまり（role=group）なので、expectLangSwitch で別に確かめる
 */
const navIconTable = [
  { name: 'Photos', selector: 'a[href$="/photos/"]:not([hreflang])', grid: camera },
  { name: 'Career', selector: 'a[href$="/career/"]:not([hreflang])', grid: briefcase },
] as const;

/** まとまりの名前（spec「言語切り替えのグループ名」） */
const groupName = { ja: '言語', en: 'Language' } as const;

/** path（baseURL からの相対）の他言語版の href。ページのパスは /<lang>/... の形 */
function alternateHref(path: string, target: 'ja' | 'en'): string {
  return `${base}${target}/${path.slice(3)}`;
}

/**
 * 言語切り替えのまとまり 1 つを確かめる（spec「表示中の言語はリンクにしない」「ナビのアイコン」ほか）。
 * scope はヘッダーか本文の導線。区切り線はヘッダーと本文で違うので呼び出し側で見る
 */
async function expectLangSwitch(scope: Locator, path: string): Promise<Locator> {
  const lang = path.startsWith('ja/') ? 'ja' : 'en';
  const other = lang === 'ja' ? 'en' : 'ja';
  const group = scope.getByRole('group', { name: groupName[lang], exact: true });
  await expect(group).toHaveCount(1);

  // 並びは JA / EN で固定（地球儀を除く直下の要素の文字）
  const texts = await group
    .locator(':scope > :not(svg)')
    .evaluateAll((els) => els.map((el) => el.textContent?.trim()));
  expect(texts).toEqual(['JA', '/', 'EN']);
  // 区切りの「/」は支援技術から隠す（design D2）
  await expect(group.locator(':scope > [aria-hidden="true"]:not(svg)')).toHaveText('/');

  // 表示中の項目: a ではなく、aria-current="true"、lang が自分、太字
  const current = group.locator(':scope > [aria-current]');
  await expect(current).toHaveCount(1);
  await expect(current).toHaveText(lang.toUpperCase());
  await expect(current).toHaveAttribute('aria-current', 'true');
  await expect(current).toHaveAttribute('lang', lang);
  await expect(current).not.toHaveJSProperty('tagName', 'A');
  const weight = await current.evaluate((el) => Number(getComputedStyle(el).fontWeight));
  expect(weight).toBeGreaterThanOrEqual(700);

  // もう一方: a で、hreflang と lang が相手、href が同じページの他言語版、aria-current なし
  const link = group.locator(':scope > a');
  await expect(link).toHaveCount(1);
  await expect(link).toHaveText(other.toUpperCase());
  await expect(link).toHaveAttribute('hreflang', other);
  await expect(link).toHaveAttribute('lang', other);
  await expect(link).toHaveAttribute('href', alternateHref(path, other));
  await expect(link).not.toHaveAttribute('aria-current');

  // 地球儀はまとまりの直下に 1 つだけで、項目の中には無い
  await expect(group.locator('svg')).toHaveCount(1);
  const globeSvg = group.locator(':scope > svg');
  await expect(globeSvg).toHaveCount(1);
  await expect(globeSvg).toHaveAttribute('aria-hidden', 'true');
  expect(await rectCells(group)).toEqual(cells(globe));
  return group;
}

/** 要素の computed の左の境界線の幅（px） */
function borderLeft(el: Locator): Promise<number> {
  return el.evaluate((e) => Number.parseFloat(getComputedStyle(e).borderLeftWidth));
}

test('ヘッダーロゴリンクに下線が無く、引き続きリンクとして機能する', async ({ page }) => {
  await page.goto('ja/');

  const logo = page.locator('.logo');
  await expect(logo).toHaveJSProperty('tagName', 'A');
  await expect(logo).toHaveAttribute('href', homePath('ja', base));

  const textDecorationLine = await logo.evaluate((el) => getComputedStyle(el).textDecorationLine);
  expect(textDecorationLine).toBe('none');
});

for (const path of pagePaths) {
  test(`${path} のヘッダーの導線に同じ行き先のドット絵が 1 つずつ付き、ロゴには無い`, async ({
    page,
  }) => {
    await page.goto(path);
    const nav = page.locator('header nav');
    await expect(nav.locator('a')).toHaveCount(3);
    for (const { name, selector, grid } of navIconTable) {
      const link = nav.locator(selector);
      await expect(link, name).toHaveCount(1);
      const svg = link.locator('svg');
      await expect(svg, name).toHaveCount(1);
      await expect(svg, name).toHaveAttribute('aria-hidden', 'true');
      expect(await rectCells(link), name).toEqual(cells(grid));
    }
    await expect(page.locator('header .logo svg')).toHaveCount(0);
    await expect(nav.locator(navIconTable[0].selector)).toHaveAccessibleName('Photos');
    await expect(nav.locator(navIconTable[1].selector)).toHaveAccessibleName('Career');
    await expectLangSwitch(page.locator('header'), path);
  });
}

for (const viewport of [
  { width: 1280, height: 720 },
  { width: 390, height: 844 },
]) {
  for (const path of ['ja/', 'en/']) {
    test(`${viewport.width}×${viewport.height} の ${path} でヘッダーの言語切り替えの左に区切り線がある`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto(path);
      const group = page.locator('header').getByRole('group');
      await expect(group).toHaveCount(1);
      expect(await borderLeft(group)).toBeGreaterThanOrEqual(1);
    });
  }
}

for (const viewport of [
  { width: 480, height: 844 },
  { width: 1280, height: 720 },
]) {
  test(`${viewport.width}×${viewport.height} でヘッダーのアイコン付きリンクが文字の行より高くならない`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto('ja/');
    const items = page.locator('header nav > *');
    await expect(items).toHaveCount(3);
    for (const item of await items.all()) {
      const { height, lineHeight } = await item.evaluate((el) => ({
        height: el.getBoundingClientRect().height,
        lineHeight: Number.parseFloat(getComputedStyle(el).lineHeight),
      }));
      expect(Number.isFinite(lineHeight)).toBe(true);
      expect(height).toBeLessThanOrEqual(lineHeight);
    }
  });
}

for (const { width, iconsVisible } of [
  { width: 390, iconsVisible: false },
  { width: 479, iconsVisible: false },
  { width: 480, iconsVisible: true },
]) {
  for (const path of pagePaths) {
    test(`${width}×844 の ${path} でヘッダーのアイコンは${iconsVisible ? '表示され' : '隠れ'}、ロゴとナビが同じ行に並ぶ`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(path);
      const icons = page.locator('header nav svg');
      await expect(icons).toHaveCount(3);
      for (const svg of await icons.all()) {
        if (iconsVisible) await expect(svg).toBeVisible();
        else await expect(svg).toBeHidden();
      }
      // 同じ行 = ナビの直下の各要素（Photos・Career・言語切り替え）の box がロゴの box と縦に重なる
      const logo = await page.locator('header .logo').boundingBox();
      if (!logo) throw new Error('ロゴが表示されていない');
      for (const item of await page.locator('header nav > *').all()) {
        const box = await item.boundingBox();
        if (!box) throw new Error('ナビの要素が表示されていない');
        expect(box.y).toBeLessThan(logo.y + logo.height);
        expect(box.y + box.height).toBeGreaterThan(logo.y);
      }
    });
  }
}

for (const path of ['ja/', 'en/', 'ja/career/', 'en/career/']) {
  test(`320×640 の ${path} でロゴ・Photos・Career・JA・EN が表示され、横スクロールが出ない`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto(path);
    const header = page.locator('header');
    await expect(header.locator('.logo')).toBeVisible();
    for (const name of ['Photos', 'Career']) {
      await expect(header.getByRole('link', { name, exact: true })).toBeVisible();
    }
    for (const text of ['JA', 'EN']) {
      await expect(header.getByRole('group').getByText(text, { exact: true })).toBeVisible();
    }
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

/**
 * 要素の最初の空でないテキストノードの文字のベースライン（viewport 基準の y）。
 * Range の矩形の上端は行の内容領域の上端（= ベースライン − ascent）なので、
 * その要素の計算済みフォントで測った fontBoundingBoxAscent を足す（design D2）
 */
function textBaseline(link: Locator): Promise<number> {
  return link.evaluate((el) => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node && !node.textContent?.trim()) node = walker.nextNode();
    if (!node) throw new Error('テキストが無い');
    const range = document.createRange();
    range.selectNodeContents(node);
    const top = range.getBoundingClientRect().top;
    const context = document.createElement('canvas').getContext('2d');
    if (!context) throw new Error('canvas が使えない');
    context.font = getComputedStyle(node.parentElement ?? el).font;
    return top + context.measureText('x').fontBoundingBoxAscent;
  });
}

for (const viewport of [
  { width: 1280, height: 720 },
  { width: 480, height: 844 },
]) {
  for (const path of ['ja/', 'en/']) {
    test(`${viewport.width}×${viewport.height} の ${path} でロゴとナビの文字のベースラインがそろう`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto(path);
      await page.evaluate(() => document.fonts.ready);
      const logo = await textBaseline(page.locator('header .logo'));
      // Photos・Career と、言語切り替えの JA・EN（spec「ロゴとナビの文字のベースラインがそろう」）
      const texts = page.locator(
        'header nav > a, header nav [role="group"] > a, header nav [role="group"] > [aria-current]',
      );
      await expect(texts).toHaveCount(4);
      for (const text of await texts.all()) {
        const name = await text.textContent();
        expect(Math.abs((await textBaseline(text)) - logo), name ?? '').toBeLessThanOrEqual(0.5);
      }
    });
  }
}

for (const { path, expected } of [
  {
    path: 'ja/career/',
    expected: [
      '/portfolio/ja/',
      '/portfolio/ja/photos/',
      '/portfolio/ja/career/',
      '/portfolio/en/career/',
    ],
  },
  {
    path: 'en/',
    expected: [
      '/portfolio/en/',
      '/portfolio/en/photos/',
      '/portfolio/en/career/',
      '/portfolio/ja/',
    ],
  },
]) {
  test(`${path} のヘッダーのリンクはロゴ → Photos → Career → 言語切り替えの順`, async ({
    page,
  }) => {
    await page.goto(path);
    const hrefs = await page
      .locator('header a')
      .evaluateAll((links) => links.map((a) => a.getAttribute('href')));
    expect(hrefs).toEqual(expected);
  });
}

for (const lang of ['ja', 'en'] as const) {
  test(`本文最下部はサイト内導線が先、連絡先リンクが最も下で、各導線にドット絵アイコンが付く（${lang}）`, async ({
    page,
  }) => {
    await page.goto(`${lang}/`);

    const nav = page.locator('main nav.links');
    const contactLinks = page.locator('main ul.links li a');
    await expect(nav.locator('a')).toHaveCount(2);
    await expect(contactLinks).toHaveCount(2);

    const navTop = await nav.evaluate((el) => el.getBoundingClientRect().top);
    const contactTop = await contactLinks.first().evaluate((el) => el.getBoundingClientRect().top);
    expect(navTop).toBeLessThan(contactTop);

    // 並びは Photos → Career の 2 つだけ。言語切り替えはヘッダーにだけ置く（PO 決定 2026-09-25）
    const order = await nav
      .locator(':scope > *')
      .evaluateAll((els) => els.map((el) => el.getAttribute('href')));
    expect(order).toEqual([`${base}${lang}/photos/`, `${base}${lang}/career/`]);
    await expect(nav.locator('[hreflang]')).toHaveCount(0);
    await expect(nav.locator('[role="group"]')).toHaveCount(0);

    for (const { name, selector, grid } of navIconTable) {
      const link = nav.locator(selector);
      await expect(link, name).toHaveCount(1);
      const svg = link.locator('svg[aria-hidden="true"]');
      await expect(svg, name).toHaveCount(1);
      await expect(svg, name).toHaveAttribute('viewBox', '0 0 16 16');
      expect(await rectCells(link), name).toEqual(cells(grid));
    }

    for (const link of await contactLinks.all()) {
      const svg = link.locator('svg[aria-hidden="true"]');
      await expect(svg).toHaveCount(1);
      await expect(svg).toHaveAttribute('viewBox', '0 0 16 16');
    }

    const githubLink = contactLinks.filter({ hasText: 'GitHub' });
    const linkedinLink = contactLinks.filter({ hasText: 'LinkedIn' });
    await expect(githubLink).toHaveCount(1);
    await expect(linkedinLink).toHaveCount(1);

    expect(await rectCells(githubLink)).toEqual(cells(github));
    expect(await rectCells(linkedinLink)).toEqual(cells(linkedin));
  });
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
