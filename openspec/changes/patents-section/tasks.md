# Tasks

レビューの単位（`.claude/rules/review.md`）:

- **まとめて 1 回**: 2 と 3（スキーマ・検証・純関数。共有インターフェースに触る）
- **まとめて 1 回**: 4（表示。reviewer が Playwright MCP で `/ja/career/` `/en/career/` を実操作する）
- **まとめて 1 回**: 5（実データ。件数・並び順・リンクの実測）
- **必須**: ブランチ全体のレビュー 1 回

調査（旧タスク 1）は Google 側の遮断で完了できず、PO の決定（2026-09-21）で全件取得は後日に回した。**新たな取得は行わず**、`research/publications.md` の表 A（51 件）をそのまま入稿する。経緯と裁定は `design.md` の D7 / D7b。

## 1. 入稿データの整形

- [x] 1.1 `research/publications.md` の表 A の 51 件から入稿用の中間データ `<scratchpad>/patents.json` を作る。各件に `number`（表の公報番号）、`filedAt`（出願日の年月）、`countries`（番号の先頭 2 文字。`JP` / `CN` / `TW`）、`url`（`https://patents.google.com/patent/<番号>/ja`）、英語の `title`（表の名称）を入れる。件数が 51 であることを確認する
- [x] 1.2 各件の日本語の `title` を、英語の定型名称に対応する日本語の定型名称として `patents.json` に足す（design D7b の裁定。`JP6549500B2` と `JP7151181B2` は公報の正式名称が分かっているのでそれを使う）。51 件すべてに日英の `title` が入っていることを確認する
- [x] 1.3 `patents.json` から確認用の Markdown の表（日本語名称 / 英語名称 / 番号 / 出願年月 / 国）を作り、`<scratchpad>/patents-table.md` に保存する。日本語名称が暫定であること（D7b）を表の前書きに明記する

## 2. スキーマと日英の検証

- [x] 2.1 `tests/unit/schemas.test.ts` に `patentSchema` の失敗するテストを足す（必須項目、`filedAt` の `YYYY-MM` 形式、`countries` が空なら不可、`url` は任意）。RED を確認する
- [x] 2.2 `src/content/schemas.ts` に `patentSchema` を追加し、`careerSchema` に `patents` を足す。2.1 が GREEN になることを `pnpm test` で確認する
- [x] 2.3 `tests/unit/validate.test.ts` に `patents` の件数が日英で違うときにエラー文字列が返る失敗するテストを足す。RED を確認する
- [x] 2.4 `src/lib/validate.ts` の `validateCareerParity` のキー配列に `patents` を足し、2.3 が GREEN になることを確認する
- [x] 2.5 `career/{ja,en}.yaml` の `achievements` から「特許出願: 話題推定学習装置…」を削除し、`patents` に `JP6549500B2`（`filedAt: "2016-02"`、`countries: [JP]`、`url` は Google Patents）を 1 件だけ書く。`pnpm build` が通ることを確認する

## 3. 並び替えと年月の整形

- [x] 3.1 `tests/unit/career.test.ts` に `sortPatents` の失敗するテストを足す（国数の降順、同数なら `filedAt` の降順、どちらも同じなら記述順を保つ、元の配列を変更しない）。RED を確認する
- [x] 3.2 `src/lib/career.ts` に `sortPatents` を実装し、3.1 が GREEN になることを確認する
- [x] 3.3 `tests/unit/career.test.ts` に `formatMonth` の失敗するテストを足す（`2021-03` が ja で `2021年3月`、en で `Mar 2021`）。RED を確認する
- [x] 3.4 `src/lib/career.ts` に `formatMonth` を実装し、`formatPeriod` をこの関数を使う形に書き換える。`pnpm test` で既存の `formatPeriod` のテストが緑のままであることを確認する

## 4. 経歴ページの特許区画

- [x] 4.1 `tests/unit/site.test.ts` に、`ui` の特許の見出し（`特許` / `Patents`）と折りたたみの文言（件数を埋めたもの）の失敗するテストを足す。RED を確認する
- [x] 4.2 `src/lib/site.ts` に `careerSections.patents` と折りたたみの文言を追加し、4.1 が GREEN になることを確認する
- [x] 4.3 `src/pages/[lang]/career.astro` に特許の区画を実績の後ろに追加する。先頭 5 件を `<details>` の外、6 件目以降を `<details>` の中に置き、5 件以下なら `<details>` を出さない。各項目に出願年月・公報番号・名称（`url` があればリンク）・出願国を出す
- [x] 4.4 `tests/e2e/pages.spec.ts` に特許区画の e2e を足す（`/ja/career/` と `/en/career/` に見出しがある、先頭 5 件が展開なしで見える、`<details>` を開くと残りが見える、`url` のある項目だけがリンク）。`pnpm e2e` が通ることを確認する
- [x] 4.5 `pnpm build` 後の `dist/ja/career/index.html` に全件の名称が含まれることを確認する（JavaScript なしで到達できること）

## 5. 実データの投入

- [x] 5.1 `<scratchpad>/patents.json` から `career/ja.yaml` と `career/en.yaml` の `patents` を生成して置き換える（51 件）。日英で件数と並び順を一致させる
- [x] 5.2 `pnpm build` `pnpm test` `pnpm lint` `pnpm typecheck` `pnpm e2e` をすべて実行して緑を確認する
- [x] 5.3 `<scratchpad>/patents-table.md` の表を change の Issue にコメントする（`gh issue comment --body-file`）。日本語名称が暫定であること（D7b）と、後日に回した全件取得の範囲（`research/publications.md` の「取得できなかったもの」）を同じコメントに書く

## 6. 仕上げ

