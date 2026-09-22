# Proposal

## Why

Change 7〜11 が後続に回した申し送り（64 件）を main のコードに照らして仕分けたところ、21 件は解消済みだった。残りのうち、壊れる入力や番人（テスト）の穴に当たる 7 件と、挙動を変えない品質改善が今も有効だった。change はできるだけまとめる方針（PO 指示 2026-09-21）に沿い、並行して進む `icon-refresh`（トップページとドット絵）と衝突しないものを 1 つにまとめて片付ける（PO 承認 2026-09-23）。

## What Changes

**壊れる入力・番人の穴（A）**
- 特許の見出しの長さ検証が受け取る言語を、任意の文字列ではなくロケールの型にする（`'JA'` を渡すと日本語データが英語の上限で黙って検査される）
- `pnpm photo:add` が不正な slug や未知のオプションを受け取ったとき、スタックトレースではなく他の中断と同じ体裁の 1 行で理由を示して中断する。末尾が `.` の slug も拒否する（**spec 改定**）
- 経歴の検証がビルドの経路から外れたら落ちるテストを足す
- e2e のアクセシビリティ・ネットワーク検査で応答ステータスを確かめる（404 を見落とさない）
- e2e の対象ページを写真データから導き、未検査の写真ページ（日英 2 ページ）を含める
- 特許の `url` を必須にし、`url` を持たない場合の表示分岐を消す（**BREAKING / spec 改定**。現データ 65 件はすべて `url` を持つ。PO 決定 2026-09-23）
- 同じ言語のデータで特許の公報番号が重複したらビルドを失敗させる（**spec 改定**）

**品質改善（B、挙動不変）**
- 暦日の検証の年 0001〜0099 の誤判定を直す、経歴の日英比較ループの一本化、`ogLocale` をロケール一覧から導く、未使用の型・恒等写像・到達しない分岐の削除、テストの重複・死んだ分岐・未使用変数の整理、入稿スクリプトの cwd 依存の解消と簡素化 など（一覧は `tasks.md`）

**含めない**: トップページ・ヘッダー・写真個別ページ・`PhotoPicture`・`viewport.spec` に触る項目（`icon-refresh` と衝突、または写真表示の設計に関わる）、新機能に当たる項目（写真ページごとの OGP、印刷用 CSS など）、PO の判断・素材が要る項目。仕分けの結果、B から外したもの 5 件（特許一覧の `<ul>` 統合 = `<details>` を `<ul>` の子に置けず不正な HTML になる、`deploy.yml` の lockfile = 対応不要と裁定済み、アーカイブ済み設計書の修正、`absoluteUrl` への検査追加 = 起きていない問題への備え、`ogLocale` の置き場所の移動 = 移動だけの変更）。

## Capabilities

### New Capabilities

なし

### Modified Capabilities

- `content-schema`: 特許のデータ構造で `url` を必須にし、同じ言語での `number` の重複を禁止する
- `profile-and-career`: 特許の表示で、すべての見出しを `url` へのリンクにする（`url` の有無による分岐をなくす）
- `photo-pipeline`: 入稿コマンドが解釈できない引数・使えない slug を 1 行の理由で中断する

## Impact

- `src/content/schemas.ts`、`src/lib/validate.ts`、`src/lib/content.ts`、`src/lib/career.ts`、`src/lib/site.ts`、`src/lib/theme.ts`、`src/lib/photo-meta.ts`、`scripts/photo-add.ts`
- `src/components/PatentItem.astro`、`src/pages/[lang]/career.astro`
- `tests/unit/*`（schemas / validate / career / site / photo-meta など）、`tests/e2e/{pages,a11y,network}.spec.ts`、`tests/e2e/paths.ts`、`tests/e2e/global-setup.ts`
- 公開サイトの見た目は変わらない（特許は全件すでにリンク付き）
