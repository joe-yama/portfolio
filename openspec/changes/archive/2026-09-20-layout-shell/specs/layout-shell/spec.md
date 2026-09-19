# Spec Delta

## Purpose

全ページに共通するレイアウト（メタデータ、ヘッダー、フッター、配色、フォント、ドット絵、404 ページ）を定め、写真主役のミニマルな見た目と日英の行き来を、どのページでも同じ形で提供する。

## ADDED Requirements

### Requirement: ページのメタデータ
`/ja/` と `/en/` の下のすべてのページは、そのページのロケールを `<html lang>` に持ち、`<title>` を出力しなければならない（MUST）。`<title>` はトップではプロフィールの名前、それ以外のページでは「ページ名 · 名前」の形でなければならない（MUST）。

#### Scenario: 日本語トップの title
- **WHEN** `/ja/` をビルドする
- **THEN** `<html lang="ja">` を持ち、`<title>` は `profile/ja.yaml` の `name` と一致する

#### Scenario: 英語トップの title
- **WHEN** `/en/` をビルドする
- **THEN** `<html lang="en">` を持ち、`<title>` は `profile/en.yaml` の `name` と一致する

### Requirement: 言語代替リンク
`/ja/` と `/en/` の下のすべてのページは、`<link rel="alternate" hreflang="...">` を `ja`、`en`、`x-default` の 3 本出力しなければならない（MUST）。`ja` と `en` の `href` は同じページの各言語版の絶対 URL、`x-default` の `href` は `ja` と同じでなければならない（MUST）。絶対 URL の起点はサイトの設定値を使う。

#### Scenario: 日本語トップの代替リンク
- **WHEN** サイトが `https://example.com` で `/ja/` をビルドする
- **THEN** `hreflang="ja"` と `hreflang="x-default"` の `href` は `https://example.com/ja/`、`hreflang="en"` の `href` は `https://example.com/en/` になる

#### Scenario: 下位ページの代替リンク
- **WHEN** `/en/career/` の代替リンクを求める
- **THEN** `ja` は `/ja/career/`、`en` は `/en/career/`、`x-default` は `/ja/career/` を指す

### Requirement: ヘッダー
`/ja/` と `/en/` の下のすべてのページは、ヘッダーに次の 4 つのリンクをこの順で持たなければならない（MUST）: ロゴ（そのロケールのプロフィールの `name` を表示し、そのロケールのトップへ）、「Photos」（そのロケールの `/photos/`）、「Career」（そのロケールの `/career/`）、言語切り替え（相手の言語名を表示し、同じページの他言語版へ。日本語ページでは「English」、英語ページでは「日本語」）。ナビの表示は両ロケールで英字とする。ヘッダーは開閉式のメニューを持ってはならない（MUST NOT）。

#### Scenario: 日本語ページのヘッダー
- **WHEN** `/ja/career/` を表示する
- **THEN** ロゴは `profile/ja.yaml` の `name` を表示して `/ja/` へ、「Photos」は `/ja/photos/` へ、「Career」は `/ja/career/` へ、「English」は `/en/career/` へリンクする

#### Scenario: 英語トップのヘッダー
- **WHEN** `/en/` を表示する
- **THEN** ロゴは `profile/en.yaml` の `name` を表示して `/en/` へ、言語切り替えは「日本語」を表示して `/ja/` へリンクする

#### Scenario: 言語切り替えの hreflang
- **WHEN** どのページでも言語切り替えのリンクを見る
- **THEN** `hreflang` 属性に相手のロケールを持つ

#### Scenario: 狭い画面
- **WHEN** 幅 320px の画面で表示する
- **THEN** 4 つのリンクはすべて表示されたままで、横スクロールは発生しない

### Requirement: フッター
すべてのページ（404 を含む。`/` の静的リダイレクトページは表示用のページではないため除く）は、フッターに「©」、年、プロフィールの名前を含む 1 行を持たなければならない（MUST）。年はビルド時の西暦とする。

#### Scenario: フッターの内容
- **WHEN** 2026 年に `/ja/` をビルドする
- **THEN** フッターに `© 2026` と `profile/ja.yaml` の `name` が含まれる

### Requirement: モノトーン配色と OS 設定への追従
ページの背景色と文字色はモノトーン（無彩色）でなければならない（MUST）。ライトとダークは OS の `prefers-color-scheme` に追従して切り替わり、ページ内に切り替え UI を置いてはならない（MUST NOT）。本文と背景のコントラスト比は両テーマで 4.5:1 以上でなければならない（MUST）。リンクはキーボードフォーカス時に視認できる枠を持たなければならない（MUST）。

#### Scenario: ダークモード
- **WHEN** `prefers-color-scheme: dark` の環境で表示する
- **THEN** 背景は暗色、文字は明色になり、コントラスト比は 4.5:1 以上である

#### Scenario: ライトモード
- **WHEN** `prefers-color-scheme: light` の環境で表示する
- **THEN** 背景は明色、文字は暗色になり、コントラスト比は 4.5:1 以上である

#### Scenario: キーボード操作
- **WHEN** Tab キーでヘッダーのリンクに移動する
- **THEN** フォーカス中のリンクに視認できる枠が表示される

### Requirement: ドット文字フォントの自己配信
ロゴ、ナビ、言語切り替え、見出しは DotGothic16 で表示されなければならない（MUST）。フォントファイルはビルド出力に含まれ、同一オリジンから配信されなければならない（MUST）。フォントの読み込み中も文字は代替フォントで即時に表示されなければならない（MUST）。本文はシステムフォントとする。

#### Scenario: フォントの参照先
- **WHEN** ビルド後の HTML と CSS を検査する
- **THEN** `@font-face` の `src` はすべて同一オリジンのパスで、`fonts.googleapis.com` や `fonts.gstatic.com` への参照は無い

#### Scenario: 読み込み中の表示
- **WHEN** フォントが未取得の状態でページを表示する
- **THEN** `@font-face` の `font-display` は `swap` で、文字は代替フォントで表示される

### Requirement: ドット絵
ドット絵はページに直接埋め込まれたベクター図形（インライン SVG）で表現し、外部の画像ファイルを参照してはならない（MUST NOT）。拡大時にぼやけないよう、格子の辺がくっきり描画されなければならない（MUST）。色は周囲の文字色に追従しなければならない（MUST）。装飾目的のドット絵は支援技術から隠すか、意味を持つ場合は代替テキストを持たなければならない（MUST）。

#### Scenario: トップのアイコン
- **WHEN** `/ja/` をビルドする
- **THEN** ドット絵は `<svg>` として HTML に含まれ、`<img>` での画像参照は無い

#### Scenario: ダークモードでの色
- **WHEN** ダークモードで表示する
- **THEN** ドット絵の色は文字色と同じ明色になる

### Requirement: 404 ページ
ビルド出力は `/404.html` を含まなければならない（MUST）。404 ページはドット絵 1 点、日本語と英語の「見つからない」旨の文言、`/ja/` と `/en/` へのリンクを持たなければならない（MUST）。ナビと言語切り替えを持ってはならず（MUST NOT）、フッターは他のページと共通とする。

#### Scenario: 404 の出力
- **WHEN** ビルドする
- **THEN** `dist/404.html` が存在し、`/ja/` と `/en/` へのリンク、日英の文言、`<svg>` を含む

#### Scenario: 404 のヘッダー
- **WHEN** `/404.html` を表示する
- **THEN** 「Photos」「Career」と言語切り替えのリンクは無い
