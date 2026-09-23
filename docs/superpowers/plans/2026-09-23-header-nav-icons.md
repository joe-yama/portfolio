# header-nav-icons 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 全ページのヘッダーの Photos / Career / 言語切り替えに、トップ本文の導線と同じ 16px のドット絵（カメラ / 鞄 / 地球儀）を付ける。導線とアイコンの対応は導線のデータ（`navLinks()` / `languageSwitch()`）に持たせ、トップとヘッダーが同じ対応を使う。

**Architecture:** `src/lib/site.ts` の `NavLink` / `LanguageSwitch` に `icon: readonly string[]` を足し、`index.astro` と `Header.astro` は `link.icon` / `sw.icon` を `PixelArt scale={1}` で描くだけにする。e2e は行き先（`href` / `hreflang`）でリンクを選び、1 つの対応表でトップとヘッダーの両方を検査する。

**Tech Stack:** Astro 7（静的出力）、TypeScript strict、Vitest 5、Playwright 1.63、Biome 2、pnpm。依存の追加なし。

**Spec:** `openspec/changes/header-nav-icons/specs/layout-shell/spec.md`（要求）、`openspec/changes/header-nav-icons/design.md`（D1〜D4）、`openspec/changes/header-nav-icons/tasks.md`（タスク）、`openspec/changes/header-nav-icons/proposal.md`（含める / 含めない）。Issue #51。

## Global Constraints

