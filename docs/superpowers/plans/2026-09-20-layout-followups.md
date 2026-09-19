# ポートフォリオサイト v1 実装計画 — Change: layout-followups

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. 実装は `subagent_type: implementer`（Sonnet）、レビューは `subagent_type: reviewer`（Opus）で起こす。切り替え条件と手順は `.claude/rules/review.md`。GitHub Issue は #5。

**Goal:** Change 2 `layout-shell` のレビューで残った小さな指摘（テストの補強、部品の責務、見た目の Minor 5 件、`lang` の出どころ、favicon）を片付け、Change 3（写真）・Change 4（経歴）がきれいな土台の上で始められる状態にする。

**Architecture:** 既存の構造は変えない。計算は `src/lib/` の純 TS に出して Vitest で検証し、`.astro` は並べるだけ、という Change 2 の方針をそのまま守る。favicon はドット絵のデータ（`src/lib/pixel.ts` の `camera`）から SVG 文字列を組み立てる純関数を作り、静的エンドポイント `src/pages/favicon.svg.ts` が返す。`BaseLayout` の `lang` は props をやめて URL から導出する。

**Tech Stack:** Astro 7.3.2（静的エンドポイント、Fonts API）、TypeScript strict、Vitest 5、Biome 2。依存追加なし。

**Spec:** `openspec/changes/layout-followups/specs/layout-shell/spec.md`（favicon の ADDED 要求）、`openspec/changes/layout-followups/design.md`（D1〜D5）、`openspec/changes/layout-followups/proposal.md`、main spec `openspec/specs/layout-shell/spec.md` と `openspec/specs/quality-gates/spec.md`

## PO 決定（2026-09-20、Issue #5 コメント）

design.md の Open Questions への回答。実装はこの決定に従う。

| # | 項目 | 決定 |
|---|---|---|
| D1 | フォント CSS の配信形 | **A. 現状維持**（`<Font>` のインライン出力のまま）→ OpenSpec tasks 3.1 は**対象外** |
| D2-1 | 罫線 `--line` のコントラスト | **直す**（両テーマで 3:1 以上） |
| D2-2 | フッター文字の実効 11px | **直す**（`<small>` を外して 14px） |
| D2-3 | ヘッダーリンクの静止時下線なし | **直す**（常時下線。ロゴにも下線が付く） |
| D2-4 | 404 の文言とリンクのフォント混在 | **直す**（リンクにも `.dot`） |
| D2-5 | 404 の 1280px で左上寄り | **直す**（縦にも中央寄せ） |
| D3 | `BaseLayout` の `lang` を URL から導出 | **採る**（`Props.lang` を削除） |

## Global Constraints

- パッケージマネージャは **pnpm** のみ。`npm` / `npx` はコマンド・スクリプト・ドキュメントのどこにも書かない
- **依存を追加しない**。必要になったら PO に用途・ライセンス・メンテ状況を 1 行ずつ提示して止まる
- 配信 JavaScript ゼロ。`<script>` を 1 つも書かない（Astro の島も使わない）。SVG 内の `<style>` は可
- 公開サイトからの外部通信ゼロ。出力 HTML の `https://` 参照は `<a href>` と `<link rel="alternate" hreflang>` だけ。`@font-face` の `url(` は同一オリジン（`/_astro/fonts/`）
- 色は無彩色のみ。ライト/ダークは `prefers-color-scheme` に追従し、切り替え UI を置かない。本文・薄い文字と背景のコントラスト比は両テーマで 4.5:1 以上、罫線は 3:1 以上（この change で追加する基準）
- ヘッダーの 4 リンク（ロゴ / Photos / Career / 言語切り替え）と 404 のヘッダー 1 リンク（ロゴのみ）という既存の仕様を壊さない
- `src/pages/[lang]/index.astro` の `await getCareer(lang)` を消さない（日英件数検証をビルドに乗せる唯一の経路。Issue #1）
- テストなしのコミット禁止。RED → GREEN → REFACTOR。テストの skip / 削除 / 期待値の書き換えで通すことは禁止（`.claude/rules/testing.md`）。CSS だけの変更（Task 6）は単体テストの対象外とし、ビルド出力の grep と reviewer の Playwright 実測で確認する
- コミットメッセージは日本語、先頭に `feat:` / `fix:` / `test:` / `chore:` / `docs:` / `refactor:`。末尾に `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>` を付ける。`git commit` は `dangerouslyDisableSandbox: true` で実行する（1Password の SSH 署名）
- 各タスクの終わりに `pnpm lint && pnpm typecheck && pnpm test` が 0 であることを確認してからコミットする（ビルドを含むタスクは `pnpm build` も）
- 出力 HTML は 1 行に minify されている。出現数を数えるときは `grep -o … | wc -l` を使う
- ブロッカー・方針変更は Issue #5 にコメントする（コントローラーが行う）。実装者は Issue を触らない

