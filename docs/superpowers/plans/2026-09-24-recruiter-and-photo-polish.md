# recruiter-and-photo-polish 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 採用担当に効く 3 点（トップの仕事の一行、経歴の要約、AWS 認定 12 件の束ね）と、写真に効く 2 点（64rem 以上のトップの横並び、写真ごとの共有カード）を入れる。

**Architecture:** データは既存のスキーマと日英の検査の形に足す（`headline` / `highlights` / 資格の `group`）。資格の束ねは `career.ts` の純関数、表示は `career.astro` の `<details>`（JavaScript なし）。横並びは `index.astro` の CSS グリッドだけで行い、`PhotoPicture` の `--photo-max-height` を上書きする。共有カードは `BaseLayout` の新しい引数 `ogPhoto` で写真を受け取る。

**Tech Stack:** Astro 7（静的出力）、TypeScript strict、Zod（`astro/zod`）、Vitest 5、Playwright 1.63、Biome 2、pnpm。依存の追加なし。

**Spec:** `openspec/changes/recruiter-and-photo-polish/specs/{content-schema,layout-shell,photo-pipeline,profile-and-career}/spec.md`（要求）、`openspec/changes/recruiter-and-photo-polish/design.md`（D1〜D6）、`openspec/changes/recruiter-and-photo-polish/tasks.md`（タスク）、`openspec/changes/recruiter-and-photo-polish/proposal.md`（文言・含めない）。Issue #60。

## Global Constraints

