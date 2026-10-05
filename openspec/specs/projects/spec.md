# projects Specification

## Purpose
PO が個人で開発して公開しているものを `/{ja,en}/projects/` で簡単に紹介し、採用担当がトップから 1 クリックで「何を作れる人か」を確かめられるようにする。

## Requirements

### Requirement: 開発物ページ

ビルド出力は `/ja/projects/` と `/en/projects/` を含まなければならない（MUST）。ページの `<title>` のページ名と最上位の見出しは、両ロケールとも `Projects` とする（MUST）。

ページは開発物のデータをすべて、`order` の小さい順に 1 件ずつ表示しなければならない（MUST）。各項目は次のものを持たなければならない（MUST）。

- 開発物の `icon` に対応するドット絵アイコン 1 つ。装飾として支援技術から隠す（MUST）
- 名前（`name`）を文字とする第 2 階層の見出し。見出しの文字は `url` へのリンクとし、別タブで開く指定を付けてはならない（MUST NOT）
- 状態と開始年の 1 行。状態はそのロケールの `status`、開始年は日本語では `<since>年〜`、英語では `<since>–` と表示し、両者を ` · ` で区切る（MUST）
- そのロケールの `summary`（一行の説明）と `description`（紹介文）
- `tech` の各項目をデータに書かれた順に `, ` で区切った 1 行

#### Scenario: 開発物ページの出力

- **WHEN** ビルドする
- **THEN** `dist/ja/projects/index.html` と `dist/en/projects/index.html` が存在する

#### Scenario: ページ名と見出し

- **WHEN** `/en/projects/` を表示する
- **THEN** `<title>` は `Projects · <profile/en.yaml の name>`、ページの最上位の見出しは `Projects` である

#### Scenario: order の小さい順に並ぶ

- **WHEN** `order` が 2 の開発物 A と `order` が 1 の開発物 B がある状態で `/ja/projects/` を表示する
- **THEN** B の見出しが A の見出しより先に現れる

#### Scenario: 項目の表示内容（日本語）

- **WHEN** `name` が `Tomoly`、`url` が `https://tomoly.app`、`since` が `2026`、`status.ja` が `先行公開中`、`tech` が `[TypeScript, React]` の開発物を `/ja/projects/` に表示する
- **THEN** 第 2 階層の見出し `Tomoly` があり、その文字は `https://tomoly.app` へのリンクで、`target` 属性を持たない
- **AND** `先行公開中 · 2026年〜` の 1 行、`summary.ja`、`description.ja`、`TypeScript, React` の 1 行が同じ項目に現れる

#### Scenario: 項目の表示内容（英語）

- **WHEN** 同じ開発物を `/en/projects/` に表示する
- **THEN** 状態と開始年の行は `<status.en> · 2026–` で、`summary.en` と `description.en` が現れ、`summary.ja` と `description.ja` は現れない

#### Scenario: 開発物のアイコン

- **WHEN** `icon` が `tomoly` の開発物を表示する
- **THEN** その項目に、`tomoly` の図柄と座標が完全に一致する `<svg>` が 1 つ、支援技術から隠された状態で現れ、`<img>` は無い

### Requirement: ヘッダーに Projects を足さない

ヘッダーは `layout-shell` の「ヘッダー」の要求のとおりロゴ・Photos・Career・言語切り替えの 4 つだけを持ち、開発物ページへのリンクを持ってはならない（MUST NOT）。390px の画面でヘッダーが 2 行になるのを避けるため（PO 決定 2026-10-06）。開発物ページへの導線はトップページ本文のサイト内の導線とする。

#### Scenario: ヘッダーのリンク

- **WHEN** `/ja/` の下と `/en/` の下のいずれかのページでヘッダーを見る
- **THEN** ヘッダーの中に `/projects/` を含む `href` を持つリンクは無い

#### Scenario: 開発物ページの言語切り替え

- **WHEN** `/ja/projects/` でヘッダーの言語切り替えを見る
- **THEN** `EN` は `/en/projects/` へのリンクである
