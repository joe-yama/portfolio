STATUS: DONE
開始: 2026-09-21

## フェーズの状態
- [x] P0 プリフライト（2026-09-21 完了）
- [x] P1 Change 4 profile-and-career（Issue #13 クローズ、ブランチ feature/profile-and-career、PR #14 マージ済み = main の 57f150c、worktree 削除済み。アーカイブは P3）
- [x] P2 Change 5 deploy-and-e2e（Issue #15 クローズ、ブランチ feature/deploy-and-e2e、PR #16 マージ済み = main の bc207bf。worktree は未削除。アーカイブは P3）
- [x] P3 公開の検証・ブランチ保護・後片付け（2026-09-21 完了）

## 結果
**v1 公開完了。** `https://joe-yama.github.io/portfolio/` で 7 ページが公開されている。完了条件 6 つはすべて実測で満たした（下の「完了条件の照合」）。

## 裁定（PO が後から覆せる）
| # | 裁定 | 理由 | 間違っていたときの代償 |
|---|---|---|---|
| 1 | Pages の有効化は `build_type=workflow`（計画書 §0/§6 の `workflows` は API が 422 で拒否） | API の実際の許容値が `legacy` / `workflow` のみ | なし（実測で確認済み） |
| 2 | ローカル preview は 4322 を使う。4321 を占有している別プロセス（pid 7233、このセッション外の残骸）は停止しない | 他セッションの副作用を避ける。計画書の 4321 前提は URL を差し替えれば足りる | reviewer に渡す URL を間違えると測定対象がずれる（都度明示して回避） |
| 3 | `docs/runs/` の計画書と ledger は primary 作業ツリー（main のチェックアウト）のファイルとして更新し、git へのコミットは P3 の `docs/v1-release-wrapup` ブランチで 1 回だけ行う（計画書 §1.3 の「P1 / P2 の change のコミットに同乗」は採らない） | main に直接コミットしない制約と、worktree 間でのファイル二重管理の回避を両立させるため。未コミットでもファイルは残るので再入可能性は保たれる | セッションが落ちてもファイルは残る。誤って作業ツリーを破棄した場合のみ失われる（破棄はルールで禁止） |
| 5 | Task 2 と Task 3 は 1 人の implementer に順に実装させる（SDD の「タスクごとに新しいサブエージェント」を採らない）。コミットはタスクごとに 2 つ | 両タスクは同じレビュー単位 B（ページの表示）で依存が強く、分けるとターン数だけ増える。レビューは別コンテキストのままなので `.claude/rules/review.md` の原則は守られる | 1 つのコンテキストが 2 タスク分の思い込みを引きずる可能性（単位 B のレビューで検出する） |
| 6 | 単位 A のレビューと単位 B の実装を並行させる | reviewer は作業ツリーを変更せず、Task 2・3 は `career.ts` / `site.ts` を読むだけなので衝突しない。ターン上限 500 に対する時間の節約 | 単位 A で関数のシグネチャが変わる指摘が出たら Task 2 の手直しが要る（シグネチャは spec 由来なので可能性は低い） |
| 11 | axe の `page-has-heading-one`（`/{ja,en}/photos/` と 404 で実測）は**この change で直す**。`.sr-only` の `<h1>` を追加し、見た目は変えない | 設計書 §8 のテスト計画が axe による「アクセシビリティ違反なし」を要求しており、`disableRules` はテストの期待値の書き換えに当たる。見出しジャンプで移動する支援技術利用者への実害がある | 不要な非表示見出しが残るだけ。PO が不要と判断すれば `<h1 class="sr-only">` 2 箇所を消せば戻る |
| 12 | 404 ページのヘッダーのロゴを `<a>` から `<span>` に変える | e2e が「404 の戻りリンクは `/portfolio/ja/` が 1 本」を検査したところ、ロゴも同じ行き先を指していて 2 本になった。`layout-shell` spec の「404 にはナビと言語切り替えを置かない」に照らすと、ロゴだけがリンクとして残るのは中途半端 | 404 からトップへ戻る導線が本文のリンク 2 本だけになる（どちらも見えている） |
| 13 | `landmark-unique` は計画が想定した `/ja/` `/en/` に加えて**写真の個別ページでも発生**した（ヘッダーの無名 `<nav>` と `nav.around` の衝突）。同じ方法（`aria-label`）で直す | 実測で出た違反で、原因も対策も計画の想定と同じ | なし |
| 8 | e2e の配信は Playwright の `webServer` ではなく `globalSetup` / `globalTeardown` で行い、ポートは `--port 4399` を明示する | `astro preview` は既定でデーモン化しコマンドが即 exit 0 で戻るため `webServer` の前提（プロセスが生き続ける）を満たさない。既定ポート 4321 はこのマシンで別プロセスが占有しており、自動変更（4322）だと `baseURL` を固定できない | CI で 4399 が塞がっていると e2e が落ちる（GitHub runner では使用実績のないポートなので可能性は低い） |
| 9 | 単位 A の Important（`layout-shell` の favicon Scenario が出力と矛盾）は implementer を起こさずコントローラーが spec delta を足して解消する | 修正対象が planning artifact 1 ファイルで、コードに触れない。`.claude/rules/review.md` の「機械的な修正はコントローラーが確かめて再レビューを省く」に当たる | spec の文言がぶれる（ブランチ全体のレビューで再確認される） |
| 10 | 単位 A のレビューと Task 3・4 の実装は**並行させない**（P1 とは違う判断） | `astro preview` は worktree に 1 つしか起動できず、implementer が `astro preview stop` すると reviewer の測定対象が消える | 逐次実行のぶん時間がかかる |
| 7 | 単位 B のレビューとブランチ全体のレビューを 1 回に統合する | 単位 B（Task 2・3）はブランチの残り全部で、直後に全体レビューをすると同じ diff を二重に見る。`.claude/rules/review.md` の「ブランチ全体のレビューは必ず 1 回」は満たす | 単位 B 固有の指摘と全体の指摘が混ざる（報告で区別させて回避） |
| 4 | Change 4 の spec は新規 capability `profile-and-career` 1 つ（計画書 §7.3 の「`layout-shell` の delta と新規 `career-page`」は採らない） | `layout-shell` の purpose は全ページ共通のレイアウトで、トップ固有の内容は入らない。`photo-pipeline`（写真という主題でデータ・ページ・配信を束ねる）と対になる粒度 | capability の粒度がずれた場合、後続で spec を分割・改名する手間（アーカイブ後の main spec の編集で済む） |
| 14 | e2e の preview 起動は `--background` を**明示**し、起動完了を `fetch` の 200 でポーリングして待つ（裁定 8 の「デーモン化してすぐ戻る」という前提を訂正する） | PR #16 の CI が 20 分ハングして PO が手動停止した。`astro preview` の自動デーモン化は対話端末でだけ起き、GitHub runner では前景実行になって `execSync` がブロックし、Playwright のテストが 1 件も始まらなかった（run 35546236303 のログで実測） | 起動待ちが上限に達したら e2e が赤くなる（ハングせず原因が出る方が良い） |
| 15 | ブランチ全体レビューの Minor「`ci.yml` の `check` job に `timeout-minutes` が無い」を **Important に格上げして直す**（`timeout-minutes: 20`） | `.claude/rules/review.md` の Minor 例外「壊れる根拠が示されたとき」に当たる。reviewer が想定した「`astro preview` が将来前景実行になった場合」が同じ CI 実行で現実になった | なし（20 分で打ち切るだけ。job 名 `check` は P3 の ruleset のため変えない） |
| 16 | 裁定 14・15 の修正に reviewer の再レビューを起こさず、CI の実行結果を証拠とする | 変更は e2e の起動待ちと job のタイムアウトの 2 点でプロダクトコードに触れない。正しさの判定基準が「CI が緑で終わるか」そのものなので、レビューより CI の実測が強い証拠になる | 起動待ちの実装に欠陥があれば CI が赤くなって分かる |
| 17 | e2e の preview は `--host 127.0.0.1` で明示バインドし、起動待ちのタイムアウト時に fetch の失敗理由（`cause`）もエラーに出す | 裁定 14 の修正後の CI（run 35547990420）で、preview は 60 秒間正常に起動していたのに `http://127.0.0.1:4399/portfolio/` への fetch が一度も 200 を返さなかった。ubuntu runner では `localhost` が `::1` に解決され、既定バインドが IPv6 のみになったためと見られる（macOS では `127.0.0.1` が先に来るので再現しない）。失敗理由を捨てていたため仮説の検証もできなかった | 仮説が外れていた場合、次の CI ログに出る `cause` で原因が特定できる |

