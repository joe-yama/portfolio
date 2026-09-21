# Tasks

レビューの単位は design D12 に従う（単位 A = 1、単位 B = 2、単位 C = 3、単位 D = 4〜6、単位 E = ブランチ全体）。

**禁止リスト（1 行も書かない。design D1）**: `src/components/PhotoPicture.astro`、`src/pages/[lang]/index.astro`、`src/pages/[lang]/photos/[slug].astro`、`tests/e2e/viewport.spec.ts`。進行中の change `photo-height-cap`（Issue #23）が触っている。

実装コードの変更は必ず RED → GREEN の順で行う（`.claude/rules/testing.md`）。`tasks.md` のチェックはそのタスクの実装と同じコミットに含める。

## 1. 写真の入稿（単位 A）

- [x] 1.1 `tests/unit/photo-meta.test.ts` に `toSlug` の失敗するテストを足す（`--slug` の値は拡張子に見える部分を切り詰めない: `toSlug('x.jpg', 'kamo-river-v1.2')` → `kamo-river-v1.2`。ファイル名由来のときだけ拡張子を除く: `toSlug('DSCF1234.JPG')` → `dscf1234`。英数字が残らないときのエラー文言が由来で変わる）。RED を確認してから `src/lib/photo-meta.ts` を直し、`pnpm test` が緑になることを確認する
- [x] 1.2 `tests/unit/photo-meta.test.ts` に `parseOrder(text)` と `hasFeaturedFlag(text)` の失敗するテストを足し（`order: 30` を読む / `order:` が無ければ 0 / 先頭が `-` の値 / `featured: true` の有無）、RED を確認してから `src/lib/photo-meta.ts` に実装し、`scripts/photo-add.ts` の正規表現 2 本をこの関数に置き換える。`pnpm test` 緑を確認する
- [x] 1.3 `src/lib/photo-meta.ts` の ponytail をまとめて行う（`PhotoMeta.slug` フィールドを消し `exifToPhotoMeta(raw)` の 1 引数にする、`RawExif` 型の別名を消して `Record<string, unknown>` を直接書く、`isPositiveFinite` をモジュールスコープへ出す）。既存テストの期待値を合わせ、`pnpm test` / `pnpm typecheck` 緑を確認する
- [x] 1.4 `scripts/photo-add.ts` の手書き引数解析を `node:util` の `parseArgs` に置き換え、GitHub のアカウント確認を引数解析の**後ろ**に移す。引数なしで実行して、`gh` を一度も呼ばずに使い方が出ることを実行して確認する
- [x] 1.5 `scripts/photo-add.ts` に「既存の写真データファイルがあれば書かない」分岐を入れる（画像の登録は済ませたうえで、変更していない旨を出して終了コード 0 で終わる）。同じ経路で `node_modules/.astro/assets` を削除する。新規入稿の経路では削除しないことをコードで確認できる形にする
- [x] 1.6 `scripts/photo-add.ts` の `gh` 呼び出しの失敗を `die` の 1 行に整形し、`gh release view` の catch が「Release が無い」以外の失敗を飲み込まないようにする（終了コードか stderr で判別する）。`gh` が使えない状態を模して、スタックトレースではなく 1 行が出ることを実行して確認する
- [x] 1.7 `scripts/photo-add.ts` の中断メッセージを spec の語彙（撮影日 / カメラ / レンズ / 絞り / シャッター速度 / ISO 感度）に直し、EXIF タグ名（`LensModel` など）を出さないことを grep で確認する。あわせて同じファイルを `readFileSync` で 2 回読んでいる箇所を 1 回にする
- [x] 1.8 既存の写真 1 枚に対して同じ slug で `pnpm photo:add` を実行し（design D11。PO 承認済み）、(a) `git status --short` が空、(b) データファイルを変更していない旨が出力される、(c) 直後の `pnpm build` の出力画像が新しい画像から生成されている、の 3 点を出力で示す
  - 実測は偽 `gh` で行った（公開 Release へは上げていない）

## 2. SNS 共有カード（単位 B）

