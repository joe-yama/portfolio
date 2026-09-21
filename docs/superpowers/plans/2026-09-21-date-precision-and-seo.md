# date-precision-and-seo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 資格・実績の日付を分かっている粒度のまま表示できるようにし、サイトマップ・正規 URL・説明文を出力する。

**Architecture:** 日付は `src/content/schemas.ts` の正規表現を広げ、並び替え（`sortByDateDesc`）と表示（`formatDate`）を `src/lib/career.ts` の純関数で粒度に対応させる。サイトマップは `src/lib/sitemap.ts` の純関数が URL を組み立て、`src/pages/sitemap.xml.ts` が XML にして返す（`src/pages/favicon.svg.ts` と同型）。`canonical` と `description` は `src/layouts/BaseLayout.astro` の 1 か所に足す。

**Tech Stack:** Astro 7 / TypeScript / zod（`astro/zod`）/ Vitest 5 / Playwright / Biome 2 / pnpm

**Spec:** `openspec/changes/date-precision-and-seo/`（`proposal.md`、`design.md`、`specs/{content-schema,profile-and-career,layout-shell,sitemap}/spec.md`、`tasks.md`）

## Global Constraints

- TDD を守る。先に失敗するテストを書き、失敗を確認してから実装する。テストの削除・skip・期待値の書き換えでテストを通さない（`.claude/rules/testing.md`）
- テストが通っていない状態でコミットしない。`tasks.md` のチェックはそのタスクの実装と同じコミットに入れる（`.claude/rules/git.md`）
- コミットメッセージは日本語、先頭に種別（`feat:` / `fix:` / `test:` / `docs:` / `chore:` / `refactor:`）を付ける。末尾に `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>` を入れる
- 新しい依存を追加しない（`@astrojs/sitemap` は使わない。PO 決定 2026-09-21）
- spec に書かれていない機能を足さない。気づいた改善は `openspec/changes/date-precision-and-seo/tasks.md` 末尾の「提案（後続へ）」に書く（`.claude/rules/scope.md`）
- コメントは日本語。既存のコードのコメント密度と語り口に合わせる
- `git push --force` / `--force-with-lease`、`git reset --hard`、`git checkout -- .`、`rm -rf` は使わない（hook でブロックされる）
- 公開 URL の起点は `https://joe-yama.github.io`、パス接頭辞は `/portfolio`
- 検証コマンド: `pnpm test` / `pnpm lint` / `pnpm typecheck` / `pnpm build` / `pnpm e2e`

## File Structure

| ファイル | 役割 | 触るタスク |
|---|---|---|
| `src/content/schemas.ts` | 資格・実績の `date` が受け付ける形式 | 1 |
| `tests/unit/schemas.test.ts` | 上の受理・拒否 | 1 |
| `src/lib/career.ts` | 並び替えの比較キーと日付の表示 | 2, 3 |
| `tests/unit/career.test.ts` | 上の 2 つ | 2, 3 |
| `src/content/career/{ja,en}.yaml` | 実データの日付 | 4 |
| `src/lib/site.ts` | `careerPath`（新規）と `canonicalUrl`（新規） | 5, 7 |
| `tests/unit/site.test.ts` | 上の 2 つ | 5, 7 |
| `src/layouts/BaseLayout.astro` | `<link rel="canonical">` と `<meta name="description">` | 6 |
| `src/lib/sitemap.ts` | サイトマップの URL 組み立てと XML 化（新規） | 7 |
| `tests/unit/sitemap.test.ts` | 上（新規） | 7 |
| `src/pages/sitemap.xml.ts` | エンドポイント（新規） | 8 |
| `tests/e2e/sitemap.spec.ts` | 網羅性と 200（新規） | 9 |
| `CLAUDE.md` | 申し送り | 10 |

## レビューの単位（`.claude/rules/review.md`）

| 単位 | 対象タスク | 理由 |
|---|---|---|
| A | 1 〜 4 | スキーマ（共有インターフェース）と、それに依存する並び替え・表示・実データ |
| B | 5, 6 | `<head>` の出力という spec の要求 |
| C | 7 〜 9 | 新しい capability `sitemap` |
| 最終 | ブランチ全体 | 必須 |

タスク 10（ドキュメント）と 11（検証）は単独ではレビューせず、最終レビューに含める。

---

### Task 1: 資格・実績の日付に年月を許す

**Files:**
- Modify: `src/content/schemas.ts`
- Test: `tests/unit/schemas.test.ts`

**Interfaces:**
- Consumes: なし
- Produces: `datedItemSchema` の `date` が `YYYY-MM` と `YYYY-MM-DD` の両方を受ける。検証に落ちたときのメッセージは `YYYY-MM または YYYY-MM-DD 形式で書く`

- [ ] **Step 1: 失敗するテストを書く**

`tests/unit/schemas.test.ts` の末尾に足す。ファイル先頭の既存の `validCareer` を使う。

