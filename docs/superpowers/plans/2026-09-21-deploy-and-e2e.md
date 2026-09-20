# deploy-and-e2e 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `base: '/portfolio'` の下で正しく動くサイトを GitHub Pages に自動デプロイし、`base` が静かに壊す箇所を e2e と内部リンク検査で固定する。

**Architecture:** `base` の扱いを `src/lib/i18n.ts` の `stripBase` / `withBase` 2 純関数に閉じ、サイト内パスの生成を `src/lib/site.ts` に集約する。どちらも `base` を**引数で受け取る**ので Vitest で検証できる。`.astro` は `import.meta.env.BASE_URL` を渡すだけにし、`/` 始まりの `href` を 1 つも残さない。ビルド出力は Playwright（Chromium）+ axe + `fs` によるリンク検査で守る。

**Tech Stack:** Astro 7.3.2、TypeScript（`astro/tsconfigs/strict` + `noUnusedLocals`）、Vitest 5、Playwright（新規）、`@axe-core/playwright`（新規）、Biome 2、pnpm 12、Node 26.8.2、GitHub Actions。

**Spec:** `openspec/changes/deploy-and-e2e/specs/{deployment,i18n-routing,quality-gates}/spec.md`（要求）、同 `design.md`（決定 D1〜D7）、同 `tasks.md`（タスクとレビュー単位）。

## Global Constraints

- **pnpm のみ**。`npm` / `npx` は使わない。**依存の追加は `@playwright/test` と `@axe-core/playwright` の 2 つだけ**（`pnpm add -D` を 1 回で済ませ、lockfile の更新を同じコミットに含める）
- **TDD 厳守**。テストなしのコミットは禁止。テストの削除・skip・期待値の書き換えで通すことは禁止（`.claude/rules/testing.md`）。**axe の `disableRules` は期待値の書き換えに当たるので使わない**
- **1 コミット = 1 タスク**。メッセージは日本語で種別付き。`openspec/changes/deploy-and-e2e/tasks.md` のチェックは同じコミットに含める。末尾に `Co-Authored-By:` 行（このセッションの attribution 指示に従う）
- `tsconfig.json` の `noUnusedLocals: true`、`verbatimModuleSyntax`（型だけの import は `import type`）
- **`tsconfig.json` の `include` は `["**/*"]`**。`tests/e2e/` と `playwright.config.ts` も `astro check` の対象になる。**Biome も同じ**（`biome.json` の `files.includes` から除外しない）
- **`.astro` に `/` 始まりの `href` / `src` を直書きしない**。`grep -rn 'href="/' src` が 0 件であることが検証条件
- **スコープ**: `tasks.md` の項目だけ。気づいた改善は `tasks.md` 末尾の「提案」に書き、実装しない（`.claude/rules/scope.md`）
- **`git checkout -- .` / `git reset --hard` / `rm -rf` は使わない**。ファイルを一時的に壊す検証では、対象 1 ファイルだけを指定して戻す

## 実装前に実物で確認する落とし穴（すべて 2026-09-21 に実測済み）

1. **`import.meta.env.BASE_URL` は `/portfolio/`**（末尾スラッシュ付き）。`base` 未設定なら `/`。関数側で両方を正規化する
2. **`Astro.url.pathname` には base が含まれる**（`/portfolio/en/career/`）。`localeFromPath` に素で渡すと `null` が返り、`<html lang>` が既定ロケールに化け、hreflang が全ページから消える
3. **`dist` の構造は base の影響を受けない**（`dist/{ja,en}/...`。`dist/portfolio/` にはならない）。内部リンク検査では `/portfolio/` を剥がしてから `dist/` に対応づける
4. **`alternatePath` は base 込みのパスを渡すと `/en/portfolio/en/career/` を返す**（言語接頭辞が二重になる）
5. **`Astro.url.href` は `https://joe-yama.github.io/portfolio/...`**。`alternateLinks` が `new URL(path, Astro.site)` で絶対 URL を作るので、`path` が base 込みなら正しくなる
6. **`grep -o '<h2>...'` のような素のタグ検索は効かない**。Astro のスコープ CSS が `<h2 data-astro-cid-...>` の形で属性を注入する。`grep -oE '<h2[^>]*>[^<]*</h2>'` を使う
7. **`vitest.config.ts` は既に `include: ['tests/unit/**/*.test.ts']`** なので、Playwright の `*.spec.ts` を Vitest が拾う心配は無い（確認済み。変更不要）
8. **Stop hook が毎ターン `pnpm test` を走らせる**。e2e が `pnpm test` に混ざると毎ターン数十秒かかる
9. **`withastro/action` は `.node-version` を読まない**（README に記述なし。既定は `24`）。`node-version: 26.8.2` を明示する
10. **ビルド中の `[WARN] ... not an allowed remote location`** は Change 3 既知の事象で、この change とは無関係（キャッシュの再検証時のみ）

