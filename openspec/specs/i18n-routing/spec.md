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
サイトのルート（公開時のパス接頭辞を含む）へのアクセスは、既定ロケールのトップへリダイレクトされなければならない（MUST）。リダイレクトは静的な HTML（`<meta http-equiv="refresh">` または同等）で実現し、JavaScript を必要としてはならない（MUST NOT）。遷移先は公開時のパス接頭辞を含んでいなければならない（MUST）。

#### Scenario: ルートの出力
- **WHEN** ビルドする
- **THEN** ルートに対応する HTML が出力され、既定ロケールのトップへの遷移指示を含み、`<script` を含まない

#### Scenario: パス接頭辞の下でのリダイレクト先
- **WHEN** パス接頭辞が `/portfolio` の設定でビルドし、ルートの HTML の遷移先を見る
- **THEN** 遷移先は `/portfolio/ja/` である（`/ja/` ではない）

### Requirement: 同じページの他言語版 URL
任意のページの URL から、同じページの他言語版の URL を求められなければならない（MUST）。言語接頭辞だけが置き換わり、それ以降のパスは保たれる。接頭辞を持たないパスが渡された場合は、対象ロケールの接頭辞を先頭に付けたパスを返す。公開時のパス接頭辞が付いたパスを渡しても、言語接頭辞だけが置き換わらなければならない（MUST）。

#### Scenario: 写真の個別ページ
- **WHEN** `/ja/photos/2025-kyoto-dawn/` の英語版 URL を求める
- **THEN** `/en/photos/2025-kyoto-dawn/` が返る

#### Scenario: トップ
- **WHEN** `/en/` の日本語版 URL を求める
- **THEN** `/ja/` が返る

#### Scenario: 接頭辞のないパス
- **WHEN** `/photos/` の英語版 URL を求める
- **THEN** `/en/photos/` が返る

#### Scenario: パス接頭辞付きのパス
- **WHEN** 接頭辞が `/portfolio/` の環境で `/portfolio/ja/photos/x/` の英語版 URL を求める
- **THEN** `/portfolio/en/photos/x/` が返る（`/en/portfolio/ja/photos/x/` ではない）

### Requirement: パスからのロケール判定
URL のパスから、そのページのロケールを判定できなければならない（MUST）。判定は公開時のパス接頭辞に影響されてはならない（MUST NOT）。接頭辞を取り除いた先頭のセグメントが `ja` または `en` のときそのロケールを返し、それ以外は「ロケールなし」を返す。

#### Scenario: 日本語のパス
- **WHEN** `/ja/career/` を判定する
- **THEN** `ja` が返る

#### Scenario: ロケールを持たないパス
- **WHEN** `/photos/` または `/` を判定する
- **THEN** 「ロケールなし」が返る

#### Scenario: 似た接頭辞
- **WHEN** `/japan/` を判定する
- **THEN** 「ロケールなし」が返る

#### Scenario: パス接頭辞付きのパス
- **WHEN** 接頭辞が `/portfolio/` の環境で `/portfolio/en/career/` を判定する
- **THEN** `en` が返る

#### Scenario: パス接頭辞そのもの
- **WHEN** 接頭辞が `/portfolio/` の環境で `/portfolio/` を判定する
- **THEN** 「ロケールなし」が返る

### Requirement: サイト内リンクのパス生成

サイト内のリンクとアセットのパスは、公開時のパス接頭辞を前置した形で出力されなければならない（MUST）。ページのテンプレートに、接頭辞を含まない絶対パスを直接書いてはならない（MUST NOT）。

#### Scenario: ヘッダーのリンク

- **WHEN** 接頭辞が `/portfolio/` の設定でビルドし、`/en/career/` のヘッダーの 4 リンクの `href` を見る
- **THEN** すべてが `/portfolio/` で始まる

#### Scenario: ファビコン

- **WHEN** 接頭辞が `/portfolio/` の設定でビルドし、出力 HTML の `link[rel=icon]` を見る
- **THEN** `href` は `/portfolio/favicon.svg` である

#### Scenario: テンプレートへの直書きの禁止

- **WHEN** ページとコンポーネントのテンプレートを検査する
- **THEN** 接頭辞を含まない `/` 始まりの `href` / `src` の直書きは無い
