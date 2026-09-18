# ポートフォリオサイト v1 実装計画 — Change 1: project-foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. 実装は `subagent_type: implementer`（Sonnet）、レビューは `subagent_type: reviewer`（Opus）で起こす。切り替え条件と手順は `.claude/rules/review.md`。

**Goal:** pnpm + Astro のプロジェクト土台を作り、内容データ（profile / career / photos）のスキーマと検証、日英ルーティングの骨格、lint / typecheck / test / build の CI を動かす。

**Architecture:** Astro の静的ビルド（配信 JavaScript ゼロ）。内容は `src/content/` の YAML を Astro コンテンツコレクション（Zod）で読み、スキーマで表現できない制約は `src/lib/validate.ts` の純関数で検証してビルドを止める。Zod スキーマと検証関数は `astro:*` に依存しない純 TypeScript に分け、Vitest で単体テストする。ページはこの change では言語別トップの最小版だけ作り、見た目は Change 2 で付ける。

**Tech Stack:** pnpm 12、Node 26（`.node-version`）、Astro（TypeScript strict）、`astro/zod`、Biome、Vitest、`@astrojs/check`、GitHub Actions。

**Spec:** `docs/superpowers/specs/2026-09-17-portfolio-site-design.md`（§2, §4, §5, §8, §8.1, §9 を実装する）

## v1 全体のロードマップ（各 change = GitHub Issue 1 つ = PR 1 つ）

この文書は Change 1 の詳細計画。Change 2 以降は前の change がマージされた後、実際に入った Astro のバージョンと API を確認してから同じ形式で計画を書く（`docs/superpowers/plans/YYYY-MM-DD-<change>.md`）。

| # | change 名 | スコープ | 主な spec 節 |
|---|---|---|---|
| 1 | `project-foundation` | 本計画。ツール一式、スキーマ、検証、i18n 骨格、ハーネス反映、CI | §5, §8, §8.1, §9（CI） |
| 2 | `layout-shell` | `BaseLayout`（`<html lang>`、hreflang、モノトーン配色、ダーク/ライト追従）、DotGothic16 の同梱、ヘッダー（ロゴ・ナビ・言語切り替え）、ドット絵、404 ページ。モックを PO が確認 | §4（404、言語切り替え）, §7 |
| 3 | `photo-pipeline` | Release `photos` の作成、`pnpm photo:add`（EXIF → upload → YAML 雛形）、`photos` コンテンツコレクションの定義と `getPhotos`（Change 1 から移管。空ディレクトリの glob ローダーが `[WARN]` を出すため）、ギャラリー `/photos/`、個別ページ `/photos/<slug>/`、トップの代表写真、`<Picture>` の出力設定 | §4（photos）, §5.1, §5.3, §6 |
| 4 | `profile-and-career` | トップの完成（名前、一行紹介、連絡先、導線）、`/career/`（職歴・スキル・資格・実績） | §4（トップ、career）, §5.2 |
| 5 | `deploy-and-e2e` | Playwright + axe の e2e、ビルド後 HTML の内部リンク検査、GitHub Pages デプロイ workflow、`public/CNAME` と `site` の独自ドメイン化 | §8（表示の検証、リンク切れ）, §9 |

Change 1 の完了時点で、`pnpm build` が日英のトップ（名前と一行紹介のみ）と `/` → `/ja/` のリダイレクトを出力し、CI が PR で緑になる。

## Global Constraints

- パッケージマネージャは **pnpm** のみ。`npm` / `npx` はコマンド・スクリプト・ドキュメントのどこにも書かない
- 依存は spec §9 の一覧（astro、@astrojs/check + typescript、@biomejs/biome、vitest、@playwright/test + axe-core、exifr）に限る。この change で入れるのは astro、@astrojs/check、typescript、@biomejs/biome、vitest の 5 つ。他が必要になったら PO に用途・ライセンス・メンテ状況を 1 行ずつ提示して止まる
- 配信 JavaScript ゼロ、外部通信ゼロ（フォント・画像・スクリプトは同一オリジン）。この change では `<script>` を 1 つも書かない
- 全ページは `/ja/` と `/en/` の下。`/` は `/ja/` へ静的リダイレクト
- 写真の `image` は `https://github.com/joe-yama/portfolio/releases/download/photos/<slug>.jpg` の形式のみ
- テストなしのコミット禁止。RED → GREEN → REFACTOR。テストの skip / 削除 / 期待値の書き換えで通すことは禁止（`.claude/rules/testing.md`）
- コミットメッセージは日本語、先頭に `feat:` / `test:` / `chore:` / `docs:` など。末尾に system-reminder の attribution 行を付ける。`git commit` はサンドボックス外（`dangerouslyDisableSandbox: true`）で実行する
- `.claude/settings.json` / `.claude/hooks/` は Write / Edit ツールで編集する（サンドボックス内 Bash からは書けない）
- ブロッカー・方針変更・実装開始・レビュー結果は change の GitHub Issue にコメントする（`.claude/rules/git.md`）。`gh` の書き込み前に `gh api user --jq .login` が `joe-yama` であることを確認する

## 実行前の前提（実装タスクではない）

1. PO がこの計画を承認している
2. `/opsx:propose project-foundation` で `openspec/changes/project-foundation/` と GitHub Issue が作られ、PO が proposal を承認している
3. `superpowers:using-git-worktrees` で `feature/project-foundation` ブランチの worktree を作り、その中で作業する
4. Issue に「実装開始」をコメントしてから Task 1 に入る

## 確認ポイント（インストール後に必ず実物で確認すること）

計画は 2026-09-17 時点の知識で書いている。Task 1 でインストールした Astro のバージョンに対して次を `node_modules/astro/` の型定義か公式ドキュメントで確認し、違えば計画ではなく実装を合わせ、差分を Issue にコメントする。

- コンテンツコレクションの定義ファイルが `src/content.config.ts`、ローダーが `import { glob } from 'astro/loaders'`
- `astro/zod` から `z` を import できる
- `i18n.routing.prefixDefaultLocale` と `redirectToDefaultLocale` の名前。静的ビルドで `dist/index.html` に `/ja/` へのリダイレクトが出ること
- `src/pages/[lang]/index.astro` のような動的セグメントを i18n 設定と併用できること（できなければ `src/pages/ja/` と `src/pages/en/` の 2 ディレクトリに分け、共通部分をコンポーネントに寄せる）
- Vitest 設定で `import { getViteConfig } from 'astro/config'` が使えること

