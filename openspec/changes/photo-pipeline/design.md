# Design

## Context

動機は `proposal.md` の Why、振る舞いの要求は `specs/photo-pipeline/spec.md` と `specs/content-schema/spec.md` を正とする。ここでは実装方針だけを書く。

前提として既にあるもの:

- `src/content/schemas.ts` の `photoSchema` と `PHOTO_BASE_URL`、`src/lib/validate.ts` の `validatePhotos`（`featured` ちょうど 1 枚 / `order` 重複なし / `image` URL 形式）。いずれも単体テスト済み。**この change で作り直さない**
- `src/lib/content.ts` の `getProfile` / `getCareer`（`getEntry` を包み、検証してから返す形）
- `src/lib/i18n.ts` の `locales` / `localeFromPath` / `alternatePath`、`BaseLayout`、`Header`、`Footer`
- `astro.config.ts` の `image.domains: ['github.com']`

制約（設計書 §6・§7、`openspec/specs/quality-gates`）:

- 配信 JavaScript ゼロ。Astro の島も使わない
- 公開サイトからの外部通信ゼロ。画像は最適化後に同一オリジンから配信する
- 独自の画像処理コードを書かない（`astro:assets` の sharp サービスに任せる）
- 写真の元画像は git に入れない

PO 決定（2026-09-20 のブレインストーミング）:

- ギャラリーは元の縦横比を保つ格子。トリミングしない
- 前後リンクは端では出さない
- `photo:add` は縮小まで行う
- 入稿スクリプトの変換規則は純粋関数に切り出してテストする

## Goals / Non-Goals

**Goals:**

- 写真の並び順の決定を 1 箇所に閉じ込め、ギャラリー・前後リンク・代表写真が同じ配列を見るようにする
- 画像の出力設定（幅・形式・読み込み方）を 1 箇所に集め、呼び出し側が `alt` を書き忘れられないようにする
- 入稿の変換規則（EXIF の解釈、slug、`order` の採番）を Vitest で固定する
- ページが増えるたびに複製されていた `Astro.params.lang as Locale` の無検査キャストを解消する（`layout-followups` の申し送り）

**Non-Goals:**

- トップページの最終的な構成（名前・連絡先・導線のレイアウト）は Change 4 で行う。この change では代表写真を足すだけ
- ギャラリーの絞り込み・タグ・ページ送り。v1 では作らない（設計書 §3）
- e2e とビルド出力の自動検査は Change 5。この change ではビルド後の目視と grep、および reviewer の Playwright 操作で確認する
- CI のビルドキャッシュ。Change 5 への申し送りとする（下記リスク参照）

## Decisions

### D1: 並び順は `getPhotos()` が決める

`src/lib/content.ts` に `getPhotos(): Promise<PhotoEntry[]>` を足し、`getCollection('photos')` → `validatePhotos` → `assertValid` → `order` 昇順ソートまでを行う。ページは並べ替えない。

**なぜ**: ギャラリーの並びと個別ページの前後関係が食い違うと、訪問者からは「次」を押したのに別の写真に飛ぶ形で壊れて見える。両者が同じ配列を見ることを型ではなく構造で保証する。

**代替案**: ページごとに `getCollection` を呼んでソートする → 3 箇所に同じソートが散り、片方だけ変えたときに静かに食い違う。却下。

### D2: 画像の出力設定は `PhotoPicture.astro` 1 箇所に置く

`src/components/PhotoPicture.astro` が `astro:assets` の `<Picture>` を呼ぶ唯一の場所とする。props は `photo`（コレクションの entry）、`lang`、`variant`（`'grid' | 'full'`）、`eager`（既定 false）。

| variant | widths | loading | 用途 |
|---|---|---|---|
| `grid` | 400 / 800 / 1200 | `lazy` | ギャラリー |
| `full` | 1200 / 1800 / 2500 | `lazy`（`eager` 指定時は `eager` + `fetchpriority="high"`） | 個別ページ、トップ |

