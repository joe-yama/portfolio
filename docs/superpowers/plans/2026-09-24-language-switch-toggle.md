# language-switch-toggle 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ヘッダーとトップ本文の言語切り替えを、相手の言語名 1 リンク（「English」「日本語」）から、`JA / EN` を並べて表示中の言語はリンクにしない 1 つのまとまり（role=group、名前「言語」/「Language」）にする。

**Architecture:** `src/lib/site.ts` の `languageSwitch()` が両言語の項目（`locales` の順、表示中は `href` 無し）とまとまりの名前・地球儀を返す。`Header.astro` と `index.astro` は同じマークアップ（design D2）を直接書き、ヘッダーだけ `border-left` の区切り線を付ける。e2e はまとまりを `getByRole('group', { name })` で選び、ヘッダーと本文に同じ検査を当てる。

**Tech Stack:** Astro 7（静的出力）、TypeScript strict、Vitest 5、Playwright 1.63、Biome 2、pnpm。依存の追加なし。

**Spec:** `openspec/changes/language-switch-toggle/specs/layout-shell/spec.md`・`specs/profile-and-career/spec.md`（要求）、`design.md`（D1〜D4）、`tasks.md`（タスク）、`proposal.md`（含める / 含めない）。Issue #62。

## Global Constraints

