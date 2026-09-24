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
- [ ] 2.4 既存のベースラインの検査（ロゴとナビの文字の差が 0.5px 以内）の対象に `JA` と `EN` の両項目を足し、1280×720 と 480×844 の両ロケールで緑になることを確かめる

## 3. 番人の確認と仕上げ

- [ ] 3.1 変異を当てて 2.1・2.2・2.4 のテストが落ちることを確かめる（`docs/harness/README.md` の隔離実行の手順）。少なくとも次の変異を当てる
  - (a) 表示中の言語もリンクにする
  - (b) `aria-current` を外す
  - (c) 太字を外す
  - (d) 並びを表示中の言語が先頭に来る形にする
  - (e) 地球儀を `EN` のリンクの中に戻す
  - (f) ヘッダーの区切り線を消す
  - (g) 本文にも区切り線を付ける
  - (h) グループの `aria-label` を両ロケールで同じ文言にする
  - (i) 表示中の項目にだけ `vertical-align: top` を付けてベースラインをずらす
- [ ] 3.2 `pnpm lint` / `pnpm typecheck` / `pnpm test` / `pnpm build` / `pnpm e2e` をすべて実行し、コマンドと出力を報告に添える

## 提案（本 change のスコープ外・後続への申し送り）
