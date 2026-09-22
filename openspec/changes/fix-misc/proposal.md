# Proposal

## Why

サイト公開後に見つかった軽微な見た目・コンテンツの修正を、都度 change を分けずに 1 つにまとめて片付ける。1 件目はヘッダー左の名前リンクの下線が見た目として過剰なため除去する。

## What Changes

- ヘッダー左の "Josuke Yamane"（ロゴ）リンクから下線（`text-decoration: underline`）を除去する。リンク先・クリック可能性は変更しない。
- 現状 `src/styles/global.css` の `a { text-decoration: underline; }` がサイト全体のリンクに一律適用されており、ヘッダーロゴ用の個別スタイルが無いため、`.logo` に限定した上書きを追加する（他のリンクの下線は変更しない）。
- トップページ本文の最下部の並びを入れ替える: 現状は連絡先リンク（`ul.links`: GitHub / LinkedIn）→ サイト内導線（`nav.links`: Photos / Career / 言語切り替え）の順だが、これを サイト内導線 → 連絡先リンク の順にする（連絡先リンクが本文の最も下に来る）。
- GitHub・LinkedIn の連絡先リンクに、サイトの配色に追従するドット絵アイコン（既存の `PixelArt` コンポーネントと同じ技法）を付ける。**BREAKING**（`profile-and-career` の既存要件「種別を文字やアイコンとして表示してはならない」を緩和する spec 変更を伴う。PO 承認 2026-09-22）
- サイト内導線（Photos・Career・言語切り替え）にも同じ技法でドット絵アイコンを付ける（Photos は既存の `camera` ドット絵を再利用、Career は新規の鞄、言語切り替えは新規の地球儀）
- 本 change は今後も同種の軽量な見た目・コンテンツ修正を逐次追加して束ねる想定（PO 指示: change はできるだけまとめる）

## Capabilities

### New Capabilities

なし

### Modified Capabilities

- `profile-and-career`: 「トップページの連絡先リンク」要件を改定し、`kind` が `github` / `linkedin` のリンクにはドット絵アイコンの表示を **MUST** とする（従来の「種別をアイコンとして表示してはならない」から変更。PO が意図的に承認した仕様変更）。「トップページのサイト内の導線」要件を改定し、3 つの導線リンクにもドット絵アイコンの表示を **MUST** とする

## Impact

- `src/components/Header.astro`（`.logo` の scoped style に 1 行追加。タスク1で対応済み）
- `src/pages/[lang]/index.astro`（本文最下部のブロック順序の入れ替え、各リンクへのアイコン追加、レイアウト用 CSS）
- `src/lib/pixel.ts`（GitHub・LinkedIn・Career・言語切り替え用のドット絵グリッドを追加。Photos は既存の `camera` を再利用）
- `openspec/specs/profile-and-career/spec.md`（本 change のアーカイブ時に delta を反映）
- 他のページ（ヘッダーの常設ナビ、404 など）の見た目・挙動には影響しない（トップページ本文限定のスコープ）
