# real-profile-data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** プロフィールと経歴のサンプルデータを PO の実データに差し替え、その前に `skills` の日英検証を足す。

**Architecture:** 検証は既存の `validateCareerParity` を拡張する（新しい関数は作らない）。データは `src/content/{profile,career}/{ja,en}.yaml` の 4 ファイルを値だけ差し替える。スキーマ・ルーティング・レイアウトは変えない。

**Tech Stack:** Astro 7 / TypeScript / Vitest 5 / Biome 2 / Playwright。パッケージマネージャは pnpm（npm / npx は使わない）。

**Spec:** `openspec/changes/real-profile-data/`（proposal.md / specs/content-schema/spec.md / design.md / tasks.md）

## Global Constraints

- 作業ツリーは `.claude/worktrees/real-profile-data`、ブランチは `feature/real-profile-data`。ここから出ない
- テストなしのコミットは禁止。RED → GREEN → REFACTOR の順を守る
- テストの削除・skip・期待値の書き換えでテストを通さない
- コミットメッセージは日本語で、先頭に種別（`feat:` / `fix:` / `test:` / `docs:` / `chore:` / `refactor:`）を付ける。末尾に `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`
- `openspec/changes/real-profile-data/tasks.md` のチェックは、そのタスクの実装と同じコミットに含める
- **YAML の値は本人の実データである。この計画に書かれた文字列をそのまま使い、創作・意訳・追記をしない**
- `certifications` と `achievements` は日英で**同じ順番**に並べる（表示側が日付で安定ソートするため、同じ日付の項目は記述順で対応づく）
- 日英の件数: `experience` 4 / `skills` 5 カテゴリ / `certifications` 14 / `achievements` 6

## File Structure

| ファイル | 責務 | 変更 |
|---|---|---|
| `src/lib/validate.ts` | Zod で表せない集合全体の制約 | `validateCareerParity` に `skills` の検証を足す |
| `tests/unit/validate.test.ts` | 上の単体テスト | `describe('validateCareerParity')` にケースを足す |
| `src/content/profile/ja.yaml` / `en.yaml` | 名前・一行紹介・連絡先 | 値を差し替える |
| `src/content/career/ja.yaml` / `en.yaml` | 職歴・スキル・資格・実績 | 値を差し替える |

**レビューの単位（`.claude/rules/review.md`）**: Task 1 は共有の検証ロジックに触るので単独でレビューする。Task 2 と 3 はデータだけなのでまとめて 1 回。最後にブランチ全体のレビューを 1 回。

---

### Task 1: skills の日英検証

**Files:**
- Modify: `src/lib/validate.ts`（`validateCareerParity`）
- Test: `tests/unit/validate.test.ts`（既存の `describe('validateCareerParity')` 内）

**Interfaces:**
- Consumes: `Career`（`src/content/schemas.ts`）。`skills` は `Record<string, string[]>`
- Produces: `validateCareerParity(ja, en): string[]` のシグネチャは変えない。エラー文字列が増えるだけ

対応づけは `Object.entries` の並び順で行う（カテゴリ名は訳語になるのでキーでは対応づけられない。理由と代替案は design.md D1）。

- [ ] **Step 1: 失敗するテストを書く**

`tests/unit/validate.test.ts` の `describe('validateCareerParity', ...)` の中、既存の 2 つの `it` の後に足す。

