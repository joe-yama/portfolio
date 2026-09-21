# Spec Delta

## MODIFIED Requirements

### Requirement: 経歴のデータ構造
経歴は言語ごとに 1 件存在し、`experience`（職歴の配列）、`skills`（カテゴリ名から名前の配列への対応）、`certifications`（資格の配列）、`achievements`（実績の配列）、`patents`（特許の配列）を持たなければならない（MUST）。職歴は `from`（日付）、`to`（日付、または在職中を表す `null`）、`organization`、`role`、`bullets`（要点。最大 5 件）を持たなければならない（MUST）。資格は `date`、`name`、任意の `url` を持ち、実績はさらに `kind`（`talk` / `article` / `award` / `other`）を持たなければならない（MUST）。

資格と実績の `date` は、年月まで（`YYYY-MM`）と年月日まで（`YYYY-MM-DD`）のどちらでも書けなければならない（MUST）。どちらの形式でもない値はビルドを失敗させなければならない（MUST）。同じ配列の中で 2 つの形式が混ざってよい（MAY）。

#### Scenario: 要点が 5 件の職歴
- **WHEN** `bullets` が 5 件の職歴をビルドする
- **THEN** ビルドは成功する

#### Scenario: 要点が 6 件の職歴
- **WHEN** `bullets` が 6 件の職歴をビルドする
- **THEN** ビルドは失敗し、上限を超えたことを示すエラーを出す

#### Scenario: 在職中の職歴
- **WHEN** `to` を `null` にした職歴をビルドする
- **THEN** ビルドは成功する

#### Scenario: patents が欠けた経歴
- **WHEN** `patents` を持たない経歴をビルドする
- **THEN** ビルドは失敗し、欠けている項目名を含むエラーを出す

#### Scenario: 年月までの日付
- **WHEN** `date` が `2025-10` の資格をビルドする
- **THEN** ビルドは成功する

#### Scenario: 年月日までの日付
- **WHEN** `date` が `2017-08-31` の実績をビルドする
- **THEN** ビルドは成功する

#### Scenario: 同じ配列で形式が混ざる
- **WHEN** `date` が `2025-10` の項目と `2017-08-31` の項目を同じ `achievements` に入れてビルドする
- **THEN** ビルドは成功する

#### Scenario: 形式が違う日付
- **WHEN** `date` が `2025` または `2025-10-1` の資格をビルドする
- **THEN** ビルドは失敗し、日付の形式が違うことを示すエラーを出す

#### Scenario: 存在しない月
- **WHEN** `date` が `2025-13` の資格をビルドする
- **THEN** ビルドは失敗する

### Requirement: 経歴の日英の件数一致
`experience`、`certifications`、`achievements`、`patents` の件数は、日本語版と英語版で一致しなければならない（MUST）。`skills` は、カテゴリの数と、並び順で対応する各カテゴリの項目数が、日本語版と英語版で一致しなければならない（MUST）。カテゴリ名そのものは言語ごとに異なってよい（`言語` と `Languages` のように訳語になる）。一致しない場合はビルドを失敗させ、どの配列が何件対何件か（`skills` では何番目のカテゴリか）を示さなければならない（MUST）。

#### Scenario: 件数が一致する
- **WHEN** 日英とも `experience` 3 件、`certifications` 1 件、`achievements` 2 件、`patents` 4 件、`skills` 2 カテゴリ（項目数はカテゴリごとに 3 件と 1 件）でビルドする
- **THEN** ビルドは成功する

#### Scenario: 件数が一致しない
- **WHEN** 日本語版の `achievements` が 2 件、英語版が 1 件でビルドする
- **THEN** ビルドは失敗し、エラーに `achievements` と両方の件数が含まれる

#### Scenario: patents の件数が一致しない
- **WHEN** 日本語版の `patents` が 40 件、英語版が 39 件でビルドする
- **THEN** ビルドは失敗し、エラーに `patents` と両方の件数が含まれる

#### Scenario: skills のカテゴリ数が一致しない
- **WHEN** 日本語版の `skills` が 3 カテゴリ、英語版が 2 カテゴリでビルドする
- **THEN** ビルドは失敗し、エラーに `skills` と両方のカテゴリ数が含まれる

#### Scenario: 対応するカテゴリの項目数が一致しない
- **WHEN** 日英とも `skills` が 2 カテゴリで、1 番目のカテゴリの項目が日本語版 3 件・英語版 2 件でビルドする
- **THEN** ビルドは失敗し、エラーに何番目のカテゴリかと両方の項目数が含まれる

#### Scenario: カテゴリ名が言語ごとに違う
- **WHEN** 日本語版の `skills` が `言語: [Python]`、英語版が `Languages: [Python]` でビルドする
- **THEN** ビルドは成功する

## ADDED Requirements

### Requirement: 特許のデータ構造
特許は 1 つの発明につき 1 件とし、同じ発明の各国出願（同族）をまとめて 1 件として扱う。各特許は `filedAt`（`YYYY-MM` 形式の出願年月。同族のうち最も早い出願の年月）、`title`（その言語での発明の名称）、`number`（代表となる公報番号）、`countries`（出願国・地域のコードの配列。1 件以上）を持たなければならない（MUST）。`url`（URL 形式）は任意とする。`countries` の先頭は `number` が属する国・地域とする（MUST）。

#### Scenario: 必須項目が揃った特許
- **WHEN** `filedAt`、`title`、`number`、`countries` を持つ特許をビルドする
- **THEN** ビルドは成功する

#### Scenario: 出願年月の形式が違う
- **WHEN** `filedAt` が `2021-3` または `2021-03-15` の特許をビルドする
- **THEN** ビルドは失敗し、`YYYY-MM` 形式を求めるエラーを出す

#### Scenario: 出願国が空
- **WHEN** `countries` が空の配列の特許をビルドする
- **THEN** ビルドは失敗する

#### Scenario: 公報番号が欠けている
- **WHEN** `number` を持たない特許をビルドする
- **THEN** ビルドは失敗する

#### Scenario: url は任意
- **WHEN** `url` を持たない特許をビルドする
- **THEN** ビルドは成功する