---

### Task 1: `base` を剥がす・前置する純関数（tasks.md の 1.1〜1.3）

**Files:**
- Modify: `src/lib/i18n.ts`、`src/lib/site.ts`
- Modify: `tests/unit/i18n.test.ts`、`tests/unit/site.test.ts`
- Modify: `openspec/changes/deploy-and-e2e/tasks.md`（1.1〜1.3 を `[x]`）

**Interfaces:**
- Produces:
  - `stripBase(path: string, base: string): string`
  - `withBase(path: string, base: string): string`
  - `localeFromPath(path: string, base: string): Locale | null`（**引数が 1 つ増える**）
  - `alternatePath(path: string, target: Locale, base: string): string`（**同上**）
  - `homePath(lang: Locale, base: string): string`
  - `photoPath(slug: string | null, lang: Locale, base: string): string`（`slug` が `null` ならギャラリー `/photos/`）
  - `assetPath(path: string, base: string): string`
  - `navLinks(lang: Locale, base: string)` / `languageSwitch(path: string, lang: Locale, base: string)` / `alternateLinks(path: string, site: string | URL, base: string)`（**いずれも base 引数を追加**）

- [ ] **Step 1: 失敗するテストを書く（`stripBase` / `withBase`）**

`tests/unit/i18n.test.ts` の末尾に追加（先頭の import に `stripBase` と `withBase` を足す）:

```ts
describe('stripBase', () => {
  it('先頭の base を取り除く', () => {
    expect(stripBase('/portfolio/en/career/', '/portfolio/')).toBe('/en/career/');
  });

  it('base が付いていなければそのまま返す', () => {
    expect(stripBase('/en/career/', '/portfolio/')).toBe('/en/career/');
  });

  it('base そのものは / になる', () => {
    expect(stripBase('/portfolio/', '/portfolio/')).toBe('/');
  });

  it('base が / なら何もしない', () => {
    expect(stripBase('/ja/', '/')).toBe('/ja/');
  });

  it('似た接頭辞を誤って剥がさない', () => {
    expect(stripBase('/portfolios/ja/', '/portfolio/')).toBe('/portfolios/ja/');
  });
});

describe('withBase', () => {
  it('base を前置する', () => {
    expect(withBase('/en/career/', '/portfolio/')).toBe('/portfolio/en/career/');
  });

  it('二重に付けない', () => {
    expect(withBase('/portfolio/en/career/', '/portfolio/')).toBe('/portfolio/en/career/');
  });

  it('base が / なら何もしない', () => {
    expect(withBase('/ja/', '/')).toBe('/ja/');
  });

  it('ルートに base を付ける', () => {
    expect(withBase('/', '/portfolio/')).toBe('/portfolio/');
  });
});
```

- [ ] **Step 2: 失敗を確認**

Run: `pnpm exec vitest run tests/unit/i18n.test.ts`
Expected: FAIL（`stripBase is not a function` 相当）

- [ ] **Step 3: `stripBase` / `withBase` を実装**

`src/lib/i18n.ts` に追加:

```ts
/** base を `/portfolio/` の形（先頭と末尾にスラッシュ 1 つずつ）に正規化する */
function normalizeBase(base: string): string {
  const trimmed = base.replace(/^\/+|\/+$/g, '');
  return trimmed === '' ? '/' : `/${trimmed}/`;
}

/** 公開時のパス接頭辞を取り除いた絶対パスを返す。付いていなければそのまま返す */
export function stripBase(path: string, base: string): string {
  const prefix = normalizeBase(base);
  if (prefix === '/') return path;
  if (path === prefix.slice(0, -1)) return '/';
  return path.startsWith(prefix) ? `/${path.slice(prefix.length)}` : path;
}

/** 公開時のパス接頭辞を前置した絶対パスを返す。既に付いていれば二重に付けない */
export function withBase(path: string, base: string): string {
  const prefix = normalizeBase(base);
  if (prefix === '/') return path;
  if (path === prefix || path.startsWith(prefix)) return path;
  return `${prefix.slice(0, -1)}${path}`;
}
```

- [ ] **Step 4: 通ることを確認**

Run: `pnpm exec vitest run tests/unit/i18n.test.ts`
Expected: PASS（既存 + 新規 9 件）

- [ ] **Step 5: 失敗するテストを書く（`localeFromPath` / `alternatePath` の base 対応）**

