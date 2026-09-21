# Tasks

レビューの単位（`.claude/rules/review.md`）: **単位 A = タスク 1（純関数と `ui`。共有インターフェースに触る）**、**単位 B = タスク 2・3（ページ。UI 実測あり）**、**ブランチ全体 1 回**。

## 1. 整形の純関数と表示文字列（単位 A）

- [x] 1.1 `src/lib/career.ts` に `sortExperience` / `sortByDateDesc` を TDD で実装する。`tests/unit/career.test.ts` で「`from` が `2017-04` / `2020-04` の 2 件を渡すと `2020-04` が先」「`date` が `2023-06-01` / `2024-10-12` の 2 件を渡すと `2024-10-12` が先」「元の配列を破壊しない」を固定し、`pnpm test` が緑になることで検証する
- [x] 1.2 `src/lib/career.ts` に `formatPeriod(from, to, lang)` を TDD で実装する。`YYYY-MM` を年・月に分解して `new Date(年, 月-1, 1)` を作り（UTC 解釈を避ける。design D1）、`Intl.DateTimeFormat(lang, { year: 'numeric', month: lang === 'ja' ? 'long' : 'short' })` で整形する。期待値は実測済み（ja: `2020年4月 – 現在` / `2017年4月 – 2020年3月`、en: `Apr 2020 – Present` / `Apr 2017 – Mar 2020`。区切りは U+2013 の前後に半角空白）。`to` が `undefined` と `null` の両方で「現在 / Present」になることをテストで固定し、`pnpm test` が緑になることで検証する
- [x] 1.3 `src/lib/career.ts` に `formatDate(date, lang)` を TDD で実装する（`YYYY-MM-DD` を分解して `new Date(年, 月-1, 日)`、`{ year: 'numeric', month: 'long', day: 'numeric' }`）。期待値は実測済み（ja: `2023年6月1日`、en: `June 1, 2023`）。`pnpm test` が緑になることで検証する
- [x] 1.4 `src/lib/site.ts` の `ui` に区画の見出し（`careerSections`: 職歴 / スキル / 資格 / 実績、Experience / Skills / Certifications / Achievements）と `achievementKind`（登壇・執筆・受賞・その他 / Talk・Article・Award・Other）を型付きで追加する。`tests/unit/site.test.ts` に「両ロケールで 4 つの種別すべてにラベルがある」テストを足し、`pnpm test` と `pnpm typecheck` が緑になることで検証する

## 2. 経歴ページ（単位 B）

- [x] 2.1 `src/pages/[lang]/career.astro` を追加する（`getStaticPaths` で両ロケール、`toLocale(Astro.params.lang)`、`getCareer(lang)`、`BaseLayout` に `title="Career"`、`h1` は `Career`）。職歴・スキル・資格・実績の 4 区画を design D5 のマークアップで出し、タスク 1 の純関数と `ui` を使う。`pnpm build` 後に `dist/ja/career/index.html` と `dist/en/career/index.html` が存在し、`<title>` が `Career · joe-yama` であることで検証する
- [x] 2.2 `url` を持つ項目だけをリンクにする（実績の `url` あり → `<a>`、資格の `url` なし → 素のテキスト）。`pnpm build` 後に `dist/ja/career/index.html` を `grep` し、`https://example.com/talk` へのリンクが 1 つあり、`応用情報技術者` がリンクになっていないことで検証する

## 3. トップページの完成（単位 B）

- [x] 3.1 `src/pages/[lang]/index.astro` に連絡先リンク（`profile.links` を順に、`label` を表示、`target` を付けない）を追加する。`pnpm build` 後に `dist/ja/index.html` に `mailto:hello@example.com` と `https://github.com/joe-yama` が現れ、`target=` が本文に無いことで検証する
- [x] 3.2 `src/pages/[lang]/index.astro` に本文の導線（`navLinks(lang)` の 2 本と `languageSwitch(Astro.url.pathname, lang)` の 1 本）を追加する。`.astro` にパスを直書きしない（design D3）。`pnpm build` 後に `dist/en/index.html` の本文に `/en/photos/`、`/en/career/`、`/ja/` が現れることで検証する
- [x] 3.3 `src/pages/[lang]/index.astro` の検証目的のダミー `await getCareer(lang)` とその説明コメントを削除する（design D4）。削除後に `pnpm build` が通り、`src/content/career/en.yaml` の `certifications` を 1 件減らすと `pnpm build` が「件数が日英で違う」で止まることを実測して戻すことで、検証がビルドに残っていることを確認する

## 4. 仕上げ

- [x] 4.1 `pnpm lint && pnpm typecheck && pnpm test && pnpm build` がすべて緑、`openspec validate profile-and-career --strict` が valid、`git status --short` が空であることを確認し、本ファイルの完了項目を `[x]` にしてコミットする
- [x] 4.2 `reviewer`（Opus）でブランチ全体をレビューし、結果を Issue にコメントする
- [x] 4.3 push して `Closes #<Issue>` を含む PR を作り、CI 緑と Approved を確認してマージする

## 提案（この change では実装しない。後続の change 用）