- [x] 2.1 `tests/unit/site.test.ts` に `ogLocale(lang)` の失敗するテストを足す（`ja` → `ja_JP`、`en` → `en_US`）。RED を確認してから `src/lib/site.ts` に実装し、`pnpm test` 緑を確認する
- [x] 2.2 `src/layouts/BaseLayout.astro` に共有カードのメタデータを追加する。`getPhotos()` の代表写真から `getImage({ width: 1200, height: 630, fit: 'cover', format: 'jpeg' })` で派生画像を作り、`new URL(img.src, Astro.site)` を `og:image` にする。出力するのは `og:type` / `og:url` / `og:title` / `og:description` / `og:site_name` / `og:locale` / `og:image` / `og:image:width` / `og:image:height` / `og:image:alt` / `twitter:card`。出す条件は `canonical` と同じ（`pathLocale` があるときだけ）。`pnpm build` 後に `dist/ja/index.html` と `dist/en/career/index.html` に 11 本、`dist/404.html` に 0 本あることを grep で確認する
- [x] 2.3 `getImage` がリモート画像に `width` と `height` の両方を与える形で動くことを 2.2 のビルドで確認する。動かなければ `inferSize: true` に切り替え、切り替えたことと理由を本ファイルの末尾に書く
- [x] 2.4 `tests/e2e/pages.spec.ts` に共有カードの検査を足す（`/ja/` と `/en/career/` で `og:url` が `canonical` と一致、`og:title` が `<title>` と一致、`og:description` が `meta[name=description]` と一致、`og:image` を `fetch` して 200、`/404.html` に `og:` も `twitter:` も無い）。`pnpm e2e` 緑を確認する

## 3. 色・スキーマ・検証（単位 C）

