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

    await expect(page.locator('meta[property^="og:"]')).toHaveCount(10);
    await expect(page.locator('meta[name^="twitter:"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute(
      'content',
      lang === 'ja' ? 'ja_JP' : 'en_US',
    );
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      'content',
      'summary_large_image',
    );
    await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute(
      'content',
      '1200',
    );
    await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute(
      'content',
      '630',
    );
  });
}

test('404 ページが両言語への戻りリンクを持つ', async ({ page }) => {
  const response = await page.goto('./does-not-exist/');
  expect(response?.status()).toBe(404);
  await expect(page.locator('a[href$="/portfolio/ja/"]')).toHaveCount(1);
  await expect(page.locator('a[href$="/portfolio/en/"]')).toHaveCount(1);
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await expect(page.locator('meta[name="description"]')).toHaveCount(0);
  await expect(page.locator('meta[property^="og:"]')).toHaveCount(0);
  await expect(page.locator('meta[name^="twitter:"]')).toHaveCount(0);
});

test.describe('SNS 共有カード', () => {
  const sharePaths = ['ja/', 'en/career/'] as const;

  for (const path of sharePaths) {
    test(`${path} の og:url / og:title / og:description が canonical / title / description と一致する`, async ({
      page,
    }) => {
      await page.goto(`./${path}`);
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      const title = await page.title();
      const description = await page.locator('meta[name="description"]').getAttribute('content');

      await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
        'content',
        canonical ?? '',
      );
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', title);
      await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
        'content',
        description ?? '',
      );
    });

    test(`${path} の og:image が同一オリジンで取得できる`, async ({ page }) => {
      await page.goto(`./${path}`);
      const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
      expect(ogImage).toBeTruthy();
      // 外部ホストの画像を直接参照してはならない（MUST NOT）ので、オリジンを固定する
      expect(new URL(ogImage ?? '').origin).toBe('https://joe-yama.github.io');
      // og:image は本番オリジンの絶対 URL。e2e は 127.0.0.1 のプレビューを見ているので、
      // パス部分だけを取り出して相対で取得する
      const imagePath = new URL(ogImage ?? '').pathname;
      const response = await page.request.get(imagePath);
      expect(response.status()).toBe(200);
    });
  }
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
