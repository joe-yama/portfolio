# Spec Delta

## MODIFIED Requirements

### Requirement: 経歴のデータ構造
経歴は言語ごとに 1 件存在し、`highlights`（経歴の要約。空でない文字列の配列で 1〜4 件）、`experience`（職歴の配列）、`skills`（カテゴリ名から名前の配列への対応）、`certifications`（資格の配列）、`achievements`（実績の配列）、`patents`（特許の配列）を持たなければならない（MUST）。職歴は `from`（日付）、`to`（日付、または在職中を表す `null`）、`organization`、`role`、`bullets`（要点。最大 5 件）を持たなければならない（MUST）。資格は `date`、`name`、任意の `url`、任意の `group`（束ねて表示するためのグループ名。空でない文字列）を持ち、実績はさらに `kind`（`talk` / `article` / `award` / `other`）を持たなければならない（MUST）。

資格と実績の `date` は、年月まで（`YYYY-MM`）と年月日まで（`YYYY-MM-DD`）のどちらでも書けなければならない（MUST）。どちらの形式でもない値はビルドを失敗させなければならない（MUST）。同じ配列の中で 2 つの形式が混ざってよい（MAY）。

日付は暦として存在する日でなければならない（MUST）。形式は合っていても暦に存在しない日（`2025-02-30` など）はビルドを失敗させなければならない（MUST）。存在しない日を黙って別の日に繰り上げてはならない（MUST NOT）。

`skills` のカテゴリ名は、数字だけの文字列であってはならない（MUST NOT）。数字だけのカテゴリ名はビルドを失敗させなければならない（MUST）。これは、書かれた順が保たれない並びになるためである。

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

#### Scenario: 存在しない日
- **WHEN** `date` が `2025-02-30` または `2025-11-31` の資格をビルドする
- **THEN** ビルドは失敗し、暦に存在しない日であることを示すエラーを出す

#### Scenario: うるう年の 2 月 29 日
- **WHEN** `date` が `2024-02-29` の実績をビルドする
- **THEN** ビルドは成功する

#### Scenario: 数字だけのスキルのカテゴリ名
- **WHEN** `skills` に `2024` というカテゴリ名を持つ経歴をビルドする
- **THEN** ビルドは失敗し、カテゴリ名が数字だけであることを示すエラーを出す

#### Scenario: highlights が欠けた経歴
- **WHEN** `highlights` を持たない経歴をビルドする
- **THEN** ビルドは失敗し、欠けている項目名を含むエラーを出す

#### Scenario: highlights の件数
- **WHEN** `highlights` が 0 件、または 5 件の経歴をビルドする
- **THEN** ビルドは失敗する

#### Scenario: highlights が 4 件
- **WHEN** `highlights` が 4 件の経歴をビルドする
- **THEN** ビルドは成功する

#### Scenario: group を持つ資格
- **WHEN** `group` が `AWS 認定` の資格と、`group` を持たない資格が混ざった経歴をビルドする
- **THEN** ビルドは成功する

#### Scenario: 空の group
- **WHEN** `group` が空文字列の資格をビルドする
- **THEN** ビルドは失敗する

### Requirement: 経歴の日英の件数一致
`highlights`、`experience`、`certifications`、`achievements`、`patents` の件数は、日本語版と英語版で一致しなければならない（MUST）。`skills` は、カテゴリの数と、並び順で対応する各カテゴリの項目数が、日本語版と英語版で一致しなければならない（MUST）。カテゴリ名そのものは言語ごとに異なってよい（`言語` と `Languages` のように訳語になる）。一致しない場合はビルドを失敗させ、どの配列が何件対何件か（`skills` では何番目のカテゴリか）を示さなければならない（MUST）。

表示は日付などの比較キーによる安定ソートで並ぶため、日英の項目は書かれた位置で対応づく。したがって、日本語版と英語版で同じ位置にある項目は、並び替えの比較キーが一致しなければならない（MUST）。比較キーは `certifications` と `achievements` では `date`、`patents` では `countries` の件数と `filedAt` の組とする。一致しない場合はビルドを失敗させ、どの配列の何番目の項目が、どの値とどの値で食い違っているかを示さなければならない（MUST）。

資格の `group` は言語ごとに訳語になってよい（`AWS 認定` と `AWS Certifications`）が、付き方は日本語版と英語版で一致しなければならない（MUST）。すなわち、同じ位置の資格は `group` の有無が一致し、かつ、日本語版で同じ `group` を持つ位置の組は、英語版でも同じ `group` を持ち、日本語版で異なる `group` を持つ位置の組は、英語版でも異なる `group` を持たなければならない（MUST）。一致しない場合はビルドを失敗させ、何番目の資格かを示さなければならない（MUST）。

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

#### Scenario: 同じ位置の資格の日付が食い違う
- **WHEN** 日英とも `certifications` が 2 件で、2 番目の `date` が日本語版 `2016-03`・英語版 `2018-06` でビルドする
- **THEN** ビルドは失敗し、エラーに `certifications` と 2 番目であることと両方の日付が含まれる

#### Scenario: 同じ位置の特許の比較キーが食い違う
- **WHEN** 日英とも `patents` が 3 件で、1 番目の `filedAt` が日本語版 `2021-03`・英語版 `2019-08` でビルドする
- **THEN** ビルドは失敗し、エラーに `patents` と 1 番目であることと両方の値が含まれる

#### Scenario: 同じ位置の日付が一致する
- **WHEN** 日英の `certifications` が同じ順に並び、各位置の `date` が一致した状態でビルドする
- **THEN** 名前が訳語で違っていてもビルドは成功する

#### Scenario: highlights の件数が一致しない
- **WHEN** 日本語版の `highlights` が 4 件、英語版が 3 件でビルドする
- **THEN** ビルドは失敗し、エラーに `highlights` と両方の件数が含まれる

#### Scenario: group の有無が食い違う
- **WHEN** 日英とも `certifications` が 3 件で、2 番目の資格が日本語版だけ `group` を持つ状態でビルドする
- **THEN** ビルドは失敗し、エラーに `certifications` と 2 番目であることが含まれる

#### Scenario: group の分け方が食い違う
- **WHEN** 日本語版の 1・2 番目の資格が同じ `group` を持ち、英語版の 1・2 番目が異なる `group` を持つ状態でビルドする
- **THEN** ビルドは失敗し、エラーに `certifications` と食い違う位置が含まれる

#### Scenario: group 名が訳語で違う
- **WHEN** 日本語版の `group` が `AWS 認定`、英語版の同じ位置の `group` が `AWS Certifications` でビルドする
- **THEN** ビルドは成功する
