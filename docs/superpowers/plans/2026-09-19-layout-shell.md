# ポートフォリオサイト v1 実装計画 — Change 2: layout-shell

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. 実装は `subagent_type: implementer`（Sonnet）、レビューは `subagent_type: reviewer`（Opus）で起こす。切り替え条件と手順は `.claude/rules/review.md`。GitHub Issue は #3。

**Goal:** 全ページ共通のレイアウト（メタデータ・ヘッダー・フッター・モノトーン配色・DotGothic16・仮のドット絵・404）を作り、PO がスクリーンショットで見た目を承認できる状態にする。

**Architecture:** `BaseLayout.astro` 1 つが `<head>`・Header・`<main><slot/>`・Footer を持ち、ページは本文だけ書く。色は `src/styles/global.css` の CSS 変数 4 つ、字体は Astro 7 の Fonts API（Google プロバイダー）が生成する `--font-dot`。hreflang・ナビ・言語切り替えのリンク計算とドット絵のデータは `src/lib/` の純 TS に置いて Vitest で検証し、`.astro` は並べるだけにする。見た目はレビュアーの Playwright MCP と PO のスクリーンショットで確認する。

**Tech Stack:** Astro 7.3.2（Fonts API、`<Font>`）、TypeScript strict、Vitest、Biome。依存追加なし。

**Spec:** `openspec/changes/layout-shell/specs/layout-shell/spec.md`（新規）、`openspec/changes/layout-shell/specs/quality-gates/spec.md`（修正）、`openspec/changes/layout-shell/design.md`（D1〜D8）、設計書 `docs/superpowers/specs/2026-09-17-portfolio-site-design.md` §4・§6・§7

## Global Constraints

- パッケージマネージャは **pnpm** のみ。`npm` / `npx` はコマンド・スクリプト・ドキュメントのどこにも書かない
- **依存を追加しない**。Fonts API は Astro 本体の機能。必要になったら PO に用途・ライセンス・メンテ状況を 1 行ずつ提示して止まる
- 配信 JavaScript ゼロ。`<script>` を 1 つも書かない（Astro の島も使わない）
- 公開サイトからの外部通信ゼロ。出力 HTML の `https://` 参照は `<a href>` と `<link rel="alternate" hreflang>` だけ。`@font-face` の `url(` は同一オリジン（`/_astro/fonts/…`）。`<Font>` に `preload` を付けない
- 全ページは `/ja/` と `/en/` の下。例外はルートのリダイレクトと `/404.html` のみ
- ナビの表示は両言語とも英字「Photos」「Career」。言語切り替えの表示は日本語ページで「English」、英語ページで「日本語」。ロゴは `profile` の `name`
- 色は無彩色のみ。ライト/ダークは `prefers-color-scheme` に追従し、切り替え UI を置かない。本文・薄い文字と背景のコントラスト比は両テーマで 4.5:1 以上
- `src/pages/[lang]/index.astro` の `await getCareer(lang)` を消さない（日英件数検証をビルドに乗せる唯一の経路。Issue #1）
- `Astro.params.lang as Locale` はそのまま（`isLocale` ガード化は Change 3）
- テストなしのコミット禁止。RED → GREEN → REFACTOR。テストの skip / 削除 / 期待値の書き換えで通すことは禁止（`.claude/rules/testing.md`）
- コミットメッセージは日本語、先頭に `feat:` / `test:` / `chore:` / `docs:` / `refactor:`。末尾に system-reminder の attribution 行を付ける。`git commit` はサンドボックス外（`dangerouslyDisableSandbox: true`）で実行する
- `.claude/settings.json` / `.claude/hooks/` は Write / Edit ツールで編集する（サンドボックス内 Bash からは書けない）
- ブロッカー・方針変更・実装開始・レビュー結果は Issue #3 にコメントする。`gh` の書き込み前に `gh api user --jq .login` が `joe-yama` であることを確認する
- 各タスクの終わりに `pnpm lint && pnpm typecheck && pnpm test` が 0 であることを確認してからコミットする（ビルドを含むタスクは `pnpm build` も）

## 実行前の前提（実装タスクではない）

1. PO が proposal を承認している（Issue #3 コメント、2026-09-19）
2. `superpowers:using-git-worktrees` で `feature/layout-shell` ブランチの worktree を作り、その中で作業する
3. Issue #3 に「実装開始」をコメントしてから Task 1 に入る

## 確認済みの事実（2026-09-19、`node_modules/astro/` 7.3.2 で確認）

- `import { defineConfig, fontProviders } from 'astro/config'`。`fontProviders.google()` が使える
- `import { Font } from 'astro:assets'`。`<Font cssVariable="--font-dot" />` が `<style>` に `@font-face` と `:root { --font-dot: … }` を出す。`preload` 省略時は `<link rel="preload">` を出さない
- `fonts[]` の項目: `name`、`cssVariable`、`provider`、`weights`、`styles`、`subsets`、`fallbacks`、`display`（`auto | block | swap | fallback | optional`）
- Google の CSS の `unicode-range` はそのまま `@font-face` に出る。取得した woff2 は `dist/_astro/fonts/` に出力される
- サンドボックスから `fonts.googleapis.com` と `fonts.gstatic.com` に到達できる（DotGothic16 は 123 片の woff2）
- `Astro.url.pathname` は末尾スラッシュの有無が場面で揺れるが、`alternatePath` が正規化するので依存しない

## ファイル構成（この change で作る・変えるもの）