## 実行前の前提（実装タスクではない）

1. PO が Open Questions に回答済み（Issue #5 コメント、2026-09-20）
2. worktree `feature/layout-followups` の中で作業する（作成済み、`pnpm install` 済み）
3. `openspec/changes/layout-followups/` の proposal / design / spec / tasks は生成済み・`openspec validate --strict` valid

## ファイル構成（この change で作る・変えるもの）

```
src/lib/pixel.ts                    # gridSize() と faviconSvg() を追加
src/pages/favicon.svg.ts            # 新規。静的エンドポイントで /favicon.svg を出す
src/layouts/BaseLayout.astro        # <link rel="icon">、lang を URL から導出（Props.lang 削除）
src/components/Header.astro         # 表示条件を showNav && に戻す、静止時の下線
src/components/Footer.astro         # <small> を外す
src/components/pixel/PixelArt.astro # gridSize を使う、margin-bottom を呼び出し側へ
src/pages/[lang]/index.astro        # lang= を外す、ドット絵の余白を持つ
src/pages/404.astro                 # lang= を外す、余白、リンクに .dot、中央寄せ
src/styles/global.css               # --line をライト/ダークとも 3:1 以上に
tsconfig.json                       # noUnusedLocals を試す（効けば残す）
tests/unit/site.test.ts             # 接頭辞なしパスのケース
tests/unit/pixel.test.ts            # 反転検知、gridSize、faviconSvg
openspec/changes/layout-followups/  # tasks.md の完了印、design.md に PO 決定を追記
```

---

### Task 1: 既存テストの補強（OpenSpec tasks 2.1 / 2.2）

実装コードは変えない。既存の純関数に穴が無いことを確かめるテストだけを足す。

**Files:**
- Modify: `tests/unit/site.test.ts`
- Modify: `tests/unit/pixel.test.ts`

**Interfaces:**
- Consumes: `alternateLinks(path: string, site: string | URL): AlternateLink[]`（`src/lib/site.ts`）、`cells(rows: readonly string[]): Cell[]`（`src/lib/pixel.ts`）
- Produces: なし（テストのみ）

- [ ] **Step 1: `site.test.ts` に接頭辞なしパスのケースを足す**

`describe('alternateLinks', …)` の中、既存の 3 つの `it` の後に足す:

```ts
  it('接頭辞の無いパスには接頭辞を付けて返す', () => {
    expect(alternateLinks('/', 'https://example.com')).toEqual([
      { hreflang: 'ja', href: 'https://example.com/ja/' },
      { hreflang: 'en', href: 'https://example.com/en/' },
      { hreflang: 'x-default', href: 'https://example.com/ja/' },
    ]);
  });
```

- [ ] **Step 2: `pixel.test.ts` に全面塗り（反転データ）の検知を足す**

`describe.each([...])('%s', (_name, rows) => { … })` の中、`'少なくとも 1 セルは塗られている'` の後に足す。既存の「1 セル以上」と対で「空でも全面でもない」を挟む番人:

```ts
  it('全面塗りではない', () => {
    expect(cells(rows).length).toBeLessThan(256);
  });
```

- [ ] **Step 3: テストを実行する**

Run: `pnpm test`
Expected: PASS（実装は変えていないので緑のまま。テスト件数が 2 件増える）

- [ ] **Step 4: lint と型検査**

Run: `pnpm lint && pnpm typecheck`
Expected: どちらも終了コード 0

- [ ] **Step 5: コミット**

対象: `tests/unit/site.test.ts` `tests/unit/pixel.test.ts`
メッセージ:

```
test: 接頭辞なしパスの hreflang と、ドット絵の全面塗り検知を足す

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
```

---

### Task 2: 格子の大きさを `gridSize()` に出す（OpenSpec tasks 2.3）

`PixelArt.astro` が持っている「最長行 × 行数」の算出を `src/lib/pixel.ts` の純関数に出し、単体テストで守る。`.astro` は Vitest から直接テストできないため（Change 2 の design D2 と同じ理由）。

