# Tasks

どのタスクも RED → GREEN の順に進める（`.claude/rules/testing.md`）。記号の D<n> は design.md の決定の番号。

## 1. データ構造と日英の検査

- [x] 1.1 D1: RED: `tests/unit/schemas.test.ts` で、`headline` が無い・空のプロフィールが失敗し、ある場合は通ることを確かめる。GREEN: `profileSchema` に `headline` を足し、`src/content/profile/{ja,en}.yaml` に proposal の文言を書く。`pnpm test` と `pnpm build` で確かめる
- [x] 1.2 D2: RED: `tests/unit/schemas.test.ts` で、`highlights` が無い・0 件・5 件なら失敗し、1 件と 4 件なら通ることを確かめる。GREEN: `careerSchema` に `highlights` を足し、`src/content/career/{ja,en}.yaml` に 4 件ずつ書く
  - ja の文言:
    - コネクテッドカーのデータ基盤（20 か国以上・1,000 万台超）のプロダクトオーナー
    - 100 名超のエンジニアを対象にした開発標準化をリード
    - 特許 65 発明（うち米国を含む 47 件）
    - AWS 認定 12 資格をすべて取得（2026 年 AWS All Certifications Engineers）
  - en は同じ内容の訳
- [x] 1.3 D2: RED: `tests/unit/validate.test.ts` で、`highlights` の件数が日英で違うと `validateCareerParity` がエラー（`highlights` と両方の件数を含む）を返すことを確かめる。GREEN: 件数を見るキーの一覧に足す
- [x] 1.4 D3 / D4: RED: `tests/unit/schemas.test.ts` で、`group` を持つ資格が通り、空の `group` は失敗することを確かめる。`tests/unit/validate.test.ts` で、`group` の有無の食い違いと分け方の食い違いがエラー（`certifications` と位置を含む）になり、訳語で名前が違うだけなら通ることを確かめる。GREEN: スキーマと `validateCareerParity` を直し、実データの AWS 認定 12 件に `group`（ja は `AWS 認定`、en は `AWS Certifications`）を付ける。`pnpm build` が通ることで確かめる

## 2. 経歴ページ

- [x] 2.1 D3: RED: `tests/unit/career.test.ts` で `groupCertifications` を確かめる。見るのは次の 4 点
  - spec の「まとめた項目の位置」の並び（A → グループ → B）
  - グループの中が新しい順になること
  - `group` を持たない資格はそのまま残ること
  - 期間の文字列（ja は `2025年4月 – 2025年10月`、en は `April 2025 – October 2025`、同じ月だけのグループは 1 つ）

  GREEN: `src/lib/career.ts` に関数を足し、`ui` に `certGroupCount` を足す
- [x] 2.2 D2 / D3: `src/pages/[lang]/career.astro` に要約（`<h1>` の直後の見出しの無い `<ul>`）と、束ねた資格（`<li><details><summary>…</summary><ul>…</ul></details></li>`）を出す。RED → GREEN: `tests/e2e/pages.spec.ts` で次の 3 点を確かめる
  - 要約が `Career` と職歴の見出しのあいだに YAML の順で出ること
  - 資格の区画にグループの項目が 1 つだけあり、`AWS 認定（12 件）` / `AWS Certifications (12)` と期間を含むこと
  - `summary` を押すと 12 件が見えること

  期待する値は YAML から導く。既存の「区画の順序」の検査が緑のままであることも確かめる

## 3. トップページ

- [x] 3.1 D1: `src/pages/[lang]/index.astro` の `h1` の直後に `headline` を出す。RED → GREEN: `tests/e2e/pages.spec.ts` で、両ロケールで名前の次に `headline`、その次に `tagline` が現れることを確かめる
- [x] 3.2 D5: RED: `tests/e2e/viewport.spec.ts` に、spec「広い画面でのトップページの横並び」の 4 つの Scenario（1280×720、1024×768、1023×768、390×844）を足し、今の実装では 1280 と 1024 の検査が赤になることを確かめる。初見表示の既存の検査に「仕事の一行」と 1024×768 を足す。GREEN: `index.astro` の構造と CSS を design D5 のとおりに直す。既存の初見表示・写真の縦横比・横スクロールの検査が緑のままであることを確かめる