- **pnpm のみ**（`npm` / `npx` 禁止）。**依存を足さない**。`pnpm install` は `--frozen-lockfile` 付きだけ
- **TDD**: 失敗するテストを先に書き、赤を見てから実装する。テストの削除・skip・期待値の書き換えで通さない。例外は tasks 2.1 が明示する置き換え（`navIconTable` の言語切り替えの行と「English」「日本語」の名前の検査）と、`a[hreflang]` 単位だった既存検査を、同じ主張を保ったまままとまり単位に直すことだけ
- **コミット**: 日本語、先頭に種別。`openspec/changes/language-switch-toggle/tasks.md` の該当チェックを同じコミットに含める。tasks 1.2 の指示どおり **1.1〜2.3 を 1 コミット**にする（途中はテストが赤なのでコミットできない）。2.4 は 1 コミット。3.1・3.2 は検証だけのタスクなのでチェックだけのコミットでよい。末尾に attribution 1 行:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  ```
- **`git commit` は sandbox 外で実行する**（1Password の SSH 署名）。push はしない（コントローラーが行う）
- **`git commit --amend` / `rebase` 禁止**
- **触らないファイル**: `src/lib/i18n.ts`（`alternatePath` は変えない）、`src/lib/pixel.ts`、`src/components/pixel/PixelArt.astro`、`src/pages/404.astro`、`src/styles/global.css`、`src/layouts/BaseLayout.astro`、`header` / `nav` の `padding` / `gap`・フォント
- **ナビの文字の見た目**: ヘッダーは `.dot`（DotGothic16、`font-weight: 400`）。表示中の項目だけ `font-weight: 700`（擬似太字。PO が選んだ見た目なので代えない）
- **Biome**: シングルクォート、セミコロンあり、行幅 100。崩れたら `pnpm format`
- **e2e はポート 4399 を他の worktree と共有する**。実行前に `lsof -i :4399` で空きを確かめ、`pnpm e2e` を同時に 2 本回さない
- **`rm -rf` は hook が拒否する**。隔離複製は毎回新しいディレクトリ名で作る
- **スコープ**: `tasks.md` の項目だけ。気づいた改善は `tasks.md` 末尾の「提案」に書き、実装しない
- **検証コマンド**: `pnpm test` / `pnpm lint` / `pnpm typecheck` / `pnpm build` / `pnpm e2e`。報告にはコマンドと出力の抜粋を添える

## 実装前に実物で確かめた落とし穴（計画作成時）

1. **`ui.languageName` の参照は `src/lib/site.ts` の `languageSwitch()` だけ**（`grep -rn languageName src tests`）。消しても他は壊れない。`otherLocale` の import は `languageSwitch()` からしか使っていないので、書き換え後に未使用になれば import から外す（Biome の未使用 import で lint が落ちる）
2. **既存 e2e のうち、言語切り替えが「アイコン付きの 3 つ目の `a`」である前提のものが 4 つある**（`tests/e2e/links.spec.ts`）: ①ヘッダーの導線のアイコン（`navIconTable` + `a[hreflang]` の名前）、②「アイコン付きリンクが文字の行より高くならない」（`header nav a` の各リンク）、③「アイコンは表示され / 隠れ、ロゴとナビが同じ行に並ぶ」（`header nav a` の各リンクに svg が 1 つ）、④本文の導線（`main nav.links a` の各リンクに svg が 1 つ）。変更後も `header nav a` は 3 つ（Photos・Career・相手の言語）のままだが、相手の言語のリンクは svg を持たない。どれも主張を保ったまま、まとまりを単位に直す（下の Task 2 にコードを書いた）
3. **ロゴ → Photos → Career → 言語切り替えの `header a` の href 順の検査**（`links.spec.ts` の `ja/career/` / `en/`）は変更後もそのまま通る（表示中の言語は `a` でないので数に入らず、相手の言語の href は今と同じ）。手を入れない
4. **`tests/e2e/pages.spec.ts:195` の `header a[hreflang="en"]`** は日本語ページで `EN` のリンクに当たるので、そのまま通る。手を入れない
5. **flex アイテムには `vertical-align` が効かない**。まとまりは `inline-flex` なので、tasks 3.1 (i) の変異「表示中の項目にだけ `vertical-align: top`」ではベースラインがずれない見込み。(i) はまず書かれたとおり当て、ずれなければ（ベースラインの検査が緑のままなら）`position: relative; top: 1px` に替えて当てる。替えたことと理由を報告に書く（→ ledger の Ruling 1）
6. **トップ本文の `.links a` は `display: flex; align-items: center`**（`index.astro` の scoped CSS）。まとまりの中の相手の言語のリンクにも当たるが、本文にはベースラインの要求が無いので構わない。まとまり自体は `.links` の flex アイテムになる
7. **並行 worktree の PR #61（recruiter-and-photo-polish）も `src/lib/site.ts`・`src/pages/[lang]/index.astro`・`tests/unit/site.test.ts` を変える**。先にマージされたら、PR を作る前に `origin/main` を取り込んで衝突を解く（コントローラーの作業）
8. **320px（spec「狭い画面」）の e2e は今ひとつも無い**。tasks 2.3 の「既存の『狭い画面』（320px）」は実在しないので、Task 1 Step 5 (g) で新しく書く

---

## Task 一覧とレビューの単位

| Task | 名前 | tasks.md | レビュー単位 |
|---|---|---|---|
| 1 | データとマークアップ（まとまりにする） | 1.1〜2.3 | ブランチ全体のレビューと兼ねる（下記） |
| 2 | ベースラインの検査に JA / EN を足す | 2.4 | 同上 |
| 3 | 番人の確認と全コマンド | 3.1、3.2 | 同上 |

Task 1 は共有インターフェース（`LanguageSwitch` 型）と spec の要求に触るのでタスク単位のレビューに当たるが、ブランチの差分がほぼ Task 1 そのもの（Task 2 はテスト 1 か所、Task 3 は検証だけ）なので、**Task 3 まで終えてからブランチ全体のレビューを 1 回だけ行い、それを Task 1 の単位レビューと兼ねる**（→ ledger の Ruling 2）。UI の実測は reviewer が Playwright MCP で行う。

実装者は 1 体（worktree ごとに 1 体）。Task 2・3 は同じ implementer に `SendMessage` で続ける。

---

### Task 1: まとまりにする（tasks 1.1〜2.3、design D1〜D4）

**Files:**
- Modify: `src/lib/site.ts:2-20`（import・`LanguageSwitch` 型）、`:28-29, 48, 68`（`UiStrings` と `ui`）、`:143-152`（`languageSwitch()`）
- Modify: `src/components/Header.astro`（マークアップと scoped CSS、冒頭コメント）
- Modify: `src/pages/[lang]/index.astro`（本文の導線のマークアップと scoped CSS）
- Test: `tests/unit/site.test.ts:60-78, 100-102, 132-135`
- Test: `tests/e2e/links.spec.ts`

**Interfaces:**
- Produces:
  ```ts
  export type LanguageSwitch = {
    label: string;               // ui[lang].languageSwitch（'言語' / 'Language'）
    icon: readonly string[];     // globe
    items: { lang: Locale; label: string; href?: string }[]; // locales の順。表示中は href 無し
  };
  export function languageSwitch(path: string, lang: Locale, base: string): LanguageSwitch;
  // UiStrings: languageName を削除し、languageSwitch: string を追加
  ```

- [ ] **Step 1 (1.1 RED): 単体テストを D1 の形に書き直す**

`tests/unit/site.test.ts` の `describe('languageSwitch')` を置き換える:

```ts
describe('languageSwitch', () => {
  it('日本語ページでは JA / EN を並べ、EN だけが同じページの英語版へ', () => {
    expect(languageSwitch('/ja/career/', 'ja', '/')).toEqual({
      label: '言語',
      icon: globe,
      items: [
        { lang: 'ja', label: 'JA' },
        { lang: 'en', label: 'EN', href: '/en/career/' },
      ],
    });
  });

  it('英語ページでも並びは JA / EN で、JA だけが同じページの日本語版へ', () => {
    expect(languageSwitch('/en/', 'en', '/')).toEqual({
      label: 'Language',
      icon: globe,
      items: [
        { lang: 'ja', label: 'JA', href: '/ja/' },
        { lang: 'en', label: 'EN' },
      ],
    });
  });
});
```

`toEqual` は `href: undefined` と「`href` が無い」を区別しないので、表示中の項目に `href` のキー自体が無いことも確かめる（D1「表示中かどうかは `href` があるかどうかで決める」）。上の describe に足す:

```ts
  it('表示中の言語の項目は href のキーを持たない', () => {
    const [ja] = languageSwitch('/ja/', 'ja', '/').items;
    expect(ja).not.toHaveProperty('href');
  });