## P3 の実測（2026-09-21）

### デプロイ
- PR #16 マージ = `main` の `bc207bf` → `deploy.yml` run 35560685379: `build` 55s / `deploy` 9s、ともに成功
- `gh api repos/joe-yama/portfolio/pages --jq .html_url` → `https://joe-yama.github.io/portfolio/`（`build_type: workflow`）
- 補足: `gh api repos/joe-yama/portfolio/pages/builds/latest` は **404**。`build_type=workflow` では legacy build が作られないため（計画書 §9.1 の待ち方は使えない）

### 公開 URL の実測（Playwright MCP、完了条件 3）
| 項目 | 実測 |
|---|---|
| `/portfolio/` のリダイレクト | `https://joe-yama.github.io/portfolio/ja/` に遷移（200） |
| 7 ページの HTTP | `/ja/` `/en/` `/ja/photos/` `/en/photos/` `/ja/photos/sunset-dinghies/` `/ja/career/` `/en/career/` = すべて **200** |
| `documentElement.lang` | 7 ページすべて URL のロケールと一致（ja 4 / en 3） |
| `link[rel=alternate][hreflang]` | 7 ページすべて **3 本**（`ja` / `en` / `x-default`）。例: `/en/career/` → ja `…/ja/career/` / en `…/en/career/` / x-default `…/ja/career/` |
| ヘッダーのリンク | 7 ページすべて 4 本、`href` は全部 `/portfolio/` 始まり。実際に fetch して `joe-yama` / Photos / Career / English = 200 × 4 |
| クリック遷移 | `/ja/` → Photos → Career → English を実クリックで辿り、`/ja/photos/` → `/ja/career/` → `/en/career/` に遷移（言語切り替えは**同じページの対訳**に飛ぶ） |
| 写真の同一オリジン | `img.currentSrc` = `https://joe-yama.github.io/portfolio/_astro/sunset-dinghies_1giCWk.avif`、`<source srcset>` 2 本もすべて同一オリジン |
| ネットワーク | 写真ページの全リクエスト 11 本が `joe-yama.github.io`。**自己配信フォント woff2 8 本を含め外部ドメインへのリクエストは 0** |
| 404 ページ | `/portfolio/does-not-exist/` が HTTP **404**、`404 · joe-yama`、ドット絵あり、戻りリンク 2 本（`日本語のトップへ` → `/portfolio/ja/` / `Go to the English top` → `/portfolio/en/`）。ヘッダーの `<a>` は **0 本**、ロゴは `SPAN`（裁定 12 のとおり） |
| コンソールエラー | **0**（唯一出たのは 404 パスを自分で `fetch` したときの `Failed to load resource: 404`。ページ由来ではない） |

