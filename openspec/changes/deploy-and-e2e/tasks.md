# Tasks

レビューの単位（`.claude/rules/review.md`）: **単位 A = タスク 1・2（`base` 対応。共有インターフェースと全ページに触る。UI 実測あり）**、**単位 B = タスク 3・4（e2e とリンク検査）**、**単位 C = タスク 5（workflow 2 本）**、**ブランチ全体 1 回**。

## 1. `base` を剥がす・前置する純関数（単位 A）

- [x] 1.1 `src/lib/i18n.ts` に `stripBase(path, base)` と `withBase(path, base)` を TDD で追加する。`base` は `/portfolio/`（末尾スラッシュ付き。`import.meta.env.BASE_URL` の実値）と `/`（未設定時）の両方を受ける。`tests/unit/i18n.test.ts` で「`/portfolio/en/career/` + `/portfolio/` → `/en/career/`」「`/en/career/` + `/portfolio/` → `/en/career/`（付いていなければそのまま）」「`/portfolio/` + `/portfolio/` → `/`」「`/ja/` + `/` → `/ja/`」「`withBase` が二重に付けない」を固定し、`pnpm test` が緑になることで検証する
- [x] 1.2 `localeFromPath` と `alternatePath` を `base` 引数を取る形に変え、内部で `stripBase` / `withBase` を使う。`tests/unit/i18n.test.ts` に spec の新しい Scenario（`/portfolio/en/career/` → `en`、`/portfolio/` → ロケールなし、`/portfolio/ja/photos/x/` の英語版 → `/portfolio/en/photos/x/`）を足し、既存のケース（base 無し）も通ることを確認する。`pnpm test` と `pnpm typecheck` が緑になることで検証する
- [x] 1.3 `src/lib/site.ts` に `homePath(lang, base)` / `photoPath(slug, lang, base)` / `assetPath(path, base)` を TDD で追加し、`navLinks` / `languageSwitch` / `alternateLinks` も `base` を受け取る形に変える。`tests/unit/site.test.ts` で「`base` が `/portfolio/` のとき全関数の戻り値が `/portfolio/` で始まる」「`base` が `/` のとき従来どおり」を固定し、`pnpm test` が緑になることで検証する

## 2. `base` の適用と全ページの書き換え（単位 A）

- [x] 2.1 `astro.config.ts` に `base: '/portfolio'` を追加し、`.astro` の呼び出し側（`BaseLayout.astro`、`Header.astro`、`404.astro`、`index.astro`、`[lang]/index.astro`、`[lang]/career.astro`、`[lang]/photos/index.astro`、`[lang]/photos/[slug].astro`）を、タスク 1 の関数に `import.meta.env.BASE_URL` を渡す形に書き換える。`src/pages/index.astro` の `meta http-equiv="refresh"` の遷移先と本文リンクも `/portfolio/ja/` にする。`pnpm build` 後に次をすべて確認する: `grep -rn 'href="/' src` が 0 件、`grep -o '<html lang="[^"]*"' dist/en/index.html` が `en`、`grep -c 'rel="alternate"' dist/en/career/index.html` が 3、`grep -o 'href="[^"]*"' dist/en/career/index.html` の同一オリジン参照がすべて `/portfolio/` 始まり、`grep -o 'url=[^"]*' dist/index.html` が `/portfolio/ja/`、`dist/404.html` の戻りリンクが `/portfolio/{ja,en}/`
- [x] 2.2 `pnpm build && pnpm preview` で配信し、`http://127.0.0.1:4321/portfolio/` が `/portfolio/ja/` に遷移すること、`/portfolio/en/career/` が 200 で表示されることを実測して報告に貼る（**preview の URL に base が含まれるかを最初に確認し、違っていたらその事実を記録して報告する**）。`pnpm lint && pnpm typecheck && pnpm test` が緑であることも示す

## 3. e2e の土台と `base` 配下の検査（単位 B）

