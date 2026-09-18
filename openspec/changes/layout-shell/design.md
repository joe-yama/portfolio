# Design

## Context

Change 1 の成果: `src/lib/i18n.ts`（`locales` / `otherLocale` / `alternatePath`）、`src/lib/content.ts`（`getProfile` / `getCareer`）、`src/pages/[lang]/index.astro`（素の HTML）、`src/pages/index.astro`（`/` → `/ja/` リダイレクト）。CSS・フォント・`public/`・レイアウトは無い。Astro は 7.3.2 で、Fonts API（`fonts` 設定、`fontProviders.google()` / `local()`、`<Font>` コンポーネント）が標準機能として入っている（`node_modules/astro/dist/assets/fonts/` で確認済み）。

brainstorming（2026-09-18）での PO 決定は設計書 §4・§5・§6・§7 に反映済み。本書はそれを実装に落とす技術判断だけを書く。動機は proposal.md、要求は `specs/layout-shell/spec.md` を参照。

## Goals / Non-Goals

**Goals:**

- ページが本文だけを書けば、メタデータ・ヘッダー・フッター・配色・フォントが揃う共通の殻を 1 つ作る
- 見た目に関わる値（色・字体・余白）を CSS 変数として 1 箇所に置き、Change 3 / 4 が同じ値を使えるようにする
- Astro に依存しないリンク計算（hreflang、ナビ、言語切り替え）を純関数に出し、Vitest で検証する
- 実装後に PO がスクリーンショットで見た目を承認できる

**Non-Goals:**

- ページ種別ごとのレイアウト（写真用・経歴用）。本文が 1 種類しか無い今は作らない
- 描画の自動テスト（視覚回帰、axe の CI 実行）。Change 5 の e2e で扱う
- 開閉メニュー、テーマ切り替え UI、`<meta name="description">`、canonical。いずれも設計書に無い

## Decisions

### D1. レイアウトは `BaseLayout` 1 つ、部品は Header / Footer / ドット絵だけ

- `src/layouts/BaseLayout.astro` が `<head>`（charset、viewport、title、hreflang 3 本、`<Font>`）、`<Header>`、`<main><slot /></main>`、`<Footer>` を持つ。props は `lang`、`title`（任意。省略時は名前のみ）、`showNav`（404 で `false`）
- 404 は `BaseLayout` を `showNav={false}` で使う。専用レイアウトを増やさない
- 代替: ページ種別ごとのレイアウト → 本文が 1 種類なので先回り。不採用。部品ごとのスコープ CSS のみ → 色変数を全部品に配る必要が出て重複する。不採用

### D2. hreflang とリンク先の計算は `src/lib/site.ts` の純関数にする

- `alternateLinks(path, site)` → `[{ hreflang: 'ja', href }, { hreflang: 'en', href }, { hreflang: 'x-default', href: ja と同じ }]`。`href` は `new URL(alternatePath(path, lang), site).href`
- `navLinks(lang)` → `[{ label: 'Photos', href: '/<lang>/photos/' }, { label: 'Career', href: '/<lang>/career/' }]`
- `languageSwitch(path, lang)` → `{ label: 'English' | '日本語', href: alternatePath(path, other), hreflang: other }`
- UI 文字列（言語名、404 の文言）も `site.ts` に置く。件数が少なく、翻訳ファイルの仕組みを作るほどではない
- 理由: `.astro` は Vitest から直接テストできない（Change 1 の D1 と同じ）。計算はすべて純関数に寄せ、テンプレートは並べるだけにする
- 代替: Astro の Container API でコンポーネントを描画してテスト → Fonts API の仮想モジュールを Vitest 側で解決する必要があり、設定が増える。見た目はレビュアーの Playwright と PO のスクリーンショットで確認するので不採用

### D3. DotGothic16 は Fonts API の Google プロバイダーで取得する

- `astro.config.ts` に `fonts: [{ provider: fontProviders.google(), name: 'DotGothic16', cssVariable: '--font-dot', weights: [400], styles: ['normal'], subsets: ['japanese', 'latin'], display: 'swap', fallbacks: ['system-ui', 'sans-serif'] }]`
- `BaseLayout` の `<head>` に `<Font cssVariable="--font-dot" />`。`preload` は付けない（日本語は数十の unicode-range 片に分かれ、全部を preload すると初回の取得量が増える。必要な片だけ CSS の `unicode-range` で遅延取得させる）
- Google の CSS が返す `unicode-range` はそのまま `@font-face` に出る（`assets/fonts/utils.js` で確認）。取得した woff2 は `dist/_astro/fonts/` に出て同一オリジンになる
- 理由: TTF は約 2.0 MB（google/fonts リポジトリで確認）で、同梱すると初回訪問の読み込みが重い。PO 決定 2026-09-18
- リスク: ビルドが Google Fonts への通信に依存する（Risks 参照）
- 代替: `local()` プロバイダー + TTF 同梱 → 分割の恩恵なし。手書き `@font-face` + TTF → 同上。不採用

