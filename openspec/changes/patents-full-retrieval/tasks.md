# Tasks

## Global Constraints

すべてのタスクに掛かる制約。implementer への brief に毎回そのまま渡す。

- パッケージマネージャは **pnpm**。`npm` / `npx` は使わない
- テストなしのコミットは禁止。RED → GREEN → REFACTOR を守る。テストの削除・skip・期待値の書き換えで通さない
- コミットメッセージは日本語、先頭に種別（`feat:` / `fix:` / `test:` / `docs:` / `chore:` / `refactor:`）。`tasks.md` のチェックは実装と同じコミットに含める
- 実装は spec（`openspec/changes/patents-full-retrieval/specs/`）を正とする。spec に無い機能・オプションを足さない。気づいた改善は本ファイル末尾の「提案」に書く
- 検証コマンド: `pnpm test`（単体）/ `pnpm lint` / `pnpm typecheck` / `pnpm build` / `pnpm e2e`
- **ローカルの緑を完了の根拠にしない**。CI の実行結果を最終証拠にする
- `git push --force`、`git reset --hard`、履歴の書き換え、裸の `git stash` は禁止
- 外部通信は Google Patents への読み取りだけ（PO 承認 2026-09-22）。送ってよいのは発明者名と公報番号だけ
- **部分的に取得できたデータで入稿しない**。同族が欠けると `countries` と並び順が狂う

## 1. 調査とデータの生成

- [x] 1.1 発明者クエリ 2 本の和集合 117 公報の公報ページをすべて取得し、`pages/` に 117 ファイルが揃っていること（欠けゼロ）をファイル数で確かめる。遮断されたら時間を空けて再開する（取得済みは飛ばす）。裁定 R9/R12 で代表公報の追加取得（JP 代表 43 件を `/ja`、US/EP/WO 代表 19 件を `/en`）も行い、`pages/` 136 件・`pages-ja/` 160 件、失敗 0 件
- [x] 1.2 公報ページから発明者一覧・`applications`・`countryStatus` を抽出し、D2 の規則で発明者を照合し、D1 の規則で同族にまとめ、D3〜D6 の規則で `number` / `countries` / `filedAt` / `title.ja` / `title.en` を決めた中間データ（JSON）を作る。採用件数・除外件数・JP 公報が無い同族の件数を出力して確かめる。採用 65 件・除外 1 件（117 件を過不足なくカバー）、JP 無し（暫定名称）2 件
- [ ] 1.3 中間データを独立に検証するスクリプトを書いて通す。検査項目は (a) `number` に重複が無い、(b) すべての項目で `countries[0] === number.slice(0,2)`、(c) `filedAt` が同族の最小の出願年月と一致し `YYYY-MM` 形式、(d) `countries` に重複が無く先頭以外が出願の早い順、(e) 日英で件数・`number`・`filedAt`・`countries` が一致し `title` だけが違う、(f) `title` が空でなく日本語側に ASCII だけの行が無い（暫定名称は除く）
- [ ] 1.4 `research/publications.md`（掲載する全件の表と、落とした公報の表＋落とした理由）と `research/method.md`（エンドポイント・抽出した構造化データ・照合と同族化の規則・遮断を避ける間隔）を書き、表の件数が 1.2 の出力と一致することを確かめる

## 2. ビルドの番人を先に足す

- [ ] 2.1 `src/lib/validate.ts` に `validateCareerPatents` を TDD で追加し、ビルド時の検証に組み込む。単体テストは「一致する」「先頭が違う」「英語のデータだけ違う」の 3 つを含み、エラーに `number` と `countries[0]` が含まれることを確かめる。`pnpm test` が緑
- [ ] 2.2 `tests/unit/career.test.ts` に `sortPatents` → `splitPatents` の適用順を検査するテストを追加する。並び替えを飛ばすと落ちるように、先頭の項目の `filedAt` を期待する。`pnpm test` が緑

## 3. 表示の手直し

- [ ] 3.1 `src/components/PatentItem.astro` を新設し、`career.astro` の特許の `<li>` 2 か所をこのコンポーネントの呼び出しに置き換える。`pnpm build` と既存の `pnpm e2e` が緑のまま（表示は変わらない）
- [ ] 3.2 `career.astro` 先頭のコメントを実際の 5 区画に直す。`pnpm lint` が緑

## 4. データの差し替え

- [ ] 4.1 「日本語ページと英語ページで特許のリンク先が異なる」e2e を先に書いて RED を確認し、`src/content/career/{ja,en}.yaml` の `patents` を 1.2 の中間データに差し替えて（`en.yaml` の `url` は `/en`）GREEN にする。`pnpm build` / `pnpm test` / `pnpm e2e` がすべて緑
- [ ] 4.2 `tests/e2e/pages.spec.ts` の特許の検査から件数のハードコード（51 / 46）を除き、「先頭 5 件だけが見えている」（`li:visible` が 5）「折りたたみの件数 = 総数 − 5」「英語ページでも折りたたみが開く」を検査する。`pnpm e2e` が緑

## 5. 番人が本当に番人か確かめる

- [ ] 5.1 2.1 / 2.2 / 4.1 / 4.2 で足した検査に 1 つずつ変異を当て、それぞれが落ちることを隔離実行（`docs/harness/README.md` の手順）で確かめる。当てる変異は (a) `countries[0]` の比較を常に真にする、(b) `sortPatents` を外す、(c) `<details>` に `open` を付ける、(d) `en.yaml` の `url` を `/ja` に戻す。落ちなかった検査は直してから再度確かめ、結果を本ファイルに記録する

## 6. 仕上げ

- [ ] 6.1 ブランチ全体のレビューの指摘のうち Critical / Important を反映する。Minor は本ファイル末尾の「提案」に転記する
- [ ] 6.2 PR を作る（本文に `Closes #<Issue 番号>` と、掲載する全件・落とした公報の確認用の表への導線）。CI が緑であることを確認する

## レビューの単位

`.claude/rules/review.md` に従う。タスクごとではなく次の 4 単位でレビューする。

| 単位 | 対象 | 理由 |
|---|---|---|
| A | 1.1〜1.4 | データの正しさがこの change の本体。抽出規則・照合規則・同族化の誤りはここでしか捕まえられない |
| B | 2.1〜2.2 | spec の要求（`countries` の先頭）と共有インターフェース（`validate.ts`）に触る |
| C | 3.1〜3.2 + 4.1〜4.2 | 表示とデータは一緒に見ないと「片方だけ直す事故」を検出できない。UI は reviewer 自身が Playwright MCP で `http://127.0.0.1:<port>/{ja,en}/career/` を実操作して確かめる |
| D | ブランチ全体 | 必須（1 回） |

5.1 は変異の実行結果が証拠になるので、単体のレビューは行わず D に含める。

## 提案（後続へ）

<!-- レビューで出た Minor と、実装中に気づいた change 外の改善をここに書く -->

- Change 8 が後続に回した分のうち、この change に含めないもの: 印刷用 CSS（`@media print` で `<details>` を開く）、特許一覧が `<ul>` 2 本に割れる件、`validateCareerParity` が日英で `filedAt` / `countries` の一致を見ていない件（1.3 の (e) で入稿時には確かめるが、ビルドの番人にはしていない）
