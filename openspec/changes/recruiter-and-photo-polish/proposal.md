# Proposal

## Why

公開サイトを実際に見て回ったところ（2026-09-23）、主目的（採用担当に経歴を見せる）と副目的（写真を見せる）の両方に、見る人に効く穴が見つかった。

- トップには "Builder, photographer, coffee lover" しか無く、何の仕事の人か分からない
- 経歴ページでいちばん強い材料（特許 65 発明、AWS 認定 12 資格）がページの下のほうに散らばっている
- 資格 14 件のうち 12 件が AWS で、一覧が長い
- PC 幅では代表写真が約 430×290px しかなく、設計書の「写真主役」に反する
- 写真のページを SNS に貼っても、カードにはトップの代表写真が出る

直近の change（`followup-minors` 1〜3）はテストとビルド時の検査を固める作業が中心だった。ここからは、サイトを見る人に見える改善に戻る。PO の承認は 2026-09-24、brainstorming の会話で得ている。

## What Changes

- ~~**A1 仕事の一行**~~ **（取り下げ。PO 決定 2026-09-24、PR #61 のレビュー後）**: 実装後に PO が「やはりなしのほうがよい」と判断した。スキーマ・YAML・トップの表示から `headline` を消し、description は `tagline` のままにする。以下は当初の案: `profile` に必須の `headline` を足し、トップの名前の直下に表示する。既存の `tagline` はその下に残す。`<meta name="description">`（`og:description` もこれに連動する）の内容を `tagline` から `headline` に切り替える
  - ja: 「コネクテッドカーのデータ基盤をつくるプロダクトオーナー」
  - en: "Product owner for a connected-car data platform"
  - どちらも会社名は出さない（PO 決定）
- **A3 経歴の要約**: `career` に必須の `highlights`（短い文字列を 1〜4 件）を足し、経歴ページの `Career` 見出しの直下、職歴の区画の前に、見出しを付けない箇条書きで表示する。件数が日英で一致しない場合はビルドを失敗させる。文言は YAML に手で書く（PO 決定）
- **A4 資格の束ね**: 資格に任意の `group` を足す。同じ `group` の資格は 1 行（期間 · グループ名と件数）にまとめ、`<details>` を開くと内訳が見えるようにする。実データでは AWS 認定 12 件をまとめる（PO 決定）。`group` の付き方が日英で食い違う場合はビルドを失敗させる
- **B2 トップの横並び**: 幅 64rem（1024px）以上では、トップを「写真を左、名前・肩書・導線・連絡先を右」の横並びにし、写真の高さの上限を「画面の高さからヘッダーと余白を引いた値」まで広げる。64rem 未満は今の縦並びのまま（PO 決定）。CSS だけで行う。トップだけ本文の幅の上限（80rem）を外し、左右の余白をヘッダーと同じ 1rem にする（PO 決定 2026-09-24）
- **B3 写真ごとの共有カード**: 写真の個別ページでは、`og:image` をその写真から作る（1200×630、中央切り抜き）。`og:image:alt` もその写真の代替テキストにする。ほかのページは今までどおり代表写真を使う

## Capabilities

### New Capabilities

（なし）

### Modified Capabilities

- `content-schema`: 経歴に `highlights`（必須、1〜4 件）と資格の `group`（任意）を足す。日英の一致の検査の対象に `highlights` の件数と `group` の付き方を加える
- `profile-and-career`: 64rem 以上ではトップを横並びにし、トップの本文の幅の上限を外す。経歴ページの冒頭に要約を置く。資格を `group` ごとに束ねて表示する
- `layout-shell`: 写真の個別ページでは、共有カードの画像をその写真にする
- `photo-pipeline`: 写真の表示高さの上限について、64rem 以上のトップでは横並びの列の中で上限を当てることを明記する（写真を切り取らない・縦横比を保つという要求は変わらない）

## Impact

- **データ**: `src/content/career/{ja,en}.yaml`（`highlights`、AWS 認定 12 件への `group`）を編集する。`docs/content-authoring.md` に新しい項目を書き足す
- **コード**:
  - `src/content/schemas.ts`
  - `src/lib/validate.ts`（日英の一致の検査）
  - `src/lib/career.ts`（資格を束ねる純関数）
  - `src/lib/site.ts`（`ui` の文字列）
  - `src/layouts/BaseLayout.astro`（description と、共有カードに使う写真を受け取る引数）
  - `src/pages/[lang]/index.astro`（横並びの CSS）
  - `src/pages/[lang]/career.astro`
  - `src/pages/[lang]/photos/[slug].astro`
- **テスト**: `tests/unit/`（スキーマ・束ねる関数・日英の一致）、`tests/e2e/`（横並び、初見表示、description、共有カード、資格の `<details>`）
- **依存**: 追加しない
- **含めない**:
  - メールリンク（A2）、印刷用 CSS（A6）、学歴（A7）、人物の構造化データ（C2）
  - 写真の差し替え（B1）、Search Console への登録（C1）
  - 職歴の文言を厚くすること（A5）
  - 64rem 未満のトップの見た目の変更
