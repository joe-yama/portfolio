# layout-shell Specification

## Purpose

全ページに共通するレイアウト（メタデータ、ヘッダー、フッター、配色、フォント、ドット絵、404 ページ）を定め、写真主役のミニマルな見た目と日英の行き来を、どのページでも同じ形で提供する。

## Requirements

### Requirement: ページのメタデータ
`/ja/` と `/en/` の下のすべてのページは、そのページのロケールを `<html lang>` に持ち、`<title>` を出力しなければならない（MUST）。`<title>` はトップではプロフィールの名前、それ以外のページでは「ページ名 · 名前」の形でなければならない（MUST）。

`/ja/` と `/en/` の下のすべてのページは、`<link rel="canonical">` を 1 本だけ出力しなければならない（MUST）。その `href` は、そのページ自身の絶対 URL でなければならない（MUST）。絶対 URL の起点はサイトの設定値を使い、公開時のパス接頭辞を含めなければならない（MUST）。

`/ja/` と `/en/` の下のすべてのページは、`<meta name="description">` を 1 本だけ出力しなければならない（MUST）。その内容はそのページのロケールのプロフィールの `tagline` でなければならない（MUST）。

ロケールの接頭辞を持たないページ（404）は、`canonical` と `description` のどちらも出力してはならない（MUST NOT）。

#### Scenario: 日本語トップの title
- **WHEN** `/ja/` をビルドする
- **THEN** `<html lang="ja">` を持ち、`<title>` は `profile/ja.yaml` の `name` と一致する

#### Scenario: 英語トップの title
- **WHEN** `/en/` をビルドする
- **THEN** `<html lang="en">` を持ち、`<title>` は `profile/en.yaml` の `name` と一致する

#### Scenario: 下位ページの canonical
- **WHEN** サイトが `https://example.com`、パス接頭辞が `/portfolio` の状態で `/en/career/` をビルドする
- **THEN** `<link rel="canonical">` は 1 本で、`href` は `https://example.com/portfolio/en/career/` である

#### Scenario: 日本語ページの description
- **WHEN** `/ja/career/` をビルドする
- **THEN** `<meta name="description">` は 1 本で、内容は `profile/ja.yaml` の `tagline` と一致する

#### Scenario: 英語ページの description
- **WHEN** `/en/photos/` をビルドする
- **THEN** `<meta name="description">` の内容は `profile/en.yaml` の `tagline` と一致する

#### Scenario: 404 のメタデータ
- **WHEN** `/404.html` をビルドする
- **THEN** `<link rel="canonical">` も `<meta name="description">` も持たない

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

「Photos」「Career」「言語切り替え」の 3 つのリンクは、文字の前に、トップページ本文のサイト内の導線で同じ行き先のリンクが持つものと同じドット絵アイコンを 1 つずつ持たなければならない（MUST）。アイコンは装飾として支援技術から隠さなければならず（MUST）、リンクの名前は文字だけとする。アイコンはリンクの文字の行の高さを超えてはならない（MUST NOT）。ロゴはアイコンを持ってはならない（MUST NOT）。幅 30rem（480px）未満の画面では、ヘッダーのアイコンを表示してはならない（MUST NOT）。アイコンの幅でナビが折り返し、ヘッダーが 2 行になるのを避けるため（PO 決定 2026-09-23）。

ロゴとナビが同じ行に並ぶとき、ロゴの文字とナビの 3 つのリンクの文字はベースラインがそろっていなければならない（MUST）。ずれは 0.5px 以内とする（PO 決定 2026-09-23）。

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

#### Scenario: ナビのアイコン
- **WHEN** `/ja/` と `/en/` の下のいずれかのページでヘッダーを表示する
- **THEN** 「Photos」にはカメラ、「Career」には鞄、言語切り替えには地球儀のドット絵が、トップページ本文の同じ行き先のリンクと同じ図柄で、支援技術から隠された `<svg>` として 1 つずつ現れ、ロゴには `<svg>` が無い