- **pnpm のみ**（`npm` / `npx` 禁止）。**依存を足さない**。`pnpm install` は `--frozen-lockfile` 付きだけ
- **TDD**: 失敗するテストを先に書き、赤を見てから実装する。テストの削除・skip・期待値の書き換えで通さない。例外は design D1 が認める `pairByIndex` の describe の削除と、tasks 1.4 のテストの畳み込み（同じ主張を保ったまま 1 ケースに寄せる）だけ
- **1 コミット = tasks.md の 1 項目**（1.1 と 1.2 は RED/GREEN の対なので 1 コミットにまとめてよい。2.1〜2.3 も同様）。日本語、先頭に種別。`openspec/changes/header-nav-icons/tasks.md` の該当チェックを同じコミットに含める。末尾に attribution 2 行:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_019D8AefyHcog1Fncwy6oktk
  ```
- **`git commit` は sandbox 外で実行する**（1Password の SSH 署名）。push はしない（コントローラーが行う）
- **`git commit --amend` / `rebase` 禁止**
- **触らないファイル**: `src/lib/pixel.ts`（図柄は変えない）、`src/components/pixel/PixelArt.astro`、`src/pages/404.astro`（404 のヘッダーはナビを出さないので対象外）、`src/layouts/BaseLayout.astro`、`tests/e2e/viewport.spec.ts`、ヘッダーの余白（`header` / `nav` の `padding` / `gap`）
- **`src/lib/site.ts` から `./pixel` を import するときは拡張子なし**（`site.ts` は node 直実行の経路に乗っていない。既存の `./i18n` と同じ書き方）
- **Biome**: シングルクォート、セミコロンあり、行幅 100。崩れたら `pnpm format`
- **e2e はポート 4399 を他の worktree と共有する**。実行前に `lsof -i :4399` で空きを確かめ、`pnpm e2e` を同時に 2 本回さない
- **`rm -rf` は hook が拒否する**。隔離複製は毎回新しいディレクトリ名で作る
- **スコープ**: `tasks.md` の項目だけ。気づいた改善は `tasks.md` 末尾の「提案」に書き、実装しない
- **検証コマンド**: `pnpm test` / `pnpm lint` / `pnpm typecheck` / `pnpm build` / `pnpm e2e`。報告にはコマンドと出力の抜粋を添える

## 実装前に実物で確かめた落とし穴（計画作成時）

1. **`a[href$="/photos/"]` だけでは Photos を選べない**。`/ja/photos/` のページでは言語切り替えの href も `/portfolio/en/photos/` になり、同じセレクタに当たる。Photos と Career は `:not([hreflang])` を付けて選ぶ
2. **本文の `line-height` は `1.6`**（`src/styles/global.css:29`）なので、16px の文字でリンクの行は 25.6px。16px のアイコンは収まり、`scale={2}`（32px）なら超える。computed の `lineHeight` は `"25.6px"` の形で返る（`normal` ではない）ので `parseFloat` で比べられる
3. **トップのリンクは `display: flex`**（`index.astro:82-86`）。ヘッダーは design D2 の通り `inline-flex`。ヘッダーの `header` は `align-items: baseline` なので、ナビのリンクを flex にしたあとロゴとの揃いを reviewer が目視で確かめる（implementer はスクリーンショットを撮れないので、ここは reviewer の brief に入れる）
4. **`CareerSection` の一覧は今どこにも無い**（`grep -rn CareerSection src` は空）。D4 は `site.ts` に union 型を 1 つ置き、`Record<CareerSection, string>` にする。`tests/e2e/pages.spec.ts:303` が `Object.values(ui[lang].careerSections)` の順を見出しと比べているので、オブジェクトリテラルのキーの順は変えない
5. **代表ページは `tests/e2e/paths.ts` の `pagePaths`**（両ロケールのトップ・写真一覧・写真個別すべて・経歴）。新しいパスの表を作らずこれを使う

---

## Task 一覧とレビューの単位

| Task | 名前 | tasks.md | レビュー単位 |
|---|---|---|---|
| 1 | 導線がアイコンを持つ・型と単体テストの整理 | 1.1〜1.4 | 単位 1（共有インターフェース `NavLink` / `LanguageSwitch` に触るのでこの Task でレビュー） |
| 2 | ヘッダーのアイコンと e2e | 2.1〜2.4 | 単位 2（spec の要求と UI。Playwright で実測） |
| 2b | 狭い画面でヘッダーのアイコンを隠す（PO 決定 2026-09-23、Task 2 のレビューで追加） | 2.5 | 単位 2 の修正ラウンドとして再レビュー |
| 3 | 番人の確認と全コマンド | 3.1、3.2 | ブランチ全体のレビューに含める |

ブランチ全体のレビューを最後に 1 回行う。

---

### Task 1: 導線がアイコンを持つ（tasks 1.1〜1.4、design D1・D4）

**Files:**
- Modify: `src/lib/site.ts`（`NavLink` / `LanguageSwitch` / `UiStrings` / `navLinks` / `languageSwitch`、`pairByIndex` を削除）
- Modify: `src/pages/[lang]/index.astro:7-11, 36-45`
- Test: `tests/unit/site.test.ts`

**Interfaces:**
- Produces:
  - `export type NavLink = { label: string; href: string; icon: readonly string[] }`
  - `export type LanguageSwitch = { label: string; href: string; hreflang: Locale; icon: readonly string[] }`
  - `export type CareerSection = 'experience' | 'skills' | 'certifications' | 'achievements' | 'patents'`
  - `navLinks(lang, base)` は Photos に `camera`、Career に `briefcase` を持たせる。`languageSwitch(path, lang, base)` は `globe` を持たせる（いずれも `src/lib/pixel.ts` の export をそのまま参照する。コピーしない）
  - `pairByIndex` は無くなる

- [ ] **Step 1: RED — 単体テストを書く**

`tests/unit/site.test.ts` の import に `briefcase, camera, globe`（`../../src/lib/pixel` から）を足し、`pairByIndex` の import と describe を消す。次を足す:

```ts
describe('導線のアイコン（design D1）', () => {
  it('navLinks の Photos は camera、Career は briefcase を持つ', () => {
    const byLabel = Object.fromEntries(navLinks('ja', '/').map((l) => [l.label, l.icon]));
    expect(byLabel).toEqual({ Photos: camera, Career: briefcase });
  });

  it('languageSwitch は両ロケールで globe を持つ', () => {
    expect(languageSwitch('/ja/', 'ja', '/').icon).toBe(globe);
    expect(languageSwitch('/en/', 'en', '/').icon).toBe(globe);
  });
});
```

既存の `languageSwitch` の `toEqual` 2 件は、`icon: globe` を期待値に足す（戻り値の形が spec delta で増えたため。取り除く主張は無い）。

- [ ] **Step 2: 赤を確かめる**

Run: `pnpm test tests/unit/site.test.ts`
Expected: FAIL（`icon` が `undefined`）

- [ ] **Step 3: GREEN — `site.ts` と `index.astro`**

`src/lib/site.ts`:

```ts
import { briefcase, camera, globe } from './pixel';

export type NavLink = { label: string; href: string; icon: readonly string[] };
export type LanguageSwitch = {
  label: string;
  href: string;
  hreflang: Locale;
  icon: readonly string[];
};