## ファイル構成（この change で作る・変えるもの）

```
package.json                 # pnpm スクリプト、packageManager、依存
pnpm-lock.yaml
pnpm-workspace.yaml          # onlyBuiltDependencies（esbuild, sharp）
.node-version                # 26.8.2
.gitignore                   # .astro/ を追加
astro.config.ts              # site、i18n、image.domains
tsconfig.json                # astro/tsconfigs/strict
biome.json                   # lint + format
vitest.config.ts
src/content.config.ts        # コレクション定義（loader + schema）
src/content/schemas.ts       # Zod スキーマと型（純 TS。astro:* に依存しない）
src/content/profile/ja.yaml, en.yaml
src/content/career/ja.yaml, en.yaml
src/lib/validate.ts          # featured / order / image URL / 日英件数の検証（純 TS）
src/lib/i18n.ts              # ロケール判定と言語切り替え URL（純 TS）
src/lib/content.ts           # getCollection を包み、検証してから返す（astro:content に依存）
src/pages/[lang]/index.astro # 最小のトップ（名前と一行紹介）
tests/unit/schemas.test.ts
tests/unit/validate.test.ts
tests/unit/i18n.test.ts
.github/workflows/ci.yml
.claude/rules/testing.md     # コマンド節
.claude/hooks/lint-on-edit.sh, test-on-stop.sh   # detect 関数を確定コマンドに
CLAUDE.md                    # コマンド表
docs/harness/README.md       # §5-5 を完了扱いに
```

責務の分け方: `schemas.ts` は「形」、`validate.ts` は「形で表せない制約」、`content.ts` は「Astro から読んで検証を呼ぶ入口」、ページは `content.ts` だけを使う。Vitest は `schemas.ts` / `validate.ts` / `i18n.ts` を直接テストし、`content.ts` とページはビルドで確認する。

---

### Task 1: pnpm + Astro の初期化とビルド確認

**Files:**
- Create: `package.json`, `pnpm-workspace.yaml`, `.node-version`, `astro.config.ts`, `tsconfig.json`, `src/pages/index.astro`（仮。Task 6 で削除）
- Modify: `.gitignore`

**Interfaces:**
- Produces: `pnpm build` / `pnpm typecheck` / `pnpm dev` / `pnpm preview` のスクリプト。以降の全タスクがこれを使う

- [ ] **Step 1: `.node-version` と `package.json` を作る**

```bash
printf '26.8.2\n' > .node-version
```

`package.json`:

```json
{
  "name": "portfolio",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@12.4.2",
  "engines": {
    "node": ">=26"
  },
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "typecheck": "astro check"
  }
}
```

`pnpm-workspace.yaml`（pnpm 10 以降は依存のビルドスクリプトを既定で無効にするため、sharp と esbuild を明示的に許可する）:

```yaml
onlyBuiltDependencies:
  - esbuild
  - sharp
```

- [ ] **Step 2: 依存を入れる（`pnpm install` は毎回確認される。PO 承認済みの 3 つ）**

```bash
pnpm add astro
pnpm add -D @astrojs/check typescript
```

Expected: `pnpm-lock.yaml` が生成され、`node_modules/astro` ができる。「Ignored build scripts」の警告が出ないこと（出たら `pnpm-workspace.yaml` の綴りを確認）。

- [ ] **Step 3: 設定ファイルを書く**

`astro.config.ts`:

```ts
import { defineConfig } from 'astro/config';

export default defineConfig({
  // 独自ドメイン決定時（Change 5）に置き換える。hreflang の絶対 URL 生成に必要
  site: 'https://joe-yama.github.io',
  output: 'static',
  trailingSlash: 'always',
  i18n: {
    defaultLocale: 'ja',
    locales: ['ja', 'en'],
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: true,
    },
  },
  image: {
    // 写真は GitHub Releases の URL（github.com → objects.githubusercontent.com にリダイレクト）
    domains: ['github.com'],
  },
});
```

`tsconfig.json`:

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist", "node_modules"]
}
```

仮ページ `src/pages/index.astro`（ビルドが通ることだけを確認する。Task 6 で `[lang]/index.astro` に置き換えて削除する。i18n の `redirectToDefaultLocale` は `/` のページが無いときに効くため、この仮ページがあるうちはリダイレクトは出ない）:

```astro
---
---
<!doctype html>
<html lang="ja">
  <head><meta charset="utf-8" /><title>portfolio</title></head>
  <body><p>scaffold</p></body>
</html>
```

`.gitignore` の「dependencies / build」ブロックに 1 行追加:

```
.astro/
```

- [ ] **Step 4: ビルドと型チェックが通ることを確認する**

Run: `pnpm build && pnpm typecheck`
Expected: `dist/index.html` が生成され、`astro check` が `0 errors` で終わる。

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml pnpm-workspace.yaml .node-version astro.config.ts tsconfig.json src/pages/index.astro .gitignore
git commit -m "chore: pnpm + Astro のプロジェクトを初期化し、i18n と画像ドメインを設定"
```

---

### Task 2: Biome の導入

**Files:**
- Create: `biome.json`
- Modify: `package.json`（scripts に `lint` / `format`）

**Interfaces:**
- Produces: `pnpm lint`（検査のみ）、`pnpm format`（修正あり）。hooks と CI が `pnpm lint` を呼ぶ

- [ ] **Step 1: 依存を入れて設定を生成する**

```bash
pnpm add -D @biomejs/biome
pnpm exec biome init
```

Expected: `biome.json` が生成される（`$schema` に入ったバージョンのスキーマ URL が書かれる。これを保つ）。

- [ ] **Step 2: 設定を上書きする（`$schema` 行は生成されたものを残す）**

```json
{
  "$schema": "<biome init が書いた URL をそのまま>",
  "vcs": { "enabled": true, "clientKind": "git", "useIgnoreFile": true },
  "files": { "includes": ["**", "!dist", "!.astro", "!pnpm-lock.yaml"] },
  "formatter": { "enabled": true, "indentStyle": "space", "indentWidth": 2, "lineWidth": 100 },
  "linter": { "enabled": true, "rules": { "recommended": true } },
  "javascript": { "formatter": { "quoteStyle": "single", "semicolons": "always" } }
}
```

`package.json` の scripts に追加:

```json
"lint": "biome check .",
"format": "biome check --write ."
```