### `main`（bc207bf）での検証（完了条件 4）
```
$ pnpm lint       → Checked 45 files in 9ms. No fixes applied.
$ pnpm typecheck  → 0 errors / 0 warnings / 0 hints
$ pnpm test       → Test Files 8 passed (8) / Tests 126 passed (126)
$ pnpm build      → 12 page(s) built in 1.68s
$ pnpm e2e        → 27 passed (5.4s)
```
※ 最初の `pnpm lint` は失敗した。原因は未追跡の `docs/runs/main-ruleset.json` の整形漏れ（Biome は未追跡ファイルも検査する）。`biome format --write` で解消。**このファイルは P3 のコミットに含まれるので、整形前に commit していれば CI が赤になっていた**。

| 18 | ruleset の作成を計画書 §9.3 の「最後」より前倒しし、wrapup PR を**作る前**に作成した | 計画が「最後」とした理由は「これ以降 `main` への直接 push が不可能になる」こと。今回は最初から直接 push をしない方針（裁定 3、計画書 §5）なので前倒しの副作用が無く、逆に wrapup PR のマージが ruleset を通ることで完了条件 5 を実地で検証できる。required status check 名は事前に `gh api .../check-runs` で `check` と実測した | 名前を誤って PR がマージできなくなった場合は `gh api -X DELETE repos/joe-yama/portfolio/rulesets/23749597` で戻せる |

## PO への申し送り（実行後に読んでもらう）