- **pnpm のみ**（`npm` / `npx` 禁止）。**依存を足さない**。`pnpm install` は `--frozen-lockfile` 付きだけ
- **TDD**: 失敗するテストを先に書き、赤を見てから実装する。テストの削除・skip・期待値の書き換えで通さない。**例外**（design の Risks が認める入力の更新）: 型 `Career` / `Profile` を満たさなくなる既存テストの見本データ（`tests/unit/schemas.test.ts` の `validCareer` / `validProfile`、`tests/unit/validate.test.ts` の `base`、`tests/unit/content.test.ts` の `career()`）に `headline` / `highlights` を足すこと。それと、`div.top` で包むことで当たらなくなる `tests/e2e/viewport.spec.ts` のセレクタ `main > h1` / `main > p.muted` を、同じ要素を指す新しいセレクタに差し替えること（検査する主張は変えない）
- **1 コミット = tasks.md の 1 項目**。日本語、先頭に種別（`feat:` / `test:` / `docs:` など）。`openspec/changes/recruiter-and-photo-polish/tasks.md` の該当チェックを同じコミットに含める（検証だけの 6.1 / 6.2 はチェックだけのコミットでよい）。末尾に attribution 2 行:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_019D8AefyHcog1Fncwy6oktk
  ```
- **`git commit --amend` / `rebase` 禁止**。push はしない（コントローラーが行う）
- **git は 1 コマンドずつ実行する**（`&&` や `;` で他のコマンドとつなぐと worktree ガードが拒否することがある）
- **文言は proposal / tasks のとおり**。`headline` の ja「コネクテッドカーのデータ基盤をつくるプロダクトオーナー」、en "Product owner for a connected-car data platform"。会社名を出さない
- **資格のグループ名**: ja `AWS 認定`、en `AWS Certifications`。件数の表記: ja `AWS 認定（12 件）`、en `AWS Certifications (12)`。期間の区切りは ` – `（前後に空白の en ダッシュ、U+2013）
- **メディアクエリは `min-width: 64rem` の形で書く**（範囲構文 `width >= 64rem` は使わない。design D5）
- **触らないファイル**: `src/components/PhotoPicture.astro`（`sizes` の最適化は非ゴール）、`src/components/Header.astro`、`src/styles/global.css`、`src/pages/[lang]/photos/index.astro`、`src/pages/404.astro`
- **Biome**: シングルクォート、セミコロンあり、行幅 100。崩れたら `pnpm format`
- **e2e はポート 4399 を他の worktree と共有する**。実行前に `lsof -i :4399` で空きを確かめ、`pnpm e2e` を同時に 2 本回さない。reviewer 用の preview（4321）が残っていたら `pnpm exec astro preview stop` ではなくコントローラーに知らせる
- **`rm -rf` は hook が拒否する**。隔離複製は毎回新しいディレクトリ名で作る
- **スコープ**: `tasks.md` の項目だけ。気づいた改善は `tasks.md` 末尾の「提案」に書き、実装しない
- **検証コマンド**: `pnpm test` / `pnpm lint` / `pnpm typecheck` / `pnpm build` / `pnpm e2e`。報告にはコマンドと出力の抜粋（件数の行）を添える

## 実装前に実物で確かめた落とし穴（計画作成時）

1. **e2e は YAML パーサーを使えない**（`yaml` は直接依存に無い。`tests/e2e/pages.spec.ts:16-21` の注記）。期待値は既存の `parsePatents` と同じく、行単位の正規表現で YAML から取り出す。YAML のファイルは `fileURLToPath(new URL('../../src/content/...', import.meta.url))` で読む（cwd に依存しない。`pages.spec.ts:78-80`）
2. **`tests/e2e/viewport.spec.ts:117-118` は `main > h1` / `main > p.muted` で子要素を直接選んでいる**。D5 で `div.top > div.intro` に包むと 0 件になり、`assertBottomsWithinViewport` の「要素が見つからない」で落ちる。`main h1` / `main .intro > p.muted` に差し替える
3. **`p.muted` は tagline だけ**。headline には `class="headline"` を付け、`.muted` を付けない（design D5: headline は本文の色）。セレクタで tagline と取り違えないため
4. **資格の区画の中にも `<summary>` ができる**。特許の e2e は `patentsSection(page, lang).locator('summary')` で区画に閉じているので当たらない。新しい e2e も資格の区画に閉じて選ぶ（見出し `h2` の文字列 `ui[lang].careerSections.certifications` で `section` を選ぶ）
5. **経歴ページの `main section` は 5 本のまま**（`pages.spec.ts` 末尾の検査）。要約の `<ul class="highlights">` は `<section>` で包まない
6. **型 `Career` は Zod から推論される**ので、`highlights` を必須にすると `Career` 型の見本データ（`validate.test.ts` の `base`、`content.test.ts` の `career()`）が `pnpm typecheck` で落ちる。Vitest は型を見ないので `pnpm test` だけでは気づけない。Task 1 の最後に `pnpm typecheck` を必ず回す
7. **代表写真は `sunset-dinghies`（`featured: true`）、代表ではない写真は `kariya-ferris-wheel`（縦位置）**。e2e では slug を固定せず、`src/content/photos/*.yaml` のうち `featured: true` の行を持たないものを選ぶ
8. **`main` の幅は `max-width: 80rem`、`padding: 2rem 1rem`**（`global.css:42-48`）。「`main` の幅の半分」は content box（`clientWidth` − 左右の padding）で測る。`viewport.spec.ts` の `assertPhotoFillsMainContentWidth` と同じ測り方
9. **`PhotoPicture` の `img.full` は `width: auto; max-width: 100%; max-height: var(--photo-max-height); margin-inline: auto`**。列の中でも縦横比を保って中央に置かれる。グリッドの列が画像の固有幅で押し広げられて横スクロールが出た場合だけ、`grid-template-columns: minmax(0, 3fr) minmax(0, 2fr)` にする（design D5 の 3:2 の比率は変わらない。そうした場合は報告に書く）

---

## Task 一覧とレビューの単位

| Task | 名前 | tasks.md | レビュー単位 |
|---|---|---|---|
| 1 | データ構造と日英の検査 | 1.1〜1.4 | 単位 A（共有インターフェースのスキーマと検査に触る） |
| 2 | 経歴ページ（要約・資格の束ね） | 2.1、2.2 | 単位 B（spec の要求と UI。Playwright で実測） |
| 3 | トップページ（一行・横並び） | 3.1、3.2 | 単位 C（UI。Playwright で実測） |
| 4 | メタデータと共有カード | 4.1、4.2 | 単位 C（Task 3 と一緒に 1 回。どちらも `BaseLayout` / `index.astro` と `pages.spec.ts` を触る） |
| 5 | 文書 | 5.1 | ブランチ全体のレビューに含める |
| 6 | 番人の確認と全コマンド | 6.1、6.2 | ブランチ全体のレビューに含める |

ブランチ全体のレビューを最後に 1 回行う。実装者は worktree に 1 体だけ（並行させない）。

---

### Task 1: データ構造と日英の検査（tasks 1.1〜1.4、design D1・D2・D4）

**Files:**
- Modify: `src/content/schemas.ts`（`profileSchema`、`datedItemSchema` の資格側、`careerSchema`）
- Modify: `src/lib/validate.ts`（`validateCareerParity`）
- Modify: `src/content/profile/{ja,en}.yaml`、`src/content/career/{ja,en}.yaml`
- Test: `tests/unit/schemas.test.ts`、`tests/unit/validate.test.ts`（見本データの入力更新は `tests/unit/content.test.ts` にも及ぶ）

**Interfaces:**
- Produces:
  - `Profile` に `headline: string`
  - `Career` に `highlights: string[]`（1〜4 件）
  - `Career['certifications'][number]` に `group?: string`（空文字列は不可）。**実績（`achievements`）には `group` を足さない**（spec は資格だけ）
  - `validateCareerParity` の新しいエラー:
    - `highlights の件数が日英で違う（ja: 4, en: 3）`（既存の件数のエラーと同じ文型）
    - `certifications の 2 番目の group の付き方が日英で違う（ja: AWS 認定, en: なし）`（位置は 1 始まり、`group` が無い側は `なし`。食い違った**最初の位置だけ**を 1 件報告する）

- [ ] **Step 1 (1.1 RED):** `tests/unit/schemas.test.ts` の `validProfile` に `headline: '写真を撮るソフトウェアエンジニアのプロダクトオーナー'` を足し、`describe('profileSchema')` に次を足す。`pnpm test tests/unit/schemas.test.ts` で「無い」「空」の 2 件が赤（今は通ってしまう）になることを確かめる

```ts
  it('headline を欠くと失敗し、エラーの path に headline が入る', () => {
    const { headline: _omit, ...rest } = validProfile;
    const result = profileSchema.safeParse(rest);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.some((i) => i.path[0] === 'headline')).toBe(true);
  });

  it.each(['', '   '])('headline が空（%j）なら失敗する', (headline) => {
    expect(profileSchema.safeParse({ ...validProfile, headline }).success).toBe(false);
  });
```

- [ ] **Step 2 (1.1 GREEN):** `profileSchema` の `name` の次に `headline: nonEmpty,` を足す。YAML の `name:` の次の行に書く

```yaml
# src/content/profile/ja.yaml
headline: コネクテッドカーのデータ基盤をつくるプロダクトオーナー
# src/content/profile/en.yaml
headline: Product owner for a connected-car data platform
```

`pnpm test` と `pnpm build` が緑。コミット `feat: プロフィールに仕事の一行 headline を足す`

- [ ] **Step 3 (1.2 RED):** `validCareer` に `highlights: ['要約 1']` を足し、`describe('careerSchema')` に次を足す。`pnpm test tests/unit/schemas.test.ts` で「無い」「0 件」「5 件」の 3 件が赤になることを確かめる

```ts
  it('highlights を持たないと失敗する', () => {
    const { highlights: _omit, ...rest } = validCareer;
    expect(careerSchema.safeParse(rest).success).toBe(false);
  });

  it.each([0, 5])('highlights が %i 件なら失敗する', (n) => {
    const highlights = Array.from({ length: n }, (_, i) => `要約 ${i + 1}`);
    expect(careerSchema.safeParse({ ...validCareer, highlights }).success).toBe(false);
  });

  it.each([1, 4])('highlights が %i 件なら成功する', (n) => {
    const highlights = Array.from({ length: n }, (_, i) => `要約 ${i + 1}`);
    expect(careerSchema.safeParse({ ...validCareer, highlights }).success).toBe(true);
  });

  it('highlights に空文字列があれば失敗する', () => {
    expect(careerSchema.safeParse({ ...validCareer, highlights: [''] }).success).toBe(false);
  });
```

- [ ] **Step 4 (1.2 GREEN):** `careerSchema` の object の先頭に `highlights: z.array(nonEmpty).min(1).max(4),` を足す。`career/{ja,en}.yaml` の先頭（`experience:` の前）に書く。`validate.test.ts` の `base` と `content.test.ts` の `career()` にも `highlights: ['h']` を足す（入力の更新。Global Constraints の例外）

```yaml
# src/content/career/ja.yaml
highlights:
  - コネクテッドカーのデータ基盤（20 か国以上・1,000 万台超）のプロダクトオーナー
  - 100 名超のエンジニアを対象にした開発標準化をリード
  - 特許 65 発明（うち米国を含む 47 件）
  - AWS 認定 12 資格をすべて取得（2026 年 AWS All Certifications Engineers）
# src/content/career/en.yaml
highlights:
  - Product owner of a connected-car data platform (10M+ vehicles in 20+ countries)
  - Leading engineering standardization for 100+ engineers
  - Inventor on 65 patent families (47 including US filings)
  - Holder of all 12 AWS Certifications (2026 AWS All Certifications Engineers)
```

`pnpm test` / `pnpm typecheck` / `pnpm build` が緑。コミット `feat: 経歴に要約 highlights を足す`

- [ ] **Step 5 (1.3 RED):** `validate.test.ts` の `describe('validateCareerParity')` に次を足し、赤を確かめる

```ts
  it('highlights の件数差を報告する', () => {
    const ja: Career = { ...base, highlights: ['1', '2', '3', '4'] };
    const en: Career = { ...base, highlights: ['1', '2', '3'] };
    expect(validateCareerParity(ja, en)).toEqual(['highlights の件数が日英で違う（ja: 4, en: 3）']);
  });
```

- [ ] **Step 6 (1.3 GREEN):** `validateCareerParity` の件数を見るキーの配列の先頭に `'highlights'` を足す（`['highlights', 'experience', 'certifications', 'achievements', 'patents'] as const`）。`INDEXED_KEYS` には足さない（design D2）。緑を確かめてコミット `feat: highlights の件数を日英で突き合わせる`

- [ ] **Step 7 (1.4 RED):** `schemas.test.ts` の `describe('careerSchema')` に次を足す

```ts
  it('group を持つ資格と持たない資格が混ざっても成功する', () => {
    const certifications = [
      { date: '2025-10', name: 'AWS Certified Security - Specialty', group: 'AWS 認定' },
      { date: '2020-07', name: 'Licensed Scrum Master' },
    ];
    const result = careerSchema.safeParse({ ...validCareer, certifications });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.certifications[0].group).toBe('AWS 認定');
  });

  it.each(['', '  '])('資格の group が空（%j）なら失敗する', (group) => {
    const certifications = [{ date: '2025-10', name: 'x', group }];
    expect(careerSchema.safeParse({ ...validCareer, certifications }).success).toBe(false);
  });
```

（1 件目の `result.data...group` の検査が、Zod が未知のキーを黙って捨てる今の実装で赤になる。）

`validate.test.ts` に次を足す（`cert` は同じファイルの中の小さなヘルパーとして置く）

```ts
  const cert = (date: string, group?: string) => ({ date, name: 'n', ...(group && { group }) });

  it('同じ位置の資格の group の有無が日英で違えば、何番目かを報告する', () => {
    const ja: Career = { ...base, certifications: [cert('2025-10'), cert('2025-10', 'AWS 認定'), cert('2020-07')] };
    const en: Career = { ...base, certifications: [cert('2025-10'), cert('2025-10'), cert('2020-07')] };
    expect(validateCareerParity(ja, en)).toEqual([
      'certifications の 2 番目の group の付き方が日英で違う（ja: AWS 認定, en: なし）',
    ]);
  });

  it('group の分け方が日英で違えば、食い違う位置を報告する', () => {
    const ja: Career = { ...base, certifications: [cert('2025-10', 'AWS 認定'), cert('2025-04', 'AWS 認定')] };
    const en: Career = { ...base, certifications: [cert('2025-10', 'AWS'), cert('2025-04', 'Azure')] };
    expect(validateCareerParity(ja, en)).toEqual([
      'certifications の 2 番目の group の付き方が日英で違う（ja: AWS 認定, en: Azure）',
    ]);
  });

  it('group 名が訳語で違うだけなら問題なし', () => {
    const ja: Career = { ...base, certifications: [cert('2025-10', 'AWS 認定'), cert('2025-04', 'AWS 認定'), cert('2020-07')] };
    const en: Career = { ...base, certifications: [cert('2025-10', 'AWS Certifications'), cert('2025-04', 'AWS Certifications'), cert('2020-07')] };
    expect(validateCareerParity(ja, en)).toEqual([]);
  });

  it('資格の件数が違うときは group の突き合わせまで進まない', () => {
    const en: Career = { ...base, certifications: [...base.certifications, cert('2020-07', 'X')] };
    expect(validateCareerParity(base, en)).toEqual([
      'certifications の件数が日英で違う（ja: 1, en: 2）',
    ]);
  });
```

`pnpm test` で上の 3 件目・4 件目以外が赤になることを確かめる

- [ ] **Step 8 (1.4 GREEN):** `schemas.ts` で資格のスキーマを `datedItemSchema.extend({ group: nonEmpty.optional() })` にする（実績は `datedItemSchema.extend({ kind })` のまま）。`validate.ts` の `INDEXED_KEYS` のループの後に、design D4 の「最初に出てきた位置の番号」の比較を足す:

```ts
  // group は訳語になるので名前では比べず、各言語で「その group が最初に出てきた位置」に
  // 置き換えて比べる。有無の食い違いと分け方の食い違いを 1 回の比較で見られる（design D4）
  if (ja.certifications.length === en.certifications.length) {
    const firstIndexes = (career: Career) =>
      career.certifications.map((c) =>
        c.group === undefined ? -1 : career.certifications.findIndex((d) => d.group === c.group),
      );
    const [jaIndexes, enIndexes] = [firstIndexes(ja), firstIndexes(en)];
    const index = jaIndexes.findIndex((v, i) => v !== enIndexes[i]);
    if (index !== -1) {
      const name = (c: Career) => c.certifications[index].group ?? 'なし';
      errors.push(
        `certifications の ${index + 1} 番目の group の付き方が日英で違う（ja: ${name(ja)}, en: ${name(en)}）`,
      );
    }
  }
```

実データの AWS 認定 12 件（`career/ja.yaml` の `AWS Certified ...` の 12 件、`TOEIC` と `Licensed Scrum Master` 以外）に、`name:` の次の行として `    group: AWS 認定`（en は `    group: AWS Certifications`）を足す。`pnpm test` / `pnpm typecheck` / `pnpm lint` / `pnpm build` が緑。コミット `feat: 資格に group を足し、付き方を日英で突き合わせる`

---

### Task 2: 経歴ページ（tasks 2.1・2.2、design D2・D3）

**Files:**
- Modify: `src/lib/career.ts`（`groupCertifications`、`formatGroupPeriod`、型 `CertificationEntry`）
- Modify: `src/lib/site.ts`（`UiStrings` と `ui` に `certGroupCount`）
- Modify: `src/pages/[lang]/career.astro`
- Test: `tests/unit/career.test.ts`、`tests/e2e/pages.spec.ts`

**Interfaces:**
- Consumes: Task 1 の `Career['highlights']`、`Career['certifications'][number]['group']`
- Produces:
  ```ts
  type Certification = Career['certifications'][number];
  export type CertificationEntry =
    | { kind: 'single'; item: Certification }
    | { kind: 'group'; name: string; items: Certification[] };
  /** 入力は sortByDateDesc 済み。グループは初めて出てきた位置（= 最も新しい date の位置）に置く */
  export function groupCertifications(sorted: Certification[]): CertificationEntry[];
  /** items は新しい順。`古い – 新しい`、同じ表記なら 1 つだけ。formatDate を使う */
  export function formatGroupPeriod(items: { date: string }[], lang: Locale): string;
  // site.ts の UiStrings
  certGroupCount: (name: string, n: number) => string; // ja `${name}（${n} 件）`、en `${name} (${n})`
  ```

- [ ] **Step 1 (2.1 RED):** `tests/unit/career.test.ts` に次を足し、赤（関数が無い）を確かめる

```ts
describe('groupCertifications', () => {
  const a = { date: '2026-05', name: 'A' };
  const aws1 = { date: '2025-10', name: 'AWS 1', group: 'AWS 認定' };
  const aws2 = { date: '2025-04', name: 'AWS 2', group: 'AWS 認定' };
  const b = { date: '2020-07', name: 'B' };

  it('グループは最も新しい資格の位置に 1 項目で置かれ、前後の資格はそのまま残る', () => {
    const result = groupCertifications([a, aws1, aws2, b]);
    expect(result).toEqual([
      { kind: 'single', item: a },
      { kind: 'group', name: 'AWS 認定', items: [aws1, aws2] },
      { kind: 'single', item: b },
    ]);
  });

  it('グループの間に別の資格が挟まっても、グループの中は新しい順にまとまる', () => {
    const result = groupCertifications([aws1, a, aws2]);
    expect(result).toEqual([
      { kind: 'group', name: 'AWS 認定', items: [aws1, aws2] },
      { kind: 'single', item: a },
    ]);
  });

  it('group を持たない資格だけなら、すべて single のまま順を保つ', () => {
    expect(groupCertifications([a, b])).toEqual([
      { kind: 'single', item: a },
      { kind: 'single', item: b },
    ]);
  });
});

