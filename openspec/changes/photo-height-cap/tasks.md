# Tasks

レビューの単位（`.claude/rules/review.md`）: タスク単位のレビューは行わず、**ブランチ全体のレビューを 1 回**だけ行う。変更は CSS と e2e に閉じており、共有インターフェース（型・スキーマ・URL 構造）は変わらないため。reviewer は `pnpm build && pnpm preview` の HTTP URL に対し、Playwright MCP で 1280×720 と 1440×900 の 2 サイズを両ロケールで実操作して測る。

## 1. 番人を先に書く（RED）

- [ ] 1.1 `tests/e2e/viewport.spec.ts` を新規作成し、トップページの初見表示を検査する（`/ja/` `/en/` × 1280×720・1440×900 で、代表写真・`h1`・肩書・すべての連絡先リンク・すべてのサイト内導線の `getBoundingClientRect().bottom` が `innerHeight` 以下）。`pnpm e2e` を実行し、**この検査が失敗する**ことを出力で確認する
- [ ] 1.2 同ファイルに写真の個別ページの初見表示を検査する（縦位置の `kariya-ferris-wheel` を両ロケール × 2 サイズで、写真・タイトル・撮影地/撮影日・撮影情報の下端が `innerHeight` 以下）。`pnpm e2e` を実行し、**この検査が失敗する**ことを出力で確認する
- [ ] 1.3 同ファイルに回帰の番人を 3 つ追加する（(a) トップと個別ページの写真の表示比が `naturalWidth/naturalHeight` と一致、(b) ギャラリーのサムネイルの表示幅がグリッドの列幅と一致、(c) 390×844 で横スクロールが出ない）。これらは現状でも通るので、`pnpm e2e` で緑になることを確認する

## 2. 上限を実装する（GREEN）

- [ ] 2.1 `src/components/PhotoPicture.astro` の `<Picture>` に変種名のクラスを付け、`picture :global(img.full)` に `width: auto` / `max-width: 100%` / `max-height: var(--photo-max-height, none)` / `margin-inline: auto` を追加する（`grid` 変種の `width: 100%` は変えない）。`pnpm lint` と `pnpm typecheck` が通ることを確認する
- [ ] 2.2 `src/pages/[lang]/index.astro` の `.hero` に `--photo-max-height: max(12rem, 100svh - 27rem)` を追加する。`pnpm e2e` でタスク 1.1 の検査が緑になることを確認する
- [ ] 2.3 `src/pages/[lang]/photos/[slug].astro` の `figure` に `--photo-max-height: max(12rem, 100svh - 18rem)` を追加する。`pnpm e2e` でタスク 1.2 の検査が緑になることを確認する

## 3. 番人が本当に番人か確かめる

- [ ] 3.1 隔離実行で変異を試す（作業ツリーは汚さない）: (a) `--photo-max-height` の指定を消す → 1.1・1.2 が落ちること、(b) `img.full` の `width: auto` を `width: 100%` に戻す → 1.3(a) の縦横比検査が落ちること、(c) `grid` 変種にも上限を当てる → 1.3(b) のサムネイル検査が落ちること。3 つとも落ちることを出力で示す
- [ ] 3.2 1280×720 と 1440×900 で実測し、`design.md` の表と突き合わせる。画面下端までの余白が 16px を下回るロケール・サイズがあれば、2.2 / 2.3 の値を 1rem 単位で増やして再測定する（spec の要求を満たす範囲での調整。変更したら理由を tasks の末尾に書く）

## 4. 検証と仕上げ

- [ ] 4.1 `pnpm lint` / `pnpm typecheck` / `pnpm test` / `pnpm build` / `pnpm e2e` をすべて実行し、コマンドと出力を報告に添える
- [ ] 4.2 各タスクの `tasks.md` のチェックは、そのタスクの実装と同じコミットに含める（チェックだけのコミットを作らない）

## 提案（後続へ）

- `sizes` 属性の見直し。高さ上限の導入で `full` 変種の表示幅は最大 750px 程度になるが、`sizes` は `(min-width: 80rem) 78rem, calc(100vw - 2rem)` のまま。2 倍 DPI ではほぼ適正なので画質は落ちないが、等倍の環境では過大。`photo-pipeline` の目標幅の表に delta が要るため今回は触らない
- ヘッダーと本文の余白の詰め直し。写真の下に置くものの高さ（約 25rem）を減らせれば、同じ「1 画面に収める」を保ったまま写真をもっと大きく見せられる