### D4. 配色は CSS 変数 4 つ、`prefers-color-scheme` で上書き

- `src/styles/global.css` に `:root { --bg; --fg; --fg-muted; --line; color-scheme: light dark; }` とダーク用の `@media (prefers-color-scheme: dark)` を置く。値は無彩色のみ（例: ライト `#fafafa` / `#111`、ダーク `#0c0c0c` / `#e8e8e8`。`--fg-muted` は両テーマで背景に対し 4.5:1 以上になる値を実装時に確認する）
- `global.css` は `BaseLayout` から import する。Header / Footer は自前のレイアウト用スコープ CSS を持ち、色は変数を参照する
- フォーカス枠は `:focus-visible { outline: 2px solid var(--fg); outline-offset: 2px }` を全リンクに当てる
- 代替: CSS フレームワーク → 依存追加。不採用。テーマ切り替え UI → 設計書 §7 で「置かない」

### D5. ドット絵はインライン SVG の Astro コンポーネント

- `src/components/pixel/Camera.astro`（トップ）、`src/components/pixel/Lost.astro`（404）。`<svg viewBox="0 0 16 16" shape-rendering="crispEdges" fill="currentColor">` に 1 セルを 1×1 の `<rect>` として並べる。表示サイズは CSS の `width` / `height` で整数倍にする
- 装飾なので `aria-hidden="true"`。404 の絵も文言が意味を伝えるため同じ
- 理由: 文字色に追従する（ダーク/ライトで 1 枚）、バイナリを git に入れない、`image-rendering` の指定と `<img>` の幅高さ指定が要らない。PO 決定 2026-09-18
- 代替: PNG + `image-rendering: pixelated`（設計書の旧案）→ 上記の理由で書き換えた

### D6. 404 は `src/pages/404.astro`

- Astro は `src/pages/404.astro` を `dist/404.html` に出す。i18n の `prefixDefaultLocale: true` でもルートに置ける（実装時にビルドで確認する。出なければ Issue にコメントして PO に相談）
- `<html lang="ja">`、日英の文言を並べ、リンクは `/ja/` と `/en/`。ヘッダーはロゴのみ（`showNav={false}`）。ロゴの表示名は `profile/ja.yaml` の `name`
- GitHub Pages は `404.html` をそのまま 404 応答に使う

### D7. `[lang]/index.astro` は本文だけ残して `BaseLayout` に載せる

- `await getCareer(lang)` は残す（日英件数検証をビルドに乗せる唯一の経路。Issue #1 の申し送り）
- `Astro.params.lang as Locale` はそのまま（`isLocale` ガード化は Change 3）

### D8. Change 1 の保留 Minor は挙動を変えない整理として最後に 1 タスクで行う

- `astro.config.ts` の `output: 'static'`、`package.json` の `engines`（`.node-version` と `packageManager` で固定済み）、`biome.json` の `files.includes` のうち Biome が既定で無視する項目（実装時に Biome 2.5 のドキュメントで既定を確認し、確認できたものだけ消す）
- `src/content/schemas.ts`: `certifications` と `achievements` の要素に共通する `{ date, name, url? }` を 1 つの base スキーマにまとめる。型と検証結果は変えず、既存テストが緑のままであることで確認
- hooks: `detect_lint()` / `detect_test()` を消し、コマンドを直接書く。`docs/harness/hooks.md` の該当記述も直す。合成 JSON のパイプで rc を再確認

## Risks / Trade-offs

- [ビルド時に Google Fonts へ到達できないとビルドが失敗する] → Fonts API は取得結果を `node_modules/.astro/fonts`（ビルド）/ `.astro/fonts`（dev）にキャッシュする。CI は毎回取得する。Google 側の障害でビルドが落ちた場合は再実行で対処し、恒常化したら `local()` + TTF 同梱へ戻す change を起こす
- [サンドボックスのネットワーク制限で `pnpm build` 中のフォント取得が失敗する] → 許可先に `fonts.googleapis.com` / `fonts.gstatic.com` が無ければ、出力を添えて PO に報告し、設定変更の許可を得る。勝手に緩めない
- [`<Font>` が出す `<style>` と `<link rel="preload" crossorigin>` が quality-gates の検査に引っかかる] → preload は使わない。`<style>` 内の `url()` は同一オリジンなので spec の「フォントの参照先」シナリオで検査する
- [`--fg-muted` の値がコントラスト 4.5:1 を満たさない] → 実装時に両テーマの比を計算して確認し、値をコミットメッセージに残す
- [DotGothic16 に無い字形（環境依存文字など）が代替フォントで出て見た目が割れる] → 名前・ナビ・見出しは常用漢字と英字なので v1 では許容。写真タイトル（Change 3）で問題が出たら扱う
- [`src/pages/404.astro` が i18n 設定と併用できない] → D6 のとおりビルドで確認。出ない場合は PO に相談（ブロッカー）

## Open Questions

なし。
