Issue: #70

# Tasks

## 1. 開発物のデータと検証（D1、D2、D4、D5）

- [x] 1.1 開発物のスキーマ、アイコン、集合の検証、並べ替えを足す
  - Files: `src/content/schemas.ts`、`src/lib/pixel.ts`、`src/lib/validate.ts`、新規 `src/lib/projects.ts`、`tests/unit/schemas.test.ts`、`tests/unit/validate.test.ts`、`tests/unit/pixel.test.ts`、新規 `tests/unit/projects.test.ts`
  - Interface: `projectSchema` / `Project` / `ProjectEntry`（schemas.ts）、`tomoly` / `projectIcons`（pixel.ts）、`validateProjects(entries: ProjectEntry[]): string[]`（validate.ts）、`sortProjects(entries: ProjectEntry[]): ProjectEntry[]` / `sinceLabel(year: number, lang: Locale): string`（projects.ts）
  - Test first: `schemas.test.ts` で全項目がそろった開発物が通り、`summary.en` 欠け・`icon: rocket`・`tech: []`・`since` が `26` と `'2026-09'` で落ちること。`validate.test.ts` で `order` 重複のエラーに値と両 slug が入り、0 件で「開発物が無い」旨のエラーになること。`projects.test.ts` で `order` 2・1 の順の入力が 1・2 に並び入力を変えないこと、`sinceLabel(2026, 'ja')` が `2026年〜`、`'en'` が `2026–`。`pixel.test.ts` で `tomoly` が D4 の 16 行と一致し 16×16 であること
  - Review: batch A
  - Risk: none
- [x] 1.2 コレクションを登録し、Tomoly のデータと入稿の細則を足す
  - Files: `src/content.config.ts`、`src/lib/content.ts`、新規 `src/content/projects/tomoly.yaml`、`docs/content-authoring.md`、`tests/unit/content-config.test.ts`
  - Interface: `getProjects(): Promise<ProjectEntry[]>`（content.ts。`validateProjects` を `assertValid` に通し、`sortProjects` で並べて返す）
  - Test first: `content-config.test.ts` でコレクション `projects` が登録されていること（既存の profile / career / photos の検査の形に合わせる）。`tomoly.yaml` は D5 の値をそのまま書き、`pnpm build` が通ること。`docs/content-authoring.md` に「開発物」の節（1 件 1 ファイル、`order` の重複と 0 件でビルドが落ちる、`icon` は `pixel.ts` の `projectIcons` に絵を足してから使う）を足す
  - Review: batch A
  - Risk: none

## 2. ページとトップの導線（D2、D3、D6）

- [x] 2.1 導線のヘルパーと Projects のアイコンを足す
  - Files: `src/lib/site.ts`、`src/lib/pixel.ts`、`tests/unit/site.test.ts`、`tests/unit/pixel.test.ts`
  - Interface: `projectsPath(lang: Locale, base: string): string`、`topLinks(lang: Locale, base: string): NavLink[]`（site.ts）、`terminal`（pixel.ts）
  - Test first: `site.test.ts` で `projectsPath('ja', '/portfolio/')` が `/portfolio/ja/projects/`、`topLinks` が Photos → Career → Projects の 3 つで Projects の icon が `terminal`、`navLinks` は Photos / Career の 2 つのまま。`pixel.test.ts` で `terminal` が D3 の 16 行と一致し、`camera` とも `briefcase` とも違うこと
  - Review: batch A
  - Risk: none
- [x] 2.2 開発物ページ `/{ja,en}/projects/` を作る
  - Files: 新規 `src/pages/[lang]/projects.astro`、`tests/e2e/paths.ts`、`tests/e2e/pages.spec.ts`、`tests/e2e/links.spec.ts`
  - Test first: `paths.ts` の `pagePaths` に `${lang}/projects/` を足す（a11y・network・pages の検査が自動で対象に入る）。`pages.spec.ts` または `links.spec.ts` で、両ロケールの開発物ページについて次を確かめる: `<title>` が `Projects · <name>`、`h1` が `Projects`。`tomoly.yaml` を読み、`h2` の中のリンクの文字が `Tomoly`・`href` が `https://tomoly.app`・`target` なし。同じ項目に `<status> · 2026年〜`（en は `<status> · 2026–`）、そのロケールの `summary` と `description`、`tech` の `, ` 区切りの 1 行がある。en ページに `summary.ja` / `description.ja` が無い。項目の svg が `tomoly` の座標と完全一致で `aria-hidden="true"`、`img` なし。全ページのヘッダーに `href` が `/projects/` を含むリンクが無い。`/ja/projects/` のヘッダーの `EN` が `/en/projects/` を指す。失敗を確認してから実装する
  - Review: solo
  - Risk: ui
- [x] 2.3 トップ本文の導線を `topLinks` にする
  - Files: `src/pages/[lang]/index.astro`、`tests/e2e/links.spec.ts`、必要なら `tests/e2e/viewport.spec.ts`
  - Test first: `links.spec.ts` の本文の導線の検査を、`/ja/` と `/en/` で Photos → Career → Projects の 3 つ（`href` がそのロケールの `/photos/`・`/career/`・`/projects/`）で、Projects の svg が `terminal` と完全一致し camera・briefcase と一致しないこと、`[hreflang]` と `[role="group"]` が 0 件であることに直す。失敗を確認してから実装する。`viewport.spec.ts` の初見表示（1280×720・1440×900・1024×768、両ロケール）が導線の 3 つ目も対象にしていることを確かめ、していなければ足す。落ちたら design の Risks の手順に従う
  - Review: solo
  - Risk: ui