単位 A（Task 1）のレビューで挙がった Minor と ponytail。

- `src/lib/career.ts` の `month: lang === 'ja' ? 'long' : 'short'` は**死んだ分岐**。Node 26.8.2 の実測では ja は `long` / `short` / `narrow` のいずれでも `2017年4月`（`2020/04` になるのは `numeric` / `2-digit`）。`'short'` 固定にできる。計画書の落とし穴 2 の「ja で `short` を使うと `2020/04` になる」は事実誤りだった
- `src/lib/career.ts` の `toLocalDate` の `year === undefined || month === undefined` ガードは `Number` が `NaN` を返す経路を捕まえない（`'2020-13'` → `Jan 2021` に静かに丸める、`'0020-04'` → `Apr 1920`）。`src/content/schemas.ts` の正規表現が上流で形式を保証しているので到達不能
- `src/lib/career.ts` の `to` が空文字のとき falsy 判定で「現在 / Present」になる。schema が弾くので到達不能
- 実績の種別集合 `'talk'|'article'|'award'|'other'` が `src/lib/site.ts` と `src/content/schemas.ts` に二重定義。zod enum から `z.infer` で導出すれば片方だけ増やす事故を防げる
- `tests/unit/site.test.ts` の `article` / `award` / `other` は `toBeTruthy()` だけなので、ja と en のラベルを取り違えても通る。`toEqual` で 4 件まとめて固定すれば短く強くなる
- `present`（`現在` / `Present`）が `ui` ではなく `src/lib/career.ts` にある。design D2 の「文字列の置き場を割らない」と D1 / tasks 1.2 の記述が計画書の中で矛盾していた。`ui[lang].present` に移すかは PO 判断
- design D2 は `ui` のキーを `career`、tasks 1.4 は `careerSections` と書いていた。実装は `careerSections`（tasks.md 側）に従った
- ponytail: `[...xs].sort(f)` は Node 26 の `xs.toSorted(f)` に置換できる（非破壊が言語側の保証になる）。`formatPeriod` は呼び出しごとに `Intl.DateTimeFormat` を 2 個作っている（1 個にできる）。合計 -6 行

ブランチ全体のレビューで挙がった Minor と ponytail。

- **【Change 5 の前に片付ける筆頭】** `src/pages/[lang]/index.astro` で名前の無い `navigation` ランドマークが 1 ページに 3 つになった（ヘッダーの `<nav>` + 本文の連絡先 + 本文の導線）。実測で `document.querySelectorAll('nav').length = 3`、3 つとも `aria-label` が `null` で、うち 2 つはリンク 3 本の中身まで同一。`@axe-core/playwright` を既定設定（全ルール）で回すと `landmark-unique` が `/ja/` `/en/` で必ず落ちる。直し方: 連絡先は `<nav>` をやめて `<p>` / `<ul>` にし、導線側に `aria-label`（文字列は `ui` に足す）を付ける
- `src/pages/[lang]/career.astro`: データが空のとき（`experience: []` / `skills: {}` / `certifications: []` / `achievements: []`）ビルドは通るが、見出しだけの区画 4 つと空の `<ul>` が残る。`job.bullets` が空のときも `<article>` 内に `<ul></ul>` が出る。「0 件なら区画ごと出さない」を検討する価値がある
- `src/pages/[lang]/career.astro` の `Object.entries(career.skills)` は、カテゴリ名が純粋な数字（例 `2024:`）だと JS のキー順規則で先頭へ繰り上がり、spec の「カテゴリの順序はデータに書かれた順（MUST）」に反する。`src/content/schemas.ts` の `z.record(nonEmpty, ...)` は数字だけのキーを弾かない。現行データでは発生しない
- `src/lib/validate.ts` の `validateCareerParity` は `skills` を検証していない。この change で `skills` が初めて画面に出たので、ja に 3 カテゴリ・en に 2 カテゴリという食い違いがビルドを通って公開される。`content-schema` spec が 3 配列しか要求していないので仕様違反ではない
- `src/lib/career.ts` の `localeCompare` は固定形式の ISO 文字列には不要（辞書順 = 時系列順）。単純比較のほうが環境非依存で速い
- ponytail（-15 行）: `ui` の `careerSections` の型は `achievementKind` と同じ `Record<...>` に畳める。`tests/unit/career.test.ts` の「1 月を前年 12 月に丸めない」「月初を前月に丸めない」の 2 件は TZ ブロックに包含される。`career.astro` の `t` と `kinds` は `const t = ui[lang]` 1 本にできる。`.org` クラス + `font-weight: 600` は `<b>` に置き換えれば scoped CSS が 3 行消える

## 申し送り（後続への注意）

- **Change 5 の `base` 対応の確認対象に `src/pages/[lang]/index.astro` を加える**。`languageSwitch(Astro.url.pathname, lang)` は `base` を入れると `pathname` が `/portfolio/ja/` になり `alternatePath` が `/en/portfolio/ja/` を返す。CLAUDE.md が警告している `localeFromPath` と同じ落とし穴の 4 つ目の呼び出し元（`Header.astro` / `BaseLayout.astro` / `alternateLinks` に続く）