```ts
describe('資格と実績の日付の粒度', () => {
  const certWith = (date: string) =>
    careerSchema.safeParse({ ...validCareer, certifications: [{ date, name: '応用情報技術者' }] });

  it('年月まで（YYYY-MM）を受け付ける', () => {
    expect(certWith('2025-10').success).toBe(true);
  });

  it('年月日まで（YYYY-MM-DD）を受け付ける', () => {
    expect(certWith('2017-08-31').success).toBe(true);
  });

  it.each(['2025', '2025-10-1', '2025-1-01', '2025-13', '2025-00', '2025-10-32', '2025/10', ''])(
    '%s は受け付けない',
    (date) => {
      expect(certWith(date).success).toBe(false);
    },
  );

  it('落ちたときのメッセージは 2 つの形式を両方示す', () => {
    const result = certWith('2025-10-1');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('YYYY-MM または YYYY-MM-DD 形式で書く');
    }
  });

  it('実績の日付も同じ形式を受け付ける', () => {
    const achievement = { date: '2016-03', name: '登壇', kind: 'talk' as const };
    expect(careerSchema.safeParse({ ...validCareer, achievements: [achievement] }).success).toBe(
      true,
    );
  });

  it('同じ配列の中で 2 つの形式が混ざってよい', () => {
    const achievements = [
      { date: '2026-05', name: 'A', kind: 'award' as const },
      { date: '2017-08-31', name: 'B', kind: 'other' as const },
    ];
    expect(careerSchema.safeParse({ ...validCareer, achievements }).success).toBe(true);
  });
});
```

- [ ] **Step 2: 失敗を確認する**

Run: `pnpm exec vitest run tests/unit/schemas.test.ts`
Expected: FAIL（`2025-10` が受け付けられず `success` が `false` になる、ほか）

- [ ] **Step 3: スキーマを直す**

`src/content/schemas.ts` の `isoDate` の定義の**下**に足す。`isoDate` は写真の `takenAt` が使っているので残す。

```ts
/** YYYY-MM または YYYY-MM-DD。資格・実績は分かっている粒度で書く（design D1） */
const datePrecision = z
  .string()
  .regex(
    /^\d{4}-(0[1-9]|1[0-2])(-(0[1-9]|[12]\d|3[01]))?$/,
    'YYYY-MM または YYYY-MM-DD 形式で書く',
  );
```

`datedItemSchema` の `date` を差し替える。

```ts
/** 日付付きの項目（資格・実績の共通部分） */
const datedItemSchema = z.object({ date: datePrecision, name: nonEmpty, url: z.url().optional() });
```

- [ ] **Step 4: テストが通ることを確認する**

Run: `pnpm exec vitest run tests/unit/schemas.test.ts`
Expected: PASS

- [ ] **Step 5: 全体が緑であることを確認する**

Run: `pnpm test`
Expected: PASS（既存の 131 件を含めてすべて）

- [ ] **Step 6: コミット**

`openspec/changes/date-precision-and-seo/tasks.md` の 1.1 を `- [x]` にしてから。

```bash
git add src/content/schemas.ts tests/unit/schemas.test.ts openspec/changes/date-precision-and-seo/tasks.md
git commit -m "$(cat <<'EOF'
feat: 資格・実績の日付に YYYY-MM を許す

分かっているのが取得年月までの資格が 14 件あり、日を -01 に丸めて
書いていた。union ではなく 1 本の正規表現にして、落ちたときに
形式を 1 行で示す（design D1）。

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: 年月をその月の 1 日として並べる

**Files:**
- Modify: `src/lib/career.ts`
- Test: `tests/unit/career.test.ts`

**Interfaces:**
- Consumes: Task 1 の `date`（`YYYY-MM` または `YYYY-MM-DD`）
- Produces: `sortByDateDesc` の挙動。シグネチャは変えない（`<T extends { date: string }>(items: T[]) => T[]`）

**背景:** 素の文字列比較では `'2016-03' < '2016-03-01'` なので、年月までの項目が同じ月の年月日項目より**古い**扱いになる。比較時だけ `-01` を補えば同着になり、`Array.prototype.sort` が安定なので記述順が保たれる（design D2）。

- [ ] **Step 1: 失敗するテストを書く**

`tests/unit/career.test.ts` の `describe('sortByDateDesc', ...)` の中に足す。**2 つの記述順を両方試すこと**。片方だけでは、比較キーの正規化を消しても通ってしまう。

```ts
  it('年月までの日付をその月の 1 日として並べる', () => {
    const items = [{ date: '2025-09-30' }, { date: '2025-10' }, { date: '2025-11-01' }];
    expect(sortByDateDesc(items).map((i) => i.date)).toEqual([
      '2025-11-01',
      '2025-10',
      '2025-09-30',
    ]);
  });

  it('同じ位置になる項目は記述順を保つ（年月が先）', () => {
    const items = [
      { date: '2016-03', name: 'A' },
      { date: '2016-03-01', name: 'B' },
    ];
    expect(sortByDateDesc(items).map((i) => i.name)).toEqual(['A', 'B']);
  });

  it('同じ位置になる項目は記述順を保つ（年月日が先）', () => {
    const items = [
      { date: '2016-03-01', name: 'B' },
      { date: '2016-03', name: 'A' },
    ];
    expect(sortByDateDesc(items).map((i) => i.name)).toEqual(['B', 'A']);
  });
