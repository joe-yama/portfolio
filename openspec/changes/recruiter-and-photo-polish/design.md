# Design

## Context

動機は proposal.md の Why を参照。今の実装で、この change が触る部分の状態は次のとおり。

- `src/pages/[lang]/index.astro`: 上から順に、写真（`.hero`）、ドット絵（`.art`）、`h1`、`tagline`、導線、連絡先。写真の高さの上限は `.hero` の `--photo-max-height: max(12rem, 100svh - 27rem)` で決まっている。27rem は、写真の下に並ぶ文字列の高さの見積もり（Change 9）
- `src/components/PhotoPicture.astro`: `full` の `img` は `max-height: var(--photo-max-height)` で縦横比を保ったまま縮み、`margin-inline: auto` で中央に置かれる
- `src/layouts/BaseLayout.astro`: `description` は `profile.tagline`。共有カードの画像は常に `getFeaturedPhoto()` から `getImage`（1200×630、cover）で作る
- `src/pages/[lang]/career.astro`: 資格は `sortByDateDesc(career.certifications)` を 1 件ずつ `<li>` に出す。特許は `<details>` で 6 件目以降を折りたたんでいる（JavaScript なし）
- `src/lib/validate.ts` `validateCareerParity`: 配列の件数と `INDEXED_KEYS` の比較キーを日英で突き合わせる

## Goals / Non-Goals

**Goals:**

- データの追加（`highlights`・`group`）は、既存のスキーマと日英の検査の形に沿わせ、新しい仕組みを作らない
- 横並びは `index.astro` の CSS だけで行い、`PhotoPicture` の仕組み（`--photo-max-height`）を再利用する

**Non-Goals:**

- 64rem 未満のトップの見た目、写真の個別ページやギャラリーのレイアウトは変えない
- `PhotoPicture` の `sizes` を横並び用に最適化すること。PC 幅の写真は列の幅より大きい候補を選ぶことがあるが、読み込む量が増えるだけで表示は変わらないので、見送る（Risks を参照）

## Decisions

### D1 `headline` はプロフィールの必須項目にし、description もこれにする（取り下げ。PO 決定 2026-09-24）

実装後に PO が仕事の一行をやめると決めた。`headline` はスキーマ・YAML・表示から消し、description は `tagline` のままにする。以下は当初の決定の記録。

`profileSchema` に `headline: nonEmpty` を足す。`tagline` は残す。

- 任意の項目にすると、「無いときは何を表示するか」の分岐と、それを確かめるテストが要る。データは日英とも 1 件ずつしか無いので、必須にするほうが単純になる
- `BaseLayout` の `description` を `profile.headline` にする。`og:description` は `description` と同じ変数から出ているので、1 か所の変更で両方が変わる

### D2 `highlights` は経歴の必須の配列（1〜4 件）にする

`careerSchema` に `highlights: z.array(nonEmpty).min(1).max(4)` を足す。

- 名前を `summary` にしなかったのは、既存の e2e がすでに `<summary>` 要素（特許の折りたたみ）を `locator('summary')` で探しており、読み手が取り違えるため
- 日英の一致は、`validateCareerParity` の件数を見るキーの一覧に `highlights` を足すだけで済む。比較キー（`INDEXED_KEYS`）の対象にはしない。日付のような、言語によらない値を持たないため
- 表示: `career.astro` の `<h1>Career</h1>` の直後に `<ul class="highlights">` を置く。見出しは付けない（spec の要求）

### D3 資格の束ねは、`career.ts` の純関数 1 つで行う

`groupCertifications(sorted)` を足す。入力は `sortByDateDesc` 済みの資格の配列、出力は次の 2 種類が混ざった配列。

- `{ kind: 'single', item }`
- `{ kind: 'group', name, items }`（`items` は新しい順）

作り方: 並んだ順に 1 件ずつ見ていく。`group` を持つ資格は、そのグループが初めて出てきた位置に入れ物を作り、2 件目以降は同じ入れ物に足す。入力が新しい順に並んでいるので、初めて出てきた位置が、そのグループで最も新しい `date` の位置になる（spec の「最も新しい資格の位置」）。