```

`describe('base 付きのパス生成')` の `it('languageSwitch は base を保つ')` を置き換える:

```ts
  it('languageSwitch は base を保つ', () => {
    expect(languageSwitch('/portfolio/ja/career/', 'ja', base).items).toEqual([
      { lang: 'ja', label: 'JA' },
      { lang: 'en', label: 'EN', href: '/portfolio/en/career/' },
    ]);
  });
```

`it('ナビの aria-label（siteNav / photoNav）が両ロケールで実際の文言になっている')` の中に足す:

```ts
    expect(ui.ja.languageSwitch).toBe('言語');
    expect(ui.en.languageSwitch).toBe('Language');
```

- [ ] **Step 2: 赤を確かめる**

Run: `pnpm test tests/unit/site.test.ts`
Expected: languageSwitch の 4 件（2 つの describe の分と href キーの件）と `ui.*.languageSwitch` の件が FAIL（`label: 'English'` が返る、`ui.ja.languageSwitch` が undefined）。typecheck も赤でよい

- [ ] **Step 3 (1.2 GREEN): `site.ts` を D1 のとおりにする**

`LanguageSwitch` 型を置き換える:

```ts
/** 言語切り替えのまとまり（design D1）。表示中の言語の項目だけ href を持たない */
export type LanguageSwitch = {
  label: string;
  icon: readonly string[];
  items: { lang: Locale; label: string; href?: string }[];
};
```

`UiStrings` の `languageName: string;` を `languageSwitch: string;` に替え、`ui.ja` の `languageName: '日本語',` を `languageSwitch: '言語',`、`ui.en` の `languageName: 'English',` を `languageSwitch: 'Language',` に替える（コメントで「言語切り替えのまとまりの支援技術向けの名前」と 1 行添える）。

`languageSwitch()` を置き換える:

```ts
/** JA / EN を locales の順に並べたまとまり。相手の言語だけが同じページの他言語版へのリンク */
export function languageSwitch(path: string, lang: Locale, base: string): LanguageSwitch {
  return {
    label: ui[lang].languageSwitch,
    icon: globe,
    items: locales.map((l) => {
      const item = { lang: l, label: l.toUpperCase() };
      return l === lang ? item : { ...item, href: alternatePath(path, l, base) };
    }),
  };
}
```

`otherLocale` が未使用になったら `./i18n` の import から外す。

- [ ] **Step 4: 単体が緑になることを確かめる（まだコミットしない）**

Run: `pnpm test tests/unit/site.test.ts`
Expected: PASS。`pnpm typecheck` は `Header.astro` / `index.astro` が `sw.href` などを参照しているので赤のままでよい（Step 8 で直す）

- [ ] **Step 5 (2.1 RED): ヘッダーのまとまりの e2e を書く**

`tests/e2e/links.spec.ts` を次のように直す。

(a) `navIconTable` から言語切り替えの行を外し、コメントを直す:

```ts
/**
 * サイト内導線の行き先 → アイコン（design D3）。並び順ではなく行き先で選ぶ。
 * /ja/photos/ では言語切り替えの href も /photos/ で終わるので、hreflang を持つものを除く。
 * 言語切り替えはリンクではなくまとまり（role=group）なので、langSwitchChecks で別に確かめる
 */
const navIconTable = [
  { name: 'Photos', selector: 'a[href$="/photos/"]:not([hreflang])', grid: camera },
  { name: 'Career', selector: 'a[href$="/career/"]:not([hreflang])', grid: briefcase },
] as const;
```

(b) ファイル先頭のヘルパー群の後ろに、まとまりの検査を 1 つ置く（ヘッダーと本文で共有する）:

```ts
/** まとまりの名前（spec「言語切り替えのグループ名」） */
const groupName = { ja: '言語', en: 'Language' } as const;