```

- [ ] **Step 2: 失敗を確認する**

Run: `pnpm exec vitest run tests/unit/career.test.ts`
Expected: FAIL（「年月が先」のケースが `['B', 'A']` になる）

- [ ] **Step 3: 比較キーを正規化する**

`src/lib/career.ts` の `sortByDateDesc` を差し替える。

```ts
/** 並べ替えの比較キー。年月までの日付はその月の 1 日として扱う（design D2） */
function dateSortKey(date: string): string {
  return date.length === 7 ? `${date}-01` : date;
}

/** 日付を持つ項目を date の新しい順に並べた新しい配列を返す（資格と実績で共用） */
export function sortByDateDesc<T extends { date: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => dateSortKey(b.date).localeCompare(dateSortKey(a.date)));
}
```

- [ ] **Step 4: テストが通ることを確認する**

Run: `pnpm exec vitest run tests/unit/career.test.ts`
Expected: PASS

- [ ] **Step 5: コミット**

`tasks.md` の 1.2 を `- [x]` にしてから。

```bash
git add src/lib/career.ts tests/unit/career.test.ts openspec/changes/date-precision-and-seo/tasks.md
git commit -m "$(cat <<'EOF'
fix: 年月までの日付をその月の 1 日として並べる

素の文字列比較では 2016-03 が 2016-03-01 より古い扱いになる。
比較時だけ -01 を補って同着にし、安定ソートで記述順を保つ。

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: 日付を書かれた粒度のまま表示する

**Files:**
- Modify: `src/lib/career.ts`
- Test: `tests/unit/career.test.ts`

**Interfaces:**
- Consumes: Task 1 の `date`
- Produces: `formatDate(date: string, lang: Locale) => string`。シグネチャは変えない

- [ ] **Step 1: 失敗するテストを書く**

`tests/unit/career.test.ts` の `describe('formatDate', ...)` の中に足す。

```ts
  it('年月までの日付は ja で 年月（日を補わない）', () => {
    expect(formatDate('2025-10', 'ja')).toBe('2025年10月');
  });

  it('年月までの日付は en で 月 年', () => {
    expect(formatDate('2025-10', 'en')).toBe('October 2025');
  });

  it('年月日までの日付はこれまでどおり日まで出す', () => {
    expect(formatDate('2017-08-31', 'ja')).toBe('2017年8月31日');
    expect(formatDate('2017-08-31', 'en')).toBe('August 31, 2017');
  });
```

さらに、末尾の `describe('負のオフセットの環境でのタイムゾーン退行の検出', ...)` の中の `try` ブロックに 1 行足す。年月だけの日付でも 1 月が前年 12 月にならないことを押さえる。

```ts
      expect(formatDate('2025-01', 'en')).toBe('January 2025');
```

- [ ] **Step 2: 失敗を確認する**

Run: `pnpm exec vitest run tests/unit/career.test.ts`
Expected: FAIL（`formatDate('2025-10', 'ja')` が `2025年10月1日` になる）

- [ ] **Step 3: 粒度で分岐させる**

`src/lib/career.ts` の `formatDate` を差し替える。

```ts
/**
 * 資格・実績の日付。書かれた粒度のまま出す（design D3）。
 * ja: `2023年6月1日` / `2025年10月`、en: `June 1, 2023` / `October 2025`
 */
export function formatDate(date: string, lang: Locale): string {
  const hasDay = date.split('-').length === 3;
  return new Intl.DateTimeFormat(lang, {
    year: 'numeric',
    month: 'long',
    ...(hasDay ? { day: 'numeric' } : {}),
  }).format(toLocalDate(date));
}
```

- [ ] **Step 4: テストが通ることを確認する**

Run: `pnpm exec vitest run tests/unit/career.test.ts`
Expected: PASS

- [ ] **Step 5: コミット**

`tasks.md` の 1.3 を `- [x]` にしてから。

