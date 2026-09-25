# Proposal

## Why

ヘッダーの言語切り替えは「Photos  Career  English」と、ページへのリンクと同じ見た目で並んでいる。そのため 3 つ目のページに見え、ここで表示言語を切り替えられると一目では分からない（PO 指摘 2026-09-24）。幅 480px 未満では地球儀のアイコンも隠れるので、なおさら区別がつかない。トップ本文の導線も同じ作りになっている。

## What Changes

- 言語切り替えを、両方の言語を並べた 1 つのまとまり `JA / EN` にする。表示中の言語は太字にしてリンクにせず、表示中であることを示す印（`aria-current`）を付ける。もう一方の言語だけを、同じページの他言語版へのリンクにする。並び順はどのページでも `JA / EN` に固定する（PO 決定 2026-09-24）
- まとまりには支援技術向けの名前（日本語ページでは「言語」、英語ページでは「Language」）を付ける
- 地球儀のドット絵は、リンクの中ではなくまとまりの先頭に 1 つだけ置く。幅 30rem（480px）未満でヘッダーのアイコンを隠す規則は変えない
- ヘッダーでは、Photos / Career とまとまりのあいだに縦の区切り線を入れる
- トップ本文のサイト内の導線から言語切り替えを外し、Photos / Career の 2 つだけにする。言語切り替えはヘッダーにだけ置く（PO 決定 2026-09-25。Photos / Career と同列に並ぶと、ページへの導線と見分けにくいため）
- 相手の言語名（「English」「日本語」）の表示をやめる

**含めない**: 他言語版の URL の求め方（`i18n-routing`）、404 ページ（言語切り替えを持たない）、Photos / Career の見た目、ヘッダーの余白やフォントの変更、ブラウザの言語設定による自動の振り分け。

## Capabilities

### New Capabilities

なし

### Modified Capabilities

- `layout-shell`: ヘッダーの要求で、言語切り替えを「相手の言語名を表示する 1 つのリンク」から「`JA / EN` を並べ、表示中の言語はリンクにしないまとまり」に変える。アイコンの付け方と区切り線の規則も直す
- `profile-and-career`: トップページのサイト内の導線の要求で、本文の言語切り替えを無くし、Photos / Career の 2 つにする

## Impact

- `src/lib/site.ts`（`languageSwitch()` の戻り値と `LanguageSwitch` 型。`ui.languageName` をやめ、まとまりの名前を足す）
- `src/components/Header.astro`、`src/pages/[lang]/index.astro`
- `tests/unit/site.test.ts`、`tests/e2e/links.spec.ts`（言語切り替えの検査を `a[hreflang]` から、まとまりを単位にした検査に直す）、`tests/e2e/pages.spec.ts:195`（`header a[hreflang="en"]` のクリックは、まとまりの中のリンクとしてそのまま残る見込み）
- 見た目: 全ページのヘッダーの言語切り替えが変わり、トップ本文から言語切り替えが消える
