import type { Locator, Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

const locales = ['ja', 'en'] as const;
const viewports = [
  { width: 1280, height: 720 },
  { width: 1440, height: 900 },
];
/** 縦位置の写真。design.md D2 のプロトタイプ実測もこの写真（1248×1872）を使っている */
const verticalSlug = 'kariya-ferris-wheel';
/** サブピクセル丸めの分だけを許容する相対誤差（design.md D3） */
const tolerance = 0.01;

/** 指定セレクタに一致するすべての要素の下端が、画面の下端より上にあることを確認する */
async function assertBottomsWithinViewport(page: Page, selector: string, label: string) {
  const innerHeight = await page.evaluate(() => window.innerHeight);
  const locator = page.locator(selector);
  const count = await locator.count();
  expect(count, `${label}: 要素が見つからない（${selector}）`).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    const bottom = await locator.nth(i).evaluate((el) => el.getBoundingClientRect().bottom);
    expect(
      bottom,
      `${label}[${i}] の下端が画面外にはみ出している（bottom=${bottom.toFixed(1)}, innerHeight=${innerHeight}）`,
    ).toBeLessThanOrEqual(innerHeight);
  }
}

/** 画像の読み込み完了（naturalWidth > 0）を待つ。待たずに測ると naturalWidth が 0 になる */
async function waitForImageLoaded(locator: Locator) {
  await locator.evaluate((img) => {
    const el = img as HTMLImageElement;
    if (el.complete && el.naturalWidth > 0) return;
    return new Promise<void>((resolve) => {
      el.addEventListener('load', () => resolve(), { once: true });
    });
  });
}

/** 表示上の縦横比（getBoundingClientRect）が元画像の縦横比（naturalWidth/naturalHeight）と一致することを確認する */
async function assertDisplayRatioMatchesNatural(locator: Locator, label: string) {
  const measured = await locator.evaluate((img) => {
    const el = img as HTMLImageElement;
    const rect = el.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
      naturalWidth: el.naturalWidth,
      naturalHeight: el.naturalHeight,
    };
  });
  const displayRatio = measured.width / measured.height;
  const naturalRatio = measured.naturalWidth / measured.naturalHeight;
  const relativeError = Math.abs(displayRatio - naturalRatio) / naturalRatio;
  expect(
    relativeError,
    `${label}: 表示比 ${displayRatio.toFixed(3)}（${measured.width.toFixed(1)}x${measured.height.toFixed(1)}）が` +
      `元画像の比 ${naturalRatio.toFixed(3)}（${measured.naturalWidth}x${measured.naturalHeight}）と一致しない` +
      '（引き伸ばしまたは切り取りが疑われる）',
  ).toBeLessThanOrEqual(tolerance);
}

/** 横スクロールが発生していないことを確認する */
async function assertNoHorizontalScroll(page: Page, label: string) {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(
    scrollWidth,
    `${label}: 横スクロールが発生している（scrollWidth=${scrollWidth}, clientWidth=${clientWidth}）`,
  ).toBeLessThanOrEqual(clientWidth);
}

// --- 1.1 トップページの初見表示 ---------------------------------------------------------

for (const lang of locales) {
  for (const viewport of viewports) {
    test(`トップページの初見表示（${lang}, ${viewport.width}x${viewport.height}）`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto(`./${lang}/`);
      await waitForImageLoaded(page.locator('main .hero picture img'));

      await assertBottomsWithinViewport(page, 'main .hero picture img', '代表写真');
      await assertBottomsWithinViewport(page, 'main > h1', '名前');
      await assertBottomsWithinViewport(page, 'main > p.muted', '肩書');
      await assertBottomsWithinViewport(page, 'main ul.links li a', '連絡先リンク');
      await assertBottomsWithinViewport(page, 'main nav.links a', 'サイト内導線');
    });
  }
}

// --- 1.2 写真の個別ページの初見表示（縦位置） ---------------------------------------------