```bash
git add src/lib/career.ts tests/unit/career.test.ts openspec/changes/date-precision-and-seo/tasks.md
git commit -m "$(cat <<'EOF'
feat: 資格・実績の日付を書かれた粒度のまま表示する

年月までの日付に日を補わない。

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: 実データの日付を実際の粒度に直す

**Files:**
- Modify: `src/content/career/ja.yaml`
- Modify: `src/content/career/en.yaml`

**Interfaces:**
- Consumes: Task 1 のスキーマ
- Produces: なし（データのみ）

**やること:** `certifications` と `achievements` の `date` のうち、末尾が `-01` のものから `-01` を取る。特許出願の `2017-08-31` は変えない（PO が 8/31 と明言。design D8）。`experience` の `from` / `to` は元から `YYYY-MM` なので触らない。写真の `takenAt` は別のスキーマなので触らない。

対象は日英それぞれ `certifications` 14 件 + `achievements` 5 件 = 19 件、2 ファイルで 38 件。

- [ ] **Step 1: 現状の件数を数える**

```bash
grep -c 'date: "' src/content/career/ja.yaml src/content/career/en.yaml
grep 'date: "' src/content/career/ja.yaml | grep -c -- '-01"'
```
Expected: 各ファイル 20 件、うち `-01` で終わるのが 19 件

- [ ] **Step 2: 書き換える**

```bash
sed -i '' -E 's/^(  - date: "[0-9]{4}-[0-9]{2})-01"$/\1"/' src/content/career/ja.yaml
sed -i '' -E 's/^(  - date: "[0-9]{4}-[0-9]{2})-01"$/\1"/' src/content/career/en.yaml
```

- [ ] **Step 3: 結果を確認する**

```bash
grep 'date: "' src/content/career/ja.yaml | grep -c -- '-01"'
grep 'date: "' src/content/career/en.yaml | grep -c -- '-01"'
grep -c '2017-08-31' src/content/career/ja.yaml src/content/career/en.yaml
grep -c 'date: "' src/content/career/ja.yaml src/content/career/en.yaml
```
Expected: `-01` で終わるものは両ファイル 0 件、`2017-08-31` は各 1 件、`date:` の総数は各 20 件のまま

さらに `git diff --stat` で、変わった行が 2 ファイル合計 38 行であることを確認する。

- [ ] **Step 4: ビルドが通ることを確認する**

Run: `pnpm build`
Expected: 12 page(s) built（スキーマの検証と日英の件数一致を通る）

- [ ] **Step 5: 画面に日が出ていないことを確認する**

```bash
grep -o '2025年10月[0-9]*日' dist/ja/career/index.html | sort | uniq -c
grep -o '2025年10月' dist/ja/career/index.html | wc -l
grep -o '2017年8月31日' dist/ja/career/index.html | wc -l
grep -o 'August 31, 2017' dist/en/career/index.html | wc -l
```
Expected: 1 つ目は 0 件（`2025年10月◯日` が無い）、2 つ目は 9 件、3 つ目と 4 つ目は各 1 件

- [ ] **Step 6: コミット**

`tasks.md` の 1.4 を `- [x]` にしてから。

```bash
git add src/content/career/ja.yaml src/content/career/en.yaml openspec/changes/date-precision-and-seo/tasks.md
git commit -m "$(cat <<'EOF'
fix: 資格・実績の日付を分かっている粒度に直す

資格 14 件と実績 5 件の丸めた -01 を外す。日まで確かな
特許出願（2017-08-31）だけ残す（design D8）。

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: そのページ自身の絶対 URL を返す関数

**Files:**
- Modify: `src/lib/site.ts`
- Test: `tests/unit/site.test.ts`

**Interfaces:**
- Consumes: `alternatePath(path, target, base)`（`src/lib/i18n.ts`。既存）
- Produces:
  - `canonicalUrl(path: string, lang: Locale, site: string | URL, base: string): string`
  - `careerPath(lang: Locale, base: string): string` — Task 7 が使う

**背景:** `navLinks` が経歴のパスを `withBase(\`/${lang}/career/\`, base)` と直書きしている。Task 7 のサイトマップも同じものを要るので、`photoPath` / `homePath` と同じ形の `careerPath` に切り出して両方から使う。

- [ ] **Step 1: 失敗するテストを書く**

`tests/unit/site.test.ts` の import に `canonicalUrl` と `careerPath` を足し、末尾に足す。

```ts
describe('careerPath', () => {
  it('ロケールごとの経歴のパスを返す', () => {
    expect(careerPath('ja', '/')).toBe('/ja/career/');
    expect(careerPath('en', '/portfolio')).toBe('/portfolio/en/career/');
  });
});

describe('canonicalUrl', () => {
  it('base 付きでそのページ自身の絶対 URL を返す', () => {
    expect(canonicalUrl('/portfolio/en/career/', 'en', 'https://example.com', '/portfolio')).toBe(
      'https://example.com/portfolio/en/career/',
    );
  });

  it('base が無いときはそのまま', () => {
    expect(canonicalUrl('/ja/', 'ja', 'https://example.com', '/')).toBe('https://example.com/ja/');
  });

  it('末尾スラッシュを補う', () => {
    expect(canonicalUrl('/ja/career', 'ja', 'https://example.com', '/')).toBe(
      'https://example.com/ja/career/',
    );
  });

  it('URL オブジェクトの site も受ける', () => {
    expect(canonicalUrl('/en/photos/', 'en', new URL('https://example.com'), '/')).toBe(
      'https://example.com/en/photos/',
    );
  });
});
```

- [ ] **Step 2: 失敗を確認する**

Run: `pnpm exec vitest run tests/unit/site.test.ts`
Expected: FAIL（`canonicalUrl` と `careerPath` が存在しない）

- [ ] **Step 3: 実装する**

`src/lib/site.ts` の `photoPath` の下に足す。

```ts
/** ロケールごとの経歴ページ */
export function careerPath(lang: Locale, base: string): string {
  return withBase(`/${lang}/career/`, base);
}

/**
 * そのページ自身の絶対 URL（design D6）。自分のロケールを alternatePath に渡すと、
 * 末尾スラッシュと接頭辞が正規化された同じページのパスが返る
 */
export function canonicalUrl(
  path: string,
  lang: Locale,
  site: string | URL,
  base: string,
): string {
  return new URL(alternatePath(path, lang, base), site).href;
}
```

`navLinks` の経歴の行を `careerPath` に置き換える。

