## MODIFIED Requirements

### Requirement: サイトマップに載せるページ

サイトマップは、ロケールの接頭辞（`/ja/` または `/en/`）を持つすべてのページを 1 件ずつ載せなければならない（MUST）。それ以外のページ（パス接頭辞の直下にあるロケールへの振り分けページ、404 ページ）を載せてはならない（MUST NOT）。同じ URL を 2 回載せてはならない（MUST NOT）。

各 `<url>` の `<loc>` は絶対 URL でなければならず、サイトの設定値を起点とし、公開時のパス接頭辞と末尾のスラッシュを含まなければならない（MUST）。

#### Scenario: 載るページ

- **WHEN** 写真が 2 枚ある状態でサイトマップを作る
- **THEN** `<loc>` は 12 件で、日英それぞれのトップ・経歴・写真一覧・開発物・写真 2 枚の URL がそろう

#### Scenario: 載せないページ

- **WHEN** サイトマップの `<loc>` を集める
- **THEN** `https://joe-yama.github.io/portfolio/` と 404 ページの URL は含まれない

#### Scenario: 絶対 URL の形

- **WHEN** 日本語の経歴ページの `<loc>` を見る
- **THEN** `https://joe-yama.github.io/portfolio/ja/career/` である

#### Scenario: 開発物ページの URL

- **WHEN** 英語の開発物ページの `<loc>` を見る
- **THEN** `https://joe-yama.github.io/portfolio/en/projects/` である

#### Scenario: 写真が増えたとき

- **WHEN** 写真を 1 枚増やしてサイトマップを作る
- **THEN** `<loc>` は 14 件になる
