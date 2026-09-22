# Spec Delta

## ADDED Requirements

### Requirement: SNS 共有カード

`/ja/` と `/en/` の下のすべてのページは、SNS に貼られたときのカードを構成するメタデータを出力しなければならない（MUST）。内訳は次のとおり: 種別、そのページ自身の絶対 URL、題名、説明、サイト名、ロケール、カード画像（その URL・幅・高さ・代替テキスト）、およびカード形式の指定。

そのページ自身の絶対 URL は `canonical` と同じ値でなければならない（MUST）。題名は `<title>`、説明は `<meta name="description">` と同じ値でなければならない（MUST）。ロケールはそのページのロケールに対応する地域付きの表記（日本語は `ja_JP`、英語は `en_US`）でなければならない（MUST）。

カード画像は 1200×630 でなければならず（MUST）、サイトが持つ代表写真から生成し、同一オリジンの絶対 URL で参照しなければならない（MUST）。外部ホストの画像を直接参照してはならない（MUST NOT）。カード形式は大きな画像を伴う形式でなければならない（MUST）。

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

## MODIFIED Requirements

### Requirement: モノトーン配色と OS 設定への追従
ページの背景色と文字色はモノトーン（無彩色）でなければならない（MUST）。ライトとダークは OS の `prefers-color-scheme` に追従して切り替わり、ページ内に切り替え UI を置いてはならない（MUST NOT）。本文と背景のコントラスト比は両テーマで 4.5:1 以上でなければならない（MUST）。補助的な文字（控えめな色で表示する説明文など）と背景のコントラスト比も両テーマで 4.5:1 以上でなければならない（MUST）。罫線と背景のコントラスト比は両テーマで 3:1 以上でなければならない（MUST）。リンクはキーボードフォーカス時に視認できる枠を持たなければならない（MUST）。

配色はサイト全体で 1 か所に定義し、他の場所（ファビコンなど）が同じ色を別に持つ場合は、その値が定義と一致していなければならない（MUST）。いずれかのコントラスト比が下限を割ったとき、および値が食い違ったときは、検証が失敗しなければならない（MUST）。

#### Scenario: ダークモード
- **WHEN** `prefers-color-scheme: dark` の環境で表示する
- **THEN** 背景は暗色、文字は明色になり、コントラスト比は 4.5:1 以上である

#### Scenario: ライトモード
- **WHEN** `prefers-color-scheme: light` の環境で表示する
- **THEN** 背景は明色、文字は暗色になり、コントラスト比は 4.5:1 以上である

#### Scenario: 罫線のコントラスト
- **WHEN** ライトとダークの両方で罫線と背景のコントラスト比を求める
- **THEN** どちらも 3:1 以上である

#### Scenario: コントラストが下限を割る
- **WHEN** 背景色を変えて罫線とのコントラスト比を 3:1 未満にする
- **THEN** 検証は失敗し、どの組み合わせが下限を割ったかを示す

#### Scenario: ファビコンの色が配色定義とずれる
- **WHEN** ファビコンが使う文字色だけを配色定義と違う値に変える
- **THEN** 検証は失敗する

#### Scenario: キーボード操作
- **WHEN** Tab キーでヘッダーのリンクに移動する
- **THEN** フォーカス中のリンクに視認できる枠が表示される
