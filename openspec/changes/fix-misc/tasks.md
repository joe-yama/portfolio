# Tasks

## 1. ヘッダーロゴリンクの下線除去

- [x] 1.1 RED: `tests/e2e/viewport.spec.ts` と同様に `page.goto` + `getComputedStyle` を使い、`/ja/` の `.logo`（ヘッダー左の "Josuke Yamane" リンク）の computed `textDecorationLine` が `none` であることを検証する e2e テストを追加し（`tests/e2e/links.spec.ts` に追加）、修正前に失敗することを確認する
- [x] 1.2 GREEN: `src/components/Header.astro` の scoped style の `.logo` に `text-decoration: none;` を追加し、1.1 のテストを通す。`src/styles/global.css` の `a { text-decoration: underline; }`（全リンク共通）自体は変更しない
- [x] 1.3 検証: `.logo` が `<a href>` のままであること（リンク先 `homePath(lang, base)` が変わらないこと）を 1.1 のテストと同じブロックでアサートし、`pnpm test`（既存の単体テストに影響がないこと）・`pnpm lint`・`pnpm typecheck`・`pnpm build && pnpm e2e` を実行して結果を示す