- [ ] **Step 3: lint が失敗する状態を作って動作を確認する（RED）**

`src/pages/index.astro` の frontmatter に `const unused = 1` を一時的に追加して実行:

Run: `pnpm lint`
Expected: 終了コード非 0。`noUnusedVariables` か整形差分のエラーが `index.astro` に対して出る（Biome は `.astro` の frontmatter を検査する。もし `.astro` が検査対象外で成功してしまう場合は、代わりに `src/lib/tmp.ts` に同じ行を置いて確認し、確認後に削除する）。

- [ ] **Step 4: 一時行を消して通ることを確認する（GREEN）**

Run: `pnpm lint`
Expected: `Checked N files ... No fixes applied` 相当で終了コード 0。

- [ ] **Step 5: Commit**

```bash
git add biome.json package.json pnpm-lock.yaml
git commit -m "chore: Biome を導入し lint / format スクリプトを追加"
```

---

### Task 3: Vitest の導入と i18n ユーティリティ

**Files:**
- Create: `vitest.config.ts`, `src/lib/i18n.ts`, `tests/unit/i18n.test.ts`
- Modify: `package.json`（scripts に `test`）

**Interfaces:**
- Produces:
  - `export const locales = ['ja', 'en'] as const; export type Locale = 'ja' | 'en'; export const defaultLocale: Locale = 'ja';`
  - `export function otherLocale(locale: Locale): Locale`
  - `export function localeFromPath(path: string): Locale | null` — `/ja/photos/` → `'ja'`、`/photos/` → `null`
  - `export function alternatePath(path: string, target: Locale): string` — `/ja/photos/x/` と `'en'` → `/en/photos/x/`。ロケール接頭辞が無いパスなら `/${target}${path}` を返す
  - Change 2 の言語切り替えリンクと hreflang がこれを使う

- [ ] **Step 1: Vitest を入れて設定を書く**

```bash
pnpm add -D vitest
```

`vitest.config.ts`:

```ts
import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
  },
});
```

`package.json` の scripts に追加:

```json
"test": "vitest run"
```

- [ ] **Step 2: 失敗するテストを書く**

`tests/unit/i18n.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { alternatePath, defaultLocale, localeFromPath, locales, otherLocale } from '../../src/lib/i18n';

describe('locales', () => {
  it('ja が既定で、ja と en の 2 つ', () => {
    expect(locales).toEqual(['ja', 'en']);
    expect(defaultLocale).toBe('ja');
  });

  it('otherLocale は相手の言語を返す', () => {
    expect(otherLocale('ja')).toBe('en');
    expect(otherLocale('en')).toBe('ja');
  });
});

describe('localeFromPath', () => {
  it('先頭セグメントがロケールならそれを返す', () => {
    expect(localeFromPath('/ja/')).toBe('ja');
    expect(localeFromPath('/en/photos/kyoto/')).toBe('en');
  });

  it('ロケールで始まらないパスは null', () => {
    expect(localeFromPath('/')).toBeNull();
    expect(localeFromPath('/photos/')).toBeNull();
    expect(localeFromPath('/japan/')).toBeNull();
  });
});

describe('alternatePath', () => {
  it('同じページの他言語版に差し替える', () => {
    expect(alternatePath('/ja/photos/kyoto/', 'en')).toBe('/en/photos/kyoto/');
    expect(alternatePath('/en/career/', 'ja')).toBe('/ja/career/');
    expect(alternatePath('/ja/', 'en')).toBe('/en/');
  });

  it('接頭辞が無いパスにはロケールを前置する', () => {
    expect(alternatePath('/', 'ja')).toBe('/ja/');
    expect(alternatePath('/404/', 'en')).toBe('/en/404/');
  });
});
```

- [ ] **Step 3: 失敗を確認する**

Run: `pnpm test`
Expected: FAIL。`Failed to resolve import "../../src/lib/i18n"` 相当。

- [ ] **Step 4: 実装する**

`src/lib/i18n.ts`:

```ts
export const locales = ['ja', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'ja';

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function otherLocale(locale: Locale): Locale {
  return locale === 'ja' ? 'en' : 'ja';
}

/** 先頭セグメントがロケールならそれを返す。`/ja/photos/` → 'ja'、`/photos/` → null */
export function localeFromPath(path: string): Locale | null {
  const first = path.split('/').filter(Boolean)[0];
  return first !== undefined && isLocale(first) ? first : null;
}

/** 同じページの他言語版のパス。`/ja/photos/x/` + 'en' → `/en/photos/x/` */
export function alternatePath(path: string, target: Locale): string {
  const segments = path.split('/').filter(Boolean);
  if (segments.length > 0 && isLocale(segments[0])) {
    segments[0] = target;
  } else {
    segments.unshift(target);
  }
  return `/${segments.join('/')}/`;
}
```

- [ ] **Step 5: テストが通ることを確認する**

Run: `pnpm test`
Expected: PASS（6 tests）。

- [ ] **Step 6: lint と typecheck**

Run: `pnpm lint && pnpm typecheck`
Expected: 両方 0 で終了。整形差分が出たら `pnpm format` で直して再実行。

- [ ] **Step 7: Commit**

```bash
git add vitest.config.ts package.json pnpm-lock.yaml src/lib/i18n.ts tests/unit/i18n.test.ts
git commit -m "feat: Vitest を導入し、ロケール判定と言語切り替え URL のユーティリティを追加"
```

---

### Task 4: 内容データの Zod スキーマ

**Files:**
- Create: `src/content/schemas.ts`, `tests/unit/schemas.test.ts`

**Interfaces:**
- Produces（Task 5、Task 6、Change 3・4 が使う）:
  - `export const PHOTO_BASE_URL = 'https://github.com/joe-yama/portfolio/releases/download/photos/'`
  - `export const photoSchema`, `careerSchema`, `profileSchema`（Zod オブジェクト）
  - `export type Photo = z.infer<typeof photoSchema>`, `Career`, `Profile`
  - `export type Localized = { ja: string; en: string }`
- Consumes: `Locale` は使わない（YAML の二言語はキー `ja` / `en` で固定）

- [ ] **Step 1: 失敗するテストを書く**

