# Spec Delta

## MODIFIED Requirements

### Requirement: トップページの連絡先リンク

`/ja/` と `/en/` のトップページは、そのロケールのプロフィールの `links` をすべてリンクとして表示しなければならない（MUST）。表示する文字は各項目の `label` とする（MUST）。`kind` が `github` または `linkedin` の項目には、その種別に対応するドット絵アイコンを表示しなければならない（MUST）。それ以外の `kind`（`email` / `x` / `other`）の項目は、`kind` を文字やアイコンとして表示してはならない（MUST NOT）。並び順はデータに書かれた順とする（MUST）。リンク先は各項目の `url` をそのまま使い、別タブで開く指定を付けてはならない（MUST NOT）。

#### Scenario: 日本語トップの連絡先

- **WHEN** `profile/ja.yaml` の `links` が 2 件（`label` が `A` で `url` が `https://example.com/a`、`kind` が `other`。`label` が `B` で `url` が `https://example.com/b`、`kind` が `other`）の順で書かれた状態で `/ja/` をビルドする
- **THEN** 本文に `A` と `B` がこの順でリンクとして現れ、`href` はそれぞれ `https://example.com/a` と `https://example.com/b` になる

#### Scenario: github と linkedin にはアイコンを表示する

- **WHEN** `kind` が `github` の項目と `kind` が `linkedin` の項目を `/ja/` または `/en/` のトップページに表示する
- **THEN** それぞれの項目にその種別に対応するドット絵アイコン（装飾目的として支援技術から隠された `<svg>`）が現れる

#### Scenario: 種別を表示しない

- **WHEN** `kind` が `email` / `x` / `other` の項目を表示する
- **THEN** その項目の文字は `label` だけで、種別を表す文字列もアイコンも現れない

#### Scenario: 別タブで開かない

- **WHEN** 連絡先リンクの属性を検査する
- **THEN** `target` 属性を持たない

### Requirement: トップページのサイト内の導線

`/ja/` と `/en/` のトップページは、本文に次の 3 つのリンクを持たなければならない（MUST）: そのロケールの写真一覧 `/photos/`、そのロケールの経歴 `/career/`、他言語版のトップ。ヘッダーに同じ行き先のリンクがあってよい。この 3 つのリンクにはそれぞれドット絵アイコンを表示しなければならない（MUST）。

#### Scenario: 日本語トップの導線

- **WHEN** `/ja/` を表示する
- **THEN** 本文に `/ja/photos/`、`/ja/career/`、`/en/` へのリンクがこの順で、それぞれドット絵アイコン付きで現れる

#### Scenario: 英語トップの導線

- **WHEN** `/en/` を表示する
- **THEN** 本文に `/en/photos/`、`/en/career/`、`/ja/` へのリンクがこの順で、それぞれドット絵アイコン付きで現れる