### 1. いま公開されているもの
- `https://joe-yama.github.io/portfolio/` に 7 ページ（日英のトップ・写真一覧・写真詳細・経歴）。`/portfolio/` は `/portfolio/ja/` にリダイレクトする
- **プロフィール・経歴は全部サンプルデータ**（PO 決定 2026-09-21）。`src/content/profile/{ja,en}.yaml` と `src/content/career/{ja,en}.yaml` を編集して PR を出せば差し替わる。日英で件数が違うとビルドが止まる（`content-schema` の要求）ので、両方を同じ件数にすること
- 写真は 2 枚（`kariya-ferris-wheel` / `sunset-dinghies`）。追加は `pnpm photo:add`。**同じ slug で再実行すると手書きの `title` / `location` / `alt` が `TODO:` に戻り、温かいキャッシュでは古い画像が残る**（`node_modules/.astro/assets` を消してからビルドする）
- 連絡先は `mailto:hello@example.com` と GitHub。メールアドレスもサンプルのまま

### 2. これ以降の変更の仕方（ruleset を入れたので変わった）
- `main` への直接 push はできない。すべて PR 経由になる（PO 自身も同じ。`bypass_actors` は設定していない）
- マージ条件は「PR であること」と「CI の `check` job が成功していること」の 2 つだけ。**approve は不要**（`required_approving_review_count: 0`）
- **CI の job 名 `check` を変えると、以後どの PR もマージできなくなる**（ruleset が `check` の成功を待ち続ける）。変えるときは ruleset も同時に更新する
- 緩めたい・外したいときは Settings > Rules、または `gh api -X DELETE repos/joe-yama/portfolio/rulesets/23749597`

### 3. 独自ドメインに移すときの手順
1. `public/CNAME` にドメイン名を書く
2. `astro.config.ts` の `site` を `https://<ドメイン>` に変える
3. **`base: '/portfolio'` を削除する**（消し忘れると全リンクが `/portfolio/` 付きのまま 404 になる）
4. DNS の設定（PO の作業）。HTTPS は GitHub Pages が自動発行
- `stripBase` / `withBase` は `base` を引数で受け取る純関数なので、`base` を消しても単体テストと e2e はそのまま通る設計になっている

### 4. 未検証・残っているもの
- **ライトハウス相当の性能・SEO は測っていない**（完了条件に無かった）。`sitemap.xml` と `robots.txt` も無い
- **写真の `<img>` の表示品質は目視していない**。e2e は「同一オリジンであること」と「リンクが解決すること」しか見ていない
- reviewer が挙げた **Minor は修正せず後続に回してある**。所在は `openspec/changes/archive/2026-09-21-profile-and-career/tasks.md` と `.../2026-09-21-deploy-and-e2e/tasks.md` の末尾「提案」
- **`.claude/rules/review.md` の Minor 運用に 1 件の反例が出た**: 「`ci.yml` に `timeout-minutes` が無い」という Minor が、同じ CI 実行で 20 分のハング（PO の手動停止）として実損化した（裁定 15）。「落ちたときに人間の時間を奪う」種類の Minor は格上げの候補になる
- worktree `.claude/worktrees/deploy-and-e2e` は削除済み。`feature/*` のリモートブランチは残している（削除は確認対象のため）

### 5. コスト面の観察
- 実装は Sonnet のまま通り、**Opus への切り替えは 0 回**（`.claude/rules/review.md` の 3 条件に当たらなかった）
- 一方で、**ローカルで緑・CI で赤**の往復が 2 回発生した（`astro preview` の挙動差と IPv6 バインド）。どちらも単体テストでは原理的に検出できない種類で、CI の実測でしか見つからなかった

## P0 プリフライトの記録
### 環境
- `git status --short`: クリーン（`docs/runs/` は未追跡＝この計画書と ledger）
- `git log --oneline -1`: 0286018
- `gh api user --jq .login`: joe-yama
- `openspec list`: No active changes found.
- `node -v`: v26.8.2 / `pnpm -v`: 12.4.2

### ベースライン（2026-09-21 03:01）
- `pnpm install --frozen-lockfile`: Lockfile is up to date
- `pnpm lint`: Checked 34 files. No fixes applied.（緑）
- `pnpm typecheck`: Result (31 files): 0 errors, 0 warnings, 0 hints
- `pnpm test`: Test Files 7 passed (7) / Tests 91 passed (91)
- `pnpm build`: 10 page(s) built。WARN 1 件（Release の画像 URL の再検証で「not an allowed remote location」→ stale cache で継続。`remotePatterns` は `**.githubusercontent.com` を許可済みだが、リダイレクト先の `release-assets.githubusercontent.com` の**再検証**経路で警告が出る。冷えた CI では初回取得が通っている前提。P2 のデプロイで再確認する）