`tests/unit/i18n.test.ts` の既存の `localeFromPath` / `alternatePath` の呼び出しすべてに第 2（第 3）引数 `'/'` を足し、次を追加:

```ts
describe('localeFromPath（base 付き）', () => {
  it('base 付きのパスからロケールを判定する', () => {
    expect(localeFromPath('/portfolio/en/career/', '/portfolio/')).toBe('en');
  });

  it('base そのものはロケールなし', () => {
    expect(localeFromPath('/portfolio/', '/portfolio/')).toBeNull();
  });
});

describe('alternatePath（base 付き）', () => {
  it('言語接頭辞だけを置き換え、base を保つ', () => {
    expect(alternatePath('/portfolio/ja/photos/x/', 'en', '/portfolio/')).toBe(
      '/portfolio/en/photos/x/',
    );
  });

  it('base 付きのトップ', () => {
    expect(alternatePath('/portfolio/en/', 'ja', '/portfolio/')).toBe('/portfolio/ja/');
  });
});
```

- [ ] **Step 6: 失敗を確認**

Run: `pnpm exec vitest run tests/unit/i18n.test.ts`
Expected: FAIL（`/en/portfolio/ja/photos/x/` のような値が返る）

- [ ] **Step 7: `localeFromPath` / `alternatePath` を base 対応にする**

```ts
/** 先頭セグメントがロケールならそれを返す。base は取り除いてから見る */
export function localeFromPath(path: string, base: string): Locale | null {
  const first = stripBase(path, base).split('/').filter(Boolean)[0];
  return first !== undefined && isLocale(first) ? first : null;
}

/** 同じページの他言語版のパス。base は保つ */
export function alternatePath(path: string, target: Locale, base: string): string {
  const segments = stripBase(path, base).split('/').filter(Boolean);
  if (segments.length > 0 && isLocale(segments[0])) {
    segments[0] = target;
  } else {
    segments.unshift(target);
  }
  return withBase(`/${segments.join('/')}/`, base);
}
```

- [ ] **Step 8: 通ることを確認**

Run: `pnpm exec vitest run tests/unit/i18n.test.ts && pnpm typecheck`
Expected: テストは PASS。`pnpm typecheck` は `.astro` 側が未対応なのでこの時点では**落ちてよい**（Task 2 で直す）。落ちたエラーの一覧を報告に残す

- [ ] **Step 9: 失敗するテストを書く（`site.ts` の新関数）**

`tests/unit/site.test.ts` の既存の呼び出しに `'/'` を足し、末尾に追加:

```ts
describe('base 付きのパス生成', () => {
  const base = '/portfolio/';

  it('homePath', () => {
    expect(homePath('ja', base)).toBe('/portfolio/ja/');
    expect(homePath('en', '/')).toBe('/en/');
  });

  it('photoPath', () => {
    expect(photoPath(null, 'ja', base)).toBe('/portfolio/ja/photos/');
    expect(photoPath('sunset-dinghies', 'en', base)).toBe('/portfolio/en/photos/sunset-dinghies/');
    expect(photoPath(null, 'ja', '/')).toBe('/ja/photos/');
  });

  it('assetPath', () => {
    expect(assetPath('/favicon.svg', base)).toBe('/portfolio/favicon.svg');
    expect(assetPath('/favicon.svg', '/')).toBe('/favicon.svg');
  });

  it('navLinks はすべて base で始まる', () => {
    for (const link of navLinks('ja', base)) {
      expect(link.href.startsWith(base)).toBe(true);
    }
  });

  it('languageSwitch は base を保つ', () => {
    expect(languageSwitch('/portfolio/ja/career/', 'ja', base).href).toBe('/portfolio/en/career/');
  });

  it('alternateLinks は base 込みの絶対 URL を返す', () => {
    expect(alternateLinks('/portfolio/en/career/', 'https://example.com', base)).toEqual([
      { hreflang: 'ja', href: 'https://example.com/portfolio/ja/career/' },
      { hreflang: 'en', href: 'https://example.com/portfolio/en/career/' },
      { hreflang: 'x-default', href: 'https://example.com/portfolio/ja/career/' },
    ]);
  });
});
```

- [ ] **Step 10: 失敗を確認**

Run: `pnpm exec vitest run tests/unit/site.test.ts`
Expected: FAIL

- [ ] **Step 11: `site.ts` を実装**

`src/lib/site.ts` の既存 3 関数に `base` 引数を足し、`alternatePath` へ渡す。新関数を追加:

```ts
/** そのロケールのトップ */
export function homePath(lang: Locale, base: string): string {
  return withBase(`/${lang}/`, base);
}

/** 写真のギャラリー（slug が null）または個別ページ */
export function photoPath(slug: string | null, lang: Locale, base: string): string {
  return withBase(slug === null ? `/${lang}/photos/` : `/${lang}/photos/${slug}/`, base);
}

/** favicon などの静的アセット */
export function assetPath(path: string, base: string): string {
  return withBase(path, base);
}
```

`navLinks` は `photoPath` と `withBase` を使って組み立てる:

```ts
export function navLinks(lang: Locale, base: string): NavLink[] {
  return [
    { label: 'Photos', href: photoPath(null, lang, base) },
    { label: 'Career', href: withBase(`/${lang}/career/`, base) },
  ];
}
```

- [ ] **Step 12: 通ることを確認**

Run: `pnpm exec vitest run` （`pnpm test` でもよい）
Expected: 単体テストはすべて PASS

- [ ] **Step 13: コミット**

`tasks.md` の 1.1〜1.3 を `[x]` にしてから:

```bash
git add src/lib tests/unit openspec/changes/deploy-and-e2e/tasks.md
git commit -m "$(cat <<'EOF'
feat: 公開時のパス接頭辞を剥がす・前置する純関数を追加する

localeFromPath / alternatePath / navLinks / languageSwitch / alternateLinks が
base を受け取るようになった。.astro 側の対応は次のタスク。
EOF
)"
```

（この時点で `pnpm typecheck` は落ちる。Task 2 で解消するので、コミットメッセージにその旨を書いてある）

---

### Task 2: `base` の適用と全ページの書き換え（tasks.md の 2.1〜2.2）

**Files:**
- Modify: `astro.config.ts`、`src/layouts/BaseLayout.astro`、`src/components/Header.astro`、`src/pages/index.astro`、`src/pages/404.astro`、`src/pages/[lang]/index.astro`、`src/pages/[lang]/career.astro`、`src/pages/[lang]/photos/index.astro`、`src/pages/[lang]/photos/[slug].astro`
- Modify: `openspec/changes/deploy-and-e2e/tasks.md`（2.1〜2.2 を `[x]`）

**Interfaces:**
- Consumes: Task 1 の全関数。`.astro` 側は `import.meta.env.BASE_URL` を渡す
- Produces: `/portfolio/` 配下で正しく動く `dist/`

- [ ] **Step 1: `astro.config.ts` に `base` を足す**

`site` の次の行に `base: '/portfolio',` を追加（`site` は変えない。design D7）。

- [ ] **Step 2: `.astro` を書き換える**

各ファイルの先頭で `const base = import.meta.env.BASE_URL;` を定義し、Task 1 の関数に渡す。

- `src/layouts/BaseLayout.astro`: `localeFromPath(path, base)`、`alternateLinks(path, Astro.site, base)`、`<link rel="icon" href={assetPath('/favicon.svg', base)}>`
- `src/components/Header.astro`: ロゴ `href={homePath(lang, base)}`、`navLinks(lang, base)`、`languageSwitch(path, lang, base)`。**`base` は `Astro.props` で受け取らず、このファイル内で `import.meta.env.BASE_URL` を読む**（props を増やさない）
- `src/pages/404.astro`: 戻りリンク `href={homePath(lang, base)}`
- `src/pages/index.astro`: `<meta http-equiv="refresh" content={`0;url=${homePath('ja', base)}`} />`、本文リンクも同じ、favicon も `assetPath`。**このファイルは `BaseLayout` を使わない素の HTML なので、`import` を自分で書く**
- `src/pages/[lang]/index.astro`: `navLinks(lang, base)`、`languageSwitch(Astro.url.pathname, lang, base)`
- `src/pages/[lang]/career.astro`: 変更不要（外部リンクのみ）。**ただし `pnpm typecheck` で確認する**
- `src/pages/[lang]/photos/index.astro`: カードの `href={photoPath(photo.id, lang, base)}`
- `src/pages/[lang]/photos/[slug].astro`: 前後リンクとギャラリーへ戻るリンクを `photoPath(...)` に

- [ ] **Step 3: ビルドして dist を検査する**

Run:

```bash
pnpm build
echo "--- 直書きの残り（0 件が期待値） ---"; grep -rn 'href="/' src | wc -l
echo "--- en の lang（en が期待値） ---"; grep -o '<html lang="[^"]*"' dist/en/index.html
echo "--- hreflang の本数（3 が期待値） ---"; grep -c 'rel="alternate"' dist/en/career/index.html
echo "--- career の href（同一オリジンはすべて /portfolio/ 始まり） ---"; grep -o 'href="/[^"]*"' dist/en/career/index.html | sort -u
echo "--- リダイレクト先（/portfolio/ja/ が期待値） ---"; grep -o 'url=[^"]*' dist/index.html
echo "--- 404 の戻りリンク ---"; grep -o 'href="/[^"]*"' dist/404.html | sort -u
echo "--- srcset の接頭辞 ---"; grep -o 'srcset="[^"]*"' dist/ja/photos/index.html | head -2
```