export function navLinks(lang: Locale, base: string): NavLink[] {
  return [
    { label: 'Photos', href: photoPath(null, lang, base), icon: camera },
    { label: 'Career', href: careerPath(lang, base), icon: briefcase },
  ];
}
```

`languageSwitch` の戻り値に `icon: globe` を足す。`pairByIndex` の関数とその JSDoc を消す。

`src/pages/[lang]/index.astro`: import から `briefcase` と `globe` と `pairByIndex` を消し（`camera` は `.art` で使うので残す）、`navIcons` の定数とコメント（10-11 行）を消し、36-45 行を次にする:

```astro
    {navLinks(lang, base).map((link) => (
      <a href={link.href}>
        <PixelArt rows={link.icon} scale={1} />
        {link.label}
      </a>
    ))}
    <a href={sw.href} hreflang={sw.hreflang} lang={sw.hreflang}>
      <PixelArt rows={sw.icon} scale={1} />
      {sw.label}
    </a>
```

- [ ] **Step 4: 緑とトップの見た目不変を確かめる**

```bash
pnpm test tests/unit/site.test.ts
```
トップの出力が変わらないことを示す: 変更前のコミットで `pnpm build && cp dist/ja/index.html <scratchpad>/before-ja.html && cp dist/en/index.html <scratchpad>/before-en.html` を取り（`git stash` は使わず、Step 1 に入る前に取っておく）、変更後に `pnpm build` して `diff` が空であることを報告に貼る。

- [ ] **Step 5: コミット**（tasks 1.1・1.2 にチェック）

```bash
git add src/lib/site.ts 'src/pages/[lang]/index.astro' tests/unit/site.test.ts openspec/changes/header-nav-icons/tasks.md
git commit -m "feat: 導線のデータにアイコンを持たせ、pairByIndex を消す"
```

- [ ] **Step 6: tasks 1.3 — `careerSections` の型**（挙動不変。既存テストの緑が証拠）

`src/lib/site.ts` の型定義の近くに:

```ts
/** 経歴ページの区画。ui.careerSections のキー（順は pages.spec が見出しの順と比べる） */
export type CareerSection = 'experience' | 'skills' | 'certifications' | 'achievements' | 'patents';
```

`UiStrings.careerSections` を `Record<CareerSection, string>` にする。`pnpm typecheck && pnpm test` が緑であることを確かめてコミット（`refactor:`、tasks 1.3 にチェック）。

- [ ] **Step 7: tasks 1.4 — canonicalUrl のテストの畳み込み**

`tests/unit/site.test.ts` の `canonicalUrl` の describe で、「末尾スラッシュを補い、URL オブジェクトの site も受ける」を独立のケースにせず、既存のケースの site 引数を `new URL(...)` で渡す形に寄せる。**主張（末尾スラッシュの補完 / URL オブジェクトを受ける / base 付き / site のパスを捨てない）は 1 つも減らさない。** 例:

```ts
describe('canonicalUrl', () => {
  it('base 付きでそのページ自身の絶対 URL を返す（lang はパスから判定する）', () => {
    expect(canonicalUrl('/portfolio/en/career/', 'https://example.com', '/portfolio')).toBe(
      'https://example.com/portfolio/en/career/',
    );
    // 末尾スラッシュを補い、URL オブジェクトの site も受ける
    expect(canonicalUrl('/ja/career', new URL('https://example.com'), '/')).toBe(
      'https://example.com/ja/career/',
    );
  });

  it('site にパスがあっても捨てない', () => { /* 既存のまま */ });
});
```

`pnpm test` が緑であることを確かめてコミット（`test:`、tasks 1.4 にチェック）。

---

### Task 2: ヘッダーのアイコン（tasks 2.1〜2.4、design D2・D3、spec「ナビのアイコン」「アイコンで行が高くならない」）

**Files:**
- Modify: `src/components/Header.astro`
- Test: `tests/e2e/links.spec.ts`

**Interfaces:**
- Consumes: Task 1 の `NavLink.icon` / `LanguageSwitch.icon`、`tests/e2e/paths.ts` の `pagePaths`、既存の `rectCells` / `cells`

- [ ] **Step 1: RED — ナビのアイコンの対応表と、ヘッダーの検査（tasks 2.1）**

`tests/e2e/links.spec.ts` の上部（`rectCells` の後）に、トップとヘッダーで共有する対応表を置く:

```ts
import { pagePaths } from './paths';

/**
 * サイト内導線の行き先 → アイコン（design D3）。並び順ではなく行き先で選ぶ。
 * /ja/photos/ では言語切り替えの href も /photos/ で終わるので、Photos と Career は hreflang を除く
 */