### Playwright MCP 疎通
- `pnpm preview` は 4321 が使用中のため 4322 で起動。`browser_navigate http://127.0.0.1:4322/ja/` → Title `joe-yama`（200）。停止済み

### reviewer 定義
- `.claude/agents/reviewer.md` の `tools` に Playwright MCP 11 ツール（`mcp__playwright__browser_navigate` 含む）が載っていることをセッションの agent 一覧で確認。定義は変更しない

### GitHub Pages
- `gh api -X POST repos/joe-yama/portfolio/pages -f build_type=workflow` 成功。`html_url` = https://joe-yama.github.io/portfolio/ 、`build_type` = workflow
- **リスク §10.1 の実測**: bypass permissions 下で `gh api -X POST`（`-f` 付き）は確認プロンプトなしで通った

### P2 の事前調査（2026-09-21）
- `withastro/action` の README（main）の入力: `path` / `node-version`（既定 **24**）/ `package-manager`（lockfile から自動判定）/ `build-cmd` / `cache`（既定 true）/ `cache-dir`（既定 `node_modules/.astro`）/ `out-dir`（既定 `dist`）
- **`.node-version` は読まない**（README に記載なし）。`deploy.yml` では `node-version: 26.8.2` を明示する（リスク §10.4 の対策）
- README の例は `permissions: contents: read / pages: write / id-token: write`、`push: main` + `workflow_dispatch`、build = `withastro/action@v6`、deploy = `actions/deploy-pages@v5`。`concurrency` は例に無いので計画書 §8.3 のとおり自分で足す
- `vitest.config.ts` は既に `include: ['tests/unit/**/*.test.ts']` になっており、計画書 §8.2 の「Playwright の spec を Vitest が拾う」懸念は**対処済み**（確認のみでよい）

### P1 の記録（2026-09-21）
- コミット 7 つ: 2540056（change 成果物 + 設計書の裁定）、05e3f34（実装計画）、d94e85e（Task 1 純関数と ui）、e1a2aab（Task 2 career ページ）、e3a370b（Task 3 トップの完成）、4e36e6c（レビュー I-1 の修正）、16b5f66 + 25fb022（Minor の転記）
- レビュー: 単位 A = Needs fixes（Critical 0 / Important 1 / Minor 7）→ 修正 1 ラウンド → ブランチ全体 = **Approved**（Critical 0 / Important 0 / Minor 5）。**Opus 実装への切り替えなし**
- Important 1 件: `toLocalDate` の退行を `TZ=UTC` と `TZ=Asia/Tokyo` の両方で検出できないテスト。`process.env.TZ` をテスト内で一時変更するケースを追加し、implementer と reviewer の両方が変異実験で番人性を確認
- 検証: `pnpm lint` 37 files クリーン / `pnpm typecheck` 34 files 0 errors / `pnpm test` 106 passed / `pnpm build` 12 pages / `openspec validate --strict` valid / CI `check` 1m2s pass
- **Change 5 への申し送り 2 件**（`openspec/changes/profile-and-career/tasks.md` 末尾にも記載）:
  1. 名前の無い `navigation` ランドマークが `/ja/` `/en/` に 3 つ（ヘッダー + 連絡先 + 導線。うち 2 つは中身が同一）。`@axe-core/playwright` を既定設定で回すと `landmark-unique` が**必ず落ちる**。axe を入れる前に片付ける
  2. `base` 対応の確認対象に `src/pages/[lang]/index.astro` を加える。`languageSwitch(Astro.url.pathname, lang)` は `base` で `alternatePath` が `/en/portfolio/ja/` を返す（`localeFromPath` と同じ落とし穴の 4 つ目の呼び出し元）

### `base: '/portfolio'` を入れたときの実測（2026-09-21、Astro 7.3.2）
ビルド・lint・型検査・単体テストは**すべて通ったまま**次が壊れる（CLAUDE.md の警告どおり）。

