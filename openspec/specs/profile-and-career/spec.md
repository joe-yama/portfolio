# profile-and-career Specification

## Purpose
名刺としてのトップページの内容（連絡先リンクとサイト内の導線）と、経歴ページ `/{ja,en}/career/` の構成・並び順・表示形式を定め、採用担当や転職エージェントが連絡先と経歴に迷わず辿り着けるようにする。

## Requirements

### Requirement: トップページの連絡先リンク

`/ja/` と `/en/` のトップページは、そのロケールのプロフィールの `links` をすべてリンクとして表示しなければならない（MUST）。表示する文字は各項目の `label` とし、種別（`kind`）を文字やアイコンとして表示してはならない（MUST NOT）。並び順はデータに書かれた順とする（MUST）。リンク先は各項目の `url` をそのまま使い、別タブで開く指定を付けてはならない（MUST NOT）。

#### Scenario: 日本語トップの連絡先

- **WHEN** `profile/ja.yaml` の `links` が `GitHub`（`https://github.com/joe-yama`）と `Email`（`mailto:hello@example.com`）の順で書かれた状態で `/ja/` をビルドする
- **THEN** 本文に `GitHub` と `Email` がこの順でリンクとして現れ、`href` はそれぞれ `https://github.com/joe-yama` と `mailto:hello@example.com` になる

#### Scenario: 種別を表示しない

- **WHEN** `/en/` を表示する
- **THEN** 連絡先リンクの文字は `label` だけで、`github` や `email` という種別の文字列は現れない

#### Scenario: 別タブで開かない

- **WHEN** 連絡先リンクの属性を検査する
- **THEN** `target` 属性を持たない

### Requirement: トップページのサイト内の導線

`/ja/` と `/en/` のトップページは、本文に次の 3 つのリンクを持たなければならない（MUST）: そのロケールの写真一覧 `/photos/`、そのロケールの経歴 `/career/`、他言語版のトップ。ヘッダーに同じ行き先のリンクがあってよい。

#### Scenario: 日本語トップの導線

- **WHEN** `/ja/` を表示する
- **THEN** 本文に `/ja/photos/`、`/ja/career/`、`/en/` へのリンクがある

#### Scenario: 英語トップの導線

- **WHEN** `/en/` を表示する
- **THEN** 本文に `/en/photos/`、`/en/career/`、`/ja/` へのリンクがある

### Requirement: 経歴ページ

ビルド出力は `/ja/career/` と `/en/career/` を含まなければならない（MUST）。経歴ページは職歴・スキル・資格・実績の 4 つの区画をこの順で持たなければならない（MUST）。ページの `<title>` のページ名と見出しは両ロケールとも `Career` とする（MUST）。区画の見出しはロケールごとの文字列とする（MUST）。

#### Scenario: 経歴ページの出力

- **WHEN** ビルドする
- **THEN** `dist/ja/career/index.html` と `dist/en/career/index.html` が存在する

#### Scenario: ページ名と見出し

- **WHEN** `/ja/career/` を表示する
- **THEN** `<title>` は `Career · <プロフィールの名前>`、ページの最上位の見出しは `Career` である

#### Scenario: 区画の順序

- **WHEN** `/en/career/` を表示する
- **THEN** 職歴・スキル・資格・実績の見出しがこの順で現れる

### Requirement: 職歴の表示

職歴は `from` の新しい順に並べなければならない（MUST）。各項目は期間・組織・役割・要点を表示しなければならない（MUST）。期間はロケールに応じた年月の表記とし、`to` を持たない項目の終わりは日本語では `現在`、英語では `Present` と表示しなければならない（MUST）。

#### Scenario: 新しい順に並ぶ

- **WHEN** `from` が `2017-04` と `2020-04` の 2 件がある状態で `/ja/career/` を表示する
- **THEN** `2020-04` の項目が `2017-04` の項目より先に現れる

#### Scenario: 在職中の期間（日本語）

