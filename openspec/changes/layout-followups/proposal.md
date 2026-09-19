# Proposal

## Why

Change 2 `layout-shell`（PR #4）の独立レビューと PO のモック確認で、マージを止めないが放置すると Change 3（写真）・Change 4（経歴）に積み重なる指摘が残った。PO 判断が要る点（フォントの配信形、見た目の細部）と、決定不要の小さな整理（テストの強化、部品の責務、favicon）をまとめて 1 つの change で片付け、以降のページ実装をきれいな土台の上で進める。

## What Changes

### PO 判断が要るもの（design の Open Questions。実装前に決める）

- **フォント CSS の配信形**: Astro の `<Font>` は `@font-face` 123 件（約 95 KB、gzip 32 KB）を全ページの HTML にインライン出力する。現状維持か、`<Font>` をやめて `@font-face` を外部 CSS ファイル（キャッシュ可能）にするかを決める
- **見た目の Minor 5 件**: (1) 罫線 `--line` の対背景コントラスト 1.4:1（非テキストの 3:1 未満）、(2) フッターが `font-size: 0.875rem` + `<small>` で実効 11px、(3) ヘッダーのリンクが静止時に下線なし・色 inherit で本文と区別しにくい、(4) 404 の文言（ドット文字）とリンク（システムフォント）が 1 文の中で混在、(5) 404 の 1280px でドット絵と文言が左上に寄り右下が空く。それぞれ「直す / 現状維持」を決める
- **`BaseLayout` の `lang` prop**: 現在はページが `lang` を渡し、パスからも `localeFromPath` で判定しているため同じ事実の出どころが 2 つ。`lang` を URL から導出して props を消す（design D1 の変更）か、現状維持か

### 決定不要の整理

- `tests/unit/site.test.ts` に接頭辞なしパス（`/`）の `alternateLinks` ケースを足す
- `tests/unit/pixel.test.ts` に反転データ（`.` と `#` の取り違え）を検知する `cells(rows).length < 256` の assert を足す
- `PixelArt.astro` の幅算出（最長行）を `src/lib/pixel.ts` の関数に出して単体テストする
- `PixelArt.astro` の `margin-bottom` を呼び出し側（トップ / 404）へ移す
- `Header.astro` の `<nav>` の表示条件を `sw &&` から `showNav &&` に戻し、`sw` の有無は `<nav>` の内側で扱う
- `tsconfig.json` に `noUnusedLocals` を足して `astro check` が `.astro` の未使用 import を拾えるか試し、拾えれば有効化する（Biome が `.astro` を解析できないための穴埋め）
- **favicon**: `/favicon.ico` が 404 でブラウザのコンソールにエラーが出る。ドット絵の SVG favicon（`/favicon.svg`、外部参照なし）を追加する。唯一の spec 追加

含めないもの: `/ja/career/` `/en/career/` の実ページによる hreflang / ヘッダーの spec 再検証と `h1` の左端ずれ（DotGothic16 のサイドベアリング）は Change 4 `profile-and-career` で扱う。写真ページ・ギャラリーは Change 3。ハーネス（reviewer の Playwright MCP）は `harness-ui-review`。

## Capabilities

### New Capabilities

（なし）

### Modified Capabilities

- `layout-shell`: favicon の要求を追加する（全ページが同一オリジンの SVG favicon を参照し、`/favicon.svg` がビルド出力に含まれる）。フォント配信・配色・ヘッダーの既存要求は変えない（配信形の変更は実装の内側）

## Impact

- 変更候補: `src/layouts/BaseLayout.astro`（favicon の `<link>`、`lang` 導出、`<Font>` の扱い）、`src/components/Header.astro`、`src/components/Footer.astro`、`src/components/pixel/PixelArt.astro`、`src/lib/pixel.ts`、`src/styles/global.css`、`src/pages/404.astro`、`src/pages/[lang]/index.astro`、`tsconfig.json`、`tests/unit/site.test.ts`、`tests/unit/pixel.test.ts`
- 新規: `public/favicon.svg`（または `src/pages/favicon.svg.ts` で生成）
- 依存の追加: なし
- 前提: PR #4 がマージされ、`layout-shell` がアーカイブされていること（main spec `openspec/specs/layout-shell/` が存在する）
- 設計書: `<Font>` を外部 CSS にする場合は §7「文字」の記述を更新。`lang` 導出を採る場合は `layout-shell` の design D1 に相当する記述を更新