#### Scenario: アイコンで行が高くならない
- **WHEN** 幅 480px・高さ 844px と幅 1280px・高さ 720px の画面でヘッダーを表示する
- **THEN** アイコンを持つ各リンクの高さは、そのリンクの文字の行の高さを超えない

#### Scenario: 狭い画面ではヘッダーのアイコンを隠す
- **WHEN** 幅 390px・高さ 844px と幅 479px・高さ 844px の画面で `/ja/` と `/en/` の下のページを表示する
- **THEN** ヘッダーの 3 つのリンクのアイコンは表示されず、ロゴとナビは同じ行に並ぶ

#### Scenario: 境界の幅では 1 行のままアイコンを出す
- **WHEN** 幅 480px の画面で `/ja/` と `/en/` の下のページを表示する
- **THEN** ヘッダーの 3 つのリンクのアイコンは表示され、ロゴとナビは同じ行に並ぶ

#### Scenario: ロゴとナビの文字のベースラインがそろう
- **WHEN** 幅 1280px・高さ 720px と幅 480px・高さ 844px の画面で `/ja/` と `/en/` の下のページを表示する
- **THEN** ロゴの文字のベースラインと、ナビの 3 つのリンクの文字のベースラインの差は、どれも 0.5px 以内である

### Requirement: フッター
すべてのページ（404 を含む。`/` の静的リダイレクトページは表示用のページではないため除く）は、フッターに「©」、年、プロフィールの名前を含む 1 行を持たなければならない（MUST）。年はビルド時の西暦とする。

#### Scenario: フッターの内容
- **WHEN** 2026 年に `/ja/` をビルドする
- **THEN** フッターに `© 2026` と `profile/ja.yaml` の `name` が含まれる

### Requirement: モノトーン配色と OS 設定への追従
ページの背景色と文字色はモノトーン（無彩色）でなければならない（MUST）。ライトとダークは OS の `prefers-color-scheme` に追従して切り替わり、ページ内に切り替え UI を置いてはならない（MUST NOT）。本文と背景のコントラスト比は両テーマで 4.5:1 以上でなければならない（MUST）。補助的な文字（控えめな色で表示する説明文など）と背景のコントラスト比も両テーマで 4.5:1 以上でなければならない（MUST）。罫線と背景のコントラスト比は両テーマで 3:1 以上でなければならない（MUST）。リンクはキーボードフォーカス時に視認できる枠を持たなければならない（MUST）。

配色はサイト全体で 1 か所に定義し、他の場所（ファビコンなど）が同じ色を別に持つ場合は、その値が定義と一致していなければならない（MUST）。いずれかのコントラスト比が下限を割ったとき、および値が食い違ったときは、検証が失敗しなければならない（MUST）。

#### Scenario: ダークモード
- **WHEN** `prefers-color-scheme: dark` の環境で表示する
- **THEN** 背景は暗色、文字は明色になり、コントラスト比は 4.5:1 以上である

#### Scenario: ライトモード
- **WHEN** `prefers-color-scheme: light` の環境で表示する
- **THEN** 背景は明色、文字は暗色になり、コントラスト比は 4.5:1 以上である

#### Scenario: 罫線のコントラスト
- **WHEN** ライトとダークの両方で罫線と背景のコントラスト比を求める
- **THEN** どちらも 3:1 以上である

#### Scenario: コントラストが下限を割る
- **WHEN** 背景色を変えて罫線とのコントラスト比を 3:1 未満にする
- **THEN** 検証は失敗し、どの組み合わせが下限を割ったかを示す

#### Scenario: ファビコンの色が配色定義とずれる
- **WHEN** ファビコンが使う文字色だけを配色定義と違う値に変える
- **THEN** 検証は失敗する

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

