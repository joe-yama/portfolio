# Proposal

## Why

サイトは 12 ページそろったが、公開されていない。GitHub Pages のプロジェクトサイト `https://joe-yama.github.io/portfolio/` で配信するには `base: '/portfolio'` が要る。ところが `base` を入れると **ビルド・lint・型検査・単体テストがすべて通ったまま静かに壊れる**（`dist` を検査するテストが無いため）。実測で確認した壊れ方は下の「What Changes」のとおり。加えて、`.astro` の描画を守るテストが 1 本も無く、リンク切れも検出できない。公開と同時に、この 2 つの穴を塞ぐ。

## What Changes

### 1. `base: '/portfolio'` への対応

`astro.config.ts` に `base: '/portfolio'` を入れたときの実測（2026-09-21、Astro 7.3.2）:

| 箇所 | base 有りでの実値 | 結果 |
|---|---|---|
| `import.meta.env.BASE_URL` | `/portfolio/`（末尾スラッシュ付き） | — |
| `Astro.url.pathname` | `/portfolio/en/career/`（base 込み） | `localeFromPath` が `null` を返す |
| `dist` の構造 | `dist/{ja,en}/...`（`dist/portfolio/` にはならない） | — |
| `/en/` の `<html lang>` | `ja` | **壊れる** |
| hreflang の本数 | 0 本 | **壊れる** |
| ヘッダー・ナビ・カード・前後リンクの `href` | `/ja/career/`（base なし） | **404 になる** |
| 言語切り替えの `href` | `/en/portfolio/en/career/` | **壊れる** |
| `<link rel="icon">` | `/favicon.svg` | **404 になる** |
| `/` のリダイレクト先 | `/ja/` | **404 になる** |
| 404 ページの戻りリンク | `/ja/` `/en/` | **404 になる** |

- ロケール判定を `base` に依存しないようにする（パスから base を剥がしてから先頭セグメントを見る）
- サイト内リンクのパスを組む処理を 1 箇所に集め、`base` を前置する。`.astro` に `/` 始まりの `href` を直書きしない

### 2. e2e（Playwright + axe）

`pnpm e2e` を追加する。ビルド済みの `dist/` を `pnpm preview` で配信し、Chromium 1 種類で次を検査する: 5 種類 × 2 言語のページ表示、`<picture>` の出力、言語切り替えが対応ページへ飛ぶ、アクセシビリティ違反なし、`<html lang>` と hreflang 3 本、外部ドメインへのリクエストが無いこと。

### 3. ビルド後 HTML の内部リンク検査

`dist/` を走査し、同一オリジンの `href` / `src` / `srcset` の参照がすべて `dist/` 内のファイルに解決することを確認する。

### 4. GitHub Pages への自動デプロイ

`main` への push で GitHub Actions がビルドして Pages に公開する。CI に e2e を足す。

含めないもの: 独自ドメイン（`public/CNAME`）、視覚回帰、Lighthouse、PR プレビュー、sitemap / robots、画像キャッシュ、Change 3・4 の提案の消化（axe の違反として実測で出たものを除く）。

## Capabilities

### New Capabilities

- `deployment`: `main` への push で GitHub Pages に公開されること、公開 URL の形、デプロイ workflow の権限と同時実行の制約

### Modified Capabilities

- `i18n-routing`: ロケール判定とサイト内リンクが公開時のパス接頭辞（`base`）の下でも成り立つこと
- `quality-gates`: e2e（`pnpm e2e`）と内部リンク検査を検証コマンドと CI に加えること

## Impact

- 変更: `astro.config.ts`（`base`）、`src/lib/i18n.ts`（base を剥がすロケール判定）、`src/lib/site.ts`（リンクのパス生成）、`src/components/Header.astro`、`src/layouts/BaseLayout.astro`、`src/pages/index.astro`、`src/pages/404.astro`、`src/pages/[lang]/index.astro`、`src/pages/[lang]/career.astro`、`src/pages/[lang]/photos/index.astro`、`src/pages/[lang]/photos/[slug].astro`、`.github/workflows/ci.yml`、`package.json`、`tests/unit/{i18n,site}.test.ts`
- 追加: `playwright.config.ts`、`tests/e2e/*.spec.ts`、`.github/workflows/deploy.yml`
- 依存の追加: `@playwright/test`、`@axe-core/playwright`（設計書 §9 で承認済み。これ以外は追加しない）
- 公開 URL が `https://joe-yama.github.io/portfolio/` になる（PO 決定 2026-09-21。独自ドメインは後続の change）