- **WHEN** `from` が `2020-04` で `to` が無い項目を `/ja/career/` に表示する
- **THEN** 期間は `2020年4月 – 現在` と表示される

#### Scenario: 在職中の期間（英語）

- **WHEN** 同じ項目を `/en/career/` に表示する
- **THEN** 期間は `Apr 2020 – Present` と表示される

#### Scenario: 終わりのある期間

- **WHEN** `from` が `2017-04`、`to` が `2020-03` の項目を `/en/career/` に表示する
- **THEN** 期間は `Apr 2017 – Mar 2020` と表示される

#### Scenario: 要点

- **WHEN** 職歴の項目が要点を 2 つ持つ
- **THEN** 2 つとも表示される

### Requirement: スキルの表示

スキルはカテゴリごとに、カテゴリ名と、そのカテゴリの名前をカンマ区切りで並べた 1 行として表示しなければならない（MUST）。カテゴリの順序はデータに書かれた順とする（MUST）。

#### Scenario: カテゴリの表示

- **WHEN** `skills` が `言語: [TypeScript, Python]` を含む状態で `/ja/career/` を表示する
- **THEN** `言語` と `TypeScript, Python` が 1 行として現れる

### Requirement: 資格と実績の表示

資格と実績は、それぞれ `date` の新しい順に並べなければならない（MUST）。年月までの日付（`YYYY-MM`）は、その月の 1 日と同じ位置に置かなければならない（MUST）。並びの中で同じ位置になる項目どうしは、データに書かれた順を保たなければならない（MUST）。

各項目は日付と名前を表示しなければならない（MUST）。日付は書かれた粒度のまま、ロケールに応じた表記で表示しなければならない（MUST）。年月までの日付に日を補って表示してはならない（MUST NOT）。

実績は種別（登壇・執筆・受賞・その他）をロケールごとの文字列で表示しなければならない（MUST）。`url` を持つ項目だけを、その `url` へのリンクにしなければならない（MUST）。`url` を持たない項目をリンクにしてはならない（MUST NOT）。

#### Scenario: 新しい順に並ぶ

- **WHEN** `date` が `2023-06-01` と `2024-10-12` の実績がある状態で `/ja/career/` を表示する
- **THEN** `2024-10-12` の項目が先に現れる

#### Scenario: 粒度が混ざった並び

- **WHEN** `date` が `2025-10`、`2025-09-30`、`2025-11-01` の 3 件がある状態で `/ja/career/` を表示する
- **THEN** `2025-11-01`、`2025-10`、`2025-09-30` の順に現れる

#### Scenario: 同じ位置になる項目

- **WHEN** `date` が `2016-03` の項目 A と `2016-03-01` の項目 B を、データにこの順で書いた状態で `/ja/career/` を表示する
- **THEN** A が B より先に現れる

#### Scenario: 年月までの日付（日本語）

- **WHEN** `date` が `2025-10` の資格を `/ja/career/` に表示する
- **THEN** `2025年10月` と表示され、`1日` は現れない

#### Scenario: 年月までの日付（英語）

- **WHEN** 同じ資格を `/en/career/` に表示する
- **THEN** `October 2025` と表示される

#### Scenario: 年月日までの日付（日本語）

- **WHEN** `date` が `2017-08-31` の実績を `/ja/career/` に表示する
- **THEN** `2017年8月31日` と表示される

#### Scenario: 年月日までの日付（英語）

- **WHEN** 同じ実績を `/en/career/` に表示する
- **THEN** `August 31, 2017` と表示される

#### Scenario: 種別のラベル（日本語）

- **WHEN** `kind` が `talk` の実績を `/ja/career/` に表示する
- **THEN** `登壇` と表示される

#### Scenario: 種別のラベル（英語）

- **WHEN** 同じ実績を `/en/career/` に表示する
- **THEN** `Talk` と表示される

#### Scenario: リンクの有無

- **WHEN** `url` を持つ実績と持たない資格を表示する
- **THEN** 実績の名前は `url` へのリンクになり、資格の名前はリンクにならない

