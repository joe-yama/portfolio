# i18n-routing Specification

## Purpose

日本語と英語の全ページを言語接頭辞付きの URL で提供し、訪問者がどのページからでも同じページの他言語版へ移動できるようにする。

## Requirements

### Requirement: 言語接頭辞付きの URL
サイトのすべてのページは `/ja/` または `/en/` の下に置かれなければならない（MUST）。ロケールは `ja`（既定）と `en` の 2 つのみとする。URL は末尾スラッシュ付きで生成されなければならない（MUST）。

#### Scenario: 日本語トップ
- **WHEN** ビルドする
- **THEN** `/ja/` に対応する HTML が出力され、`<html lang="ja">` を持つ

#### Scenario: 英語トップ
- **WHEN** ビルドする
- **THEN** `/en/` に対応する HTML が出力され、`<html lang="en">` を持つ

#### Scenario: 接頭辞なしのページは存在しない
- **WHEN** ビルドする
- **THEN** 出力に `/ja/` `/en/` の外側のページは、ルートのリダイレクトと `/404.html` を除いて存在しない

### Requirement: ルートから既定ロケールへのリダイレクト
`/` へのアクセスは `/ja/` へリダイレクトされなければならない（MUST）。リダイレクトは静的な HTML（`<meta http-equiv="refresh">` または同等）で実現し、JavaScript を必要としてはならない（MUST NOT）。

#### Scenario: ルートの出力
- **WHEN** ビルドする
- **THEN** ルートに対応する HTML が出力され、`/ja/` への遷移指示を含み、`<script` を含まない

### Requirement: 同じページの他言語版 URL
任意のページの URL から、同じページの他言語版の URL を求められなければならない（MUST）。言語接頭辞だけが置き換わり、それ以降のパスは保たれる。接頭辞を持たないパスが渡された場合は、対象ロケールの接頭辞を先頭に付けたパスを返す。

#### Scenario: 写真の個別ページ
- **WHEN** `/ja/photos/2025-kyoto-dawn/` の英語版 URL を求める
- **THEN** `/en/photos/2025-kyoto-dawn/` が返る

#### Scenario: トップ
- **WHEN** `/en/` の日本語版 URL を求める
- **THEN** `/ja/` が返る

#### Scenario: 接頭辞のないパス
- **WHEN** `/photos/` の英語版 URL を求める
- **THEN** `/en/photos/` が返る

### Requirement: パスからのロケール判定
URL のパスから、そのページのロケールを判定できなければならない（MUST）。先頭のセグメントが `ja` または `en` のときそのロケールを返し、それ以外は「ロケールなし」を返す。

#### Scenario: 日本語のパス
- **WHEN** `/ja/career/` を判定する
- **THEN** `ja` が返る

#### Scenario: ロケールを持たないパス
- **WHEN** `/photos/` または `/` を判定する
- **THEN** 「ロケールなし」が返る

#### Scenario: 似た接頭辞
- **WHEN** `/japan/` を判定する
- **THEN** 「ロケールなし」が返る
