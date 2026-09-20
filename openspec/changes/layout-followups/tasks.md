# Tasks

前提: PR #4（`layout-shell`）がマージされ、`/opsx:archive layout-shell` 済み。実装は `implementer`（Sonnet）、レビューは `reviewer`（Opus）。実装コードの変更はテストを先に書く。

## 1. PO 判断（別セッションの冒頭）

- [x] 1.1 design.md の Open Questions 1〜3（フォント CSS の配信形、見た目の Minor 5 件、`lang` の導出）を PO に提示して決定をもらい、決定内容を GitHub Issue にコメントする。「現状維持」の項目は対応するタスクを「対象外」と明記して閉じる

## 2. 決定不要の整理（1 と並行してよい）

- [x] 2.1 `tests/unit/site.test.ts` に `alternateLinks('/', 'https://example.com')` が ja / en / x-default とも接頭辞を付けた URL を返すケースを足し（RED → GREEN。実装変更なしで通るはず）、`pnpm test` 緑を確認する
- [x] 2.2 `tests/unit/pixel.test.ts` の各絵のテストに `expect(cells(rows).length).toBeLessThan(256)` を足し、`pnpm test` 緑を確認する
- [x] 2.3 `tests/unit/pixel.test.ts` に `gridSize` のテスト（空配列 → `{ width: 0, height: 0 }`、行長不揃い `['#', '##']` → `{ width: 2, height: 2 }`）を先に書き、`src/lib/pixel.ts` に `gridSize(rows)` を実装し、`PixelArt.astro` の幅・高さ算出をそれに置き換えて `pnpm test` / `typecheck` / `build` 緑と `dist/404.html` の `viewBox="0 0 16 16"` を確認する
- [x] 2.4 `PixelArt.astro` から `margin-bottom` を消し、`src/pages/[lang]/index.astro` と `src/pages/404.astro` の呼び出し側で余白を付け、`pnpm build` 後に 1280px / 390px のスクリーンショットで余白が変わっていないことを確認する
- [x] 2.5 `Header.astro` の `<nav>` の表示条件を `showNav &&` に戻し、言語切り替えの `<a>` を `sw &&` で包む。`pnpm build` 後に `dist/ja/index.html` のヘッダー 4 リンクと `dist/404.html` の 1 リンクを grep で確認する
- [x] 2.6 `tsconfig.json` に `"compilerOptions": { "noUnusedLocals": true }` を足し、`.astro` に未使用 import を仮に置いて `pnpm typecheck` が報告するか試す。報告すれば残し（既存コードで 0 errors を確認）、報告しなければ設定を戻して結果を Issue にコメントする → 採用。`astro check` は設定が無くても `ts(6133)` を hint として出すが、設定を足すと **error になり終了コードが 0 → 1 に変わる**。CI が `pnpm typecheck` を持つので、これが無いと未使用 import は CI を素通りする。`biome.json` が `**/*.astro` に対して `noUnusedVariables` / `noUnusedImports` を off にしているため、`.astro` については Biome との重複はない（実測 2026-09-20）
- [x] 2.7 favicon: `src/pages/favicon.svg.ts`（静的エンドポイント、`camera` のデータから `<rect>` を生成、`shape-rendering="crispEdges"`、固定色 + ダーク用 `<style>`）と `BaseLayout` の `<link rel="icon" href="/favicon.svg" type="image/svg+xml">` を追加し、`pnpm build` 後に `dist/favicon.svg` の存在、`dist/ja/index.html` と `dist/404.html` の `<link rel="icon"`、Playwright で `/ja/` を開いてコンソールに favicon の 404 が出ないことを確認する

## 3. PO 判断に従う変更（1.1 の決定後）

- [x] 3.1 D1 は PO 決定により A（現状維持）。**対象外**（`<Font>` のインライン出力を変えない）
- [x] 3.2 D2 で「直す」とした項目だけ `global.css` / `Header.astro` / `Footer.astro` / `404.astro` を変更し、変更した項目のコントラスト比（罫線なら 3:1 以上）または表示を Playwright のスクリーンショットで確認して PO に送る
- [x] 3.3 D3 を採るなら: `BaseLayout` の `Props.lang` を消して `localeFromPath(path) ?? defaultLocale` で導出し、`[lang]/index.astro` と `404.astro` の `lang={…}` を消す。`pnpm build` 後に `dist/ja/index.html` `dist/en/index.html` `dist/404.html` の `<html lang>` が `ja` / `en` / `ja` のままであることを確認し、設計書の該当箇所を更新する → 設計書には `BaseLayout` の props に触れた記述が無く更新箇所は無かった。アーカイブ済み change の design D1 の記述は履歴として残す（design D3 の補足を参照）

## 4. 仕上げ

- [x] 4.1 `pnpm lint && pnpm typecheck && pnpm test && pnpm build` がすべて 0 で `git status --short` が空、`openspec validate layout-followups --strict` が valid であることを確認し、本ファイルの完了項目を `[x]` にしてコミットする
- [x] 4.2 `reviewer`（Opus）でブランチ全体を「仕様準拠（`layout-shell` の delta）→ コード品質 → ponytail」の順にレビューし、**Approved**。結果は Issue #5 にコメント済み（タスク単位のレビュー 8 件と、ブランチ全体のレビュー `2450950..8a7cda0`）
- [x] 4.3 `gh api user --jq .login` が `joe-yama` であることを確認して push（PO の許可を得て実行）、`Closes #5` を本文に含む PR #9 を作成