/** path（baseURL からの相対）の他言語版の href。ページのパスは /<lang>/... の形 */
function alternateHref(path: string, target: 'ja' | 'en'): string {
  return `${base}${target}/${path.slice(3)}`;
}

/**
 * 言語切り替えのまとまり 1 つを確かめる（spec「表示中の言語はリンクにしない」「ナビのアイコン」ほか）。
 * scope はヘッダーか本文の導線。区切り線はヘッダーと本文で違うので呼び出し側で見る
 */
async function expectLangSwitch(scope: Locator, path: string): Promise<Locator> {
  const lang = path.startsWith('ja/') ? 'ja' : 'en';
  const other = lang === 'ja' ? 'en' : 'ja';
  const group = scope.getByRole('group', { name: groupName[lang], exact: true });
  await expect(group).toHaveCount(1);

  // 並びは JA / EN で固定（地球儀を除く直下の要素の文字）
  const texts = await group
    .locator(':scope > :not(svg)')
    .evaluateAll((els) => els.map((el) => el.textContent?.trim()));
  expect(texts).toEqual(['JA', '/', 'EN']);
  // 区切りの「/」は支援技術から隠す（design D2）
  await expect(group.locator(':scope > [aria-hidden="true"]:not(svg)')).toHaveText('/');

  // 表示中の項目: a ではなく、aria-current="true"、lang が自分、太字
  const current = group.locator(':scope > [aria-current]');
  await expect(current).toHaveCount(1);
  await expect(current).toHaveText(lang.toUpperCase());
  await expect(current).toHaveAttribute('aria-current', 'true');
  await expect(current).toHaveAttribute('lang', lang);
  await expect(current).not.toHaveJSProperty('tagName', 'A');
  const weight = await current.evaluate((el) => Number(getComputedStyle(el).fontWeight));
  expect(weight).toBeGreaterThanOrEqual(700);

  // もう一方: a で、hreflang と lang が相手、href が同じページの他言語版、aria-current なし
  const link = group.locator(':scope > a');
  await expect(link).toHaveCount(1);
  await expect(link).toHaveText(other.toUpperCase());
  await expect(link).toHaveAttribute('hreflang', other);
  await expect(link).toHaveAttribute('lang', other);
  await expect(link).toHaveAttribute('href', alternateHref(path, other));
  await expect(link).not.toHaveAttribute('aria-current');

  // 地球儀はまとまりの直下に 1 つだけで、項目の中には無い
  await expect(group.locator('svg')).toHaveCount(1);
  const globeSvg = group.locator(':scope > svg');
  await expect(globeSvg).toHaveCount(1);
  await expect(globeSvg).toHaveAttribute('aria-hidden', 'true');
  expect(await rectCells(group)).toEqual(cells(globe));
  return group;
}

/** 要素の computed の左の境界線の幅（px） */
function borderLeft(el: Locator): Promise<number> {
  return el.evaluate((e) => Number.parseFloat(getComputedStyle(e).borderLeftWidth));
}
```

(c) 「`${path}` のヘッダーの導線に同じ行き先のドット絵が 1 つずつ付き、ロゴには無い」を直す（`a` が 3 つである検査は残す。言語切り替えの名前の検査を `expectLangSwitch` に置き換える）:

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
    await expect(nav.locator(navIconTable[0].selector)).toHaveAccessibleName('Photos');
    await expect(nav.locator(navIconTable[1].selector)).toHaveAccessibleName('Career');
    await expectLangSwitch(page.locator('header'), path);
  });
}
```

(d) 区切り線の test を足す（spec「区切り線」。両ロケールで当てる）:

```ts
for (const viewport of [
  { width: 1280, height: 720 },
  { width: 390, height: 844 },
]) {
  for (const path of ['ja/', 'en/']) {
    test(`${viewport.width}×${viewport.height} の ${path} でヘッダーの言語切り替えの左に区切り線がある`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto(path);
      const group = page.locator('header').getByRole('group');
      await expect(group).toHaveCount(1);
      expect(await borderLeft(group)).toBeGreaterThanOrEqual(1);
    });
  }
}
```

(e) 「アイコン付きリンクが文字の行より高くならない」の対象を、アイコンを持つ要素（Photos・Career の `a` と、まとまり）にする（spec「アイコンで行が高くならない」）:

```ts
    const items = page.locator('header nav > *');
    await expect(items).toHaveCount(3);
    for (const item of await items.all()) {
      const { height, lineHeight } = await item.evaluate((el) => ({
        height: el.getBoundingClientRect().height,
        lineHeight: Number.parseFloat(getComputedStyle(el).lineHeight),
      }));
      expect(Number.isFinite(lineHeight)).toBe(true);
      expect(height).toBeLessThanOrEqual(lineHeight);
    }
```

（`const links = page.locator('header nav a')` から `expect(height)…` までの本体をこれに差し替える。ループ変数の名前だけ変わる）

(f) 「アイコンは表示され / 隠れ、ロゴとナビが同じ行に並ぶ」を、svg 3 つとナビの直下の 3 要素で見る形にする:

```ts
      const icons = page.locator('header nav svg');
      await expect(icons).toHaveCount(3);
      for (const svg of await icons.all()) {
        if (iconsVisible) await expect(svg).toBeVisible();
        else await expect(svg).toBeHidden();
      }
      // 同じ行 = ナビの直下の各要素（Photos・Career・言語切り替え）の box がロゴの box と縦に重なる
      const logo = await page.locator('header .logo').boundingBox();
      if (!logo) throw new Error('ロゴが表示されていない');
      for (const item of await page.locator('header nav > *').all()) {
        const box = await item.boundingBox();
        if (!box) throw new Error('ナビの要素が表示されていない');
        expect(box.y).toBeLessThan(logo.y + logo.height);
        expect(box.y + box.height).toBeGreaterThan(logo.y);
      }
```

（`const links = page.locator('header nav a');` から最後の `for` までを差し替える）

(g) spec「狭い画面」（320px）の test を足す。tasks 2.3 は既存の検査として挙げているが、**今の e2e には 320px の検査が無い**（`grep -rn 320 tests/e2e` は写真の `sizes` のコメントだけ。落とし穴 8、ledger の Ruling 3）:

```ts
for (const path of ['ja/', 'en/', 'ja/career/', 'en/career/']) {
  test(`320×640 の ${path} でロゴ・Photos・Career・JA・EN が表示され、横スクロールが出ない`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto(path);
    const header = page.locator('header');
    await expect(header.locator('.logo')).toBeVisible();
    for (const name of ['Photos', 'Career']) {
      await expect(header.getByRole('link', { name, exact: true })).toBeVisible();
    }
    for (const text of ['JA', 'EN']) {
      await expect(header.getByRole('group').getByText(text, { exact: true })).toBeVisible();
    }
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
}
```

- [ ] **Step 6 (2.2 RED): 本文の導線の e2e を書く**

`本文最下部はサイト内導線が先、…（${lang}）` の test を直す。`navLinks` の svg を数えるループの対象から言語切り替えを外し、まとまりの検査・境界線なし・並び順を足す:

```ts
for (const lang of ['ja', 'en'] as const) {
  test(`本文最下部はサイト内導線が先、連絡先リンクが最も下で、各導線にドット絵アイコンが付く（${lang}）`, async ({
    page,
  }) => {
    await page.goto(`${lang}/`);

    const nav = page.locator('main nav.links');
    const contactLinks = page.locator('main ul.links li a');
    await expect(nav.locator('a')).toHaveCount(3);
    await expect(contactLinks).toHaveCount(2);

    const navTop = await nav.evaluate((el) => el.getBoundingClientRect().top);
    const contactTop = await contactLinks.first().evaluate((el) => el.getBoundingClientRect().top);
    expect(navTop).toBeLessThan(contactTop);

    // 並びは Photos → Career → 言語切り替え
    const order = await nav.locator(':scope > *').evaluateAll((els) =>
      els.map((el) => el.getAttribute('role') ?? el.getAttribute('href')),
    );
    expect(order).toEqual([`${base}${lang}/photos/`, `${base}${lang}/career/`, 'group']);

    for (const locator of [
      nav.locator(navIconTable[0].selector),
      nav.locator(navIconTable[1].selector),
      contactLinks,
    ]) {
      const count = await locator.count();
      for (let i = 0; i < count; i++) {
        const svg = locator.nth(i).locator('svg[aria-hidden="true"]');
        await expect(svg).toHaveCount(1);
        await expect(svg).toHaveAttribute('viewBox', '0 0 16 16');
      }
    }

    for (const { name, selector, grid } of navIconTable) {
      const link = nav.locator(selector);
      await expect(link, name).toHaveCount(1);
      expect(await rectCells(link), name).toEqual(cells(grid));
    }

    const group = await expectLangSwitch(nav, `${lang}/`);
    await expect(group.locator(':scope > svg')).toHaveAttribute('viewBox', '0 0 16 16');
    expect(await borderLeft(group)).toBe(0);

    const githubLink = contactLinks.filter({ hasText: 'GitHub' });
    const linkedinLink = contactLinks.filter({ hasText: 'LinkedIn' });
    await expect(githubLink).toHaveCount(1);
    await expect(linkedinLink).toHaveCount(1);

    expect(await rectCells(githubLink)).toEqual(cells(github));
    expect(await rectCells(linkedinLink)).toEqual(cells(linkedin));
  });
}
```