- [x] 3.1 `tests/unit/theme.test.ts` に `contrast(a, b)` の失敗するテストを足す（`#000000` と `#ffffff` で 21、同じ色で 1、`#8f8f8f` と `#fafafa` で 3.0〜3.2 の範囲）。RED を確認してから `src/lib/theme.ts` に WCAG 2.x の相対輝度による実装を書き、`pnpm test` 緑を確認する
- [x] 3.2 `tests/unit/theme.test.ts` に `readTokens(css)` の失敗するテストを足す（`:root` とダークのブロックから `--bg` / `--fg` / `--fg-muted` / `--line` を抜く、トークンが欠けていれば例外）。RED を確認してから実装し、`pnpm test` 緑を確認する
- [x] 3.3 `tests/unit/theme.test.ts` に `src/styles/global.css` を読んだ検算を足す（`--fg`/`--bg` と `--fg-muted`/`--bg` が 4.5 以上、`--line`/`--bg` が 3.0 以上、ライト・ダークとも。`faviconSvg(camera)` にライトの `--fg` とダークの `--fg` が含まれる）。隔離実行で `--line` を薄くしたときと `src/lib/pixel.ts` の色リテラルを 1 文字変えたときに落ちることを出力で示す
- [x] 3.4 `tests/unit/pixel.test.ts` に `faviconSvg(['#', '##'])` の `viewBox` が `0 0 2 2` になるテストを足し（幅と高さの取り違えを検知する）、`cells` と `gridSize` の文字数の数え方を `[...row]` に揃える。同語反復の「16 × 16 の絵は 16 × 16」のテストを削除し、`pnpm test` 緑を確認する
- [x] 3.5 `tests/unit/schemas.test.ts` に暦の検査の失敗するテストを足す（`2025-02-30` と `2025-11-31` は失敗、`2024-02-29` は成功、`2025-10` は成功）。RED を確認してから `src/content/schemas.ts` の `isoDate` / `datePrecision` に `refine` を足し、`pnpm test` / `pnpm build` 緑を確認する。あわせて重複していた「年月日まで（YYYY-MM-DD）を受け付ける」のケースを削除する
- [x] 3.6 `tests/unit/schemas.test.ts` に `skills` のカテゴリ名が数字だけのとき失敗するテストを足す（`2024` は失敗、`2024年度の実績` は成功）。RED を確認してから `src/content/schemas.ts` のキーの検証を直し、`pnpm test` / `pnpm build` 緑を確認する
- [x] 3.7 `tests/unit/validate.test.ts` に「同じ位置の項目の比較キーが日英で食い違うとエラーになる」失敗するテストを足す（`certifications` の 2 番目の `date` が違う、`patents` の 1 番目の `filedAt` が違う、`countries` の件数が違う、すべて一致すればエラー 0）。RED を確認してから `src/lib/validate.ts` の `validateCareerParity` に実装し、`pnpm test` / `pnpm build` 緑を確認する。あわせて `validate.ts` の doc コメントの「配列」という記述（`skills` は `Record`）を直し、「カテゴリ数が違うときは比較まで進まない」のテストを他 4 件と同じ完全一致の assert に揃え、複数カテゴリの成功ケースを 1 件足す
- [x] 3.8 `src/lib/validate.ts` の `PhotoEntry` 型を `src/content/schemas.ts` に移し（「形」の型は schemas 側という責務の分けに合わせる）、参照元を直して `pnpm typecheck` / `pnpm test` 緑を確認する
- [x] 3.9 `src/lib/career.ts` の粒度判定を `hasDay(date)` 1 か所にまとめ（いまは `dateSortKey` が文字列長 7、`formatDate` がセグメント数 3）、`formatDate` の条件付きスプレッドを 1 行に畳む。`tests/unit/career.test.ts` に「`YYYY-MM` と `YYYY-MM-DD` の両方で `hasDay` と表示が一致する」ケースを足し、`pnpm test` 緑を確認する
- [x] 3.10 `present`（`現在` / `Present`）を `src/lib/career.ts` から `src/lib/site.ts` の `ui` に移す（design D10）。`formatPeriod` は在職中の文字列を引数で受け取る形にし、`src/pages/[lang]/career.astro` が `ui[lang].present` を渡す。`tests/unit/{career,site}.test.ts` を合わせ、`pnpm test` / `pnpm build` 緑と `dist/ja/career/index.html` に `現在` が残っていることを確認する
- [x] 3.11 `src/lib/career.ts` の ponytail をまとめて行う（`formatMonth` の `month: lang === 'ja' ? 'long' : 'short'` は死んだ分岐なので `'short'` 固定に、ISO 文字列の `localeCompare` を単純比較に、`[...xs].sort(f)` 3 か所を `xs.toSorted(f)` に）。`pnpm test` が既存のまま緑で、`pnpm build` 後の `dist/ja/career/index.html` と `dist/en/career/index.html` の日付表記が変わっていないことを diff で確認する
- [x] 3.12 実績の種別集合（`talk` / `article` / `award` / `other`）が `src/lib/site.ts` と `src/content/schemas.ts` に二重定義されているのを、zod の enum から `z.infer` で導出する形に一本化する。`pnpm typecheck` / `pnpm test` 緑を確認する
- [x] 3.13 `src/pages/[lang]/career.astro` で、データが 0 件の区画（`experience` / `skills` / `certifications` / `achievements` / `patents`）を見出しごと出さないようにし、`bullets` が空のとき `<ul></ul>` を出さないようにする。`pnpm build` 後の `dist/ja/career/index.html` が現状と変わらないこと（実データはどれも 0 件でない）と、いずれか 1 つを一時的に空にしたビルドで区画が消えることを確認する

## 4. e2e と CI（単位 D）

- [x] 4.1 `tests/e2e/paths.ts` に検査対象の 9 パスを 1 つ置き、`a11y.spec.ts` と `network.spec.ts` の両方がそれを読む形にする。`pnpm e2e` で `network.spec.ts` の件数が 5 から 9 に増え、すべて緑であることを出力で確認する
- [x] 4.2 `tests/e2e/global-setup.ts` を、起動前に `pnpm exec astro preview status` を確認して既に動いていれば起動せず例外を投げる形にする（メッセージに `pnpm exec astro preview stop` を含める）。`tests/e2e/global-teardown.ts` は自分が起動したときだけ停止する。別ポートで先にプレビューを起動した状態で `pnpm e2e` が非 0 で終わり、そのプレビューが生き残っていることを実行して確認する
- [x] 4.3 `tests/e2e/pages.spec.ts` の hreflang の検査に対応づけの固定を足す（`hreflang="ja"` の href が `/ja/…`、`en` が `/en/…`、`x-default` が `ja` と同じ）。`dist` の href を 1 本書き換えると落ちることを隔離実行で示す
- [x] 4.4 `tests/e2e/links.spec.ts` の `const dist = 'dist'` の cwd 依存をリポジトリルート基準に直し、別ディレクトリから `pnpm exec playwright test` を起動しても落ちないことを実行して確認する
- [ ] 4.5 `.github/workflows/deploy.yml` の `permissions` を job 単位に下ろす（`build` は `contents: read`、`deploy` は `pages: write` と `id-token: write`）。PR 作成後に deploy が動かないことを確認し、マージ後の deploy 実行の成否を PR にコメントする

