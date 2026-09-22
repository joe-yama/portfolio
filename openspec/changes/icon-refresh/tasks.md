# Tasks

レビュー単位: 小さな change の経路（PO 承認 2026-09-20）。implementer 1 回、レビューはブランチ全体 1 回（UI 実測を含む）。

## 1. 番人の強化（RED を先に）

- [x] 1.1 `tests/unit/pixel.test.ts`: github / linkedin / briefcase / globe を camera / lost の厳しい番人（16 行 × 16 文字、`^[.#]{16}$`、塗り 1 セル以上）の `describe.each` に統合し、`gridSize` だけの `describe.each` を削除する
- [x] 1.2 `tests/e2e/links.spec.ts`: トップページ（ja / en）の導線 3 件と連絡先 2 件それぞれについて、`svg rect` の `(x, y)` 列が期待するグリッドの `cells()` と完全一致することを確かめる（rect 数の比較を置き換える）
- [x] 1.3 番人が本当に番人か確かめる: (a) `index.astro` で導線の camera と briefcase を入れ替える変異、(b) github と linkedin を入れ替える変異、(c) グリッドの 1 行を 15 文字にする変異、(d) 1 行に `.`/`#` 以外の文字を混ぜる変異 を 1 つずつ当て、それぞれ該当の番人が赤になることを確かめて報告する。手順は `docs/harness/README.md` と `docs/harness/lessons.md`（隔離実行の手順は別 PR で改訂中のため、キャッシュによる誤った緑を避けるには変異前後で対照実験し、作業ツリーを直接変異させる場合はバックアップから復元して `git status` で差分が残っていないことを確かめる）

## 2. 実装

- [x] 2.1 `src/lib/pixel.ts` の `briefcase` を描き直す（取っ手を太く、本体をシルエットで判別できる形に。design.md の Decisions）
- [x] 2.2 `src/lib/pixel.ts` の `globe` を描き直す（外周を閉じた円、線を円の内側で止める）
- [x] 2.3 `src/pages/[lang]/index.astro`: 導線のアイコン対応づけを表示ラベル非依存（`navLinks()` の結果と `[camera, briefcase]` を index で対応、件数不一致はビルド時に例外）にし、`as readonly string[]` の 2 箇所を narrowing で除去する。DOM 構造と見た目は変えない

## 3. 確認

- [ ] 3.1 `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm e2e` がすべて緑

## 提案（本 change のスコープ外・後続への申し送り）
