# profile-and-career 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** トップ `/{ja,en}/` に連絡先リンクとサイト内の導線を足し、`/{ja,en}/career/` を新設して v1 のページをそろえる。

**Architecture:** 並び替え・期間・日付の整形は `src/lib/career.ts` の純関数に置き Vitest で固定する。画面の文字列は `src/lib/site.ts` の `ui` に集約する。`.astro` はデータを受け取って並べるだけにし、リンクのパスは `site.ts` の関数から作って直書きしない（Change 5 の `base` 対応のため）。

**Tech Stack:** Astro 7（静的出力、`trailingSlash: 'always'`、i18n `prefixDefaultLocale`）、TypeScript（`astro/tsconfigs/strict` + `noUnusedLocals`）、Vitest 5、Biome 2、pnpm 12、Node 26.8.2。日付の整形は `Intl.DateTimeFormat`（依存の追加なし）。

**Spec:** `openspec/changes/profile-and-career/specs/profile-and-career/spec.md`（要求）、`openspec/changes/profile-and-career/design.md`（決定）、`openspec/changes/profile-and-career/tasks.md`（タスクとレビュー単位）。全体の設計書は `docs/superpowers/specs/2026-09-17-portfolio-site-design.md` §4・§5.2。

## Global Constraints

- **パッケージマネージャは pnpm のみ**。`npm` / `npx` は使わない。**依存を 1 つも足さない**（日付は `Intl.DateTimeFormat`）
- **TDD 厳守**: 失敗するテストを先に書き、失敗を見てから実装する。テストなしのコミットは禁止。テストの削除・skip・期待値の書き換えで通すことは禁止（`.claude/rules/testing.md`）
- **1 コミット = 1 タスク**。コミットメッセージは日本語で先頭に種別（`feat:` / `test:` / `docs:` など）。`openspec/changes/profile-and-career/tasks.md` のチェックは、そのタスクの実装と同じコミットに含める。末尾に `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`
- **`tsconfig.json` の `noUnusedLocals: true`**: 使わない import や変数を置くと `pnpm typecheck` が落ちる。「先に import だけ置く」書き方をしない
- **`verbatimModuleSyntax`**（`astro/tsconfigs/strict`）: 型だけの import は `import type { X } from '...'`
- **Biome**: 編集のたびに hook が `pnpm exec biome check --error-on-warnings <file>` を走らせる。シングルクォート、セミコロンあり、行幅 100（`biome.json` に従う。整形は `pnpm format`）
- **`.astro` に `/` 始まりのパスを直書きしない**。リンクは `src/lib/site.ts` の `navLinks` / `languageSwitch` / `alternatePath` から作る（Change 5 で `base: '/portfolio'` を入れるため）
- **スコープ**: `openspec/changes/profile-and-career/tasks.md` にある項目だけ。気づいた改善は tasks.md 末尾の「提案」に書き、実装しない（`.claude/rules/scope.md`）
- **検証コマンド**: `pnpm test` / `pnpm lint` / `pnpm typecheck` / `pnpm build`。報告には実行したコマンドと出力を添える

## 実装前に実物で確認する落とし穴

1. **`Intl` に渡す `Date` は UTC 解釈を避ける**。`new Date('2020-04')` は UTC の 2020-04-01T00:00Z と解釈され、`Asia/Tokyo` では 9 時間ずれても同じ日だが、負のオフセットの環境（CI の UTC ではなく、例えば `America/*`）では**前月**になる。必ず `YYYY-MM` を数値に分解して `new Date(year, month - 1, 1)`（ローカル時刻）を作る。Change 3 で「UTC 固定のテストが CI で番人にならない」欠陥を実際に踏んでいる
2. **`Intl` の出力は実測済み**（Node 26.8.2 / Asia/Tokyo）。ja は `month: 'long'` で `2020年4月`、en は `month: 'short'` で `Apr 2020`。ja で `'short'` を使うと `2020/04` になる。日付は両ロケールとも `{ year: 'numeric', month: 'long', day: 'numeric' }` で `2023年6月1日` / `June 1, 2023`
3. **`vitest.config.ts` の `include` は `tests/unit/**/*.test.ts`** なので、テストは必ず `tests/unit/` に置く
4. **`.astro` は Vitest で描画できない**。ページの検証は `pnpm build` 後の `dist/**/*.html` を `grep` して行う
5. **`Astro.params.lang` は `string | undefined`**。`toLocale()`（`src/lib/i18n.ts`）を通す。`as Locale` の無検査キャストを書かない
6. **`getCareer(lang)` は日英両方を読んで件数一致を検証する**。片方だけ読む書き方に変えない
7. **`trailingSlash: 'always'`**。リンクの末尾スラッシュを落とすとビルドは通るが 404 になる

