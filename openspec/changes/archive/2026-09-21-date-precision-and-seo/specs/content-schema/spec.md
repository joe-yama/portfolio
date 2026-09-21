# Spec Delta

## MODIFIED Requirements

### Requirement: 経歴のデータ構造
経歴は言語ごとに 1 件存在し、`experience`（職歴の配列）、`skills`（カテゴリ名から名前の配列への対応）、`certifications`（資格の配列）、`achievements`（実績の配列）を持たなければならない（MUST）。職歴は `from`（日付）、`to`（日付、または在職中を表す `null`）、`organization`、`role`、`bullets`（要点。最大 5 件）を持たなければならない（MUST）。資格は `date`、`name`、任意の `url` を持ち、実績はさらに `kind`（`talk` / `article` / `award` / `other`）を持たなければならない（MUST）。

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
