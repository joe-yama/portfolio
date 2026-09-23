# Design

## Context

トップページ（`src/pages/[lang]/index.astro`）は、`navLinks()` の戻り値と、ページ内の配列 `navIcons = [camera, briefcase]` を `pairByIndex()` で位置どうしに対応づけ、言語切り替えには `globe` を直書きしている。ヘッダー（`src/components/Header.astro`）は同じ `navLinks()` / `languageSwitch()` を使うが、アイコンを持たない。アイコンの描画は `PixelArt`（`scale=1` で 16px、`aria-hidden="true"`）。

## Goals / Non-Goals

**Goals**: ヘッダーの 3 リンクにトップ本文と同じアイコンを付ける。対応づけを 1 か所にして、ヘッダーとトップで食い違えないようにする。

**Non-Goals**: 図柄の変更、ヘッダーのレイアウト（余白・折り返し）の変更、404 のヘッダー、写真の高さ上限の式の変更。

## Decisions

### D1: アイコンを導線のデータに持たせる

`NavLink` と `LanguageSwitch` に `icon: readonly string[]` を足し、`navLinks()` が Photos に `camera`、Career に `briefcase` を、`languageSwitch()` が `globe` を返す。`index.astro` の `navIcons` と `pairByIndex()` とそのテストは消す（到達しない分岐ごと。約 -22 行）。

- 代案: ヘッダーにも `navIcons` を置いて `pairByIndex` を共用する → 対応表が 2 か所になり、片方だけ直す事故が起きうる
- `src/lib/pixel.ts` は astro に依存しない純データなので、`site.ts` から import しても node 直実行の経路を壊さない

### D2: 大きさと並び

トップ本文と同じ `PixelArt scale={1}`（16px）を文字の左に置き、リンクを `display: inline-flex; align-items: center; gap: 0.35em` にする。本文の行の高さ（16px × line-height）より小さいので、ヘッダーの高さは変わらない想定。これを e2e で「リンクの高さ ≤ そのリンクの computed `line-height`」として固定する（spec の Scenario「アイコンで行が高くならない」）。写真の高さ上限の式（`100svh - 18rem` / `- 27rem`）はヘッダーの高さを前提にしているため、既存の `viewport.spec` もそのまま番人になる。

**D2 追補（PO 決定 2026-09-23、Task 2 のレビューで判明）**: アイコンと gap でナビが約 65px 広がり、390px でヘッダーが 2 行（65px → 98.6px）になった。1 行に収まる最小幅は約 443px。`@media (max-width: 29.99rem)` でヘッダーの svg を `display: none` にし、狭い画面では今と同じ 1 行を保つ。30rem（480px）は両ロケールで 1 行に収まることを e2e で固定する。トップ本文の導線のアイコンは隠さない（本文は折り返してよい）。

`header` は `align-items: baseline` なので、ナビのリンクを flex にしてもロゴとの文字のベースラインが揃うことを実装時に目視で確かめる。

### D3: e2e の比較を href に結びつける

`links.spec.ts` の導線アイコンの検査を `nth(i)` の位置比較から、`a[href$="/photos/"]` → camera、`a[href$="/career/"]` → briefcase、`a[hreflang]` → globe のように行き先で選んで比べる形にする。ヘッダーの検査も同じ表で行う（ヘッダーとトップの両方を 1 つの表で回す）。

### D4: `careerSections` の型

`UiStrings.careerSections` を `Record<CareerSection, string>`（`CareerSection = 'experience' | 'skills' | 'certifications' | 'achievements' | 'patents'`）にする。挙動は変わらない。

## Risks / Trade-offs

- ヘッダーの折り返し: 320px 幅で 3 リンクの幅が 16px + gap ずつ増える。既存の Scenario「狭い画面」（横スクロールなし・全リンク表示）の e2e が番人になる。折り返しが 1 行増えること自体は spec 上許容
- 並行の worktree（`feature/followup-minors-2`）が `tests/e2e/links.spec.ts` と `src/lib/site.ts` に触らないよう範囲を分けてある。PR 前に `origin/main` へ rebase する