---

### Task 1: 整形の純関数と表示文字列（tasks.md の 1.1〜1.4）

**Files:**
- Create: `src/lib/career.ts`
- Create: `tests/unit/career.test.ts`
- Modify: `src/lib/site.ts`（`UiStrings` と `ui` に追加）
- Modify: `tests/unit/site.test.ts`（末尾に `describe` を追加）
- Modify: `openspec/changes/profile-and-career/tasks.md`（1.1〜1.4 を `[x]`）

**Interfaces:**
- Consumes: `src/lib/i18n.ts` の `type Locale`（`'ja' | 'en'`）、`src/content/schemas.ts` の `type Career`
- Produces:
  - `sortExperience(experience: Career['experience']): Career['experience']` — `from` の降順の**新しい配列**
  - `sortByDateDesc<T extends { date: string }>(items: T[]): T[]` — `date` の降順の**新しい配列**
  - `formatPeriod(from: string, to: string | null | undefined, lang: Locale): string`
  - `formatDate(date: string, lang: Locale): string`
  - `ui[lang].careerSections: { experience: string; skills: string; certifications: string; achievements: string }`
  - `ui[lang].achievementKind: Record<'talk' | 'article' | 'award' | 'other', string>`

- [ ] **Step 1: 失敗するテストを書く（並び替え）**

`tests/unit/career.test.ts` を新規作成:

```ts
import { describe, expect, it } from 'vitest';
import { formatDate, formatPeriod, sortByDateDesc, sortExperience } from '../../src/lib/career';

const experience = [
  { from: '2017-04', to: '2020-03', organization: '例示システムズ', role: 'プログラマ', bullets: [] },
  { from: '2020-04', organization: 'サンプル株式会社', role: 'エンジニア', bullets: ['a', 'b'] },
];

describe('sortExperience', () => {
  it('from の新しい順に並べる', () => {
    expect(sortExperience(experience).map((e) => e.from)).toEqual(['2020-04', '2017-04']);
  });

  it('元の配列を破壊しない', () => {
    sortExperience(experience);
    expect(experience.map((e) => e.from)).toEqual(['2017-04', '2020-04']);
  });
});

describe('sortByDateDesc', () => {
  it('date の新しい順に並べる', () => {
    const items = [{ date: '2023-06-01' }, { date: '2024-10-12' }, { date: '2024-01-05' }];
    expect(sortByDateDesc(items).map((i) => i.date)).toEqual([
      '2024-10-12',
      '2024-01-05',
      '2023-06-01',
    ]);
  });

  it('元の配列を破壊しない', () => {
    const items = [{ date: '2023-06-01' }, { date: '2024-10-12' }];
    sortByDateDesc(items);
    expect(items.map((i) => i.date)).toEqual(['2023-06-01', '2024-10-12']);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `pnpm exec vitest run tests/unit/career.test.ts`
Expected: FAIL（`src/lib/career` が存在しない）

- [ ] **Step 3: 並び替えを実装**

`src/lib/career.ts` を新規作成:

```ts
import type { Career } from '../content/schemas';
import type { Locale } from './i18n';

/** 職歴を from の新しい順に並べた新しい配列を返す */
export function sortExperience(experience: Career['experience']): Career['experience'] {
  return [...experience].sort((a, b) => b.from.localeCompare(a.from));
}

/** 日付を持つ項目を date の新しい順に並べた新しい配列を返す（資格と実績で共用） */
export function sortByDateDesc<T extends { date: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.date.localeCompare(a.date));
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `pnpm exec vitest run tests/unit/career.test.ts`
Expected: PASS（4 件）

