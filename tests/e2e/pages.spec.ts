import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, type Page, test } from '@playwright/test';
import { type Locale, locales, toLocale } from '../../src/lib/i18n';
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

/** 前後の " を外す（YAML のクォートを使った値のため） */
const unquote = (value: string) => value.replace(/^"(.*)"$/, '$1');

/** career/{lang}.yaml の highlights: の各行（`  - ` の後ろ。前後の " は外す）を記述順に取り出す */
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
    if (itemMatch) highlights.push(unquote(itemMatch[1]));
  }
  return highlights;
}

type CertSummary = { date: string; name: string; group?: string };

/**
 * certifications: の区画から date / name / group を取り出す。
 * `  - date: "2025-10"` で 1 件が始まり、`    name: ...`（前後の " は外す）と `    group: ...` が続く。
 * 前提: 1 件は必ず `  - date:` の行で始まる（date を各項目の先頭のキーに書く）。`  - name:` で
 * 始まる項目は区切りとして認識されず、前の項目の name を上書きする
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
 * tagline はクォートなしの 1 行で書く前提
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
 * 代表ではない写真の slug（viewport.spec の verticalSlug と同じ写真）。代表写真に変わると
 * 「その写真から作られる」の検査の og:image がトップと同じになって落ちるので、気づける
 */
const nonFeaturedSlug = 'kariya-ferris-wheel';

const photosDir = fileURLToPath(new URL('../../src/content/photos', import.meta.url));

/**
 * 代表写真（`featured: true` の行を持つ YAML）の alt.en。alt の値は二重引用符で書く前提
 * （1 行の `{ ja: "…", en: "…" }` でも、複数行に分けた形でも読める）
 */