`tests/unit/schemas.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { PHOTO_BASE_URL, careerSchema, photoSchema, profileSchema } from '../../src/content/schemas';

const validPhoto = {
  image: `${PHOTO_BASE_URL}2025-kyoto-dawn.jpg`,
  order: 10,
  featured: true,
  takenAt: '2025-11-03',
  title: { ja: '夜明けの鴨川', en: 'Kamo River at Dawn' },
  location: { ja: '京都', en: 'Kyoto, Japan' },
  alt: { ja: '夜明けの鴨川と橋', en: 'Kamo River and a bridge at dawn' },
  exif: {
    camera: 'Fujifilm X-T5',
    lens: 'XF 23mm F1.4 R LM WR',
    aperture: 1.4,
    shutterSpeed: '1/250',
    iso: 800,
  },
};

describe('photoSchema', () => {
  it('正しい写真データを受け付け、takenAt を Date にする', () => {
    const parsed = photoSchema.parse(validPhoto);
    expect(parsed.takenAt).toBeInstanceOf(Date);
    expect(parsed.takenAt.toISOString().slice(0, 10)).toBe('2025-11-03');
  });

  it('featured を省略すると false', () => {
    const { featured: _omit, ...rest } = validPhoto;
    expect(photoSchema.parse(rest).featured).toBe(false);
  });

  it('image が URL でなければ拒否する', () => {
    expect(photoSchema.safeParse({ ...validPhoto, image: '../../assets/x.jpg' }).success).toBe(false);
  });

  it('exif の 5 項目はすべて必須', () => {
    for (const key of ['camera', 'lens', 'aperture', 'shutterSpeed', 'iso'] as const) {
      const exif: Record<string, unknown> = { ...validPhoto.exif };
      delete exif[key];
      expect(photoSchema.safeParse({ ...validPhoto, exif }).success).toBe(false);
    }
  });

  it('aperture は正の数、iso は正の整数', () => {
    expect(photoSchema.safeParse({ ...validPhoto, exif: { ...validPhoto.exif, aperture: 0 } }).success).toBe(false);
    expect(photoSchema.safeParse({ ...validPhoto, exif: { ...validPhoto.exif, iso: 800.5 } }).success).toBe(false);
  });

  it('alt は両言語とも空文字を許さない', () => {
    expect(photoSchema.safeParse({ ...validPhoto, alt: { ja: '', en: 'x' } }).success).toBe(false);
  });
});

const validCareer = {
  experience: [
    {
      from: '2020-04',
      organization: 'サンプル株式会社',
      role: 'ソフトウェアエンジニア',
      bullets: ['a', 'b'],
    },
  ],
  skills: { 言語: ['TypeScript', 'Python'], クラウド: ['AWS'] },
  certifications: [{ date: '2023-06-01', name: '応用情報技術者' }],
  achievements: [{ date: '2024-10-12', name: '社外勉強会で登壇', kind: 'talk', url: 'https://example.com/talk' }],
};

describe('careerSchema', () => {
  it('正しい経歴データを受け付ける', () => {
    expect(careerSchema.safeParse(validCareer).success).toBe(true);
  });

  it('experience の bullets は最大 5', () => {
    const six = { ...validCareer.experience[0], bullets: ['1', '2', '3', '4', '5', '6'] };
    expect(careerSchema.safeParse({ ...validCareer, experience: [six] }).success).toBe(false);
  });

  it('from / to は YYYY-MM 形式', () => {
    const bad = { ...validCareer.experience[0], from: '2020/04' };
    expect(careerSchema.safeParse({ ...validCareer, experience: [bad] }).success).toBe(false);
    const withTo = { ...validCareer.experience[0], to: '2024-03' };
    expect(careerSchema.safeParse({ ...validCareer, experience: [withTo] }).success).toBe(true);
  });

  it('achievements の kind は talk / article / award / other のみ', () => {
    const bad = { ...validCareer.achievements[0], kind: 'blog' };
    expect(careerSchema.safeParse({ ...validCareer, achievements: [bad] }).success).toBe(false);
  });
});

describe('profileSchema', () => {
  const validProfile = {
    name: 'joe-yama',
    tagline: '写真を撮るソフトウェアエンジニア',
    links: [
      { label: 'GitHub', url: 'https://github.com/joe-yama', kind: 'github' },
      { label: 'Email', url: 'mailto:hello@example.com', kind: 'email' },
    ],
  };

  it('正しいプロフィールを受け付ける（mailto も URL として許す）', () => {
    expect(profileSchema.safeParse(validProfile).success).toBe(true);
  });

  it('links は 1 件以上、kind は列挙のみ', () => {
    expect(profileSchema.safeParse({ ...validProfile, links: [] }).success).toBe(false);
    const bad = { ...validProfile.links[0], kind: 'mastodon' };
    expect(profileSchema.safeParse({ ...validProfile, links: [bad] }).success).toBe(false);
  });
});
```

- [ ] **Step 2: 失敗を確認する**

Run: `pnpm test`
Expected: FAIL。`schemas` の import 解決エラー。

- [ ] **Step 3: 実装する**

`src/content/schemas.ts`:

```ts
import { z } from 'astro/zod';

/** 写真の元画像を置く GitHub Release（タグ photos）の asset URL の接頭辞 */
export const PHOTO_BASE_URL = 'https://github.com/joe-yama/portfolio/releases/download/photos/';

const nonEmpty = z.string().trim().min(1);

export const localizedSchema = z.object({ ja: nonEmpty, en: nonEmpty });
export type Localized = z.infer<typeof localizedSchema>;

/** YYYY-MM */
const yearMonth = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'YYYY-MM 形式で書く');
/** YYYY-MM-DD */
const isoDate = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, 'YYYY-MM-DD 形式で書く');

export const exifSchema = z.object({
  camera: nonEmpty,
  lens: nonEmpty,
  aperture: z.number().positive(),
  shutterSpeed: nonEmpty,
  iso: z.number().int().positive(),
});

export const photoSchema = z.object({
  image: z.string().url(),
  order: z.number().int().positive(),
  featured: z.boolean().default(false),
  takenAt: z.coerce.date(),
  title: localizedSchema,
  location: localizedSchema,
  alt: localizedSchema,
  exif: exifSchema,
});
export type Photo = z.infer<typeof photoSchema>;

export const experienceSchema = z.object({
  from: yearMonth,
  to: yearMonth.optional(), // 省略 = 在職中
  organization: nonEmpty,
  role: nonEmpty,
  bullets: z.array(nonEmpty).max(5),
});

export const careerSchema = z.object({
  experience: z.array(experienceSchema),
  skills: z.record(nonEmpty, z.array(nonEmpty)),
  certifications: z.array(z.object({ date: isoDate, name: nonEmpty, url: z.string().url().optional() })),
  achievements: z.array(
    z.object({
      date: isoDate,
      name: nonEmpty,
      url: z.string().url().optional(),
      kind: z.enum(['talk', 'article', 'award', 'other']),
    }),
  ),
});
export type Career = z.infer<typeof careerSchema>;

export const profileSchema = z.object({
  name: nonEmpty,
  tagline: nonEmpty,
  links: z
    .array(
      z.object({
        label: nonEmpty,
        url: z.string().url(),
        kind: z.enum(['github', 'email', 'x', 'linkedin', 'other']),
      }),
    )
    .min(1),
});
export type Profile = z.infer<typeof profileSchema>;
```