- [ ] **Step 7: 赤を確かめる**

Run: `lsof -i :4399`（空きを確かめる）→ `pnpm e2e tests/e2e/links.spec.ts`
Expected: globalSetup の `pnpm build` が `Header.astro` / `index.astro` の型のずれで落ちるか、ビルドが通れば `expectLangSwitch` を呼ぶ test（`getByRole('group')` が 0 件）と区切り線の test が FAIL。どちらの形で赤になったかを報告に書く

- [ ] **Step 8 (2.3 GREEN): `Header.astro` を D2 のマークアップにする**

`<nav>` の中の言語切り替えの `<a>` をまとまりに替える:

```astro
        <span class="lang-switch" role="group" aria-label={sw.label}>
          <PixelArt rows={sw.icon} scale={1} />
          {sw.items.map((item, i) => (
            <Fragment>
              {i > 0 && <span aria-hidden="true">/</span>}
              {item.href ? (
                <a href={item.href} hreflang={item.lang} lang={item.lang}>
                  {item.label}
                </a>
              ) : (
                <span lang={item.lang} aria-current="true">
                  {item.label}
                </span>
              )}
            </Fragment>
          ))}
        </span>
```

scoped CSS に足す（`nav a` の規則の後ろ。30rem 未満で `nav :global(svg)` を隠す既存の規則はまとまりの svg にも当たるので変えない）:

```css
  /* 言語切り替え（design D2）。Career との区切り線はヘッダーだけに付ける */
  .lang-switch {
    display: inline-flex;
    align-items: baseline;
    gap: 0.35em;
    padding-left: 1.25rem;
    border-left: 1px solid var(--line);
  }
  .lang-switch :global(svg) {
    align-self: center;
  }
  .lang-switch [aria-current] {
    font-weight: 700;
  }
```

冒頭コメントの「言語切り替え（相手の言語名 → 同じページの他言語版）」を「言語切り替え（JA / EN。表示中の言語はリンクにせず、相手だけが同じページの他言語版へ）」に直す。

- [ ] **Step 9 (2.3 GREEN): `index.astro` を同じマークアップにする**

`nav.links` の中の言語切り替えの `<a>` を、Step 8 と同じ `<span class="lang-switch" …>…</span>` に替える（コピーでよい。design D3 でコンポーネントにしない）。scoped CSS に足す（区切り線と左の余白は付けない）:

```css
  /* 言語切り替え（design D2）。ヘッダーと違い区切り線は付けない */
  .lang-switch {
    display: inline-flex;
    align-items: baseline;
    gap: 0.35em;
  }
  .lang-switch :global(svg) {
    align-self: center;
  }
  .lang-switch [aria-current] {
    font-weight: 700;
  }
```

- [ ] **Step 10: 緑を確かめる**

Run: `pnpm typecheck && pnpm test && lsof -i :4399; pnpm e2e`
Expected: すべて PASS。とくに次が緑であること: Step 5・6 の test、「狭い画面ではヘッダーのアイコンを隠す」（390・479）、「境界の幅では 1 行のままアイコンを出す」（480）、「アイコンで行が高くならない」、320px の横スクロール（`tests/e2e/viewport.spec.ts`）、a11y（axe）、`pages.spec.ts:195` のクリック、`header a` の href 順。
**390px で 1 行に収まらずに落ちたら**（design Risks）: まず `.lang-switch` の `padding-left` を `0.75rem` に詰めて再実行する。それでも落ちたら、実装をそれ以上いじらず報告して止まる（計画の欠陥として PO に確認する件）

- [ ] **Step 11: lint とコミット**

Run: `pnpm lint`（崩れていたら `pnpm format` → 再度 `pnpm lint`）
`tasks.md` の 1.1・1.2・2.1・2.2・2.3 を `[x]` にして 1 コミット:

```bash
git add src/lib/site.ts src/components/Header.astro 'src/pages/[lang]/index.astro' tests/unit/site.test.ts tests/e2e/links.spec.ts openspec/changes/language-switch-toggle/tasks.md
git commit -m "feat: 言語切り替えを JA / EN のまとまりにし、表示中の言語はリンクにしない

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: ベースラインの検査に JA / EN を足す（tasks 2.4）

**Files:**
- Test: `tests/e2e/links.spec.ts`（「ロゴとナビの文字のベースラインがそろう」）

**Interfaces:**
- Consumes: Task 1 のマークアップ（`header nav [role="group"]` の直下に `a` と `[aria-current]`）

- [ ] **Step 1: 対象を Photos・Career・JA・EN の 4 つにする**

`${viewport.width}×${viewport.height} の ${path} でロゴとナビの文字のベースラインがそろう` の本体の `const links = …` から最後までを差し替える:

```ts
      const logo = await textBaseline(page.locator('header .logo'));
      // Photos・Career と、言語切り替えの JA・EN（spec「ロゴとナビの文字のベースラインがそろう」）
      const texts = page.locator(
        'header nav > a, header nav [role="group"] > a, header nav [role="group"] > [aria-current]',
      );
      await expect(texts).toHaveCount(4);
      for (const text of await texts.all()) {
        const name = await text.textContent();
        expect(Math.abs((await textBaseline(text)) - logo), name ?? '').toBeLessThanOrEqual(0.5);
      }
```

- [ ] **Step 2: 緑を確かめる**

Run: `lsof -i :4399; pnpm e2e tests/e2e/links.spec.ts -g ベースライン`
Expected: 1280×720 と 480×844 の `ja/` / `en/` の 4 件が PASS。落ちたら（擬似太字や `inline-flex` でずれた）、テストを緩めず、どの項目が何 px ずれたかを報告して止まる

- [ ] **Step 3: 検査が JA / EN を見ていることを確かめる**

作業ツリーで一時的に `Header.astro` の `.lang-switch [aria-current]` に `position: relative; top: 1px;` を足して Step 2 を再実行し、`JA` または `EN` の名前付きで FAIL することを見る。確かめたら足した 2 宣言を元に戻し（`git diff src/components/Header.astro` が空になること）、再度 Step 2 が緑になることを確かめる

- [ ] **Step 4: コミット**

`tasks.md` の 2.4 を `[x]` にして:

```bash
git add tests/e2e/links.spec.ts openspec/changes/language-switch-toggle/tasks.md
git commit -m "test: ヘッダーのベースラインの検査に言語切り替えの JA と EN を足す

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: 番人の確認と全コマンド（tasks 3.1、3.2）

**Files:** なし（検証だけ。`tasks.md` のチェックだけをコミットする）

- [ ] **Step 1: 隔離複製を作り、対照を取る**（`docs/harness/README.md` §7）

```sh
EXP=<scratchpad>/mut-lang-<連番>/exp
mkdir -p "$EXP" && git archive HEAD | tar -x -C "$EXP"
pnpm --dir "$EXP" install --frozen-lockfile --offline
lsof -i :4399; pnpm --dir "$EXP" e2e tests/e2e/links.spec.ts
```

Expected: 対照で全件 PASS。実行ログの build が `$EXP` の中で走っていることを確かめる

- [ ] **Step 2: 変異 (a)〜(i) を 1 つずつ当てて赤を見る**

各変異は `$EXP` の中のファイルにだけ当て、1 つ確かめたら元に戻して（`git -C` は使えないので、`git archive HEAD -- <file> | tar -x -C "$EXP"` で当該ファイルを戻す）次へ進む。狙う検査:

| 変異 | 当てる場所（`$EXP` の中） | 落ちるべき検査 |
|---|---|---|
| (a) 表示中の言語もリンクにする | `Header.astro` の `<span lang aria-current>` を `<a href="#" …>` に | ヘッダーの導線（`expectLangSwitch` の tagName / `a` が 1 つ） |
| (b) `aria-current` を外す | `Header.astro` と `index.astro` の `aria-current="true"` を削除 | ヘッダーと本文の導線 |
| (c) 太字を外す | `Header.astro` の `.lang-switch [aria-current] { font-weight: 700 }` を削除 | ヘッダーの導線（font-weight） |
| (d) 表示中の言語を先頭にする | `site.ts` の `items` を表示中の言語が先頭になるよう並べ替える（例: `[...locales].sort((a) => (a === lang ? -1 : 1))`） | `en/` 系のヘッダーと本文の導線（`['JA','/','EN']`） |
| (e) 地球儀を EN のリンクの中に戻す | `Header.astro` の `<PixelArt rows={sw.icon}>` をまとまりの直下から `<a>` の中へ | ヘッダーの導線（`:scope > svg` が 1 つ） |
| (f) ヘッダーの区切り線を消す | `Header.astro` の `border-left` を削除 | 区切り線の 4 件 |
| (g) 本文にも区切り線を付ける | `index.astro` の `.lang-switch` に `border-left: 1px solid var(--line)` | 本文の導線（`borderLeft` が 0） |
| (h) aria-label を両ロケールで同じにする | `site.ts` の `ui.en.languageSwitch` を `'言語'` に | `en/` 系の導線（group の名前）。単体の `ui.en.languageSwitch` も赤でよい |
| (i) 表示中の項目のベースラインをずらす | `Header.astro` の `.lang-switch [aria-current]` に `vertical-align: top`。ベースラインの検査が緑のままなら `position: relative; top: 1px` に替える（落とし穴 5） | ベースラインの検査 |