- [ ] **Step 5: 失敗するテストを書く（期間と日付の整形）**

`tests/unit/career.test.ts` の末尾に追加:

```ts
describe('formatPeriod', () => {
  it('ja は 年月 – 年月', () => {
    expect(formatPeriod('2017-04', '2020-03', 'ja')).toBe('2017年4月 – 2020年3月');
  });

  it('en は 短縮月 年 – 短縮月 年', () => {
    expect(formatPeriod('2017-04', '2020-03', 'en')).toBe('Apr 2017 – Mar 2020');
  });

  it('to が undefined なら在職中の表記になる', () => {
    expect(formatPeriod('2020-04', undefined, 'ja')).toBe('2020年4月 – 現在');
    expect(formatPeriod('2020-04', undefined, 'en')).toBe('Apr 2020 – Present');
  });

  it('to が null でも在職中の表記になる', () => {
    expect(formatPeriod('2020-04', null, 'ja')).toBe('2020年4月 – 現在');
  });

  it('1 月を前年 12 月に丸めない（ローカル時刻で組み立てる）', () => {
    expect(formatPeriod('2020-01', '2020-01', 'en')).toBe('Jan 2020 – Jan 2020');
  });
});

describe('formatDate', () => {
  it('ja は 年月日', () => {
    expect(formatDate('2023-06-01', 'ja')).toBe('2023年6月1日');
  });

  it('en は 月 日, 年', () => {
    expect(formatDate('2024-10-12', 'en')).toBe('October 12, 2024');
  });

  it('月初を前月に丸めない', () => {
    expect(formatDate('2024-01-01', 'en')).toBe('January 1, 2024');
  });
});
```

- [ ] **Step 6: テストが失敗することを確認**

Run: `pnpm exec vitest run tests/unit/career.test.ts`
Expected: FAIL（`formatPeriod is not a function` 相当）

- [ ] **Step 7: 整形を実装**

`src/lib/career.ts` に追加（`PRESENT` の文言はこの 2 語だけなので `site.ts` の `ui` には置かず、期間の整形と同じ場所に持つ。design D1）:

```ts
/** 在職中（to が無い）の終わりの表記 */
const present: Record<Locale, string> = { ja: '現在', en: 'Present' };

/**
 * `YYYY-MM` / `YYYY-MM-DD` をローカル時刻の Date にする。
 * `new Date('2020-04')` は UTC 基準で解釈され、負のオフセットの環境で前月になる
 */
function toLocalDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  if (year === undefined || month === undefined) throw new Error(`日付の形式が違う: ${value}`);
  return new Date(year, month - 1, day ?? 1);
}

/** 職歴の期間。ja: `2020年4月 – 現在`、en: `Apr 2020 – Present` */
export function formatPeriod(from: string, to: string | null | undefined, lang: Locale): string {
  const format = (value: string) =>
    new Intl.DateTimeFormat(lang, {
      year: 'numeric',
      month: lang === 'ja' ? 'long' : 'short',
    }).format(toLocalDate(value));
  return `${format(from)} – ${to ? format(to) : present[lang]}`;
}

/** 資格・実績の日付。ja: `2023年6月1日`、en: `June 1, 2023` */
export function formatDate(date: string, lang: Locale): string {
  return new Intl.DateTimeFormat(lang, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(toLocalDate(date));
}
```

区切りは U+2013（EN DASH）の前後に半角空白 1 つずつ。

- [ ] **Step 8: テストが通ることを確認**

Run: `pnpm exec vitest run tests/unit/career.test.ts`
Expected: PASS（12 件）

- [ ] **Step 9: 失敗するテストを書く（`ui` の追加分）**

`tests/unit/site.test.ts` の末尾に追加:

```ts
describe('ui の経歴ページの文字列', () => {
  it('区画の見出しが両ロケールにある', () => {
    expect(ui.ja.careerSections).toEqual({
      experience: '職歴',
      skills: 'スキル',
      certifications: '資格',
      achievements: '実績',
    });
    expect(ui.en.careerSections).toEqual({
      experience: 'Experience',
      skills: 'Skills',
      certifications: 'Certifications',
      achievements: 'Achievements',
    });
  });

  it('実績の種別 4 つすべてにラベルがある', () => {
    for (const lang of ['ja', 'en'] as const) {
      for (const kind of ['talk', 'article', 'award', 'other'] as const) {
        expect(ui[lang].achievementKind[kind]).toBeTruthy();
      }
    }
    expect(ui.ja.achievementKind.talk).toBe('登壇');
    expect(ui.en.achievementKind.talk).toBe('Talk');
  });
});
```

- [ ] **Step 10: テストが失敗することを確認**

Run: `pnpm exec vitest run tests/unit/site.test.ts`
Expected: FAIL（`careerSections` が undefined）

- [ ] **Step 11: `ui` に追加**

`src/lib/site.ts` の `UiStrings` 型に 2 つのフィールドを足し、`ui.ja` / `ui.en` の両方を埋める:

```ts
type UiStrings = {
  languageName: string;
  notFound: string;
  backToTop: string;
  backToGallery: string;
  prevPhoto: string;
  nextPhoto: string;
  careerSections: { experience: string; skills: string; certifications: string; achievements: string };
  achievementKind: Record<'talk' | 'article' | 'award' | 'other', string>;
};
```

`ui.ja` に:

```ts
    careerSections: {
      experience: '職歴',
      skills: 'スキル',
      certifications: '資格',
      achievements: '実績',
    },
    achievementKind: { talk: '登壇', article: '執筆', award: '受賞', other: 'その他' },
```

`ui.en` に:

```ts
    careerSections: {
      experience: 'Experience',
      skills: 'Skills',
      certifications: 'Certifications',
      achievements: 'Achievements',
    },
    achievementKind: { talk: 'Talk', article: 'Article', award: 'Award', other: 'Other' },
```

- [ ] **Step 12: 全体の検証**

Run: `pnpm test && pnpm typecheck && pnpm lint`
Expected: すべて緑（テストは 91 + 14 件前後）

- [ ] **Step 13: コミット**

`openspec/changes/profile-and-career/tasks.md` の 1.1〜1.4 を `[x]` にしてから:

```bash
git add src/lib/career.ts tests/unit/career.test.ts src/lib/site.ts tests/unit/site.test.ts openspec/changes/profile-and-career/tasks.md
git commit -m "$(cat <<'EOF'
feat: 経歴の並び替えと期間・日付の整形を純関数で追加する

区画の見出しと実績の種別ラベルを ui に足した。

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: 経歴ページ `/{ja,en}/career/`（tasks.md の 2.1〜2.2）

**Files:**
- Create: `src/pages/[lang]/career.astro`
- Modify: `openspec/changes/profile-and-career/tasks.md`（2.1〜2.2 を `[x]`）

**Interfaces:**
- Consumes: Task 1 の `sortExperience` / `sortByDateDesc` / `formatPeriod` / `formatDate`、`ui[lang].careerSections`、`ui[lang].achievementKind`、既存の `getCareer(lang)`（`src/lib/content.ts`）、`toLocale` と `locales`（`src/lib/i18n.ts`）、`BaseLayout`
- Produces: `/ja/career/` と `/en/career/`（`dist/{ja,en}/career/index.html`）

- [ ] **Step 1: ページを書く**

`src/pages/[lang]/career.astro` を新規作成（`src/pages/[lang]/photos/index.astro` と同じ骨格。相対パスの深さは 1 段浅い）:

```astro
---
// 経歴。職歴・スキル・資格・実績の 4 区画。並び替えと整形は career.ts の純関数、
// 画面の文字列は site.ts の ui に置く（design D1・D2）
import BaseLayout from '../../layouts/BaseLayout.astro';
import { formatDate, formatPeriod, sortByDateDesc, sortExperience } from '../../lib/career';
import { getCareer } from '../../lib/content';
import { locales, toLocale } from '../../lib/i18n';
import { ui } from '../../lib/site';

export function getStaticPaths() {
  return locales.map((lang) => ({ params: { lang } }));
}

const lang = toLocale(Astro.params.lang);
const career = await getCareer(lang);
const t = ui[lang].careerSections;
const kinds = ui[lang].achievementKind;
---