const navIconTable = [
  { name: 'Photos', selector: 'a[href$="/photos/"]:not([hreflang])', grid: camera },
  { name: 'Career', selector: 'a[href$="/career/"]:not([hreflang])', grid: briefcase },
  { name: '言語切り替え', selector: 'a[hreflang]', grid: globe },
] as const;
```

ヘッダーの検査を足す:

```ts
for (const path of pagePaths) {
  test(`${path} のヘッダーの導線に同じ行き先のドット絵が 1 つずつ付き、ロゴには無い`, async ({
    page,
  }) => {
    await page.goto(path);
    const nav = page.locator('header nav');
    await expect(nav.locator('a')).toHaveCount(3);
    for (const { name, selector, grid } of navIconTable) {
      const link = nav.locator(selector);
      await expect(link, name).toHaveCount(1);
      const svg = link.locator('svg');
      await expect(svg, name).toHaveCount(1);
      await expect(svg, name).toHaveAttribute('aria-hidden', 'true');
      expect(await rectCells(link), name).toEqual(cells(grid));
    }
    await expect(page.locator('header .logo svg')).toHaveCount(0);
  });
}
```

リンクの名前が文字だけであること（spec「リンクの名前は文字だけ」）を、同じテストの末尾で名前を固定して確かめる:

```ts
    const expected = path.startsWith('ja/') ? 'English' : '日本語';
    await expect(nav.locator('a[hreflang]')).toHaveAccessibleName(expected);
    await expect(nav.locator(navIconTable[0].selector)).toHaveAccessibleName('Photos');
    await expect(nav.locator(navIconTable[1].selector)).toHaveAccessibleName('Career');
```

- [ ] **Step 2: RED — 行の高さ（tasks 2.2）**

```ts
for (const viewport of [
  { width: 390, height: 844 },
  { width: 1280, height: 720 },
]) {
  test(`${viewport.width}×${viewport.height} でヘッダーのアイコン付きリンクが文字の行より高くならない`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto('ja/');
    const links = page.locator('header nav a');
    await expect(links).toHaveCount(3);
    for (const link of await links.all()) {
      const { height, lineHeight } = await link.evaluate((el) => ({
        height: el.getBoundingClientRect().height,
        lineHeight: Number.parseFloat(getComputedStyle(el).lineHeight),
      }));
      expect(Number.isFinite(lineHeight)).toBe(true);
      expect(height).toBeLessThanOrEqual(lineHeight);
    }
  });
}
```

注: 2.2 はアイコンが無い今のコードでも緑になりうる（番人としての効きは Task 3 の変異 (b) で確かめる）。赤を確かめるのは 2.1 のほう。

- [ ] **Step 3: 赤を確かめる**

Run: `lsof -i :4399` が空であることを確かめてから `pnpm e2e tests/e2e/links.spec.ts`
Expected: 2.1 のヘッダーの検査が `svg` の件数 0 で FAIL。2.2 の結果（緑か赤か）も報告に書く

- [ ] **Step 4: GREEN — `Header.astro`（tasks 2.3）**

```astro
---
import type { Locale } from '../lib/i18n';
import { homePath, languageSwitch, navLinks } from '../lib/site';
import PixelArt from './pixel/PixelArt.astro';
---
...
      <nav>
        {navLinks(lang, base).map((link) => (
          <a href={link.href}>
            <PixelArt rows={link.icon} scale={1} />
            {link.label}
          </a>
        ))}
        <a href={sw.href} hreflang={sw.hreflang} lang={sw.hreflang}>
          <PixelArt rows={sw.icon} scale={1} />
          {sw.label}
        </a>
      </nav>
```

`<style>` に足す（`header` / `nav` の既存の規則は変えない）:

```css
  nav a {
    display: inline-flex;
    align-items: center;
    gap: 0.35em;
  }
```

先頭のコメント（1〜4 行）に「Photos / Career / 言語切り替えにはトップ本文と同じドット絵を添える（アイコンは導線のデータが持つ）」を足す。

- [ ] **Step 5: 緑を確かめる**

Run: `pnpm e2e tests/e2e/links.spec.ts`
Expected: PASS

- [ ] **Step 6: コミット**（tasks 2.1・2.2・2.3 にチェック。2.3 の「ベースラインの目視」はレビューで確かめる旨を報告に書く）

```bash
git add src/components/Header.astro tests/e2e/links.spec.ts openspec/changes/header-nav-icons/tasks.md
git commit -m "feat: ヘッダーの導線にトップ本文と同じドット絵を付ける"
```

- [ ] **Step 7: tasks 2.4 — トップの検査を行き先で選ぶ比較に書き換える**

`tests/e2e/links.spec.ts` の既存のトップの検査（今の 75-80 行、`navGrids` と `nth(i)` のループ）を次に置き換える。件数・`aria-hidden`・`viewBox`・並び（導線が連絡先より上）・連絡先の検査は残す:

```ts
    for (const { name, selector, grid } of navIconTable) {
      const link = page.locator(`main nav.links ${selector}`);
      await expect(link, name).toHaveCount(1);
      expect(await rectCells(link), name).toEqual(cells(grid));
    }
