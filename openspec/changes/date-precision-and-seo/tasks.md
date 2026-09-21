# Tasks

## 1. 日付の粒度

- [x] 1.1 `src/content/schemas.ts` の資格・実績の `date` を `YYYY-MM` と `YYYY-MM-DD` の両方を受ける 1 本の正規表現（design D1）にし、`tests/unit/schemas.test.ts` に受理（`2025-10` / `2017-08-31`）と拒否（`2025` / `2025-10-1` / `2025-13` / `2025-10-32`）のテストを足して `pnpm test` が緑になることを確認する
- [ ] 1.2 `src/lib/career.ts` の `sortByDateDesc` の比較キーを、`YYYY-MM` のときだけ `-01` を補う形（design D2）にし、`tests/unit/career.test.ts` に「`2025-11-01` → `2025-10` → `2025-09-30` の順に並ぶ」「`2016-03` と `2016-03-01` は記述順を保つ」の 2 件を足して緑になることを確認する
- [ ] 1.3 `src/lib/career.ts` の `formatDate` をセグメント数で分岐させ（design D3）、`tests/unit/career.test.ts` に 4 件（`2025-10` の ja / en、`2017-08-31` の ja / en）を足して、年月の表示に `1日` / `1,` が現れないことまで確認する
- [ ] 1.4 `src/content/career/{ja,en}.yaml` の `certifications` 14 件と `achievements` 5 件を design D8 の表どおり `YYYY-MM` に直す（特許出願の `2017-08-31` は変えない）。`pnpm build` が通り、`grep -c '\-01$'` で意図しない `-01` が残っていないことを確認する

## 2. ページのメタデータ

- [ ] 2.1 `src/lib/site.ts` に、そのページ自身の絶対 URL を返す関数を足し、`tests/unit/site.test.ts` に base 付き（`/portfolio`）と base 無しの 2 件を足して緑になることを確認する
- [ ] 2.2 `src/layouts/BaseLayout.astro` に `<link rel="canonical">` と `<meta name="description">`（内容はプロフィールの `tagline`）を、`hreflang` と同じ条件（ロケール配下のページだけ。design D6）で出し、`pnpm build` 後に `dist/ja/career/index.html` と `dist/en/photos/index.html` に 1 本ずつあること、`dist/404.html` にどちらも無いことを確認する

## 3. サイトマップ

- [ ] 3.1 `src/lib/sitemap.ts` に、写真の slug の配列・サイトの起点・パス接頭辞から `<url>` の材料（`loc` と言語代替 3 本）を返す純関数を書き（design D4）、`tests/unit/sitemap.test.ts` で写真 2 枚のときの 10 本の `loc` を全部固定し、英語の経歴ページの代替 3 本まで確認する
- [ ] 3.2 `src/pages/sitemap.xml.ts` を `src/pages/favicon.svg.ts` と同じ形で書き、`pnpm build` 後に `dist/sitemap.xml` が存在し、最上位要素が `urlset`、`xhtml` 名前空間が宣言され、`<loc>` が 10 件であることを確認する
- [ ] 3.3 `tests/e2e/` に、サイトマップのすべての `<loc>` が 200 を返すことと、`<loc>` の集合がビルド出力のロケール接頭辞付きページの集合と一致すること（design D5）を検査する spec を足し、`pnpm e2e` が緑になることを確認する

## 4. 仕上げ

- [ ] 4.1 `CLAUDE.md` に、サイトマップを Google Search Console へ登録するのは PO の手作業であること（`robots.txt` が効かない理由つき）と、資格・実績の日付は分かっている粒度で書くことを追記し、`git diff` で 2 か所入っていることを確認する
- [ ] 4.2 `pnpm lint` / `pnpm typecheck` / `pnpm test` / `pnpm build` / `pnpm e2e` をこの順に実行し、すべて緑であることを出力付きで示す

## 提案（後続へ）

<!-- 実装中に気づいたスコープ外の改善をここに追記する -->