```ts
  it('skills のカテゴリ数が日英で違えば報告する', () => {
    const en: Career = { ...base, skills: { lang: ['ts'], cloud: ['aws'] } };
    const errors = validateCareerParity(base, en);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('skills');
    expect(errors[0]).toContain('1');
    expect(errors[0]).toContain('2');
  });

  it('対応するカテゴリの項目数が日英で違えば、何番目かを添えて報告する', () => {
    const ja: Career = { ...base, skills: { 言語: ['ts', 'py'], クラウド: ['aws'] } };
    const en: Career = { ...base, skills: { Languages: ['ts'], Cloud: ['aws'] } };
    const errors = validateCareerParity(ja, en);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('skills');
    expect(errors[0]).toContain('1');
    expect(errors[0]).toContain('言語');
    expect(errors[0]).toContain('Languages');
  });

  it('カテゴリ名が訳語で違っても、数が合っていれば問題なし', () => {
    const ja: Career = { ...base, skills: { 言語: ['ts'] } };
    const en: Career = { ...base, skills: { Languages: ['ts'] } };
    expect(validateCareerParity(ja, en)).toEqual([]);
  });

  it('カテゴリ数が違うときは、各カテゴリの項目数の比較まで進まない', () => {
    const en: Career = { ...base, skills: {} };
    expect(validateCareerParity(base, en)).toHaveLength(1);
  });
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `pnpm exec vitest run tests/unit/validate.test.ts`
Expected: 新しい 4 件のうち少なくとも 3 件が FAIL（`カテゴリ名が訳語で〜` は現状でも通る）。「カテゴリ数が日英で違えば報告する」は `expect(errors).toHaveLength(1)` が `0` で落ちる。

- [ ] **Step 3: 実装する**

`src/lib/validate.ts` の `validateCareerParity` を次にする。

```ts
/** 日英の経歴で、並べて表示する配列の件数が一致すること */
export function validateCareerParity(ja: Career, en: Career): string[] {
  const errors: string[] = [];
  for (const key of ['experience', 'certifications', 'achievements'] as const) {
    if (ja[key].length !== en[key].length) {
      errors.push(`${key} の件数が日英で違う（ja: ${ja[key].length}, en: ${en[key].length}）`);
    }
  }

  // skills は配列ではなくカテゴリ名から項目への対応。カテゴリ名は訳語になるので
  // キーでは対応づけられず、表示側（career.astro）と同じ Object.entries の順で対応づける
  const jaSkills = Object.entries(ja.skills);
  const enSkills = Object.entries(en.skills);
  if (jaSkills.length !== enSkills.length) {
    errors.push(
      `skills のカテゴリ数が日英で違う（ja: ${jaSkills.length}, en: ${enSkills.length}）`,
    );
    return errors;
  }
  for (const [index, [jaName, jaItems]] of jaSkills.entries()) {
    const [enName, enItems] = enSkills[index];
    if (jaItems.length !== enItems.length) {
      errors.push(
        `skills の ${index + 1} 番目のカテゴリの項目数が日英で違う（${jaName}: ${jaItems.length}, ${enName}: ${enItems.length}）`,
      );
    }
  }

  return errors;
}
```

カテゴリ数が違うときに `return` しているのは、ずれた対応で項目数を比べても意味のあるエラーにならないため（テスト「カテゴリ数が違うときは〜進まない」がこれを守る）。

- [ ] **Step 4: テストが通ることを確認する**

Run: `pnpm test`
Expected: PASS（既存 126 件 + 新規 4 件）

- [ ] **Step 5: コミット**

```bash
git add src/lib/validate.ts tests/unit/validate.test.ts openspec/changes/real-profile-data/tasks.md
git commit -m "feat: skills の日英の件数を検証する"
```

`tasks.md` の 1.1 と 1.2 にチェックを入れてから `git add` すること。

---

### Task 2: プロフィールの実データ

**Files:**
- Modify: `src/content/profile/ja.yaml`, `src/content/profile/en.yaml`

- [ ] **Step 1: ja.yaml を書く**

```yaml
name: Josuke Yamane
tagline: コネクテッドカーのデータ基盤を率いるプロダクトオーナー
links:
  - label: GitHub
    url: https://github.com/joe-yama
    kind: github
  - label: LinkedIn
    url: https://www.linkedin.com/in/jyamane/
    kind: linkedin
```

- [ ] **Step 2: en.yaml を書く**

```yaml
name: Josuke Yamane
tagline: Product Owner — Connected-Vehicle Data Platform
links:
  - label: GitHub
    url: https://github.com/joe-yama
    kind: github
  - label: LinkedIn
    url: https://www.linkedin.com/in/jyamane/
    kind: linkedin