共通で `formats={['avif', 'webp']}`（`<img>` の fallback は JPEG）、`inferSize`（リモート画像なので寸法をビルド時に取得させる）、`alt={photo.data.alt[lang]}`。

**なぜ**: `alt` をコンポーネント内で必ず埋めるので、呼び出し側が書き忘れる経路が無くなる。設計書 §6 の表とコードが 1 対 1 に対応する。

**代替案**: 各ページで直接 `<Picture>` を書く → `formats` と `widths` が 3 箇所に散る。`alt` の書き忘れを型で防げない。却下。

**留意**: `inferSize` はビルド時に元画像を取得して寸法を読む。取得失敗はビルドエラーになる（これは要求どおりの挙動）。

### D3: ロケールの取得を検証付きの共通関数にする

`src/lib/i18n.ts` に `toLocale(value: string | undefined): Locale` を足す（`isLocale` で判定し、外れたら例外）。`src/pages/[lang]/index.astro`、`photos/index.astro`、`photos/[slug].astro` の 3 ページがこれを使い、`as Locale` のキャストを消す。

**なぜ**: `layout-followups` の申し送りで「ページが増えるたびに `getStaticPaths` + キャスト + 取得の 3 行が複製される」と指摘された箇所が、この change でまさに 3 倍になる。`isLocale` は既にあるので、追加は数行とテスト 1 件。

**代替案**: `getStaticPaths` が返す `params` の型を絞る → Astro の `Astro.params` は `string | undefined` に落ちるため、結局どこかで絞る必要がある。却下。

**やらないこと**: `getStaticPaths` そのものの共通化。ギャラリーは言語のみ、個別ページは言語 × 写真で形が違い、まとめると引数で分岐する関数になって読みにくい。2 種類のままにする。

### D4: 表示用の整形は `src/lib/photo.ts`（純 TS）

`formatExif(exif): string`、`formatTakenAt(date, lang): string`、`neighbors(photos, slug): { prev?, next? }` を置き、Vitest でテストする。`.astro` はテストできないので、テストできる形は `.astro` の外に出す。

`formatTakenAt` は `Intl.DateTimeFormat`（`ja-JP` / `en-US`、`dateStyle: 'long'`）を使う。自前で月名の表を持たない。

**留意**: `takenAt` は `photoSchema` が `Date` に変換して返す。`Date` はタイムゾーンの影響を受けるため、整形は UTC で行う（`timeZone: 'UTC'`）。そうしないとビルドするマシンのタイムゾーン次第で日付が 1 日ずれる。

### D5: `photo:add` は I/O の殻と純粋関数に分ける

- `scripts/photo-add.ts` — 引数解析、`gh` の実行、ファイルの読み書き、`sharp` の呼び出し。**テスト対象外**
- `src/lib/photo-meta.ts` — 純粋関数。`toSlug(fileName)`、`exifToPhotoData(rawExif)`、`nextOrder(existing)`、`renderPhotoYaml(data)`。**Vitest でテストする**

Node 26 は `.ts` を型剥がしで直接実行できる（実測済み）ので、`tsx` などの実行用依存は入れない。`package.json` に `"photo:add": "node scripts/photo-add.ts"` を足す。

**なぜここを分けるか**: `exifr` が返す値は素直ではない。`ExposureTime` は `0.004` のような**数値**で返るが、YAML は `"1/250"` の**文字列**である。`FNumber` は `1.4`、`ISO` は `800`、`DateTimeOriginal` は `Date`。この変換はテストで固定しないと取りこぼす。

**シャッター速度の変換規則**: 1 秒未満は `1/round(1/t)`、1 秒以上は `<t>s`（`2s`、`1.6s` のように不要な 0 を落とす）。

**代替案**: 全部スクリプトに書き、実ファイルを使った統合テストで覆う → ディスクと `gh` のモックに依存し、テストが重く壊れやすい。却下（PO 決定）。

### D6: プレースホルダ検証は `validatePhotos` に足す

