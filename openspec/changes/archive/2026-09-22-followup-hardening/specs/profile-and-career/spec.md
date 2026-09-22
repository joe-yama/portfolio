# Spec Delta

## MODIFIED Requirements

### Requirement: トップページの連絡先リンク

`/ja/` と `/en/` のトップページは、そのロケールのプロフィールの `links` をすべてリンクとして表示しなければならない（MUST）。表示する文字は各項目の `label` とし、種別（`kind`）を文字やアイコンとして表示してはならない（MUST NOT）。並び順はデータに書かれた順とする（MUST）。リンク先は各項目の `url` をそのまま使い、別タブで開く指定を付けてはならない（MUST NOT）。

#### Scenario: 日本語トップの連絡先

- **WHEN** `profile/ja.yaml` の `links` が 2 件（`label` が `A` で `url` が `https://example.com/a`、`label` が `B` で `url` が `https://example.com/b`）の順で書かれた状態で `/ja/` をビルドする
- **THEN** 本文に `A` と `B` がこの順でリンクとして現れ、`href` はそれぞれ `https://example.com/a` と `https://example.com/b` になる

#### Scenario: 種別を表示しない

- **WHEN** `/en/` を表示する
- **THEN** 連絡先リンクの文字は `label` だけで、種別を表す文字列は現れない

#### Scenario: 別タブで開かない

- **WHEN** 連絡先リンクの属性を検査する
- **THEN** `target` 属性を持たない