```

- [ ] **Step 3: ビルドが通ることを確認する**

Run: `pnpm build`
Expected: 12 page(s) built。`kind: linkedin` はスキーマの enum にあるので通る

- [ ] **Step 4: コミット**

```bash
git add src/content/profile/ja.yaml src/content/profile/en.yaml openspec/changes/real-profile-data/tasks.md
git commit -m "feat: プロフィールを実データにする"
```

---

### Task 3: 経歴の実データ

**Files:**
- Modify: `src/content/career/ja.yaml`, `src/content/career/en.yaml`

- [ ] **Step 1: ja.yaml を書く**

```yaml
experience:
  - from: "2025-04"
    organization: トヨタ自動車株式会社
    role: エンジニアリング標準化リード（全社横断）
    bullets:
      - 100 名超のエンジニアを対象に、プロジェクト横断の開発標準化機能を立ち上げ、リードしている
  - from: "2023-02"
    organization: トヨタ自動車株式会社
    role: プロダクトオーナー（コネクテッドカー データ基盤）
    bullets:
      - 20 か国以上・1,000 万台超のコネクテッドカーを対象とする大規模データ基盤のプロダクトオーナー
  - from: "2019-04"
    to: "2023-02"
    organization: トヨタ自動車株式会社
    role: コネクテッドサービス開発リード
    bullets:
      - B2C 向けコネクテッドサービスのクラウドバックエンド開発を主導
  - from: "2018-04"
    to: "2019-04"
    organization: トヨタ自動車株式会社
    role: ビッグデータ解析エンジニア
    bullets:
      - 市場を走行する車両データの統計解析
skills:
  クラウド: [AWS, サーバーレスアーキテクチャ, CI/CD]
  データ基盤: [大規模データ処理, データ基盤設計, ストリーム処理]
  機械学習: [自然言語処理, 単語分散表現, 統計解析]
  プロダクト・プロセス: [プロダクトオーナー, スクラム, 開発標準化]
  プログラミング言語: [Python, SQL]
certifications:
  - date: "2026-05-01"
    name: TOEIC Listening & Reading 900点
  - date: "2025-10-01"
    name: AWS Certified AI Practitioner
  - date: "2025-10-01"
    name: AWS Certified CloudOps Engineer - Associate
  - date: "2025-10-01"
    name: AWS Certified Data Engineer - Associate
  - date: "2025-10-01"
    name: AWS Certified Developer - Associate
  - date: "2025-10-01"
    name: AWS Certified DevOps Engineer - Professional
  - date: "2025-10-01"
    name: AWS Certified Machine Learning Engineer - Associate
  - date: "2025-10-01"
    name: AWS Certified Advanced Networking - Specialty
  - date: "2025-10-01"
    name: AWS Certified Security - Specialty
  - date: "2025-10-01"
    name: AWS Certified Machine Learning - Specialty
  - date: "2025-09-01"
    name: AWS Certified Cloud Practitioner
  - date: "2022-05-01"
    name: AWS Certified Solutions Architect - Professional
  - date: "2020-10-01"
    name: AWS Certified Solutions Architect - Associate
  - date: "2020-07-01"
    name: Licensed Scrum Master (Scrum Inc.)
achievements:
  - date: "2026-05-01"
    name: AWS All Certifications Engineers 認定
    kind: award
  - date: "2018-03-01"
    name: 双方向性と非線形性を考慮した上位語・下位語関係の推定（言語処理学会 第24回年次大会）
    kind: talk
  - date: "2017-08-31"
    name: "特許: 話題推定学習装置及び話題推定学習方法（特開2017-151838）"
    kind: other
  - date: "2016-12-01"
    name: Distributional Hypernym Generation by Jointly Learning Clusters and Projections（COLING 2016 口頭発表）
    kind: talk
    url: https://aclanthology.org/C16-1176/
  - date: "2016-03-01"
    name: 言語処理学会 若手奨励賞
    kind: award
  - date: "2016-03-01"
    name: 上位語・下位語の射影関係とそのクラスタの同時学習（言語処理学会 第22回年次大会）
    kind: talk
```

- [ ] **Step 2: en.yaml を書く**

```yaml
experience:
  - from: "2025-04"
    organization: Toyota Motor Corporation
    role: Engineering Dev-Standards Lead (Cross-Project)
    bullets:
      - Founded and lead a cross-project engineering-standards function for 100+ engineers
  - from: "2023-02"
    organization: Toyota Motor Corporation
    role: Product Owner — Connected-Vehicle Data Platform
    bullets:
      - Product owner for a large-scale data platform covering 10M+ connected vehicles in 20+ countries
  - from: "2019-04"
    to: "2023-02"
    organization: Toyota Motor Corporation
    role: Connected Services Development Lead
    bullets:
      - Led cloud backend development for B2C connected services
  - from: "2018-04"
    to: "2019-04"
    organization: Toyota Motor Corporation
    role: Big Data Analytics Engineer
    bullets:
      - Statistical analysis of in-market vehicle data
