# Proposal

## Why

アーカイブ済みの change 7 件が「後続へ」と送った提案が 62 件たまり、そのうち複数は実際に踏むことが確認済みの欠陥である。写真を 1 枚差し替えるだけで人が日英で書いた `title` / `location` / `alt` が `TODO:` に戻り、CLAUDE.md はその回避手順を 2 つ載せたまま運用している。罫線と背景のコントラストは実測 3.098 で閾値 3.0 に 3% しか余裕が無いのに、それを守るテストが 1 本も無い。`astro preview` の占有によりローカルの e2e が別の `dist` を検査する「偽の緑」は 3 つの change で繰り返し踏まれている。

いずれも単独では小さく、単独で change を起こす価値が無いために先送りされてきた。まとめて 1 回で片付ける。

## What Changes

- **写真の再入稿で人が書いたデータが消えないようにする**。既存の写真データファイルがあるときは上書きせず、画像だけ差し替えて終える。あわせて、その経路でだけビルドキャッシュの画像を捨て、温かいキャッシュに古い画像が残る Astro 側の既知の不具合を自動で回避する。CLAUDE.md の写真差し替え注意書き 2 つが不要になる
- **SNS に貼られたときのカード（OGP / Twitter Card）を出す**。代表写真から 1200×630 の派生画像を生成し、全ページ共通で使う
- **色のコントラストに番人を置く**。罫線と補助文字の下限を spec に明文化し、`global.css` を正本として単体テストが検算する。ファビコンが `--fg` と別に持っているリテラルのずれも同じテストが捕まえる
- **`pnpm e2e` が別ディレクトリのビルド出力を検査しないようにする**。配信サーバが既に動いていたら失敗させ、停止は自分が起動したときだけ行う
- **暦として存在しない日付を弾く**（`2025-02-30` が `2025年3月2日` に黙って転がる）
- **日英の経歴で、同じ位置の項目の日付が一致することを検証する**（同着の並びが人の約束だけで担保されている）
- 外部通信の e2e 検査の対象を、5 パスから全 9 パス（spec が言う「各ページ」）に広げる
- 変異で「すり抜ける」ことが実測済みの弱いテストを締め、到達しない分岐と 1:1 の別名関数を削る（`assetPath`、`stripBase` の未到達分岐、死んだロケール分岐など。純減およそ 60 行）
- main spec `profile-and-career` の Scenario が、廃止済みの `mailto:hello@example.com` を前提に書かれているのを直す

**含めないもの**: 進行中の change `photo-height-cap`（Issue #23）が触る 4 ファイル — `src/components/PhotoPicture.astro`、`src/pages/[lang]/index.astro`、`src/pages/[lang]/photos/[slug].astro`、`tests/e2e/viewport.spec.ts`。これらに紐づく提案（写真ごとの `og:image` と `description`、`pictureSizing` の抽出、`neighbors` の戻り値変更、`eager` → `priority`、`.art` の余白の重複）は、衝突を避けるため後続へ送る。`sitemap` の `<lastmod>`（PO 決定 2026-09-21 で見送り）と、上流のスキーマが保証していて到達不能な防御コード 4 件も対象外。

## Capabilities

### New Capabilities

なし。

### Modified Capabilities

- `layout-shell`: SNS 共有カード（OGP / Twitter Card）の出力を新しい要求として追加する。配色の要求に、罫線と補助文字のコントラスト下限を明文化する
- `photo-pipeline`: 入稿コマンドの要求に、既存の写真データファイルがあるときの挙動（上書きしない、画像だけ差し替える、ビルドキャッシュを捨てる）を追加する
- `quality-gates`: ブラウザ検査の要求に、検査対象が当のリポジトリのビルド出力であることの保証を追加する。外部通信の検査対象を全ページに揃える
- `content-schema`: 資格・実績の日付の要求に、暦として存在しない日付を失敗させることを追加する。日英の一致検証の要求に、同じ位置の項目の日付が一致することを追加する
- `profile-and-career`: トップページの連絡先リンクの Scenario を、廃止済みのメールリンクに依存しない例に置き換える

## Impact

**新規**: `src/lib/theme.ts`（色トークンの読み出しと WCAG コントラスト比、依存なし）、`tests/unit/theme.test.ts`、`tests/e2e/paths.ts`。

**変更**: `scripts/photo-add.ts`、`src/lib/{photo-meta,i18n,site,career,validate,photo,pixel}.ts`、`src/content/schemas.ts`、`src/layouts/BaseLayout.astro`、`src/components/Header.astro`、`src/pages/404.astro`、`src/pages/[lang]/career.astro`、`src/styles/global.css`、`tests/unit/{i18n,site,pixel,photo,photo-meta,career,validate,schemas}.test.ts`、`tests/e2e/{global-setup,global-teardown,network,pages}.*`、`.github/workflows/deploy.yml`、`openspec/specs/profile-and-career/spec.md`、`CLAUDE.md`。

**削除**: `src/lib/site.ts` の `assetPath`（`withBase` の 1:1 の別名）。

**依存の追加なし**。コントラスト計算は約 20 行の自前実装、引数解析は Node 標準の `node:util` の `parseArgs` に寄せる。

**公開サイトへの影響**: `<head>` に OGP / Twitter Card のタグが増え、`_astro/` に 1200×630 の派生画像が 1 枚増える。既存ページの表示は変わらない。