Expected: 直書き 0 件、`en`、`3`、`href` はすべて `/portfolio/` 始まり、`url=/portfolio/ja/`、404 の戻りリンクは `/portfolio/ja/` と `/portfolio/en/`、`srcset` も `/portfolio/_astro/...`

**どれか 1 つでも期待と違ったら、その値を報告に書いてから直す。**

- [ ] **Step 4: preview で実測する**

Run:

```bash
pnpm preview   # 出力される URL とポートを必ず報告に書く
```

そのうえで `curl` ではなくブラウザ相当の確認として、次を実行して結果を報告に貼る:

```bash
BASEURL=http://127.0.0.1:4321   # preview が出した実際のポートに合わせる
node -e "
const b=process.env.BASEURL||'http://127.0.0.1:4321';
for (const p of ['/portfolio/','/portfolio/ja/','/portfolio/en/career/','/portfolio/ja/photos/','/portfolio/favicon.svg','/portfolio/ja/']) {
  fetch(b+p).then(r=>console.log(r.status, p)).catch(e=>console.log('ERR', p, e.message));
}
"
pnpm exec astro preview stop
```

Expected: すべて 200（`/portfolio/` は `dist/index.html` が返るので 200 で、中身が `/portfolio/ja/` へのリダイレクト）。**preview の URL に `/portfolio/` が含まれるかをここで確定させ、報告に明記する**（Task 3 の `baseURL` に使う）

- [ ] **Step 5: 検証コマンド**

Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
Expected: すべて緑（12 ページ）

- [ ] **Step 6: コミット**

`tasks.md` の 2.1〜2.2 を `[x]` にしてから:

```bash
git add astro.config.ts src openspec/changes/deploy-and-e2e/tasks.md
git commit -m "$(cat <<'EOF'
feat: base: '/portfolio' を適用し全ページのパスを接頭辞付きにする

dist の検査で <html lang>・hreflang 3 本・全リンクの接頭辞・リダイレクト先を確認した。
EOF
)"
```

---

### Task 3: e2e の土台とページの検査（tasks.md の 3.1〜3.3）

**Files:**
- Create: `playwright.config.ts`、`tests/e2e/pages.spec.ts`、`tests/e2e/network.spec.ts`
- Modify: `package.json`、`pnpm-lock.yaml`、`.gitignore`
- Modify: `openspec/changes/deploy-and-e2e/tasks.md`（3.1〜3.3 を `[x]`）

**Interfaces:**
- Consumes: Task 2 の `dist/`、`pnpm preview`
- Produces: `pnpm e2e`

- [ ] **Step 1: 依存を入れる（1 回だけ）**

```bash
pnpm add -D @playwright/test @axe-core/playwright
pnpm exec playwright install chromium
```

`.gitignore` に `test-results/` と `playwright-report/` が既にあることを確認する（あるはず）。

- [ ] **Step 2: `playwright.config.ts` を書く**

**コントローラーの裁定（2026-09-21。実測に基づく。実装者はこの方針に従う）**:

1. `astro preview` は **既定でバックグラウンドのデーモンとして起動し、コマンド自体はすぐ終了する**（`astro preview --help` に `stop` / `status` / `logs` サブコマンドと `--background` フラグがあり、実測で `pnpm preview` が pid を表示して exit 0 で戻る）。Playwright の `webServer` はプロセスが生き続けることを前提にするので、**`webServer` は使わない**
2. `astro preview` の既定ポート 4321 は**このマシンでは別プロセスが占有している**（実測でポートが 4322 に自動変更された）。ポートが実行ごとに変わると `baseURL` を固定できないので、**`--port 4399` を明示する**
3. よって `playwright.config.ts` では `globalSetup` / `globalTeardown` を使う

```ts
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export const PORT = 4399;
export const baseURL = `http://127.0.0.1:${PORT}/portfolio/`;

