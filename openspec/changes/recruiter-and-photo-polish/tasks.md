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

- [x] 7.1 最終レビュー I1: ja の headline の行頭禁則（`line-break: strict` ほか）と、その e2e を足す

## 提案（本 change のスコープ外・後続への申し送り）

- 横並びのトップでも `PhotoPicture` の `sizes` が `78rem` のままで、必要より大きい画像を読み込む（design の Risks）
- 経歴ページの束ねた資格の行で、外側の `li` の黒丸と `summary` の三角が二重に出る。特許用の `details { margin-top: 0.5rem }` が効いてグループの上だけ 8px 空き、文字の開始位置が隣の行より約 17px 右にずれる（`li > details { margin-top: 0 }` と、黒丸か三角のどちらかを消せば直る）
- 幅 390 で束ねた資格の `summary` が折り返すと、2 行目が三角の左端から始まる
- e2e の `parseCertifications` は 1 件が `  - date:` で始まる前提、`parseHighlights` はクォートを外さない（JSDoc に前提を書くか、クォートを外す）
- `formatGroupPeriod([])` は TypeError になる（呼び出し元の `groupCertifications` は空のグループを作らないので今は起きない）
- `validate.test.ts` の「資格の件数が違うときは group の突き合わせまで進まない」は ja < en の向きだけで、件数のガードを外しても緑（ja > en だと TypeError）。逆向きのケースを足す
- 1280px 以上では `main` の max-width で写真が 729.6×486.4 に固定され、1920×1080 以上では画面の下半分が空く。「写真主役」を進めるならトップだけ `main` を広げる（global.css に触るので別 change）
- 64rem 未満の縦並びの初見表示（30rem の見積もり）を守る e2e が無い
- `og:image:alt` の検査は本文の alt と比べているので、両方が同じロケールへずれると見逃す。写真の個別ページの `og:image` のオリジンも確かめていない
- ponytail: pages.spec の代表でない写真の slug を写真のディレクトリから導く処理は定数 1 行にできる。`.highlights` の margin は `section` と 1 ブロックにまとめられる。資格 1 件分のマークアップが career.astro の 2 か所にある