<BaseLayout title="Career">
  <h1>Career</h1>

  <section>
    <h2>{t.experience}</h2>
    {
      sortExperience(career.experience).map((job) => (
        <article>
          <p class="muted">{formatPeriod(job.from, job.to, lang)}</p>
          <p class="org">{job.organization}</p>
          <p class="muted">{job.role}</p>
          <ul>
            {job.bullets.map((bullet) => (
              <li>{bullet}</li>
            ))}
          </ul>
        </article>
      ))
    }
  </section>

  <section>
    <h2>{t.skills}</h2>
    {
      Object.entries(career.skills).map(([category, names]) => (
        <p>
          <span class="org">{category}</span> {names.join(', ')}
        </p>
      ))
    }
  </section>

  <section>
    <h2>{t.certifications}</h2>
    <ul>
      {
        sortByDateDesc(career.certifications).map((item) => (
          <li>
            <span class="muted">{formatDate(item.date, lang)}</span>{' · '}
            {item.url ? <a href={item.url}>{item.name}</a> : item.name}
          </li>
        ))
      }
    </ul>
  </section>

  <section>
    <h2>{t.achievements}</h2>
    <ul>
      {
        sortByDateDesc(career.achievements).map((item) => (
          <li>
            <span class="muted">{formatDate(item.date, lang)}</span>{' · '}
            <span class="muted">{kinds[item.kind]}</span>{' · '}
            {item.url ? <a href={item.url}>{item.name}</a> : item.name}
          </li>
        ))
      }
    </ul>
  </section>
</BaseLayout>

<style>
  section {
    margin-bottom: 2.5rem;
  }
  article {
    margin-bottom: 1.5rem;
  }
  p {
    margin: 0 0 0.25rem;
  }
  .org {
    font-weight: 600;
  }
  ul {
    margin: 0.25rem 0 0;
    padding-left: 1.25rem;
  }
</style>
```

`.muted` は `src/styles/global.css` にある既存のクラス（トップの `tagline` が使っている）。存在を `grep -n 'muted' src/styles/global.css` で確かめてから使い、無ければ `<style>` 側で定義する。

- [ ] **Step 2: ビルドして出力を確認**

Run:

```bash
pnpm build && ls dist/ja/career/index.html dist/en/career/index.html
grep -o '<title>[^<]*</title>' dist/ja/career/index.html
grep -c 'https://example.com/talk' dist/ja/career/index.html
grep -o '応用情報技術者[^<]*' dist/ja/career/index.html
```

Expected: 2 ファイルが存在。`<title>Career · joe-yama</title>`。`https://example.com/talk` が 1 件。`応用情報技術者` は `<a` を伴わない（`grep -o '<a[^>]*>応用情報技術者' dist/ja/career/index.html` が 0 件）

- [ ] **Step 3: 英語版と区画の順序を確認**

Run:

```bash
grep -o '<h2>[^<]*</h2>' dist/en/career/index.html
grep -o 'Apr 2020 – Present' dist/en/career/index.html
grep -o '2020年4月 – 現在' dist/ja/career/index.html
grep -o 'Talk' dist/en/career/index.html | head -1
```

Expected: `<h2>` は `Experience` → `Skills` → `Certifications` → `Achievements` の順。期間の表記が両ロケールで出る。`Talk` が出る

- [ ] **Step 4: 検証コマンド**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: すべて緑

- [ ] **Step 5: コミット**

`tasks.md` の 2.1〜2.2 を `[x]` にしてから:

```bash
git add src/pages/ openspec/changes/profile-and-career/tasks.md
git commit -m "$(cat <<'EOF'
feat: 経歴ページ /{ja,en}/career/ を追加する

職歴・スキル・資格・実績の 4 区画。url を持つ項目だけリンクにする。

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: トップページの完成（tasks.md の 3.1〜3.3）

**Files:**
- Modify: `src/pages/[lang]/index.astro`
- Modify: `openspec/changes/profile-and-career/tasks.md`（3.1〜3.3 を `[x]`）

**Interfaces:**
- Consumes: 既存の `navLinks(lang)` / `languageSwitch(path, lang)` / `ui`（`src/lib/site.ts`）、`getProfile(lang)`
- Produces: トップの本文に連絡先リンクと 3 本の導線

- [ ] **Step 1: 連絡先と導線を追加し、ダミー呼び出しを消す**

`src/pages/[lang]/index.astro` を次のように変える。

frontmatter: `getCareer` の import と `await getCareer(lang)` の行、その上の説明コメントを**削除**し（design D4）、`navLinks` / `languageSwitch` を import する。`Astro.url.pathname` を `languageSwitch` に渡す:

```ts
import { languageSwitch, navLinks } from '../../lib/site';
...
const lang = toLocale(Astro.params.lang);
const profile = await getProfile(lang);
const sw = languageSwitch(Astro.url.pathname, lang);
```

本文（`<p class="muted">{profile.tagline}</p>` の後）に 2 ブロックを足す:

```astro
  <nav class="links">
    {profile.links.map((link) => <a href={link.url}>{link.label}</a>)}
  </nav>

  <nav class="links">
    {navLinks(lang).map((link) => <a href={link.href}>{link.label}</a>)}
    <a href={sw.href} hreflang={sw.hreflang} lang={sw.hreflang}>{sw.label}</a>
  </nav>
```

`<style>` に:

```css
  .links {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 1.25rem;
    margin-top: 1rem;
  }
```

`target` / `rel` は付けない（spec の要求）。`href` を直書きしない（Global Constraints）。

- [ ] **Step 2: ビルドして出力を確認**

Run:

```bash
pnpm build
grep -c 'mailto:hello@example.com' dist/ja/index.html
grep -c 'https://github.com/joe-yama' dist/ja/index.html
grep -o 'href="/en/photos/"\|href="/en/career/"\|href="/ja/"' dist/en/index.html | sort -u
grep -c 'target=' dist/ja/index.html
```

Expected: `mailto:` と GitHub がそれぞれ 1 件以上。英語トップに `/en/photos/`・`/en/career/`・`/ja/` の 3 本。`target=` は 0 件

- [ ] **Step 3: 件数一致の検証がビルドに残っていることを実測**

Run:

```bash
python3 - <<'PY'
import pathlib
p = pathlib.Path('src/content/career/en.yaml')
s = p.read_text()
p.write_text(s.replace('''certifications:
  - date: "2023-06-01"
    name: Applied Information Technology Engineer
''', 'certifications: []\n'))
PY
pnpm build; echo "exit=$?"
git checkout src/content/career/en.yaml
pnpm build && echo restored
```

Expected: 1 回目の `pnpm build` が `certifications の件数が日英で違う` を含むエラーで失敗（`exit=1`）、`git checkout` の後は成功。**`git checkout` は必ずこの 1 ファイルだけを対象にする**（`git checkout -- .` は禁止）

- [ ] **Step 4: 検証コマンド**

Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
Expected: すべて緑。`pnpm build` は 12 ページ

- [ ] **Step 5: コミット**

`tasks.md` の 3.1〜3.3 を `[x]` にしてから:

```bash
git add src/pages/ openspec/changes/profile-and-career/tasks.md
git commit -m "$(cat <<'EOF'
feat: トップに連絡先リンクとサイト内の導線を追加する

件数一致の検証は /career/ のビルドに移ったので、index.astro のダミー
呼び出しを削除した。

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

## レビューの単位

`.claude/rules/review.md` に従い、`reviewer`（Opus）が別コンテキストでレビューする。

- **単位 A = Task 1**（共有インターフェース: `career.ts` の公開関数、`ui` の型。他のタスクが依存する）
- **単位 B = Task 2 + Task 3**（ページ。UI 実測あり。コントローラーが `pnpm build && pnpm preview` を起動して URL を渡す。実測項目: `/ja/career/` と `/en/career/` の区画の順序・期間の表記・リンクの有無、`/ja/` と `/en/` の連絡先と導線のクリック、コンソールにエラーが無いこと）
- **ブランチ全体 1 回**

Minor は修正せず `openspec/changes/profile-and-career/tasks.md` 末尾の「提案」に転記する。
