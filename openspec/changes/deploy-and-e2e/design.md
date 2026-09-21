# Design

## Context

動機と実測値は proposal.md を参照。前提となる現状:

- `src/lib/i18n.ts` の `localeFromPath` / `alternatePath` は「先頭セグメントがロケールか」で判定する。`base` が入ると `Astro.url.pathname` に `/portfolio/` が前置されるため、どちらも壊れる
- `src/lib/site.ts` の `navLinks` / `languageSwitch` / `alternateLinks` がサイト内パスを作る唯一の場所……**ではない**。`Header.astro` のロゴ（`/${lang}/`）、`photos/index.astro` のカード、`[slug].astro` の前後リンク、`404.astro` の戻りリンク、`BaseLayout.astro` と `index.astro` の favicon、`index.astro` のリダイレクト先がテンプレートに直書きされている
- `vitest.config.ts` は既に `include: ['tests/unit/**/*.test.ts']` なので、Playwright の `*.spec.ts` を Vitest が拾う心配は無い（確認済み）
- `tsconfig.json` の `include` は `["**/*"]` なので、`tests/e2e/` と `playwright.config.ts` も `astro check` の対象になる
- Biome の対象も同様（`biome.json` の `files.includes` から除外しない）
- Change 4 の申し送り: 名前の無い `navigation` ランドマークが `/ja/` `/en/` に 3 つあり、axe の既定設定では `landmark-unique` が落ちる

## Goals / Non-Goals

**Goals:**

- `base` を入れても静かに壊れない構造にする（`dist` を検査するテストと e2e を同時に入れる）
- サイト内パスの生成を 1 箇所に集め、`base` を外すときも 1 箇所で済むようにする
- `main` への push だけで公開が更新される

**Non-Goals:**

- 独自ドメインへの移行（`base` を外す作業）。後続の change
- PR ごとのプレビュー環境、視覚回帰、Lighthouse
- Change 3・4 の提案の消化（axe が実測で落とすものを除く）

## Decisions

### D1: `base` の扱いは「剥がす」と「前置する」の 2 関数に閉じる

`src/lib/i18n.ts` に純関数を 2 つ置く。どちらも base を**引数で受け取る**（`import.meta.env` を直接読まない）ことで Vitest から検証できる:

- `stripBase(path, base)` — 先頭の base を取り除いた絶対パスを返す。base が付いていなければそのまま返す
- `withBase(path, base)` — base を前置した絶対パスを返す。既に付いていれば二重に付けない

`localeFromPath` と `alternatePath` は `stripBase` を通してから既存のロジックを使う。`alternatePath` は base を剥がして言語接頭辞を置き換え、`withBase` で戻す（実測した `/en/portfolio/en/career/` の壊れ方を直す）。

呼び出し側（`.astro`）は `import.meta.env.BASE_URL` を渡す。**`BASE_URL` は末尾スラッシュ付きの `/portfolio/`**（実測）。`base` 未設定のときは `/` になるので、両方の形を関数側で正規化する。

代案「`.astro` の中で `import.meta.env.BASE_URL + path` を書く」は、実測で 12 箇所に散らばることが分かっており、1 箇所でも漏らすと静かに 404 になるため採らない。

### D2: サイト内パスを作る関数を `src/lib/site.ts` に集約する

`navLinks` / `languageSwitch` / `alternateLinks` に加えて、次を `site.ts` に足す（すべて base を引数で受け取る純関数）:

- `homePath(lang, base)` — ロゴとトップへのリンク
- `photoPath(slug, lang, base)` — ギャラリーのカードと前後リンク
- `assetPath(path, base)` — favicon などの静的アセット

`.astro` は `import.meta.env.BASE_URL` を渡して呼ぶだけにする。`grep -rn 'href="/' src` が 0 件になることを**タスクの検証条件にする**。

### D3: e2e は `pnpm preview` の配信に対して実行する

`playwright.config.ts` の `webServer` に `pnpm preview` を指定し、`baseURL` を `http://127.0.0.1:4321/portfolio/` にする（preview は base の下で配信する。実測で確認する）。ブラウザは Chromium のみ。本番と同じ静的配信なので `base` の挙動もそのまま出る。

代案「`astro dev` に対して実行する」は、dev はビルド出力ではないため `dist` の欠落を検出できない。

### D4: axe は既定の全ルールで回し、違反が出たら直す