- 期間の文字列は `formatDate(最古, lang)` と `formatDate(最新, lang)` を ` – ` でつなぐ。両者が同じ文字列なら 1 つだけにする。区切りは `formatPeriod` と同じ ` – `（en ダッシュの前後に空白）
- 件数の表記は `ui[lang]` に関数 `certGroupCount(name, n)` として置く。ja は `${name}（${n} 件）`、en は `${name} (${n})`。特許の `morePatents` と同じ置き方
- 表示: `<li><details><summary>{期間} · {件数の表記}</summary><ul>…内訳…</ul></details></li>`（D9 で差し替え。期間と件数の表記は `summary` の外の 1 行目に出す）。`<details>` は `<li>` の中に置けるので、HTML として正しい。特許の区画の `<details>` が `<ul>` の兄弟になっていて `<ul>` を 2 つに分けているのとは違い、ここでは `<ul>` を分けない
- 検討した別の案: YAML で入れ子にして、グループの下に資格を並べる。日英の一致の検査と日付の並べ替えが入れ子に対応する必要があり、既存の `sortByDateDesc` も `INDEXED_KEYS` もそのまま使えなくなるので採らない

### D4 `group` の日英の一致は「分け方が同じ」ことを見る

`validateCareerParity` に、資格の件数が一致したときだけ、次の 2 つの検査を足す。

1. 各位置 i で、`group` の有無が日英で同じであること
2. `group` を持つ位置の組 i・j について、`ja[i].group === ja[j].group` と `en[i].group === en[j].group` の真偽が一致すること

実装は、各言語で `group` の名前を「最初に出てきた位置の番号」に置き換えた配列を作り、日英で比べる。例えば `[AWS, AWS, なし]` は `[0, 0, -]` になる。こうすると 1 と 2 を 1 回の比較で見られ、食い違った最初の位置をエラーに出せる。

### D5 横並びは `index.astro` の CSS グリッドで行う

- 本文を `<div class="top">` で包み、写真（`.hero`）と文字列（`.intro`。ドット絵・`h1`・`tagline`・導線・連絡先）の 2 つの子にする
- `@media (min-width: 64rem)` で `.top` を `grid-template-columns: 3fr 2fr`、`align-items: center`、`gap: 2rem` にする。64rem 未満では今の縦並び（ブロック）のまま
- 同じメディアクエリの中で、`.hero` の `--photo-max-height` を `calc(100svh - 10rem)` に上書きし、`margin-bottom` を 0 にする。10rem の内訳は、ヘッダー（約 4rem）と `main` の上下の余白（2rem × 2）に、2rem の余裕を足したもの。横並びでは写真の下に文字が来ないので、27rem の見積もりは要らない
- メディアクエリは `min-width` で書く。範囲構文は使わない（`header-nav-icons` の design D2 と同じ理由。配信される CSS では書き換わることが分かっている。`followup-minors-3` の提案を参照）
- 検討した別の案: flex で並べる。3:2 の比率と縦方向の中央ぞろえは、grid なら 2 行で書けるので採らない
- 実装時の裁定（2026-09-24）: 上の本文と実装が違う点が 2 つある
  - 64rem 以上の上限は `calc(100svh - 10rem)` ではなく `max(12rem, 100svh - 10rem)` にした。理由: photo-pipeline spec の「画面の高さが極端に小さい場合でも 0 になってはならない」が 64rem 以上にも掛かるため。番人は viewport.spec の 1280×300 の計測
  - ~~64rem 未満の上限を `100svh - 27rem` から `100svh - 30rem` にした~~ → 仕事の一行を取り下げたので 27rem に戻す（2026-09-24）。30rem は一行が写真の下に 1 行増えた分の対処だった

### D6 共有カードの写真は `BaseLayout` の引数で受け取る

`BaseLayout` の `Props` に `ogPhoto?: PhotoEntry` を足す。

