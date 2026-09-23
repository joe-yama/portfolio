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

- [ ] 6.1 変異を当てて、新しいテストが落ちることを確かめる（`docs/harness/README.md` の隔離実行の手順）。当てる変異は少なくとも次の 9 つ
  - (a) `headline` を任意にする
  - (b) `highlights` の上限を外す
  - (c) 件数の検査から `highlights` を外す
  - (d) `group` の分け方の検査を有無だけにする
  - (e) `groupCertifications` がグループを最も古い位置に置く
  - (f) 期間が同じ月のときも ` – ` でつなぐ
  - (g) 64rem のメディアクエリを外す（横並びの検査が赤）
  - (h) `ogPhoto` を無視して常に代表写真を使う
  - (i) `description` を `tagline` に戻す
- [ ] 6.2 `pnpm lint` / `pnpm typecheck` / `pnpm test` / `pnpm build` / `pnpm e2e` をすべて実行し、コマンドと出力を報告に添える

## 提案（本 change のスコープ外・後続への申し送り）

- 横並びのトップでも `PhotoPicture` の `sizes` が `78rem` のままで、必要より大きい画像を読み込む（design の Risks）