**Files:**
- Modify: `src/lib/pixel.ts`
- Modify: `src/components/pixel/PixelArt.astro`
- Test: `tests/unit/pixel.test.ts`

**Interfaces:**
- Consumes: `cells(rows: readonly string[]): Cell[]`
- Produces: `gridSize(rows: readonly string[]): { width: number; height: number }` — Task 4 の `faviconSvg` が使う

- [ ] **Step 1: 失敗するテストを書く**

`tests/unit/pixel.test.ts` の import 行を `import { camera, cells, gridSize, lost } from '../../src/lib/pixel';` に変え、`describe('cells', …)` の後に足す:

```ts
describe('gridSize', () => {
  it('空配列なら 0 × 0', () => {
    expect(gridSize([])).toEqual({ width: 0, height: 0 });
  });

  it('行長が不揃いなら最長行を幅にする', () => {
    expect(gridSize(['#', '##'])).toEqual({ width: 2, height: 2 });
  });

  it('16 × 16 の絵は 16 × 16', () => {
    expect(gridSize(camera)).toEqual({ width: 16, height: 16 });
  });
});
```

- [ ] **Step 2: 失敗を確認する**

Run: `pnpm test`
Expected: FAIL（`gridSize` が `src/lib/pixel.ts` に無い。型エラーまたは `is not a function`）

- [ ] **Step 3: 最小の実装を書く**

`src/lib/pixel.ts` の `cells` の直後に足す:

```ts
/** 格子の大きさ。幅は最長行の文字数、高さは行数 */
export function gridSize(rows: readonly string[]): { width: number; height: number } {
  return { width: Math.max(0, ...rows.map((row) => row.length)), height: rows.length };
}
```

- [ ] **Step 4: テストが通ることを確認する**

Run: `pnpm test`
Expected: PASS

- [ ] **Step 5: `PixelArt.astro` を `gridSize` に置き換える**

frontmatter の import と算出 2 行を差し替える:

```astro
import { cells, gridSize } from '../../lib/pixel';
```

```astro
const { rows, scale = 4 } = Astro.props;
const { width, height } = gridSize(rows);
```

（`const width = Math.max(0, ...rows.map((row) => row.length));` と `const height = rows.length;` を消す）

- [ ] **Step 6: 挙動が変わっていないことをビルドで確認する**

Run: `pnpm build`
Expected: 終了コード 0

Run: `grep -o 'viewBox="0 0 16 16"' dist/404.html | wc -l`
Expected: `1`（404 のドット絵が 16×16 のまま）

Run: `grep -o '<rect ' dist/ja/index.html | wc -l`
Expected: 1 以上。`cells(camera)` の件数と一致する（`pnpm test` の `cells` のテストが緑であることと合わせて同値とみなす）。実測値を報告に書く

- [ ] **Step 7: lint / 型検査 / テスト**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: すべて終了コード 0

- [ ] **Step 8: コミット**

対象: `src/lib/pixel.ts` `src/components/pixel/PixelArt.astro` `tests/unit/pixel.test.ts`
メッセージ:

```
refactor: 格子の大きさの算出を gridSize() に出してテストする

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
```

---

### Task 3: 余白を呼び出し側へ、ヘッダーの表示条件を戻す（OpenSpec tasks 2.4 / 2.5）

どちらも「部品が自分の外側の都合を持っている」のを直す小さな整理。挙動と見た目は変えない。

**Files:**
- Modify: `src/components/pixel/PixelArt.astro`
- Modify: `src/pages/[lang]/index.astro`
- Modify: `src/pages/404.astro`
- Modify: `src/components/Header.astro`

**Interfaces:**
- Consumes: `PixelArt` の props `{ rows: readonly string[]; scale?: number }`（変えない）
- Produces: `PixelArt` は余白を持たない。呼び出し側がラッパー要素で余白を付ける — Task 6 が 404 のレイアウトを触るときの前提

- [ ] **Step 1: `PixelArt.astro` から余白を消す**

`<style>` を次にする:

```astro
<style>
  svg {
    display: block;
  }
</style>
```

- [ ] **Step 2: トップ側に余白を移す**

`src/pages/[lang]/index.astro` のテンプレートとスタイル:

```astro
<BaseLayout lang={lang}>
  <div class="art"><PixelArt rows={camera} /></div>
  <h1>{profile.name}</h1>
  <p class="muted">{profile.tagline}</p>
</BaseLayout>

<style>
  .art {
    margin-bottom: 1rem;
  }
</style>
```

- [ ] **Step 3: 404 側に余白を移す**

`src/pages/404.astro` のテンプレートの `<PixelArt rows={lost} scale={6} />` を次に差し替え、ファイル末尾に `<style>` を足す:

```astro
  <div class="art"><PixelArt rows={lost} scale={6} /></div>
```

```astro
<style>
  .art {
    margin-bottom: 1rem;
  }
</style>
```

- [ ] **Step 4: `Header.astro` の表示条件を `showNav &&` に戻す**

テンプレートの `{ sw && ( … ) }` のブロックを次に差し替える。`const sw = showNav ? languageSwitch(path, lang) : undefined;` は変えない:

```astro
  {
    showNav && (
      <nav>
        {navLinks(lang).map((link) => <a href={link.href}>{link.label}</a>)}
        {sw && (
          <a href={sw.href} hreflang={sw.hreflang} lang={sw.hreflang}>
            {sw.label}
          </a>
        )}
      </nav>
    )
  }
```

- [ ] **Step 5: ビルドしてリンク数と余白を確認する**

Run: `pnpm build`
Expected: 終了コード 0

Run: `grep -o '<a ' dist/ja/index.html | wc -l`
Expected: `4`（ヘッダーのロゴ / Photos / Career / 言語切り替え。hreflang は `<link>` なので数えない）。実測が違ったら中身を見て報告する

Run: `grep -o '<nav' dist/404.html | wc -l`
Expected: `0`（404 にはナビが無い）

Run: `grep -o 'Photos' dist/404.html | wc -l`
Expected: `0`

Run: `grep -o 'margin-bottom:1rem' dist/ja/index.html dist/404.html | wc -l`
Expected: 1 以上（minify で空白が落ちるので `margin-bottom: 1rem` ではなく `margin-bottom:1rem` で探す。見つからなければ `grep -o 'margin-bottom[^;]*' dist/ja/index.html` で実際の形を確かめて報告する）

- [ ] **Step 6: lint / 型検査 / テスト**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: すべて終了コード 0

- [ ] **Step 7: コミット**

対象: `src/components/pixel/PixelArt.astro` `src/pages/[lang]/index.astro` `src/pages/404.astro` `src/components/Header.astro`
メッセージ:

```
refactor: ドット絵の余白を呼び出し側へ移し、ヘッダーの表示条件を showNav に戻す

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
```

---

### Task 4: favicon（OpenSpec tasks 2.7、spec の ADDED 要求）

`/favicon.ico` が 404 になりブラウザのコンソールにエラーが出る。ドット絵と同じデータから SVG を組み立てて `/favicon.svg` を出す。絵のデータを 2 箇所に持たないため、`public/` に手で置くのではなく静的エンドポイントで生成する（design D4）。

**Files:**
- Modify: `src/lib/pixel.ts`
- Create: `src/pages/favicon.svg.ts`
- Modify: `src/layouts/BaseLayout.astro`
- Test: `tests/unit/pixel.test.ts`

**Interfaces:**
- Consumes: `cells(rows)`、`gridSize(rows)`（Task 2）、`camera`（`src/lib/pixel.ts`）
- Produces: `faviconSvg(rows: readonly string[]): string` — 単体の SVG 文書の文字列

- [ ] **Step 1: 失敗するテストを書く**

`tests/unit/pixel.test.ts` の import に `faviconSvg` を足し（`import { camera, cells, faviconSvg, gridSize, lost } from '../../src/lib/pixel';`）、`describe('gridSize', …)` の後に足す:

```ts
describe('faviconSvg', () => {
  it('絵の大きさの viewBox と、ぼかさない指定を持つ', () => {
    const svg = faviconSvg(camera);
    expect(svg).toContain('viewBox="0 0 16 16"');
    expect(svg).toContain('shape-rendering="crispEdges"');
  });

  it('塗られたセルの数だけ rect を出す', () => {
    expect(faviconSvg(camera).match(/<rect /g)).toHaveLength(cells(camera).length);
  });

  it('ライトは暗色、ダークは明色', () => {
    const svg = faviconSvg(camera);
    expect(svg).toContain('fill="#111111"');
    expect(svg).toContain('prefers-color-scheme: dark');
  });

  it('名前空間以外に外部への参照を持たない', () => {
    expect(faviconSvg(camera).replace(/xmlns="[^"]*"/g, '')).not.toMatch(/https?:/);
  });
});
```