- [x] 3.1 `pnpm add -D @playwright/test @axe-core/playwright` を**1 回だけ**実行し、`pnpm exec playwright install chromium` でブラウザを入れる。`astro preview` がデーモンとして起動し即終了するため `webServer` ではなく `globalSetup` / `globalTeardown`（`pnpm build` → `astro preview --port 4399` / `astro preview stop`）を使う裁定（`fdde2df`）に従った。`playwright.config.ts`（`baseURL` は `http://127.0.0.1:4399/portfolio/`、Chromium のみ、`reporter: 'list'`）と `package.json` の `"e2e": "playwright test"` を追加した。`pnpm typecheck` と `pnpm lint` も緑であることを確認した
- [x] 3.2 `tests/e2e/pages.spec.ts` を追加する。5 種類 × 2 言語（トップ / ギャラリー / 写真の個別ページ / 経歴 / 404）が表示されること、各ページの `document.documentElement.lang` が URL のロケールと一致すること、`link[rel=alternate][hreflang]` が 3 本で `href` が `https://joe-yama.github.io/portfolio/` 配下であること、言語切り替えのクリックで同じページの他言語版へ遷移すること、写真が `<picture>` として出力されていること、`/portfolio/` が `/portfolio/ja/` へ遷移することを検査する。**実行して発覚した実装の不具合**: 404 ページで `showNav={false}` でもヘッダーのロゴが `homePath('ja', base)` へのリンクとして残り、本文の日本語トップへのリンクと重複していた（`a[href$="/portfolio/ja/"]` が 2 件）。`src/components/Header.astro` を直し、`showNav` が偽のときロゴを `<span>`（リンク無し）にした。`pnpm e2e` が緑になることで検証した
- [x] 3.3 `tests/e2e/network.spec.ts` を追加する。各ページを開いている間の `page.on('request')` を集め、配信元（`127.0.0.1`）以外のホストへの要求が 0 件であることを assert する。`pnpm e2e` が緑になることで検証した

## 4. アクセシビリティと内部リンク検査（単位 B）

- [x] 4.1 `tests/e2e/a11y.spec.ts` を追加し、`@axe-core/playwright` で各ページ（5 種類 × 2 言語 + 404）の違反 0 件を assert する（`disableRules` は使わない）。Change 4 の申し送りどおり `landmark-unique` が `/ja/` `/en/`（さらに実測で `/{ja,en}/photos/kariya-ferris-wheel/` も）落ちたので、`src/pages/[lang]/index.astro` の連絡先を `<nav>` から `<ul>` に変え、本文の導線の `<nav>` に `aria-label={ui[lang].siteNav}` を付け、`src/pages/[lang]/photos/[slug].astro` の `nav.around` にも `aria-label={t.photoNav}` を付けた（文字列は `src/lib/site.ts` の `ui` に追加し `tests/unit/site.test.ts` で両ロケールを固定）。**想定外の違反 `page-has-heading-one`**（`/{ja,en}/photos/` と `does-not-exist/` に h1 が無い）も出た。設計書 §7 の列挙（alt・キーボード到達・コントラスト・hreflang）には無いが、§8 の受け入れ基準「アクセシビリティ違反なし」の範囲内と裁定し、`.sr-only`（視覚的に隠すが読み上げには残す）ユーティリティを `src/styles/global.css` に足して `src/pages/[lang]/photos/index.astro` と `src/pages/404.astro` に `<h1 class="sr-only">` を追加した。理由: 見出し構造の欠落は既存デザイン（キャプション無しの格子・言語非依存の 404）を変えずに直せ、スクリーンリーダー利用者の見出しジャンプを妨げる実害がある。代償: 裁定が誤りだった場合、不要な非表示見出しが残るだけで見た目・機能への影響はゼロ。`pnpm e2e` で 9 ページとも緑になることで検証した
- [x] 4.2 `tests/e2e/links.spec.ts` を追加する。`dist/` の HTML を `fs` で走査し、`href` / `src` / `srcset` の同一オリジン参照（`/portfolio/` 始まり）がすべて `dist/` 内のファイルに解決することを assert する（末尾スラッシュのパスは `index.html` を見る。新しい依存は入れない）。**検査が本当に番人かを確かめる**: `globalSetup` が毎回 `pnpm build` を走らせ `dist` を再生成してしまうため、`tests/e2e/global-setup.ts` の `pnpm build` 行を一時的にコメントアウトしたうえで `dist/favicon.svg` を退避して `pnpm e2e tests/e2e/links.spec.ts` を実行し、`exit=1` と 12 ページ分の `dist/...: /portfolio/favicon.svg` 欠落が報告されることを確認した。検証後は `git checkout -- tests/e2e/global-setup.ts` で該当 1 ファイルだけを戻し、`favicon.svg` も `dist/` へ戻した。`pnpm e2e` が緑になることで検証した