- 渡されたときはその写真から、渡されないときは今までどおり `getFeaturedPhoto()` から、`getImage`（1200×630、`fit: 'cover'`）でカード画像を作る。`og:image:alt` はその写真の `alt[lang]` にする
- `photos/[slug].astro` だけが `ogPhoto={photo}` を渡す
- 縦位置の写真は中央で横長に切り抜かれ、上下が切れる。SNS はカードを 1.91:1 前後で表示するので、余白を足して縮めるより、切り抜くほうが見栄えがよいと判断した（PO の承認は brainstorming の設計で得ている）

### D7 トップだけ本文の幅の上限を外す（PO 決定 2026-09-24）

- `index.astro` のスタイルで `:global(main):has(> .top)` の `max-width` を `none` にする。`global.css` の `main` の規則と、トップ以外のページの幅は変えない
- 左右の余白は `main` の既存の `padding: 2rem 1rem` のまま。ヘッダーも左右 1rem なので、代表写真の左端はロゴの左端にそろう
- 写真の大きさは列の幅（本文の幅 × 3/5）と高さの上限（`100svh - 10rem`）の小さいほうで決まる。1920×1080 で約 1110×740px、2560×1440 で約 1500×1000px
- 検討した別の案: 上限を 120rem にする（2560px 以上で左右が空く）。PO が上限を外す案を選んだ

### D8 横並びの代表写真の `sizes` を列の幅に合わせる

- `PhotoPicture` の `full` の `sizes` は `(min-width: 80rem) 78rem, calc(100vw - 2rem)` で、横並びの列の幅（約 60%）より大きい候補を読み込む。D7 で本文の幅の上限が無くなるので、78rem という値もトップでは合わなくなる
- トップの代表写真だけ、列の幅を表す `sizes` を渡せるようにする（`PhotoPicture` に任意の `sizes` を足す）。値は `(min-width: 64rem) calc((100vw - 4rem) * 0.6), calc(100vw - 2rem)`（本文の左右の余白 2rem と列の間 2rem を引いた幅の 3/5）
- 写真の個別ページとギャラリーは変えない

### D9 束ねた資格の行の見た目

PO 指示 2026-09-24 で差し替え。

- 束ねた項目の 1 行目は、他の資格の行と同じ普通の行にする。外側の `li` の黒丸は既定のまま、本文は `{期間} · {グループ名（件数）}`。この行は `summary` ではなく `li` の本文
- 開閉の三角は次の行の頭に置き、三角の後ろに `ui[lang].showAllCerts(n)`（ja `全 N 件を表示`、en `Show all N`。特許の `morePatents` と同じ置き方）を出す。マークアップは `<li><span class="muted">{期間}</span>{' · '}{certGroupCount(name, n)}<details><summary>{showAllCerts(n)}</summary><ul>…内訳…</ul></details></li>`
- `details` は `li` の中のブロックなので、`summary` の box の左端は `li` の本文の左端（1 行目の日付の左端）にそろい、1 行目が折り返しても 2 行目は同じ左端から始まる。CSS は足さない。特許用の `details { margin-top: 0.5rem }` は 1 行目と三角の行の間にだけ効き、`li` どうしの送りは変えない
- 検討した別の案: 外側の `li` の黒丸を消し、`summary` の三角を黒丸の位置（行の外側）に置く（当初の D9）。PO が 1 行目を普通の行にする案を選んだ

## Risks / Trade-offs

- [横並びでも `PhotoPicture` の `sizes` が `(min-width: 80rem) 78rem` のままなので、ブラウザは列の幅（約 60%）より大きい候補を選ぶ] → D8 で対処する（PO 指示 2026-09-24 で提案から繰り上げ）
- [10rem の見積もりがヘッダーの実際の高さとずれると、写真の下端が画面から出る] → 1280×720・1440×900・1024×768 の初見表示を e2e で検査する（spec の Scenario）

## Migration Plan

データの追加とコードの変更を同じ PR で入れる。PR をマージすると、`deploy.yml` が公開する。戻すときは PR を revert する。移行の手順は要らない。