describe('formatGroupPeriod', () => {
  const items = [{ date: '2025-10' }, { date: '2025-09' }, { date: '2025-04' }];

  it('ja は 古い – 新しい', () => {
    expect(formatGroupPeriod(items, 'ja')).toBe('2025年4月 – 2025年10月');
  });

  it('en は 古い – 新しい', () => {
    expect(formatGroupPeriod(items, 'en')).toBe('April 2025 – October 2025');
  });

  it('同じ月だけのグループは 1 つだけ出し、– を含まない', () => {
    expect(formatGroupPeriod([{ date: '2025-10' }, { date: '2025-10' }], 'ja')).toBe('2025年10月');
  });
});
```

`site.test.ts` に `certGroupCount` の 2 件（`ui.ja.certGroupCount('AWS 認定', 12)` が `AWS 認定（12 件）`、en が `AWS Certifications (12)`）を足す

- [ ] **Step 2 (2.1 GREEN):** `career.ts` に実装する

```ts
type Certification = Career['certifications'][number];

export type CertificationEntry =
  | { kind: 'single'; item: Certification }
  | { kind: 'group'; name: string; items: Certification[] };

/**
 * 同じ group の資格を 1 項目にまとめる（design D3）。入力は sortByDateDesc 済みなので、
 * グループが初めて出てきた位置がそのグループで最も新しい date の位置になる
 */