| 箇所 | base 有りでの実値 | 結果 |
|---|---|---|
| `import.meta.env.BASE_URL` | `/portfolio/`（末尾スラッシュ付き） | — |
| `Astro.url.pathname` | `/portfolio/en/career/`（base 込み） | `localeFromPath` が `null` |
| `Astro.url.href` | `https://joe-yama.github.io/portfolio/en/career/` | — |
| `dist` の構造 | `dist/{ja,en}/...`（`dist/portfolio/` にはならない） | — |
| `/en/` の `<html lang>` | `ja` | **壊れる** |
| hreflang の本数 | 0 本 | **壊れる** |
| ヘッダー・ナビの `href` | `/ja/career/` | **404** |
| 言語切り替えの `href` | `/en/portfolio/en/career/` | **壊れる** |
| `<link rel="icon">` | `/favicon.svg` | **404** |
| `/` のリダイレクト先 | `url=/ja/` | **404** |
| 404 の戻りリンク | `/ja/` `/en/` | **404** |

直書きの `/` 始まり href は実測で 3 箇所（`BaseLayout.astro` の favicon、`index.astro` の favicon とリンク）+ テンプレート内のテンプレートリテラル（`Header.astro` のロゴ、`photos/index.astro` のカード、`[slug].astro` の前後リンク、`404.astro` の戻りリンク）。`Footer.astro` はリンクを持たないので対象外。

### P2 のレビュー結果（2026-09-21）
- 単位 A（`base` 対応）: Needs fixes（Critical 0 / Important 1 / Minor 4）。Important は **spec delta の欠落**（`layout-shell` の favicon Scenario が出力 `/portfolio/favicon.svg` と矛盾）で、コード修正は不要だった。コントローラーが delta を足して解消（2a422b8）
- ブランチ全体（単位 B・C）: Needs fixes（Critical 0 / Important 1 / Minor 7）。Important は **`links.spec.ts` が HTML 内インライン CSS の `src: url(...)` を検査していない**。reviewer の実測で、`dist/_astro/fonts/*.woff2` を 1 つ消しても、フォント URL から `/portfolio` を剥がしても **e2e 27 件が全部緑**だった。この change が防ぐはずの「`base` が入って静かに壊れる」形そのもの。正規表現 1 行で修正し、同じ変異 2 種が非 0 で落ちることを実証
- **Opus 実装への切り替え: なし**（両レビューとも Critical 0 で、修正は 1 ラウンドずつ）
- reviewer の変異 8 種のうち 6 種（`lang` 改変・hreflang 1 本削除・無名 `nav` 追加・avif 退避・外部 `img` 追加・`sr-only` の `h1` 削除）は e2e が検出した。すり抜けたのはフォント関連 2 種（→ 修正済み）と hreflang の対応づけ誤り（→ Minor。単体テストが押さえている）
- 実装を変えた 3 箇所（404 のロゴを `<span>`、`.sr-only` の `h1` 2 つ、`landmark-unique` 対応）はいずれも **spec 適合**と判定。`.sr-only` は実ページで `display:block` / `visibility:visible` / `clip: rect(0,0,0,0)` / 1×1px、アクセシビリティツリーに `heading level=1` が出て画面には見えないことをスクリーンショットで確認
- 最終検証: `pnpm lint` 44 files / `pnpm typecheck` 0 errors / `pnpm test` 126 passed / `pnpm build` 12 pages / `pnpm e2e` 27 passed

## 完了条件の照合（計画書 §2）
| # | 条件 | 実測 |
|---|---|---|
| 1 | Change 4・5 がマージ、Issue が閉じ、アーカイブ済み | PR #14（bc… 57f150c）/ PR #16（bc207bf）マージ、Issue #13・#15 CLOSED、`openspec list` → `No active changes found.`、`openspec/changes/archive/2026-09-21-{profile-and-career,deploy-and-e2e}/` |
| 2 | デプロイ成功と `html_url` | run 35560685379 成功、`gh api .../pages --jq .html_url` → `https://joe-yama.github.io/portfolio/` |
| 3 | 公開 URL の Playwright MCP 実測 | 上の「公開 URL の実測」表。全 9 項目成立 |
| 4 | `main` で 5 コマンドが緑 | 上の「`main`（bc207bf）での検証」 |
| 5 | ruleset が 1 件 | `gh api repos/joe-yama/portfolio/rulesets` → `23749597 main active`（1 件） |
| 6 | CLAUDE.md / harness README / ledger / Issue の更新 | 本 PR（`docs/v1-release-wrapup`）と Issue #13・#15 の最終コメント |
