# Tasks

前提: `/opsx:propose` の成果物を PO が承認し、GitHub Issue を作成済み。`superpowers:using-git-worktrees` で `feature/photo-pipeline` の worktree を作り、その中で作業する。実装は `implementer`（Sonnet）、レビューは `reviewer`（Opus）。実装コードの変更は必ずテストを先に書く（RED → GREEN → REFACTOR）。

グループ 1 は写真の実物が無くても進められる。グループ 2 の 2.3 以降は PO から受け取った JPEG が必要。

## 1. 純粋関数（写真の実物なしで進む）

- [x] 1.1 `src/lib/i18n.ts` に `toLocale(value: string | undefined): Locale` を追加する（`isLocale` で判定し、外れたら値を含む例外）。`tests/unit/i18n.test.ts` に「`'ja'` / `'en'` を返す」「`'fr'` と `undefined` で例外」のテストを先に書き、RED を確認してから実装し、`pnpm test` が緑になることを実行出力で示す
- [x] 1.2 `src/lib/photo.ts` に `formatExif(exif): string` を追加する。`tests/unit/photo.test.ts` に spec の例（`Fujifilm X-T5 · XF 23mm F1.4 R LM WR · f/1.4 · 1/250 · ISO 800`）と、絞りが整数のとき（`2` → `f/2`）のテストを先に書き、RED → GREEN を `pnpm test` の出力で示す
- [x] 1.3 `src/lib/photo.ts` に `formatTakenAt(date: Date, lang: Locale): string` を追加する。`Intl.DateTimeFormat` の `dateStyle: 'long'` と `timeZone: 'UTC'` を使う。テストは `new Date('2025-11-03')` に対し ja が `2025年11月3日`、en が `November 3, 2025` を返すことと、`TZ=America/New_York` でも同じ結果になること（`process.env.TZ` を変えず、`timeZone: 'UTC'` 指定を直接検証する形でよい）。RED → GREEN を示す
- [x] 1.4 `src/lib/photo.ts` に `neighbors(photos, slug): { prev?: PhotoEntry; next?: PhotoEntry }` を追加する。テストは 3 枚に対し中間（前後とも有り）、先頭（`prev` が `undefined`）、末尾（`next` が `undefined`）、存在しない slug（例外）の 4 ケース。RED → GREEN を示す
- [x] 1.5 `src/lib/validate.ts` の `validatePhotos` に、`title` / `location` / `alt` の 6 値が `TODO:` で始まらないことの検査を足す。`tests/unit/validate.test.ts` に「`TODO: 日本語タイトル` が slug と `title.ja` を含むエラーになる」「`TODO リストの写真` は通る」「全項目記入済みなら通る」のテストを先に書き、RED → GREEN を示す
- [x] 1.6 `src/lib/photo-meta.ts` を新規に作り、`toSlug`（ファイル名 → kebab-case）、`formatShutterSpeed`（`0.004` → `1/250`、`2` → `2s`、`1.6` → `1.6s`）、`exifToPhotoData`（`exifr` の生の値 → YAML に書く値。欠損項目があれば項目名の配列を返す）、`nextOrder`（既存 `order` の最大値 + 10、空なら 10）、`renderPhotoYaml`（写真データ → YAML 文字列。`title` / `location` / `alt` は `TODO:` 始まり）を実装する。`tests/unit/photo-meta.test.ts` を先に書き、各関数の RED → GREEN を `pnpm test` の出力で示す

## 2. 入稿コマンド `pnpm photo:add`

- [x] 2.1 `pnpm add -D exifr sharp` で依存を追加し、`package.json` の scripts に `"photo:add": "node scripts/photo-add.ts"` を足す。`node -e "require.resolve('sharp'); require.resolve('exifr')"` が成功することと、`sharp` のバージョンが Astro の依存と同じ 0.35.x であることを実行出力で示す
- [x] 2.2 `scripts/photo-add.ts` を実装する。順序は (1) `gh api user --jq .login` が `joe-yama` でなければ何も変更せず終了コード非 0 で中断、(2) `exifr` で元画像から EXIF を読む、(3) `exifToPhotoData` が欠損を返したら項目名を示して中断、(4) `sharp` で長辺 2500px 以下（拡大しない）・sRGB・JPEG 品質 90 に変換して一時ファイルへ、(5) Release `photos` が無ければ `gh release create photos --latest=false` で作り `gh release upload photos <slug>.jpg --clobber`、(6) `src/content/photos/<slug>.yaml` を書き、最後に「title / location / alt を記入してからビルドすること」を出力する。ロジックは 1.6 の関数を呼ぶだけにする。`pnpm lint && pnpm typecheck` が緑であることを実行出力で示し、`--help` 相当の引数なし実行が使い方を出して非 0 で終わることを確認する
- [x] 2.3 PO から受け取った JPEG（2〜3 枚）を `pnpm photo:add` で入稿する。`gh release view photos --json assets` で asset が登録されていること、`src/content/photos/*.yaml` が生成され `image` の URL が `https://github.com/joe-yama/portfolio/releases/download/photos/<slug>.jpg` であること、登録された画像の長辺が 2500px 以下であることを実行出力で示す。**PO の写真が未着ならここで止まり、Issue にコメントして PO に依頼する**
- [x] 2.4 生成された YAML の `title` / `location` / `alt` を日英で記入する。Agent が写真を見て下書きし、PO に提示して確定させる。`order` と `featured`（代表写真 1 枚）も PO に確認する。記入後に `pnpm test` が緑（`TODO:` 検証を含む）であることを示す