```
src/lib/site.ts                     # alternateLinks / navLinks / languageSwitch / ui（純 TS）
src/lib/pixel.ts                    # ドット絵のデータ（camera / lost）と cells()（純 TS）
src/styles/global.css               # 色変数 4 つ、テーマ、リセット最小限、.dot / .muted
src/components/pixel/PixelArt.astro # rows → <svg><rect/></svg>
src/components/Header.astro         # ロゴ + ナビ + 言語切り替え
src/components/Footer.astro         # © 年 名前
src/layouts/BaseLayout.astro        # <head> + Header + <main><slot/> + Footer
src/pages/[lang]/index.astro        # BaseLayout に載せ替え（本文は名前と一行紹介 + アイコン）
src/pages/404.astro                 # /404.html
astro.config.ts                     # fonts 追加、output 削除
package.json                        # engines 削除
biome.json                          # 既定と重複する除外の削除
src/content/schemas.ts              # 重複定義の集約
.claude/hooks/lint-on-edit.sh, test-on-stop.sh   # detect_* の inline 化
docs/harness/hooks.md               # 上記の記述を合わせる
tests/unit/site.test.ts, tests/unit/pixel.test.ts
openspec/changes/layout-shell/tasks.md
```

責務: `site.ts` は「リンクと文字列の計算」、`pixel.ts` は「絵のデータ」、`global.css` は「値」、`.astro` は「並べる」。ページは `BaseLayout` と `content.ts` だけを使う。

---

### Task 1: リンク計算と UI 文字列の純関数 `src/lib/site.ts`

**Files:**
- Create: `src/lib/site.ts`
- Test: `tests/unit/site.test.ts`

**Interfaces:**
- Consumes: `src/lib/i18n.ts` の `Locale`、`locales`、`otherLocale(locale)`、`alternatePath(path, target)`
- Produces:
  - `type AlternateLink = { hreflang: Locale | 'x-default'; href: string }`
  - `alternateLinks(path: string, site: string | URL): AlternateLink[]` — 順に `ja`、`en`、`x-default`（`ja` と同じ href）。href は絶対 URL
  - `type NavLink = { label: string; href: string }`
  - `navLinks(lang: Locale): NavLink[]` — `[{ label: 'Photos', href: '/<lang>/photos/' }, { label: 'Career', href: '/<lang>/career/' }]`
  - `type LanguageSwitch = { label: string; href: string; hreflang: Locale }`
  - `languageSwitch(path: string, lang: Locale): LanguageSwitch` — 相手の言語名、同じページの他言語版
  - `ui: Record<Locale, { languageName: string; notFound: string; backToTop: string }>`

- [ ] **Step 1: 失敗するテストを書く**

`tests/unit/site.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { alternateLinks, languageSwitch, navLinks, ui } from '../../src/lib/site';

describe('alternateLinks', () => {
  it('ja / en / x-default の 3 本を絶対 URL で返し、x-default は ja と同じ', () => {
    expect(alternateLinks('/ja/', 'https://example.com')).toEqual([
      { hreflang: 'ja', href: 'https://example.com/ja/' },
      { hreflang: 'en', href: 'https://example.com/en/' },
      { hreflang: 'x-default', href: 'https://example.com/ja/' },
    ]);
  });

  it('下位ページでも接頭辞だけを置き換える', () => {
    expect(alternateLinks('/en/career/', new URL('https://example.com'))).toEqual([
      { hreflang: 'ja', href: 'https://example.com/ja/career/' },
      { hreflang: 'en', href: 'https://example.com/en/career/' },
      { hreflang: 'x-default', href: 'https://example.com/ja/career/' },
    ]);
  });

  it('末尾スラッシュの無いパスも正規化する', () => {
    expect(alternateLinks('/ja', 'https://example.com')[0]?.href).toBe('https://example.com/ja/');
  });
});

describe('navLinks', () => {
  it('Photos → Career の順で、そのロケールの下を指す', () => {
    expect(navLinks('ja')).toEqual([
      { label: 'Photos', href: '/ja/photos/' },
      { label: 'Career', href: '/ja/career/' },
    ]);
    expect(navLinks('en')).toEqual([
      { label: 'Photos', href: '/en/photos/' },
      { label: 'Career', href: '/en/career/' },
    ]);
  });
});

describe('languageSwitch', () => {
  it('日本語ページでは English を表示し、同じページの英語版へ', () => {
    expect(languageSwitch('/ja/career/', 'ja')).toEqual({
      label: 'English',
      href: '/en/career/',
      hreflang: 'en',
    });
  });

  it('英語ページでは 日本語 を表示し、同じページの日本語版へ', () => {
    expect(languageSwitch('/en/', 'en')).toEqual({ label: '日本語', href: '/ja/', hreflang: 'ja' });
  });
});

describe('ui', () => {
  it('両言語に 404 の文言と戻りリンクの文言がある', () => {
    expect(ui.ja.notFound).toBe('ページが見つかりません');
    expect(ui.en.notFound).toBe('Page not found');
    expect(ui.ja.backToTop.length).toBeGreaterThan(0);
    expect(ui.en.backToTop.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: 失敗を確認する**

Run: `pnpm test`
Expected: FAIL。`Failed to resolve import "../../src/lib/site"` または同等のモジュール未解決エラー

- [ ] **Step 3: 実装する**

`src/lib/site.ts`:

```ts
import { alternatePath, type Locale, locales, otherLocale } from './i18n';

export type AlternateLink = { hreflang: Locale | 'x-default'; href: string };
export type NavLink = { label: string; href: string };
export type LanguageSwitch = { label: string; href: string; hreflang: Locale };

type UiStrings = { languageName: string; notFound: string; backToTop: string };

/** 画面に出す文字列。ナビの「Photos」「Career」は両言語とも英字なので navLinks に直接書く */
export const ui: Record<Locale, UiStrings> = {
  ja: { languageName: '日本語', notFound: 'ページが見つかりません', backToTop: '日本語のトップへ' },
  en: { languageName: 'English', notFound: 'Page not found', backToTop: 'Go to the English top' },
};