## 3. サイトマップ

- [x] 3.1 サイトマップに開発物ページを載せる
  - Files: `src/lib/sitemap.ts`、`tests/unit/sitemap.test.ts`、`tests/e2e/sitemap.spec.ts`
  - Test first: `sitemap.test.ts` で写真 2 枚のとき `<loc>` が 12 件、写真 3 枚で 14 件、英語の開発物ページの `<loc>` が `https://joe-yama.github.io/portfolio/en/projects/` で `xhtml:link` が 3 本。`sitemap.spec.ts` の件数の期待を `pagePaths` と一致させる
  - Review: batch B
  - Risk: none

## 4. 番人の確認と仕上げ

- [x] 4.1 変異を当てて番人が落ちることを確かめる（`harness:mutation-check` の隔離実行）
  - Verify: 次の各変異で対応するテストが落ち、変異なしの対照は緑: (a) `sortProjects` を並べ替えなしにする → `projects.test.ts`、(b) `validateProjects` の `order` 重複の検査を外す → `validate.test.ts`、(c) `navLinks` に Projects を足す → ヘッダーの e2e、(d) `topLinks` から Projects を外す → 本文の導線の e2e、(e) 名前のリンクに `target="_blank"` を付ける → 開発物ページの e2e、(f) 英語ページで `summary.ja` を出す → 開発物ページの e2e、(g) `sitemapEntries` から開発物を外す → `sitemap.test.ts`、(h) `projectIcons` の enum を `z.string()` にする → `schemas.test.ts`
  - Review: batch B
  - Risk: none
- [ ] 4.2 すべての検証コマンドを実行する
  - Verify: `pnpm lint` / `pnpm typecheck` / `pnpm test` / `pnpm build` / `pnpm e2e` がすべて終了コード 0。コマンドと出力を報告に添える
  - Review: batch B
  - Risk: none

## Scenario と検証タスクの対応

- projects「開発物ページの出力」「ページ名と見出し」「項目の表示内容（日本語）」「項目の表示内容（英語）」「開発物のアイコン」→ 2.2
- projects「order の小さい順に並ぶ」→ 1.1（`sortProjects`）、1.2（`getProjects` が並べる）
- projects「ヘッダーのリンク」「開発物ページの言語切り替え」→ 2.1（`navLinks` が 2 つのまま）、2.2
- content-schema「必須項目が揃った開発物」「summary の英語が欠けた開発物」「未定義のアイコン名」「tech が空」「since の形式が違う」→ 1.1
- content-schema「order が重複」「開発物が 0 件」→ 1.1
- profile-and-career「日本語トップの導線」「英語トップの導線」「Projects のアイコン」→ 2.1、2.3
- sitemap「載るページ」「開発物ページの URL」「写真が増えたとき」→ 3.1。「載せないページ」「絶対 URL の形」→ 既存の `sitemap.test.ts`（3.1 で緑を確かめる）
- quality-gates「すべてのページの表示」「外部ホストへのリクエスト」「アクセシビリティ違反」→ 2.2（`pagePaths` への追加）、4.2。ほかの Scenario は既存の検査のまま（4.2）

## Proposals

- （batch A レビュー Minor）`getProjects` の `sortProjects` 呼び出しを守るテストが無い（`src/lib/content.ts:57`）。呼び出しを外しても落ちない。開発物が 2 件以上になったときに e2e で並び順を確かめる
- （batch A レビュー Minor）`order` 重複のテストが値を `toContain('7')` で見ている（`tests/unit/validate.test.ts:533`）。`toContain('order 7')` などにすると値を確実に固定できる
- （batch A レビュー Minor）`z.url()` が `javascript:` を通す（`src/content/schemas.ts:143`、既存の `url` 項目も同じ）。`z.url({ protocol: /^https?$/ })` にできる
- （batch A 過剰設計）`pixel.test.ts` の tomoly の 16×16 のテストは `describe.each` と重複、`project()` の fixture が validate / projects のテストで重複、`validateProjects` の重複検出が `validatePhotos` と同じループ（D2 で揃える指示どおり）
- （2.2 レビュー Minor）`tests/e2e/pages.spec.ts:869-874` の「/en/projects/ に summary.ja と description.ja が無い」は応答の status を見ておらず、404 でも通る（いまは `pages.spec.ts:194` が間接に守る）。`expect(res?.status()).toBe(200)` を足す
- （2.2 レビュー Minor）`pages.spec.ts` の `parseProject` は狭い YAML の書き方だけを読む手書きの読み取り（`parsePatents` と同じ流儀）。2 件目で別の引用符の書き方を使うときに広げる
- （2.2 過剰設計）`links.spec.ts:145` の `/ja/projects/` の EN の検査は `expectLangSwitch` と重複、`ProjectSummary` 型は推論で足りる、`unquoteAny` と既存の `unquote` は 1 つにできる
- （2.3 レビュー Minor）本文の導線でアイコンが文字の前にあることを確かめるテストが無い（Photos・Career も同じで既存の穴）
- （2.3 レビュー Minor、この change とは無関係）`tests/e2e/viewport.spec.ts:453`「390×844 で写真は本文の幅いっぱい」が約 3/40 で落ちる。画像の読み込みを待たずに測っている。`assertPhotoFillsMainContentWidth` の前に `waitForImageLoaded` を呼ぶ。CI は再試行なしだが直近 30 回の CI では e2e の失敗なし
- （2.3 過剰設計）`links.spec.ts:370` の `projectsCells` の読み直しと `not.toEqual` 2 行は、368 行と `pixel.test.ts:163-164` で足りる（tasks が文字どおり求めたので残した）
