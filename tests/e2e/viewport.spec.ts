import type { Locator, Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { locales } from '../../src/lib/i18n';

const viewports = [
  { width: 1280, height: 720 },
  { width: 1440, height: 900 },
];
/**
 * 縦位置の写真。design.md D2 のプロトタイプ実測もこの写真（1248×1872）を使っている。
 * 縦位置かどうかは YAML に無いので slug の一覧から導けない
 */
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
  await expect
    .poll(() => locator.evaluate((img) => (img as HTMLImageElement).naturalWidth))
    .toBeGreaterThan(0);
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
    `${label}: 表示比 ${displayRatio.toFixed(3)}（${measured.width.toFixed(1)}x${measured.height.toFixed(1)}）が元画像の比 ${naturalRatio.toFixed(3)}（${measured.naturalWidth}x${measured.naturalHeight}）と一致しない（引き伸ばしまたは切り取りが疑われる）`,
  ).toBeLessThanOrEqual(tolerance);
}

/**
 * 写真の表示高さが下限（design.md D2 の `max(12rem, …)` の 12rem。px は root の font-size から
 * 求める）を下回らないことを確認する。
 * `max(12rem, …)` の下限だけを外す変異（`calc(…)` に置き換える等）は、1280×720 や 1440×900 のような
 * 通常の画面では常に `100svh - Nrem` が正の値になるため検出できない。画面の高さが極端に小さい
 * （1280×400）ときに限って下限が発動するため、この画面で検査する
 */
async function assertPhotoHeightAtLeastFloor(locator: Locator, label: string) {
  const height = await locator.evaluate((img) => img.getBoundingClientRect().height);
  const floorPx = await locator.evaluate(
    () => 12 * Number.parseFloat(getComputedStyle(document.documentElement).fontSize),
  );
  // 1280×400 では下限がちょうど発動するので等号ぎりぎりになる。サブピクセル丸めの分だけ緩める
  expect(
    height,
    `${label}: 写真の表示高さが下限（12rem=${floorPx}px）を下回っている（height=${height.toFixed(1)}）`,
  ).toBeGreaterThanOrEqual(floorPx - 0.5);
}

/**
 * 390×844（狭い画面）で、写真の表示幅が本文（`main` の content box）の幅と一致することを確認する。
 * spec `photo-pipeline` の Scenario「狭い画面」は「写真は本文の幅いっぱいに表示され」も要求しているが、
 * 従来の検査は横スクロールの有無しか見ていなかった
 */
async function assertPhotoFillsMainContentWidth(page: Page, selector: string, label: string) {
  const measured = await page.evaluate((sel) => {
    const main = document.querySelector('main');
    if (!main) throw new Error('main が見つからない');
    const style = getComputedStyle(main);
    const contentWidth =
      main.clientWidth -
      Number.parseFloat(style.paddingLeft) -
      Number.parseFloat(style.paddingRight);
    const img = document.querySelector(sel);
    if (!img) throw new Error(`写真の img が見つからない（${sel}）`);
    return { contentWidth, imageWidth: img.getBoundingClientRect().width };
  }, selector);
  const relativeError =
    Math.abs(measured.imageWidth - measured.contentWidth) / measured.contentWidth;
  expect(
    relativeError,
    `${label}: 写真の表示幅 ${measured.imageWidth.toFixed(1)} が本文の幅 ${measured.contentWidth.toFixed(1)} と一致しない`,
  ).toBeLessThanOrEqual(tolerance);
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

for (const lang of locales) {
  for (const viewport of [...viewports, { width: 390, height: 844 }]) {
    test(`回帰: 写真の表示比は元画像の縦横比と一致する（トップと個別ページ, ${lang}, ${viewport.width}x${viewport.height}）`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);

      await page.goto(`./${lang}/`);
      const hero = page.locator('main .hero picture img');
      await waitForImageLoaded(hero);
      await assertDisplayRatioMatchesNatural(hero, 'トップの代表写真');

      await page.goto(`./${lang}/photos/${verticalSlug}/`);
      const figureImg = page.locator('figure picture img');
      await waitForImageLoaded(figureImg);
      await assertDisplayRatioMatchesNatural(figureImg, '個別ページの写真');
    });
  }
}

test('回帰: 極端に低い画面でも写真の表示高さは0にならない（トップと個別ページ）', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 400 });

  await page.goto('./ja/');
  const hero = page.locator('main .hero picture img');
  await waitForImageLoaded(hero);
  await assertPhotoHeightAtLeastFloor(hero, 'トップの代表写真');

  await page.goto(`./ja/photos/${verticalSlug}/`);
  const figureImg = page.locator('figure picture img');
  await waitForImageLoaded(figureImg);
  await assertPhotoHeightAtLeastFloor(figureImg, '個別ページの写真');
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
  for (const [label, path] of [
    ['トップページ', './ja/'],
    ['個別ページ', `./ja/photos/${verticalSlug}/`],
  ] as const) {
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(
      overflow,
      `${label}: 横スクロールが発生している（scrollWidth − clientWidth）`,
    ).toBeLessThanOrEqual(0);
  }
});

test('回帰: 390×844 で写真は本文の幅いっぱいに表示される（トップと個別ページ）', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto('./ja/');
  await assertPhotoFillsMainContentWidth(page, 'main .hero picture img', 'トップの代表写真');

  await page.goto(`./ja/photos/${verticalSlug}/`);
  await assertPhotoFillsMainContentWidth(page, 'figure picture img', '個別ページの写真');
});