## 提案（この change では実装しない。後続の change 用）

レビューで挙がった、スコープ外の改善案。

- `.art { margin-bottom: 1rem }` がトップと 404 に重複している。`global.css` に寄せれば -8 行（2 箇所だけなので優先度は低い）
- `Header.astro` の `showNav ? languageSwitch(...) : undefined` と内側の `{sw && …}` は対でしか消せない。`const sw = languageSwitch(path, lang)` にすれば型が確定してガードごと落とせる（-2 行）。ただし tasks 2.5 が `sw` を `<nav>` の内側で扱うことを明示要求しているので PO 判断
- `404.astro` の `<span class="dot">` と `<a class="dot">` は `<p class="dot">` にまとめれば `<span>` ごと消える（-1 行）
- `faviconSvg` の `viewBox` 検証は幅と高さの取り違えを検知しない（`camera` が正方のため）。`faviconSvg(['#', '##'])` を 1 件足せば塞げる
- 罫線・本文のコントラストを守る自動テストが 1 本も無い。`tests/` は `.astro` も CSS も触らないので、値が戻っても検知されない
- `cells` は `[...row]`（コードポイント単位）、`gridSize` は `row.length`（UTF-16 単位）で文字数の数え方が不揃い。`.` と `#` しか来ないので現状は無害
- `tests/unit/site.test.ts` の接頭辞なしパスのケースは `tests/unit/i18n.test.ts` と分岐が一部重複する。合成レイヤを見ているので据え置いた
- 404 の上下を厳密に対称にするなら `main > p:last-child { margin-bottom: 0 }` の 1 行（現状はグリッドのトラックは完全対称で、外接矩形では最後の `<p>` のマージン分 8px だけ下寄り）
- `.astro` の描画を守るテストが無い（`tests/unit` は `.astro` を描画せず、CI も `dist` をアサートしない）。Change 5 の e2e で「`/ja/` のヘッダー 4 リンク」「`/404.html` に `<nav>` なし」「`.art` の `margin-bottom` 16px」「各ページの `documentElement.lang` と hreflang 3 本」を拾う
- `tests/unit/pixel.test.ts` の「16 × 16 の絵は 16 × 16」は同語反復で、`camera` の定義を読み直しているだけ。変異解析でも単独で殺す変異体が無かった（-3 行）
- `lang` の出どころがまだ 2 つある。`BaseLayout` は D3 で URL 由来になったが、`src/pages/[lang]/index.astro` は `Astro.params.lang as Locale` の無検査キャストを握ったまま。Change 3 / 4 でページが増えるたび `getStaticPaths` + キャスト + `getProfile` の 3 行が複製される。「`isLocale` でガードする」ではなく「ページ側の `lang` 取得を共通化する（ついでにガードも入る）」として扱うのが正確

## 申し送り（リスク。実装済みの挙動に対する注意）

- **【Change 5 の最初のタスクにする】** 将来 `astro.config.ts` に `base` を設定すると `Astro.url.pathname` が `/<base>/ja/` になり、`localeFromPath` が `null` を返す。結果として `/en/` の `<html lang>` が `ja` に化け、`hreflang` が全ページから消える。**ビルドも lint も型検査も単体テストもすべて通ったまま静かに壊れる**（`dist` を検査するテストが無いため）。この change の D3 で `<html lang>` の出どころが props から URL に移ったことで生じた新しい弱点で、変更前は `<html lang>` だけは `base` の影響を受けなかった。`site` は Change 5 で差し替える前提の暫定値なので、独自ドメインを取らない選択をした瞬間に踏む
- `404.astro` の `p a { margin-left: 0.5em }` はセレクタが `p a` なので、将来このページの `<p>` にインラインリンクを入れると文中のリンクにも 8px が付く
- 罫線のライトの実測 3.098 は閾値 3.0 に対して余裕が 3% しかない。`--bg` を変えると簡単に割る
- `src/pages/favicon.svg.ts` の `Content-Type` ヘッダは静的ビルドでは使われない（配信側が拡張子から MIME を決める）。効くのは `astro dev` のときだけなので、消さずに残す
- `404.astro` の `:global(main)` がなぜページをまたがないかは `404.astro` の `<style>` 内コメントと design D5 を参照。この `<style>` を共有コンポーネントやレイアウトへ移すと全ページの `main` に効く
- 設計書 `docs/superpowers/specs/2026-09-17-portfolio-site-design.md` の「`hreflang` を全ページに出す」は `/404.html` には当てはまらない（接頭辞の無いパスでは出さない）。この change 以前からの緩さで、振る舞いの正本 `openspec/specs/layout-shell/spec.md` は `/ja/` `/en/` 配下に限定しているため実害は無い。設計書を触る change で直す
- `src/lib/pixel.ts` の `faviconSvg` が `#111111` / `#e8e8e8` を直書きしており、`src/styles/global.css` の `--fg` と二重管理になっている。`--fg` だけ変えると favicon の色が静かにずれる（単体テストも同じリテラルを assert しているので落ちない）。`global.css` の色を触る change では `src/lib/pixel.ts` も直す
- `tsconfig.json` の `noUnusedLocals: true` は「先に import だけ置いて後で使う」書き方を `pnpm typecheck` で弾く。後続 change の implementer に伝えること
