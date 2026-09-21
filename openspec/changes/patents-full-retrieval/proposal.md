# Proposal

## Why

Change 8 `patents-section` は、取得の途中で Google Patents がこの egress を遮断したため、**取れた 51 公報をそのまま 51 件として**載せた。その結果、いまの経歴ページには 3 つの欠落がある。

1. **同族が未解決**。1 つの発明の各国出願が別々の行として並び、日本語の名称が最多 8 行重複して見える。spec は「1 つの発明につき 1 件」「`filedAt` は同族のうち最も早い出願の年月」と定めているので、**データが spec に違反している**
2. **US / EP / WO が 1 件も載っていない**。発明者のローマ字表記 `Josuke Yamane` での検索が遮断で通らなかった
3. **日本語の発明の名称が暫定**（裁定 D7b）。49 件は CN / TW の公報で、英語の定型名称から起こしたものが入っている

2026-09-22 に確認したところ遮断は解けており、ローマ字表記のクエリは 66 公報を返す（日本語表記の 51 公報とは**重複ゼロ**）。公報ページも取得でき、同族・出願国・各国語の正式名称がすべて構造化データで取れる。いま取り直せば 3 つの欠落をまとめて解消できる。

あわせて、Change 8 がレビューで後続に回した特許まわりの手直しのうち、**このデータ差し替えで壊れる番人と、片方だけ直す事故を招く重複**を同じ change で片付ける（PO 指示「change はできるだけまとめる」2026-09-21）。

## What Changes

- `src/content/career/{ja,en}.yaml` の `patents` を、**同族単位**のデータに差し替える
  - 発明者索引に `山根丈亮` / `Josuke Yamane` のどちらかで載る公報の和集合（117 公報）を起点にする
  - 各公報の発明者一覧に PO が含まれることを機械で検証し、含まれないものを落とす
  - 同族を 1 件にまとめ、JP 公報番号を代表（`number`）にし、`countries` に出願国・地域を入れる
  - `filedAt` を同族の最も早い出願の年月にする（spec の定義に合わせる）
  - 日本語の名称を JP 公報の正式名称に置き換える
  - **BREAKING ではない**。スキーマも表示も変えず、データだけが変わる
- 英語ページの Google Patents へのリンクを、英語の UI（`/en`）に向ける
- `src/components/PatentItem.astro` を新設し、`career.astro` に 2 か所ある特許の `<li>` の完全重複を解消する
- `countries` の先頭が `number` の国・地域コードと一致することを、ビルド時に検証する（Change 8 の裁定 R5 の解消）
- 特許の e2e とユニットテストの番人を補強する（件数のハードコード、折りたたみの回帰、並び替えの適用順、英語ページ）

## Capabilities

### New Capabilities

なし。

### Modified Capabilities

- `content-schema`: 「特許のデータ構造」に、`countries` の先頭が `number` の国・地域と違うときビルドを失敗させる要求を追加する（要求文の MUST は既にあるが、検証されていない）
- `profile-and-career`: 「特許の表示」に、外部リンクの言語をページの言語に合わせる要求を追加する

## Impact

- **データ**: `src/content/career/ja.yaml`、`src/content/career/en.yaml` の `patents`（件数が減り、`countries` が複数の項目が出る）
- **コード**: `src/components/PatentItem.astro`（新規）、`src/pages/[lang]/career.astro`、`src/lib/validate.ts`
- **テスト**: `tests/unit/validate.test.ts`、`tests/unit/career.test.ts`、`tests/e2e/pages.spec.ts`
- **調査**: `openspec/changes/patents-full-retrieval/research/` に取得結果と、掲載しなかった公報の理由を残す
- **外部通信**: Google Patents への読み取り（PO 承認 2026-09-22）。送るのは発明者名と公報番号だけで、どちらも既に公開サイトに載っている情報
- **依存**: 追加しない。取得は使い捨てのスクリプトで行い、リポジトリには成果物だけを残す