/** hreflang の 3 本。x-default は既定ロケール（ja）と同じ */
export function alternateLinks(path: string, site: string | URL): AlternateLink[] {
  const href = (lang: Locale) => new URL(alternatePath(path, lang), site).href;
  return [
    ...locales.map((lang) => ({ hreflang: lang, href: href(lang) })),
    { hreflang: 'x-default', href: href('ja') },
  ];
}

export function navLinks(lang: Locale): NavLink[] {
  return [
    { label: 'Photos', href: `/${lang}/photos/` },
    { label: 'Career', href: `/${lang}/career/` },
  ];
}

/** 相手の言語名を表示し、同じページの他言語版へ飛ぶリンク */
export function languageSwitch(path: string, lang: Locale): LanguageSwitch {
  const target = otherLocale(lang);
  return { label: ui[target].languageName, href: alternatePath(path, target), hreflang: target };
}
```

- [ ] **Step 4: 緑を確認する**

Run: `pnpm test && pnpm lint && pnpm typecheck`
Expected: Vitest は既存 34 + 新規 7 = 41 passed。lint 0、typecheck 0 errors（Biome が 1 行の長さで整形を求めたら `pnpm format` で直す）

- [ ] **Step 5: コミット**

```bash
git add src/lib/site.ts tests/unit/site.test.ts
git commit -m "feat: hreflang・ナビ・言語切り替えのリンク計算と UI 文字列を純関数 site.ts に追加"
```

---

### Task 2: DotGothic16（Fonts API）とグローバル CSS

**Files:**
- Modify: `astro.config.ts`
- Create: `src/styles/global.css`

**Interfaces:**
- Produces: CSS 変数 `--bg` / `--fg` / `--fg-muted` / `--line`、`--font-dot`（`<Font>` が定義。Task 5 で `<head>` に置く）、クラス `.dot`（ドット文字）と `.muted`（薄い文字）、`html` / `body` / `main` / `a` / `:focus-visible` / `h1` の基本スタイル

- [ ] **Step 1: `astro.config.ts` に `fonts` を追加する**

```ts
import { defineConfig, fontProviders } from 'astro/config';

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
      redirectToDefaultLocale: false,
    },
  },
  image: {
    // 写真は GitHub Releases の URL（github.com → objects.githubusercontent.com にリダイレクト）
    domains: ['github.com'],
  },
  fonts: [
    {
      // ロゴ・ナビ・見出しのドット文字。ビルド時に Google Fonts から unicode-range 分割済みの
      // woff2 を取得し dist/_astro/fonts/ から自己配信する（設計書 §7、PO 決定 2026-09-18）
      provider: fontProviders.google(),
      name: 'DotGothic16',
      cssVariable: '--font-dot',
      weights: [400],
      styles: ['normal'],
      subsets: ['japanese', 'latin'],
      display: 'swap',
      fallbacks: ['system-ui', 'sans-serif'],
    },
  ],
});
```

（`output: 'static'` は Task 7 で消す。ここでは触らない）

- [ ] **Step 2: フォントの取得とビルドを確認する**

Run: `pnpm typecheck && pnpm build 2>&1 | tail -20 && ls dist/_astro/fonts | head -5 && ls dist/_astro/fonts | wc -l`
Expected: typecheck 0 errors。ビルドが成功し `[WARN]` が無い。`dist/_astro/fonts/` に `.woff2` が複数ある（この時点では `<Font>` を使うページが無いので、ファイルが出力されない場合もある。その場合は Task 5 の Step 6 で改めて確認する）。取得に失敗（ネットワークエラー）したら、出力を添えて Issue #3 にコメントし、PO に報告して止まる

- [ ] **Step 3: `src/styles/global.css` を作る**

```css
/* 色は無彩色 4 つだけ。ライトが既定、ダークは OS 設定に追従（設計書 §7） */
:root {
  color-scheme: light dark;
  --bg: #fafafa;
  --fg: #111111;
  --fg-muted: #5c5c5c;
  --line: #d4d4d4;
  --font-body: system-ui, sans-serif;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0c0c0c;
    --fg: #e8e8e8;
    --fg-muted: #9a9a9a;
    --line: #2a2a2a;
  }
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  background: var(--bg);
  color: var(--fg);
  font-family: var(--font-body);
  line-height: 1.6;
  -webkit-text-size-adjust: 100%;
}

