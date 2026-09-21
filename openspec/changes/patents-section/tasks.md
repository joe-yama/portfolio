# Tasks

レビューの単位（`.claude/rules/review.md`）:

- **まとめて 1 回**: 2 と 3（スキーマ・検証・純関数。共有インターフェースに触る）
- **まとめて 1 回**: 4（表示。reviewer が Playwright MCP で `/ja/career/` `/en/career/` を実操作する）
- **まとめて 1 回**: 5（実データ。件数・並び順・リンクの実測）
- **必須**: ブランチ全体のレビュー 1 回

1 の調査は他のタスクと依存が無いので、2〜4 と並行して別のサブエージェントで進めてよい。

## 1. 特許の調査

- [ ] 1.1 Google Patents の検索 API（`https://patents.google.com/xhr/query?url=q%3Din%3A"山根丈亮"%26num%3D100`）で公報の一覧を取り、`<scratchpad>/patents-raw.json` に公報番号・出願日・名称を保存する。件数が 52 件前後であることを確認する
- [ ] 1.2 各公報のページから同族（Worldwide applications）・優先日・日英の発明の名称を取り、`patents-raw.json` に追記する。`503` は間隔を空けて再試行し、取れなかったものは `"resolved": false` を付けて残す
- [ ] 1.3 同族でまとめ、代表 `number`（JP 優先）・`filedAt`（最も早い出願の年月）・`countries`（代表の国を先頭に）を決めて `<scratchpad>/patents.json` を作る。発明の件数と、未解決のまま残った公報の件数を報告する
- [ ] 1.4 `patents.json` から確認用の Markdown の表（名称 / 番号 / 出願年月 / 国）を作り、`<scratchpad>/patents-table.md` に保存する

## 2. スキーマと日英の検証

- [ ] 2.1 `tests/unit/schemas.test.ts` に `patentSchema` の失敗するテストを足す（必須項目、`filedAt` の `YYYY-MM` 形式、`countries` が空なら不可、`url` は任意）。RED を確認する
- [ ] 2.2 `src/content/schemas.ts` に `patentSchema` を追加し、`careerSchema` に `patents` を足す。2.1 が GREEN になることを `pnpm test` で確認する
- [ ] 2.3 `tests/unit/validate.test.ts` に `patents` の件数が日英で違うときにエラー文字列が返る失敗するテストを足す。RED を確認する
- [ ] 2.4 `src/lib/validate.ts` の `validateCareerParity` のキー配列に `patents` を足し、2.3 が GREEN になることを確認する
- [ ] 2.5 `career/{ja,en}.yaml` の `achievements` から「特許出願: 話題推定学習装置…」を削除し、`patents` に `JP6549500B2`（`filedAt: "2016-02"`、`countries: [JP]`、`url` は Google Patents）を 1 件だけ書く。`pnpm build` が通ることを確認する

## 3. 並び替えと年月の整形

- [ ] 3.1 `tests/unit/career.test.ts` に `sortPatents` の失敗するテストを足す（国数の降順、同数なら `filedAt` の降順、どちらも同じなら記述順を保つ、元の配列を変更しない）。RED を確認する
- [ ] 3.2 `src/lib/career.ts` に `sortPatents` を実装し、3.1 が GREEN になることを確認する
- [ ] 3.3 `tests/unit/career.test.ts` に `formatMonth` の失敗するテストを足す（`2021-03` が ja で `2021年3月`、en で `Mar 2021`）。RED を確認する
- [ ] 3.4 `src/lib/career.ts` に `formatMonth` を実装し、`formatPeriod` をこの関数を使う形に書き換える。`pnpm test` で既存の `formatPeriod` のテストが緑のままであることを確認する

## 4. 経歴ページの特許区画

- [ ] 4.1 `tests/unit/site.test.ts` に、`ui` の特許の見出し（`特許` / `Patents`）と折りたたみの文言（件数を埋めたもの）の失敗するテストを足す。RED を確認する
- [ ] 4.2 `src/lib/site.ts` に `careerSections.patents` と折りたたみの文言を追加し、4.1 が GREEN になることを確認する
- [ ] 4.3 `src/pages/[lang]/career.astro` に特許の区画を実績の後ろに追加する。先頭 5 件を `<details>` の外、6 件目以降を `<details>` の中に置き、5 件以下なら `<details>` を出さない。各項目に出願年月・公報番号・名称（`url` があればリンク）・出願国を出す
- [ ] 4.4 `tests/e2e/pages.spec.ts` に特許区画の e2e を足す（`/ja/career/` と `/en/career/` に見出しがある、先頭 5 件が展開なしで見える、`<details>` を開くと残りが見える、`url` のある項目だけがリンク）。`pnpm e2e` が通ることを確認する
- [ ] 4.5 `pnpm build` 後の `dist/ja/career/index.html` に全件の名称が含まれることを確認する（JavaScript なしで到達できること）

## 5. 実データの投入

- [ ] 5.1 `<scratchpad>/patents.json` から `career/ja.yaml` と `career/en.yaml` の `patents` を生成して置き換える。日英で件数と並び順を一致させる
- [ ] 5.2 `pnpm build` `pnpm test` `pnpm lint` `pnpm typecheck` `pnpm e2e` をすべて実行して緑を確認する
- [ ] 5.3 `<scratchpad>/patents-table.md` の表を change の Issue にコメントする（`gh issue comment --body-file`）。未解決のまま残った公報があれば同じコメントに書く

## 6. 仕上げ

- [ ] 6.1 ブランチ全体のレビューの指摘のうち Critical / Important を反映する。Minor は本ファイル末尾の「提案」に転記する
- [ ] 6.2 PR を作る（本文に `Closes #<Issue 番号>` と 5.3 の確認用の表）。CI が緑であることを確認する

## 提案（後続へ）

<!-- レビューで出た Minor と、実装中に気づいた change 外の改善をここに書く -->

- 印刷用の CSS が無く、`<details>` の中は印刷すると出ない。印刷時に全件を開く CSS（`@media print { details { display: block } summary { display: none } }`）を後続で検討する