## 3. コレクションとページ

- [x] 3.1 `src/content.config.ts` に `photos` コレクション（`glob({ pattern: '*.yaml', base: './src/content/photos' })` + `photoSchema`）を登録し、`src/lib/content.ts` に `getPhotos()`（`getCollection` → `validatePhotos` → `assertValid` → `order` 昇順）を足す。`pnpm build` が成功し `[WARN]` が出ないこと、および `order` を故意に重複させると `pnpm build` が該当 slug を示して失敗すること（確認後に戻す）を実行出力で示す
- [x] 3.2 `src/components/PhotoPicture.astro` を作る。props は `photo` / `lang` / `variant`（`'grid' | 'full'`）/ `eager`（既定 false）。`formats={['avif','webp']}`、`inferSize`、`alt={photo.data.alt[lang]}`、widths は grid が 400/800/1200・full が 1200/1800/2500、`loading` は `eager` が真のとき `eager` + `fetchpriority="high"`、それ以外は `lazy`。この時点ではまだページから呼ばないので、3.3 のビルドで検証する
- [x] 3.3 `src/pages/[lang]/photos/index.astro`（ギャラリー）を作る。`toLocale` を使い、`getPhotos()` の順に `PhotoPicture` の `grid` を並べ、各写真を個別ページへリンクする。CSS Grid（`repeat(auto-fill, minmax(280px, 1fr))`）で縦横比は保つ。`pnpm build` 後に `dist/ja/photos/index.html` と `dist/en/photos/index.html` が存在し、`<img` に `width` と `height` と `loading="lazy"` があり、`<source type="image/avif">` と `image/webp` が出ており、画像の参照先に `github.com` が含まれないことを grep で示す
- [x] 3.4 `src/pages/[lang]/photos/[slug].astro`（個別ページ）を作る。`getStaticPaths` は言語 × 写真。`PhotoPicture` の `full`、タイトル・撮影地、`formatTakenAt`、`formatExif` の 1 行、`neighbors` による前後リンク（端では出さない）、ギャラリーへ戻るリンク。`pnpm build` 後に、先頭の写真の HTML に「前」のリンクが無く「次」があること、末尾はその逆、中間は両方あることを grep で示し、`<html lang>` と hreflang 3 本が出ていることも確認する
- [x] 3.5 `src/pages/[lang]/index.astro` に代表写真（`featured`）を最上部に追加する。`PhotoPicture` の `full` + `eager`。代表写真が見つからないときは例外でビルドを止める。`pnpm build` 後に `dist/ja/index.html` に `fetchpriority="high"` と `loading="eager"` があること、`featured` を一時的に全部 `false` にするとビルドが失敗すること（確認後に戻す）を示す

## 4. 仕上げ

- [ ] 4.1 設計書 `docs/superpowers/specs/2026-09-17-portfolio-site-design.md` に 2026-09-20 の PO 決定を反映する（§4 に前後リンクは端では出さない、§5.1 か §5.3 に `photo:add` が長辺 2500px へ縮小することと `TODO:` 印、§6 にギャラリーは縦横比を保ちトリミングしない）。差分を Issue にコメントする
- [ ] 4.2 `pnpm lint && pnpm typecheck && pnpm test && pnpm build` がすべて終了コード 0、`git status --short` が空、`openspec validate photo-pipeline --strict` が valid であることを実行出力で示し、本ファイルの完了項目を `[x]` にしてコミットする
- [ ] 4.3 `pnpm build && pnpm preview` で `http://127.0.0.1:4321/` を配信し、`reviewer`（Opus）でブランチ全体を「仕様準拠（`photo-pipeline` と `content-schema` の delta）→ コード品質 → ponytail」の順にレビューする。reviewer 自身が Playwright MCP で `/ja/photos/`、個別ページ（先頭・中間・末尾）、`/ja/` を実操作し、測った値を報告に書く。結果（Approved / 指摘数 / 切り替えの有無）を Issue にコメントする
- [ ] 4.4 `gh api user --jq .login` が `joe-yama` であることを確認し、PO の許可を得て push、`Closes #<Issue 番号>` を本文に含む PR を作成する