export function groupCertifications(sorted: Certification[]): CertificationEntry[] {
  const entries: CertificationEntry[] = [];
  const groups = new Map<string, Certification[]>();
  for (const item of sorted) {
    if (item.group === undefined) {
      entries.push({ kind: 'single', item });
      continue;
    }
    const items = groups.get(item.group);
    if (items) {
      items.push(item);
    } else {
      const created = [item];
      groups.set(item.group, created);
      entries.push({ kind: 'group', name: item.group, items: created });
    }
  }
  return entries;
}

/** まとめた資格の期間。items は新しい順。ja: `2025年4月 – 2025年10月`、同じ表記なら 1 つだけ */
export function formatGroupPeriod(items: { date: string }[], lang: Locale): string {
  const newest = formatDate(items[0].date, lang);
  const oldest = formatDate(items[items.length - 1].date, lang);
  return oldest === newest ? newest : `${oldest} – ${newest}`;
}
```

`site.ts` の `UiStrings` の `morePatents` の次に `/** まとめた資格の見出しの件数の表記（design D3） */ certGroupCount: (name: string, n: number) => string;` を足し、`ui.ja` に `certGroupCount: (name, n) => \`${name}（${n} 件）\``、`ui.en` に `certGroupCount: (name, n) => \`${name} (${n})\`` を足す。`pnpm test` / `pnpm typecheck` が緑。コミット `feat: 資格を group ごとに束ねる純関数を足す`