- [x] 6.1 ブランチ全体のレビューの指摘のうち Critical / Important を反映する。Minor は本ファイル末尾の「提案」に転記する
- [x] 6.2 PR を作る（本文に `Closes #<Issue 番号>` と 5.3 の確認用の表）。CI が緑であることを確認する

## 提案（後続へ）

<!-- レビューで出た Minor と、実装中に気づいた change 外の改善をここに書く -->

- **全件取得の後続 change**（PO 決定 2026-09-21 で後日に回した分）: (1) ローマ字表記 `Josuke Yamane` での発明者検索を通し、US / EP / WO を拾う、(2) 各公報の同族を解決して JP 公報番号を代表にし、`countries` を埋め、同じ発明の行をまとめる（`TWI923233B` と `TW202539941A` が既知の組）、(3) 日本語の発明の名称を公報の正式名称に置き換える（D7b の裁定の解消）、(4) 表 B の US 文献のうち `US12686354`（サイドエアバッグ）が別人かどうかを PO に確認する
- 印刷用の CSS が無く、`<details>` の中は印刷すると出ない。印刷時に全件を開く CSS（`@media print { details { display: block } summary { display: none } }`）を後続で検討する
- レビュー（単位 2+3）で出た Minor。いずれも修正ラウンドを起こさず後続へ:
  - `src/lib/career.ts` の `formatMonth` の `month: lang === 'ja' ? 'long' : 'short'` は、ja では `long` と `short` の出力が同一（ICU）なので **ja 分岐がテストで区別できない**。`month: 'short'` 固定でも spec の両ロケールの期待値を満たす
  - `tests/unit/validate.test.ts` の `patents` の parity テストが `errors.some(...)` だけで件数を見ておらず、余計なエラーが増えても緑。隣の既存テストは `toHaveLength(2)` で粒度が揃っていない
  - `tests/unit/career.test.ts` の `patents` フィクスチャがモジュールスコープの共有可変配列。「元の配列を破壊しない」テストが共有状態に依存しているのでファクトリ関数にする
  - `tests/unit/schemas.test.ts` の「`url` は任意」の 1 つ目の `expect` が「必須項目が揃えば成功する」と同一アサーションで重複
  - ponytail: `sortPatents` の 4 行 JSDoc は 1 行で足りる。`career.test.ts` のフィクスチャの `title: 't'` 6 箇所は並び替えに使わないので削れる（`net: -6 lines possible.`）
- spec `content-schema` の MUST「`countries` の先頭は `number` が属する国・地域とする」を、ビルド時に検証していない（裁定 R5 で今回は見送り）。`validateCareerParity` とは別の純関数で `countries[0] === number.slice(0, 2)` を検査する案。ただし同族を解決して代表を JP に差し替える後続の change で条件が変わる可能性があるので、そちらと合わせて判断する
- レビュー（単位 4+5 = 表示と実データ）で出た Minor。いずれも修正ラウンドを起こさず後続へ:
  - `src/pages/[lang]/career.astro` の特許の `<li>` のマークアップが、先頭 5 件用と `<details>` の中用で**完全に重複**している。片方だけ直すと表示が食い違うが、それを検出するテストは無い。`src/components/PatentItem.astro` に切り出して両方から呼ぶ
  - `tests/e2e/pages.spec.ts` の「先頭 5 件」の根拠が `> ul > li` の構造依存の件数で、「残り 46 が見えていないこと」を assert していない。`<details open>` を付ける回帰を素通りさせる。`expect(section.locator('li:visible')).toHaveCount(5)` を足す
  - `sortPatents` → `splitPatents` の**適用順を検証するテストが無い**。逆に書いても件数・summary・リンクの e2e はすべて通る（最古の 5 件が先頭に出ても緑）。先頭の項目の年月を期待する 1 行を足す
  - `validateCareerParity` は件数しか見ないので、日英で `filedAt` / `countries` が食い違うと並び順が言語間でずれてもビルドは通る（今回のデータは全項目一致を確認済み）
  - **英語ページのリンク先が Google Patents の日本語 UI（`/ja`）**になっている。英語利用者には `/en` が自然。データ（`patents.json`）由来で日英同値にした結果。PO の判断で後続の change で分ける
  - e2e のリンク検査が「`li a` の href がすべて Google Patents」だけで、**リンクが名称であること**（年月や番号でないこと）は検査していない
  - `url` を持たない特許と、`countries` が 2 件以上の特許が実データに 1 件も無いため、「url が無ければリンクにしない」「国数の降順」「`countries` の複数表示」は画面では未検証（ロジックは単体テストで担保）
  - ponytail: `splitPatents<T>` のジェネリックは呼び出しが 1 箇所なので `Career['patents']` 固定でよい。`career.test.ts` の 6 件と 12 件のテストは同じ経路を 2 回通る（`net: -14 lines possible.`）
- ブランチ全体のレビューで出た新規 Minor（マージ前に直すべきものは 0 件と判定された）:
  - `src/pages/[lang]/career.astro` の先頭コメントが「職歴・スキル・資格・実績の 4 区画」のまま。実際は 5 区画
  - `tests/e2e/pages.spec.ts` の `toContainText('46')` と `toHaveCount(51)` が実データ件数のハードコード。特許を 1 件足すだけで e2e が 2 本落ちる。件数をデータから導くか、「head + rest = 総数」の関係で書く
  - e2e の折りたたみ・リンクの検査が ja だけ。en は見出しの有無しか見ていない
  - 特許一覧が `<ul>` 2 本に割れるため、支援技術には「5 件のリスト」と「46 件のリスト」として伝わる。spec には反しないが `<details>` を `<li>` 側に寄せる等の検討余地
  - PO 向け: 同族が未解決なので、日本語の発明の名称が最多 8 行重複して見える（design の既知の代償。後続で同族をまとめれば解消する）
