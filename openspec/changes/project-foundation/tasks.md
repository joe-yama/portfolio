# Tasks

各タスクの手順・コードの雛形・期待出力は `docs/superpowers/plans/2026-09-17-project-foundation.md` の同じ番号の Task にある。実装は `implementer`（Sonnet）、各タスクのレビューは `reviewer`（Opus）で行う（`.claude/rules/review.md`）。

## 1. pnpm + Astro の初期化

- [x] 1.1 `.node-version`（26.8.2）、`package.json`（`packageManager: pnpm@12.4.2`、scripts dev/build/preview/typecheck）、`pnpm-workspace.yaml`（`allowBuilds: esbuild, sharp`。pnpm 12 では `onlyBuiltDependencies` が効かないため置き換え）を作り、`pnpm add astro` / `pnpm add -D @astrojs/check typescript@^6`（7 系は `astro check` 未対応）で `pnpm-lock.yaml` が生成され「Ignored build scripts」の警告が出ないことを確認する
- [x] 1.2 `astro.config.ts`（`site`、`trailingSlash: 'always'`、i18n `ja`/`en` + `prefixDefaultLocale: true` + `redirectToDefaultLocale: false`、`image.domains: ['github.com']`）と `tsconfig.json`（strict）、`/` → `/ja/` の自前リダイレクトページ `src/pages/index.astro`（`<meta http-equiv="refresh" content="0;url=/ja/">`、script なし。Astro の自動リダイレクトはルート index を要求し競合警告を出すため使わない）、仮の `src/pages/ja/index.astro` を作り、`.gitignore` に `.astro/` を足し、`pnpm typecheck` と `pnpm build` が警告なしの終了コード 0 で `dist/index.html` と `dist/ja/index.html` を出すことを確認する
- [x] 1.3 計画の「確認ポイント」（`src/content.config.ts` と `astro/loaders` の `glob`、`astro/zod`、i18n 設定キー名、`[lang]` 動的セグメントとの併用、`getViteConfig`）を `node_modules/astro/` の型定義で確認し、想定と違う点を Issue にコメントする

## 2. Biome

- [x] 2.1 `pnpm add -D @biomejs/biome` と `biome.json`（対象から `dist` `.astro` `pnpm-lock.yaml` に加え、gh skill 管理の第三者コードを含む `.claude` とハーネス設定 `.mcp.json` を除外）を追加し、scripts に `lint`（`biome check . --error-on-warnings`。Biome は warning だけでは exit 0 のため）と `format`（修正）を足し、`pnpm lint` が診断 0 件・終了コード 0 で終わること、未使用変数を仮に入れたファイルで非 0 になることを確認する

## 3. Vitest と i18n ユーティリティ

- [x] 3.1 `pnpm add -D vitest`、`vitest.config.ts`（`getViteConfig`。`astro check` が `test` キーの型を解決できるよう先頭に `/// <reference types="vitest/config" />`）、scripts `test` を追加し、空のテストで `pnpm test` が動くことを確認する
- [x] 3.2 `tests/unit/i18n.test.ts` を先に書き（`localeFromPath`: `/ja/career/`→`ja`、`/photos/`・`/`・`/japan/`→`null`。`alternatePath`: `/ja/photos/x/`+`en`→`/en/photos/x/`、`/en/`+`ja`→`/ja/`、`/photos/`+`en`→`/en/photos/`。`otherLocale`）、RED を確認してから `src/lib/i18n.ts`（`locales`、`Locale`、`defaultLocale`、`isLocale`、`otherLocale`、`localeFromPath`、`alternatePath`）を実装し、`pnpm test` が緑になることを確認する

## 4. 内容データの Zod スキーマ

- [x] 4.1 `tests/unit/schemas.test.ts` を先に書く: profile（必須 3 項目、`tagline` 欠落で失敗、リンク `kind` の列挙、未知の `kind` で失敗、`links: []` は通る）、career（`bullets` 5 件は通り 6 件で失敗、`to` は省略と `null` の両方が通る、`achievements.kind` の列挙）、photos（全項目で通る、`alt.en` 欠落・`exif.iso` 欠落・`aperture` 文字列・`order` 非整数で失敗、`image` が URL 形式でないと失敗、`takenAt` は `Date` と `YYYY-MM-DD` 文字列だけ通り `null` / 数値は失敗）。RED を確認する
- [x] 4.2 `src/content/schemas.ts`（`PHOTO_BASE_URL`、`photoSchema`、`careerSchema`、`profileSchema`、型 `Photo`/`Career`/`Profile`/`Localized`）を `astro/zod`（Zod v4。`z.url()`、`takenAt` は `z.coerce.date()` でなく `z.union([z.date(), isoDate.transform(...)])`）だけで実装し、`pnpm test` 緑・`pnpm typecheck` 0 を確認する