### Requirement: favicon
すべてのページは、同一オリジンの SVG ファビコンを `<link rel="icon">` で参照しなければならない（MUST）。参照先のパスは公開時のパス接頭辞を含んでいなければならない（MUST）。ファビコンはビルド出力に含まれ、ドット絵をベクター図形で表現し、外部の画像やフォントを参照してはならない（MUST NOT）。

#### Scenario: ファビコンの出力
- **WHEN** ビルドする
- **THEN** `dist/favicon.svg` が存在し、`dist/ja/index.html` と `dist/404.html` の `<link rel="icon">` の `href` は公開時のパス接頭辞付きのファビコンのパス（接頭辞が `/portfolio` なら `/portfolio/favicon.svg`）である

#### Scenario: ブラウザのコンソール
- **WHEN** `/ja/` を表示する
- **THEN** ファビコン取得の 404 エラーがコンソールに出ない

### Requirement: SNS 共有カード

`/ja/` と `/en/` の下のすべてのページは、SNS に貼られたときのカードを構成するメタデータを出力しなければならない（MUST）。内訳は次のとおり: 種別、そのページ自身の絶対 URL、題名、説明、サイト名、ロケール、カード画像（その URL・幅・高さ・代替テキスト）、およびカード形式の指定。

そのページ自身の絶対 URL は `canonical` と同じ値でなければならない（MUST）。題名は `<title>`、説明は `<meta name="description">` と同じ値でなければならない（MUST）。ロケールはそのページのロケールに対応する地域付きの表記（日本語は `ja_JP`、英語は `en_US`）でなければならない（MUST）。

カード画像は 1200×630 でなければならず（MUST）、写真の個別ページではその写真から、それ以外のページではサイトが持つ代表写真から生成し（MUST）、同一オリジンの絶対 URL で参照しなければならない（MUST）。外部ホストの画像を直接参照してはならない（MUST NOT）。カード画像の代替テキストは、生成元の写真のそのロケールの `alt` でなければならない（MUST）。カード形式は大きな画像を伴う形式でなければならない（MUST）。

ロケールの接頭辞を持たないページ（404）は、これらを一切出力してはならない（MUST NOT）。

#### Scenario: 日本語トップの共有カード

- **WHEN** `/ja/` をビルドする
- **THEN** `og:type`、`og:url`、`og:title`、`og:description`、`og:site_name`、`og:locale`、`og:image`、`og:image:width`、`og:image:height`、`og:image:alt`、`twitter:card` がそれぞれ 1 本ずつ出力される
- **AND** `og:locale` は `ja_JP`、`twitter:card` は `summary_large_image` である

#### Scenario: 英語ページの共有カード

- **WHEN** `/en/career/` をビルドする
- **THEN** `og:locale` は `en_US`、`og:url` は同じページの `canonical` と同じ値、`og:title` は `<title>` と同じ値、`og:description` は `<meta name="description">` と同じ値である

#### Scenario: カード画像

- **WHEN** どのページでも `og:image` を検査する
- **THEN** `href` はビルド出力に含まれる同一オリジンの絶対 URL で、`og:image:width` は `1200`、`og:image:height` は `630` である
- **AND** その URL を取得すると成功する

#### Scenario: 404 の共有カード

- **WHEN** `/404.html` をビルドする
- **THEN** `og:` で始まるメタデータも `twitter:` で始まるメタデータも 1 本も無い

#### Scenario: 写真の個別ページの共有カード

- **WHEN** 代表写真ではない写真の個別ページ `/ja/photos/<slug>/` をビルドする
- **THEN** `og:image` の URL は `/ja/` の `og:image` の URL と異なり、`og:image:alt` はその写真の日本語の `alt` と一致する
- **AND** `og:image:width` は `1200`、`og:image:height` は `630` で、その URL を取得すると成功する

#### Scenario: 写真以外のページの共有カード

- **WHEN** `/en/career/` と `/en/photos/` をビルドする
- **THEN** `og:image` の URL は `/en/` の `og:image` の URL と同じで、`og:image:alt` は代表写真の英語の `alt` と一致する