## 5. CI とデプロイの workflow（単位 C）

- [ ] 5.1 `.github/workflows/ci.yml` の `check` job に `pnpm exec playwright install --with-deps chromium` と `pnpm e2e` を `pnpm build` の後に足す（**job 名 `check` は変えない**）。YAML の構文を `python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/ci.yml'))"` で確認することで検証する
- [ ] 5.2 `.github/workflows/deploy.yml` を追加する（`on: push: branches: [main]` + `workflow_dispatch`、`permissions: contents: read / pages: write / id-token: write`、`concurrency: group: pages`、build job = `withastro/action@v6` に `node-version: 26.8.2` を明示、deploy job = `actions/deploy-pages@v5` と `environment: github-pages`）。同じく YAML の構文確認で検証する。**`.node-version` は `withastro/action` が読まないため `node-version` の明示が必須**（2026-09-21 に README で確認済み）

## 6. 仕上げ

- [ ] 6.1 `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm e2e` がすべて緑、`openspec validate deploy-and-e2e --strict` が valid、`git status --short` が空であることを確認し、本ファイルの完了項目を `[x]` にしてコミットする
- [ ] 6.2 `reviewer`（Opus）でブランチ全体をレビューし、結果を Issue にコメントする
- [ ] 6.3 push して `Closes #<Issue>` を含む PR を作り、CI 緑と Approved を確認してマージする。マージ後に `gh run list --workflow deploy.yml` → `gh run watch <id>` でデプロイの成功を確認する

## 提案（この change では実装しない。後続の change 用）

単位 A（`base` 対応）のレビューで挙がった Minor と ponytail。いずれも reviewer が変異テストで「すり抜ける」ことを実測している。

- `src/lib/i18n.ts` の「似た接頭辞」テストは接頭辞の**固定**を検証していない。`startsWith` を `includes` に変えても 68 passed のまま。`expect(stripBase('/x/portfolio/ja/', '/portfolio/')).toBe('/x/portfolio/ja/')` を 1 行足せば番人になる（`Astro.url.pathname` は必ず base で始まるので実害は今は無い）
- `normalizeBase` の両端トリムにテストが無い。`return base;` に変えても 68 passed。`base` が `'portfolio'` / `'/portfolio'` のときだけ効く分岐で、現状 `BASE_URL` は常に `/portfolio/`
- `stripBase` の `path === prefix.slice(0, -1)` の分岐は `trailingSlash: 'always'` では到達しない。削除しても 68 passed
- `withBase` の入力前提（先頭 `/` の絶対パス）が暗黙。`withBase('/portfolio', '/portfolio/')` → `/portfolio/portfolio`、`assetPath('favicon.svg', ...)` → `/portfoliofavicon.svg`。呼び出し側はすべて絶対パスを渡すので現状は無害
- ponytail（-8 行）: `assetPath` は `withBase` の 1:1 の別名なので削れる。`stripBase` の到達しない分岐と `normalizeBase` の両端トリムも、テストを足すか削るかのどちらかに寄せる
