# Design

## Context

トップページ本文の末尾に 2 つのブロックがある（`src/pages/[lang]/index.astro`）:
- `<ul class="links">`: `profile.links`（GitHub・LinkedIn）。現在は文字のみ、`kind` の表示は spec で禁止されていた
- `<nav class="links">`: サイト内導線（Photos・Career・言語切り替え）

ドット絵は `src/lib/pixel.ts` の 16×16 グリッド（`#`＝塗り、`.`＝透過）＋ `src/components/pixel/PixelArt.astro`（`currentColor` で描画、`aria-hidden="true"`）という既存の仕組みがあり、トップの代表写真下のカメラのドット絵で使われている。この仕組みをそのまま再利用する。

PO 承認（2026-09-22）: `profile-and-career` の「種別をアイコンとして表示してはならない」要件を緩和し、`github` / `linkedin` にはアイコン表示を MUST とする spec 変更を、本 change（小さな change の経路）に含めて進める。アイコンの視覚スタイルは既存のドット絵（PixelArt）の世界観に合わせる（PO 決定）。

## Goals / Non-Goals

**Goals:**
- 連絡先リンク（GitHub・LinkedIn）とサイト内導線（Photos・Career・言語切り替え）の 5 つのリンクに、既存のドット絵アイコンの仕組みで意匠を追加する
- 本文最下部の並びを「サイト内導線 → 連絡先リンク」に入れ替える（連絡先リンクが最も下）
- 「トップページの初見表示」（1280×720 / 1440×900 でスクロールなしに全要素が見える）を崩さない

**Non-Goals:**
- ヘッダーの常設ナビ（`src/components/Header.astro` の `<nav>`）へのアイコン追加。今回はトップページ本文限定（後続への提案として tasks.md 末尾に記録）
- favicon やその他ページのドット絵の変更
- `email` / `x` / `other` 種別のアイコン意匠（データに存在しないため今回は作らない。YAGNI）

## Decisions

**D1. アイコンは 16×16 グリッド、`scale=1`（16px）で描画する。**
既存のドット絵の慣習（`pixel.ts` 冒頭コメント「ドット絵は 16×16 の格子」）に合わせる。他の `scale` 値（2 以上）は本文の行の高さに対して大きすぎるため不採用。

**D2. Photos のアイコンは既存の `camera` グリッドを再利用する。新規に描き起こさない。**
ヒーロー写真下の装飾ドット絵と同じカメラで意味が重複しない（「写真」を表す記号として一貫する）。新規アイコンを増やすと今後のメンテナンス対象が増えるため、流用できるものは流用する（YAGNI）。

**D3. GitHub・LinkedIn・Career（鞄）・言語切り替え（地球儀）は新規にドット絵を描き起こす。**
`pixel.ts` に `github`・`linkedin`・`briefcase`・`globe` の 4 つの `readonly string[]` 定数を追加する。いずれも 16 行 × 16 列（各行 16 文字）。デザインの精度は既存の `camera` / `lost` と同じ「Agent 作の仮の絵」扱い（2026-09-18 の PO 決定と同水準）とし、ブランドロゴの正確な再現は目指さない。

**D4. アイコンとラベル文字は同じ `<a>` の中で横並び（アイコンが先、ラベルが後）にする。**
`<a>` に `display: flex; align-items: center; gap: 0.35em;` を付ける。アイコンは装飾（`PixelArt` が既定で `aria-hidden="true"`）なので、リンクの実質的なアクセシブルネームはラベル文字のまま変わらない。

**D5. 並び替えは JSX の記述順を入れ替えるだけで、CSS の `order` は使わない。**
`tests/e2e/links.spec.ts` の内部参照検査や既存の DOM 構造の前提を崩さず、ソース順と表示順を一致させる（読みやすさ・保守性を優先）。

## Risks / Trade-offs

- [Risk] 手描きの 16×16 ドット絵は GitHub・LinkedIn のロゴとして視認性が低い可能性がある → Mitigation: レビューで reviewer が Playwright でスクリーンショットを撮り、実際の見た目を確認する（`.claude/rules/review.md` の UI 実測）。閾値を超えて崩れている場合は Issue にコメントし、後続 change でドット絵を差し替える
- [Risk] アイコン追加で `ul.links` / `nav.links` の行の高さが増え、「トップページの初見表示」（1280×720 でスクロール無し）の下限を割る可能性がある → Mitigation: 既存の `tests/e2e/viewport.spec.ts` の `assertBottomsWithinViewport` がクラスセレクタ（`main ul.links li a` / `main nav.links a`）で並び順に依存せず検証するため、実装後にそのまま regression として効く。`pnpm e2e` で確認する
- [Risk] スコープを「トップページ本文限定」にしたことで、ヘッダー常設ナビとの意匠の不整合が生まれる → Mitigation: Non-Goals に明記し、tasks.md 末尾に後続への提案として記録する

## Migration Plan

ビルド時に静的生成されるだけで、ランタイムの移行やロールバック手順は不要。通常の PR マージで反映する。
