import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, type Page, test } from '@playwright/test';
import { type Locale, locales, toLocale } from '../../src/lib/i18n';
import { photoIdFromEntry } from '../../src/lib/photo-meta';
import { ui } from '../../src/lib/site';
import { pagePaths } from './paths';

type PatentSummary = {
  number: string;
  filedAt: string;
  countries: string[];
  url: string;
  title: string;
};

/**
 * career/{lang}.yaml の patents: ブロックから number / filedAt / countries / url / title だけを
 * 雑に取り出す。件数・並び替え・リンクの検算専用なので本格的な YAML パーサーは要らない
 * （url と title はクォートなしで書く前提）。
 * `yaml` パッケージは pnpm の直接依存に無く（astro の内部依存の phantom dependency）、
 * トップレベルから import できないため使わない
 */
function parsePatents(yamlPath: string): PatentSummary[] {
  const text = readFileSync(yamlPath, 'utf8');
  const patents: PatentSummary[] = [];
  let current: Partial<PatentSummary> | null = null;
  let inPatents = false;
  for (const line of text.split('\n')) {
    // 行頭が空白でも # でもない行はトップレベルのキー。patents: の区画の中だけを読む
    // （行頭の YAML コメントでは区画を終えない。patentsX: のようなキーには一致させない）
    if (/^[^\s#]/.test(line)) {
      inPatents = /^patents:\s*$/.test(line);
      continue;
    }
    if (!inPatents) continue;
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
    const urlMatch = line.match(/^ {4}url: (.+)$/);
    if (urlMatch) current.url = urlMatch[1];
    const titleMatch = line.match(/^ {4}title: (.+)$/);
    if (titleMatch) current.title = titleMatch[1];
  }
  if (current) patents.push(current as PatentSummary);
  return patents;
}

/** src/lib/career.ts の sortPatents と同じ規則を、e2e から独立に計算する（design 5.1 (b)） */
function sortBySortOrder(patents: PatentSummary[]): PatentSummary[] {
  return [...patents].sort((a, b) => {
    const byCountryCount = b.countries.length - a.countries.length;
    if (byCountryCount !== 0) return byCountryCount;
    return b.filedAt.localeCompare(a.filedAt);
  });
}

/** src/lib/career.ts の formatMonth と同じ規則を、e2e から独立に計算する（YAML の filedAt から導く） */
function formatMonth(value: string, lang: Locale): string {
  const [year, month] = value.split('-').map(Number);
  if (year === undefined || month === undefined) throw new Error(`日付の形式が違う: ${value}`);
  return new Intl.DateTimeFormat(lang, {
    year: 'numeric',
    month: 'short',
  }).format(new Date(year, month - 1, 1));
}

/** career/{lang}.yaml の highlights: の各行（`  - ` の後ろ）を記述順に取り出す */
function parseHighlights(yamlPath: string): string[] {
  const text = readFileSync(yamlPath, 'utf8');
  const highlights: string[] = [];
  let inHighlights = false;
  for (const line of text.split('\n')) {
    // parsePatents と同じく、トップレベルのキーで区画を切り替える
    if (/^[^\s#]/.test(line)) {
      inHighlights = /^highlights:\s*$/.test(line);
      continue;
    }
    if (!inHighlights) continue;
    const itemMatch = line.match(/^ {2}- (.+)$/);
    if (itemMatch) highlights.push(itemMatch[1]);
  }
  return highlights;
}

type CertSummary = { date: string; name: string; group?: string };

/** 前後の " を外す（YAML のクォートを使った値のため） */
const unquote = (value: string) => value.replace(/^"(.*)"$/, '$1');

/**
 * certifications: の区画から date / name / group を取り出す。
 * `  - date: "2025-10"` で 1 件が始まり、`    name: ...`（前後の " は外す）と `    group: ...` が続く
 */
function parseCertifications(yamlPath: string): CertSummary[] {
  const text = readFileSync(yamlPath, 'utf8');
  const certs: CertSummary[] = [];
  let current: Partial<CertSummary> | null = null;
  let inCerts = false;
  for (const line of text.split('\n')) {
    if (/^[^\s#]/.test(line)) {
      inCerts = /^certifications:\s*$/.test(line);
      continue;
    }
    if (!inCerts) continue;
    const dateMatch = line.match(/^ {2}- date: "?([0-9-]+)"?$/);
    if (dateMatch) {
      if (current) certs.push(current as CertSummary);
      current = { date: dateMatch[1] };
      continue;
    }
    if (!current) continue;
    const nameMatch = line.match(/^ {4}name: (.+)$/);
    if (nameMatch) current.name = unquote(nameMatch[1]);
    const groupMatch = line.match(/^ {4}group: (.+)$/);
    if (groupMatch) current.group = unquote(groupMatch[1]);
  }
  if (current) certs.push(current as CertSummary);
  return certs;
}

/** cwd に依存せず、このファイルの位置からリポジトリの経歴データを読む */
const careerYaml = (lang: Locale) =>
  fileURLToPath(new URL(`../../src/content/career/${lang}.yaml`, import.meta.url));

/**
 * profile/{lang}.yaml のトップレベルの 1 行（`^<key>: (.+)$`）の値を取り出す。
 * headline と tagline はクォートなしの 1 行で書く前提
 */
function parseProfileLine(lang: Locale, key: string): string {
  const path = fileURLToPath(new URL(`../../src/content/profile/${lang}.yaml`, import.meta.url));
  const text = readFileSync(path, 'utf8');
  const pattern = new RegExp(`^${key}: (.+)$`);
  for (const line of text.split('\n')) {
    const match = line.match(pattern);
    if (match?.[1] !== undefined) return match[1];
  }
  throw new Error(`${path} に ${key}: の行が無い`);
}

/**
 * 代表ではない写真の slug。src/content/photos/*.yaml（ドットファイルを除く。paths.ts と同じ）のうち
 * `featured: true` の行を持たないものの先頭（ファイル名の順）
 */
const photosDir = fileURLToPath(new URL('../../src/content/photos', import.meta.url));
const nonFeaturedFile = readdirSync(photosDir)
  .filter((name) => name.endsWith('.yaml') && !name.startsWith('.'))
  .sort()
  .find((name) => !/^featured: true$/m.test(readFileSync(`${photosDir}/${name}`, 'utf8')));
if (!nonFeaturedFile) throw new Error(`${photosDir} に代表ではない写真が無い`);
const nonFeaturedSlug = photoIdFromEntry(nonFeaturedFile);

const patentsByLang: Record<Locale, PatentSummary[]> = {
  ja: parsePatents(careerYaml('ja')),
  en: parsePatents(careerYaml('en')),
};
const patents = patentsByLang.ja;
/** 特許の一覧で、操作なしに見せる先頭の件数（spec。src/lib/career.ts の PATENTS_HEAD_COUNT と同じ値） */
const PATENTS_HEAD_COUNT = 5;
const patentsTotal = patents.length;
const patentsRestCount = patentsTotal - PATENTS_HEAD_COUNT;
const expectedOrder = sortBySortOrder(patents);
const expectedFirst = expectedOrder[0];
if (!expectedFirst) throw new Error('patents が空');

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
    const rest = path.slice(3); // 'ja/career/' → 'career/'
    expect(hreflangHrefs).toEqual({
      ja: `https://joe-yama.github.io/portfolio/ja/${rest}`,
      en: `https://joe-yama.github.io/portfolio/en/${rest}`,
      'x-default': `https://joe-yama.github.io/portfolio/ja/${rest}`,
    });

    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveCount(1);
    await expect(canonical).toHaveAttribute('href', `https://joe-yama.github.io/portfolio/${path}`);
    await expect(page.locator('meta[name="description"]')).toHaveCount(1);
    // description は仕事の一行（og:description との一致は「SNS 共有カード」の検査が見る）
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      parseProfileLine(toLocale(lang), 'headline'),
    );

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

for (const lang of locales) {
  test(`/${lang}/ で名前の次に仕事の一行、その次に肩書が現れる`, async ({ page }) => {
    await page.goto(`./${lang}/`);
    const h1 = page.locator('main h1');
    await expect(h1).toHaveCount(1);
    const siblings = await h1.evaluate((el) => [
      el.nextElementSibling?.textContent,
      el.nextElementSibling?.nextElementSibling?.textContent,
    ]);
    expect(siblings).toEqual([
      parseProfileLine(lang, 'headline'),
      parseProfileLine(lang, 'tagline'),
    ]);
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
      if (canonical === null) throw new Error(`${path} に canonical が無い`);
      const title = await page.title();
      const description = await page.locator('meta[name="description"]').getAttribute('content');
      if (description === null) throw new Error(`${path} に description が無い`);

      await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', canonical);
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', title);
      await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
        'content',
        description,
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

  test('代表ではない写真の個別ページの共有カードは、その写真から作られる', async ({ page }) => {
    await page.goto('./ja/');
    const topImage = await page.locator('meta[property="og:image"]').getAttribute('content');
    await page.goto(`./ja/photos/${nonFeaturedSlug}/`);
    const og = page.locator('meta[property="og:image"]');
    const ogImage = await og.getAttribute('content');
    expect(ogImage).toBeTruthy();
    expect(ogImage).not.toBe(topImage);
    // 代替テキストはページ本文のその写真の alt と同じ（写真データの alt.ja）
    const alt = await page.locator('figure picture img').getAttribute('alt');
    await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute(
      'content',
      alt ?? '',
    );
    const response = await page.request.get(new URL(ogImage ?? '').pathname);
    expect(response.status()).toBe(200);
    // 画像そのものが 1200×630 であること（meta の値だけでなく実物を見る）
    const size = await page.evaluate(
      async (src) => {
        const img = new Image();
        img.src = src;
        await img.decode();
        return [img.naturalWidth, img.naturalHeight];
      },
      new URL(ogImage ?? '').pathname,
    );
    expect(size).toEqual([1200, 630]);
  });

  test('写真以外のページの共有カードは、トップと同じ代表写真から作られる', async ({ page }) => {
    await page.goto('./en/');
    const topImage = await page.locator('meta[property="og:image"]').getAttribute('content');
    const topAlt = await page.locator('meta[property="og:image:alt"]').getAttribute('content');
    for (const path of ['./en/career/', './en/photos/']) {
      await page.goto(path);
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
        'content',
        topImage ?? '',
      );
      await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute(
        'content',
        topAlt ?? '',
      );
    }
  });
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

  function patentsSection(page: Page, lang: Locale) {
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

  for (const lang of locales) {
    test(`/${lang}/career/ の特許リンクの href と文字列が YAML の url と title に一致する`, async ({
      page,
    }) => {
      await page.goto(`./${lang}/career/`);
      // PatentItem の <span> は 出願年月 / 公報番号 / 出願国 の順。2 つ目が公報番号
      const links = await patentsSection(page, lang)
        .locator('li')
        .evaluateAll((lis) =>
          lis.map((li) => ({
            number: li.querySelectorAll('span')[1]?.textContent?.trim() ?? '',
            href: li.querySelector('a')?.getAttribute('href') ?? '',
            title: li.querySelector('a')?.textContent?.trim() ?? '',
          })),
        );
      const expected = patentsByLang[lang].map(({ number, url, title }) => ({
        number,
        href: url,
        title,
      }));
      expect(links.toSorted((a, b) => a.number.localeCompare(b.number))).toEqual(
        expected.toSorted((a, b) => a.number.localeCompare(b.number)),
      );
    });
  }

  test('特許は出願国数が多い順、同数なら出願年月が新しい順に並ぶ', async ({ page }) => {
    // タイブレークを確かめられるデータであること（国数が同じで出願年月が違う組がある）
    const hasTie = patents.some((a) =>
      patents.some((b) => a.countries.length === b.countries.length && a.filedAt !== b.filedAt),
    );
    expect(hasTie, '国数が同じで出願年月が違う組が無いと、タイブレークを確かめられない').toBe(true);

    await page.goto('./ja/career/');
    const section = patentsSection(page, 'ja');
    // PatentItem の <span> は 出願年月 / 公報番号 / 出願国 の順。2 つ目が公報番号
    const numbers = await section
      .locator('li')
      .evaluateAll((lis) => lis.map((li) => li.querySelectorAll('span')[1]?.textContent?.trim()));
    expect(numbers).toEqual(expectedOrder.map((p) => p.number));
  });

  test('先頭の項目は出願年月（ロケール表記）と出願国を YAML の値のまま日本語で表示する', async ({
    page,
  }) => {
    await page.goto('./ja/career/');
    const section = patentsSection(page, 'ja');
    const li = section.locator('li').first();
    await expect(li).toContainText(formatMonth(expectedFirst.filedAt, 'ja'));
    await expect(li).toContainText(expectedFirst.countries.join(', '));
  });

  test('先頭の項目は出願年月（ロケール表記）と出願国を YAML の値のまま英語で表示する', async ({
    page,
  }) => {
    await page.goto('./en/career/');
    const section = patentsSection(page, 'en');
    const li = section.locator('li').first();
    await expect(li).toContainText(formatMonth(expectedFirst.filedAt, 'en'));
    await expect(li).toContainText(expectedFirst.countries.join(', '));
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

  test('すべての特許の見出しが Google Patents へのリンクになる', async ({ page }) => {
    await page.goto('./ja/career/');
    const section = patentsSection(page, 'ja');
    // <details> の中の項目も DOM にはあるので、開かずに全件を数えられる
    const hrefs = await section
      .locator('li a')
      .evaluateAll((ls) => ls.map((l) => l.getAttribute('href') ?? ''));
    expect(hrefs).toHaveLength(patentsTotal);
    for (const href of hrefs) expect(href).toMatch(/^https:\/\/patents\.google\.com\/patent\//);
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

test.describe('経歴ページの要約と資格の束ね', () => {
  function certSection(page: Page, lang: Locale) {
    return page.locator('section', {
      has: page.locator('h2', { hasText: ui[lang].careerSections.certifications }),
    });
  }

  /** 年月までの日付はその月の 1 日として比べる（src/lib/career.ts とは独立に計算する） */
  const sortKey = (date: string) => (date.split('-').length === 3 ? date : `${date}-01`);

  /** 資格の日付の表記（e2e から独立に計算する） */
  function formatCertDate(date: string, lang: Locale): string {
    const [year, month, day] = date.split('-').map(Number);
    if (year === undefined || month === undefined) throw new Error(`日付の形式が違う: ${date}`);
    return new Intl.DateTimeFormat(lang, {
      year: 'numeric',
      month: 'long',
      day: day === undefined ? undefined : 'numeric',
    }).format(new Date(year, month - 1, day ?? 1));
  }

  for (const lang of locales) {
    const highlights = parseHighlights(careerYaml(lang));
    const certs = parseCertifications(careerYaml(lang));
    const grouped = certs.filter((c) => c.group !== undefined);
    const ungroupedCount = certs.length - grouped.length;
    const groupName = grouped[0]?.group ?? '';
    // 新しい順（安定ソート）。期間は最古と最新から作る
    const groupedDesc = grouped.toSorted((a, b) => sortKey(b.date).localeCompare(sortKey(a.date)));
    const newest = groupedDesc[0]?.date ?? '';
    const oldest = groupedDesc[groupedDesc.length - 1]?.date ?? '';
    const newestText = formatCertDate(newest, lang);
    const oldestText = formatCertDate(oldest, lang);
    const period = newestText === oldestText ? newestText : `${oldestText} – ${newestText}`;

    test(`/${lang}/career/ の要約が Career と職歴の見出しのあいだに YAML の順で出る`, async ({
      page,
    }) => {
      expect(highlights.length).toBeGreaterThan(0);
      await page.goto(`./${lang}/career/`);
      const tags = await page
        .locator('main > *')
        .evaluateAll((els) => els.slice(0, 3).map((el) => el.tagName));
      expect(tags).toEqual(['H1', 'UL', 'SECTION']);
      await expect(page.locator('main > ul.highlights > li')).toHaveText(highlights);
      await expect(page.locator('main > ul.highlights + section > h2')).toHaveText(
        ui[lang].careerSections.experience,
      );
    });

    test(`/${lang}/career/ の資格の区画にグループの項目が 1 つだけあり、件数と期間を含む`, async ({
      page,
    }) => {
      // データが変わって束ねが空になったのに緑、を防ぐ
      expect(grouped).toHaveLength(12);
      expect(new Set(grouped.map((c) => c.group)).size).toBe(1);
      await page.goto(`./${lang}/career/`);
      const section = certSection(page, lang);
      const items = section.locator(':scope > ul > li');
      await expect(items).toHaveCount(ungroupedCount + 1);
      const groupItems = items.filter({ has: page.locator('details') });
      await expect(groupItems).toHaveCount(1);
      const summary = groupItems.locator('summary');
      await expect(summary).toContainText(period);
      await expect(summary).toContainText(ui[lang].certGroupCount(groupName, grouped.length));
    });

    test(`/${lang}/career/ で資格のグループの summary を押すと 12 件が新しい順に見える`, async ({
      page,
    }) => {
      await page.goto(`./${lang}/career/`);
      const details = certSection(page, lang).locator('details');
      await expect(details.locator('li:visible')).toHaveCount(0);
      await details.locator('summary').click();
      await expect(details.locator('li:visible')).toHaveCount(grouped.length);
      const names = await details
        .locator('li')
        .evaluateAll((lis) =>
          lis.map((li) => (li.querySelector('a') ?? li).textContent?.split(' · ').at(-1)?.trim()),
        );
      expect(names).toEqual(groupedDesc.map((c) => c.name));
    });
  }
});
