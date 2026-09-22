# Design

## Context

動機は `proposal.md` の Why、要求は `specs/` の 5 つの delta が正。ここでは実装の進め方だけを書く。

この change は**並行して進んでいる別の change がある状態**で実装する。`patents-section`（Issue #21、PR #26）は 2026-09-21 にマージ済みだがまだアーカイブされていない。`photo-height-cap`（Issue #23）は実装中で、`src/components/PhotoPicture.astro`、`src/pages/[lang]/index.astro`、`src/pages/[lang]/photos/[slug].astro`、`tests/e2e/viewport.spec.ts` の 4 ファイルを触っている。

対象の 34 件は、もともと 7 つの change がレビューで「Minor」と判定して後続へ送ったものである。個々は小さく、`.claude/rules/review.md` の方針どおり修正ラウンドを起こさずに積まれてきた。ほとんどは `reviewer` が変異を入れて「すり抜ける」ことを実測済みで、どの入力で壊れるかが提案に書かれている。

## Goals / Non-Goals

**Goals:**

- 提案に「実測で壊れる」と書かれているものを、再現条件をそのままテストにして塞ぐ
- `CLAUDE.md` の写真差し替え注意書き 2 つを、コードで不要にして削除する
- 振る舞いを変えない整理（ponytail）は、同じファイルを触るタスクに相乗りさせ、単独のタスクにしない

**Non-Goals:**

- `photo-height-cap` が触る 4 ファイルへの変更。それに紐づく提案（写真ごとの `og:image` と `description`、`pictureSizing` の抽出、`neighbors` の戻り値変更、`eager` → `priority`、`inferRemoteSize` の重複呼び、`.art` の余白の重複）は `tasks.md` 末尾の「提案」に転記して後続へ送る
- 到達不能と実測済みの防御コードの削除（`toLocalDate` の `NaN` ガード、`to` の falsy 判定、`[slug].astro` の 2 つの `throw`）。上流のスキーマが形式を保証しており、消す価値より読み手の混乱コストが上回る
- `sitemap` の `<lastmod>`（PO 決定 2026-09-21 で見送り）
- `deploy.yml` の `withastro/action@v6` に `--frozen-lockfile` を渡すこと。action の input に無く、自前ビルドへの置き換えは割に合わない。CI 側が `--frozen-lockfile` なので食い違いは検知できる

## Decisions

### D1. 衝突域を「触らないファイルの一覧」として固定する

`photo-height-cap` の 4 ファイルを禁止リストとし、実装者はここに 1 行も書かない。

`patents-section` はマージ済みなので、それが触っていた `src/lib/site.ts` の `ui`、`src/lib/career.ts`、`src/lib/validate.ts`、`src/content/schemas.ts`、`src/pages/[lang]/career.astro`、`tests/e2e/pages.spec.ts` は自由に触ってよい。禁止リストは `photo-height-cap` の 4 ファイルだけである。

**代替案**: `photo-height-cap` のマージを待ってから始める。採らない — 相手の完了時期が読めず、待つ間この change の 34 件が動かない。ファイル単位で分けられる以上、待つ理由が無い。

### D2. 写真の再入稿は「YAML があれば書かない」で止める

`scripts/photo-add.ts` は画像の登録（`gh release upload --clobber`）まで進んだあと、`existsSync(yamlPath)` が真なら YAML を書かずに終える。この経路でだけ `node_modules/.astro/assets` を削除する。

キャッシュを消すのは、Astro の `revalidateRemoteImage` に `imageConfig` が渡らない不具合（`photo-pipeline` の申し送りに実測あり）で、温かいキャッシュのまま再ビルドすると差し替え前の画像が出力に残るため。新規入稿の経路では起きないので、差し替えと判定したときだけ消す。

**代替案 1**: `--force` で上書きを許す。採らない（PO 決定 2026-09-21）。逃げ道は `git checkout -- <yaml>` ではなく手編集で足りる。
**代替案 2**: EXIF 由来の項目だけ更新する。採らない（PO 決定）。既存 YAML を正しく読む必要があり、正規表現 2 本で済んでいる読み取りが本物の YAML パースに変わる。
**代替案 3**: キャッシュ削除をドキュメントに書くだけ。採らない。`CLAUDE.md` に既に書いてあり、それでも踏んでいる。

### D3. OGP の画像はビルド時に 1200×630 を生成し、全ページ共通にする

`BaseLayout.astro` が `getPhotos()` で代表写真を取り、`astro:assets` の `getImage({ src, width: 1200, height: 630, fit: 'cover', format: 'jpeg' })` で派生画像を作る。得られた `src`（`/portfolio/_astro/...`）を `new URL(src, Astro.site)` で絶対 URL にする。

