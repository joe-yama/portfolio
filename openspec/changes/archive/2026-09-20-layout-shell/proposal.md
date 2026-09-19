# Proposal

## Why

Change 1 で土台（スキーマ、日英ルーティング、CI）は入ったが、ページは名前と一行紹介だけの素の HTML で、設計書 §7 の「写真主役の徹底ミニマル、ドット文字とドット絵」を担う共通レイアウトが無い。写真（Change 3）と経歴（Change 4）のページはどちらも同じヘッダー・配色・フォント・メタデータの上に載るので、先に共通の殻を 1 つの change で作り、PO が見た目を確認できる状態にする。

## What Changes

- 全ページ共通の `BaseLayout` を作る。`<html lang>`、`<title>`、viewport、`hreflang` の `<link rel="alternate">`（`ja` / `en` / `x-default` = `ja`）を出し、ヘッダー・本文・フッターの骨格を持つ
- ヘッダー: 左にロゴ（`profile` の `name` をドット文字で。その言語のトップへ）、右にナビ「Photos」「Career」（両言語とも英字）と言語切り替え（相手の言語名。同じページの他言語版へ）。狭い画面では折り返すだけで開閉メニューは作らない
- フッター: 「© 年 名前」の 1 行
- 配色: モノトーンの 4 色（背景・文字・薄い文字・罫線）を CSS カスタムプロパティで定義し、`prefers-color-scheme` でライト/ダークを切り替える。切り替え UI は置かない。文字色のコントラスト比は 4.5:1 以上
- 文字: DotGothic16 を Astro 7 の Fonts API（Google プロバイダー）でビルド時に取得し、`dist/_astro/fonts/` から自己配信する。ロゴ・ナビ・言語切り替え・見出しに使い、本文は `system-ui`
- ドット絵: Agent が描く仮の絵 2 点（トップのアイコン、404 の絵）をインライン SVG の Astro コンポーネントにする。PNG は使わない
- 404 ページ: `/404.html` にドット絵、「ページが見つかりません / Page not found」、日英それぞれのトップへのリンク。ナビと言語切り替えは置かない
- 言語別トップ `src/pages/[lang]/index.astro` を `BaseLayout` に載せ替える。本文は名前と一行紹介のまま。日英件数の検証をビルドに乗せる `await getCareer(lang)` は残す
- hreflang の 3 本とナビ・言語切り替えのリンク先を求める純関数を `src/lib/` に置き、Vitest で検証する
- Change 1 のレビューで Change 2 に振られた整理（Issue #1）: `astro.config.ts` の `output: 'static'`、`package.json` の `engines.node`、`biome.json` の既定と重複する除外、スキーマの重複定義、hooks の `detect_*` 関数の inline 化
- 実装後に Agent がライト/ダーク × スマホ/PC のスクリーンショットを撮って PO に送り、OK を得てから PR を作る

含めないもの（後続の change）: 写真ページとギャラリー、トップの代表写真（`photo-pipeline`）、トップの連絡先・導線と経歴ページ（`profile-and-career`）、e2e・デプロイ・独自ドメイン（`deploy-and-e2e`）、`Astro.params.lang as Locale` の `isLocale` ガード化（Change 3）、PO 自作のドット絵への差し替え（別 change）。

## Capabilities

### New Capabilities

- `layout-shell`: 全ページ共通のレイアウト。ページのメタデータ（`lang`、`title`、`hreflang` 代替リンク）、ヘッダー（ロゴ・ナビ・言語切り替え）、フッター、モノトーン配色と OS 設定へのテーマ追従、ドット文字フォントの自己配信、ドット絵の表現方法、404 ページ

### Modified Capabilities

- `quality-gates`: 「外部通信ゼロ」の要求を、画像だけでなくフォントにも明示的に広げる（ビルド時に外部から取得したフォントも、出力では同一オリジンのパスから配信されなければならない）

## Impact

- 新規: `src/layouts/BaseLayout.astro`、`src/components/Header.astro`、`src/components/Footer.astro`、`src/components/pixel/*.astro`、`src/styles/global.css`、`src/pages/404.astro`、`src/lib/site.ts`（hreflang とナビのリンクを求める純関数、UI 文字列）、`tests/unit/site.test.ts`
- 変更: `src/pages/[lang]/index.astro`（レイアウトに載せ替え）、`astro.config.ts`（`fonts` の追加、`output` の削除）、`package.json`（`engines` の削除）、`biome.json`（重複する除外の削除）、`src/content/schemas.ts`（重複定義の集約。挙動は変えない）、`.claude/hooks/lint-on-edit.sh` / `test-on-stop.sh`（`detect_*` の inline 化。挙動は変えない）、`docs/harness/hooks.md`
- 依存の追加: なし（Fonts API は Astro 7 本体の機能）
- 外部通信: ビルド時に Google Fonts から DotGothic16 の woff2 を取得する（開発・CI ともにネットワークが必要。GitHub Releases からの写真取得と同じ性質）。公開サイトからの外部通信はゼロのまま
- 設計書: §4・§5・§6・§7 は brainstorming の決定を反映済み（コミット `5f3cabd`）