const featuredAltEn = (() => {
  const file = readdirSync(photosDir)
    .filter((name) => name.endsWith('.yaml') && !name.startsWith('.'))
    .find((name) => /^featured: true$/m.test(readFileSync(`${photosDir}/${name}`, 'utf8')));
  if (!file) throw new Error(`${photosDir} に代表写真が無い`);
  const match = readFileSync(`${photosDir}/${file}`, 'utf8').match(/^alt:[\s\S]*?\ben: "([^"]*)"/m);
  if (!match?.[1]) throw new Error(`${file} の alt.en が読めない`);
  return match[1];
})();

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
    // description はプロフィールの tagline（og:description との一致は「SNS 共有カード」の検査が見る）
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      parseProfileLine(toLocale(lang), 'tagline'),
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
  test(`/${lang}/ で名前の次に肩書が現れる`, async ({ page }) => {
    await page.goto(`./${lang}/`);
    const h1 = page.locator('main h1');
    await expect(h1).toHaveCount(1);
    const next = await h1.evaluate((el) => el.nextElementSibling?.textContent);
    expect(next).toBe(parseProfileLine(lang, 'tagline'));
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
    // 外部ホストの画像を直接参照してはならない（MUST NOT）ので、オリジンを固定する
    expect(new URL(ogImage ?? '').origin).toBe('https://joe-yama.github.io');
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
    // 代替テキストは代表写真の英語の alt（YAML の alt.en。ページ本文の代表写真の alt とも同じ）
    expect(topAlt).toBe(featuredAltEn);
    expect(topAlt).toBe(await page.locator('main .hero picture img').getAttribute('alt'));
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
      // 期間とグループ名（件数）は summary の外（li の 1 行目）にある
      const firstLine = await groupItems.evaluate((li) =>
        [...li.childNodes]
          .filter((node) => !(node instanceof Element && node.tagName === 'DETAILS'))
          .map((node) => node.textContent)
          .join(''),
      );
      expect(firstLine).toContain(period);
      expect(firstLine).toContain(ui[lang].certGroupCount(groupName, grouped.length));
      const summary = groupItems.locator('summary');
      await expect(summary).not.toContainText(period);
      await expect(summary).not.toContainText(ui[lang].certGroupCount(groupName, grouped.length));
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

  // --- 束ねた項目の行の見た目（design D9、PO 指示 2026-09-24） ---

  /**
   * 資格の区画の直下の li それぞれについて、1 行目（li の本文。details の外）の各行の先頭の
   * 文字の上端・左端・下端と、li の下端、束ねた項目の summary の box を測る。
   * 文字の位置は、空白でない文字を 1 文字ずつ Range で囲み、top が変わった文字を行の先頭とする
   */
  async function measureCertRows(page: Page, lang: Locale) {
    return certSection(page, lang)
      .locator(':scope > ul')
      .evaluate((ul) => {
        const lines = (li: Element) => {
          const result: { top: number; left: number; bottom: number }[] = [];
          let prevTop = Number.NEGATIVE_INFINITY;
          const walker = document.createTreeWalker(li, NodeFilter.SHOW_TEXT, {
            acceptNode: (node) =>
              node.parentElement?.closest('details')
                ? NodeFilter.FILTER_REJECT
                : NodeFilter.FILTER_ACCEPT,
          });
          for (let node = walker.nextNode(); node; node = walker.nextNode()) {
            const text = node.textContent ?? '';
            for (let i = 0; i < text.length; i++) {
              if (/\s/.test(text[i] ?? '')) continue;
              const range = document.createRange();
              range.setStart(node, i);
              range.setEnd(node, i + 1);
              const rect = range.getBoundingClientRect();
              if (rect.top > prevTop + 1) {
                result.push({ top: rect.top, left: rect.left, bottom: rect.bottom });
              }
              prevTop = Math.max(prevTop, rect.top);
            }
          }
          return result;
        };
        return [...ul.children].map((li) => {
          const summary = li.querySelector(':scope > details > summary');
          const s = summary?.getBoundingClientRect();
          const r = li.getBoundingClientRect();
          return {
            top: r.top,
            bottom: r.bottom,
            lines: lines(li),
            summary: s ? { top: s.top, left: s.left, text: summary?.textContent?.trim() } : null,
          };
        });
      });
  }

  test('1024 幅の /ja/career/ で資格の直下の li の 1 行目の上端の送りがそろう', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('./ja/career/');
    const rows = await measureCertRows(page, 'ja');
    expect(rows.length).toBeGreaterThan(2);
    expect(
      rows.findIndex((row) => row.summary !== null),
      '束ねた項目が先頭にあると、その前の行との送りを比べられない',
    ).toBeGreaterThan(0);
    // 前の li の下端から、次の li の 1 行目の文字の上端までの距離。複数行の li があっても比べられる
    const gaps = rows
      .slice(1)
      .map((row, i) => (row.lines[0]?.top ?? Number.NaN) - (rows[i]?.bottom ?? Number.NaN));
    const first = gaps[0] ?? Number.NaN;
    for (const [i, gap] of gaps.entries()) {
      expect(
        Math.abs(gap - first),
        `${i + 2} 番目の li の 1 行目の上端の送り ${gap} が先頭の送り ${first} とそろわない（${gaps.join(', ')}）`,
      ).toBeLessThanOrEqual(1);
    }
  });

  for (const lang of locales) {
    const groupedCount = parseCertifications(careerYaml(lang)).filter(
      (c) => c.group !== undefined,
    ).length;

    test(`1024 幅の /${lang}/career/ で束ねた項目の summary は 1 行目の下にあり、左端が日付の左端とそろう`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.goto(`./${lang}/career/`);
      const group = (await measureCertRows(page, lang)).find((row) => row.summary !== null);
      if (!group?.summary) throw new Error('束ねた項目が無い');
      const line1 = group.lines[0];
      if (!line1) throw new Error('束ねた項目の 1 行目の文字が無い');
      const lastLine = group.lines[group.lines.length - 1] ?? line1;
      expect(
        group.summary.top,
        `summary の上端 ${group.summary.top} が 1 行目の下端 ${lastLine.bottom} より上にある`,
      ).toBeGreaterThanOrEqual(lastLine.bottom - 1);
      expect(
        Math.abs(group.summary.left - line1.left),
        `summary の左端 ${group.summary.left} が 1 行目の文字の左端 ${line1.left} とそろわない`,
      ).toBeLessThanOrEqual(1);
      expect(group.summary.text).toBe(ui[lang].showAllCerts(groupedCount));
    });
  }

  test('1024 幅の /ja/career/ で束ねた項目の 1 行目から summary までの送りが、普通の行どうしの送りと同じ', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('./ja/career/');
    const rows = await measureCertRows(page, 'ja');
    const groupIndex = rows.findIndex((row) => row.summary !== null);
    const group = rows[groupIndex];
    const previous = rows[groupIndex - 1];
    if (!group?.summary || !previous) throw new Error('束ねた項目か、その前の行が無い');
    // 前の行（1 行の普通の資格）の上端から束ねた項目の上端までが、普通の行どうしの送り
    expect(previous.lines, '前の行が 1 行でないと送りの基準にならない').toHaveLength(1);
    const pitch = group.top - previous.top;
    const toSummary = group.summary.top - group.top;
    expect(
      Math.abs(toSummary - pitch),
      `1 行目の上端から summary の上端まで ${toSummary} が普通の行どうしの送り ${pitch} と違う`,
    ).toBeLessThanOrEqual(1);
  });

  test('390 幅の /en/career/ で束ねた項目の 1 行目が折り返したとき、2 行目の左端が 1 行目の文字の左端とそろう', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('./en/career/');
    const group = (await measureCertRows(page, 'en')).find((row) => row.summary !== null);
    const lines = group?.lines ?? [];
    // 折り返していないと 2 行目を比べられない（データが短くなったのに緑、を防ぐ）
    expect(lines.length, '1 行目が 390 幅で折り返していない').toBeGreaterThanOrEqual(2);
    const [line1, line2] = lines;
    expect(
      Math.abs((line2?.left ?? Number.NaN) - (line1?.left ?? Number.NaN)),
      `2 行目の左端 ${line2?.left} が 1 行目の文字の左端 ${line1?.left} とそろわない`,
    ).toBeLessThanOrEqual(1);
  });
});