リモート画像に `width` と `height` を両方与えるので `inferSize` は不要で、寸法取得のための追加のネットワーク往復は発生しない。`fit: 'cover'` の切り抜きは sharp が行う。

出力は `canonical` / `description` と同じ条件（`pathLocale` があるときだけ）に揃える。404 には出ない。

ページごとの `og:image`（写真の個別ページがその写真を出す）は `[slug].astro` が禁止リストなので今回はやらない。そのため `BaseLayout` に `image?` prop は足さない — 使う人がいない prop を先に作らない。

**代替案 1**: Release の元 URL をそのまま `og:image` にする。採らない（PO 決定）。原寸・比率不定・302 リダイレクト経由になる。
**代替案 2**: 画像なしの `summary` カード。採らない（PO 決定）。写真が主役のサイトで最も効く要素を捨てることになる。

`quality-gates` の「外部通信ゼロ」との関係: `og:image` は `<meta content=...>` で、既存の検査が見る `href` / `src` / `srcset` ではない。値自体も同一オリジンなので抵触しない。

### D4. 色は CSS を正本にし、テストが検算する

`src/lib/theme.ts` に純関数を 2 つ置く。

- `readTokens(css: string)`: `:root` ブロックとダークのブロックから 4 トークン（`--bg` / `--fg` / `--fg-muted` / `--line`）を抜き、`{ light, dark }` を返す
- `contrast(a: string, b: string)`: 16 進の色 2 つから WCAG 2.x の相対輝度を出し、コントラスト比を返す

`tests/unit/theme.test.ts` が `src/styles/global.css` を `readFileSync` で読み、`--fg`/`--bg` と `--fg-muted`/`--bg` が 4.5 以上、`--line`/`--bg` が 3.0 以上であることをライト・ダーク両方で確かめる。さらに `faviconSvg(camera)` の出力に `light.fg` と `dark.fg` が含まれることを確かめ、`pixel.ts` のリテラルが `--fg` からずれたら落ちるようにする。

`src/lib/pixel.ts` は変更しない。二重管理は「消す」のではなく「ずれたら落ちる」形で解く。

**代替案 1**: TS を正本にして CSS を生成する。採らない（PO 決定）。CSS の書き方が変わり、影響範囲がこの change の狙いから外れる。
**代替案 2**: `pixel.ts` が `?raw` で CSS を読む。採らない（PO 決定）。favicon の生成にファイル読み込みが入り、純関数でなくなる。
**代替案 3**: axe の `color-contrast` に任せる。採らない。axe は文字と背景しか見ず、罫線（`--line`）を検査しない。今回いちばん余裕が無いのが罫線である。

### D5. `pnpm e2e` は配信サーバの占有を検出して失敗させる

`tests/e2e/global-setup.ts` は起動前に `astro preview status` を確認する。既に動いていれば、その `dist` がこのリポジトリのものとは限らないため、起動せずに例外を投げる（メッセージに `pnpm exec astro preview stop` を示す）。`global-teardown.ts` は、setup が実際に起動したときだけ停止する。

`astro preview --port <n>` は既に別のプレビューが動いていると**ポート指定を無視して exit 0 で戻る**（3 つの change で実測）。今の teardown は他セッションのプレビューも止めてしまう。

**代替案**: `--ignore-lock` を付けて必ず自分のサーバを立てる。採らない。ポート衝突の扱いが増えるうえ、「なぜ別の `dist` を見ていたのか」が見えないまま通る。失敗させて人に気づかせるほうが安い。

### D6. e2e の対象パスを 1 か所に集める

`tests/e2e/paths.ts` に 9 パスの配列を置き、`a11y.spec.ts` と `network.spec.ts` が同じものを見る。spec が「各ページ」と言っているのに `network.spec.ts` だけ 5 パスだったのは、配列が別々にあったため。

### D7. 暦の検査はスキーマ側に置く

`src/content/schemas.ts` の `datePrecision` / `isoDate` に `.refine()` を足し、`YYYY-MM-DD` のとき `new Date(y, m-1, d)` の各成分が入力と一致することを確かめる。`YYYY-MM` は月の範囲を正規表現が既に保証しているので追加の検査は要らない。

表示側（`src/lib/career.ts` の `toLocalDate`）には手を入れない。上流で弾けば、`formatDate` が繰り上げる経路には到達しない。

### D8. 日英の対応づけ検査は「並び替えの比較キーの一致」として書く

`validateCareerParity` に、同じ位置の項目の比較キーが日英で一致することの検査を足す。比較キーは `certifications` / `achievements` が `date`、`patents` が `countries` の件数と `filedAt` の組。表示が安定ソートである以上、これが崩れると日英で違う項目が同じ位置に出る。

`experience` は `from` で並ぶが、日英で職歴が入れ替わることは構造上ありえない（同じ職歴の訳）ので今回は対象にしない。

### D9. `dateSortKey` と `formatDate` の粒度判定を 1 か所にする