```ts
export function navLinks(lang: Locale, base: string): NavLink[] {
  return [
    { label: 'Photos', href: photoPath(null, lang, base) },
    { label: 'Career', href: careerPath(lang, base) },
  ];
}
```

- [ ] **Step 4: テストが通ることを確認する**

Run: `pnpm test`
Expected: PASS（`navLinks` の既存テストも通ること）

- [ ] **Step 5: コミット**

`tasks.md` の 2.1 を `- [x]` にしてから。

```bash
git add src/lib/site.ts tests/unit/site.test.ts openspec/changes/date-precision-and-seo/tasks.md
git commit -m "$(cat <<'EOF'
feat: canonical の絶対 URL と経歴のパスを site.ts に足す

careerPath は navLinks の直書きを引き取り、Task 7 のサイトマップと
共有する。

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: canonical と description を出す

**Files:**
- Modify: `src/layouts/BaseLayout.astro`

**Interfaces:**
- Consumes: Task 5 の `canonicalUrl`、既存の `getProfile(lang).tagline`
- Produces: ロケール配下のすべてのページの `<head>` に `<link rel="canonical">` と `<meta name="description">` が 1 本ずつ

**背景:** `hreflang` と同じく `pathLocale` が非 null のときだけ出す。404 には出さない（design D6）。

- [ ] **Step 1: import と変数を足す**

`src/layouts/BaseLayout.astro` のフロントマターを直す。import 行を差し替える。

```ts
import { alternateLinks, assetPath, canonicalUrl } from '../lib/site';
```

`alternates` の行の下に足す。

```ts
// canonical と description は hreflang と同じ条件で出す（404 には出さない。design D6）
const canonical = pathLocale ? canonicalUrl(path, pathLocale, Astro.site, base) : null;
const description = pathLocale ? profile.tagline : null;
```

- [ ] **Step 2: `<head>` に出力を足す**

`<title>` の下、`<link rel="icon">` の上に足す。

```astro
    {canonical && <link rel="canonical" href={canonical} />}
    {description && <meta name="description" content={description} />}
```

- [ ] **Step 3: ビルドして出力を確認する**

```bash
pnpm build
grep -c 'rel="canonical"' dist/ja/career/index.html dist/en/photos/index.html dist/404.html
grep -o '<link rel="canonical" href="[^"]*"' dist/en/career/index.html
grep -o '<meta name="description" content="[^"]*"' dist/ja/index.html
grep -c 'name="description"' dist/404.html
```
Expected:
- `canonical` は `dist/ja/career/index.html` と `dist/en/photos/index.html` に各 1 件、`dist/404.html` に 0 件
- `dist/en/career/index.html` の `canonical` は `https://joe-yama.github.io/portfolio/en/career/`
- `dist/ja/index.html` の `description` は `profile/ja.yaml` の `tagline` と一致する
- `dist/404.html` の `description` は 0 件

- [ ] **Step 4: 既存のテストが壊れていないことを確認する**

Run: `pnpm test && pnpm typecheck`
Expected: PASS

- [ ] **Step 5: コミット**

`tasks.md` の 2.2 を `- [x]` にしてから。

```bash
git add src/layouts/BaseLayout.astro openspec/changes/date-precision-and-seo/tasks.md
git commit -m "$(cat <<'EOF'
feat: canonical と description を head に出す

ロケール配下のページだけ。404 には出さない（design D6）。
description はプロフィールの tagline。

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: サイトマップの URL を組み立てる純関数

**Files:**
- Create: `src/lib/sitemap.ts`
- Test: `tests/unit/sitemap.test.ts`

**Interfaces:**
- Consumes: `homePath` / `photoPath` / `careerPath` / `alternateLinks`（`src/lib/site.ts`）、`locales`（`src/lib/i18n.ts`）
- Produces:
  - `sitemapEntries(slugs: string[], site: string | URL, base: string): SitemapEntry[]`
  - `sitemapXml(slugs: string[], site: string | URL, base: string): string`
  - `type SitemapEntry = { loc: string; alternates: AlternateLink[] }`

**背景:** ページ構成（トップ・経歴・写真一覧・写真個別）をここで持つ。並び順はロケールごとにこの 4 種類（design D4）。

- [ ] **Step 1: 失敗するテストを書く**

`tests/unit/sitemap.test.ts` を作る。

```ts
import { describe, expect, it } from 'vitest';
import { sitemapEntries, sitemapXml } from '../../src/lib/sitemap';

const site = 'https://joe-yama.github.io';
const base = '/portfolio';
const slugs = ['kariya-ferris-wheel', 'sunset-dinghies'];
const prefix = 'https://joe-yama.github.io/portfolio';