`src/lib/validate.ts` の `validatePhotos` に、`title` / `location` / `alt` の 6 つの値が `TODO:` で始まっていないかの検査を足す。既存の検証と同じく、問題点の文字列配列を返す。

**なぜ `TODO:`（コロン付き）か**: `TODO` だけを印にすると `TODO リストの写真` のような正当なタイトルを弾く。入稿スクリプトが入れる印を `TODO:` に固定し、検証もそれに合わせる。

**代替案**: Zod スキーマの `refine` に入れる → スキーマは「形」、`validate.ts` は「形で表せない制約」という既存の責務分けを崩す。プレースホルダは形ではなく内容なので `validate.ts` 側。

### D7: `photos` コレクションの登録

`src/content.config.ts` に `glob({ pattern: '*.yaml', base: './src/content/photos' })` + `photoSchema` で追加する。Change 1 で見送ったのは空ディレクトリの glob ローダーが `[WARN]` を出すためで、この change では実 YAML が入るので解消する。

### D8: 依存の追加

| 依存 | 用途 | ライセンス | 状況 |
|---|---|---|---|
| `exifr` | 入稿時の EXIF 読み取り（開発時のみ、公開サイトには含まれない） | MIT | 設計書 §9 の承認済み一覧にある |
| `sharp` | 入稿時の縮小（同上） | Apache-2.0 | Astro の依存として既に store にある（0.35.4）。pnpm の厳格な `node_modules` では自前スクリプトから解決できない（実測 `MODULE_NOT_FOUND`）ため明示的に追加する。バージョンは Astro と同じものを指す |

どちらも `devDependencies`。公開されるビルド出力には入らない。

## Risks / Trade-offs

- **ビルドのたびに Release から全写真をダウンロードする** → ローカルは `node_modules/.astro` のキャッシュが効くが、CI は毎回まっさらなので写真の枚数に比例してビルドが伸びる。数枚のうちは実害がない。Change 5 で CI のキャッシュを足すことを申し送りにする
- **Release の asset を消すとビルドが落ちる** → 意図した挙動（リンク切れを静かに出すより良い）。写真を減らすときは YAML と asset を両方消す運用を `photo:add` の説明に書く
- **`inferSize` はビルド時にネットワークを要求する** → オフラインでは `pnpm build` も `pnpm dev` も通らない。設計書 §6 で織り込み済みの制約
- **`photo:add` は Release という外部の状態を書き換える** → 失敗したときに「asset だけ上がって YAML が無い」状態が起こりうる。YAML の生成を最後に置き、asset だけ残っても次の実行が `--clobber` で上書きするので回復できる形にする。ロールバックの自動化はしない
- **`TODO:` 検証は入稿直後のビルドを必ず落とす** → 入稿してすぐ `pnpm build` すると失敗する。これは意図した動作だが、初めて使う人が驚くのでスクリプトの最後に「title / location / alt を記入してからビルドすること」を出力する
- **代表写真がトップに増えることで、トップの見た目が Change 4 の完成形と食い違う期間ができる** → この change の受け入れはギャラリーと個別ページを主とし、トップは「代表写真が出ていること」だけを見る

## Migration Plan

1. GitHub Release `photos`（`--latest=false`）を新規作成する。この change で初めて作る
2. PO から受け取った写真を `pnpm photo:add` で入稿し、`title` / `location` / `alt` を記入する
3. ロールバック: Release とその asset を消し、`src/content/photos/*.yaml` を消せば、写真が 0 枚の状態に戻る（`validatePhotos` は 0 枚のとき制約を評価しないため、ビルドは通る）。ただしトップの代表写真の表示は 0 枚だとビルドを落とすので、コードごと revert する

## Open Questions

- 初回に載せる写真の枚数と代表写真の指定は PO からの入力待ち。実装の進行は妨げない（数枚あれば全タスクを検証できる）。並び順の最終的な `order` の値も PO が YAML を見て決められる
