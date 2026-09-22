import { readFileSync } from 'node:fs';
import { expect, type Page, test } from '@playwright/test';
import { ui } from '../../src/lib/site';

const locales = ['ja', 'en'] as const;
const slug = 'kariya-ferris-wheel';

type PatentSummary = { number: string; filedAt: string; countries: string[] };

/**
 * career/{lang}.yaml の patents: ブロックから number / filedAt / countries だけを雑に取り出す。
 * 件数と並び替えの検算専用なので本格的な YAML パーサーは要らない。
 * `yaml` パッケージは pnpm の直接依存に無く（astro の内部依存の phantom dependency）、
 * トップレベルから import できないため使わない
 */
function parsePatents(yamlPath: string): PatentSummary[] {
  const text = readFileSync(yamlPath, 'utf8');
  const patents: PatentSummary[] = [];
  let current: Partial<PatentSummary> | null = null;
  for (const line of text.split('\n')) {
    const numberMatch = line.match(/^ {2}- number: (.+)$/);
    if (numberMatch) {
      if (current) patents.push(current as PatentSummary);
      current = { number: numberMatch[1] };
      continue;
    }
    if (!current) continue;
    const filedAtMatch = line.match(/^ {4}filedAt: "?([0-9-]+)"?$/);
    if (filedAtMatch) current.filedAt = filedAtMatch[1];
    const countriesMatch = line.match(/^ {4}countries: \[(.+)\]$/);
    if (countriesMatch) current.countries = countriesMatch[1].split(',').map((s) => s.trim());
  }
  if (current) patents.push(current as PatentSummary);
  return patents;
}

/** src/lib/career.ts の sortPatents と同じ規則を、e2e から独立に計算する（design 5.1 (b)） */
function firstBySortOrder(patents: PatentSummary[]): PatentSummary {
  const first = [...patents].sort((a, b) => {
    const byCountryCount = b.countries.length - a.countries.length;
    if (byCountryCount !== 0) return byCountryCount;
    return b.filedAt.localeCompare(a.filedAt);
  })[0];
  if (!first) throw new Error('patents が空');
  return first;
}

/** src/lib/career.ts の formatMonth と同じ規則を、e2e から独立に計算する（YAML の filedAt から導く） */
function formatMonth(value: string, lang: 'ja' | 'en'): string {
  const [year, month] = value.split('-').map(Number);
  if (year === undefined || month === undefined) throw new Error(`日付の形式が違う: ${value}`);
  return new Intl.DateTimeFormat(lang, {
    year: 'numeric',
    month: lang === 'ja' ? 'long' : 'short',
  }).format(new Date(year, month - 1, 1));
}

