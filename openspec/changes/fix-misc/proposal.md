# Proposal

## Why

サイト公開後に見つかった軽微な見た目・コンテンツの修正を、都度 change を分けずに 1 つにまとめて片付ける。1 件目はヘッダー左の名前リンクの下線が見た目として過剰なため除去する。

## What Changes

- ヘッダー左の "Josuke Yamane"（ロゴ）リンクから下線（`text-decoration: underline`）を除去する。リンク先・クリック可能性は変更しない。
- 現状 `src/styles/global.css` の `a { text-decoration: underline; }` がサイト全体のリンクに一律適用されており、ヘッダーロゴ用の個別スタイルが無いため、`.logo` に限定した上書きを追加する（他のリンクの下線は変更しない）。
- 本 change は今後も同種の軽量な見た目・コンテンツ修正を逐次追加して束ねる想定（PO 指示: change はできるだけまとめる）。

## Capabilities

### New Capabilities

なし

### Modified Capabilities

なし（`layout-shell` はヘッダーロゴリンクの内容・遷移先・順序のみを規定しており、下線の有無など視覚的な装飾は要求していない。挙動は変わらないため spec 変更は無し。`.openspec.yaml` に `skip_specs: true` を設定済み）

## Impact

- `src/components/Header.astro`（`.logo` の scoped style に 1 行追加）
- 他のリンク（本文中のリンクなど）の見た目・挙動には影響しない