describe('sitemapEntries', () => {
  it('写真 2 枚のとき 10 件の loc を返す', () => {
    expect(sitemapEntries(slugs, site, base).map((e) => e.loc)).toEqual([
      `${prefix}/ja/`,
      `${prefix}/ja/career/`,
      `${prefix}/ja/photos/`,
      `${prefix}/ja/photos/kariya-ferris-wheel/`,
      `${prefix}/ja/photos/sunset-dinghies/`,
      `${prefix}/en/`,
      `${prefix}/en/career/`,
      `${prefix}/en/photos/`,
      `${prefix}/en/photos/kariya-ferris-wheel/`,
      `${prefix}/en/photos/sunset-dinghies/`,
    ]);
  });

  it('写真が 1 枚増えると 12 件になる', () => {
    expect(sitemapEntries([...slugs, 'new-photo'], site, base)).toHaveLength(12);
  });

  it('写真が 0 枚でも 6 件返す', () => {
    expect(sitemapEntries([], site, base)).toHaveLength(6);
  });

  it('振り分けページと 404 は含まない', () => {
    const locs = sitemapEntries(slugs, site, base).map((e) => e.loc);
    expect(locs).not.toContain(`${prefix}/`);
    expect(locs.some((loc) => loc.includes('404'))).toBe(false);
  });

  it('loc に重複が無い', () => {
    const locs = sitemapEntries(slugs, site, base).map((e) => e.loc);
    expect(new Set(locs).size).toBe(locs.length);
  });

  it('英語の経歴ページは代替 3 本を持つ', () => {
    const entry = sitemapEntries(slugs, site, base).find(
      (e) => e.loc === `${prefix}/en/career/`,
    );
    expect(entry?.alternates).toEqual([
      { hreflang: 'ja', href: `${prefix}/ja/career/` },
      { hreflang: 'en', href: `${prefix}/en/career/` },
      { hreflang: 'x-default', href: `${prefix}/ja/career/` },
    ]);
  });

  it('base が無くても組み立てられる', () => {
    expect(sitemapEntries([], 'https://example.com', '/')[0]?.loc).toBe('https://example.com/ja/');
  });
});

describe('sitemapXml', () => {
  const xml = sitemapXml(slugs, site, base);

  it('XML 宣言と urlset で始まる', () => {
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
  });

  it('xhtml 名前空間を宣言する', () => {
    expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
  });

  it('loc を 10 件持つ', () => {
    expect([...xml.matchAll(/<loc>/g)]).toHaveLength(10);
  });

  it('xhtml:link を 30 本持つ', () => {
    expect([...xml.matchAll(/<xhtml:link /g)]).toHaveLength(30);
  });

  it('日本語トップの url を書き出す', () => {
    expect(xml).toContain(`<loc>${prefix}/ja/</loc>`);
    expect(xml).toContain(
      `<xhtml:link rel="alternate" hreflang="x-default" href="${prefix}/ja/"/>`,
    );
  });

  it('URL の & を実体参照にする', () => {
    expect(sitemapXml(['a&b'], site, base)).toContain('photos/a&amp;b/');
  });
});
```

- [ ] **Step 2: 失敗を確認する**

Run: `pnpm exec vitest run tests/unit/sitemap.test.ts`
Expected: FAIL（`src/lib/sitemap.ts` が無い）

- [ ] **Step 3: 実装する**

`src/lib/sitemap.ts` を作る。

```ts
import type { Locale } from './i18n';
import { locales } from './i18n';
import { type AlternateLink, alternateLinks, careerPath, homePath, photoPath } from './site';

export type SitemapEntry = { loc: string; alternates: AlternateLink[] };

/**
 * ロケール配下のページのパス。サイトマップに載せるのはこの 4 種類で、
 * 写真の枚数だけ個別ページが増える（design D4）。振り分けページと 404 は載せない
 */
function localePaths(lang: Locale, slugs: string[], base: string): string[] {
  return [
    homePath(lang, base),
    careerPath(lang, base),
    photoPath(null, lang, base),
    ...slugs.map((slug) => photoPath(slug, lang, base)),
  ];
}

/** サイトマップに載せるページと、その言語代替 */
export function sitemapEntries(
  slugs: string[],
  site: string | URL,
  base: string,
): SitemapEntry[] {
  return locales.flatMap((lang) =>
    localePaths(lang, slugs, base).map((path) => ({
      loc: new URL(path, site).href,
      alternates: alternateLinks(path, site, base),
    })),
  );
}

/** URL は slug 由来なので & が入りうる。素のままだと XML として壊れる */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function sitemapXml(slugs: string[], site: string | URL, base: string): string {
  const urls = sitemapEntries(slugs, site, base).map((entry) => {
    const links = entry.alternates.map(
      (link) =>
        `    <xhtml:link rel="alternate" hreflang="${link.hreflang}" href="${escapeXml(link.href)}"/>`,
    );
    return [`  <url>`, `    <loc>${escapeXml(entry.loc)}</loc>`, ...links, `  </url>`].join('\n');
  });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n');
}
```

- [ ] **Step 4: テストが通ることを確認する**

Run: `pnpm test && pnpm typecheck`
Expected: PASS

- [ ] **Step 5: コミット**

`tasks.md` の 3.1 を `- [x]` にしてから。

```bash
git add src/lib/sitemap.ts tests/unit/sitemap.test.ts openspec/changes/date-precision-and-seo/tasks.md
git commit -m "$(cat <<'EOF'
feat: サイトマップの URL を組み立てる純関数を足す

ページ構成はここだけが知る。URL の組み立ては site.ts の既存の
ヘルパを使い回す（design D4）。

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: サイトマップのエンドポイント