## 5. base と弱い assert（単位 D に含める）

- [x] 5.1 `tests/unit/i18n.test.ts` に `stripBase` の接頭辞**固定**のテスト（`stripBase('/x/portfolio/ja/', '/portfolio/')` → 変化なし）と `normalizeBase` の両端トリムのテスト（`'portfolio'` / `'/portfolio'` / `'portfolio/'` がすべて `/portfolio/`）を足す。RED にならない（現状で通る）ことを確認したうえで、`startsWith` を `includes` に、`normalizeBase` を `return base` に変えると落ちることを隔離実行で示す
- [x] 5.2 `src/lib/i18n.ts` の `stripBase` の到達しない分岐（`path === prefix.slice(0, -1)`）を削除し、`toLocale` のエラーメッセージを `JSON.stringify(value)` にして空文字と `undefined` を見分けられるようにする。`tests/unit/i18n.test.ts` の `toThrow()` を `toThrow('undefined')` と `toThrow('""')` に締め、JSDoc 3 行を 1 行にする。`pnpm test` 緑を確認する
- [x] 5.3 `src/lib/site.ts` の `assetPath` を削除して `withBase` に一本化し、呼び出し元（`BaseLayout.astro`）を差し替える。`tests/unit/site.test.ts` の該当テストを移すか削り、`pnpm build` 後の `dist/ja/index.html` の `<link rel="icon">` の href が変わっていないことを確認する
- [x] 5.4 `src/lib/site.ts` の `canonicalUrl` から `lang` 引数を落として内部で `localeFromPath` する形にし、`site` にパスがある場合（`https://example.com/sub/`）にそれを捨てない形に直す。`tests/unit/site.test.ts` に `site` にパスがあるケースを足し、標準挙動の確認にしかなっていない「URL オブジェクトの site も受ける」を含む 4 本を畳む。`pnpm test` / `pnpm build` 緑と `dist` の canonical が変わっていないことを確認する
- [x] 5.5 `tests/unit/photo.test.ts` の `toContain('f/2')` を全文固定に変え（`f/2.8` でも通ってしまう）、`src/lib/photo.ts` の `dateLocale` マップを削除して `Intl` に `lang` をそのまま渡す（出力が同一であることを測って示す）。`neighbors` の範囲判定のコメントと 4 行の JSDoc を、実際に守っているものだけ書いた 1 行にする。`src/lib/photo.ts` の JSDoc のレンズ表記を spec と同じ `XF 23mm F1.4 R LM WR` に直す。`pnpm test` / `pnpm build` 緑を確認する
- [x] 5.6 `tests/unit/site.test.ts` の弱い assert を締める（`achievementKind` の `article` / `award` / `other` を `toEqual` で 4 件まとめて固定、photos 関連のキーの存在だけを見ている assert を値まで固定）。締めたあと、ラベルを取り違える変異で落ちることを隔離実行で示す

## 6. 仕上げの細部（単位 D に含める）

- [ ] 6.1 `src/pages/404.astro` の `<span class="dot">` と `<a class="dot">` を `<p class="dot">` にまとめ、`main > p:last-child { margin-bottom: 0 }` で上下の対称を取る。`pnpm build` 後に 1280px と 390px のスクリーンショットで崩れていないことを確認する
- [ ] 6.2 `src/components/Header.astro` の `showNav ? languageSwitch(...) : undefined` と内側の `{sw && …}` を、`const sw = languageSwitch(path, lang, base)` に寄せてガードを 1 つにする。`pnpm build` 後に `dist/ja/index.html` のヘッダーが 4 リンク、`dist/404.html` が 1 リンクであることを grep で確認する
- [ ] 6.3 `openspec/specs/profile-and-career/spec.md` の「トップページの連絡先リンク」の Scenario を、廃止済みの `mailto:hello@example.com` に依存しない例に置き換える（`specs/profile-and-career/spec.md` の delta と同じ内容）。`openspec validate followup-hardening --strict` が valid であることを確認する
- [ ] 6.4 `CLAUDE.md` を更新する: 「写真を差し替えるときは 2 点に注意する」の段落を削除してタスク 1.5 がコードで両方を吸収したことを 1 行に置き換え、「次にやること」の候補から「OGP と Twitter Card の追加」を外し、この change を Change 9 として一覧に足す。`git diff CLAUDE.md` で意図した変更だけであることを確認する
- [ ] 6.5 `openspec archive` の後に `openspec/specs/{content-schema,layout-shell,photo-pipeline,profile-and-career,quality-gates}/spec.md` を目視で確認し、この change の delta が既存の要求（特に `content-schema` の日付の段落と Scenario）を落としていないことを確かめる。これは PR のマージとアーカイブの後に行う