いまは `dateSortKey` が「文字列長 7」、`formatDate` が「セグメント数 3」で見ている。`hasDay(date: string): boolean` を `career.ts` に 1 つ置き、両方がそれを使う。`datePrecision` を将来広げたときに片方だけ壊れる経路を消す。

### D10. `present` を `ui` へ移す（PO 決定 2026-09-21）

`career.ts` が持っている `present`（`現在` / `Present`）を `src/lib/site.ts` の `ui` に移す。画面に出る文字列を 1 か所に集めるという `profile-and-career` の design D2 の方針に揃える。`formatPeriod` は文字列を引数で受け取る形にし、`career.astro` が `ui[lang].present` を渡す。

`patents-section` がマージされたため `ui` に触れるようになったので、この change で片付ける。

### D11. 入稿コマンドの実行検証（PO 決定 2026-09-21）

既存の写真 1 枚に対して、同じ slug で `pnpm photo:add` を実行して差し替え経路を実測する。Release の asset は同じ内容で置き換わるだけで、公開サイトの見た目は変わらない。確かめるのは 3 点: YAML が 1 文字も変わらないこと（`git status` が空）、データファイルを変更していない旨が出力されること、直後の `pnpm build` の出力に古い画像が残らないこと。

`.claude/rules/security.md` と `CLAUDE.md` が言う「worktree 外への副作用」に当たるが、内容が同一の再アップロードであり、PO の承認を得ている。

### D12. レビューの単位

`.claude/rules/review.md` に従い、次の 5 回に分ける。

| 単位 | 対象 | 理由 |
|---|---|---|
| A | 写真の入稿（`scripts/photo-add.ts`、`src/lib/photo-meta.ts`） | spec の要求が変わる。実行して確かめる項目がある |
| B | OGP（`BaseLayout.astro`、`src/lib/site.ts`） | UI。reviewer が Playwright MCP で `<head>` を実測し、`og:image` を実際に取得する |
| C | 色とスキーマと検証（`theme.ts`、`schemas.ts`、`validate.ts`、`career.ts`） | 共有インターフェースと spec の要求に触る |
| D | e2e と CI（`global-setup` / `global-teardown` / `paths.ts` / `network.spec.ts` / `deploy.yml`） | 実行して確かめる項目がある |
| E | ブランチ全体 | 必須 |

ponytail と弱い assert の締め直しは、同じファイルを触る単位に含めて一緒に見る。単独のレビューは起こさない。

## Risks / Trade-offs

- **`photo-height-cap` が禁止リスト外のファイルにも手を広げる** → マージ時に衝突する。実装の開始時と PR 作成の直前に `git diff --name-only main...feature/photo-height-cap` を確認する。衝突したら、こちらが後発なので `main` を取り込んで解消する
- **MODIFIED の全文が不足していると、main spec の要求が静かに消える** → `patents-section` の `specs/content-schema/spec.md` は `MODIFIED Requirement: 経歴のデータ構造` に日付の段落と 5 つの Scenario を含めていなかったが、2026-09-21 のアーカイブ実行後に `openspec/specs/content-schema/spec.md` を確認したところ、どちらも残っていた（`openspec archive` は段落と Scenario を落とさずにマージする）。この change の delta も全文を持たせてあるので同じ形で安全だが、アーカイブ後に main spec を目視で確認する手順は残す
- **`getImage` がリモート画像に `width` と `height` の両方を与える形で動かない** → 動かなければ `inferSize: true` に切り替える。ページごとに 1 回ずつ寸法取得の往復が増えるが、ビルドは通る。この分岐は Task の最初に実測して決める
- **キャッシュ削除がユーザーの次のビルドを遅くする** → 差し替えの経路でだけ消すので、頻度は写真を差し替えるときだけ。遅くなるのは直後の 1 回
- **`astro preview status` の出力形式が Astro のバージョンで変わる** → 終了コードとメッセージの両方に依存しない形（`status` の終了コードだけ）で判定し、判定できないときは起動を試みる側に倒す
- **コントラストのテストが CSS のテキスト解析に依存する** → `global.css` の書き方（`--fg: #111111;`）を変えるとテストが読めなくなる。読めなかったときは黙って通さず、明示的に失敗させる

## Migration Plan

公開サイトへの破壊的変更は無い。`<head>` にメタデータが増え、`_astro/` に派生画像が 1 枚増えるだけで、既存ページの表示・URL・リンクは変わらない。ロールバックは PR の revert で足りる。

`CLAUDE.md` の写真差し替え注意書き 2 つの削除は、D2 が入ったあとに行う。

## Open Questions

- 写真が 3 枚以上になったときの個別ページの「中間ケース」（前後とも出る）は未検証のまま残る。写真の追加は PO の作業で、この change では写真を増やさない
