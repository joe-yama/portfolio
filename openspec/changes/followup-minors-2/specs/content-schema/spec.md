## MODIFIED Requirements

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

#### Scenario: ファイル名に `.` や大文字を含む
- **WHEN** `kamo-river-v1.2.yaml` と `Kamo.yaml` の写真ファイルがあり、それぞれの `image` が `.../photos/kamo-river-v1.2.jpg` と `.../photos/Kamo.jpg` である
- **THEN** slug はそれぞれ `kamo-river-v1.2` と `Kamo` になり、検証は通る

### Requirement: 写真の集合全体の制約
写真コレクション全体で、`featured: true` の写真はちょうど 1 枚でなければならず（MUST）、`order` の値は重複してはならない（MUST）。違反はビルドを失敗させ、該当する slug を示さなければならない（MUST）。写真が 0 枚のときも代表写真がちょうど 1 枚という制約を評価し、ビルドは失敗しなければならない（MUST）。

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
- **THEN** ビルドは失敗し、エラーに代表写真が無いことが示される

