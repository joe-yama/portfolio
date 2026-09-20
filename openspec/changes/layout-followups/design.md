# Design

## Context

Change 2 `layout-shell` の成果（`BaseLayout` / `Header` / `Footer` / `PixelArt` / `global.css` / Fonts API）が PR #4 でマージされる前提。動機と項目一覧は proposal.md、指摘の原文と実測値は GitHub Issue #3 の最終コメント（2026-09-20）にある。本書は PO が決めるべき選択肢と、決定不要の整理の方針だけを書く。

## Goals / Non-Goals

**Goals:**

- PO 判断 3 件を選択肢と根拠つきで並べ、別セッションの冒頭で決められる状態にする
- 決定不要の整理を、既存テストを弱めずに済ませる
- favicon の 404 を無くす

**Non-Goals:**

- 写真・経歴ページの実装（Change 3 / 4）
- ハーネス（reviewer の Playwright MCP）の扱い（`harness-ui-review`）
- レイアウト構造の再設計。部品の責務と値の置き場所を直すだけ

## Decisions

### D1. フォント CSS の配信形（PO 判断）

| 選択肢 | 利点 | 欠点 |
|---|---|---|
| A. 現状維持（`<Font>` がインライン） | 変更なし。Astro が preload / fallback を管理 | 全ページ +95 KB（gzip 32 KB）。キャッシュされない |
| B. `<Font>` をやめ、`@font-face` を外部 CSS に | 1 回の取得でキャッシュ。HTML が 7 KB 程度に | Fonts API の `fontData`（`astro:assets`）から CSS を生成する仕組みを自作する。`unicode-range` 123 件を保つ必要 |

推奨: v1 の公開時点で A。写真ページで HTML サイズが問題になったら B。B を選ぶ場合は `src/pages/fonts.css.ts` のようなエンドポイントで `fontData` から `@font-face` を出力し、`BaseLayout` で `<link rel="stylesheet" href="/fonts.css">` を張る（外部通信ゼロは維持）。

### D2. 見た目の Minor（PO 判断、各項目独立）

1. 罫線 `--line`: ライト `#d4d4d4` → `#9a9a9a`（3.0:1）など 3:1 以上の値にするか、装飾として現状維持
2. フッター文字: `<small>` を外して `font-size: 0.875rem` だけにする（14px）か、現状の 11px
3. ヘッダーリンク: 静止時も下線を出す（`global.css` の既定に従い Header のスコープ CSS から `text-decoration: none` を消す）か、現状維持
4. 404 の文言とリンク: リンクにも `.dot` を付けるか、文言とリンクを別行にするか、現状維持
5. 404 の配置: `main` を縦方向にも中央寄せ（`display: grid; place-content: center`）にするか、現状維持

### D3. `BaseLayout` の `lang`（PO 判断）

現状: `Props.lang` をページが渡し、`hreflang` の出し分けは `localeFromPath(Astro.url.pathname)` で判定。案: `const lang = localeFromPath(path) ?? defaultLocale` で導出し、`Props.lang` と全ページの `lang={lang}` を消す。404 は接頭辞が無いので `defaultLocale`（ja）になり現状と同じ。利点: 同じ事実の出どころが 1 つになり、ページが path と食い違う `lang` を渡す事故が消える。欠点: ページ側で `lang` を使うときは `Astro.params.lang` を別に読む（現状も読んでいる）。推奨: 採る。

### D4. favicon はインライン SVG と同じデータから静的に出す

- `src/lib/pixel.ts` の `camera`（または専用の 16×16）を使い、`src/pages/favicon.svg.ts` の静的エンドポイントで `<svg viewBox="0 0 16 16" shape-rendering="crispEdges"><rect …/></svg>` を出力する。色は `currentColor` が効かないので固定色（`#111`）。ダーク対応が要るなら `<style>@media (prefers-color-scheme: dark){rect{fill:#e8e8e8}}</style>` を SVG 内に入れる（SVG 内 CSS は許容、JavaScript ではない）
- 代替: `public/favicon.svg` を手で置く → 絵のデータが 2 箇所になる。不採用
- `BaseLayout` の `<head>` に `<link rel="icon" href="/favicon.svg" type="image/svg+xml">`
- 実装では SVG 文字列の組み立てを `src/lib/pixel.ts` の `faviconSvg(rows)` という純関数に出し、`src/pages/favicon.svg.ts` はそれを呼んで返すだけにした（`.astro` とエンドポイントを薄く保ち、単体テストで守るため）

### D5. 決定不要の整理は挙動を変えない

- `PixelArt` の幅算出: `export function gridSize(rows): { width, height }` を `pixel.ts` に置き、`PixelArt.astro` はそれを呼ぶ。テスト: 空配列 → 0×0、行長不揃い → 最長行
- `Header` の表示条件: `{showNav && (<nav>…{sw && <a …>}</nav>)}`。`sw` は `showNav ? languageSwitch(path, lang) : undefined` のまま
- `PixelArt` の `margin-bottom` を消し、トップと 404 の呼び出し側で `class` かラッパー要素で余白を付ける（Astro は `class` を子コンポーネントに渡すだけでスコープ hash は付かないので、`:global` を使わず親のスコープ CSS でラッパーに当てる）
- `tsconfig.json` の `noUnusedLocals`: `astro check` が `.astro` の frontmatter の未使用 import を報告するか試す。報告するなら有効化して `pnpm typecheck` を穴埋めにする。報告しなければ入れない（効かない設定を残さない）

## Risks / Trade-offs

- [D1 で B を選ぶと Fonts API の内部 API（`fontData`）に依存する] → `astro:assets` の公開 export であることを `node_modules/astro/client.d.ts` で確認済み（2026-09-19）。マイナー更新で形が変わるリスクは残る
- [D3 で `lang` を導出すると、接頭辞のないページが増えたとき暗黙に `ja` になる] → 現状そのようなページは 404 だけ。増やす change で明示する
- [favicon の SVG 内 `<style>` が quality-gates の「`<script` なし」検査に触れる] → `<style>` は対象外。`https://` 参照も無い
- [見た目の変更が PO の承認済みスクリーンショットと変わる] → 変更した項目だけ再撮影して PO に送る

## Open Questions

PO が決定済み（2026-09-20、GitHub Issue #5 のコメント）:

1. D1: フォント CSS の配信形 → **A（現状維持）**。`<Font>` のインライン出力のまま。tasks 3.1 は対象外
2. D2: 見た目の Minor 5 件 → **5 件すべて直す**。罫線は実測で 3:1 以上になる値を使う（ライト `#8f8f8f` = 3.10、ダーク `#606060` = 3.11）。D2 本文の候補 `#9a9a9a` は実測 2.70 で不足のため不採用
3. D3: `BaseLayout` の `lang` を URL から導出 → **採る**

実装後のスクリーンショット確認で、PO が追加で 2 件を決定（2026-09-20）:

4. 404 のドット絵は**中央に揃える**（`main` に `justify-items: center`）。文言の左端に揃えたままだと、まとまりの中で絵だけが左に寄って重心がずれて見えるため。副作用として日本語行と英語行の左端が 12px ずれる（各行が個別に中央寄せされるため）
5. 404 の文言とリンクの**間隔を広げる**（`p a { margin-left: 0.5em }`、実測 4.19px → 12.19px）。D2-4 で両方を同じドット文字に揃えた結果、字体の違いによる切れ目が失われ「Page not found」と「Go to the English top」が 1 語に読めたため