export default defineConfig({
  testDir: 'tests/e2e',
  reporter: 'list',
  globalSetup: './tests/e2e/global-setup.ts',
  globalTeardown: './tests/e2e/global-teardown.ts',
  use: { baseURL },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
```

```ts
// tests/e2e/global-setup.ts
import { execSync } from 'node:child_process';
import { PORT } from '../../playwright.config';

export default function globalSetup(): void {
  execSync('pnpm build', { stdio: 'inherit' });
  // astro preview はデーモンとして起動し、すぐ戻る
  execSync(`pnpm exec astro preview --port ${PORT}`, { stdio: 'inherit' });
}
```

```ts
// tests/e2e/global-teardown.ts
import { execSync } from 'node:child_process';

export default function globalTeardown(): void {
  execSync('pnpm exec astro preview stop', { stdio: 'inherit' });
}
```

**この形で動かなかったら**（デーモンの起動完了を待たずにテストが始まる、`stop` が別のポートのサーバーを止める、など）、実測した事実を報告に書いたうえで次の順に試す:

1. `global-setup.ts` で起動後に `fetch` を 200 が返るまで（最大 60 秒）ポーリングする
2. `--ignore-lock` を足す
3. それでも駄目なら `execSync` をやめ、`spawn` で `astro preview --port <PORT>` を前景実行して `globalTeardown` で `kill` する

**どれを採ったか、なぜかを報告に書く。**

- [ ] **Step 3: `package.json` に `e2e` を足す**

```json
    "e2e": "playwright test",
```

- [ ] **Step 4: 土台が成立することを確認**

Run: `pnpm e2e`
Expected: 「no tests found」相当で終了コード 0（テストがまだ無い）。ここで配信が立ち上がることを確認する

Run: `pnpm lint && pnpm typecheck`
Expected: 緑（`tests/e2e/` と `playwright.config.ts` も対象になる）

- [ ] **Step 5: ページの検査を書く**

`tests/e2e/pages.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

const locales = ['ja', 'en'] as const;
const slug = 'kariya-ferris-wheel';

/** 5 種類 × 2 言語。パスは baseURL からの相対（先頭スラッシュなし） */
const pagePaths = locales.flatMap((lang) => [
  `${lang}/`,
  `${lang}/photos/`,
  `${lang}/photos/${slug}/`,
  `${lang}/career/`,
]);

test('ルートは既定ロケールのトップへ遷移する', async ({ page }) => {
  await page.goto('./');
  await expect(page).toHaveURL(/\/portfolio\/ja\/$/);
});

for (const path of pagePaths) {
  const lang = path.slice(0, 2);

  test(`${path} が表示され lang と hreflang が正しい`, async ({ page }) => {
    const response = await page.goto(`./${path}`);
    expect(response?.status()).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('lang', lang);

    const alternates = page.locator('link[rel="alternate"][hreflang]');
    await expect(alternates).toHaveCount(3);
    for (const href of await alternates.evaluateAll((ls) =>
      ls.map((l) => l.getAttribute('href') ?? ''),
    )) {
      expect(href.startsWith('https://joe-yama.github.io/portfolio/')).toBe(true);
    }
  });
}

test('404 ページが両言語への戻りリンクを持つ', async ({ page }) => {
  const response = await page.goto('./does-not-exist/');
  expect(response?.status()).toBe(404);
  await expect(page.locator('a[href$="/portfolio/ja/"]')).toHaveCount(1);
  await expect(page.locator('a[href$="/portfolio/en/"]')).toHaveCount(1);
});

test('言語切り替えは同じページの他言語版へ飛ぶ', async ({ page }) => {
  await page.goto('./ja/career/');
  await page.locator('header a[hreflang="en"]').click();
  await expect(page).toHaveURL(/\/portfolio\/en\/career\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('写真は picture として出力される', async ({ page }) => {
  await page.goto('./ja/photos/');
  await expect(page.locator('picture').first()).toBeVisible();
  const sources = page.locator('picture source');
  expect(await sources.count()).toBeGreaterThan(0);
});
```

`slug` は実データに合わせる。**`ls src/content/photos/` で確認してから書く**（`kariya-ferris-wheel` と `sunset-dinghies` の 2 枚）。

- [ ] **Step 6: 通ることを確認**

Run: `pnpm e2e`
Expected: すべて PASS。**落ちた場合は実装（`.astro`）を疑う。テストの期待値を緩めない**

- [ ] **Step 7: 外部通信ゼロの検査を書く**

`tests/e2e/network.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

const paths = ['ja/', 'en/', 'ja/photos/', 'ja/photos/kariya-ferris-wheel/', 'ja/career/'];

for (const path of paths) {
  test(`${path} は外部ホストへ要求しない`, async ({ page }) => {
    const external: string[] = [];
    page.on('request', (request) => {
      const host = new URL(request.url()).hostname;
      if (host !== '127.0.0.1' && host !== 'localhost') external.push(request.url());
    });
    await page.goto(`./${path}`, { waitUntil: 'networkidle' });
    expect(external).toEqual([]);
  });
}
```

- [ ] **Step 8: 通ることを確認**

Run: `pnpm e2e`
Expected: すべて PASS

- [ ] **Step 9: コミット**

`tasks.md` の 3.1〜3.3 を `[x]` にしてから:

```bash
git add playwright.config.ts tests/e2e package.json pnpm-lock.yaml openspec/changes/deploy-and-e2e/tasks.md
git commit -m "$(cat <<'EOF'
test: Playwright で base 配下のページ表示と外部通信ゼロを検査する

pnpm e2e を追加。ビルド済みの dist を preview で配信して Chromium で検査する。
EOF
)"
```

---

### Task 4: アクセシビリティと内部リンク検査（tasks.md の 4.1〜4.2）

**Files:**
- Create: `tests/e2e/a11y.spec.ts`、`tests/e2e/links.spec.ts`
- Modify: `src/pages/[lang]/index.astro`、`src/pages/[lang]/photos/[slug].astro`、`src/lib/site.ts`、`tests/unit/site.test.ts`
- Modify: `openspec/changes/deploy-and-e2e/tasks.md`（4.1〜4.2 を `[x]`）

**Interfaces:**
- Consumes: Task 3 の `pnpm e2e`
- Produces: axe 違反 0 件のページ、`dist` のリンク検査

- [ ] **Step 1: axe の検査を書く**

`tests/e2e/a11y.spec.ts`:

```ts
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const paths = [
  'ja/',
  'en/',
  'ja/photos/',
  'en/photos/',
  'ja/photos/kariya-ferris-wheel/',
  'en/photos/kariya-ferris-wheel/',
  'ja/career/',
  'en/career/',
  'does-not-exist/',
];

for (const path of paths) {
  test(`${path} にアクセシビリティ違反が無い`, async ({ page }) => {
    await page.goto(`./${path}`);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.length} 件`)).toEqual([]);
  });
}
```

- [ ] **Step 2: 落ちることを確認し、違反の一覧を記録する**

Run: `pnpm e2e tests/e2e/a11y.spec.ts`
Expected: `landmark-unique` が `ja/` と `en/` で落ちる（Change 4 の申し送り）。**出力される違反 ID をすべて報告に書く**

- [ ] **Step 3: `landmark-unique` を直す**

`src/lib/site.ts` の `ui` に本文の導線の見出しを足す（型 `UiStrings` にも追加）:

```ts
    siteNav: 'サイト内の案内',   // ja
    siteNav: 'Site navigation',  // en
    photoNav: '前後の写真',      // ja
    photoNav: 'Photo navigation', // en
```

`tests/unit/site.test.ts` に「両ロケールで `siteNav` と `photoNav` が空でない」テストを足す。

`src/pages/[lang]/index.astro`:
- 連絡先の `<nav class="links">` を `<ul class="links">` + `<li>` に変える（CSS の `.links` は `list-style: none; padding: 0;` を足す）
- 本文の導線の `<nav class="links">` に `aria-label={ui[lang].siteNav}` を付ける

`src/pages/[lang]/photos/[slug].astro`:
- `<nav class="around">` に `aria-label={t.photoNav}` を付ける

- [ ] **Step 4: 違反が消えることを確認**

Run: `pnpm e2e && pnpm test && pnpm typecheck && pnpm lint`
Expected: すべて PASS。**別の違反が出たら、設計書 §7 の範囲内なら直し、範囲外なら「裁定 / 理由 / 代償」を報告に書いて `tasks.md` の提案に回す。`disableRules` は使わない**

- [ ] **Step 5: 内部リンク検査を書く**

`tests/e2e/links.spec.ts`（ブラウザを使わず `fs` で `dist/` を走査する。`test` の中で完結させる）:

```ts
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

const dist = 'dist';
const base = '/portfolio/';

function htmlFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return htmlFiles(full);
    return full.endsWith('.html') ? [full] : [];
  });
}

/** `/portfolio/ja/career/` → `dist/ja/career/index.html` */
function resolveToDist(ref: string): string {
  const path = ref.split('#')[0]?.split('?')[0] ?? '';
  const relative = path.slice(base.length);
  const target = join(dist, relative);
  return path.endsWith('/') || relative === '' ? join(target, 'index.html') : target;
}

test('ビルド出力の内部参照がすべて解決する', () => {
  const files = htmlFiles(dist);
  expect(files.length).toBeGreaterThan(0);

  const missing: string[] = [];
  for (const file of files) {
    const html = readFileSync(file, 'utf8');
    const refs = [
      ...[...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((m) => m[1] ?? ''),
      ...[...html.matchAll(/srcset="([^"]+)"/g)].flatMap((m) =>
        (m[1] ?? '').split(',').map((part) => part.trim().split(/\s+/)[0] ?? ''),
      ),
    ];
    for (const ref of refs) {
      if (!ref.startsWith('/')) continue;
      if (!ref.startsWith(base)) {
        missing.push(`${file}: ${ref}（接頭辞 ${base} が無い）`);
        continue;
      }
      if (!existsSync(resolveToDist(ref))) missing.push(`${file}: ${ref}`);
    }
  }
  expect(missing).toEqual([]);
});
```

- [ ] **Step 6: 通ることを確認**

Run: `pnpm e2e tests/e2e/links.spec.ts`
Expected: PASS

- [ ] **Step 7: 検査が本当に番人かを確かめる**

```bash
mv dist/favicon.svg /private/tmp/claude-501/-Users-joe-repo-github-personal-joe-yama-portfolio/5a7fff1d-08ec-4f26-a948-1635ca46e9fc/scratchpad/favicon.svg.bak
pnpm e2e tests/e2e/links.spec.ts; echo "exit=$?"
mv /private/tmp/claude-501/-Users-joe-repo-github-personal-joe-yama-portfolio/5a7fff1d-08ec-4f26-a948-1635ca46e9fc/scratchpad/favicon.svg.bak dist/favicon.svg
```

Expected: 1 回目が `exit=1` で `favicon.svg` が報告される。**出力を報告に貼る。** ただし `webServer` が `pnpm build` を走らせる設定だと `dist` が再生成されて検査が通ってしまう。その場合は `pnpm build` を先に 1 回行い、`webServer` の `command` から `pnpm build` を外した状態で試す（または `dist/ja/career/index.html` から参照されているアセットを退避する）。**どうやって番人であることを示したかを報告に書く**

- [ ] **Step 8: 検証コマンド**

Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm e2e`
Expected: すべて緑

- [ ] **Step 9: コミット**

`tasks.md` の 4.1〜4.2 を `[x]` にしてから:

```bash
git add tests src openspec/changes/deploy-and-e2e/tasks.md
git commit -m "$(cat <<'EOF'
test: axe の違反ゼロとビルド出力の内部リンク解決を検査する

landmark-unique の違反を直すため、トップの連絡先を ul にし、
本文の導線と写真の前後ナビに aria-label を付けた。
EOF
)"
```

---

### Task 5: CI とデプロイの workflow（tasks.md の 5.1〜5.2）

**Files:**
- Modify: `.github/workflows/ci.yml`
- Create: `.github/workflows/deploy.yml`
- Modify: `openspec/changes/deploy-and-e2e/tasks.md`（5.1〜5.2 を `[x]`）

**Interfaces:**
- Produces: PR での e2e 実行、`main` への push での自動デプロイ

- [ ] **Step 1: `ci.yml` に e2e を足す**

`- run: pnpm build` の後に:

```yaml
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm e2e
```

**`jobs.check` の名前は変えない。**

- [ ] **Step 2: `deploy.yml` を書く**

```yaml
name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

# 同時に複数のデプロイを走らせない
concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: withastro/action@v6
        with:
          # .node-version は読まれないので明示する（README で確認。既定は 24）
          node-version: 26.8.2

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v5
```

- [ ] **Step 3: YAML の構文を確認**

Run:

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml')); yaml.safe_load(open('.github/workflows/deploy.yml')); print('yaml ok')"
```

Expected: `yaml ok`

- [ ] **Step 4: 検証コマンド**

Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm e2e`
Expected: すべて緑

- [ ] **Step 5: コミット**

`tasks.md` の 5.1〜5.2 を `[x]` にしてから:

```bash
git add .github openspec/changes/deploy-and-e2e/tasks.md
git commit -m "$(cat <<'EOF'
ci: CI に e2e を足し、main への push で Pages へデプロイする

withastro/action は .node-version を読まないので node-version を明示した。
EOF
)"
```

---

## レビューの単位

- **単位 A = Task 1 + Task 2**（`base` 対応。共有インターフェースと全ページ。**UI 実測あり**: `http://127.0.0.1:4321/portfolio/` のリダイレクト、`/portfolio/en/` の `documentElement.lang` と hreflang、ヘッダー 4 リンクの `href`、favicon の 200）
- **単位 B = Task 3 + Task 4**（e2e とリンク検査。テストが本当に番人かを reviewer が変異で確かめる）
- **単位 C = Task 5**（workflow 2 本）
- **ブランチ全体 1 回**

Minor は修正せず `openspec/changes/deploy-and-e2e/tasks.md` 末尾の「提案」に転記する。
