# Design

## Context

`languageSwitch(path, lang, base)`（`src/lib/site.ts:144`）は、相手の言語の 1 リンク分のデータ `{ label: ui[target].languageName, href, hreflang, icon: globe }` を返す。ヘッダー（`src/components/Header.astro`）とトップ本文（`src/pages/[lang]/index.astro`）は、どちらもこれを `<a hreflang lang><PixelArt/>{label}</a>` と描いている。リンクはすべて下線付きで（`src/styles/global.css:50`）、ナビの文字は DotGothic16（`.dot`、`font-weight: 400`）で表示する。ヘッダーのアイコンは `@media not all and (min-width: 30rem)` で `nav svg` ごと隠している。

e2e の `tests/e2e/links.spec.ts` は、言語切り替えを `a[hreflang]` で選び、その中の svg の図柄と、名前が「English」「日本語」であることを確かめている。

## Goals / Non-Goals

**Goals**: ヘッダーとトップ本文の言語切り替えを、同じデータと同じ形の `JA / EN` のまとまりにする。

**Non-Goals**: まとまりを共通のコンポーネントに切り出すこと（D3）、Photos / Career の描き方の変更。

## Decisions

### D1: `languageSwitch()` は両方の言語の項目を返す

戻り値を次の形にする。

```ts
type LanguageSwitch = {
  label: string;                 // まとまりの名前（ui[lang].languageSwitch: '言語' / 'Language'）
  icon: readonly string[];       // globe
  items: {
    lang: Locale;                // 'ja' | 'en'（locales の順）
    label: string;               // 'JA' | 'EN'（lang.toUpperCase()）
    href?: string;               // 表示中の言語では無し。相手は alternatePath(path, lang, base)
  }[];
};
```

表示中かどうかは `href` があるかどうかで決める（`current` のフラグは持たない。フラグと `href` が食い違う状態を作らないため）。`ui.languageName` はほかで使っていないので消し、まとまりの名前 `ui.*.languageSwitch` を足す。

- 代案: 相手の言語のリンク 1 つを返す今の形のまま、表示中の言語はページ側で描く → ヘッダーとトップで同じ組み立てを 2 回書くことになり、並び順が食い違いうる

### D2: マークアップ

```html
<span class="lang-switch" role="group" aria-label="言語">
  <svg aria-hidden="true">…globe…</svg>
  <span lang="ja" aria-current="true">JA</span>
  <span aria-hidden="true">/</span>
  <a href="/en/…" hreflang="en" lang="en">EN</a>
</span>
```

- 区切りの「/」は支援技術から隠す（「JA スラッシュ EN」と読ませないため）
- 表示中の項目は `font-weight: 700` にする。DotGothic16 には太字が無いので、ブラウザが擬似的に太字を作る
- ヘッダーでは `.lang-switch` に `border-left: 1px solid var(--line)` と左の余白を付ける。トップ本文では付けない
- まとまりは `inline-flex` + `align-items: baseline` にし、svg だけを `align-self: center` にする。これで、ヘッダーのほかのリンクとベースラインをそろえる今のやり方（`Header.astro` の `nav a`）に合わせる

### D3: コンポーネントは切り出さない

ヘッダーとトップ本文の違いは区切り線だけで、マークアップは 10 行ほど。同じ形になっているかは、e2e の同じ検査表を両方に当てて確かめる。共通のコンポーネントにすると scoped CSS とスロットの受け渡しが増えるので、今回は各ページに直接書く。

### D4: e2e の検査の単位

`links.spec.ts` の検査表で、言語切り替えを `a[hreflang]` ではなく `[role="group"]` で選ぶ。地球儀の svg は、まとまりの直下に 1 つだけあり、項目の中には無いことを確かめる。名前の検査は「English / 日本語」から、グループ名（「言語」 / 「Language」）と各項目の文字（`JA` / `EN`）に置き換える。`pages.spec.ts:195` の `header a[hreflang="en"]` は、日本語ページでは `EN` のリンクに当たるので、そのまま使える。

## Risks / Trade-offs

- [DotGothic16 の擬似太字がにじんで読みにくい] → reviewer が Playwright のスクリーンショットで 1280px と 390px の見た目を確かめる。読みにくければ PO に報告して止める（太字は PO の選んだ見た目なので、実装で勝手に代えない）
- [「English」より幅が広がり、390px で英語ページのヘッダーが 2 行になる] → 既存の Scenario「狭い画面ではヘッダーのアイコンを隠す」（390px・479px で 1 行）の e2e が番人になる。落ちたら、まず区切り線の余白を詰める。それでも収まらなければ、spec と両立しない計画の欠陥として PO に確認する
- [`[role="group"]` の選び方がほかの要素と衝突する] → ヘッダーとトップ本文に、ほかに group は無い。検査はクラスではなく role と名前で選ぶ