body {
  margin: 0;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

main {
  flex: 1;
  width: 100%;
  max-width: 80rem;
  margin: 0 auto;
  padding: 2rem 1rem;
}

a {
  color: inherit;
  text-decoration: underline;
  text-underline-offset: 0.2em;
}

:focus-visible {
  outline: 2px solid var(--fg);
  outline-offset: 2px;
}

/* ドット文字。--font-dot は <Font> が :root に定義する */
.dot,
h1,
h2,
h3 {
  font-family: var(--font-dot);
  font-weight: 400;
}

h1 {
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  margin: 0 0 0.5rem;
}

.muted {
  color: var(--fg-muted);
}
```

- [ ] **Step 4: コントラスト比を計算して記録する**

Run:

```bash
node -e '
const lum = (hex) => { const c = [1,3,5].map((i) => parseInt(hex.slice(i, i+2), 16) / 255).map((v) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); return 0.2126*c[0] + 0.7152*c[1] + 0.0722*c[2]; };
const ratio = (a, b) => { const [h, l] = [lum(a), lum(b)].sort((x, y) => y - x); return ((h + 0.05) / (l + 0.05)).toFixed(2); };
for (const [bg, fg, muted] of [["#fafafa","#111111","#5c5c5c"],["#0c0c0c","#e8e8e8","#9a9a9a"]]) console.log(bg, "fg", ratio(bg, fg), "muted", ratio(bg, muted));
'
```

Expected: ライト `fg` 約 18、`muted` 約 6.4。ダーク `fg` 約 16、`muted` 約 7.0。すべて 4.5 以上。値をコミットメッセージに残す

- [ ] **Step 5: lint を確認してコミット**

Run: `pnpm lint`
Expected: 0（Biome は CSS も整形検査する。指摘があれば `pnpm format`）

```bash
git add astro.config.ts src/styles/global.css
git commit -m "feat: DotGothic16 を Fonts API（Google プロバイダー）で自己配信し、無彩色 4 色の CSS 変数とテーマ追従を追加

コントラスト比: ライト fg 18.x / muted 6.4x、ダーク fg 16.x / muted 7.0x（計算値を記入）"
```

---

### Task 3: ドット絵のデータと描画コンポーネント

**Files:**
- Create: `src/lib/pixel.ts`
- Create: `src/components/pixel/PixelArt.astro`
- Test: `tests/unit/pixel.test.ts`

**Interfaces:**
- Produces:
  - `type Cell = { x: number; y: number }`
  - `cells(rows: readonly string[]): Cell[]` — `#` のセル座標を行優先で返す
  - `camera: readonly string[]`、`lost: readonly string[]` — 16 行 × 16 文字、`.` と `#` のみ
  - `PixelArt.astro` props: `rows: readonly string[]`、`scale?: number`（既定 4。1 セルの px 数。整数倍で拡大）

- [ ] **Step 1: 失敗するテストを書く**

`tests/unit/pixel.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { camera, cells, lost } from '../../src/lib/pixel';

describe('cells', () => {
  it('# のセル座標を行優先で返す', () => {
    expect(cells(['#.', '.#'])).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 1 },
    ]);
  });

  it('# が無ければ空', () => {
    expect(cells(['..', '..'])).toEqual([]);
  });
});

describe.each([
  ['camera', camera],
  ['lost', lost],
])('%s', (_name, rows) => {
  it('16 行 × 16 文字で、. と # だけからなる', () => {
    expect(rows).toHaveLength(16);
    for (const row of rows) {
      expect(row).toHaveLength(16);
      expect(row).toMatch(/^[.#]{16}$/);
    }
  });

  it('少なくとも 1 セルは塗られている', () => {
    expect(cells(rows).length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: 失敗を確認する**

Run: `pnpm test`
Expected: FAIL。`src/lib/pixel` が解決できない

- [ ] **Step 3: 実装する**

`src/lib/pixel.ts`:

```ts
/** ドット絵は 16×16 の格子。`#` が塗り、`.` が透過。Agent 作の仮の絵（PO 決定 2026-09-18） */
export type Cell = { x: number; y: number };

export function cells(rows: readonly string[]): Cell[] {
  return rows.flatMap((row, y) => [...row].flatMap((ch, x) => (ch === '#' ? [{ x, y }] : [])));
}

/** トップのアイコン: カメラ */
export const camera: readonly string[] = [
  '................',
  '................',
  '.....##.........',
  '....####.....##.',
  '.##############.',
  '.#............#.',
  '.#....####....#.',
  '.#...#....#...#.',
  '.#...#.##.#...#.',
  '.#...#....#...#.',
  '.#....####....#.',
  '.#............#.',
  '.##############.',
  '................',
  '................',
  '................',
];

/** 404: 迷子のおばけ */
export const lost: readonly string[] = [
  '................',
  '.....######.....',
  '....########....',
  '...##########...',
  '...##.####.##...',
  '...##.####.##...',
  '...##########...',
  '...##########...',
  '...##########...',
  '...##########...',
  '...##########...',
  '...##########...',
  '...##.####.##...',
  '...#...##...#...',
  '................',
  '................',
];
```

`src/components/pixel/PixelArt.astro`:

```astro
---
// ドット絵をインライン SVG で描く。1 セル = 1×1 の rect、crispEdges でぼかさない、
// currentColor で文字色に追従（設計書 §6、design D5）。装飾なので支援技術からは隠す
import { cells } from '../../lib/pixel';

interface Props {
  rows: readonly string[];
  /** 1 セルの px 数（整数）。16 セル × 4 = 64px */
  scale?: number;
}

const { rows, scale = 4 } = Astro.props;
const width = rows[0]?.length ?? 0;
const height = rows.length;
---

<svg
  viewBox={`0 0 ${width} ${height}`}
  width={width * scale}
  height={height * scale}
  shape-rendering="crispEdges"
  fill="currentColor"
  aria-hidden="true"
>
  {cells(rows).map(({ x, y }) => <rect x={x} y={y} width="1" height="1" />)}
</svg>

<style>
  svg {
    display: block;
    margin-bottom: 1rem;
  }
</style>
```

- [ ] **Step 4: 緑を確認する**

Run: `pnpm test && pnpm lint && pnpm typecheck`
Expected: Vitest 41 + 6 = 47 passed。lint 0、typecheck 0 errors

- [ ] **Step 5: コミット**

```bash
git add src/lib/pixel.ts src/components/pixel/PixelArt.astro tests/unit/pixel.test.ts
git commit -m "feat: ドット絵のデータ（カメラ・おばけ）と SVG 描画コンポーネント PixelArt を追加"
```

---

### Task 4: Header と Footer

**Files:**
- Create: `src/components/Header.astro`
- Create: `src/components/Footer.astro`

**Interfaces:**
- Consumes: Task 1 の `navLinks(lang)`、`languageSwitch(path, lang)`。Task 2 の CSS 変数と `.dot` / `.muted`
- Produces:
  - `Header.astro` props: `lang: Locale`、`name: string`、`path: string`、`showNav?: boolean`（既定 `true`。`false` でロゴだけ）
  - `Footer.astro` props: `name: string`

- [ ] **Step 1: `Header.astro` を書く**

```astro
---
// ヘッダー 1 行: 左にロゴ（profile.name → そのロケールのトップ）、右に Photos / Career と
// 言語切り替え（相手の言語名 → 同じページの他言語版）。狭い画面では折り返すだけで
// 開閉メニューは作らない（JavaScript ゼロ。設計書 §4）
import type { Locale } from '../lib/i18n';
import { languageSwitch, navLinks } from '../lib/site';

interface Props {
  lang: Locale;
  name: string;
  path: string;
  showNav?: boolean;
}

const { lang, name, path, showNav = true } = Astro.props;
const nav = navLinks(lang);
const sw = languageSwitch(path, lang);
---

<header class="dot">
  <a class="logo" href={`/${lang}/`}>{name}</a>
  {
    showNav && (
      <nav>
        {nav.map((link) => <a href={link.href}>{link.label}</a>)}
        <a href={sw.href} hreflang={sw.hreflang} lang={sw.hreflang}>
          {sw.label}
        </a>
      </nav>
    )
  }
</header>

<style>
  header {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.5rem 1.5rem;
    padding: 1rem;
    border-bottom: 1px solid var(--line);
  }
  a {
    text-decoration: none;
  }
  a:hover {
    text-decoration: underline;
  }
  .logo {
    font-size: 1.25rem;
  }
  nav {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 1.25rem;
  }
</style>
```

- [ ] **Step 2: `Footer.astro` を書く**

```astro
---
// 「© 年 名前」の 1 行だけ（PO 決定 2026-09-18）。年はビルド時の西暦
interface Props {
  name: string;
}

const { name } = Astro.props;
const year = new Date().getFullYear();
---

<footer class="muted">
  <small>© {year} {name}</small>
</footer>

<style>
  footer {
    padding: 1rem;
    border-top: 1px solid var(--line);
    font-size: 0.875rem;
  }
</style>
```

- [ ] **Step 3: 型と lint を確認する**

Run: `pnpm typecheck && pnpm lint`
Expected: 0 errors、lint 0。（Astro の `.astro` ファイルは `astro check` が型検査する。まだページから使われていないので描画の確認は Task 5）

- [ ] **Step 4: コミット**

`.astro` は Vitest の対象外なので、このタスクのテストは Task 1 の `site.test.ts`（Header が呼ぶ関数）と Task 5 のビルド出力検査で担保する。

```bash
git add src/components/Header.astro src/components/Footer.astro
git commit -m "feat: ヘッダー（ロゴ・ナビ・言語切り替え）とフッター（© 年 名前）のコンポーネントを追加"
```

---

### Task 5: `BaseLayout` と言語別トップの載せ替え

**Files:**
- Create: `src/layouts/BaseLayout.astro`
- Modify: `src/pages/[lang]/index.astro`

**Interfaces:**
- Consumes: Task 1 `alternateLinks`、Task 2 `global.css` と `<Font>`、Task 3 `PixelArt` + `camera`、Task 4 `Header` / `Footer`、既存 `getProfile(lang)` / `getCareer(lang)`（`src/lib/content.ts`）、既存 `localeFromPath(path)`（`src/lib/i18n.ts`）
- Produces: `BaseLayout.astro` props: `lang: Locale`、`title?: string`（省略で名前のみ。指定で「title · 名前」）、`showNav?: boolean`（既定 `true`）。`<slot />` が `<main>` の中身。hreflang はパスがロケール接頭辞を持つときだけ出す（404 では出さない）

- [ ] **Step 1: `BaseLayout.astro` を書く**

```astro
---
// 全ページ共通の殻（design D1）。<head> のメタデータ、Header、<main><slot/>、Footer。
// ページは本文だけを書く。hreflang は /ja/ /en/ 配下のページだけに出す（404 は対象外）
import { Font } from 'astro:assets';
import Footer from '../components/Footer.astro';
import Header from '../components/Header.astro';
import { getProfile } from '../lib/content';
import { type Locale, localeFromPath } from '../lib/i18n';
import { alternateLinks } from '../lib/site';
import '../styles/global.css';

interface Props {
  lang: Locale;
  /** ページ名。省略時はトップ扱いで名前のみ */
  title?: string;
  showNav?: boolean;
}

const { lang, title, showNav = true } = Astro.props;
const profile = await getProfile(lang);
const path = Astro.url.pathname;
const pageTitle = title ? `${title} · ${profile.name}` : profile.name;
if (!Astro.site) throw new Error('astro.config の site が必要（hreflang の絶対 URL に使う）');
const alternates = localeFromPath(path) ? alternateLinks(path, Astro.site) : [];
---

<!doctype html>
<html lang={lang}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{pageTitle}</title>
    {alternates.map((link) => <link rel="alternate" hreflang={link.hreflang} href={link.href} />)}
    <Font cssVariable="--font-dot" />
  </head>
  <body>
    <Header lang={lang} name={profile.name} path={path} showNav={showNav} />
    <main><slot /></main>
    <Footer name={profile.name} />
  </body>
</html>
```

- [ ] **Step 2: `src/pages/[lang]/index.astro` を載せ替える**

```astro
---
import PixelArt from '../../components/pixel/PixelArt.astro';
import BaseLayout from '../../layouts/BaseLayout.astro';
import { getCareer, getProfile } from '../../lib/content';
import { type Locale, locales } from '../../lib/i18n';
import { camera } from '../../lib/pixel';

export function getStaticPaths() {
  return locales.map((lang) => ({ params: { lang } }));
}

const lang = Astro.params.lang as Locale;
const profile = await getProfile(lang);
// 日英件数の検証をビルドに乗せるため呼ぶ。表示は Change 4 で行う（Issue #1 の申し送り。消さない）
await getCareer(lang);
---

<BaseLayout lang={lang}>
  <PixelArt rows={camera} />
  <h1>{profile.name}</h1>
  <p class="muted">{profile.tagline}</p>
</BaseLayout>
```

- [ ] **Step 3: 型検査とビルド**

Run: `pnpm typecheck && pnpm build 2>&1 | tail -15`
Expected: 0 errors。ビルド成功、`[WARN]` なし、`dist/ja/index.html` と `dist/en/index.html` が出る。`dist/_astro/fonts/*.woff2` が出力される

- [ ] **Step 4: 出力 HTML を検査する（spec のシナリオ）**

Run:

```bash
for f in dist/ja/index.html dist/en/index.html; do
  echo "== $f"
  grep -o '<html lang="[a-z]*"' "$f"
  grep -o '<title>[^<]*</title>' "$f"
  grep -o '<link rel="alternate"[^>]*>' "$f"
  grep -o '<a [^>]*href="[^"]*"[^>]*>[^<]*</a>' "$f" | head -4
  grep -o '© [0-9]* [^<]*' "$f"
  echo "script: $(grep -c '<script' "$f")"
  echo "https 以外の参照: $(grep -o 'https://[^" )]*' "$f" | grep -v 'joe-yama.github.io' | grep -v 'github.com/joe-yama' | grep -v 'mailto' || echo なし)"
  echo "font url: $(grep -o 'url([^)]*)' "$f" | grep -v '^url(/_astro/fonts/' || echo すべて同一オリジン)"
done
```

Expected（`ja` の場合）:
- `<html lang="ja">`、`<title>` は `profile/ja.yaml` の `name`（現在 `joe-yama`）
- `<link rel="alternate">` が 3 本: `hreflang="ja"` → `https://joe-yama.github.io/ja/`、`hreflang="en"` → `…/en/`、`hreflang="x-default"` → `…/ja/`
- `<a>` はロゴ（`/ja/`）、`Photos`（`/ja/photos/`）、`Career`（`/ja/career/`）、`English`（`/en/`、`hreflang="en"`）の順
- `© 2026 joe-yama`
- `script: 0`
- `https 以外の参照: なし`（`site` の URL は hreflang の分だけ）
- `font url: すべて同一オリジン`
- `en` では `<html lang="en">`、言語切り替えは `日本語` → `/ja/`、`hreflang="ja"`

いずれかが違えば実装を直す（テストの期待値ではなく実装を直す）

- [ ] **Step 5: lint とテスト**

Run: `pnpm lint && pnpm test`
Expected: lint 0、Vitest 47 passed

- [ ] **Step 6: コミット**

```bash
git add src/layouts/BaseLayout.astro 'src/pages/[lang]/index.astro'
git commit -m "feat: 全ページ共通の BaseLayout（メタデータ・hreflang・ヘッダー・フッター・フォント）を追加し、言語別トップを載せ替え"
```

---

### Task 6: 404 ページ

**Files:**
- Create: `src/pages/404.astro`

**Interfaces:**
- Consumes: Task 5 `BaseLayout`（`showNav={false}`、`title="404"`）、Task 3 `PixelArt` + `lost`、Task 1 `ui`、既存 `locales`

- [ ] **Step 1: `404.astro` を書く**

```astro
---
// /404.html。GitHub Pages がそのまま 404 応答に使う。どの言語のページか決められないので
// ナビと言語切り替えは置かず、日英の文言と両言語のトップへのリンクを並べる（設計書 §4）
import PixelArt from '../components/pixel/PixelArt.astro';
import BaseLayout from '../layouts/BaseLayout.astro';
import { locales } from '../lib/i18n';
import { lost } from '../lib/pixel';
import { ui } from '../lib/site';
---

<BaseLayout lang="ja" title="404" showNav={false}>
  <PixelArt rows={lost} scale={6} />
  {
    locales.map((lang) => (
      <p lang={lang}>
        <span class="dot">{ui[lang].notFound}</span>
        {' '}
        <a href={`/${lang}/`} hreflang={lang}>
          {ui[lang].backToTop}
        </a>
      </p>
    ))
  }
</BaseLayout>
```

- [ ] **Step 2: ビルドして出力を検査する**

Run:

```bash
pnpm typecheck && pnpm build 2>&1 | tail -8 && ls dist/404.html && \
grep -o '<title>[^<]*</title>' dist/404.html && \
grep -o '<a [^>]*href="[^"]*"[^>]*>' dist/404.html && \
echo "svg: $(grep -c '<svg' dist/404.html) alternate: $(grep -c 'rel="alternate"' dist/404.html) Photos: $(grep -c '>Photos<' dist/404.html) Career: $(grep -c '>Career<' dist/404.html) script: $(grep -c '<script' dist/404.html)" && \
grep -c 'ページが見つかりません' dist/404.html && grep -c 'Page not found' dist/404.html
```

Expected: `dist/404.html` が存在。`<title>404 · joe-yama</title>`。`<a>` はロゴ（`/ja/`）、`/ja/`（`hreflang="ja"`）、`/en/`（`hreflang="en"`）。`svg: 1 alternate: 0 Photos: 0 Career: 0 script: 0`。日英の文言が各 1 回。`dist/404.html` が出力されない場合は Issue #3 にコメントして PO に相談し、止まる（design D6 のブロッカー）

- [ ] **Step 3: lint とテスト、コミット**

Run: `pnpm lint && pnpm test`
Expected: lint 0、47 passed

```bash
git add src/pages/404.astro
git commit -m "feat: 404 ページ（ドット絵、日英の文言、両言語トップへのリンク）を追加"
```

---

### Task 7: Change 1 の保留 Minor の整理（挙動を変えない）

**Files:**
- Modify: `astro.config.ts`（`output: 'static'` を削除）
- Modify: `package.json`（`engines` を削除）
- Modify: `biome.json`（既定と重複する除外を削除）
- Modify: `src/content/schemas.ts`（`certifications` / `achievements` 要素の共通部分を集約）
- Modify: `.claude/hooks/lint-on-edit.sh`、`.claude/hooks/test-on-stop.sh`（`detect_*` を inline 化。**Edit ツールで編集**）
- Modify: `docs/harness/hooks.md`

**Interfaces:**
- Consumes: 既存テスト `tests/unit/schemas.test.ts`（変更しない。緑のままであることが「挙動を変えない」の証拠）

- [ ] **Step 1: 既定値の再宣言を消す**

`astro.config.ts` から `output: 'static',` の行を削除（Astro の既定）。`package.json` から `"engines": { "node": ">=26" },` を削除（`.node-version` と `packageManager` で固定済み。quality-gates spec の「実行環境の固定」はこの 2 つで満たす）。

`biome.json` は次を確認してから消す:

```bash
pnpm lint 2>&1 | grep -o 'Checked [0-9]* files'      # 変更前の件数を控える
pnpm exec biome check pnpm-lock.yaml --no-errors-on-unmatched 2>&1 | tail -2
```

- `pnpm-lock.yaml` で「No files were processed」相当（Biome の対象外）なら `"!pnpm-lock.yaml"` を消す。処理されるなら残す
- `"!dist"`、`"!.astro"` は `.gitignore` に入っていて `vcs.useIgnoreFile: true` で除外されるので消す
- `"!.claude"`、`"!.mcp.json"` は意図した除外なので残す

消した後に `pnpm lint 2>&1 | grep -o 'Checked [0-9]* files'` の件数が変更前と同じであることを確認する（同じなら除外は冗長だった）。

Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm build 2>&1 | tail -3`
Expected: すべて 0、ビルド警告なし

```bash
git add astro.config.ts package.json biome.json
git commit -m "chore: Astro / pnpm / Biome の既定値と重複する宣言を削除（Issue #1 の保留 Minor）"
```

- [ ] **Step 2: スキーマの重複定義を集約する**

`src/content/schemas.ts` の `careerSchema` を次のように変える（`certifications` と `achievements` の要素が `date` / `name` / `url?` を重複定義していた）:

```ts
/** 日付付きの項目（資格・実績の共通部分） */
const datedItemSchema = z.object({ date: isoDate, name: nonEmpty, url: z.url().optional() });

export const careerSchema = z.object({
  experience: z.array(experienceSchema),
  skills: z.record(nonEmpty, z.array(nonEmpty)),
  certifications: z.array(datedItemSchema),
  achievements: z.array(
    datedItemSchema.extend({ kind: z.enum(['talk', 'article', 'award', 'other']) }),
  ),
});
```

Run: `pnpm test && pnpm typecheck && pnpm lint`
Expected: `tests/unit/schemas.test.ts` を含む 47 passed（テストは 1 文字も変えない）、0 errors、lint 0

```bash
git add src/content/schemas.ts
git commit -m "refactor: 資格・実績の共通部分を datedItemSchema に集約（挙動は不変）"
```

- [ ] **Step 3: hooks の `detect_*` を inline 化する（Edit ツールで）**

`.claude/hooks/lint-on-edit.sh` の

```bash
detect_lint() {
  [ -f "$root/biome.json" ] || return 0
  echo "pnpm exec biome check --error-on-warnings --no-errors-on-unmatched \"$file\""
}

lint_cmd=$(detect_lint)
[ -n "$lint_cmd" ] || exit 0   # lint 設定がまだ無いプロジェクトでは何もしない

cd "$root" || exit 0
out=$(eval "$lint_cmd" 2>&1)
```

を

```bash
cd "$root" || exit 0
out=$(pnpm exec biome check --error-on-warnings --no-errors-on-unmatched "$file" 2>&1)
```

に置き換える。`.claude/hooks/test-on-stop.sh` の

```bash
detect_test() {
  [ -f package.json ] || return 0
  echo "pnpm test"
}

test_cmd=$(detect_test)
[ -n "$test_cmd" ] || exit 0

out=$(eval "$test_cmd" 2>&1)
```

を

```bash
test_cmd="pnpm test"
out=$(pnpm test 2>&1)
```

に置き換える（`$test_cmd` は後続の `reason` の文面で使う）。ヘッダーコメントに `detect` の言及があれば直す。

`docs/harness/hooks.md` の「lint は Biome 固定: `detect_lint()` が…」を「lint は Biome 固定: 編集ファイル 1 つに対して `pnpm exec biome check --error-on-warnings --no-errors-on-unmatched "$file"` を実行する」に、「テストは Vitest 固定: `detect_test()` が `pnpm test` を実行する」を「テストは Vitest 固定: `pnpm test` を実行する」に直し、`最終更新` の日付を 2026-09-19 にする。

- [ ] **Step 4: hooks を合成入力で検証する**

```bash
# lint hook: 整形違反ファイルで rc=2、正常ファイルで rc=0、Biome 非対象で rc=0
printf 'const a=1\nexport default a\n' > src/tmp-bad.ts
printf '{"tool_name":"Write","tool_input":{"file_path":"%s/src/tmp-bad.ts"}}' "$PWD" | bash .claude/hooks/lint-on-edit.sh; echo "rc=$? (expect 2)"
printf '{"tool_name":"Write","tool_input":{"file_path":"%s/src/lib/site.ts"}}' "$PWD" | bash .claude/hooks/lint-on-edit.sh; echo "rc=$? (expect 0)"
printf '{"tool_name":"Write","tool_input":{"file_path":"%s/LICENSE"}}' "$PWD" | bash .claude/hooks/lint-on-edit.sh; echo "rc=$? (expect 0)"
rm src/tmp-bad.ts

# Stop hook: 失敗するテストがあると decision: block、無ければ無出力
printf "import { expect, it } from 'vitest';\nit('tmp', () => { expect(1).toBe(2); });\n" > tests/unit/tmp.test.ts
printf '{"stop_hook_active":false}' | bash .claude/hooks/test-on-stop.sh | head -c 200; echo
rm tests/unit/tmp.test.ts
printf '{"stop_hook_active":false}' | bash .claude/hooks/test-on-stop.sh; echo "rc=$? (expect 0, no output)"
```

Expected: 上から `rc=2`、`rc=0`、`rc=0`。Stop hook は 1 回目に `{"decision":"block","reason":"Tests failed (pnpm test, exit 1)…` を出し、2 回目は無出力で `rc=0`

- [ ] **Step 5: コミット**

```bash
git add .claude/hooks/lint-on-edit.sh .claude/hooks/test-on-stop.sh docs/harness/hooks.md
git commit -m "chore: hooks の detect_lint / detect_test を inline 化し、hooks.md の記述を合わせる（Issue #1 の保留 Minor）"
```

---

### Task 8: 見た目の確認と仕上げ（コントローラーとレビュアーの作業）

**Files:**
- Modify: `openspec/changes/layout-shell/tasks.md`

- [ ] **Step 1: レビュアー（Opus）が Playwright MCP で実操作する**

コントローラーが `pnpm build && pnpm preview`（`http://localhost:4321/`）を立ち上げ、reviewer に spec のシナリオを渡す。確認項目: `/ja/` と `/en/` のヘッダー 4 リンクのラベルと `href`（言語切り替えが同じページの他言語版へ）、`hreflang` 属性、幅 320px で横スクロールが無いこと（`document.documentElement.scrollWidth <= 320`）、Tab でフォーカス枠が出ること、`prefers-color-scheme: dark` をエミュレートしてドット絵の `<svg>` の計算色が文字色と一致すること、`/404.html` にナビが無いこと、DotGothic16 が適用されること（`document.fonts.check("16px DotGothic16")`）。結果を Issue #3 にコメントする

- [ ] **Step 2: PO 向けスクリーンショット**

コントローラーが Playwright MCP で `/ja/`、`/en/`、`/404.html` を、ライト/ダーク × 幅 390px / 1280px で撮り（12 枚）、`SendUserFile` で PO に送る。PO の OK を待つ。修正指示があれば該当タスク（主に Task 2 の CSS、Task 3 の絵、Task 4 のヘッダー）に戻り、修正後に再度撮って送る

- [ ] **Step 3: 全体の緑と tasks.md**

Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm build 2>&1 | tail -3 && git status --short`
Expected: すべて 0、警告なし、`git status --short` が空

`openspec/changes/layout-shell/tasks.md` の完了項目を `[x]` にし、計画からの逸脱があれば tasks.md の該当行と Issue #3 に記録してコミットする:

```bash
git add openspec/changes/layout-shell/tasks.md
git commit -m "docs: layout-shell の tasks.md を完了状態にする"
```

- [ ] **Step 4: ブランチ全体の独立レビュー（Opus）**

`git diff main...HEAD` を review package にし、reviewer に「仕様準拠（`specs/layout-shell`、`specs/quality-gates` の delta）→ コード品質 → ponytail」の順で敵対的にレビューさせる。Needs fixes なら修正ラウンド（`.claude/rules/review.md` の切り替え条件を毎回確認）。Approved になったら結果（Approved / 指摘数 / 切り替えの有無）を Issue #3 にコメントする

- [ ] **Step 5: push と PR**

`gh api user --jq .login` が `joe-yama` であることを確認。`git push` は PO に毎回確認する（失敗したら PO に `! git push -u origin feature/layout-shell` を依頼）。PR を作る（タイトル `layout-shell`、本文に目的・変更点・確認方法・`Closes #3`・attribution 行）。`gh run watch` で CI 緑を確認し、Issue #3 に「PR 作成、CI 緑」をコメントする。マージは PO。マージ後に `/opsx:archive layout-shell`

---

## 自己レビュー（計画作成時）

- **spec カバレッジ**: メタデータ → Task 5。言語代替リンク → Task 1 + 5。ヘッダー → Task 1 + 4 + 5（狭い画面は Task 8 Step 1）。フッター → Task 4。配色と OS 追従・フォーカス枠 → Task 2（比の計算）+ Task 8。フォント自己配信・swap → Task 2 + 5（`url(` 検査）。ドット絵 → Task 3（データ検査）+ Task 5・6（`<svg>` 出力）+ Task 8（ダークの色）。404 → Task 6。quality-gates「フォントの参照先」→ Task 5 Step 4
- **プレースホルダー**: なし。すべてのコード・コマンド・期待値を記載
- **型の一貫性**: `alternateLinks(path, site: string | URL)`、`navLinks(lang)`、`languageSwitch(path, lang)`、`ui[lang].notFound / backToTop`、`cells(rows)`、`camera` / `lost`、`PixelArt` の `rows` / `scale`、`Header` の `lang` / `name` / `path` / `showNav`、`Footer` の `name`、`BaseLayout` の `lang` / `title` / `showNav` を全タスクで同じ名前で使用
