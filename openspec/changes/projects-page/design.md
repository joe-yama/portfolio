# Design

## Context

トップ本文の導線とヘッダーは、どちらも `navLinks(lang, base)`（`src/lib/site.ts:144`）の Photos / Career を描いている。ヘッダーは 390px で余裕が 3.81px しかない（`docs/status.md`）。コンテンツは `src/content.config.ts` のコレクション（profile / career / photos）で読み、集合の制約は `src/lib/validate.ts` の `validate*` が文字列の配列でエラーを返し、`src/lib/content.ts` が `assertValid` でビルドを止める。ドット絵は `src/lib/pixel.ts` の 16×16 の文字列の配列で、`#` が塗り。e2e の対象ページは `tests/e2e/paths.ts` の `pagePaths` が 1 か所で持つ。サイトマップは `src/lib/sitemap.ts` の `sitemapEntries` が静的ページと写真の slug から作る。

PO の決定（2026-10-06、この change の設計セッション）: 新ページ＋トップ本文の導線（ヘッダーは変えない）、項目は文字＋ドット絵アイコン、ページ名は `Projects`、Tomoly の掲載文は D5 の案。

## Goals / Non-Goals

**Goals**: `/{ja,en}/projects/` を足し、Tomoly を載せる。トップ本文の導線に Projects を足す。

**Non-Goals**: ヘッダーの変更、画像、開発物ごとの個別ページ、開発物ごとの共有カード。

## Decisions

### D1: データは 1 件 1 ファイル、日英は 1 ファイルの中に持つ

`src/content/projects/<slug>.yaml`。日英の文言は写真と同じく `{ ja, en }`（`localizedSchema`）で持つ。経歴のような日英 2 ファイルにすると件数と位置の一致の検証が要るが、1 ファイルなら構造で保証できる。`name`・`url`・`tech`・`since` は言語に依らない。

### D2: 型と関数の置き場所

- `src/content/schemas.ts`: `projectSchema`、`Project`、`ProjectEntry = { id: string; data: Project }`。`icon` は `projectIcons` のキーの enum
- `src/lib/pixel.ts`: `tomoly`（D4）、`terminal`（D3）、`projectIcons: Record<'tomoly', readonly string[]>`。schemas はこのキーから enum を作る（アイコン名の定義を 1 か所にする）
- `src/lib/validate.ts`: `validateProjects(entries: ProjectEntry[]): string[]`。0 件と `order` の重複を返す。書き方は `validatePhotos` にそろえる
- `src/lib/projects.ts`（新規）: `sortProjects(entries)`（`order` の昇順。新しい配列を返す）、`sinceLabel(year: number, lang: Locale): string`（`2026年〜` / `2026–`）
- `src/lib/content.ts`: `getProjects(): Promise<ProjectEntry[]>`。検証して並べた配列を返す
- `src/lib/site.ts`: `projectsPath(lang, base)`、`topLinks(lang, base): NavLink[]`（`navLinks` の 2 つの後ろに `{ label: 'Projects', href: projectsPath, icon: terminal }`）。**`navLinks` は変えない**（ヘッダーが使うので、変えると spec「ヘッダーに Projects を足さない」が破れる）

### D3: Projects の導線のアイコンは端末の窓（Agent 作の仮の絵）

PO 決定 2026-09-18（ドット絵は Agent 作の仮の絵）に従い、`>_` を持つ端末の窓にする。カメラ・鞄と図柄が重ならない。`pixel.ts` に `terminal` として次の 16 行を置く。

```
................
................
.##############.
.#............#.
.##############.
.#............#.
.#.#..........#.
.#..#.........#.
.#...#........#.
.#..#.........#.
.#.#...####...#.
.#............#.
.##############.
................
................
................
```

### D4: Tomoly のアイコンはロゴの輪郭とリンゴだけを塗った単色

Tomoly のロゴ（`joe-yama/tomoly` の `web/public/icon.svg`、16×16 の多色）から、背景（`#FCA044`）と葉の緑（`#00A800`・`#B8F818`）を透過にし、それ以外（黒の輪郭、リンゴの赤、幹と地面）を塗った。サイトのドット絵は単色（`currentColor`）なので、葉を塗ると中の実が見えなくなるため。`pixel.ts` に `tomoly` として次の 16 行を置く。