## 4. メタデータと共有カード

- [x] 4.1 D1: RED: `tests/e2e/pages.spec.ts`（または description を見ている既存の検査）で、`description` と `og:description` が `headline` と一致することを確かめる。GREEN: `BaseLayout.astro` を直す
- [x] 4.2 D6: RED: `tests/e2e/pages.spec.ts` で次の 3 点を確かめる
  - 代表写真ではない写真の個別ページの `og:image` が `/ja/` と異なり、`og:image:alt` がその写真の `alt` であること
  - `/en/career/` と `/en/photos/` の `og:image` が `/en/` と同じであること
  - 画像が 1200×630 で取得できること

  GREEN: `BaseLayout` に `ogPhoto` を足し、`photos/[slug].astro` から渡す

## 5. 文書

- [x] 5.1 `docs/content-authoring.md` に `headline`、`highlights`（1〜4 件、日英で件数をそろえる）、資格の `group`（日英で付け方をそろえる）の書き方を足す

## 6. 番人の確認と仕上げ

- [x] 6.1 変異を当てて、新しいテストが落ちることを確かめる（`docs/harness/README.md` の隔離実行の手順）。当てる変異は少なくとも次の 9 つ
  - (a) `headline` を任意にする
  - (b) `highlights` の上限を外す
  - (c) 件数の検査から `highlights` を外す
  - (d) `group` の分け方の検査を有無だけにする
  - (e) `groupCertifications` がグループを最も古い位置に置く
  - (f) 期間が同じ月のときも ` – ` でつなぐ
  - (g) 64rem のメディアクエリを外す（横並びの検査が赤）
  - (h) `ogPhoto` を無視して常に代表写真を使う
  - (i) `description` を `tagline` に戻す
  - 結果（隔離複製、変異ごとに対照 → 同じ複製に変異 → 変異入りで作り直した複製の 3 回。`RUN` / `[build] directory` の行が複製を指すことを確認）
    - 対照: 単体は 6 本とも `Tests 343 passed (343)`、e2e は 3 本とも `146 passed`
    - (a) 1 failed: schemas.test「profileSchema > headline を欠くと失敗し、エラーの path に headline が入る」
    - (b) 1 failed: schemas.test「careerSchema > highlights が 5 件なら失敗する」
    - (c) 1 failed: validate.test「validateCareerParity > highlights の件数差を報告する」
    - (d) 1 failed: validate.test「validateCareerParity > group の分け方が日英で違えば、食い違う位置を報告する」
    - (e) 1 failed: career.test「groupCertifications > グループの間に別の資格が挟まっても、グループの中は新しい順にまとまる」
    - (f) 1 failed: career.test「formatGroupPeriod > 同じ月だけのグループは 1 つだけ出し、– を含まない」
    - (g) 2 failed: viewport.spec「横並び: 1280×720 の /ja/ では代表写真が文字列の左にあり、本文の幅の半分以上を占める」「横並び: 1024×768 の /en/ では代表写真が名前の左にある」
    - (h) 1 failed: pages.spec「SNS 共有カード > 代表ではない写真の個別ページの共有カードは、その写真から作られる」
    - (i) 10 failed: pages.spec「<path> が表示され lang と hreflang が正しい」の 10 ページすべて（`meta[name="description"]` が tagline になる）
- [x] 6.2 `pnpm lint` / `pnpm typecheck` / `pnpm test` / `pnpm build` / `pnpm e2e` をすべて実行し、コマンドと出力を報告に添える

## 7. 最終レビューの修正