## 5. スキーマで表せない制約の検証

- [x] 5.1 `tests/unit/validate.test.ts` を先に書く: `validatePhotos`（正常で空配列、`featured` 2 枚で両 slug を含むエラー、`featured` 0 枚でエラー、`order` 重複で値と両 slug を含むエラー、他ホストの URL / ファイル名が slug と違う URL で slug と URL を含むエラー、0 枚で空配列）、`validateCareerParity`（一致で空配列、`achievements` 2 対 1 で配列名と両件数を含むエラー）、`assertValid`（空なら何もしない、1 件以上で `subject` を含む `Error`）。RED を確認する
- [x] 5.2 `src/lib/validate.ts`（`PhotoEntry`、`validatePhotos`、`validateCareerParity`、`assertValid`）を実装し、`pnpm test` 緑・`pnpm lint` 0 を確認する

## 6. コンテンツコレクションとサンプルデータ、言語別トップ

- [ ] 6.1 `src/content.config.ts`（`glob` ローダー + Task 4 のスキーマで `profile` / `career` / `photos` を定義）と、日英のサンプル `src/content/profile/{ja,en}.yaml`・`src/content/career/{ja,en}.yaml`（件数一致、プレースホルダーの名前と一行紹介）を作り、`pnpm typecheck` が 0 になることを確認する
- [ ] 6.2 `src/lib/content.ts`（`getPhotos`: 検証済み `order` 昇順、`getProfile(lang)`、`getCareer(lang)`: 日英件数を検証してから返す）を実装し、`pnpm typecheck` 0 を確認する
- [ ] 6.3 `src/pages/[lang]/index.astro`（`getStaticPaths` で `locales`、`<html lang>`、名前と一行紹介のみ、`<script>` なし）を作って仮の `src/pages/ja/index.astro` を消し（リダイレクト用の `src/pages/index.astro` は残す）、`pnpm build` 後に `dist/ja/index.html` と `dist/en/index.html` に各言語の名前が入ること、`dist/index.html` が `/ja/` へのリダイレクトを含むこと、`dist/**/*.html` に `<script` が無いことを `grep` で確認する
- [ ] 6.4 サンプルの `career/en.yaml` の `achievements` を 1 件減らして `pnpm build` が `achievements` と件数を含むエラーで失敗することを確認し、元に戻してビルドが通ることを確認する（ビルド時検証の実効性）

## 7. ハーネスへの反映（設計書 §8.1）

- [ ] 7.1 `.claude/hooks/lint-on-edit.sh` の `detect_lint()` を `pnpm exec biome check "$file"` に、`.claude/hooks/test-on-stop.sh` の `detect_test()` を `pnpm test` に Write / Edit ツールで置き換え、ヘッダーコメントの「未決定」を直し、合成 JSON をパイプして lint 違反ファイルで rc=2、正常ファイルで rc=0 になることを確認する
- [ ] 7.2 `.claude/rules/testing.md` のコマンド節（`pnpm test` / `pnpm lint` / `pnpm typecheck`、`pnpm e2e` は Change 5 で追加と明記）、`CLAUDE.md` のコマンド表と「hooks は何も実行せず通過する」の記述、`docs/harness/README.md` §5-5 を更新し、記述したコマンドがすべて実際に存在することを `pnpm run` の一覧で確認する

## 8. GitHub Actions CI

- [ ] 8.1 `.github/workflows/ci.yml`（`pull_request` と `main` への `push`、`pnpm/action-setup` + `actions/setup-node` `node-version-file: .node-version`、`pnpm install --frozen-lockfile`、`lint → typecheck → test → build`）を書き、actions のメジャーバージョンを Marketplace で確認し、PR 作成後に `gh run watch` で緑になることを確認する

## 9. 仕上げ

- [ ] 9.1 `pnpm lint && pnpm typecheck && pnpm test && pnpm build` がすべて 0 で、`git status --short` が空であることを確認し、本ファイルの完了項目を `[x]` にしてコミットする
- [ ] 9.2 `reviewer`（Opus）でブランチ全体を「仕様準拠（specs 3 件）→ コード品質 → ponytail」の順にレビューし、指摘を修正して再レビューが Approved になったら結果を Issue にコメントする
- [ ] 9.3 `gh api user --jq .login` が `joe-yama` であることを確認してから push し、`Closes #1` を本文に含む PR を作り、CI 緑を確認して Issue に「PR 作成、CI 緑」をコメントする
