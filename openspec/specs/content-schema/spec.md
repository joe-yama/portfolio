# content-schema Specification

## Purpose

サイトの内容（プロフィール、経歴、写真）を YAML で入稿できるようにし、その構造と集合全体の制約をビルド時に検証して、壊れたデータが公開されないようにする。

## Requirements

### Requirement: プロフィールのデータ構造
プロフィールは言語ごとに 1 件（`ja` と `en`）存在し、`name`（名前）、`tagline`（一行紹介）、`links`（連絡先リンクの配列）を持たなければならない（MUST）。各リンクは `label`、`url`（URL 形式）、`kind`（`github` / `email` / `x` / `linkedin` / `other` のいずれか）を持たなければならない（MUST）。

#### Scenario: 必須項目が揃ったプロフィール
- **WHEN** `name`、`tagline`、`links` を持ち、各リンクが `label` / `url` / `kind` を持つプロフィールをビルドする
- **THEN** ビルドは成功し、ページに `name` が出力される

#### Scenario: 必須項目が欠けたプロフィール
- **WHEN** `tagline` が無いプロフィールをビルドする
- **THEN** ビルドは失敗し、欠けている項目名を含むエラーを出す

#### Scenario: 未知のリンク種別
- **WHEN** リンクの `kind` に `mastodon` を指定してビルドする
- **THEN** ビルドは失敗する

### Requirement: 経歴のデータ構造
経歴は言語ごとに 1 件存在し、`experience`（職歴の配列）、`skills`（カテゴリ名から名前の配列への対応）、`certifications`（資格の配列）、`achievements`（実績の配列）、`patents`（特許の配列）を持たなければならない（MUST）。職歴は `from`（日付）、`to`（日付、または在職中を表す `null`）、`organization`、`role`、`bullets`（要点。最大 5 件）を持たなければならない（MUST）。資格は `date`、`name`、任意の `url` を持ち、実績はさらに `kind`（`talk` / `article` / `award` / `other`）を持たなければならない（MUST）。

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

### Requirement: 経歴の日英の件数一致
`experience`、`certifications`、`achievements`、`patents` の件数は、日本語版と英語版で一致しなければならない（MUST）。`skills` は、カテゴリの数と、並び順で対応する各カテゴリの項目数が、日本語版と英語版で一致しなければならない（MUST）。カテゴリ名そのものは言語ごとに異なってよい（`言語` と `Languages` のように訳語になる）。一致しない場合はビルドを失敗させ、どの配列が何件対何件か（`skills` では何番目のカテゴリか）を示さなければならない（MUST）。

表示は日付などの比較キーによる安定ソートで並ぶため、日英の項目は書かれた位置で対応づく。したがって、日本語版と英語版で同じ位置にある項目は、並び替えの比較キーが一致しなければならない（MUST）。比較キーは `certifications` と `achievements` では `date`、`patents` では `countries` の件数と `filedAt` の組とする。一致しない場合はビルドを失敗させ、どの配列の何番目の項目が、どの値とどの値で食い違っているかを示さなければならない（MUST）。

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

### Requirement: 特許のデータ構造と公報番号の一意性
特許は 1 つの発明につき 1 件とし、同じ発明の各国出願（同族）をまとめて 1 件として扱う。各特許は `filedAt`（`YYYY-MM` 形式の出願年月。同族のうち最も早い出願の年月）、`title`（その言語で、発明の内容が推測できる短い見出し）、`number`（代表となる公報番号）、`countries`（出願国・地域のコードの配列。1 件以上）、`url`（公報の外部ページを指す URL 形式）を持たなければならない（MUST）。`countries` の先頭は `number` が属する国・地域とする（MUST）。

`title` は公報に記載された正式な発明の名称ではなく、**その発明が何をするものかを 1 行で表した見出し**とする。公報の正式名称は「情報処理装置、記録媒体および情報処理方法」のような定型で、複数の発明が同じ文字列になり、読み手が内容を区別できないためである。`title` は日本語で 40 文字以内、英語で 90 文字以内でなければならない（MUST）。これを超える場合はビルドを失敗させ、エラーに該当する `number` と文字数を含めなければならない（MUST）。

`countries` の先頭が `number` の先頭 2 文字の国・地域コードと一致しない場合、ビルドを失敗させなければならず（MUST）、エラーには該当する `number` と `countries` の先頭の値を含めなければならない（MUST）。この検証は日本語・英語の両方のデータに対して行う（MUST）。

同じ言語のデータの中で `number` が重複してはならない（MUST NOT）。重複がある場合はビルドを失敗させ、エラーに重複した `number` を含めなければならない（MUST）。

#### Scenario: 必須項目が揃った特許
- **WHEN** `filedAt`、`title`、`number`、`countries`、`url` を持つ特許をビルドする
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

#### Scenario: url が欠けている
- **WHEN** `url` を持たない特許をビルドする
- **THEN** ビルドは失敗する

#### Scenario: 公報番号が重複している
- **WHEN** 同じ言語のデータに `number` が `JP6549500B2` の特許が 2 件ある状態でビルドする
- **THEN** ビルドは失敗し、エラーに `JP6549500B2` が含まれる

#### Scenario: 出願国の先頭が代表公報の国と一致する
- **WHEN** `number` が `JP6549500B2`、`countries` が `[JP, CN, US]` の特許をビルドする
- **THEN** ビルドは成功する

