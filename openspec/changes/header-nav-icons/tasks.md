# Tasks

## 1. 導線がアイコンを持つ（D1、D4）

- [x] 1.1 RED: `tests/unit/site.test.ts` で、`navLinks()` の Photos が `camera`、Career が `briefcase`、`languageSwitch()` が `globe` を `icon` に持つことを確かめるテストを書き、失敗を確認する。`pairByIndex` の describe は消す
- [x] 1.2 GREEN: `src/lib/site.ts` の `NavLink` / `LanguageSwitch` に `icon` を足し、`navLinks()` / `languageSwitch()` が返すようにする。`pairByIndex` を消す。`index.astro` を `link.icon` / `sw.icon` で描くように変え、`navIcons` を消す（トップの見た目は変わらない）
- [x] 1.3 `UiStrings.careerSections` を `Record<CareerSection, string>` にする（D4、挙動不変）
- [x] 1.4 `tests/unit/site.test.ts` の canonicalUrl のテストの畳み込み（「URL オブジェクトも受ける」を既存のケースに寄せる。Change 7 の ponytail D8）

## 2. ヘッダーのアイコン（D2、spec「ナビのアイコン」「アイコンで行が高くならない」）

- [x] 2.1 RED: `tests/e2e/links.spec.ts` に、両ロケールの代表ページ（トップ・写真一覧・写真個別・経歴）でヘッダーの Photos / Career / 言語切り替えがそれぞれ camera / briefcase / globe の座標と完全一致する `svg[aria-hidden="true"]` を 1 つだけ持ち、ロゴに `svg` が無いことを確かめるテストを書く。比較は行き先（`href` / `hreflang`）で選ぶ（D3）。失敗を確認する
- [x] 2.2 RED: 390×844（2.5 で 480×844 に変更）と 1280×720 で、ヘッダーのアイコン付きリンクの高さがそのリンクの computed `line-height` 以下であることを確かめるテストを書く
- [x] 2.3 GREEN: `src/components/Header.astro` のナビ 3 リンクに `PixelArt rows={…icon} scale={1}` を文字の前に置き、リンクを `inline-flex` + `align-items: center` + `gap: 0.35em` にする。ロゴとのベースラインの揃いを目視で確かめる
- [x] 2.4 既存のトップページの導線アイコンの検査（`links.spec.ts:75-80`）を、`nth(i)` の位置比較から行き先で選ぶ比較に書き換え、2.1 と同じ対応表を使う（`icon-refresh` 申し送り 2）

- [x] 2.5 RED→GREEN（PO 決定 2026-09-23、D2 追補）: 390×844 で両ロケールの代表ページのヘッダーのアイコンが表示されず（`toBeHidden`）ロゴとナビが同じ行に並ぶこと、480×844 でアイコンが表示され同じ行に並ぶことを確かめる e2e を書き、失敗を確認してから、`Header.astro` に `@media (max-width: 29.99rem)` でナビの svg を `display: none` にする規則を足す。2.2 の検査幅を 390 → 480 にする（spec delta の Scenario 変更に合わせる）

## 3. 番人の確認と仕上げ

- [x] 3.1 変異を当てて 2.1・2.2・2.4 のテストが落ちることを確かめる（`docs/harness/README.md` の隔離実行の手順）。少なくとも: (a) ヘッダーの Career に camera を渡す、(b) ヘッダーのアイコンを `scale={2}` にする、(c) `navLinks()` の Photos と Career の順を入れ替える（トップの比較が href に結びついていれば、図柄の取り違えは起きず緑のままであることも確かめる）、(d) ロゴに svg を足す、(e) トップ本文の Photos の図柄を取り違える（2.4）、(f) 2.5 の media query を消す、(g) media query の閾値を 20rem にする
- [x] 3.2 `pnpm lint` / `pnpm typecheck` / `pnpm test` / `pnpm build` / `pnpm e2e` をすべて実行し、コマンドと出力を報告に添える

## 提案（本 change のスコープ外・後続への申し送り）