## 提案（この change では実装しない。後続の change 用）

レビューで挙がった Minor と ponytail の指摘（`.claude/rules/review.md` 2026-09-20 により、Minor は修正ラウンドを起こさず後続に回す）。

- `src/lib/i18n.ts:34` の `toLocale('')` はエラーメッセージのコロンの後ろが空になる。`${JSON.stringify(value)}` にすれば空文字と `undefined` を見分けられる
- `tests/unit/i18n.test.ts:57` の `expect(() => toLocale(undefined)).toThrow()` は引数なしなので、実装が `TypeError` を投げても通ってしまう。`toThrow('undefined')` にすれば `String(value)` の分岐まで固定できる
- ponytail: `src/lib/i18n.ts:30-32` の JSDoc 3 行は「無検査キャストを各ページに複製しないために置く」の 1 行で足りる（net: -2 lines）

単位 A（Task 2 / 3 / 4）のレビューから:

- tests/unit/photo.test.ts:20 の toContain('f/2') は 'f/2.8' でも通る。toBe で全文を固定するか toContain(' f/2 ') にすれば「絞りが整数のとき小数点を付けない」を本当に固定できる
- src/lib/photo.ts:5 の JSDoc の例のレンズ表記 "XF 23mm F1.4" が spec とテストの "XF 23mm F1.4 R LM WR" と食い違う
- src/lib/photo.ts の neighbors の明示的な範囲判定は、実行時には何も防いでいない。photos[-1] も photos[photos.length] も undefined を返し、戻り値の型は注釈が決めるため、単純な photos[i-1] との差は型でも実行時でも出ない。コメントが守っているものが実際には無い
- src/lib/photo.ts の neighbors は渡された配列が order 昇順であることを暗黙の前提にしているが、その前提はシグネチャにもテストにも現れない。担保は getPhotos 側にある
- src/lib/validate.ts の PhotoEntry は「形」の型だが「形で表せない制約」のファイルに居る。責務の分けに照らすと schemas.ts 寄り。既存コードからの継承
- ponytail: src/lib/photo.ts の dateLocale マップは削除できる。Intl は 'ja' / 'en' をそのまま受け、出力も ja-JP / en-US と同一（測定済み）
- ponytail: src/lib/photo.ts の neighbors の 4 行 JSDoc は 1 行で足りる
- ponytail: src/lib/validate.ts の TODO: 検査ループは image 検査ループの中に入れれば for 1 つ分減る。コメント 2 行も 1 行で足りる
- ponytail 合計: net -7 lines possible

単位 B（Task 5 / 6）のレビューから:

- scripts/photo-add.ts の YAML を正規表現で読む 2 つの規則（order と featured）が、テストを持たないスクリプト側にある。parseOrder(text) と hasFeaturedFlag(text) を photo-meta.ts に出せば単体テストで守れる。現状は自分が生成した YAML しか読まないので実害は小さい
- scripts/photo-add.ts で gh が失敗したとき（未ログイン・ネットワーク断）は execFileSync の例外がそのまま上がり、die の整形された 1 行ではなくスタックトレースになる。spec の「中断する」は満たすが他のエラー経路と体裁が揃わない
- scripts/photo-add.ts の gh release view の catch が全ての失敗を「Release が無い」と解釈する。ネットワーク断でも release create に進む（既存なら create が失敗して止まるので黙って壊れはしない）
- ponytail: scripts/photo-add.ts の手書き引数解析は node:util の parseArgs で置き換えられる
- ponytail: scripts/photo-add.ts が同じファイルを readFileSync で 2 回読む 9 行は、一度読んでから order と featured を出す 4 行にできる
- ponytail: src/lib/photo-meta.ts の RawExif は Record<string, unknown> の別名 1 つなので、引数の型にそのまま書けば消せる
- ponytail 合計: net -13 lines possible
- 修正後に見つかった点: src/lib/photo-meta.ts の toSlug のエラーメッセージ「--slug で指定する」が、ユーザーが --slug に英数字なしの値を渡した経路でも出る。その人は既に --slug を使っているので案内が行き止まりになる。由来で文言を分けるか「英数字を 1 文字以上含める」に変える
- 修正後に見つかった点: toSlug の拡張子除去が --slug の値にも掛かる。--slug kamo-river-v1.2 が kamo-river-v1 と無警告で切り詰められる
- 修正後に見つかった点: src/lib/photo-meta.ts の isPositiveFinite が関数の中で毎回作られる。cameraName の隣のモジュールスコープに置くほうが既存の書き方に揃う