skills:
  Cloud: [AWS, Serverless architecture, CI/CD]
  Data platform: [Large-scale data processing, Data platform design, Stream processing]
  Machine learning: [Natural language processing, Word embeddings, Statistical analysis]
  Product & process: [Product ownership, Scrum, Engineering standards]
  Programming languages: [Python, SQL]
certifications:
  - date: "2026-05-01"
    name: "TOEIC Listening & Reading: 900"
  - date: "2025-10-01"
    name: AWS Certified AI Practitioner
  - date: "2025-10-01"
    name: AWS Certified CloudOps Engineer - Associate
  - date: "2025-10-01"
    name: AWS Certified Data Engineer - Associate
  - date: "2025-10-01"
    name: AWS Certified Developer - Associate
  - date: "2025-10-01"
    name: AWS Certified DevOps Engineer - Professional
  - date: "2025-10-01"
    name: AWS Certified Machine Learning Engineer - Associate
  - date: "2025-10-01"
    name: AWS Certified Advanced Networking - Specialty
  - date: "2025-10-01"
    name: AWS Certified Security - Specialty
  - date: "2025-10-01"
    name: AWS Certified Machine Learning - Specialty
  - date: "2025-09-01"
    name: AWS Certified Cloud Practitioner
  - date: "2022-05-01"
    name: AWS Certified Solutions Architect - Professional
  - date: "2020-10-01"
    name: AWS Certified Solutions Architect - Associate
  - date: "2020-07-01"
    name: Licensed Scrum Master (Scrum Inc.)
achievements:
  - date: "2026-05-01"
    name: AWS All Certifications Engineers
    kind: award
  - date: "2018-03-01"
    name: Hypernym-Hyponym Relation Estimation Considering Bidirectionality and Nonlinearity (ANLP 2018)
    kind: talk
  - date: "2017-08-31"
    name: "Patent: Topic Estimation Learning Device and Method (JP 2017-151838A)"
    kind: other
  - date: "2016-12-01"
    name: Distributional Hypernym Generation by Jointly Learning Clusters and Projections (COLING 2016, oral)
    kind: talk
    url: https://aclanthology.org/C16-1176/
  - date: "2016-03-01"
    name: ANLP Young Researcher Award
    kind: award
  - date: "2016-03-01"
    name: Joint Learning of Projections and Clusters for Hypernym-Hyponym Relations (ANLP 2016)
    kind: talk
```

- [ ] **Step 3: ビルドが通ることを確認する**

Run: `pnpm build`
Expected: 12 page(s) built。Task 1 の検証が効いているので、件数がずれていればここで落ちる

- [ ] **Step 4: 検証が本当に番人か確かめる（変異実験。コミットしない）**

`src/content/career/en.yaml` の `skills` から `Programming languages` の行を一時的に消して `pnpm build` を実行し、`skills のカテゴリ数が日英で違う（ja: 5, en: 4）` を含むエラーでビルドが失敗することを確認する。確認したら消した行を戻し、`git diff --stat` が空になることを確かめる。

- [ ] **Step 5: コミット**

```bash
git add src/content/career/ja.yaml src/content/career/en.yaml openspec/changes/real-profile-data/tasks.md
git commit -m "feat: 経歴を実データにする"
```

---

### Task 4: 実測

**Files:** なし（実行と報告のみ）

- [ ] **Step 1: 5 つのコマンドを流す**

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm e2e
```
Expected: すべて成功。出力（件数の行）を報告に貼る

- [ ] **Step 2: サンプルデータの残骸が無いことを確認する**

```bash
grep -rn "サンプル\|Sample Inc\|例示\|hello@example.com\|応用情報" dist/ || echo "残骸なし"
```
Expected: `残骸なし`

- [ ] **Step 3: 件数を実測する**

```bash
grep -c "date:" src/content/career/ja.yaml src/content/career/en.yaml
```
Expected: 日英とも 20（資格 14 + 実績 6）

- [ ] **Step 4: tasks.md の 3.1 と 3.2 にチェックを入れてコミット**

```bash
git add openspec/changes/real-profile-data/tasks.md
git commit -m "docs: real-profile-data の実測を記録する"
```

UI の実測（日英 4 ページの表示）はコントローラーが preview を起こし、reviewer が Playwright MCP で行う。implementer は行わない。
