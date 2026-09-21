# Tasks

## 1. 日付の粒度

- [x] 1.1 `src/content/schemas.ts` の資格・実績の `date` を `YYYY-MM` と `YYYY-MM-DD` の両方を受ける 1 本の正規表現（design D1）にし、`tests/unit/schemas.test.ts` に受理（`2025-10` / `2017-08-31`）と拒否（`2025` / `2025-10-1` / `2025-13` / `2025-10-32`）のテストを足して `pnpm test` が緑になることを確認する
- [x] 1.2 `src/lib/career.ts` の `sortByDateDesc` の比較キーを、`YYYY-MM` のときだけ `-01` を補う形（design D2）にし、`tests/unit/career.test.ts` に「`2025-11-01` → `2025-10` → `2025-09-30` の順に並ぶ」「`2016-03` と `2016-03-01` は記述順を保つ」の 2 件を足して緑になることを確認する
- [x] 1.3 `src/lib/career.ts` の `formatDate` をセグメント数で分岐させ（design D3）、`tests/unit/career.test.ts` に 4 件（`2025-10` の ja / en、`2017-08-31` の ja / en）を足して、年月の表示に `1日` / `1,` が現れないことまで確認する
- [x] 1.4 `src/content/career/{ja,en}.yaml` の `certifications` 14 件と `achievements` 5 件を design D8 の表どおり `YYYY-MM` に直す（特許出願の `2017-08-31` は変えない）。`pnpm build` が通り、`grep -c '\-01$'` で意図しない `-01` が残っていないことを確認する

## 2. ページのメタデータ

- [x] 2.1 `src/lib/site.ts` に、そのページ自身の絶対 URL を返す関数を足し、`tests/unit/site.test.ts` に base 付き（`/portfolio`）と base 無しの 2 件を足して緑になることを確認する
- [x] 2.2 `src/layouts/BaseLayout.astro` に `<link rel="canonical">` と `<meta name="description">`（内容はプロフィールの `tagline`）を、`hreflang` と同じ条件（ロケール配下のページだけ。design D6）で出し、`pnpm build` 後に `dist/ja/career/index.html` と `dist/en/photos/index.html` に 1 本ずつあること、`dist/404.html` にどちらも無いことを確認する

## 3. サイトマップ

- [x] 3.1 `src/lib/sitemap.ts` に、写真の slug の配列・サイトの起点・パス接頭辞から `<url>` の材料（`loc` と言語代替 3 本）を返す純関数を書き（design D4）、`tests/unit/sitemap.test.ts` で写真 2 枚のときの 10 本の `loc` を全部固定し、英語の経歴ページの代替 3 本まで確認する
- [x] 3.2 `src/pages/sitemap.xml.ts` を `src/pages/favicon.svg.ts` と同じ形で書き、`pnpm build` 後に `dist/sitemap.xml` が存在し、最上位要素が `urlset`、`xhtml` 名前空間が宣言され、`<loc>` が 10 件であることを確認する
- [x] 3.3 `tests/e2e/` に、サイトマップのすべての `<loc>` が 200 を返すことと、`<loc>` の集合がビルド出力のロケール接頭辞付きページの集合と一致すること（design D5）を検査する spec を足し、`pnpm e2e` が緑になることを確認する

## 4. 仕上げ

- [x] 4.1 `CLAUDE.md` に、サイトマップを Google Search Console へ登録するのは PO の手作業であること（`robots.txt` が効かない理由つき）と、資格・実績の日付は分かっている粒度で書くことを追記し、`git diff` で 2 か所入っていることを確認する
- [x] 4.2 `pnpm lint` / `pnpm typecheck` / `pnpm test` / `pnpm build` / `pnpm e2e` をこの順に実行し、すべて緑であることを出力付きで示す

## 提案（後続へ）

<!-- 実装中に気づいたスコープ外の改善をここに追記する -->

レビューで出た Minor と ponytail、実装中に気づいた点。いずれもこの change では直さない
（`.claude/rules/review.md`: Minor は修正ラウンドを起こさず後続へ）。

### 日付まわり

1. 粒度の判定基準が 2 か所で不揃い。`src/lib/career.ts` の `dateSortKey` は文字列の長さ 7、`formatDate` は
   セグメント数 3 で見ている。`datePrecision` を将来広げた（例: `YYYY` を許す）とき、2 か所が別々に壊れる
2. 暦として存在しない日が通る。`2025-02-30` は `2025年3月2日`、`2025-11-31` は `2025年12月1日`、`0000-01` は
   `1900年1月` と黙って転がる。この change の回帰ではなく既存の `isoDate` 由来だが、日を書かない項目が
   増えた分だけ誤記が気づきにくい方向ではある
3. `src/lib/validate.ts` の `validateCareerParity` は件数しか見ておらず、日英で同じ index の `date` が
   一致しているかを見ていない。`2016-03` のような同着ペアの日英の表示順は、「同じ順に書く」という
   人間の約束だけが担保している。index ごとの `date` 一致検査は 4 行で足せる
4. `tests/unit/schemas.test.ts` の「年月日まで（YYYY-MM-DD）を受け付ける」は、下の「同じ配列の中で
   2 つの形式が混ざってよい」が同じ受理を含んでいる。後者だけ残せる（-3 行）
5. `src/lib/career.ts` の `formatDate` の `hasDay` 変数と条件付きスプレッドは、
   `day: date.split('-').length === 3 ? 'numeric' : undefined` の 1 行に畳める（-3 行）

### URL まわり

6. `src/lib/site.ts` の `canonicalUrl` は `lang` が `path` と食い違うと別ページの URL を黙って返す
   （`canonicalUrl('/ja/career/', 'en', …)` → `…/en/career/`）。いまは `BaseLayout.astro` が同じ `path` から
   導いた `pathLocale` を渡すので到達しない。引数を落として内部で `localeFromPath` する方が安全
7. `canonicalUrl` は `site` にパスがあると捨てる（`https://example.com/sub/` → `/sub` が消える）。
   いまの `astro.config.ts` の `site` はパス無しなので到達しないが、独自ドメイン移行で `site` を
   変えるときの地雷
8. `tests/unit/site.test.ts` の「URL オブジェクトの site も受ける」は実質 `new URL()` の標準挙動の確認で、
   `canonicalUrl` 固有の分岐を 1 つも通らない。`canonicalUrl` の it 4 本は 1 本に畳める（-11 行）

### SEO まわり

9. 写真の個別ページの `description` が汎用の `tagline` になっている。写真の `title` と `location` を使った
   ページごとの文面にできる（design D6 で「分岐を持つ価値が無い」として見送った既知のトレードオフ）
10. OGP と Twitter Card が無い。SNS に貼ったときの見た目は素のまま
11. サイトマップに `<lastmod>` が無い。正確な最終更新日を持っていないため出していない。git の
    コミット日時を使う手はある
12. `CLAUDE.md` の「次にやることの候補」に残っている「sitemap と robots.txt の追加」は、この change で
    sitemap を入れ robots.txt は作らないと決めたので、候補から外す（wrap-up で対応する）

### 環境

13. `astro preview --port <n>` が指定を無視して別のポートで起動することがある。この change でも
    `--port 4321` が無視されて 4322 になった（直前に `astro preview stop` で「No preview server is running」
    を確認済みなので、この worktree 内の別プレビューが原因ではない）。`deploy-and-e2e` の後続提案に既出
14. worktree のガードが `&&` で連結した複数コマンドを拒否するため、検証の `grep` を 1 本ずつ実行する
    必要がある。手数が増える