for (const lang of locales) {
  for (const viewport of viewports) {
    test(`写真の個別ページの初見表示（縦位置, ${lang}, ${viewport.width}x${viewport.height}）`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto(`./${lang}/photos/${verticalSlug}/`);
      await waitForImageLoaded(page.locator('figure picture img'));

      await assertBottomsWithinViewport(page, 'figure picture img', '写真');
      await assertBottomsWithinViewport(page, 'figcaption h1', 'タイトル');
      await assertBottomsWithinViewport(page, 'figcaption p.muted', '撮影地・撮影日');
      await assertBottomsWithinViewport(page, 'figcaption p.exif', '撮影情報');
    });
  }
}

// --- 1.3 回帰の番人（現状でも通るはず） --------------------------------------------------

test('回帰: 写真の表示比は元画像の縦横比と一致する（トップと個別ページ）', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });

  await page.goto('./ja/');
  const hero = page.locator('main .hero picture img');
  await waitForImageLoaded(hero);
  await assertDisplayRatioMatchesNatural(hero, 'トップの代表写真');

  await page.goto(`./ja/photos/${verticalSlug}/`);
  const figureImg = page.locator('figure picture img');
  await waitForImageLoaded(figureImg);
  await assertDisplayRatioMatchesNatural(figureImg, '個別ページの写真');
});

/**
 * ギャラリー一覧を開き、各サムネイルの表示幅がグリッドの列幅と一致することを確認する。
 *
 * 幅 1440px では `sizes`（`grid` 変種は `(min-width: 80rem) 20rem, ...`）が示す推定幅（320px）が
 * 実際の列幅（`minmax(280px, 1fr)` により約294px）を上回るため、`max-width: 100%` だけでも
 * ちょうど列幅に丸め込まれてしまい、`width: 100%` を外す変異（例: grid 変種にも `img.full` の
 * ルールを当てる）が検出できない（3.1(c) で実測して判明）。640〜1280px の中間幅では `sizes` が
 * `33vw` になり列幅（約320〜420px）を下回るため、`width: auto` の場合は明確に列幅より小さく
 * 表示され、この変異を確実に落とす。両方の幅で検査することで、番人の抜け穴を塞ぐ。
 */
async function assertThumbnailsFillColumns(page: Page, label: string) {
  await page.goto('./ja/photos/');

  const items = page.locator('ul.grid > li');
  const count = await items.count();
  expect(count, `${label}: ギャラリーに写真が無い`).toBeGreaterThan(0);

  for (let i = 0; i < count; i++) {
    const li = items.nth(i);
    const measured = await li.evaluate((liEl) => {
      const imgEl = liEl.querySelector('picture img');
      if (!imgEl) throw new Error('サムネイルの img が見つからない');
      return {
        columnWidth: liEl.getBoundingClientRect().width,
        imageWidth: imgEl.getBoundingClientRect().width,
      };
    });
    const relativeError =
      Math.abs(measured.imageWidth - measured.columnWidth) / measured.columnWidth;
    expect(
      relativeError,
      `${label} サムネイル[${i}]: 表示幅 ${measured.imageWidth.toFixed(1)} が列幅 ${measured.columnWidth.toFixed(1)} と一致しない`,
    ).toBeLessThanOrEqual(tolerance);
  }
}

test('回帰: ギャラリーのサムネイルの表示幅はグリッドの列幅と一致する', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await assertThumbnailsFillColumns(page, '1440x900');
});

test('回帰: ギャラリーのサムネイルの表示幅はグリッドの列幅と一致する（列幅が広がる中間幅でも）', async ({
  page,
}) => {
  await page.setViewportSize({ width: 800, height: 600 });
  await assertThumbnailsFillColumns(page, '800x600');
});

test('回帰: 390×844 で横スクロールが発生しない（トップと個別ページ）', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto('./ja/');
  await assertNoHorizontalScroll(page, 'トップページ');

  await page.goto(`./ja/photos/${verticalSlug}/`);
  await assertNoHorizontalScroll(page, '個別ページ');
});