- [ ] **Step 3 (2.2 RED):** `tests/e2e/pages.spec.ts` に、YAML から期待値を取り出すヘルパーと検査を足す。ヘルパーは `parsePatents` と同じ行単位の読み方にする

```ts
/** career/{lang}.yaml の highlights: の各行（`  - ` の後ろ）を記述順に取り出す */
function parseHighlights(yamlPath: string): string[] { /* ^highlights:\s*$ の区画で ^ {2}- (.+)$ を集める */ }

type CertSummary = { date: string; name: string; group?: string };
/**
 * certifications: の区画から date / name / group を取り出す。
 * `  - date: "2025-10"` で 1 件が始まり、`    name: ...`（前後の " は外す）と `    group: ...` が続く
 */
function parseCertifications(yamlPath: string): CertSummary[] { /* 同上 */ }
```

検査（両ロケールで回す。`certSection(page, lang)` は `page.locator('section', { has: page.locator('h2', { hasText: ui[lang].careerSections.certifications }) })`）:

1. **要約**: `main` の子要素の並びが `H1`, `UL`, `SECTION`… で、その `UL`（`main > ul.highlights`）の `li` の文字列が `parseHighlights` と一致し、直後の `section` の `h2` が `ui[lang].careerSections.experience` であること
2. **束ね**: `certSection` の直下の `ul > li` のうち `details` を持つものが 1 つだけ。その `summary` の文字列が、YAML の `group` を持つ資格から計算した期間（最古と最新の `date` を `Intl.DateTimeFormat(lang, { year: 'numeric', month: 'long' })` で整形し ` – ` でつなぐ。e2e の中で独立に計算する）と、`ui[lang].certGroupCount(groupName, 件数)` を含むこと。**件数が 12 であることも `expect(grouped).toHaveLength(12)` で確かめる**（データが変わって束ねが空になったのに緑、を防ぐ）。直下の `li` の数は「group を持たない資格の数 + 1」
3. **開く**: 開く前は `details li:visible` が 0 件、`summary` をクリックした後は `details li` の名前の並びが、YAML の `group` を持つ資格を `date` の新しい順（年月は `-01` を補って比べる安定ソート）にした名前の並びと一致すること

