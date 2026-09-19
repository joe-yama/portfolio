# Tasks

各タスクの詳細な手順は `docs/superpowers/plans/2026-09-19-layout-shell.md`（writing-plans で作成）にある。実装は `implementer`（Sonnet）、各タスクのレビューは `reviewer`（Opus）で行う（`.claude/rules/review.md`）。実装コードの変更はテストを先に書く（RED → GREEN）。

## 1. リンク計算の純関数

- [x] 1.1 `tests/unit/site.test.ts` を先に書く（`alternateLinks`: `/ja/` + `https://example.com` → ja / en / x-default の 3 本で x-default は ja と同じ href、`/en/career/` の下位ページ。`navLinks`: ja / en それぞれで Photos → `/<lang>/photos/`、Career → `/<lang>/career/` の順。`languageSwitch`: ja ページで label `English`・hreflang `en`・href は `alternatePath` の結果、en ページで `日本語`。UI 文字列の 404 文言が両言語にある）。RED を確認する
- [x] 1.2 `src/lib/site.ts`（`alternateLinks`、`navLinks`、`languageSwitch`、UI 文字列）を `src/lib/i18n.ts` だけに依存して実装し、`pnpm test` 緑・`pnpm lint` 0・`pnpm typecheck` 0 を確認する

## 2. フォントと配色

- [x] 2.1 `astro.config.ts` に `fonts`（`fontProviders.google()`、DotGothic16、`cssVariable: '--font-dot'`、`subsets: ['japanese','latin']`、`display: 'swap'`、`fallbacks`）を追加し、`pnpm build` がフォントを取得して `dist/_astro/fonts/*.woff2` を出すこと、ビルドに警告が無いことを確認する。取得に失敗したら出力を添えて PO に報告して止まる
- [x] 2.2 `src/styles/global.css`（無彩色の CSS 変数 4 つ、`color-scheme: light dark`、ダーク用 `@media`、`:focus-visible` の枠、`.dot` = `var(--font-dot)`、本文 `system-ui`、リセット最小限）を作り、ライト・ダークそれぞれの `--fg` / `--fg-muted` と `--bg` のコントラスト比を計算して 4.5:1 以上であることを確認し、値を記録する

## 3. レイアウトと部品

- [x] 3.1 `tests/unit/pixel.test.ts` を先に書き（`cells()` が `#` の座標を返す、`camera` / `lost` が 16 行 × 16 文字で `.` と `#` のみ）、RED を確認してから `src/lib/pixel.ts`（絵データ 2 点と `cells()`）と描画コンポーネント `src/components/pixel/PixelArt.astro`（`rows` → 1×1 の `<rect>`、`shape-rendering="crispEdges"`、`fill="currentColor"`、`aria-hidden="true"`、`scale` で整数倍）を実装し、`pnpm test` 緑・`pnpm typecheck` 0 を確認する。格子がぼやけないことは 5.1 のスクリーンショットで確認する
- [x] 3.2 `src/components/Header.astro`（ロゴ = `profile.name` → `/<lang>/`、`navLinks`、`languageSwitch` を `hreflang` 付きで。`showNav` が偽ならロゴのみ。1 行、折り返し可、開閉メニューなし）と `src/components/Footer.astro`（`© 年 名前`。年は `new Date().getFullYear()`）を作り、`pnpm typecheck` 0 を確認する
- [x] 3.3 `src/layouts/BaseLayout.astro`（props `lang` / `title?` / `showNav?`、`<head>` に charset・viewport・`<title>`（トップは名前、他は「ページ名 · 名前」）・`alternateLinks` の 3 本・`<Font cssVariable="--font-dot" />`（preload なし）、`global.css` の import、Header / `<main><slot /></main>` / Footer）を作り、`pnpm typecheck` 0 を確認する
- [x] 3.4 `src/pages/[lang]/index.astro` を `BaseLayout` に載せ替える（本文は `<h1>` の名前と一行紹介、`Camera` のアイコン。`await getCareer(lang)` は残す）。`pnpm build` 後に `dist/ja/index.html` / `dist/en/index.html` が `<html lang>`、`<title>` = 名前、hreflang 3 本（x-default = ja）、ヘッダーの 4 リンク（ja では `English` → `/en/`、en では `日本語` → `/ja/`）、フッターの `© 2026` を含み、`<script` を含まず、`https://` の参照が `<a>` と hreflang 以外に無く、`@font-face` の `url(` が同一オリジンであることを `grep` で確認する
- [x] 3.5 `src/pages/404.astro`（`BaseLayout` を `showNav={false}` で使用、`Lost` の絵、日英の文言、`/ja/` と `/en/` へのリンク）を作り、`pnpm build` 後に `dist/404.html` が存在して両リンクと `<svg>` を含み、`Photos` / `Career` / 言語切り替えのリンクが無いことを確認する。`404.html` が出力されない場合は Issue にコメントして PO に相談する

## 4. Change 1 の保留 Minor の整理（挙動を変えない）

- [x] 4.1 `astro.config.ts` の `output: 'static'`、`package.json` の `engines`、`biome.json` の `files.includes` で Biome 2.5 の既定と重複する除外（ドキュメントで既定を確認できたものだけ）を削除し、`pnpm lint` / `typecheck` / `test` / `build` がすべて 0 のままであることを確認する
- [x] 4.2 `src/content/schemas.ts` の `certifications` / `achievements` 要素の共通部分（`date` / `name` / `url?`）を 1 つの base スキーマにまとめ、`tests/unit/schemas.test.ts` が変更なしで緑のままであることを確認する
- [x] 4.3 `.claude/hooks/lint-on-edit.sh` / `test-on-stop.sh` の `detect_lint()` / `detect_test()` を消してコマンドを直接書き（Write / Edit ツールで編集）、`docs/harness/hooks.md` の記述を合わせ、合成 JSON のパイプで lint 違反ファイル rc=2・正常ファイル rc=0、Stop hook がテスト失敗時に `decision: block` を出すことを確認する

## 5. 見た目の確認と仕上げ

- [x] 5.1 `reviewer`（Opus）が `pnpm build && pnpm preview` の URL を実ブラウザで操作し（Playwright MCP のツールが reviewer サブエージェントに渡らなかったため、Task 5 / 6 のレビューで ms-playwright の chrome-headless-shell を CLI で使って同じ項目を実測。Issue #3 に記録）、`/ja/`・`/en/`・`/404.html` をライト/ダーク × 幅 390px / 1280px で表示して spec のシナリオ（ヘッダーのリンク先、言語切り替え、320px で横スクロールなし、フォーカス枠、ダークでのドット絵の色）を確認する。結果を Issue にコメントする
- [ ] 5.2 コントローラーが同じ 3 ページのスクリーンショット（ライト/ダーク × スマホ/PC）を撮って PO に送り、OK または修正指示を受ける。修正があれば該当タスクに戻る
- [x] 5.3 `pnpm lint && pnpm typecheck && pnpm test && pnpm build` がすべて 0 で `git status --short` が空であることを確認し、本ファイルの完了項目を `[x]` にしてコミットする
- [x] 5.4 `reviewer`（Opus）でブランチ全体を「仕様準拠（`layout-shell`、`quality-gates` の delta）→ コード品質 → ponytail」の順にレビューし、Approved になったら結果を Issue にコメントする
- [ ] 5.5 `gh api user --jq .login` が `joe-yama` であることを確認してから push（毎回 PO に確認）し、`Closes #3` を本文に含む PR を作り、CI 緑を確認して Issue にコメントする
