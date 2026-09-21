# Spec Delta

## MODIFIED Requirements

### Requirement: 経歴ページ

ビルド出力は `/ja/career/` と `/en/career/` を含まなければならない（MUST）。経歴ページは職歴・スキル・資格・実績・特許の 5 つの区画をこの順で持たなければならない（MUST）。ページの `<title>` のページ名と見出しは両ロケールとも `Career` とする（MUST）。区画の見出しはロケールごとの文字列とする（MUST）。

#### Scenario: 経歴ページの出力

- **WHEN** ビルドする
- **THEN** `dist/ja/career/index.html` と `dist/en/career/index.html` が存在する

#### Scenario: ページ名と見出し

- **WHEN** `/ja/career/` を表示する
- **THEN** `<title>` は `Career · <プロフィールの名前>`、ページの最上位の見出しは `Career` である

#### Scenario: 区画の順序

- **WHEN** `/en/career/` を表示する
- **THEN** 職歴・スキル・資格・実績・特許の見出しがこの順で現れる

## ADDED Requirements

### Requirement: 特許の表示

特許は**出願国・地域の数の降順**に並べ、同数のものは `filedAt` の新しい順に並べなければならない（MUST）。どちらも同じ項目は、データに書かれた順を保たなければならない（MUST）。

各項目は、出願年月（ロケールに応じた年月の表記）、公報番号、発明の名称、出願国・地域のコードをすべて表示しなければならない（MUST）。出願国・地域はデータに書かれた順で表示する（MUST）。`url` を持つ項目の発明の名称だけを、その `url` へのリンクにしなければならない（MUST）。`url` を持たない項目をリンクにしてはならない（MUST NOT）。

先頭 5 件は、利用者の操作なしに見える状態で表示しなければならない（MUST）。6 件目以降は、既定では折りたたまれ、利用者の操作で同じページ内に展開できる状態にしなければならない（MUST）。折りたたみの見出しには、折りたたまれている件数を含めなければならない（MUST）。特許が 5 件以下の場合、折りたたみを表示してはならない（MUST NOT）。

折りたたまれた項目も、JavaScript を実行しない環境でビルド出力の HTML に含まれていなければならない（MUST）。展開のために JavaScript を使ってはならない（MUST NOT）。

#### Scenario: 出願国の数が多い順に並ぶ

- **WHEN** `countries` が 3 件の特許と 1 件の特許がある状態で `/ja/career/` を表示する
- **THEN** `countries` が 3 件の項目が先に現れる

#### Scenario: 出願国の数が同じなら新しい順

- **WHEN** `countries` がどちらも 2 件で、`filedAt` が `2019-10` と `2021-03` の特許がある状態で `/ja/career/` を表示する
- **THEN** `2021-03` の項目が先に現れる

#### Scenario: 項目の表示内容（日本語）

- **WHEN** `filedAt` が `2021-03`、`number` が `JP2021-123456A`、`countries` が `[JP, CN]` の特許を `/ja/career/` に表示する
- **THEN** `2021年3月`、`JP2021-123456A`、発明の名称、`JP` と `CN` がその項目に現れる

#### Scenario: 項目の表示内容（英語）

- **WHEN** 同じ特許を `/en/career/` に表示する
- **THEN** 出願年月は `Mar 2021` と表示される

#### Scenario: リンクの有無

- **WHEN** `url` を持つ特許と持たない特許を表示する
- **THEN** `url` を持つ特許の名称だけがその `url` へのリンクになる

#### Scenario: 6 件目以降が折りたたまれる

- **WHEN** 特許が 12 件ある状態で `/ja/career/` を表示する
- **THEN** 先頭 5 件は操作なしに見え、残り 7 件は折りたたまれており、折りたたみの見出しに `7` が含まれる

#### Scenario: 折りたたみを開く

- **WHEN** 折りたたみを開く
- **THEN** 同じページ内に残りの特許がすべて表示される

#### Scenario: 5 件以下なら折りたたまない

- **WHEN** 特許が 4 件ある状態で `/ja/career/` を表示する
- **THEN** 4 件すべてが操作なしに見え、折りたたみは現れない

#### Scenario: JavaScript なしで全件が出力される

- **WHEN** 特許が 12 件ある状態でビルドし、`dist/ja/career/index.html` を読む
- **THEN** 12 件すべての発明の名称が HTML に含まれる
