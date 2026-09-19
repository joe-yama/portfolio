# Tasks

前提: PR #4（`layout-shell`）がマージされ、`/opsx:archive layout-shell` 済み。実装は `implementer`（Sonnet）、レビューは `reviewer`（Opus）。実装コードの変更はテストを先に書く。

## 1. PO 判断（別セッションの冒頭）

- [ ] 1.1 design.md の Open Questions 1〜3（フォント CSS の配信形、見た目の Minor 5 件、`lang` の導出）を PO に提示して決定をもらい、決定内容を GitHub Issue にコメントする。「現状維持」の項目は対応するタスクを「対象外」と明記して閉じる

## 2. 決定不要の整理（1 と並行してよい）

- [ ] 2.1 `tests/unit/site.test.ts` に `alternateLinks('/', 'https://example.com')` が ja / en / x-default とも接頭辞を付けた URL を返すケースを足し（RED → GREEN。実装変更なしで通るはず）、`pnpm test` 緑を確認する
- [ ] 2.2 `tests/unit/pixel.test.ts` の各絵のテストに `expect(cells(rows).length).toBeLessThan(256)` を足し、`pnpm test` 緑を確認する
- [ ] 2.3 `tests/unit/pixel.test.ts` に `gridSize` のテスト（空配列 → `{ width: 0, height: 0 }`、行長不揃い `['#', '##']` → `{ width: 2, height: 2 }`）を先に書き、`src/lib/pixel.ts` に `gridSize(rows)` を実装し、`PixelArt.astro` の幅・高さ算出をそれに置き換えて `pnpm test` / `typecheck` / `build` 緑と `dist/404.html` の `viewBox="0 0 16 16"` を確認する
- [ ] 2.4 `PixelArt.astro` から `margin-bottom` を消し、`src/pages/[lang]/index.astro` と `src/pages/404.astro` の呼び出し側で余白を付け、`pnpm build` 後に 1280px / 390px のスクリーンショットで余白が変わっていないことを確認する
- [ ] 2.5 `Header.astro` の `<nav>` の表示条件を `showNav &&` に戻し、言語切り替えの `<a>` を `sw &&` で包む。`pnpm build` 後に `dist/ja/index.html` のヘッダー 4 リンクと `dist/404.html` の 1 リンクを grep で確認する
- [ ] 2.6 `tsconfig.json` に `"compilerOptions": { "noUnusedLocals": true }` を足し、`.astro` に未使用 import を仮に置いて `pnpm typecheck` が報告するか試す。報告すれば残し（既存コードで 0 errors を確認）、報告しなければ設定を戻して結果を Issue にコメントする
- [ ] 2.7 favicon: `src/pages/favicon.svg.ts`（静的エンドポイント、`camera` のデータから `<rect>` を生成、`shape-rendering="crispEdges"`、固定色 + ダーク用 `<style>`）と `BaseLayout` の `<link rel="icon" href="/favicon.svg" type="image/svg+xml">` を追加し、`pnpm build` 後に `dist/favicon.svg` の存在、`dist/ja/index.html` と `dist/404.html` の `<link rel="icon"`、Playwright で `/ja/` を開いてコンソールに favicon の 404 が出ないことを確認する

## 3. PO 判断に従う変更（1.1 の決定後）

- [ ] 3.1 D1 で B（外部 CSS）なら: `src/pages/fonts.css.ts` で `astro:assets` の `fontData['--font-dot']` から `@font-face`（`unicode-range` 込み）を出力し、`BaseLayout` の `<Font>` を `<link rel="stylesheet" href="/fonts.css">` と `:root { --font-dot: … }` に置き換え、`dist/fonts.css` の `url(` がすべて `/_astro/fonts/` で `dist/ja/index.html` が 10 KB 未満になることを確認する。A なら対象外
- [ ] 3.2 D2 で「直す」とした項目だけ `global.css` / `Header.astro` / `Footer.astro` / `404.astro` を変更し、変更した項目のコントラスト比（罫線なら 3:1 以上）または表示を Playwright のスクリーンショットで確認して PO に送る
- [ ] 3.3 D3 を採るなら: `BaseLayout` の `Props.lang` を消して `localeFromPath(path) ?? defaultLocale` で導出し、`[lang]/index.astro` と `404.astro` の `lang={…}` を消す。`pnpm build` 後に `dist/ja/index.html` `dist/en/index.html` `dist/404.html` の `<html lang>` が `ja` / `en` / `ja` のままであることを確認し、設計書の該当箇所を更新する

## 4. 仕上げ

- [ ] 4.1 `pnpm lint && pnpm typecheck && pnpm test && pnpm build` がすべて 0 で `git status --short` が空、`openspec validate layout-followups --strict` が valid であることを確認し、本ファイルの完了項目を `[x]` にしてコミットする
- [ ] 4.2 `reviewer`（Opus）でブランチ全体を「仕様準拠（`layout-shell` の delta）→ コード品質 → ponytail」の順にレビューし、Approved になったら Issue にコメントする
- [ ] 4.3 `gh api user --jq .login` が `joe-yama` であることを確認してから push（PO に確認）し、`Closes #5` を本文に含む PR を作り、CI 緑を確認して Issue にコメントする
