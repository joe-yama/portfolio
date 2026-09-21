# Spec Delta

## MODIFIED Requirements

### Requirement: 経歴の日英の件数一致
`experience`、`certifications`、`achievements` の件数は、日本語版と英語版で一致しなければならない（MUST）。`skills` は、カテゴリの数と、並び順で対応する各カテゴリの項目数が、日本語版と英語版で一致しなければならない（MUST）。カテゴリ名そのものは言語ごとに異なってよい（`言語` と `Languages` のように訳語になる）。一致しない場合はビルドを失敗させ、どの配列が何件対何件か（`skills` では何番目のカテゴリか）を示さなければならない（MUST）。

#### Scenario: 件数が一致する
- **WHEN** 日英とも `experience` 3 件、`certifications` 1 件、`achievements` 2 件、`skills` 2 カテゴリ（項目数はカテゴリごとに 3 件と 1 件）でビルドする
- **THEN** ビルドは成功する

#### Scenario: 件数が一致しない
- **WHEN** 日本語版の `achievements` が 2 件、英語版が 1 件でビルドする
- **THEN** ビルドは失敗し、エラーに `achievements` と両方の件数が含まれる

#### Scenario: skills のカテゴリ数が一致しない
- **WHEN** 日本語版の `skills` が 3 カテゴリ、英語版が 2 カテゴリでビルドする
- **THEN** ビルドは失敗し、エラーに `skills` と両方のカテゴリ数が含まれる

#### Scenario: 対応するカテゴリの項目数が一致しない
- **WHEN** 日英とも `skills` が 2 カテゴリで、1 番目のカテゴリの項目が日本語版 3 件・英語版 2 件でビルドする
- **THEN** ビルドは失敗し、エラーに何番目のカテゴリかと両方の項目数が含まれる

#### Scenario: カテゴリ名が言語ごとに違う
- **WHEN** 日本語版の `skills` が `言語: [Python]`、英語版が `Languages: [Python]` でビルドする
- **THEN** ビルドは成功する