**Files:**
- Create: `src/pages/sitemap.xml.ts`

**Interfaces:**
- Consumes: Task 7 の `sitemapXml`、`getPhotos()`（`src/lib/content.ts`。`PhotoEntry` は `id` を持つ）
- Produces: `dist/sitemap.xml`

- [ ] **Step 1: エンドポイントを書く**

`src/pages/sitemap.xml.ts` を作る。`src/pages/favicon.svg.ts` と同じ形。

```ts
import type { APIRoute } from 'astro';
import { getPhotos } from '../lib/content';
import { sitemapXml } from '../lib/sitemap';

/** 検索エンジンに渡すサイトマップ。静的ビルドで dist/sitemap.xml に出る */
export const GET: APIRoute = async ({ site }) => {
  if (!site) throw new Error('astro.config の site が必要（サイトマップの絶対 URL に使う）');
  const slugs = (await getPhotos()).map((photo) => photo.id);
  return new Response(sitemapXml(slugs, site, import.meta.env.BASE_URL), {
    headers: { 'Content-Type': 'application/xml' },
  });
};
```

- [ ] **Step 2: ビルドして出力を確認する**

```bash
pnpm build
ls -l dist/sitemap.xml
head -3 dist/sitemap.xml
grep -c '<loc>' dist/sitemap.xml
grep -c '<xhtml:link ' dist/sitemap.xml
grep -o '<loc>[^<]*</loc>' dist/sitemap.xml
```
Expected: ファイルが存在し、2 行目が `<urlset ...>`、`<loc>` が 10 件、`<xhtml:link>` が 30 件、すべての `loc` が `https://joe-yama.github.io/portfolio/` で始まる

- [ ] **Step 3: 型と lint を確認する**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS

- [ ] **Step 4: コミット**

`tasks.md` の 3.2 を `- [x]` にしてから。

```bash
git add src/pages/sitemap.xml.ts openspec/changes/date-precision-and-seo/tasks.md
git commit -m "$(cat <<'EOF'
feat: sitemap.xml のエンドポイントを足す

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: サイトマップの網羅性を e2e で守る

**Files:**
- Create: `tests/e2e/sitemap.spec.ts`

**Interfaces:**
- Consumes: ビルド済みの `dist/`（`tests/e2e/global-setup.ts` が `pnpm build` してから preview を起動する）
- Produces: なし

**背景:** Task 7 の関数はページ構成を知っているので、ページを足したとき載せ忘れる。単体テストは同じ思い込みを共有するので番人にならない。ビルド出力を直接数えて突き合わせる（design D5）。

- [ ] **Step 1: テストを書く**

`tests/e2e/sitemap.spec.ts` を作る。

```ts
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

const PUBLIC_PREFIX = 'https://joe-yama.github.io/portfolio/';

/** dist の下から index.html を探し、末尾スラッシュ付きの相対パスにして返す */
function builtPages(dir: string, prefix: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) return builtPages(join(dir, entry.name), `${prefix}${entry.name}/`);
    return entry.name === 'index.html' ? [prefix] : [];
  });
}

/** ビルド出力のうちロケール接頭辞を持つページ。サイトマップに載るべき集合 */
function expectedLocs(): string[] {
  return ['ja', 'en']
    .flatMap((lang) => builtPages(join('dist', lang), `${lang}/`))
    .map((path) => `${PUBLIC_PREFIX}${path}`);
}

test('サイトマップは XML として配信される', async ({ request }) => {
  const response = await request.get('./sitemap.xml');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('xml');
  expect(await response.text()).toContain(
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
  );
});

test('loc の集合がビルド出力のロケール配下ページと一致する', async ({ request }) => {
  const xml = await (await request.get('./sitemap.xml')).text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const expected = expectedLocs();

  expect(expected.length).toBeGreaterThan(0);
  expect(locs).toHaveLength(expected.length);
  expect(new Set(locs)).toEqual(new Set(expected));
});

test('振り分けページと 404 は載っていない', async ({ request }) => {
  const xml = await (await request.get('./sitemap.xml')).text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  expect(locs).not.toContain(PUBLIC_PREFIX);
  expect(locs.some((loc) => loc.includes('404'))).toBe(false);
});

test('すべての loc が 200 を返す', async ({ request }) => {
  const xml = await (await request.get('./sitemap.xml')).text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

  for (const loc of locs) {
    expect(loc.startsWith(PUBLIC_PREFIX)).toBe(true);
    const response = await request.get(`./${loc.slice(PUBLIC_PREFIX.length)}`);
    expect(response.status(), `${loc} が 200 を返さない`).toBe(200);
  }
});
```

- [ ] **Step 2: 番人になっていることを確かめる**

`src/lib/sitemap.ts` の `localePaths` から `careerPath(lang, base),` の行を一時的に消して `pnpm e2e` を走らせ、「loc の集合が一致する」が落ちることを確認する。確認したら**必ず元に戻す**。

```bash
pnpm e2e 2>&1 | tail -20
```
Expected（消した状態）: FAIL。戻したあと: 全件 PASS

- [ ] **Step 3: e2e が緑であることを確認する**

Run: `pnpm e2e`
Expected: PASS（既存の 27 件 + 新規 4 件 = 31 件）

**落とし穴:** `astro preview` は別のプレビューが動いていると `--port` を無視して別のポートで起動することがある（CLAUDE.md の既知の問題）。1 回目が接続エラーで落ちたら、`pnpm exec astro preview stop` してからやり直す。

- [ ] **Step 4: コミット**

`tasks.md` の 3.3 を `- [x]` にしてから。

```bash
git add tests/e2e/sitemap.spec.ts openspec/changes/date-precision-and-seo/tasks.md
git commit -m "$(cat <<'EOF'
test: サイトマップの網羅性を e2e で守る