## 7. 仕上げ

- [ ] 7.1 `pnpm lint` / `pnpm typecheck` / `pnpm test` / `pnpm build` / `pnpm e2e` の 5 コマンドをすべて実行し、コマンドと出力を報告に添える。`openspec validate followup-hardening --strict` が valid で `git status --short` が空であることを確認する
- [ ] 7.2 実装の開始時と PR 作成の直前に `git diff --name-only main...feature/photo-height-cap` を確認し、禁止リスト以外のファイルに広がっていないことを確かめる。広がっていれば `main` を取り込んで解消する
- [ ] 7.3 `reviewer`（Opus）でブランチ全体を「仕様準拠（5 つの delta）→ コード品質 → ponytail」の順にレビューする。Critical / Important を反映し、Minor は本ファイル末尾の「提案」に転記する。結果を change の GitHub Issue にまとめて 1 回コメントする
- [ ] 7.4 `gh api user --jq .login` が `joe-yama` であることを確認してから push し、`Closes #<Issue 番号>` を本文に含む PR を作る。CI が緑であることを確認して Issue にコメントする

## 提案（後続へ）

<!-- レビューで出た Minor と、実装中に気づいた change 外の改善をここに書く -->

`photo-height-cap`（Issue #23）との衝突を避けるために今回送ったもの:

- 写真の個別ページの `og:image` と `description` を、そのページの写真に基づくものにする（`[slug].astro` と `BaseLayout.astro` の `image?` prop）
- `PhotoPicture.astro` の寸法計算を `pictureSizing(original, targetWidths)` として `src/lib/photo.ts` に出す（テストできない `.astro` の中にしかない）
- `neighbors` が `{ current, prev, next }` を返す形にし、`[slug].astro` の `find` + `findIndex` の二重引きと到達しない `throw` 2 つを消す
- `PhotoPicture.astro` の `eager` prop を `priority` に改名する（`Picture` の同名 prop の別名でしかない）
- `PhotoPicture.astro` の `[...new Set(...)]` のラップを外す（`filter` が既に重複を除いている）
- `PhotoPicture.astro` の `inferRemoteSize` がレンダーごとに呼ばれ、同じ写真の寸法を何度も取りに行く
- `.art { margin-bottom: 1rem }` が `src/pages/[lang]/index.astro` と `src/pages/404.astro` に重複している（`global.css` に寄せられる）
- 写真が 3 枚以上になったときの個別ページの「中間ケース」（前後とも出る）の描画確認

この change で「実施不要」と判定したもの:

- `src/lib/career.ts` の `toLocalDate` の `NaN` ガード、`to` の falsy 判定、`src/pages/[lang]/photos/[slug].astro` の 2 つの `throw`。上流のスキーマが形式を保証しており到達不能（reviewer が実測済み）
- 設計書の「`hreflang` を全ページに出す」が `/404.html` に当てはまらない件。振る舞いの正本は `openspec/specs/layout-shell/spec.md` 側で、実害が無い
- `sitemap.xml` の `<lastmod>`（PO 決定 2026-09-21）
- `deploy.yml` の `withastro/action@v6` の内部 install に `--frozen-lockfile` が無い件。action の input から変えられず、自前ビルドへの置き換えは割に合わない
- `tests/unit/site.test.ts` の接頭辞なしパスのケースと `tests/unit/i18n.test.ts` の分岐の重複。合成レイヤを見ているので据え置き
- `src/pages/favicon.svg.ts` の `Content-Type` ヘッダ（`astro dev` でだけ効く。消さずに残す）