```

`navGrids` を消す。`pnpm e2e tests/e2e/links.spec.ts` が緑であることを確かめてコミット（`test:`、tasks 2.4 にチェック）。

---

### Task 3: 番人の確認と全コマンド（tasks 3.1、3.2）

**Files:** 変更なし（検証だけ。tasks.md のチェックだけのコミットを作ってよい）

- [ ] **Step 1: 隔離複製を作る**（`docs/harness/README.md` §7）

```bash
S=<scratchpad>
EXP=$S/mut-hni-<変異名>/exp
mkdir -p "$EXP" && git archive HEAD | tar -x -C "$EXP"
pnpm --dir "$EXP" install --frozen-lockfile --offline
```

変異ごとに新しい `$EXP` を作る（または 1 つの複製で変異を当てて戻す。戻したら `diff -r` 等で原状に戻ったことを示す）。最初に 1 回、変異なしで `pnpm --dir "$EXP" e2e tests/e2e/links.spec.ts` が緑であることを記録する（対照）。**ポート 4399 を共有するので同時に回さない。**

- [ ] **Step 2: 変異を当てて結果を記録する**

| 変異 | 当てる場所 | 期待 |
|---|---|---|
| (a) ヘッダーの Career に camera を渡す | `$EXP/src/components/Header.astro` の `rows={link.icon}` を `rows={link.label === 'Career' ? camera : link.icon}`（`camera` を import） | 2.1 が赤（Career の座標不一致） |
| (b) ヘッダーのアイコンを `scale={2}` | `$EXP/src/components/Header.astro` | 2.2 が赤（高さ 32 > 25.6） |
| (c) `navLinks()` の Photos と Career の順を入れ替える | `$EXP/src/lib/site.ts` | links.spec のアイコンの検査は**緑のまま**（行き先に結びついているので取り違えない）。他の spec が並び順で落ちる場合はその名前を記録する（並び順は spec「この順で持つ」の要求なので落ちてよい） |
| (d) ロゴに svg を足す | `$EXP/src/components/Header.astro` の `.logo` の `<a>` の中に `<PixelArt rows={camera} scale={1} />` を足す（`camera` を import） | 2.1 が赤（ロゴの svg 0 件） |
| (e) トップ本文の Photos の図柄を取り違える | `$EXP/src/pages/[lang]/index.astro` の `rows={link.icon}` を `rows={link.label === 'Photos' ? briefcase : link.icon}` | 2.4 が赤 |
| (f) 2.5 の media query を消す | `$EXP/src/components/Header.astro` の `@media (max-width: 29.99rem)` の規則を削除 | 2.5 の 390 の検査が赤（アイコンが見える / 2 行） |
| (g) media query の閾値を 20rem にする | 同上の `29.99rem` を `20rem` に | 2.5 の 390 の検査が赤 |

各変異で、実行コマンド・赤になったテスト名・失敗の抜粋を報告に貼る。(c) は緑だったテスト名と、落ちたテストがあればその名前を貼る。

- [ ] **Step 3: 全コマンド**（作業ツリーで）

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm e2e
```

それぞれの結果の要約行（`Tests N passed`、`0 errors`、`N passed` など）を報告に貼る。`git status --short` が空であることも貼る。

- [ ] **Step 4: コミット**（tasks 3.1・3.2 にチェック、`test:` または `docs:`）

---

## Self-Review

- spec「ナビのアイコン」→ Task 2 Step 1（全 `pagePaths`、行き先で選ぶ、`aria-hidden`、ロゴに svg なし）
- spec「リンクの名前は文字だけ」→ Task 2 Step 1 の `toHaveAccessibleName`
- spec「アイコンで行が高くならない」→ Task 2 Step 2、効きは Task 3 (b)
- spec「狭い画面」（既存）→ 既存の e2e が番人のまま（触らない）
- design D1 → Task 1、D2 → Task 2 Step 4、D3 → Task 2 Step 1・7、D4 → Task 1 Step 6
- tasks 3.1 の (a)〜(d) → Task 3 Step 2。(e) は 2.4 の効きを確かめるために足した