ビルド出力のロケール配下ページと loc の集合を突き合わせる。
ページを足して sitemap.ts を直し忘れたら落ちる（design D5）。

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 10: 申し送りを書く

**Files:**
- Modify: `CLAUDE.md`

**Interfaces:**
- Consumes: なし
- Produces: なし

- [ ] **Step 1: 2 か所に追記する**

1 つ目。「実データを触るときの注意」の段落の末尾に足す。

```
資格と実績の `date` は分かっている粒度で書く（`YYYY-MM` か `YYYY-MM-DD`。日を `-01` に丸めない）。年月までの日付は並び順ではその月の 1 日として扱われ、同じ位置になる項目は記述順を保つ。
```

2 つ目。「未着手の change は無い」の段落の中、次にやることの候補の直前に足す。

```
**サイトマップは PO の手作業で登録が要る**（2026-09-21、Change 7）。`/portfolio/sitemap.xml` は出力しているが、GitHub Pages のプロジェクトサイトではクローラが読む `robots.txt` はドメイン直下（`https://joe-yama.github.io/robots.txt`）だけで `/portfolio/robots.txt` は無視されるため、`robots.txt` からは知らせられない。Google Search Console にサイトマップの URL を直接登録するまで、サイトマップは実質的に効かない。
```

さらに、フェーズの段落の Change 一覧に 1 行足す（Issue 番号と PR 番号は実際のものを使う）。

```
- Change 7 `date-precision-and-seo`（Issue #22）= PR #<番号>（2026-09-21。資格・実績の日付に `YYYY-MM` を許し、`sitemap.xml` と `canonical` と `description` を追加。main spec `sitemap` を新規作成し、`content-schema` / `profile-and-career` / `layout-shell` に delta を統合）
```

PR 番号がまだ無いので、この行は PR を作ったあとに入れる。Task 10 では 1 つ目と 2 つ目だけ入れる。

- [ ] **Step 2: 入ったことを確認する**

```bash
git diff --stat CLAUDE.md
grep -c 'Search Console' CLAUDE.md
grep -c '日を `-01` に丸めない' CLAUDE.md
```
Expected: `CLAUDE.md` が 1 ファイル変更、各 1 件

- [ ] **Step 3: コミット**

`tasks.md` の 4.1 を `- [x]` にしてから。

```bash
git add CLAUDE.md openspec/changes/date-precision-and-seo/tasks.md
git commit -m "$(cat <<'EOF'
docs: サイトマップの登録と日付の粒度を CLAUDE.md に書く

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 11: 全部の関門を通す

**Files:**
- なし（実行のみ）

**Interfaces:**
- Consumes: Task 1〜10 のすべて
- Produces: なし

- [ ] **Step 1: 順に実行する**

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm e2e
```
Expected: すべて成功。`pnpm test` は 131 件 + 新規、`pnpm e2e` は 27 件 + 新規 4 件

- [ ] **Step 2: 実データの結果を目で確かめる**

```bash
grep -o '2025年10月[0-9]*日' dist/ja/career/index.html | wc -l
grep -o 'October 2025' dist/en/career/index.html | wc -l
grep -o '<loc>' dist/sitemap.xml | wc -l
grep -c 'rel="canonical"' dist/ja/career/index.html
grep -c 'rel="canonical"' dist/404.html
```
Expected: 0 / 9 / 10 / 1 / 0

- [ ] **Step 3: コミット**

`tasks.md` の 4.2 を `- [x]` にしてから。変更が `tasks.md` だけなら 1 つ前のコミットに含めず、単独でコミットする。

```bash
git add openspec/changes/date-precision-and-seo/tasks.md
git commit -m "$(cat <<'EOF'
docs: date-precision-and-seo の tasks を完了にする

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

## Self-Review

- **spec の網羅**: `content-schema` の日付の粒度 → Task 1。`profile-and-career` の並び順と表示 → Task 2・3、実データ → Task 4。`layout-shell` の `canonical` / `description` → Task 5・6。`sitemap` の 3 要求 → Task 7・8・9
- **プレースホルダ**: 無し。すべてのコードブロックに実際に書く内容が入っている。唯一 Task 10 の PR 番号だけは PR 作成後に決まるので、その旨を明記した
- **型の整合**: `canonicalUrl(path, lang, site, base)` は Task 5 で定義し Task 6 で使う。`careerPath(lang, base)` は Task 5 で定義し Task 7 で使う。`sitemapXml(slugs, site, base)` は Task 7 で定義し Task 8 で使う。`AlternateLink` は `src/lib/site.ts` の既存の型
