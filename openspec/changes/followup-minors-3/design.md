# Design

## Context

仕分けは main `df7be75` に対して行った（出典: `openspec/changes/archive/2026-09-23-header-nav-icons/tasks.md` と `openspec/changes/archive/2026-09-23-followup-minors-2/tasks.md` の末尾の「提案」）。27 件の内訳は proposal と `tasks.md` の冒頭を参照。進行中の change は他に無く、並行 worktree との衝突域は考えなくてよい。

## Goals / Non-Goals

**Goals:** 申し送りのうち壊れる入力・番人の穴を塞ぎ、spec に 2 つの要求（特許の `url` と公報番号の対応、ヘッダーのベースライン）を足して番人で守る。

**Non-Goals:** 新機能、写真まわりの見た目、proposal の「含めない」に挙げた件。

## Decisions

### D1: 特許の `url` と `number` の対応はビルド時の検証で守る

`src/lib/validate.ts` の `validateCareerPatents` に検査を 1 つ足す。`new URL(patent.url).pathname.split('/')` のどれかが `patent.number` と完全に一致しなければ、`${lang}: url が代表公報を指していない（number: …, url: …）` を返す。ja・en の両方に同じ関数が走るので、英語だけの誤りも捕まる。

- 代案: e2e で `href` が `/patent/<number>/` を含むことを見る → e2e は期待値を同じ YAML から読むので、YAML の誤りは原理的に捕まえられない（`followup-minors-2` の 7.1 (g) で実測済み）。それに、既存の「url 必須」「number 重複」と同じくビルド時に止めるほうが、入稿した本人がすぐ気づける
- 代案: Google Patents の URL の形（`/patent/<number>/<lang>`）まで固定する → spec は `url` を「公報の外部ページ」としか決めていないので、別のサイトに切り替える余地を残す。区切りの完全一致だけを見る

### D2: ヘッダーのベースラインとアイコンを隠す条件

- 隠す条件: `@media (max-width: 29.99rem)` を `@media not all and (min-width: 30rem)` にする（`(width < 30rem)` は古い Safari で規則ごと無視されるので使わない）。e2e の隠す側の幅に 479px を足す。閾値を 27rem に下げる変異を当てて、479px の検査が赤になることを確かめる
- ベースライン: 原因は `header { align-items: baseline }` の中で、`nav a` が `inline-flex` + `align-items: center` なので、アイコンを中央に置いた結果として文字が持ち上がること。第一候補は `nav a { align-items: baseline }` + `nav a :global(svg) { align-self: center }`（未検証）。これで 0.5px 以内にならなければ別の書き方を探してよい。ただし次の既存の要求は保つこと: アイコンがリンクの文字の行の高さを超えない、390px と 479px でアイコンを隠す、480px で 1 行
- ベースラインの測り方（e2e）: 文字のテキストノードを囲む `Range` の矩形の上端に、その要素の計算済みフォントで `canvas` の `measureText('x').fontBoundingBoxAscent` を足した値を、ベースラインとみなす（行の内容領域の上端 = ベースライン − ascent）。ロゴと 3 つのリンクのそれぞれで求めて差を比べる。**RED として、修正前の main で 1280px の差が 1.8px 前後になることを先に確かめる**。この測り方で修正前が赤にならなければ、測り方の誤りとして直してから進む

### D3: e2e の cwd 依存を無くす

`tests/e2e/pages.spec.ts` の `parsePatents('src/content/career/…')` と `tests/e2e/sitemap.spec.ts` の `join('dist', lang)` を、`paths.ts` や `links.spec.ts` と同じく `fileURLToPath(new URL('../../…', import.meta.url))` から組み立てる。確認は「cwd をリポジトリの外にして `playwright test -c <worktree>/playwright.config.ts` が通る」こと（`followup-minors-2` の 5.3 の手順）。`paths.ts` の写真ファイルの一覧は、`.` で始まる名前を除く（Astro の glob `*.yaml` はドットファイルに一致しない）。

### D4: e2e セットアップの pid

`global-setup.ts` で起動後の `currentPreviewPid()` が `null` なら、マーカーを書かずに throw する（起動した preview を teardown が止められなくなり、取り残したまま緑で終わるのを防ぐ）。あわせて `isPreviewAlreadyRunning` の `status --json` の `execSync` を `currentPreviewPid() !== null` に寄せられるか確かめ、寄せられるなら 1 か所にする。`parsePreviewPid` の export は unit テストが使っていないので外す。

### D5: 入稿コマンド

- login: `gh([...]).trim() !== 'joe-yama'` で比べる（出力全体）。`die` の文言にだけ先頭行を使い、1 行の中断を保つ（既存テスト「gh のアカウント名が複数行でも、中断の理由は 1 行になる」は緑のまま）。`joe-yama\n<何か>` が中断することを RED として足す
- 一時ディレクトリ: sharp の catch で `rmSync(work, { recursive: true, force: true })` してから `die` する。成功時に残る件は申し送りに無く、既存の挙動なので触らない

### D6: 挙動不変の整理

一覧は `tasks.md` の 4 章。どれも既存のテストが緑のまま通ることを前提にし、テストの削除・期待値の書き換えで通さない。テストを畳む・書き換える場合は、畳む前と同じ変異で落ちることを確かめる（5 章）。

## Risks / Trade-offs

- [ベースラインの修正で、1280px 以外の幅でアイコンの縦位置が変わる] → 既存の「行が高くならない」「390 / 479 / 480px」の e2e と、reviewer の 480px・1280px の実測で確かめる
- [ベースラインの測り方がフォントの読み込み前に走る] → ドット文字フォントは自己配信なので、測る前に `document.fonts.ready` を待つ
- [特許の検証を足すと、既存の 65 件が 1 件でも合わなければビルドが落ちる] → 仕分けのときに 130 行（ja・en）がすべて `https://patents.google.com/patent/<number>/<lang>` の形であることを確認済み
