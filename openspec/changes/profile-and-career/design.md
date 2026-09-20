# Design

## Context

動機は proposal.md の Why を参照。現状の制約:

- `src/lib/content.ts` の `getCareer(lang)` が日英両方を読み、`validateCareerParity` で件数一致を検証してから片方を返す。この呼び出しが 1 つも無くなると検証がビルドから外れる
- `.astro` は Vitest で描画できない（Change 3 の設計 D4）。テストできるロジックはすべて `src/lib/` の純関数に出す
- 画面に出す文字列は `src/lib/site.ts` の `ui` に集約する既存の規則がある。ナビの `Photos` / `Career` だけが例外で `navLinks` に直書きされている
- `tsconfig.json` の `noUnusedLocals: true` と `verbatimModuleSyntax` が効く（型だけの import は `import type`）
- 日付の整形は依存を足さず `Intl.DateTimeFormat` を使う（PO 決定 2026-09-21: 依存の追加は Change 5 の 2 つだけ）

## Goals / Non-Goals

**Goals:**

- 経歴の並び順・期間・日付・種別ラベルの整形を単体テストで固定できる形に置く
- トップと経歴ページが同じ `ui` と同じリンク生成関数を使い、パスの直書きを増やさない（Change 5 の `base` 対応で 1 箇所を直せば済むようにする）

**Non-Goals:**

- `.astro` の描画そのものを単体テストで守ること（Change 5 の e2e が担う）
- ページ側の `lang` 取得（`getStaticPaths` + `toLocale`）の共通化（layout-followups の提案。この change の spec に要求が無い）

## Decisions

### D1: 整形と並び替えは `src/lib/career.ts` の純関数に置く

`career.astro` はデータを受け取って並べるだけにし、次を `career.ts` に置く:

- `sortExperience(experience)` — `from` の降順
- `sortByDateDesc(items)` — `date` の降順（資格と実績で共用）
- `formatPeriod(from, to, lang)` — `2020年4月 – 現在` / `Apr 2020 – Present`
- `formatDate(date, lang)` — `2023年6月1日` / `June 1, 2023`

代案「`.astro` の中で `sort` と `toLocaleDateString` を直に呼ぶ」は、並び順と書式が回帰しても何も落ちないため採らない（Change 3 で同じ理由から `photo-meta.ts` を切り出した）。

`Intl.DateTimeFormat` に渡すロケールは `'ja'` / `'en'` をそのまま使う（Change 3 で両方が期待どおり効くことを実測済み）。`YYYY-MM` と `YYYY-MM-DD` の文字列は `new Date()` に渡すと UTC 基準で解釈されるため、**年・月・日を数値に分解して `new Date(年, 月-1, 日)`（ローカル時刻）を作る**。UTC 固定のテストは CI で番人にならないという Change 3 の実測を踏まえ、タイムゾーンに依存しない経路にする。

### D2: 種別ラベルと区画の見出しは `ui` に置く

`ui` に `career: { experience, skills, certifications, achievements }`（区画の見出し）と `achievementKind: { talk, article, award, other }` を足す。`ui` は `Record<Locale, UiStrings>` なので、型を足せば日英の書き漏れが `pnpm typecheck` で落ちる。

代案「`career.ts` に対応表を持つ」は、文字列の置き場が 2 箇所に割れるため採らない。

### D3: トップの導線は `site.ts` のリンク生成関数から作る

トップ本文の 3 リンクは `navLinks(lang)`（Photos / Career）と `languageSwitch(path, lang)`（他言語版）を再利用する。`.astro` に `/${lang}/photos/` を直書きしない。理由: Change 5 で `base` を入れるとき、直書きが残っていると静かに 404 になる（layout-followups の申し送り）。

他言語版トップのリンク文字は `ui[target].languageName`（`English` / `日本語`）をそのまま使う。ヘッダーの言語切り替えと同じ文字列になるが、本文は導線、ヘッダーは補助という役割の違いなので重複を許す。

### D4: `index.astro` のダミー `await getCareer(lang)` を消す

`/career/` が `getStaticPaths` で両ロケールをビルドし、そのページが `getCareer(lang)` を呼ぶので、`validateCareerParity` はビルドで必ず走る。ダミー呼び出しは役目を終える。

代案「残す」は、実行されない意図の説明コメントが残り続け、読み手を迷わせる。消す側の代償は「将来 `/career/` を消すと件数一致の検証もビルドから外れる」ことだが、そのときは `career` のデータ自体が表示されなくなっているので、検証を失っても実害が無い。

### D5: 経歴ページのマークアップ

- 区画は `<section>` + `<h2>`（区画の見出し）。ページの `h1` は `Career`
- 職歴は `<article>` を並べ、期間・組織・役割を 1 行ずつ、要点を `<ul>`
- スキルは カテゴリ名 + 値の 1 行を `<p>` で並べる（`<dl>` を使うと Change 5 の axe で `<dt>`/`<dd>` の構造要件が増えるだけで、見た目は同じ）
- 資格・実績は `<ul>` の各項目に「日付 · 名前」、実績はさらに「· 種別」。`url` があれば名前を `<a>` にする

## Risks / Trade-offs

- **`Intl` の出力が Node のバージョンで変わる** → 期待値をテストで固定する。CI と手元はどちらも `.node-version` の 26.8.2 に揃っている。`en` の `Apr` / `Present`、`ja` の `2020年4月` / `現在` は実装前に実物（`node -e`）で確認してから期待値を書く
- **`h1` が `Career` の英字のまま日本語ページに出る** → 裁定（計画書 §7.2）。ナビの `Photos` / `Career` が両言語とも英字という PO 決定に揃えた。本文の見出しはロケール別なので、ページ内で英字と日本語が混ざる
- **サンプルデータのまま公開する** → PO 決定 2026-09-21。`hello@example.com` と「サンプル株式会社」が公開される。実データ投入は後続の change
- **区画が 4 つとも空のデータでも成立するか** → 現行データはすべて 1 件以上あるため未検証。空配列でも例外にならない書き方（`map` のみ、`[0]` を触らない）にする

## Migration Plan

不要（新規ページの追加と既存ページへの追記のみ。URL の削除・変更は無い）。

## Open Questions

なし（計画書 §7.2 の裁定表で全論点を決めた）。
