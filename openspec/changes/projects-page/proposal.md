# Proposal

## Why

名刺サイトには経歴と写真はあるが、PO が個人で作って公開しているもの（いまは Tomoly）を見せる場所が無い。採用担当がトップから 1 クリックで「何を作れる人か」を確かめられるよう、開発物を簡単に紹介するページを足す（PO 依頼 2026-10-06）。

## What Changes

- 新しいページ `/ja/projects/` と `/en/projects/`（ページ名 `Projects`）を足す。開発物ごとに、単色のドット絵アイコン、名前（公開 URL へのリンク）、状態と開始年、一行の説明、短い紹介文、主な技術を出す
- 開発物は 1 件 1 ファイルの YAML（`src/content/projects/<slug>.yaml`）で入稿し、ビルド時に検証する
- 最初の 1 件として Tomoly（`https://tomoly.app`）を載せる。掲載文は PO 承認済み（design.md の D5）
- トップ本文のサイト内の導線を Photos / Career / Projects の 3 つにする。**ヘッダーは変えない**（390px で余裕が 3.81px しかなく、項目を足すと 2 行になるため。PO 決定 2026-10-06）
- サイトマップとブラウザ検査の対象に Projects のページを加える

## Capabilities

### New Capabilities

- `projects`: 開発物の紹介ページ `/{ja,en}/projects/` の構成・並び順・表示内容

### Modified Capabilities

- `content-schema`: 開発物のデータ構造と集合全体の制約を足す
- `profile-and-career`: トップページのサイト内の導線に Projects を足す
- `sitemap`: 載るページの件数の Scenario を Projects の 2 ページぶん増やす
- `quality-gates`: ブラウザ検査の「すべての種類のページ」に Projects を足す

## Scope

**In**: 上の What Changes のすべて、`docs/content-authoring.md` への開発物の節の追加。

**Out**: ヘッダーへの Projects の追加、スクリーンショットなどの画像、開発物ごとの個別ページ、GitHub リポジトリへのリンク（Tomoly は private）、Tomoly 以外の開発物の掲載、共有カードの画像を開発物ごとに変えること（代表写真のまま）。

## Impact

- コード: `src/content.config.ts`、`src/content/schemas.ts`、`src/lib/content.ts`・`site.ts`・`pixel.ts`・`validate.ts`・`sitemap.ts`、`src/pages/[lang]/index.astro`、新しい `src/pages/[lang]/projects.astro`、`src/content/projects/tomoly.yaml`
- テスト: `tests/unit/` の schemas・validate・site・sitemap・pixel、`tests/e2e/` の pages・links・a11y・network・sitemap・viewport
- 依存の追加なし。配信 JavaScript ゼロと外部通信ゼロの制約はそのまま（Tomoly へのリンクは `<a>` だけ）