```
................
.....######.....
....#......#....
...#........#...
..#.##.......#..
.#..##........#.
.#........##..#.
.#........##..#.
..#..........#..
...##......##...
.....######.....
......####......
......####......
......####......
..############..
................
```

### D5: Tomoly の掲載文（PO 承認 2026-10-06）

- `order: 1`、`name: Tomoly`、`url: https://tomoly.app`、`icon: tomoly`、`since: 2026`
- `status`: ja `先行公開中` / en `Early access`
- `summary`: ja `未就学児の親のための、友だちのいる公園がわかるアプリ` / en `An app that shows parents of preschoolers which park their kids' friends are at`
- `description` ja: `公園で仲良くなった子ども同士が「フレンド」になると、いまどの公園で遊んでいるかをリアルタイムで確かめられる。居場所はフレンドにだけ公園単位で見せる。企画から設計・実装・運用までを一人で手がけている。`
- `description` en: `When kids who hit it off at the park become "friends", their parents can see in real time which park each other is playing at. Locations are shown only to friends, and only at the park level. I handle everything myself, from planning and design to development and operations.`
- `tech`: `[TypeScript, React (PWA), Hono, PostgreSQL, Fly.io, Cloudflare, OpenTelemetry]`

### D6: ページの形

`BaseLayout` の中に `h1` `Projects`、その下に開発物ごとの `article`（または `section`）。各項目の頭に `PixelArt`（装飾、`scale` は経歴の区画の見出しに合わせる）と `h2`（中に名前のリンク）、その下に状態と開始年の行（控えめな色）、`summary`、`description`、`tech` の行。本文の幅は経歴ページと同じ（80rem）。スタイルは経歴ページの既存のクラスと変数を流用し、新しい色を足さない（配色の検証の対象を増やさない）。

### 2026-10-06 開発物ページの共有カードは代表写真のまま
- Ruling: `/projects/` の `og:image` は他のページと同じく代表写真から作る
- Reason: `layout-shell` の「SNS 共有カード」が写真の個別ページ以外は代表写真と定めている。開発物ごとの画像は Out of scope
- Cost if wrong: 共有されたときに Tomoly の絵が出ない。直すには画像の置き場所から設計が要る

### 2026-10-06 開始年は年だけ、終わりは持たない
- Ruling: `since` は西暦の整数だけ。終了年や「開発終了」の状態は持たない
- Reason: 載せるのは Tomoly 1 件で、いま開発中。状態の文言は `status` で自由に書ける
- Cost if wrong: 開発を終えたものを載せるときに `until` を足す change が要る

### 2026-10-06 名前のリンクは別タブにしない
- Ruling: 開発物の名前のリンクに `target` を付けない
- Reason: `profile-and-career` の連絡先リンクと特許のリンクが別タブにしていない。サイト内の扱いをそろえる
- Cost if wrong: 採用担当が戻る操作でサイトに戻る必要がある。属性 1 つで直る

### 2026-10-06 アイコン名の定義に無い名前はスキーマで落とす
- Ruling: `icon` は `projectIcons` のキーの enum としてスキーマで検証する
- Reason: spec「未定義のアイコン名」。描画時に見つからないと空の svg になり、ビルドが通ってしまう
- Cost if wrong: 新しい開発物を足すたびに `pixel.ts` に絵を足す必要がある（意図どおり）

## Risks / Trade-offs

- トップの初見表示: 導線が 3 つになり、1024×768 などで導線が 2 行に折り返すと下端が画面外に出る恐れがある。既存の e2e（`viewport.spec.ts` の初見表示）が導線のすべてを見ているので、落ちたら写真の高さ上限の見積もり（`index.astro` の `--photo-max-height`）を直す。見積もりを変えたらコメントの根拠も直す
- ドット絵 2 点（D3・D4）の良し悪しは自動の検査で決まらない。PR で PO が見る