const patentsByLang = {
  ja: parsePatents('src/content/career/ja.yaml'),
  en: parsePatents('src/content/career/en.yaml'),
};
/** 特許の一覧で、操作なしに見せる先頭の件数（spec。src/lib/career.ts の PATENTS_HEAD_COUNT と同じ値） */
const PATENTS_HEAD_COUNT = 5;
const patentsTotal = patentsByLang.ja.length;
const patentsRestCount = patentsTotal - PATENTS_HEAD_COUNT;
const expectedFirstNumber = firstBySortOrder(patentsByLang.ja).number;
const expectedFirstFiledAt = firstBySortOrder(patentsByLang.ja).filedAt;
const expectedFirstCountries = firstBySortOrder(patentsByLang.ja).countries;

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
    const hreflangHrefs = Object.fromEntries(
      await alternates.evaluateAll((ls) =>
        ls.map((l) => [l.getAttribute('hreflang') ?? '', l.getAttribute('href') ?? '']),
      ),
    );
    expect(hreflangHrefs.ja).toMatch(/^https:\/\/joe-yama\.github\.io\/portfolio\/ja\//);
    expect(hreflangHrefs.en).toMatch(/^https:\/\/joe-yama\.github\.io\/portfolio\/en\//);
    expect(hreflangHrefs['x-default']).toBe(hreflangHrefs.ja);

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

  function patentsSection(page: Page, lang: (typeof locales)[number]) {
    return page.locator('section', { has: page.locator('h2', { hasText: heading[lang] }) });
  }

  for (const lang of locales) {
    test(`/${lang}/career/ に特許の見出しがある`, async ({ page }) => {
      await page.goto(`./${lang}/career/`);
      await expect(page.locator('h2', { hasText: heading[lang] })).toHaveCount(1);
    });
  }

  for (const lang of locales) {
    test(`/${lang}/career/ では折りたたみを開く前は先頭 ${PATENTS_HEAD_COUNT} 件だけ見えている`, async ({
      page,
    }) => {
      await page.goto(`./${lang}/career/`);
      const section = patentsSection(page, lang);
      await expect(section.locator('li:visible')).toHaveCount(PATENTS_HEAD_COUNT);
      // <details> の中身は閉じていても DOM には存在する（レンダーされないだけ）。
      // ここで総数を確かめておくことで、次のテストの「開くと総数になる」と対になる
      await expect(section.locator('li')).toHaveCount(patentsTotal);
    });

    test(`/${lang}/career/ で summary をクリックすると残り ${patentsRestCount} 件が見え、総数が ${patentsTotal} 件になる`, async ({
      page,
    }) => {
      await page.goto(`./${lang}/career/`);
      const section = patentsSection(page, lang);
      const summary = section.locator('summary');
      await expect(summary).toContainText(String(patentsRestCount));

      await summary.click();
      await expect(section.locator('li:visible')).toHaveCount(patentsTotal);
    });
  }

  test('特許は出願国数が多い順、同数なら出願年月が新しい順に並ぶ', async ({ page }) => {
    await page.goto('./ja/career/');
    const section = patentsSection(page, 'ja');
    await expect(section.locator('li').first()).toContainText(expectedFirstNumber);
  });

  test('先頭の項目は出願年月（ロケール表記）と出願国を YAML の値のまま日本語で表示する', async ({
    page,
  }) => {
    await page.goto('./ja/career/');
    const section = patentsSection(page, 'ja');
    const li = section.locator('li').first();
    await expect(li).toContainText(formatMonth(expectedFirstFiledAt, 'ja'));
    await expect(li).toContainText(expectedFirstCountries.join(', '));
  });

  test('先頭の項目は出願年月（ロケール表記）と出願国を YAML の値のまま英語で表示する', async ({
    page,
  }) => {
    await page.goto('./en/career/');
    const section = patentsSection(page, 'en');
    const li = section.locator('li').first();
    await expect(li).toContainText(formatMonth(expectedFirstFiledAt, 'en'));
    await expect(li).toContainText(expectedFirstCountries.join(', '));
  });

  test('日本語ページと英語ページで特許のリンク先が異なる', async ({ page }) => {
    await page.goto('./ja/career/');
    const jaSection = patentsSection(page, 'ja');
    await jaSection.locator('summary').click();
    const jaHrefs = await jaSection
      .locator('li a')
      .evaluateAll((ls) => ls.map((l) => l.getAttribute('href') ?? ''));

    await page.goto('./en/career/');
    const enSection = patentsSection(page, 'en');
    await enSection.locator('summary').click();
    const enHrefs = await enSection
      .locator('li a')
      .evaluateAll((ls) => ls.map((l) => l.getAttribute('href') ?? ''));

    expect(jaHrefs.length).toBeGreaterThan(0);
    expect(jaHrefs.length).toBe(enHrefs.length);
    for (const href of jaHrefs) expect(href).toMatch(/\/ja$/);
    for (const href of enHrefs) expect(href).toMatch(/\/en$/);
    for (let i = 0; i < jaHrefs.length; i++) {
      expect(jaHrefs[i]).not.toBe(enHrefs[i]);
    }
  });

  test('url を持つ項目の名称だけが Google Patents へのリンクになる', async ({ page }) => {
    await page.goto('./ja/career/');
    const section = patentsSection(page, 'ja');
    await section.locator('summary').click();
    const links = section.locator('li a');
    expect(await links.count()).toBeGreaterThan(0);
    for (const href of await links.evaluateAll((ls) => ls.map((l) => l.getAttribute('href')))) {
      expect(href).toMatch(/^https:\/\/patents\.google\.com\/patent\//);
    }
  });
});

test.describe('経歴ページの区画', () => {
  for (const lang of locales) {
    test(`/${lang}/career/ の main section が 5 本で、見出しが careerSections と一致する`, async ({
      page,
    }) => {
      await page.goto(`./${lang}/career/`);
      const sections = page.locator('main section');
      await expect(sections).toHaveCount(5);
      const headings = await page.locator('main section h2').allTextContents();
      expect(headings).toEqual(Object.values(ui[lang].careerSections));
    });
  }
});

test.describe('資格のバッジ画像', () => {
  function certificationsSection(page: Page) {
    return page.locator('section', {
      has: page.locator('h2', { hasText: ui.ja.careerSections.certifications }),
    });
  }

  // tasks.md の対応表（AWS 認定資格 12 件）。logo を持つ
  const withLogo = [
    'AWS Certified AI Practitioner',
    'AWS Certified CloudOps Engineer - Associate',
    'AWS Certified Data Engineer - Associate',
    'AWS Certified Developer - Associate',
    'AWS Certified DevOps Engineer - Professional',
    'AWS Certified Machine Learning Engineer - Associate',
    'AWS Certified Advanced Networking - Specialty',
    'AWS Certified Security - Specialty',
    'AWS Certified Machine Learning - Specialty',
    'AWS Certified Cloud Practitioner',
    'AWS Certified Solutions Architect - Professional',
    'AWS Certified Solutions Architect - Associate',
  ] as const;
  // AWS 以外の資格。logo を持たない
  const withoutLogo = ['TOEIC Listening & Reading 900点', 'Licensed Scrum Master (Scrum Inc.)'];

  for (const name of withLogo) {
    test(`/ja/career/ の「${name}」にはバッジ画像（alt が資格名と一致）が現れる`, async ({
      page,
    }) => {
      await page.goto('./ja/career/');
      const section = certificationsSection(page);
      const item = section.locator('li', { hasText: name });
      await expect(item.locator('img')).toHaveCount(1);
      await expect(item.locator('img')).toHaveAttribute('alt', name);
    });
  }

  for (const name of withoutLogo) {
    test(`/ja/career/ の「${name}」にはバッジ画像が現れない`, async ({ page }) => {
      await page.goto('./ja/career/');
      const section = certificationsSection(page);
      const item = section.locator('li', { hasText: name });
      await expect(item.locator('img')).toHaveCount(0);
    });
  }
});
