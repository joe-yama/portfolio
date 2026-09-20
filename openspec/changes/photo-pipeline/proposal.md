# Proposal

## Why

このサイトは写真ポートフォリオを主役に据えているが、現時点で写真は 1 枚も表示できない。スキーマ（`photoSchema`）と集合の検証（`validatePhotos`）は Change 1 で用意済みなのに、コレクションが登録されておらず、ギャラリーも個別ページも存在しないためである。あわせて、写真を git に入れないという決定（設計書 §5）を実際に運用するには、元画像を GitHub Release に上げて YAML を起こす入稿の道具が要る。

## What Changes

- 写真コレクションを登録し、`order` 昇順に整列して返す取得関数を追加する。以降のページはすべて同じ並びを見る
- ギャラリー `/ja/photos/` `/en/photos/` を追加する。写真は元の縦横比のまま格子に並べ、トリミングしない
- 個別ページ `/ja/photos/<slug>/` `/en/photos/<slug>/` を追加する。写真 1 枚、タイトル、撮影地、撮影日、撮影情報の 1 行、前後の写真への移動、ギャラリーへの戻り
- トップページに代表写真（`featured: true`）を表示する
- 写真の画像はビルド時に GitHub Release から取得し、最適化した派生画像として同一オリジンから配信する。用途ごとに出力する幅を変える
- 入稿コマンド `pnpm photo:add <画像ファイル>` を追加する。EXIF の読み取り、長辺 2500px への縮小、Release への登録、YAML 雛形の生成を一度に行う
- `title` / `location` / `alt` の未記入プレースホルダがそのまま公開されないよう、内容の検証を 1 つ増やす
- 新しい依存を 2 つ追加する: `exifr`（EXIF の読み取り）、`sharp`（入稿時の縮小。Astro の依存として既に存在するが、自前スクリプトから読み込むには明示的な追加が必要）

## Capabilities

### New Capabilities

- `photo-pipeline`: 写真の入稿（元画像の縮小・Release への登録・YAML 雛形の生成）と、ギャラリー・個別ページ・代表写真としての表示、および写真画像の最適化と配信

### Modified Capabilities

- `content-schema`: 未記入のプレースホルダ（`TODO` で始まる文字列）を検出してビルドを失敗させる要求を追加する

## Impact

- 追加: `src/pages/[lang]/photos/index.astro`、`src/pages/[lang]/photos/[slug].astro`、`src/components/PhotoPicture.astro`、`src/lib/photo.ts`、`src/lib/photo-meta.ts`、`scripts/photo-add.ts`、`src/content/photos/*.yaml`
- 変更: `src/content.config.ts`（`photos` コレクションの登録）、`src/lib/content.ts`（`getPhotos`）、`src/lib/validate.ts`（プレースホルダ検証）、`src/lib/i18n.ts`（ロケールの検証付き取得）、`src/pages/[lang]/index.astro`（代表写真）、`package.json`（`photo:add` スクリプトと依存 2 件）
- 外部の状態: GitHub Release `photos`（タグ）を新規に作成し、写真の元画像を asset として置く。これ以降ビルドはこの Release に依存する
- 既存仕様への影響: `quality-gates` の「出力が参照する画像は同一オリジン」「配信 JavaScript ゼロ」はいずれも維持する。要求の変更はない
