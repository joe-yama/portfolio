# sitemap Specification

## Purpose
検索エンジンに渡すサイトマップの内容を定め、公開しているページの一覧と、そのページの日英の対応を機械が読める形で示す。

## Requirements

### Requirement: サイトマップの出力

ビルド出力はサイトマップを 1 つ含まなければならない（MUST）。公開されたサイトマップの URL は、サイトのトップと同じパス接頭辞の下の `/sitemap.xml` でなければならない（MUST）。内容は `http://www.sitemaps.org/schemas/sitemap/0.9` を既定の名前空間とする `<urlset>` でなければならない（MUST）。配信時の内容種別は XML でなければならない（MUST）。

#### Scenario: 出力される場所

- **WHEN** ビルドする
- **THEN** `dist/sitemap.xml` が存在する

#### Scenario: 公開 URL

- **WHEN** 公開されたサイトの `/portfolio/sitemap.xml` を取得する
- **THEN** 内容種別は XML で、本文の最上位要素は `urlset` である

### Requirement: サイトマップに載せるページ

サイトマップは、ロケールの接頭辞（`/ja/` または `/en/`）を持つすべてのページを 1 件ずつ載せなければならない（MUST）。それ以外のページ（パス接頭辞の直下にあるロケールへの振り分けページ、404 ページ）を載せてはならない（MUST NOT）。同じ URL を 2 回載せてはならない（MUST NOT）。

各 `<url>` の `<loc>` は絶対 URL でなければならず、サイトの設定値を起点とし、公開時のパス接頭辞と末尾のスラッシュを含まなければならない（MUST）。

#### Scenario: 載るページ

- **WHEN** 写真が 2 枚ある状態でサイトマップを作る
- **THEN** `<loc>` は 10 件で、日英それぞれのトップ・経歴・写真一覧・写真 2 枚の URL がそろう

#### Scenario: 載せないページ

- **WHEN** サイトマップの `<loc>` を集める
- **THEN** `https://joe-yama.github.io/portfolio/` と 404 ページの URL は含まれない

#### Scenario: 絶対 URL の形

- **WHEN** 日本語の経歴ページの `<loc>` を見る
- **THEN** `https://joe-yama.github.io/portfolio/ja/career/` である

#### Scenario: 写真が増えたとき

- **WHEN** 写真を 1 枚増やしてサイトマップを作る
- **THEN** `<loc>` は 12 件になる

### Requirement: サイトマップの言語代替

各 `<url>` は、そのページの言語代替を `xhtml` 名前空間の `<xhtml:link rel="alternate">` として `ja`、`en`、`x-default` の 3 本持たなければならない（MUST）。`href` はページの `<link rel="alternate">` と同じ絶対 URL でなければならない（MUST）。`xhtml` 名前空間は `<urlset>` で宣言しなければならない（MUST）。

#### Scenario: 代替リンクの本数

- **WHEN** 任意の `<url>` を見る
- **THEN** `xhtml:link` を 3 本持ち、`hreflang` は `ja`、`en`、`x-default` である

#### Scenario: 英語ページの代替リンク

- **WHEN** `https://joe-yama.github.io/portfolio/en/career/` の `<url>` を見る
- **THEN** `ja` と `x-default` の `href` は `https://joe-yama.github.io/portfolio/ja/career/`、`en` の `href` は `https://joe-yama.github.io/portfolio/en/career/` である
