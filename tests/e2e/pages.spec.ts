import { expect, test } from '@playwright/test';

const locales = ['ja', 'en'] as const;
const slug = 'kariya-ferris-wheel';

/** 5 種類 × 2 言語。パスは baseURL からの相対（先頭スラッシュなし） */
const pagePaths = locales.flatMap((lang) => [
  `${lang}/`,
  `${lang}/photos/`,
  `${lang}/photos/${slug}/`,
  `${lang}/career/`,
]);

test('ルートは既定ロケールのトップへ遷移する', async ({ page }) => {
  await page.goto('./');
  await expect(page).toHaveURL(/\/portfolio\/ja\/$/);
});

for (const path of pagePaths) {
  const lang = path.slice(0, 2);

  test(`${path} が表示され lang と hreflang が正しい`, async ({ page }) => {
    const response = await page.goto(`./${path}`);
    expect(response?.status()).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('lang', lang);

    const alternates = page.locator('link[rel="alternate"][hreflang]');
    await expect(alternates).toHaveCount(3);
    for (const href of await alternates.evaluateAll((ls) =>
      ls.map((l) => l.getAttribute('href') ?? ''),
    )) {
      expect(href.startsWith('https://joe-yama.github.io/portfolio/')).toBe(true);
    }

    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveCount(1);
    await expect(canonical).toHaveAttribute('href', `https://joe-yama.github.io/portfolio/${path}`);
    await expect(page.locator('meta[name="description"]')).toHaveCount(1);
  });
}

test('404 ページが両言語への戻りリンクを持つ', async ({ page }) => {
  const response = await page.goto('./does-not-exist/');
  expect(response?.status()).toBe(404);
  await expect(page.locator('a[href$="/portfolio/ja/"]')).toHaveCount(1);
  await expect(page.locator('a[href$="/portfolio/en/"]')).toHaveCount(1);
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await expect(page.locator('meta[name="description"]')).toHaveCount(0);
});

test('言語切り替えは同じページの他言語版へ飛ぶ', async ({ page }) => {
  await page.goto('./ja/career/');
  await page.locator('header a[hreflang="en"]').click();
  await expect(page).toHaveURL(/\/portfolio\/en\/career\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('写真は picture として出力される', async ({ page }) => {
  await page.goto('./ja/photos/');
  await expect(page.locator('picture').first()).toBeVisible();
  const sources = page.locator('picture source');
  expect(await sources.count()).toBeGreaterThan(0);
});

test.describe('特許の区画', () => {
  const heading = { ja: '特許', en: 'Patents' } as const;

  for (const lang of locales) {
    test(`/${lang}/career/ に特許の見出しがある`, async ({ page }) => {
      await page.goto(`./${lang}/career/`);
      await expect(page.locator('h2', { hasText: heading[lang] })).toHaveCount(1);
    });
  }

  test('折りたたみを開く前は先頭 5 件だけ見えている', async ({ page }) => {
    await page.goto('./ja/career/');
    const section = page.locator('section', { has: page.locator('h2', { hasText: '特許' }) });
    const headItems = section.locator('> ul > li');
    await expect(headItems).toHaveCount(5);
    for (const li of await headItems.all()) {
      await expect(li).toBeVisible();
    }
  });

  test('summary をクリックすると残りが見え、総数が 51 件になる', async ({ page }) => {
    await page.goto('./ja/career/');
    const section = page.locator('section', { has: page.locator('h2', { hasText: '特許' }) });
    const summary = section.locator('summary');
    await expect(summary).toContainText('46');

    await summary.click();
    const allItems = section.locator('li');
    await expect(allItems).toHaveCount(51);
    for (const li of await allItems.all()) {
      await expect(li).toBeVisible();
    }
  });

  test('url を持つ項目の名称だけが Google Patents へのリンクになる', async ({ page }) => {
    await page.goto('./ja/career/');
    const section = page.locator('section', { has: page.locator('h2', { hasText: '特許' }) });
    await section.locator('summary').click();
    const links = section.locator('li a');
    expect(await links.count()).toBeGreaterThan(0);
    for (const href of await links.evaluateAll((ls) => ls.map((l) => l.getAttribute('href')))) {
      expect(href).toMatch(/^https:\/\/patents\.google\.com\/patent\//);
    }
  });
});
