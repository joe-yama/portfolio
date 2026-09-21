# Tasks

## 1. skills の日英検証

- [x] 1.1 `tests/unit/validate.test.ts` に `validateCareerParity` の失敗テストを 4 件足す（カテゴリ数の不一致 / 対応するカテゴリの項目数の不一致 / カテゴリ名が訳語で違っても通ること / 既存の 3 配列の検証が壊れていないこと）。`pnpm exec vitest run tests/unit/validate.test.ts` が RED になることを確認する
- [x] 1.2 `src/lib/validate.ts` の `validateCareerParity` に `skills` の検証を足す（`Object.entries` の並び順で i 番目どうしを対応づけ、カテゴリ数と各カテゴリの項目数を比べる。エラーには `skills`、何番目のカテゴリか、両方の数を含める）。`pnpm test` が GREEN になることを確認する

## 2. 実データへの差し替え

- [x] 2.1 `src/content/profile/{ja,en}.yaml` を実データにする（`name` は日英とも `Josuke Yamane`、`tagline` は現職の役割、`links` は GitHub と LinkedIn の 2 本。メールは載せない）。`pnpm build` が成功することを確認する
- [x] 2.2 `src/content/career/{ja,en}.yaml` の `experience`（4 件）と `skills`（5 カテゴリ）を実データにする。`pnpm build` が成功し、1.2 の検証を通ることを確認する
- [x] 2.3 `src/content/career/{ja,en}.yaml` の `certifications`（14 件）と `achievements`（6 件）を実データにする。`pnpm build` が成功することを確認する

## 3. 実測

- [x] 3.1 `pnpm lint` / `pnpm typecheck` / `pnpm test` / `pnpm build` / `pnpm e2e` をすべて実行し、出力を報告に添える
- [x] 3.2 `pnpm preview` で日英 4 ページ（`/ja/`、`/en/`、`/ja/career/`、`/en/career/`）を開き、サンプルデータの文字列（`サンプル`、`Sample Inc.`、`例示`、`hello@example.com`）が 1 件も残っていないこと、職歴 4 件・資格 14 件・実績 6 件・スキル 5 カテゴリが日英とも表示されることを確認する

---

## 後続への提案（レビューで出た Minor。この change では直さなかった）

判定はすべて「マージを止めない」。優先度の高い順。

1. **資格の日付を年月表示にする**（PO 決定 2026-09-21、後続 change で対応）。スキーマの `isoDate` が `YYYY-MM-DD` 必須なので、月までしか分からない資格を `-01` に丸めている。結果として **14 件中 10 件が `2025年10月1日` / `October 1, 2025` と同一表示**になり、読み手に「プレースホルダのまま公開されている」印象を与える。最小の直し方は `src/lib/career.ts` の `formatDate` に精度引数を足し、`certifications` の表示だけ month 精度にすること（`2020-07-01` のような本当に 1 日の資格と区別できないので「日が 01 なら省く」は不可）。表示形式は main spec `profile-and-career` にあるので delta が要る
2. `src/lib/validate.ts:53` の doc コメント「並べて表示する**配列**の件数が一致すること」が古い。`skills` は `Record<string, string[]>` で配列ではない
3. `tests/unit/validate.test.ts` の「カテゴリ数が違うときは比較まで進まない」だけが `toHaveLength(1)` の弱い assertion（他は完全一致）。早期 return を外すと分割代入が TypeError になるので番人としては機能するが、他 4 件と粒度が揃っていない
4. spec の Scenario「件数が一致する」は 2 カテゴリの成功ケースだが、単体テストの成功ケースは 1 カテゴリのみ。複数カテゴリの成功ケースが無い（実データのビルドが実質カバーしている）
5. main spec `openspec/specs/profile-and-career/spec.md` の Scenario が `Email`（`mailto:hello@example.com`）を前提に書かれている。この change でメールリンクを廃したので、spec を正として読むと誤解する。次に `profile-and-career` を触る change で例をデータ非依存に直す
6. 日英とも `skills` が空だと `0 === 0` で検証を通り、`career.astro` が空の見出しだけを描く
7. design D1 の既知の穴（カテゴリ名が数字だけのとき整数キーが先頭に並べ替えられる）は、**片側だけ数字キー**のとき対応づけがずれる。ただし表示側も同じ `Object.entries` 順なので、検証が通った状態＝表示されている対応づけであり、ユーザーから見た不整合は生じない
8. 全 4 職歴とも `bullets` が 1 件（スキーマ上限は 5）。採用担当向けとしては薄い。内容の厚みは PO の編集判断
9. `tagline`（プロダクトオーナー）と最新職歴（エンジニアリング標準化リード）が別の役割。並行在職なので誤りではないが、トップの一行紹介と経歴の先頭が食い違って見える
10. `AWS All Certifications Engineers` の日付は LinkedIn の記載に合わせて 2026-05-01 にしているが、リンク先の AWS ブログの公開は 2026-06-25。クリックすると月がずれて見える

### この change の外で再確認されたこと

- **`astro preview` は別のプレビューが動いているとポート指定を無視する**（`deploy-and-e2e` の後続提案に既出）。Task 4 の `pnpm e2e` 1 回目がこれで落ちた（コントローラーが別ポートで preview を起動していたため）。2 回目は 27 passed。CI では他のプレビューが無いので影響しない