- [ ] **Step 2: 失敗を確認する**

Run: `pnpm test`
Expected: FAIL（`faviconSvg` が無い）

- [ ] **Step 3: `faviconSvg` を実装する**

`src/lib/pixel.ts` の `gridSize` の後に足す。色は `global.css` の `--fg`（ライト `#111111` / ダーク `#e8e8e8`）と同じ値。favicon は文書外で表示されるので `currentColor` も CSS 変数も効かず、固定色 + SVG 内の `<style>` で切り替える:

```ts
/**
 * favicon 用の単体 SVG 文書。文書外で表示されるので currentColor も CSS 変数も効かず、
 * 色は global.css の --fg と同じ値を直接書き、ダークは SVG 内の <style> で切り替える
 */
export function faviconSvg(rows: readonly string[]): string {
  const { width, height } = gridSize(rows);
  const rects = cells(rows)
    .map(({ x, y }) => `<rect x="${x}" y="${y}" width="1" height="1"/>`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" shape-rendering="crispEdges" fill="#111111"><style>@media (prefers-color-scheme: dark){rect{fill:#e8e8e8}}</style>${rects}</svg>`;
}
```

- [ ] **Step 4: テストが通ることを確認する**

Run: `pnpm test`
Expected: PASS

- [ ] **Step 5: 静的エンドポイントを作る**

Create `src/pages/favicon.svg.ts`:

```ts
import type { APIRoute } from 'astro';
import { camera, faviconSvg } from '../lib/pixel';

/** トップのドット絵と同じデータから作る favicon。静的ビルドで dist/favicon.svg に出る */
export const GET: APIRoute = () =>
  new Response(faviconSvg(camera), { headers: { 'Content-Type': 'image/svg+xml' } });
```

- [ ] **Step 6: `BaseLayout` から参照する**

`src/layouts/BaseLayout.astro` の `<head>` 内、`<title>` の次の行に足す:

```astro
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
```

- [ ] **Step 7: ビルド出力を確認する**

Run: `pnpm build`
Expected: 終了コード 0

Run: `ls -l dist/favicon.svg`
Expected: ファイルが存在する

Run: `grep -c 'rel="icon"' dist/ja/index.html dist/en/index.html dist/404.html`
Expected: 3 ファイルとも `1`

Run: `grep -o 'https\?://' dist/favicon.svg | sort -u`
Expected: `http://` のみ（`xmlns` の名前空間 URI）。`https://` は出ない

Run: `grep -o '<script' dist/favicon.svg dist/ja/index.html | wc -l`
Expected: `0`

- [ ] **Step 8: lint / 型検査 / テスト**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: すべて終了コード 0

- [ ] **Step 9: コミット**

対象: `src/lib/pixel.ts` `src/pages/favicon.svg.ts` `src/layouts/BaseLayout.astro` `tests/unit/pixel.test.ts`
メッセージ:

```
feat: ドット絵のデータから SVG ファビコンを生成して全ページから参照する

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
```

---

### Task 5: `lang` を URL から導出する（OpenSpec tasks 3.3、design D3。PO 決定: 採る）

いま `BaseLayout` は `lang` をページから受け取りつつ、hreflang の出し分けは `localeFromPath(Astro.url.pathname)` で判定している。同じ事実の出どころが 2 つあるので、URL 側に一本化して props を消す。

**Files:**
- Modify: `src/layouts/BaseLayout.astro`
- Modify: `src/pages/[lang]/index.astro`
- Modify: `src/pages/404.astro`

**Interfaces:**
- Consumes: `localeFromPath(path: string): Locale | null`、`defaultLocale: Locale`（`src/lib/i18n.ts`）
- Produces: `BaseLayout` の Props は `{ title?: string; showNav?: boolean }` のみ。以降のページは `lang` を渡さない

- [ ] **Step 1: `BaseLayout.astro` の frontmatter を書き換える**

import から `type Locale` を外し（`verbatimModuleSyntax` の下では未使用の型 import も残さない）、`defaultLocale` を足す:

```astro
import { defaultLocale, localeFromPath } from '../lib/i18n';
```

Props と導出をこうする。`localeFromPath` は 1 回だけ呼び、結果を `lang` と `alternates` の両方に使う:

```astro
interface Props {
  /** ページ名。省略時はトップ扱いで名前のみ */
  title?: string;
  showNav?: boolean;
}

const { title, showNav } = Astro.props;
const path = Astro.url.pathname;
// lang は URL から導く。接頭辞の無いページ（404）は既定ロケール
const pathLocale = localeFromPath(path);
const lang = pathLocale ?? defaultLocale;
const profile = await getProfile(lang);
if (!Astro.site) throw new Error('astro.config の site が必要（hreflang の絶対 URL に使う）');
const alternates = pathLocale ? alternateLinks(path, Astro.site) : [];
```

テンプレート（`<html lang={lang}>`、`<Header lang={lang} …>`）は変えない。

- [ ] **Step 2: ページ側の `lang=` を外す**

`src/pages/[lang]/index.astro`: `<BaseLayout lang={lang}>` → `<BaseLayout>`。frontmatter の `const lang = Astro.params.lang as Locale;` と `await getCareer(lang)` は**消さない**（`getProfile` / `getCareer` に使う）。

`src/pages/404.astro`: `<BaseLayout lang="ja" title="404" showNav={false}>` → `<BaseLayout title="404" showNav={false}>`。

- [ ] **Step 3: ビルドして `<html lang>` が変わっていないことを確認する**

Run: `pnpm build`
Expected: 終了コード 0

Run: `grep -o '<html lang="[a-z]*"' dist/ja/index.html dist/en/index.html dist/404.html`
Expected:
```
dist/ja/index.html:<html lang="ja"
dist/en/index.html:<html lang="en"
dist/404.html:<html lang="ja"
```

Run: `grep -o 'hreflang="[a-z-]*"' dist/ja/index.html | sort | uniq -c`
Expected: `ja` / `en` / `x-default` の `<link rel="alternate">` 3 本と、言語切り替えの `<a hreflang="en">` 1 本。実測を報告に書く

Run: `grep -c 'rel="alternate"' dist/404.html`
Expected: `0`（404 に hreflang は出ない）

- [ ] **Step 4: lint / 型検査 / テスト**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: すべて終了コード 0（未使用 import が残っていれば typecheck か lint が拾う）

- [ ] **Step 5: コミット**

対象: `src/layouts/BaseLayout.astro` `src/pages/[lang]/index.astro` `src/pages/404.astro`
メッセージ:

```
refactor: BaseLayout の lang を URL から導出して props を消す

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
```

---

### Task 6: 見た目の Minor 5 件（OpenSpec tasks 3.2、design D2。PO 決定: 5 件すべて直す）

CSS と小さなマークアップだけの変更。単体テストは付けない（Global Constraints のとおり、ビルド出力の grep と reviewer の Playwright 実測で確認する）。

**Files:**
- Modify: `src/styles/global.css`
- Modify: `src/components/Footer.astro`
- Modify: `src/components/Header.astro`
- Modify: `src/pages/404.astro`

**Interfaces:**
- Consumes: Task 3 で `PixelArt` は余白を持たなくなり、404 は `<div class="art">` で余白を付けている
- Produces: なし

- [ ] **Step 1: 罫線のコントラストを 3:1 以上にする（D2-1）**

`src/styles/global.css` のライトの `--line: #d4d4d4;` を `--line: #8f8f8f;` に、ダークの `--line: #2a2a2a;` を `--line: #606060;` にする。

計算値（コントローラーが実測済み。ライト背景 `#fafafa`、ダーク背景 `#0c0c0c`）:

| テーマ | 変更前 | 比 | 変更後 | 比 |
|---|---|---|---|---|
| ライト | `#d4d4d4` | 1.42 | `#8f8f8f` | **3.10** |
| ダーク | `#2a2a2a` | 1.36 | `#606060` | **3.11** |

design.md が候補に挙げた `#9a9a9a` は実測 2.70 で 3:1 に届かないので使わない。

- [ ] **Step 2: 比を自分でも測って報告に載せる**

Run:
```bash
node -e '
const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 };
const L = (hex) => { const n = parseInt(hex.slice(1), 16); return 0.2126 * lin(n >> 16 & 255) + 0.7152 * lin(n >> 8 & 255) + 0.0722 * lin(n & 255) };
const ratio = (a, b) => { const [x, y] = [L(a), L(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) };
for (const [bg, line] of [["#fafafa", "#8f8f8f"], ["#0c0c0c", "#606060"]]) console.log(bg, line, ratio(bg, line).toFixed(2));
'
```
Expected: `#fafafa #8f8f8f 3.10` と `#0c0c0c #606060 3.11`。3.0 未満なら値を暗く（ライト）/ 明るく（ダーク）して 3.0 以上にし、採用値と実測値を報告する