`pnpm build` の後 `pnpm e2e tests/e2e/pages.spec.ts` で新しい検査が赤、既存の検査（区画の順序・特許）が緑であることを確かめる

- [ ] **Step 4 (2.2 GREEN):** `career.astro`

```astro
const certEntries = groupCertifications(sortByDateDesc(career.certifications));
const certGroupCount = ui[lang].certGroupCount;
---
<BaseLayout title="Career">
  <h1>Career</h1>
  <ul class="highlights">
    {career.highlights.map((line) => <li>{line}</li>)}
  </ul>
  ...（職歴・スキルはそのまま）
        <ul>
          {certEntries.map((entry) =>
            entry.kind === 'single' ? (
              <li>…既存の 1 件の表示（日付 · 名前、url があればリンク）…</li>
            ) : (
              <li>
                <details>
                  <summary>
                    <span class="muted">{formatGroupPeriod(entry.items, lang)}</span>
                    {' · '}
                    {certGroupCount(entry.name, entry.items.length)}
                  </summary>
                  <ul>
                    {entry.items.map((item) => (<li>…既存の 1 件の表示と同じ…</li>))}
                  </ul>
                </details>
              </li>
            ),
          )}
        </ul>
```

1 件の表示は single と内訳で同じマークアップにする（同じファイルの中で重複させてよいが、3 行を超えるなら `CertItem` のような小さなコンポーネントにせず、`.map` の中の式を 1 つの変数関数にまとめる程度に留める）。`.highlights` の CSS は既存の `ul` の規則をそのまま使い、足すのは `margin-bottom: 2.5rem`（`section` と同じ間隔）だけ。`pnpm e2e` 全体が緑。`pnpm lint` / `pnpm typecheck` が緑。コミット `feat: 経歴ページに要約と束ねた資格を出す`

---

### Task 3: トップページ（tasks 3.1・3.2、design D1・D5）

**Files:**
- Modify: `src/pages/[lang]/index.astro`
- Test: `tests/e2e/pages.spec.ts`、`tests/e2e/viewport.spec.ts`

**Interfaces:**
- Consumes: Task 1 の `Profile['headline']`
- Produces（e2e と reviewer が使うマークアップ）: `main > div.top > div.hero` と `main > div.top > div.intro`。`.intro` の中は `div.art`、`h1`、`p.headline`、`p.muted`（tagline）、`nav.links`、`ul.links` の順

- [ ] **Step 1 (3.1 RED):** `pages.spec.ts` に、`profile/{lang}.yaml` から `^headline: (.+)$` と `^tagline: (.+)$` を取り出すヘルパー（`parseProfileLine(lang, key)`）と、両ロケールの検査「`main h1` の次の兄弟要素の文字列が headline、その次が tagline」を足す（`h1.evaluate(el => [el.nextElementSibling?.textContent, el.nextElementSibling?.nextElementSibling?.textContent])`）。赤を確かめる

- [ ] **Step 2 (3.1 GREEN):** `index.astro` の `<h1>` の直後に `<p class="headline">{profile.headline}</p>` を置く。緑を確かめてコミット `feat: トップの名前の直後に仕事の一行を出す`

- [ ] **Step 3 (3.2 RED):** `viewport.spec.ts`
  - 既存の初見表示の検査は、トップ用の画面の一覧を `const topViewports = [...viewports, { width: 1024, height: 768 }]` にして回す（個別ページの検査は `viewports` のまま）。セレクタを `main h1`（名前）と `main .intro > p.muted`（肩書）に差し替え、`main p.headline`（仕事の一行）を足す。**この時点ではまだ `.intro` が無いので、肩書のセレクタは赤になる。それで正しい**
  - 横並びの検査を 4 つ足す。右側の文字列は `main h1, main p.headline, main .intro > p.muted, main nav.links a, main ul.links a`
    - `1280×720 /ja/`: 代表写真の `getBoundingClientRect().right` が右側の文字列のすべての `left` より小さい。代表写真の幅が `main` の content box の幅の半分以上
    - `1024×768 /en/`: 代表写真の `right` < `main h1` の `left`
    - `1023×768 /ja/`: 代表写真の `bottom` ≤ `main h1` の `top`
    - `390×844 /ja/`: 代表写真の `bottom` ≤ `main h1` の `top`、かつ `scrollWidth − clientWidth ≤ 0`

  `pnpm build` の後 `pnpm e2e tests/e2e/viewport.spec.ts` で、1280 と 1024 の横並びの検査が赤、1023 と 390 は緑になることを確かめ、報告に書く

- [ ] **Step 4 (3.2 GREEN):** `index.astro` の本文を包む