- [ ] **Step 4: テストが通ることを確認する**

Run: `pnpm test`
Expected: PASS（i18n 6 + schemas 12 = 18 tests）。

- [ ] **Step 5: lint と typecheck**

Run: `pnpm lint && pnpm typecheck`
Expected: 0 で終了。

- [ ] **Step 6: Commit**

```bash
git add src/content/schemas.ts tests/unit/schemas.test.ts
git commit -m "feat: profile / career / photos の Zod スキーマを追加"
```

---

### Task 5: スキーマで表せない制約の検証関数

**Files:**
- Create: `src/lib/validate.ts`, `tests/unit/validate.test.ts`

**Interfaces:**
- Consumes: `Photo`, `Career`, `PHOTO_BASE_URL`（Task 4）
- Produces（Task 6 と Change 3 が使う）:
  - `export type PhotoEntry = { id: string; data: Photo }`（`getCollection('photos')` の要素と互換）
  - `export function validatePhotos(entries: PhotoEntry[]): string[]` — 問題点のメッセージ配列。空なら OK
  - `export function validateCareerParity(ja: Career, en: Career): string[]`
  - `export function assertValid(errors: string[], subject: string): void` — 1 件以上あれば `Error` を投げる（メッセージは `subject` + 改行区切りの一覧）

- [ ] **Step 1: 失敗するテストを書く**

`tests/unit/validate.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { PHOTO_BASE_URL, type Career, type Photo } from '../../src/content/schemas';
import { assertValid, validateCareerParity, validatePhotos } from '../../src/lib/validate';

function photo(id: string, over: Partial<Photo> = {}): { id: string; data: Photo } {
  return {
    id,
    data: {
      image: `${PHOTO_BASE_URL}${id}.jpg`,
      order: 10,
      featured: false,
      takenAt: new Date('2025-11-03'),
      title: { ja: 't', en: 't' },
      location: { ja: 'l', en: 'l' },
      alt: { ja: 'a', en: 'a' },
      exif: { camera: 'c', lens: 'l', aperture: 1.4, shutterSpeed: '1/250', iso: 800 },
      ...over,
    },
  };
}

describe('validatePhotos', () => {
  it('featured が 1 枚、order が一意、URL が規約どおりなら問題なし', () => {
    const entries = [photo('a', { featured: true, order: 1 }), photo('b', { order: 2 })];
    expect(validatePhotos(entries)).toEqual([]);
  });

  it('featured が 0 枚なら報告する', () => {
    const errors = validatePhotos([photo('a', { order: 1 })]);
    expect(errors.some((e) => e.includes('featured'))).toBe(true);
  });

  it('featured が 2 枚なら報告する', () => {
    const errors = validatePhotos([
      photo('a', { featured: true, order: 1 }),
      photo('b', { featured: true, order: 2 }),
    ]);
    expect(errors.some((e) => e.includes('featured') && e.includes('a') && e.includes('b'))).toBe(true);
  });

  it('order が重複したら両方の slug を挙げて報告する', () => {
    const errors = validatePhotos([photo('a', { featured: true, order: 5 }), photo('b', { order: 5 })]);
    expect(errors.some((e) => e.includes('order') && e.includes('a') && e.includes('b'))).toBe(true);
  });

  it('image が Release photos 配下の <slug>.jpg でなければ報告する', () => {
    const wrongHost = photo('a', { featured: true, order: 1, image: 'https://example.com/a.jpg' });
    const wrongName = photo('b', { order: 2, image: `${PHOTO_BASE_URL}other.jpg` });
    const errors = validatePhotos([wrongHost, wrongName]);
    expect(errors.filter((e) => e.includes('image'))).toHaveLength(2);
  });
});

describe('validateCareerParity', () => {
  const base: Career = {
    experience: [{ from: '2020-04', organization: 'o', role: 'r', bullets: [] }],
    skills: { lang: ['ts'] },
    certifications: [{ date: '2023-06-01', name: 'c' }],
    achievements: [{ date: '2024-10-12', name: 'a', kind: 'talk' }],
  };

  it('件数が一致すれば問題なし', () => {
    expect(validateCareerParity(base, base)).toEqual([]);
  });

  it('experience / certifications / achievements の件数差を個別に報告する', () => {
    const en: Career = { ...base, certifications: [], achievements: [...base.achievements, base.achievements[0]] };
    const errors = validateCareerParity(base, en);
    expect(errors).toHaveLength(2);
    expect(errors.some((e) => e.includes('certifications') && e.includes('1') && e.includes('0'))).toBe(true);
    expect(errors.some((e) => e.includes('achievements'))).toBe(true);
  });
});

describe('assertValid', () => {
  it('空なら何もしない', () => {
    expect(() => assertValid([], 'photos')).not.toThrow();
  });

  it('1 件以上なら subject と全メッセージを含む Error を投げる', () => {
    expect(() => assertValid(['x is bad', 'y is bad'], 'photos')).toThrow(/photos[\s\S]*x is bad[\s\S]*y is bad/);
  });
});
```

- [ ] **Step 2: 失敗を確認する**

Run: `pnpm test`
Expected: FAIL。`validate` の import 解決エラー。

- [ ] **Step 3: 実装する**

`src/lib/validate.ts`:

```ts
import { type Career, PHOTO_BASE_URL, type Photo } from '../content/schemas';

export type PhotoEntry = { id: string; data: Photo };

/** Zod で表せない写真コレクション全体の制約。問題点を文字列で返す（空 = OK） */
export function validatePhotos(entries: PhotoEntry[]): string[] {
  const errors: string[] = [];

  const featured = entries.filter((e) => e.data.featured).map((e) => e.id);
  if (featured.length !== 1) {
    errors.push(`featured はちょうど 1 枚にする（現在 ${featured.length} 枚: ${featured.join(', ') || 'なし'}）`);
  }

  const byOrder = new Map<number, string[]>();
  for (const e of entries) {
    byOrder.set(e.data.order, [...(byOrder.get(e.data.order) ?? []), e.id]);
  }
  for (const [order, ids] of byOrder) {
    if (ids.length > 1) errors.push(`order ${order} が重複している: ${ids.join(', ')}`);
  }

  for (const e of entries) {
    const expected = `${PHOTO_BASE_URL}${e.id}.jpg`;
    if (e.data.image !== expected) {
      errors.push(`${e.id}: image は ${expected} にする（現在 ${e.data.image}）`);
    }
  }

  return errors;
}

/** 日英の経歴で、並べて表示する配列の件数が一致すること */
export function validateCareerParity(ja: Career, en: Career): string[] {
  const errors: string[] = [];
  for (const key of ['experience', 'certifications', 'achievements'] as const) {
    if (ja[key].length !== en[key].length) {
      errors.push(`${key} の件数が日英で違う（ja: ${ja[key].length}, en: ${en[key].length}）`);
    }
  }
  return errors;
}

export function assertValid(errors: string[], subject: string): void {
  if (errors.length === 0) return;
  throw new Error(`${subject} の内容に問題がある:\n- ${errors.join('\n- ')}`);
}
```

- [ ] **Step 4: テストが通ることを確認する**

Run: `pnpm test`
Expected: PASS（18 + 9 = 27 tests）。

- [ ] **Step 5: lint と typecheck**

Run: `pnpm lint && pnpm typecheck`
Expected: 0 で終了。

- [ ] **Step 6: Commit**

```bash
git add src/lib/validate.ts tests/unit/validate.test.ts
git commit -m "feat: featured / order / 画像 URL / 日英件数の検証関数を追加"
```

---

### Task 6: コンテンツコレクションの定義、サンプルデータ、言語別トップ

**Files:**
- Create: `src/content.config.ts`, `src/content/profile/ja.yaml`, `src/content/profile/en.yaml`, `src/content/career/ja.yaml`, `src/content/career/en.yaml`, `src/lib/content.ts`, `src/pages/[lang]/index.astro`
- Delete: `src/pages/index.astro`（Task 1 の仮ページ）

**Interfaces:**
- Consumes: `photoSchema` / `careerSchema` / `profileSchema`（Task 4）、`validatePhotos` / `validateCareerParity` / `assertValid`（Task 5）、`locales` / `Locale` / `isLocale`（Task 3）
- Produces（Change 3・4 のページが使う。ページは `astro:content` を直接 import せずこのモジュールを使う）:
  - `export async function getPhotos(): Promise<CollectionEntry<'photos'>[]>` — 検証済み、`order` 昇順
  - `export async function getProfile(lang: Locale): Promise<Profile>`
  - `export async function getCareer(lang: Locale): Promise<Career>` — 日英の件数一致を検証してから返す

このタスクの「テスト」はビルドである。単体テストで検証できる部分は Task 4・5 で済んでいる。ビルド時に `getProfile` が YAML を読めていることは、生成 HTML に名前が入っていることで確認する。

- [ ] **Step 1: コレクション定義を書く**

`src/content.config.ts`:

```ts
import { glob } from 'astro/loaders';
import { defineCollection } from 'astro:content';
import { careerSchema, photoSchema, profileSchema } from './content/schemas';

const profile = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/profile' }),
  schema: profileSchema,
});

const career = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/career' }),
  schema: careerSchema,
});

const photos = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/photos' }),
  schema: photoSchema,
});

export const collections = { profile, career, photos };
```

- [ ] **Step 2: サンプルデータを書く（PO の実データが届いたら差し替える。spec §11）**

`src/content/profile/ja.yaml`:

```yaml
name: joe-yama
tagline: 写真を撮るソフトウェアエンジニア（サンプル）
links:
  - label: GitHub
    url: https://github.com/joe-yama
    kind: github
  - label: Email
    url: mailto:hello@example.com
    kind: email
```

`src/content/profile/en.yaml`:

```yaml
name: joe-yama
tagline: Software engineer who takes photographs (sample)
links:
  - label: GitHub
    url: https://github.com/joe-yama
    kind: github
  - label: Email
    url: mailto:hello@example.com
    kind: email
```

`src/content/career/ja.yaml`:

```yaml
experience:
  - from: "2020-04"
    organization: サンプル株式会社
    role: ソフトウェアエンジニア
    bullets:
      - 社内向け Web アプリケーションの設計と実装
      - CI/CD パイプラインの整備
  - from: "2017-04"
    to: "2020-03"
    organization: 例示システムズ
    role: プログラマ
    bullets:
      - 業務システムの保守と機能追加
skills:
  言語: [TypeScript, Python]
  クラウド: [AWS]
certifications:
  - date: "2023-06-01"
    name: 応用情報技術者
achievements:
  - date: "2024-10-12"
    name: 社外勉強会で登壇（サンプル）
    kind: talk
    url: https://example.com/talk
```

`src/content/career/en.yaml`（件数を ja と一致させる）:

```yaml
experience:
  - from: "2020-04"
    organization: Sample Inc.
    role: Software Engineer
    bullets:
      - Designed and built internal web applications
      - Set up CI/CD pipelines
  - from: "2017-04"
    to: "2020-03"
    organization: Example Systems
    role: Programmer
    bullets:
      - Maintained and extended business systems
skills:
  Languages: [TypeScript, Python]
  Cloud: [AWS]
certifications:
  - date: "2023-06-01"
    name: Applied Information Technology Engineer
achievements:
  - date: "2024-10-12"
    name: Talk at a community meetup (sample)
    kind: talk
    url: https://example.com/talk
```

`from` / `to` / `date` は引用符で囲む（YAML が数値や日付として解釈しないようにする）。

`src/content/photos/` はこの change では空ディレクトリのまま（ファイルが無いと glob ローダーは空のコレクションを返す。git は空ディレクトリを追跡しないので `src/content/photos/.gitkeep` を置く）。

- [ ] **Step 3: 読み込み口を書く**

`src/lib/content.ts`:

```ts
import { type CollectionEntry, getCollection, getEntry } from 'astro:content';
import type { Career, Profile } from '../content/schemas';
import type { Locale } from './i18n';
import { assertValid, validateCareerParity, validatePhotos } from './validate';

export async function getPhotos(): Promise<CollectionEntry<'photos'>[]> {
  const entries = await getCollection('photos');
  assertValid(validatePhotos(entries), 'photos');
  return [...entries].sort((a, b) => a.data.order - b.data.order);
}

export async function getProfile(lang: Locale): Promise<Profile> {
  const entry = await getEntry('profile', lang);
  if (!entry) throw new Error(`profile/${lang}.yaml が無い`);
  return entry.data;
}

export async function getCareer(lang: Locale): Promise<Career> {
  const [ja, en] = await Promise.all([getEntry('career', 'ja'), getEntry('career', 'en')]);
  if (!ja || !en) throw new Error('career/ja.yaml と career/en.yaml の両方が必要');
  assertValid(validateCareerParity(ja.data, en.data), 'career');
  return lang === 'ja' ? ja.data : en.data;
}
```

- [ ] **Step 4: 言語別トップの最小版を書き、仮ページを消す**

```bash
git rm src/pages/index.astro
```

`src/pages/[lang]/index.astro`:

```astro
---
import { getCareer, getProfile } from '../../lib/content';
import { type Locale, locales } from '../../lib/i18n';

export function getStaticPaths() {
  return locales.map((lang) => ({ params: { lang } }));
}

const lang = Astro.params.lang as Locale;
const profile = await getProfile(lang);
// 検証をビルドに乗せるため呼ぶ。表示は Change 4 で行う
await getCareer(lang);
---

<!doctype html>
<html lang={lang}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{profile.name}</title>
  </head>
  <body>
    <h1>{profile.name}</h1>
    <p>{profile.tagline}</p>
  </body>
</html>
```

- [ ] **Step 5: 型を同期してビルドし、出力を確認する**

Run: `pnpm exec astro sync && pnpm typecheck && pnpm build`
Expected: `astro check` 0 errors。`dist/ja/index.html` に `写真を撮るソフトウェアエンジニア`、`dist/en/index.html` に `Software engineer` が含まれる。`dist/index.html` が生成され、`/ja/` へのリダイレクト（`<meta http-equiv="refresh" content="0;url=/ja/">` 相当）を含む。

```bash
grep -c "写真を撮る" dist/ja/index.html      # 1
grep -c "Software engineer" dist/en/index.html   # 1
grep -o 'url=/ja/' dist/index.html               # url=/ja/
grep -c "<script" dist/ja/index.html             # 0（配信 JS ゼロ）
```

- [ ] **Step 6: 検証がビルドを止めることを確認する（RED の代わり）**

`src/content/career/en.yaml` の `certifications` を一時的に空配列 `[]` にして:

Run: `pnpm build`
Expected: FAIL。エラーメッセージに `career の内容に問題がある` と `certifications の件数が日英で違う（ja: 1, en: 0）` が含まれる。確認後に元に戻し、`pnpm build` が通ることを再確認する。

- [ ] **Step 7: lint と単体テスト**

Run: `pnpm lint && pnpm test`
Expected: 0 で終了、27 tests PASS。

- [ ] **Step 8: Commit**

```bash
git add src/content.config.ts src/content/profile src/content/career src/content/photos/.gitkeep src/lib/content.ts "src/pages/[lang]/index.astro"
git commit -m "feat: コンテンツコレクションを定義し、検証を通した言語別トップの骨格を追加"
```

---

### Task 7: ハーネスへの反映（spec §8.1）

**Files:**
- Modify: `.claude/rules/testing.md`（テストコマンド節）、`.claude/hooks/lint-on-edit.sh:18-30`、`.claude/hooks/test-on-stop.sh:19-29`、`CLAUDE.md`（コマンド表）、`docs/harness/README.md`（§5-5）
- `.claude/` 配下は Write / Edit ツールで編集する

**Interfaces:**
- Produces: PostToolUse hook が編集ファイルに `pnpm exec biome check <file>` を、Stop hook が `pnpm test` を実行する

- [ ] **Step 1: hooks の検出関数を確定コマンドに置き換える**

`.claude/hooks/lint-on-edit.sh` の `detect_lint()`（18〜30 行目）全体を次に置き換える。ヘッダーコメント 4〜5 行目の「技術スタックが未決定のため…」2 行は「lint は Biome。編集されたファイル 1 つだけを検査する」に差し替える:

```bash
detect_lint() {
  [ -f "$root/biome.json" ] || return 0
  echo "pnpm exec biome check \"$file\""
}
```

`.claude/hooks/test-on-stop.sh` の `detect_test()`（19〜29 行目）全体を次に置き換える。ヘッダー 5 行目の「テストコマンドはプロジェクト構成から自動検出…」は「テストは Vitest（`pnpm test`）」に差し替える:

```bash
detect_test() {
  [ -f package.json ] || return 0
  echo "pnpm test"
}
```

- [ ] **Step 2: hooks が動くことを合成入力で確認する**

```bash
printf '{"tool_response":{"filePath":"%s/src/lib/i18n.ts"}}' "$PWD" | bash .claude/hooks/lint-on-edit.sh; echo "exit=$?"
```

Expected: `exit=0`。次に `src/lib/i18n.ts` の末尾に `const   x=1` を一時追加して同じコマンドを実行し、`exit=2` と `lint failed after editing` が stderr に出ることを確認。確認後に元に戻す。

```bash
printf '{"stop_hook_active":false}' | bash .claude/hooks/test-on-stop.sh; echo "exit=$?"
```

Expected: ソースに未コミット変更が無ければ何も出さず `exit=0`。`src/lib/i18n.ts` に空行を 1 つ足した状態で実行すると Vitest が走り、成功時は出力なしで `exit=0`。確認後に元に戻す。

- [ ] **Step 3: ルールとドキュメントにコマンドを書く**

`.claude/rules/testing.md` の「## テストコマンド」節を次に置き換える:

```markdown
## テストコマンド

| 目的 | コマンド |
|---|---|
| 単体テスト（Vitest） | `pnpm test` |
| lint と整形の検査（Biome） | `pnpm lint`（修正は `pnpm format`） |
| 型チェック（astro check） | `pnpm typecheck` |
| ビルド | `pnpm build` |
| e2e（Playwright。Change 5 で追加） | `pnpm e2e` |

hooks: 編集ごとに `pnpm exec biome check <file>`、ターン終了時に `pnpm test`（`.claude/hooks/`）。e2e は数十秒かかるので hooks に入れず、CI とレビュー用サブエージェントが実行する。
```