`@axe-core/playwright` を各ページに 1 回。`impact` で絞らず、`disableRules` も使わない（ルールの無効化はテストの期待値の書き換えに当たる）。

**Change 4 の申し送りにより、`landmark-unique` が `/ja/` `/en/` で落ちることが分かっている。** これは設計書 §7 のアクセシビリティの範囲内なので、この change で直す: トップの連絡先は `<nav>` をやめて `<ul>` にし、本文の導線の `<nav>` に `aria-label` を付ける（文字列は `ui` に足す）。写真の個別ページの `nav.around` にも `aria-label` を付ける（Change 3 の提案。同じ違反に当たるため）。

他に違反が出た場合は、設計書 §7 の範囲内なら直し、範囲外なら裁定して後続に回す（`disableRules` は使わない）。

### D5: 内部リンク検査は e2e の 1 テストとして `fs` で行う

`dist/` の HTML を読み、`href` / `src` / `srcset` の同一オリジン参照を集めて、`dist/` 内のファイルに解決するか確かめる。新しい依存は入れない（正規表現で属性を拾う。HTML パーサは足さない）。

`base` を剥がしてから `dist/` のパスに対応づける（`/portfolio/ja/career/` → `dist/ja/career/index.html`）。`trailingSlash: 'always'` なので、末尾スラッシュのパスは `index.html` を見る。

代案「`scripts/` の Node スクリプトにして `pnpm build` の後に走らせる」は、実行の入口が増えるだけで、e2e が既に `dist` を配信している以上まとまりが悪い。

### D6: デプロイは `withastro/action` + `actions/deploy-pages`

`.github/workflows/deploy.yml`:

- `on: push: branches: [main]` と `workflow_dispatch`
- `permissions: contents: read / pages: write / id-token: write`
- `concurrency: group: pages`（同時デプロイの禁止）
- build job: `withastro/action@v6` に **`node-version: 26.8.2` を明示**する。**README に `.node-version` を読むという記述は無く、既定は `24`**（2026-09-21 に README で確認）。`package-manager` は lockfile から自動判定される
- deploy job: `actions/deploy-pages@v5`、`environment: github-pages`

Pages は P0 で `build_type=workflow` で有効化済みなので、`actions/configure-pages` は挟まない。

CI（`ci.yml`）には `pnpm exec playwright install --with-deps chromium` と `pnpm e2e` を足す。**job 名 `check` は変えない**（P3 で作る ruleset の required status check の名前になる）。

### D7: `site` は変えない

`site: 'https://joe-yama.github.io'` のまま、`base: '/portfolio'` を足す。実測で `Astro.url.href` が `https://joe-yama.github.io/portfolio/...` になることを確認済みなので、`alternateLinks` が `new URL(alternatePath(...), Astro.site)` で正しい絶対 URL を作れる（`alternatePath` が base 込みのパスを返すようになるため）。

## Risks / Trade-offs

- **`base` を入れた状態で単体テストが全部通ってしまう** → この change の肝。`stripBase` / `withBase` の単体テストに加え、e2e と内部リンク検査で `dist` を検査する。**タスクの順序を「まず検査を書く → `base` を入れる」にはしない**（検査対象の `dist` が base 無しでは作れないため）。代わりに、`base` を入れたタスクの検証条件に「`dist` の中身を grep で確認する」を必ず入れる
- **axe が未知の違反を出す** → `landmark-unique` は既知。他が出たら設計書 §7 の範囲で判断し、裁定を Issue に記録する
- **CI の実行時間が伸びる** → Chromium のインストールと e2e で 1〜2 分増える見込み。許容する（PO 決定の「CI 必須」は `check` job 1 つ）
- **デプロイの workflow だけが落ちる** → CI は `actions/setup-node` で `.node-version` を読むが、`withastro/action` は読まない。`node-version` の明示を忘れると Node 24 でビルドされ、Astro 7 の要求を満たさない可能性がある。D6 で明示する
- **`preview` の URL が `/portfolio/` 配下になる** → reviewer に渡す URL と `playwright.config.ts` の `baseURL` を揃える。実装の最初のタスクで実測して記録する

## Migration Plan

公開後に問題が見つかった場合は `fix/` ブランチの PR で直して再デプロイする（`main` への push で自動的に再公開される）。`base` を戻す場合は `astro.config.ts` の 1 行を消すだけで済む（D1・D2 でパス生成を集約しているため）。

## Open Questions

なし。