#### Scenario: 出願国の先頭が代表公報の国と違う
- **WHEN** `number` が `JP6549500B2`、`countries` が `[CN, JP]` の特許をビルドする
- **THEN** ビルドは失敗し、エラーに `JP6549500B2` と `CN` が含まれる

#### Scenario: 英語のデータだけが食い違う
- **WHEN** 日本語のデータは整合しているが、英語のデータで同じ特許の `countries` の先頭が代表公報の国と違う
- **THEN** ビルドは失敗する

#### Scenario: 見出しが 1 行に収まる長さ
- **WHEN** 日本語の `title` が 40 文字、英語の `title` が 90 文字の特許をビルドする
- **THEN** ビルドは成功する

#### Scenario: 日本語の見出しが長すぎる
- **WHEN** 日本語の `title` が 41 文字の特許をビルドする
- **THEN** ビルドは失敗し、エラーに該当する `number` と文字数が含まれる

#### Scenario: 英語の見出しが長すぎる
- **WHEN** 英語の `title` が 91 文字の特許をビルドする
- **THEN** ビルドは失敗し、エラーに該当する `number` と文字数が含まれる

### Requirement: 写真のデータ構造
写真は 1 枚につき 1 ファイルで、ファイル名（拡張子を除く）を slug とする。各写真は `image`（URL）、`order`（整数）、`featured`（真偽値）、`takenAt`（日付）、`title` / `location` / `alt`（それぞれ `ja` と `en` の両方を持つ文字列）、`exif`（`camera`、`lens`、`aperture`（数値）、`shutterSpeed`（文字列）、`iso`（整数）の 5 項目すべて）を持たなければならない（MUST）。

#### Scenario: 必須項目が揃った写真
- **WHEN** 上記の全項目を持つ写真をビルドする
- **THEN** ビルドは成功する

#### Scenario: alt の英語が欠けた写真
- **WHEN** `alt` に `ja` だけを持つ写真をビルドする
- **THEN** ビルドは失敗する

#### Scenario: exif が 4 項目の写真
- **WHEN** `exif` に `iso` が無い写真をビルドする
- **THEN** ビルドは失敗する

### Requirement: 写真の画像 URL の形式
`image` は `https://github.com/joe-yama/portfolio/releases/download/photos/<slug>.jpg` の形式でなければならず（MUST）、`<slug>` はその写真ファイルの slug と一致しなければならない（MUST）。それ以外の URL はビルドを失敗させる。

#### Scenario: 規約どおりの URL
- **WHEN** slug `2025-kyoto-dawn` の写真の `image` が `https://github.com/joe-yama/portfolio/releases/download/photos/2025-kyoto-dawn.jpg` である
- **THEN** 検証は通る

#### Scenario: 他のホストの URL
- **WHEN** `image` が `https://example.com/2025-kyoto-dawn.jpg` である
- **THEN** ビルドは失敗し、エラーに slug と URL が含まれる

#### Scenario: ファイル名が slug と異なる
- **WHEN** slug `2025-kyoto-dawn` の写真の `image` が `.../photos/kyoto.jpg` である
- **THEN** ビルドは失敗する

### Requirement: 写真の集合全体の制約
写真コレクション全体で、`featured: true` の写真はちょうど 1 枚でなければならず（MUST）、`order` の値は重複してはならない（MUST）。違反はビルドを失敗させ、該当する slug を示さなければならない（MUST）。写真が 0 枚のときはこれらの制約を評価せず、ビルドは成功する。

#### Scenario: 代表写真が 1 枚
- **WHEN** 3 枚のうち 1 枚だけ `featured: true` で、`order` がすべて異なる
- **THEN** 検証は通る

#### Scenario: 代表写真が 2 枚
- **WHEN** 2 枚が `featured: true` である
- **THEN** ビルドは失敗し、エラーに両方の slug が含まれる

#### Scenario: 代表写真が 0 枚
- **WHEN** 写真が 2 枚以上あり、どれも `featured: true` でない
- **THEN** ビルドは失敗する

#### Scenario: order が重複
- **WHEN** 2 枚の写真が同じ `order` を持つ
- **THEN** ビルドは失敗し、エラーに重複した値と両方の slug が含まれる

#### Scenario: 写真が 0 枚
- **WHEN** 写真ファイルが 1 つも無い状態でビルドする
- **THEN** ビルドは成功する

### Requirement: 未記入プレースホルダの検出
写真の `title`、`location`、`alt` は入稿時に自動生成されず、人が記入する欄である。入稿コマンドはこれらに未記入の印として `TODO:` で始まる文字列を入れる。写真コレクションにこの印が残ったままビルドした場合、ビルドを失敗させなければならない（MUST）。失敗時は該当する slug と項目名を示さなければならない（MUST）。

#### Scenario: 記入漏れのままビルドする
- **WHEN** ある写真の日本語のタイトルが `TODO: 日本語タイトル` のままビルドする
- **THEN** ビルドは失敗し、その写真の slug と `title.ja` が示される

#### Scenario: すべて記入済み
- **WHEN** すべての写真の `title`、`location`、`alt` が両言語とも記入されている
- **THEN** ビルドは成功する

#### Scenario: 印と紛らわしい正当な値
- **WHEN** ある写真の日本語のタイトルが `TODO リストの写真` である
- **THEN** 未記入の印（`TODO:`）と一致しないため、ビルドは成功する