`CLAUDE.md` の「## コマンド」節の表に次の行を追加し、表の下の「test / lint / typecheck（…）は最初の change で `package.json` を作った時点で有効になる。」の 1 文を削除する:

```markdown
| `pnpm test` / `pnpm lint` / `pnpm typecheck` / `pnpm build` | 単体テスト / lint / 型チェック / ビルド。詳細は `.claude/rules/testing.md` |
| `pnpm dev` / `pnpm preview` | 開発サーバー / ビルド結果の HTTP 配信（Playwright MCP はこの URL を使う） |
```

`docs/harness/README.md` §5 の項目 5 を次に置き換える:

```markdown
5. 技術スタック導入時のハーネス更新は change `project-foundation` で実施済み（2026-09-XX）: testing.md のコマンド節、hooks の `detect_lint()` → `pnpm exec biome check <file>`、`detect_test()` → `pnpm test`、CLAUDE.md のコマンド表
```

（`2026-09-XX` は実施日に置き換える）

- [ ] **Step 4: Commit**

```bash
git add .claude/rules/testing.md .claude/hooks/lint-on-edit.sh .claude/hooks/test-on-stop.sh CLAUDE.md docs/harness/README.md
git commit -m "chore: hooks とルールに pnpm / Biome / Vitest の確定コマンドを反映"
```

---

### Task 8: GitHub Actions の CI（PR チェック）

**Files:**
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Produces: PR と `main` への push で `lint → typecheck → test → build` を実行する `CI / check` ジョブ。Change 5 で e2e とデプロイを足す。PO が `main` のブランチ保護でこのジョブを必須にする

- [ ] **Step 1: workflow を書く**

`.github/workflows/ci.yml`（actions のメジャーバージョンは書いた時点の最新。実行時に GitHub Marketplace で最新メジャーを確認して合わせる）:

```yaml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

permissions:
  contents: read

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: pnpm/action-setup@v4 # package.json の packageManager を読む
      - uses: actions/setup-node@v5
        with:
          node-version-file: .node-version
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm build
```

- [ ] **Step 2: ローカルで同じ手順が通ることを確認する**

Run: `pnpm install --frozen-lockfile && pnpm lint && pnpm typecheck && pnpm test && pnpm build`
Expected: すべて 0 で終了。

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "chore: PR で lint / typecheck / test / build を実行する GitHub Actions を追加"
```

CI の実際の実行結果は PR 作成後に GitHub 上で確認する（Task 9）。失敗したら `superpowers:systematic-debugging` で原因を特定し、修正コミットを足す。

---

### Task 9: 仕上げ（tasks.md、Issue、PR）

**Files:**
- Modify: `openspec/changes/project-foundation/tasks.md`

- [ ] **Step 1: 最終確認**

Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm build && git status --short`
Expected: すべて 0、未コミットの変更なし。`dist/ja/index.html` に `<script` が無い（配信 JS ゼロ）。

- [ ] **Step 2: tasks.md を更新してコミット**

`openspec/changes/project-foundation/tasks.md` の完了した項目を `- [x]` にする。

```bash
git add openspec/changes/project-foundation/tasks.md
git commit -m "docs: project-foundation の tasks.md を完了状態に更新"
```

- [ ] **Step 3: 独立レビューを依頼する**

`superpowers:requesting-code-review` に従い、別サブエージェントに「仕様準拠（spec §5, §8, §8.1, §9 の CI）→ コード品質」の順でレビューさせる。UI はまだ無いので Playwright MCP は使わない。指摘の修正コミットを足し、結果を Issue にコメントする。

- [ ] **Step 4: push と PR（`git push` と `gh pr create` は毎回確認される）**

```bash
gh api user --jq .login   # joe-yama であることを確認
git push -u origin feature/project-foundation
gh pr create --title "feat: プロジェクト土台（pnpm + Astro、スキーマと検証、i18n 骨格、CI）" --body "$(cat <<'EOF'
Closes #1

## 内容
- pnpm + Astro の初期化（`.node-version`、`packageManager`、i18n、image.domains）
- Biome / Vitest / astro check の導入と CI
- profile / career / photos の Zod スキーマと、featured / order / 画像 URL / 日英件数の検証
- 言語別トップの骨格と `/` → `/ja/` リダイレクト
- hooks とルールへの確定コマンドの反映

## 確認方法
`pnpm install && pnpm lint && pnpm typecheck && pnpm test && pnpm build`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

CI が緑になったことを確認し、Issue に「PR 作成、CI 緑」をコメントして PO の受け入れを待つ。マージ後に `/opsx:archive`。

---

## 自己レビュー（計画作成時に実施）

- **Spec カバレッジ**: §2（pnpm、Releases の URL 規約 → Task 1, 4, 5）、§4（`/ja/` `/en/`、リダイレクト → Task 1, 6）、§5（コレクション構造、スキーマ、独自検証 → Task 4, 5, 6）、§5.2（日英件数一致 → Task 5, 6）、§8（Zod + 独自検証、Vitest、Biome、astro check → Task 2〜6）、§8.1（ハーネス反映 → Task 7。settings.json は 2026-09-17 に済み）、§9（CI、Node / pnpm 固定 → Task 1, 8）。§4 のページ本体・§5.1 の写真実データ・§5.3 の photo:add・§6・§7・§8 の Playwright・§9 のデプロイと CNAME はロードマップの Change 2〜5
- **spec との差分（PO 確認済みとして進める点）**: §5.2 は「件数一致を単体テストで確認」とあるが、Vitest から YAML を読むには追加依存が要るため、判定関数を単体テスト（Task 5）し、実データはビルド時検証（Task 6）で確認する。検出タイミングはビルド時と CI で、spec の意図（マージ前に気づく）は満たす
- **Placeholder**: `2026-09-XX`（実施日）、`<biome init が書いた URL>` は実行時にしか決まらない値で、置き換え指示を添えた。Issue 番号は #1 に確定（2026-09-17）
- **型の整合**: `Locale` / `locales` / `isLocale`（Task 3）、`Photo` / `Career` / `Profile` / `PHOTO_BASE_URL`（Task 4）、`PhotoEntry` / `validatePhotos` / `validateCareerParity` / `assertValid`（Task 5）、`getPhotos` / `getProfile` / `getCareer`（Task 6）の名前と引数を全タスクで統一した
