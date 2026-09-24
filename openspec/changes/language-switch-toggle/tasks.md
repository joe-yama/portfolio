# Tasks

## 1. 言語切り替えのデータ（D1）

- [x] 1.1 RED: `tests/unit/site.test.ts` の `describe('languageSwitch')` を D1 の形に書き直し、失敗を確認する。確かめること: `languageSwitch('/ja/career/', 'ja', '/')` が `{ label: '言語', icon: globe, items: [{ lang: 'ja', label: 'JA' }, { lang: 'en', label: 'EN', href: '/en/career/' }] }` を返すこと、`/en/` の英語版では `JA` 側だけに `href: '/ja/'` があり、`label` が `'Language'` になること、base `/portfolio/` を保つこと。`ui.languageName` を参照するテストがあれば `ui.*.languageSwitch` に置き換える
- [x] 1.2 GREEN: `src/lib/site.ts` の `LanguageSwitch` 型と `languageSwitch()` を D1 のとおりに変え、`ui.languageName` を消して `ui.*.languageSwitch` を足す。`pnpm test` で 1.1 が緑になることを確かめる（ページの描画は 2 で直すので、ここではコミットしない。1.2 と 2.3 を 1 つのコミットにする）

## 2. ヘッダーとトップ本文のまとまり（D2、D4、spec の各 Scenario）

- [x] 2.1 RED: `tests/e2e/links.spec.ts` で、両ロケールの代表ページ（トップ・写真一覧・写真個別・経歴）について次を確かめるテストを書く。ヘッダーの言語切り替えを `getByRole('group', { name })` で選ぶ
  - 項目の文字が `JA` `/` `EN` の順に並ぶ
  - 表示中のロケールの項目は `<a>` ではなく、`aria-current="true"` を持ち、computed の `font-weight` が 700 以上
  - もう一方の項目は `<a>` で、`hreflang` と `lang` が相手のロケール、`href` が同じページの他言語版
  - 地球儀の svg（`globe` の座標と完全一致、`aria-hidden="true"`）がまとまりの直下に 1 つだけあり、項目の中には無い
  - 1280×720 と 390×844 で、まとまりの computed `border-left-width` が 1px 以上

  既存の検査表 `navIconTable` の言語切り替えの行と、名前が「English」「日本語」であることの検査は、この検査に置き換える。失敗を確認する
- [x] 2.2 RED: 同じファイルで、`/ja/` と `/en/` の本文の導線（`nav[aria-label]`）の言語切り替えに、2.1 と同じ検査（区切り線を除く）を当てる。本文のまとまりに境界線が無いことも確かめる。本文の導線の並びが Photos → Career → 言語切り替えの順であることも確かめる。失敗を確認する
- [x] 2.3 GREEN: `src/components/Header.astro` と `src/pages/[lang]/index.astro` を D2 のマークアップにし、ヘッダーのまとまりにだけ区切り線を付ける。`pnpm e2e` で 2.1・2.2 と、既存の「狭い画面ではヘッダーのアイコンを隠す」（390px・479px で 1 行）・「境界の幅では 1 行のままアイコンを出す」・「アイコンで行が高くならない」（まとまりも対象に足す）・「狭い画面」（320px）が緑になることを確かめる。390px で 1 行に収まらなければ design の Risks の手順に従う
- [x] 2.4 既存のベースラインの検査（ロゴとナビの文字の差が 0.5px 以内）の対象に `JA` と `EN` の両項目を足し、1280×720 と 480×844 の両ロケールで緑になることを確かめる

## 3. 番人の確認と仕上げ

- [x] 3.1 変異を当てて 2.1・2.2・2.4 のテストが落ちることを確かめる（`docs/harness/README.md` の隔離実行の手順）。少なくとも次の変異を当てる
  - (a) 表示中の言語もリンクにする
  - (b) `aria-current` を外す
  - (c) 太字を外す
  - (d) 並びを表示中の言語が先頭に来る形にする
  - (e) 地球儀を `EN` のリンクの中に戻す
  - (f) ヘッダーの区切り線を消す
  - (g) 本文にも区切り線を付ける
  - (h) グループの `aria-label` を両ロケールで同じ文言にする
  - (i) 表示中の項目にだけ `vertical-align: top` を付けてベースラインをずらす（flex アイテムには vertical-align が効かないので position: relative; top: 1px で当てた）
- [x] 3.2 `pnpm lint` / `pnpm typecheck` / `pnpm test` / `pnpm build` / `pnpm e2e` をすべて実行し、コマンドと出力を報告に添える

## 提案（本 change のスコープ外・後続への申し送り）

ブランチ全体のレビュー（Approved、Critical / Important 0）の Minor・ponytail と、PO の判断が要る件。

**PO の判断**
- 擬似太字がほぼ見えない: 1280px・DPR 1 で `font-weight` 700 と 400 の画素差は約 0.66%。表示中の言語は実質、下線の有無で区別されている（spec の computed 700 は満たす）。太字は PO の選んだ見た目なので実装では代えていない
- 区切り線の左右の余白の差: Career → 区切り線が 20px（nav の gap 1.25rem）、区切り線 → 地球儀が 12px（`padding-left: 0.75rem`）。1.25rem では 390×844 の全ページでヘッダーが 2 行になったため詰めた（design Risks の手順）。そろえるには nav の gap を変える必要がある
- 390px の余裕は 3.81px。`profile.name` が 1 文字増えるとヘッダーが 2 行になる（375px は変更前から 2 行）

**Minor**
- `src/components/Header.astro:4` のコメントが 100 字を超える（Biome は frontmatter を見ない）
- `tests/e2e/links.spec.ts` の 320px の検査がトップと経歴の 4 ページだけ。`pagePaths` に広げる
- 区切り線の検査が `border-left-width` だけで、`border-left-color: transparent` の変異では落ちない。`border-left-style` と色も見る
- 390・479・480px の検査が「各リンクに svg 1 つ」から「svg が合計 3 つ」になった（要素ごとの検査は既定の画面幅の別の test が全ページで見ている）

**ponytail**
- `Header.astro` の `nav a :global(svg)` と `.lang-switch :global(svg)` の `align-self: center` を `nav :global(svg)` 1 つにまとめる
- `links.spec.ts` の本文の導線の検査で `navIconTable[0]` / `[1]` を手で並べている箇所を `navIconTable.map` にする
- main（#61）の取り込み後、`tests/e2e/viewport.spec.ts` の横並びの検査（`main nav.links a`）は、言語切り替えのまとまりのうち相手の言語のリンクしか測らない（地球儀と表示中の項目は測らない）。同じ行にあるので主張は保たれるが、セレクタに `main nav.links [role="group"]` を足せば元どおりまとまり全体を測れる