(d)・(h) は `site.ts` の変異なので単体（`pnpm --dir "$EXP" test`）でも赤になるはず。e2e で見るのは e2e の番人の確認なので、e2e で赤になることを必ず記録する。

各変異の「変異の内容 / 実行コマンド / Tests の行（failed と passed の数）/ 落ちた test 名」を報告に書く。変異ありで緑のものがあれば、README §7 の手順どおり新しい `$EXP` を作り直して 1 度だけ確かめ、それでも緑なら「番人でない」として報告する（テストの修正は勝手にしない）

- [ ] **Step 3: 3.1 のチェックをコミット**

```bash
git add openspec/changes/language-switch-toggle/tasks.md
git commit -m "test: 言語切り替えの番人に変異 (a)〜(i) を当てて落ちることを確かめる

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

（(i) を `position: relative; top: 1px` に替えた場合は、`tasks.md` の 3.1 (i) の行の末尾に「（flex アイテムには vertical-align が効かないので position: relative; top: 1px で当てた）」と書き足して同じコミットに含める）

- [ ] **Step 4 (3.2): 全コマンド**

Run（作業ツリーで）: `pnpm lint && pnpm typecheck && pnpm test && pnpm build && lsof -i :4399; pnpm e2e`
Expected: すべて緑。各コマンドの末尾の要約行（Biome の `Checked N files`、astro check の `0 errors`、Vitest の `Tests N passed`、Playwright の `N passed`）を報告に貼る

- [ ] **Step 5: 3.2 のチェックをコミット**

```bash
git add openspec/changes/language-switch-toggle/tasks.md
git commit -m "chore: 言語切り替えの change で lint / typecheck / test / build / e2e がすべて緑であることを確かめる

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Review Focus

ブランチ全体のレビューで reviewer が特に見るもの（どのタスクのテストも直接は当てていない、または目視でしか分からない入力・状態）:

1. **写真個別ページ・写真一覧での相手の言語のリンク先**: `/ja/photos/<slug>/` の `EN` が `/portfolio/en/photos/<slug>/` へ行き、404 にならないこと（Task 1 の `expectLangSwitch` が `pagePaths` 全件で href を見るので、ここは reviewer が 1 件クリックして確かめれば足りる）
2. **擬似太字の見た目**（design Risks）: 1280px と 480px で DotGothic16 の `JA` / `EN` の太字がにじんで読めなくならないか。スクリーンショットで確認し、読みにくければ PO 判断として報告する（実装で代えない）
3. **390px の英語ページで 1 行に収まっているか**の余裕: e2e は重なりだけを見るので、右端の余白が 0 に近くないか、320px で折り返したときに区切り線が行頭に来て見栄えが崩れないかを目視する
4. **スクリーンリーダーでの読まれ方**: アクセシビリティツリーで、ヘッダーの group が「言語」で、`/` が読まれず、`JA` が current として示されること（`browser_snapshot` で確認）
5. **キーボード操作**: Tab で `Career` の次に相手の言語のリンクだけにフォーカスが移り、表示中の言語には止まらないこと。フォーカスの輪郭が区切り線と重なって見えなくならないこと

---

## 実行の段取り（コントローラー）

1. ledger `.superpowers/sdd/2026-09-24-language-switch-toggle/progress.md` を作り、Preflight と Ruling を書く
2. Issue #62 に「実装開始」をコメントする
3. implementer（`model: opus`）に Task 1 を渡す → 完了後、同じ implementer に `SendMessage` で Task 2 → Task 3
4. `pnpm build && pnpm exec astro preview --port 4321`（4321 が他 worktree に使われていれば別ポート）を起動し、reviewer（`model: opus`）にブランチ全体（BASE `3d79b0e`）の diff・この計画・Review Focus・URL を渡す
5. Approved なら preview を止め、push、Issue に最終レビューの結果をコメント、PR（`Closes #62`）を作る。PR 前に `origin/main` の進み（PR #61）を確かめる
