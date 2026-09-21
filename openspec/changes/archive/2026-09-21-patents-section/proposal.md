# Proposal

## Why

PO は現在の経歴ページに載っている 1 件のほかに数十件の特許の発明者になっている。採用担当や転職エージェントにとって特許の件数と内容は職務経歴の裏付けになるが、いまはそのほとんどが公開サイトに現れていない。一方で数十件をそのまま並べると経歴ページが特許の一覧で埋まり、職歴・スキル・資格・実績が読まれなくなる。代表的なものを先に見せ、残りはその場で展開できる形にする。

## What Changes

- 経歴データ（`career/{ja,en}.yaml`）に `patents` を追加する。1 発明 = 1 エントリとし、同じ発明の各国出願（JP / CN / TW など）は 1 件にまとめて出願国を配列で持つ。
- 経歴ページ `/{ja,en}/career/` に 5 つ目の区画「特許 / Patents」を既存 4 区画の後ろに追加する。
- 特許は**出願国の数の降順 → 出願年月の降順**で並べ、先頭 5 件をそのまま表示し、残りを `<details>` で展開できるようにする（JavaScript は使わない）。
- 現在 `achievements` にある「特許出願: 話題推定学習装置及び話題推定学習方法（特開2017-151838）」を `patents` へ移す（同じ発明の二重掲載を避けるため）。
- `patents` の件数が日英で一致しない場合はビルドを失敗させる（`experience` などと同じ扱い）。
- 掲載するデータは Google Patents の発明者検索（日本語表記 `山根丈亮`）で取得できた 51 件とする。**ローマ字表記 `Josuke Yamane` での検索と同族の解決は、Google 側の遮断により完了できず、PO の決定（2026-09-21）で後日の change に回した**（経緯は `research/publications.md`、裁定は `design.md` の D7 / D7b）。掲載する全件の一覧は Issue と PR 本文に載せ、PO がマージ時に内容を確認できるようにする。

## Capabilities

### New Capabilities

なし。

### Modified Capabilities

- `profile-and-career`: 経歴ページの区画が 4 つから 5 つになる。「特許の表示」の要求（並び順、代表件数、残りの展開、各項目の表示内容）を新設する。`achievements` から特許 1 件が移るが、実績の表示に関する要求そのものは変わらない。
- `content-schema`: 経歴のデータ構造に `patents` を追加する。日英の件数一致の対象に `patents` を加える。

## Impact

- データ: `src/content/career/ja.yaml`、`src/content/career/en.yaml`（`patents` の追加と `achievements` からの 1 件の移動）
- スキーマと検証: `src/content/schemas.ts`（`patentSchema`）、`src/lib/validate.ts`（`validateCareerParity`）
- 表示: `src/pages/[lang]/career.astro`、`src/lib/career.ts`（並び替えと年月の整形）、`src/lib/site.ts`（区画見出しと展開の文言）
- テスト: `tests/unit/{career,schemas,validate,site}.test.ts`、`tests/e2e/pages.spec.ts`
- 依存の追加は無い。ビルド・デプロイの仕組みは変わらない。
- 実名で公開しているサイトに実データを追加するため、掲載内容の正誤は PO の確認を経る。
