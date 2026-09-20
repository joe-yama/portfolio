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

- [ ] 4.1 `pnpm lint && pnpm typecheck && pnpm test && pnpm build` がすべて緑、`openspec validate profile-and-career --strict` が valid、`git status --short` が空であることを確認し、本ファイルの完了項目を `[x]` にしてコミットする
- [ ] 4.2 `reviewer`（Opus）でブランチ全体をレビューし、結果を Issue にコメントする
- [ ] 4.3 push して `Closes #<Issue>` を含む PR を作り、CI 緑と Approved を確認してマージする

## 提案（この change では実装しない。後続の change 用）

（レビューで挙がった Minor をここに転記する）