- [x] 7.1 最終レビュー I1: ja の headline の行頭禁則（`line-break: strict`）と、その e2e を足す

## 8. PO 指示 2026-09-24（仕事の一行の取り下げと、提案の繰り上げ）

PR #61 の作成後、PO が (1) 仕事の一行（A1）をやめる、(2) 下の「提案」をこの PR で対応する、(3) トップの本文の幅の上限を外す、と決めた。1.1・3.1・4.1・7.1 のチェックは実装の履歴として残し、8.1 で取り消す。

- [x] 8.1 A1 の取り下げ（design D1）: `headline` をスキーマ・`src/content/profile/{ja,en}.yaml`・`index.astro`（`p.headline` と `line-break: strict`）・`docs/content-authoring.md` から消し、`BaseLayout` の description を `profile.tagline` に戻す。64rem 未満の `.hero` の上限を `100svh - 27rem` に戻す（D5）。headline を前提にしたテスト（スキーマの headline の検査、トップの名前 → headline → tagline の並び、description = headline、行頭禁則の 2 本、初見表示と横並びの `p.headline`）は spec から要求が消えたので、description の検査は `tagline` と一致する形に、並びの検査は名前の次が `tagline` の形にする。`pnpm test` / `pnpm e2e` が緑
- [x] 8.2 トップの本文の幅の上限を外す（design D7、spec「広い画面でのトップページの横並び」の 2 つの Scenario）。RED: `viewport.spec.ts` に 1920×1080 の `/ja/`（`main` の本文の幅 = 画面の幅 − 2rem、写真の左端 = ヘッダーのロゴの左端 ±1px、写真の幅 ≥ 1000px、写真の下端 ≤ 画面の下端、横スクロール無し）と、1920 幅の `/ja/career/`（`main` の幅 = 80rem）を足し、前者が赤を確かめる。GREEN: `index.astro` に `:global(main):has(> .top) { max-width: none; }`
- [x] 8.3 横並びの代表写真の `sizes`（design D8）。RED: 1280×720・devicePixelRatio 1 の `/ja/` で、代表写真の `currentSrc` が `srcset` の `1200w` の候補であることを確かめ、赤を確かめる（今は 78rem = 1248px から 1800w を選ぶ）。GREEN: `PhotoPicture` に任意の `sizes` を足し、`index.astro` から `(min-width: 64rem) calc((100vw - 4rem) * 0.6), calc(100vw - 2rem)` を渡す。写真の個別ページとギャラリーの `sizes` は変えない
- [x] 8.4 束ねた資格の行の見た目（design D9。PO 指示 2026-09-24 で差し替え）。束ねた項目の 1 行目は他の資格と同じ普通の行（黒丸 + 期間 · グループ名（件数））にし、開閉の三角と `ui[lang].showAllCerts(n)`（ja `全 N 件を表示`、en `Show all N`）の `summary` を次の行の頭に置く。RED: `pages.spec.ts` で、(a) 1024 幅の `/ja/career/` の資格の区画の直下の `li` どうしで、1 行目の文字の上端の送りがそろう（束ねた項目の 1 行目の上端と前後の行の間隔が ±1px）、(b) 束ねた項目の `summary` は 1 行目より下の行にあり、その box の左端（三角を含む）が 1 行目の文字（日付）の左端と ±1px でそろい、文字列は `ui[lang].showAllCerts(件数)`（件数は YAML の group を持つ資格の数から導く）、(c) 1 行目の文字列（期間 · グループ名（件数））は `summary` の外にあり、`certGroupCount` の表記と期間を含む（既存の束ねの検査を li の 1 行目を見る形に直す）、(d) 390 幅で 1 行目が折り返したとき、2 行目の左端が 1 行目の文字の左端とそろう、を確かめ、赤を確かめる。既存の「開く前は内訳が 0 件、開くと 12 件が新しい順」は `summary` をクリックする形のまま残す。GREEN: `career.astro` のマークアップと `ui` の `showAllCerts`
- [x] 8.5 番人の穴を塞ぐ: (a) `validate.test.ts` に資格の件数が ja > en の向きのケースを足す、(b) e2e の `parseHighlights` がクォートを外し、`parseCertifications` の前提（1 件は `  - date:` で始まる）を JSDoc に書く、(c) `/en/` ほかの `og:image:alt` を YAML の代表写真の `alt.en` と直接比べ、写真の個別ページの `og:image` も同一オリジンかを見る、(d) 1023×768 の `/ja/` と `/en/` で、縦並びのトップの初見表示（写真・名前・肩書・導線・連絡先の下端 ≤ 画面の下端）を確かめる e2e を足す、(e) `CertificationEntry` の group の `items` を空でない配列の型（`[Certification, ...Certification[]]`）にし、`formatGroupPeriod` も空でない配列だけを受ける型にする
- [x] 8.6 ponytail: (a) `pages.spec.ts` の代表でない写真の slug を定数 `'kariya-ferris-wheel'` にする、(b) `.highlights` の margin を `section` と 1 つの規則にまとめる、(c) 資格 1 件分のマークアップを `src/components/CertItem.astro`（`PatentItem.astro` と同じ形）にまとめ、single と内訳の両方から使う
- [x] 8.7 変異を当てて、8.2〜8.5 の新しい番人が落ちることを確かめる（隔離実行）。少なくとも: 8.2 の `:has` の規則を外す、8.3 の `sizes` を渡さない、8.4 の CSS を外す、8.5(a) の件数のガードを外す、8.5(d) の 64rem 未満の上限を 20rem にする、8.1 の description を `profile.name` にする
  - 結果（2026-09-24、HEAD 6ec77ff の git archive → scratchpad の複製に install --offline。各変異とも 対照 / 変異 / 変異入りで作り直した複製、の 3 回。e2e は `[build] directory:`、vitest は `RUN` の行が複製を指すことを確認）
  - 8.2 `:has(> .top)` の規則を外す: 対照 1 passed → 1 failed / 作り直し 1 failed（1920×1080 の本文の幅 1248 ≠ 1888）
  - 8.3 `sizes={heroSizes}` を渡さない: 対照 1 passed → 1 failed / 作り直し 1 failed（`1800w` が選ばれる）
  - 8.4 の変異は PO 指示の新しい形に合わせ「`details` を 1 行目の前に移す」に読み替えた（CSS を足していないため）: 対照 10 passed → 3 failed / 作り直し 3 failed（(a) 送り 36.6 ≠ 3、(b) summary が 1 行目より上。(d) の 390 幅は緑のまま＝この変異では 1 行目の折り返しが崩れないため）
  - 8.5(a) 件数のガードを `if (true)` にする: 対照 48 passed → 2 failed / 作り直し 2 failed（新しい ja > en のケースと既存の件数差のケースが TypeError）
  - 8.5(d) 64rem 未満の上限を `100svh - 20rem` にする: 対照 2 passed → 2 failed / 作り直し 2 failed（1023×768 の ja・en で連絡先リンクの下端 845.8 > 768）
  - 8.1 description を `profile.name` にする: 対照 10 passed → 10 failed / 作り直し 10 failed（description が `Josuke Yamane`）
- [x] 8.8 `pnpm lint` / `pnpm typecheck` / `pnpm test` / `pnpm build` / `pnpm e2e` をすべて実行し、コマンドと出力を報告に添える
- [x] 8.9 Task 8 のレビューの修正（I1 写真の左端のずれ、M1 束ねた項目の間隔、M2〜M4）

## 提案（本 change のスコープ外・後続への申し送り）

- （2026-09-24 の PO 指示で、それまでの提案 11 件は 8. に繰り上げた。仕事の一行の折り返しの件は A1 の取り下げで不要になった）