- [ ] **Step 3: フッターの文字を 14px にする（D2-2）**

`src/components/Footer.astro` のテンプレートから `<small>` を外す。スコープ CSS の `font-size: 0.875rem;` は残す（16px × 0.875 = 14px）:

```astro
<footer class="muted">© {year} {name}</footer>
```

- [ ] **Step 4: ヘッダーのリンクを常時下線にする（D2-3）**

`src/components/Header.astro` のスコープ CSS から次の 2 ブロックを削除する。`global.css` の `a { text-decoration: underline; text-underline-offset: 0.2em; }` が効くようになる。ロゴにも下線が付く（PO 承認済みの変更点）:

```css
  a {
    text-decoration: none;
  }
  a:hover {
    text-decoration: underline;
  }
```

削除後の `<style>` は `header` / `.logo` / `nav` の 3 ブロックだけになる。

- [ ] **Step 5: 404 の文言とリンクのフォントを揃え、縦にも中央寄せにする（D2-4 / D2-5）**

`src/pages/404.astro` のテンプレート全体を次にする。`<div class="center">` で囲んで縦横中央に置き、リンクにも `.dot` を付ける。`main` を直接触る（`:global(main)`）とページをまたいで漏れる恐れがあるので、このページの中のラッパーで閉じる:

```astro
<BaseLayout title="404" showNav={false}>
  <div class="center">
    <div class="art"><PixelArt rows={lost} scale={6} /></div>
    {
      locales.map((lang) => (
        <p lang={lang}>
          <span class="dot">{ui[lang].notFound}</span>
          {' '}
          <a class="dot" href={`/${lang}/`} hreflang={lang}>
            {ui[lang].backToTop}
          </a>
        </p>
      ))
    }
  </div>
</BaseLayout>

<style>
  .center {
    display: grid;
    place-content: center;
    height: 100%;
  }
  .art {
    margin-bottom: 1rem;
  }
</style>
```

（`main` は `body` の flex 列の中で `flex: 1` なので高さが確定し、子の `height: 100%` が解決する）

- [ ] **Step 6: ビルド出力を確認する**

Run: `pnpm build`
Expected: 終了コード 0

Run: `grep -o '\-\-line:#[0-9a-f]*' dist/ja/index.html | sort -u`
Expected: `--line:#8f8f8f` と `--line:#606060` の 2 つ（minify で空白が落ちる。見つからなければ `grep -o '\-\-line[^;]*' dist/ja/index.html` で実際の形を確かめて報告する）

Run: `grep -o '<small>' dist/ja/index.html | wc -l`
Expected: `0`

Run: `grep -o 'text-decoration:none' dist/ja/index.html | wc -l`
Expected: `0`

Run: `grep -o 'place-content:center' dist/404.html | wc -l`
Expected: `1`

Run: `grep -o 'place-content' dist/ja/index.html dist/en/index.html | wc -l`
Expected: `0`（404 のスタイルが他のページに漏れていない。1 以上なら報告して止まる）

- [ ] **Step 7: lint / 型検査 / テスト**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: すべて終了コード 0

- [ ] **Step 8: コミット**

対象: `src/styles/global.css` `src/components/Footer.astro` `src/components/Header.astro` `src/pages/404.astro`
メッセージ:

```
fix: 罫線のコントラスト・フッターの文字サイズ・ヘッダーの下線・404 の体裁を直す

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
```

---

### Task 7: `noUnusedLocals` が `.astro` に効くか試す（OpenSpec tasks 2.6）

Biome は `.astro` を解析できないので、`.astro` の frontmatter の未使用 import を拾う手段が無い。`astro check`（`pnpm typecheck`）が拾えるなら穴埋めになる。**効かなければ設定を入れない**（効かない設定を残さない）。

`astro/tsconfigs/strict` には `noUnusedLocals` は入っていない（`node_modules/astro/tsconfigs/strict.json` と `base.json` で確認済み）ので、この実験には意味がある。

**Files:**
- Modify: `tsconfig.json`（効いた場合のみ残す）

**Interfaces:**
- Consumes: なし
- Produces: なし

- [ ] **Step 1: 設定を足す**

