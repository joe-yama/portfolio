# Spec Delta

## MODIFIED Requirements

### Requirement: SNS 共有カード

`/ja/` と `/en/` の下のすべてのページは、SNS に貼られたときのカードを構成するメタデータを出力しなければならない（MUST）。内訳は次のとおり: 種別、そのページ自身の絶対 URL、題名、説明、サイト名、ロケール、カード画像（その URL・幅・高さ・代替テキスト）、およびカード形式の指定。

そのページ自身の絶対 URL は `canonical` と同じ値でなければならない（MUST）。題名は `<title>`、説明は `<meta name="description">` と同じ値でなければならない（MUST）。ロケールはそのページのロケールに対応する地域付きの表記（日本語は `ja_JP`、英語は `en_US`）でなければならない（MUST）。

カード画像は 1200×630 でなければならず（MUST）、写真の個別ページではその写真から、それ以外のページではサイトが持つ代表写真から生成し（MUST）、同一オリジンの絶対 URL で参照しなければならない（MUST）。外部ホストの画像を直接参照してはならない（MUST NOT）。カード画像の代替テキストは、生成元の写真のそのロケールの `alt` でなければならない（MUST）。カード形式は大きな画像を伴う形式でなければならない（MUST）。

ロケールの接頭辞を持たないページ（404）は、これらを一切出力してはならない（MUST NOT）。

#### Scenario: 日本語トップの共有カード

- **WHEN** `/ja/` をビルドする
- **THEN** `og:type`、`og:url`、`og:title`、`og:description`、`og:site_name`、`og:locale`、`og:image`、`og:image:width`、`og:image:height`、`og:image:alt`、`twitter:card` がそれぞれ 1 本ずつ出力される
- **AND** `og:locale` は `ja_JP`、`twitter:card` は `summary_large_image` である

#### Scenario: 英語ページの共有カード

- **WHEN** `/en/career/` をビルドする
- **THEN** `og:locale` は `en_US`、`og:url` は同じページの `canonical` と同じ値、`og:title` は `<title>` と同じ値、`og:description` は `<meta name="description">` と同じ値である

#### Scenario: カード画像

- **WHEN** どのページでも `og:image` を検査する
- **THEN** `href` はビルド出力に含まれる同一オリジンの絶対 URL で、`og:image:width` は `1200`、`og:image:height` は `630` である
- **AND** その URL を取得すると成功する

#### Scenario: 404 の共有カード

- **WHEN** `/404.html` をビルドする
- **THEN** `og:` で始まるメタデータも `twitter:` で始まるメタデータも 1 本も無い

#### Scenario: 写真の個別ページの共有カード

- **WHEN** 代表写真ではない写真の個別ページ `/ja/photos/<slug>/` をビルドする
- **THEN** `og:image` の URL は `/ja/` の `og:image` の URL と異なり、`og:image:alt` はその写真の日本語の `alt` と一致する
- **AND** `og:image:width` は `1200`、`og:image:height` は `630` で、その URL を取得すると成功する

#### Scenario: 写真以外のページの共有カード

- **WHEN** `/en/career/` と `/en/photos/` をビルドする
- **THEN** `og:image` の URL は `/en/` の `og:image` の URL と同じで、`og:image:alt` は代表写真の英語の `alt` と一致する
