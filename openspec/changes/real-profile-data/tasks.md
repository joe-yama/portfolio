# Tasks

## 1. skills の日英検証

- [x] 1.1 `tests/unit/validate.test.ts` に `validateCareerParity` の失敗テストを 4 件足す（カテゴリ数の不一致 / 対応するカテゴリの項目数の不一致 / カテゴリ名が訳語で違っても通ること / 既存の 3 配列の検証が壊れていないこと）。`pnpm exec vitest run tests/unit/validate.test.ts` が RED になることを確認する
- [x] 1.2 `src/lib/validate.ts` の `validateCareerParity` に `skills` の検証を足す（`Object.entries` の並び順で i 番目どうしを対応づけ、カテゴリ数と各カテゴリの項目数を比べる。エラーには `skills`、何番目のカテゴリか、両方の数を含める）。`pnpm test` が GREEN になることを確認する

## 2. 実データへの差し替え

- [x] 2.1 `src/content/profile/{ja,en}.yaml` を実データにする（`name` は日英とも `Josuke Yamane`、`tagline` は現職の役割、`links` は GitHub と LinkedIn の 2 本。メールは載せない）。`pnpm build` が成功することを確認する
- [x] 2.2 `src/content/career/{ja,en}.yaml` の `experience`（4 件）と `skills`（5 カテゴリ）を実データにする。`pnpm build` が成功し、1.2 の検証を通ることを確認する
- [x] 2.3 `src/content/career/{ja,en}.yaml` の `certifications`（14 件）と `achievements`（6 件）を実データにする。`pnpm build` が成功することを確認する

## 3. 実測

- [ ] 3.1 `pnpm lint` / `pnpm typecheck` / `pnpm test` / `pnpm build` / `pnpm e2e` をすべて実行し、出力を報告に添える
- [ ] 3.2 `pnpm preview` で日英 4 ページ（`/ja/`、`/en/`、`/ja/career/`、`/en/career/`）を開き、サンプルデータの文字列（`サンプル`、`Sample Inc.`、`例示`、`hello@example.com`）が 1 件も残っていないこと、職歴 4 件・資格 14 件・実績 6 件・スキル 5 カテゴリが日英とも表示されることを確認する