`tsconfig.json`:

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "noUnusedLocals": true
  },
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist", "node_modules"]
}
```

- [ ] **Step 2: 既存コードで 0 errors かを先に見る**

Run: `pnpm typecheck`
Expected: 終了コード 0。非 0 なら、報告された未使用の局所変数・import を消してから次へ進む（消した内容を報告に書く）

- [ ] **Step 3: わざと未使用の import を置いて、拾うか試す**

`src/components/Footer.astro` の frontmatter の先頭に一時的に足す:

```astro
import { locales } from '../lib/i18n';
```

Run: `pnpm typecheck`
記録: 終了コードと、`'locales' is declared but its value is never read` のようなメッセージが出たかどうか

- [ ] **Step 4: 一時的な import を消す**

`src/components/Footer.astro` を Step 3 の前の状態に戻す。

Run: `pnpm typecheck`
Expected: 終了コード 0

- [ ] **Step 5: 結果で分岐する**

- Step 3 で**拾った**場合: `tsconfig.json` の変更を残し、`pnpm lint && pnpm typecheck && pnpm test && pnpm build` が 0 であることを確認して Step 6 へ
- Step 3 で**拾わなかった**場合: `tsconfig.json` を元に戻し（`compilerOptions` ブロックごと削除）、`git status --short` が空であることを確認する。コミットは作らず、報告に「`astro check` は `.astro` の未使用 import を報告しないため設定を入れない」と実測のコマンド出力を添えて終わる

- [ ] **Step 6: コミット（拾った場合のみ）**

対象: `tsconfig.json`
メッセージ:

```
chore: noUnusedLocals を有効にして .astro の未使用 import を型検査で拾う

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
```

---

### Task 8: OpenSpec の更新と最終確認（OpenSpec tasks 4.1）

**Files:**
- Modify: `openspec/changes/layout-followups/tasks.md`
- Modify: `openspec/changes/layout-followups/design.md`

**Interfaces:**
- Consumes: Task 1〜7 の結果
- Produces: なし

- [ ] **Step 1: `design.md` の Open Questions に PO 決定を書く**

`## Open Questions` セクションの本文を、決定済みであることが分かる形に書き換える（質問の文は残し、決定を追記する）:

```markdown
## Open Questions

PO が決定済み（2026-09-20、GitHub Issue #5 のコメント）:

1. D1: フォント CSS の配信形 → **A（現状維持）**。`<Font>` のインライン出力のまま。tasks 3.1 は対象外
2. D2: 見た目の Minor 5 件 → **5 件すべて直す**。罫線は実測で 3:1 以上になる値（ライト `#8f8f8f` = 3.10、ダーク `#606060` = 3.11）を使う。D2 本文の候補 `#9a9a9a` は実測 2.70 で不足のため不採用
3. D3: `BaseLayout` の `lang` を URL から導出 → **採る**
```

- [ ] **Step 2: `tasks.md` の完了印を付ける**

`- [ ]` を `- [x]` にする。対象は 1.1、2.1〜2.7、3.2、3.3、4.1。3.1 は次のように書き換える:

```markdown
- [x] 3.1 D1 は PO 決定により A（現状維持）。**対象外**（`<Font>` のインライン出力を変えない）
```

Task 7 で `noUnusedLocals` を入れなかった場合、2.6 の行末に `→ astro check は .astro の未使用 import を報告しないため設定を入れない（実測 2026-09-20）` を足す。

4.2（レビュー）と 4.3（PR）はコントローラーが後で行うので `- [ ]` のまま残す。

- [ ] **Step 3: すべてのゲートを通す**

Run: `pnpm lint`
Expected: 終了コード 0

Run: `pnpm typecheck`
Expected: 終了コード 0

Run: `pnpm test`
Expected: 終了コード 0、全テスト PASS（件数を報告に書く）

Run: `pnpm build`
Expected: 終了コード 0。出力に `/`、`/ja/`、`/en/`、`/404.html`、`/favicon.svg` が含まれる

Run: `openspec validate layout-followups --strict`
Expected: `Change 'layout-followups' is valid`

- [ ] **Step 4: コミット**

対象: `openspec/changes/layout-followups/`
メッセージ:

```
docs: layout-followups の PO 決定を design に反映し、tasks の完了印を付ける

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
```

- [ ] **Step 5: 作業ツリーが空であることを確認する**

Run: `git status --short`
Expected: 出力なし