```astro
<BaseLayout>
  <div class="top">
    <div class="hero"><PhotoPicture photo={featured} lang={lang} variant="full" priority /></div>
    <div class="intro">
      <div class="art"><PixelArt rows={camera} /></div>
      <h1>{profile.name}</h1>
      <p class="headline">{profile.headline}</p>
      <p class="muted">{profile.tagline}</p>
      <nav class="links" …>（そのまま）</nav>
      <ul class="links">（そのまま）</ul>
    </div>
  </div>
</BaseLayout>
```

`<style>` に足す（既存の `.hero` の規則は 64rem 未満のためにそのまま残す）:

```css
  /* 64rem 以上では写真を左、文字列を右に並べる（design D5）。範囲構文は使わない */
  @media (min-width: 64rem) {
    .top {
      display: grid;
      grid-template-columns: 3fr 2fr;
      align-items: center;
      gap: 2rem;
    }

    .hero {
      /* 写真の下に文字が来ないので、ヘッダー（約 4rem）と main の上下の余白（2rem × 2）に
         2rem の余裕を足した 10rem だけを引く */
      --photo-max-height: max(12rem, 100svh - 10rem);
      margin-bottom: 0;
    }
  }
```

（design D5 は `calc(100svh - 10rem)` と書くが、既存の `max(12rem, …)` の下限を外すと「極端に低い画面でも 0 にならない」の要求が 64rem 以上で崩れるので、下限を残す。これは報告に裁定として書く。）

`pnpm e2e` 全体が緑（既存の初見表示・写真の縦横比・横スクロール・幅いっぱいの検査を含む）。横スクロールが出たら落とし穴 9 の対処をする。コミット `feat: 64rem 以上のトップを写真と文字列の横並びにする`

---

### Task 4: メタデータと共有カード（tasks 4.1・4.2、design D1・D6）

**Files:**
- Modify: `src/layouts/BaseLayout.astro`
- Modify: `src/pages/[lang]/photos/[slug].astro`
- Test: `tests/e2e/pages.spec.ts`

**Interfaces:**
- Consumes: Task 1 の `Profile['headline']`、Task 3 の `parseProfileLine`
- Produces: `BaseLayout` の `Props` に `ogPhoto?: PhotoEntry`（`src/content/schemas` の型）

- [ ] **Step 1 (4.1 RED):** `pages.spec.ts` の `for (const path of pagePaths)` の検査で、`meta[name="description"]` の `content` が `parseProfileLine(lang, 'headline')` と一致することを足す（件数 1 の検査の隣）。og:description が description と一致することは既存の「SNS 共有カード」の検査が見ている。赤を確かめる

- [ ] **Step 2 (4.1 GREEN):** `BaseLayout.astro` の `const description = pathLocale ? profile.tagline : null;` を `profile.headline` にする。緑を確かめてコミット `feat: description を仕事の一行にする`

- [ ] **Step 3 (4.2 RED):** `pages.spec.ts` の `describe('SNS 共有カード')` に足す。代表ではない写真の slug は、`src/content/photos/*.yaml`（ドットファイルを除く）のうち `^featured: true$` の行を持たないものの先頭（`paths.ts` の `photoIdFromEntry` でファイル名から slug を導く）

```ts
  test('代表ではない写真の個別ページの共有カードは、その写真から作られる', async ({ page }) => {
    await page.goto('./ja/');
    const topImage = await page.locator('meta[property="og:image"]').getAttribute('content');
    await page.goto(`./ja/photos/${nonFeaturedSlug}/`);
    const og = page.locator('meta[property="og:image"]');
    const ogImage = await og.getAttribute('content');
    expect(ogImage).toBeTruthy();
    expect(ogImage).not.toBe(topImage);
    // 代替テキストはページ本文のその写真の alt と同じ（写真データの alt.ja）
    const alt = await page.locator('figure picture img').getAttribute('alt');
    await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute('content', alt ?? '');
    const response = await page.request.get(new URL(ogImage ?? '').pathname);
    expect(response.status()).toBe(200);
    // 画像そのものが 1200×630 であること（meta の値だけでなく実物を見る）
    const size = await page.evaluate(async (src) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      return [img.naturalWidth, img.naturalHeight];
    }, new URL(ogImage ?? '').pathname);
    expect(size).toEqual([1200, 630]);
  });

  test('写真以外のページの共有カードは、トップと同じ代表写真から作られる', async ({ page }) => {
    await page.goto('./en/');
    const topImage = await page.locator('meta[property="og:image"]').getAttribute('content');
    const topAlt = await page.locator('meta[property="og:image:alt"]').getAttribute('content');
    for (const path of ['./en/career/', './en/photos/']) {
      await page.goto(path);
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', topImage ?? '');
      await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute('content', topAlt ?? '');
    }
  });
```

（`page.evaluate` の `Image` の取得は同一オリジンのパスなので 127.0.0.1 の preview から読める。）1 件目が赤、2 件目が緑（今も全ページが代表写真）であることを確かめる。2 件目は変異 (h) の逆向き（`ogPhoto` を全ページに渡す）を捕まえる番人として置く

- [ ] **Step 4 (4.2 GREEN):** `BaseLayout.astro`

