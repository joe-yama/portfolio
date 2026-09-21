# Spec Delta

## MODIFIED Requirements

### Requirement: ページのメタデータ
`/ja/` と `/en/` の下のすべてのページは、そのページのロケールを `<html lang>` に持ち、`<title>` を出力しなければならない（MUST）。`<title>` はトップではプロフィールの名前、それ以外のページでは「ページ名 · 名前」の形でなければならない（MUST）。

`/ja/` と `/en/` の下のすべてのページは、`<link rel="canonical">` を 1 本だけ出力しなければならない（MUST）。その `href` は、そのページ自身の絶対 URL でなければならない（MUST）。絶対 URL の起点はサイトの設定値を使い、公開時のパス接頭辞を含めなければならない（MUST）。

`/ja/` と `/en/` の下のすべてのページは、`<meta name="description">` を 1 本だけ出力しなければならない（MUST）。その内容はそのページのロケールのプロフィールの `tagline` でなければならない（MUST）。

ロケールの接頭辞を持たないページ（404）は、`canonical` と `description` のどちらも出力してはならない（MUST NOT）。

#### Scenario: 日本語トップの title
- **WHEN** `/ja/` をビルドする
- **THEN** `<html lang="ja">` を持ち、`<title>` は `profile/ja.yaml` の `name` と一致する

#### Scenario: 英語トップの title
- **WHEN** `/en/` をビルドする
- **THEN** `<html lang="en">` を持ち、`<title>` は `profile/en.yaml` の `name` と一致する

#### Scenario: 下位ページの canonical
- **WHEN** サイトが `https://example.com`、パス接頭辞が `/portfolio` の状態で `/en/career/` をビルドする
- **THEN** `<link rel="canonical">` は 1 本で、`href` は `https://example.com/portfolio/en/career/` である

#### Scenario: 日本語ページの description
- **WHEN** `/ja/career/` をビルドする
- **THEN** `<meta name="description">` は 1 本で、内容は `profile/ja.yaml` の `tagline` と一致する

#### Scenario: 英語ページの description
- **WHEN** `/en/photos/` をビルドする
- **THEN** `<meta name="description">` の内容は `profile/en.yaml` の `tagline` と一致する

#### Scenario: 404 のメタデータ
- **WHEN** `/404.html` をビルドする
- **THEN** `<link rel="canonical">` も `<meta name="description">` も持たない