```ts
import type { PhotoEntry } from '../content/schemas';

interface Props {
  title?: string;
  showNav?: boolean;
  /** 共有カードに使う写真。写真の個別ページだけが渡す。省略時は代表写真（design D6） */
  ogPhoto?: PhotoEntry;
}
const { title, showNav, ogPhoto } = Astro.props;
…
if (pathLocale) {
  const cardPhoto = ogPhoto ?? (await getFeaturedPhoto());
  const img = await getImage({ src: cardPhoto.data.image, … });
  ogImage = { src: absoluteUrl(img.src, Astro.site), alt: cardPhoto.data.alt[lang] };
}
```

`photos/[slug].astro` の `<BaseLayout title={…}>` に `ogPhoto={photo}` を足す。`pnpm e2e` 全体・`pnpm lint` / `pnpm typecheck` が緑。コミット `feat: 写真の個別ページの共有カードをその写真から作る`

---

### Task 5: 文書（tasks 5.1）

**Files:** Modify: `docs/content-authoring.md`

- [ ] **Step 1:** 「経歴（日英の対応づけ）」節に次の 3 項目を足す（既存の箇条書きと同じ文体）
  - `highlights` は経歴ページの `Career` 見出しの直下に出る要約。**1〜4 件で、日英の件数が一致しないとビルドが落ちる**。文言は手で書く（職歴の bullets から自動では作らない）
  - 資格の `group` は任意。同じ `group` の資格は経歴ページで 1 行（期間 · グループ名（件数））にまとまり、開くと内訳が見える。**名前は訳語でよい（`AWS 認定` / `AWS Certifications`）が、付け方（どの位置の資格にどのグループを付けるか）は日英でそろえないとビルドが落ちる**。空文字列は不可
  - プロフィールの `headline` は必須。トップの名前の直下と、全ページの `<meta name="description">`（共有カードの説明も同じ）に使われる。`tagline` はトップの `headline` の下にだけ出る

  「経歴」節の見出しが資格・プロフィールを含むことが分かるよう、`headline` の項目は節の末尾に「プロフィール」と明記して置く。コミット `docs: headline・highlights・資格の group の書き方を足す`

---

### Task 6: 番人の確認と全コマンド（tasks 6.1・6.2）

- [ ] **Step 1 (6.1):** `docs/harness/README.md` §7 の隔離実行の手順で、次の 9 つの変異をそれぞれ当て、「変異なしで緑 → 変異ありで狙った検査が赤」を記録する。単体の変異は `pnpm --dir "$EXP" test`、e2e の変異は `pnpm --dir "$EXP" e2e`（ポート 4399 の空きを確かめてから。1 本ずつ）

| 変異 | 当てる場所 | 赤になるはずの検査 |
|---|---|---|
| (a) `headline` を任意にする（`nonEmpty.optional()`） | `schemas.ts` | schemas.test の headline を欠く件 |
| (b) `highlights` の `.max(4)` を外す | `schemas.ts` | schemas.test の 5 件で失敗する件 |
| (c) 件数の検査のキーから `'highlights'` を外す | `validate.ts` | validate.test の highlights の件数差 |
| (d) `group` の比較を有無だけにする（`firstIndexes` を `c.group === undefined ? -1 : 0` にする） | `validate.ts` | validate.test の分け方の件 |
| (e) グループを最も古い位置に置く（`groupCertifications` で、2 件目以降が来たら入れ物を entries の末尾へ移す） | `career.ts` | career.test の位置の件、e2e の束ねの位置は見ていないので単体だけでよい |
| (f) 期間が同じ表記でも ` – ` でつなぐ | `career.ts` | career.test の同じ月の件 |
| (g) `@media (min-width: 64rem)` のブロックを外す | `index.astro` | viewport.spec の 1280 と 1024 の横並び |
| (h) `ogPhoto` を無視して常に代表写真を使う | `BaseLayout.astro` | pages.spec の代表ではない写真の件 |
| (i) `description` を `profile.tagline` に戻す | `BaseLayout.astro` | pages.spec の description が headline と一致する件 |

結果（各変異の失敗件数と検査名）を `tasks.md` の 6.1 の下に 1 行ずつ書き、チェックを付けてコミット `test: 新しい番人に変異を当てて落ちることを確かめる`

- [ ] **Step 2 (6.2):** 作業ツリーで `pnpm lint` / `pnpm typecheck` / `pnpm test` / `pnpm build` / `pnpm e2e` をすべて実行し、各コマンドの結果の行（件数・エラー数）を報告に添える。チェックを付けてコミット `test: 全コマンドを実行して緑を確かめる`

---

## Self-Review（計画作成時）

- spec の網羅: content-schema（headline 必須・highlights 1〜4・group 任意/空不可・件数一致・group の付き方）→ Task 1。profile-and-career（仕事の一行・横並び 4 Scenario・初見表示 1024×768・要約・束ね・位置・期間・開く）→ Task 2・3。layout-shell（description = headline、写真の個別ページのカード、写真以外は代表写真）→ Task 4。photo-pipeline（横並びの列の中での上限・右端が名前の左）→ Task 3 の 1280×720 と既存の縦横比の検査
- 「期間が 1 か月だけのグループ」「group 名が訳語で違う」は単体で、「資格を束ねる」「内訳を開く」は e2e で見る
- 404 のメタデータは変えない（`pathLocale` が無ければ `ogPhoto` も使われない）
