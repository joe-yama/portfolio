# ポートフォリオサイト v1 実装計画 — Change 3: photo-pipeline

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. 実装は `subagent_type: implementer`（Sonnet）、レビューは `subagent_type: reviewer`（Opus）で起こす。切り替え条件と手順は `.claude/rules/review.md`。

**Goal:** 写真を GitHub Release に入稿するコマンドと、ギャラリー・個別ページ・トップの代表写真を作り、写真がサイトに載るまでの一連の流れを通す。

**Architecture:** 並び順の決定は `getPhotos()` の 1 箇所に閉じる。画像の出力設定（幅・形式・読み込み方）は `PhotoPicture.astro` の 1 箇所に閉じる。入稿コマンドは I/O の殻（`scripts/photo-add.ts`）と変換規則（`src/lib/photo-meta.ts`）に分け、後者だけを Vitest でテストする。`.astro` はテストできないので、テストできる形はすべて `.astro` の外に出す。

**Tech Stack:** Astro 7.3.2（`astro:assets` の `Picture` / `inferRemoteSize`、sharp サービス）、Node 26.8.2（`.ts` を型剥がしで直接実行）、exifr、sharp 0.35.x、Vitest 5、Biome 2。

**Spec:** `openspec/changes/photo-pipeline/`（`proposal.md`、`specs/photo-pipeline/spec.md`、`specs/content-schema/spec.md`、`design.md`、`tasks.md`）。上位の設計書は `docs/superpowers/specs/2026-09-17-portfolio-site-design.md` §4 / §5.1 / §5.3 / §6。

## Global Constraints

- パッケージマネージャは **pnpm** のみ。`npm` / `npx` はコマンド・スクリプト・ドキュメントのどこにも書かない
- この change で追加してよい依存は `exifr` と `sharp` の 2 つだけ（どちらも `devDependencies`）。他が必要になったら PO に用途・ライセンス・メンテ状況を 1 行ずつ提示して止まる
- 配信 JavaScript ゼロ。`<script>` を 1 つも書かない。Astro の島も使わない
- 公開サイトからの外部通信ゼロ。出力 HTML が参照する画像は同一オリジン（`/_astro/…`）でなければならない
- 全ページは `/ja/` と `/en/` の下。URL は末尾スラッシュ付き
- 写真の `image` は `https://github.com/joe-yama/portfolio/releases/download/photos/<slug>.jpg` の形式のみ
- テストなしのコミット禁止。RED → GREEN → REFACTOR。テストの skip / 削除 / 期待値の書き換えで通すことは禁止（`.claude/rules/testing.md`）
- コミットメッセージは日本語、先頭に `feat:` / `test:` / `chore:` / `docs:` など。末尾に system-reminder の attribution 行を付ける。`git commit` はサンドボックス外（`dangerouslyDisableSandbox: true`）で実行する
- `tsconfig.json` は `noUnusedLocals: true`。「先に import だけ置いて後で使う」書き方は `pnpm typecheck` で落ちる
- `verbatimModuleSyntax: true`。型だけの import は必ず `import type` で書く
- ブロッカー・方針変更・実装開始・レビュー結果は GitHub Issue #10 にコメントする。`gh` の書き込み前に `gh api user --jq .login` が `joe-yama` であることを確認する

## この change 特有の落とし穴（実装前に必ず読む）

実物の型定義とソースで確認済み（2026-09-20）。

1. **`<Picture>` の `fallbackFormat` の既定は `png`。** リモート画像では「JPEG なら JPEG を fallback にする」特別扱いが効かない（`node_modules/astro/components/Picture.astro` の `specialFormatsFallback` は ESM import された画像にしか適用されない）。**`fallbackFormat="jpeg"` を明示しないと、写真が巨大な PNG として出力される。**
2. **`inferSize` と `width` を同時に渡してはいけない。** `Picture.astro` は `props.width ??= remoteSize.width; props.height ??= remoteSize.height;` を行う。`width` だけ渡すと `height` に**元画像の高さ**がそのまま入り、横 1200・縦 1667 のような比の狂った `<img>` が出る。この計画では `inferRemoteSize` を自分で呼んで両方を計算する
3. **`astro.config.ts` に `image.layout` が無いので `layout` は `'none'`。** `sizes` は自動生成されないため、`widths` を使うときは `sizes` を自分で渡す
4. **sharp サービスは `withoutEnlargement: true`。** 元画像より大きい `widths` を指定しても拡大されず、元のサイズの派生画像が重複して出るだけ。無駄を避けるため `widths` は元画像の幅で絞る
5. **`node` が直接実行するファイル（`scripts/photo-add.ts` とその実行時依存）では、相対 import に `.ts` を付ける。** Node の ESM 解決は拡張子を補わない。`tsconfig.json` は `allowImportingTsExtensions: true`（`astro/tsconfigs/base`）なので `pnpm typecheck` は通る。型だけの import は `import type` なので拡張子の有無に関わらず消える
6. **`tsconfig` に `noUncheckedIndexedAccess` は無い。** `photos[i - 1]` は `PhotoEntry` 型に見えるが実行時は `undefined` になりうる。範囲を明示的に判定する

## ファイル構成（この change で作る・変えるもの）

```
src/content/schemas.ts            # Exif 型の export を追加（1 行）
src/content.config.ts             # photos コレクションの登録
src/lib/i18n.ts                   # toLocale を追加
src/lib/validate.ts               # validatePhotos に TODO: 検証を追加
src/lib/content.ts                # getPhotos を追加
src/lib/site.ts                   # ui に前後リンク・戻るリンクの文言を追加
src/lib/photo.ts                  # 新規。表示用の整形（formatExif / formatTakenAt / neighbors）
src/lib/photo-meta.ts             # 新規。入稿の変換規則（純粋関数。Node から直接読まれる）
src/components/PhotoPicture.astro # 新規。<Picture> を呼ぶ唯一の場所
src/pages/[lang]/photos/index.astro   # 新規。ギャラリー
src/pages/[lang]/photos/[slug].astro  # 新規。個別ページ
src/pages/[lang]/index.astro      # 代表写真を追加
src/content/photos/<slug>.yaml    # 入稿で生成される
scripts/photo-add.ts              # 新規。I/O の殻
package.json                      # photo:add スクリプト、依存 2 件
tests/unit/i18n.test.ts           # toLocale のテストを追加
tests/unit/validate.test.ts       # TODO: 検証のテストを追加
tests/unit/photo.test.ts          # 新規
tests/unit/photo-meta.test.ts     # 新規
docs/superpowers/specs/2026-09-17-portfolio-site-design.md  # PO 決定の反映
```

責務の分け方（既存の `schemas.ts` / `validate.ts` / `content.ts` の分け方をそのまま延長する）:

- `schemas.ts` = 形、`validate.ts` = 形で表せない制約、`content.ts` = Astro から読んで検証を呼ぶ入口
- `photo.ts` = 表示用の整形（ページが使う）、`photo-meta.ts` = 入稿用の変換（スクリプトが使う）。両者は互いに依存しない
- `PhotoPicture.astro` = 画像の出力設定。ページは幅も形式も知らない

---

### Task 1: `toLocale`（ページの `lang` 取得を検証付きにする）

**Files:**
- Modify: `src/lib/i18n.ts`
- Test: `tests/unit/i18n.test.ts`

**Interfaces:**
- Produces: `export function toLocale(value: string | undefined): Locale` — 不正な値では例外。Task 9 / 10 / 11 のページが使う

- [ ] **Step 1: 失敗するテストを書く**

`tests/unit/i18n.test.ts` の import に `toLocale` を足し、ファイル末尾に追加:

```ts
describe('toLocale', () => {
  it('ロケールの文字列はそのまま返す', () => {
    expect(toLocale('ja')).toBe('ja');
    expect(toLocale('en')).toBe('en');
  });

  it('ロケールでない値は例外にする', () => {
    expect(() => toLocale('fr')).toThrow('fr');
    expect(() => toLocale(undefined)).toThrow();
  });
});
```

- [ ] **Step 2: 失敗を確認する**

Run: `pnpm test`
Expected: FAIL。`toLocale` が export されていない旨。

- [ ] **Step 3: 実装する**

`src/lib/i18n.ts` の末尾に追加:

```ts
/**
 * ページの `Astro.params.lang` をロケールに絞る。getStaticPaths が locales しか返さないので
 * 実行時に外れることは無いが、無検査キャスト（`as Locale`）を各ページに複製しないために置く
 */
export function toLocale(value: string | undefined): Locale {
  if (value !== undefined && isLocale(value)) return value;
  throw new Error(`ロケールではない値がページに渡された: ${String(value)}`);
}
```

- [ ] **Step 4: 通ることを確認する**

Run: `pnpm test`
Expected: PASS。

- [ ] **Step 5: 既存ページのキャストを置き換える**

`src/pages/[lang]/index.astro` の frontmatter:

```diff
-import { type Locale, locales } from '../../lib/i18n';
+import { locales, toLocale } from '../../lib/i18n';
@@
-const lang = Astro.params.lang as Locale;
+const lang = toLocale(Astro.params.lang);
```

- [ ] **Step 6: lint / typecheck / build**

Run: `pnpm lint && pnpm typecheck && pnpm build`
Expected: すべて終了コード 0。`dist/ja/index.html` と `dist/en/index.html` が今までどおり生成される。

- [ ] **Step 7: Commit**

```bash
git add src/lib/i18n.ts tests/unit/i18n.test.ts "src/pages/[lang]/index.astro"
git commit -m "feat: ページの lang 取得を検証付きの toLocale に統一する"
```

---

### Task 2: `formatExif` と `formatTakenAt`

**Files:**
- Create: `src/lib/photo.ts`, `tests/unit/photo.test.ts`
- Modify: `src/content/schemas.ts`（`Exif` 型の export）

**Interfaces:**
- Consumes: `Exif`（`src/content/schemas.ts`）、`Locale`（`src/lib/i18n.ts`）
- Produces:
  - `export function formatExif(exif: Exif): string`
  - `export function formatTakenAt(date: Date, lang: Locale): string`
  - Task 10 の個別ページが使う

- [ ] **Step 1: `Exif` 型を export する**

`src/content/schemas.ts` の `exifSchema` の直後に 1 行追加:

```ts
export type Exif = z.infer<typeof exifSchema>;
```

- [ ] **Step 2: 失敗するテストを書く**

`tests/unit/photo.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { Exif } from '../../src/content/schemas';
import { formatExif, formatTakenAt } from '../../src/lib/photo';

const exif: Exif = {
  camera: 'Fujifilm X-T5',
  lens: 'XF 23mm F1.4 R LM WR',
  aperture: 1.4,
  shutterSpeed: '1/250',
  iso: 800,
};

describe('formatExif', () => {
  it('設計書の形式で 1 行にまとめる', () => {
    expect(formatExif(exif)).toBe('Fujifilm X-T5 · XF 23mm F1.4 R LM WR · f/1.4 · 1/250 · ISO 800');
  });

  it('絞りが整数のときは小数点を付けない', () => {
    expect(formatExif({ ...exif, aperture: 2 })).toContain('f/2');
  });
});

describe('formatTakenAt', () => {
  it('日本語は年月日', () => {
    expect(formatTakenAt(new Date('2025-11-03'), 'ja')).toBe('2025年11月3日');
  });

  it('英語は月名', () => {
    expect(formatTakenAt(new Date('2025-11-03'), 'en')).toBe('November 3, 2025');
  });

  it('日付の境目でも UTC で解釈するのでずれない', () => {
    // 2025-11-03T00:00:00Z。ローカル時刻で解釈すると西半球では 11/2 になる
    expect(formatTakenAt(new Date('2025-11-03T00:00:00Z'), 'ja')).toBe('2025年11月3日');
    // 2025-11-03T23:00:00Z。ローカル時刻で解釈すると東半球では 11/4 になる
    expect(formatTakenAt(new Date('2025-11-03T23:00:00Z'), 'ja')).toBe('2025年11月3日');
  });
});
```

- [ ] **Step 3: 失敗を確認する**

Run: `pnpm test`
Expected: FAIL。`Failed to resolve import "../../src/lib/photo"` 相当。

- [ ] **Step 4: 実装する**

`src/lib/photo.ts`:

```ts
import type { Exif } from '../content/schemas';
import type { Locale } from './i18n';

/** 撮影情報の 1 行。`Fujifilm X-T5 · XF 23mm F1.4 · f/1.4 · 1/250 · ISO 800`（設計書 §5.1） */
export function formatExif(exif: Exif): string {
  return [exif.camera, exif.lens, `f/${exif.aperture}`, exif.shutterSpeed, `ISO ${exif.iso}`].join(
    ' · ',
  );
}

const dateLocale: Record<Locale, string> = { ja: 'ja-JP', en: 'en-US' };

/**
 * 撮影日の表示。takenAt は日付だけの値なので UTC で解釈する。
 * ローカル時刻で解釈すると、ビルドするマシンのタイムゾーン次第で 1 日ずれる
 */
export function formatTakenAt(date: Date, lang: Locale): string {
  return new Intl.DateTimeFormat(dateLocale[lang], {
    dateStyle: 'long',
    timeZone: 'UTC',
  }).format(date);
}
```

- [ ] **Step 5: 通ることを確認する**

Run: `pnpm test`
Expected: PASS。

- [ ] **Step 6: lint と typecheck**

Run: `pnpm lint && pnpm typecheck`
Expected: 終了コード 0。

- [ ] **Step 7: Commit**

```bash
git add src/lib/photo.ts src/content/schemas.ts tests/unit/photo.test.ts
git commit -m "feat: 撮影情報と撮影日の表示用整形を追加"
```

---

### Task 3: `neighbors`（前後の写真）

**Files:**
- Modify: `src/lib/photo.ts`, `tests/unit/photo.test.ts`

**Interfaces:**
- Consumes: `PhotoEntry`（`src/lib/validate.ts` が既に export している `{ id: string; data: Photo }`）
- Produces: `export function neighbors(photos: PhotoEntry[], slug: string): { prev?: PhotoEntry; next?: PhotoEntry }` — 端では該当側が `undefined`。Task 10 が使う

- [ ] **Step 1: 失敗するテストを書く**

`tests/unit/photo.test.ts` の import に追加し（`neighbors`、`PhotoEntry` 型、`PHOTO_BASE_URL`）、末尾に追加:

```ts
function entry(id: string, order: number): PhotoEntry {
  return {
    id,
    data: {
      image: `${PHOTO_BASE_URL}${id}.jpg`,
      order,
      featured: false,
      takenAt: new Date('2025-11-03'),
      title: { ja: 't', en: 't' },
      location: { ja: 'l', en: 'l' },
      alt: { ja: 'a', en: 'a' },
      exif,
    },
  };
}

describe('neighbors', () => {
  const photos = [entry('a', 10), entry('b', 20), entry('c', 30)];

  it('中間の写真は前後とも返す', () => {
    const { prev, next } = neighbors(photos, 'b');
    expect(prev?.id).toBe('a');
    expect(next?.id).toBe('c');
  });

  it('先頭の写真に前は無い', () => {
    const { prev, next } = neighbors(photos, 'a');
    expect(prev).toBeUndefined();
    expect(next?.id).toBe('b');
  });

  it('末尾の写真に次は無い', () => {
    const { prev, next } = neighbors(photos, 'c');
    expect(prev?.id).toBe('b');
    expect(next).toBeUndefined();
  });

  it('1 枚しか無いときは前も次も無い', () => {
    const { prev, next } = neighbors([entry('only', 10)], 'only');
    expect(prev).toBeUndefined();
    expect(next).toBeUndefined();
  });

  it('知らない slug は例外にする', () => {
    expect(() => neighbors(photos, 'zzz')).toThrow('zzz');
  });
});
```

型 import は `import type { PhotoEntry } from '../../src/lib/validate';`、値 import は `import { PHOTO_BASE_URL } from '../../src/content/schemas';`。

- [ ] **Step 2: 失敗を確認する**

Run: `pnpm test`
Expected: FAIL。`neighbors` が無い旨。

- [ ] **Step 3: 実装する**

`src/lib/photo.ts` に追加（import に `import type { PhotoEntry } from './validate';` を足す）:

```ts
/**
 * 並び順で隣接する写真。端では該当側を undefined にする（PO 決定 2026-09-20）。
 * tsconfig に noUncheckedIndexedAccess が無いので、範囲は明示的に判定する
 */
export function neighbors(
  photos: PhotoEntry[],
  slug: string,
): { prev?: PhotoEntry; next?: PhotoEntry } {
  const i = photos.findIndex((p) => p.id === slug);
  if (i < 0) throw new Error(`並びの中に写真が無い: ${slug}`);
  return {
    prev: i > 0 ? photos[i - 1] : undefined,
    next: i < photos.length - 1 ? photos[i + 1] : undefined,
  };
}
```

- [ ] **Step 4: 通ることを確認する**

Run: `pnpm test`
Expected: PASS。

- [ ] **Step 5: lint と typecheck**

Run: `pnpm lint && pnpm typecheck`
Expected: 終了コード 0。

- [ ] **Step 6: Commit**

```bash
git add src/lib/photo.ts tests/unit/photo.test.ts
git commit -m "feat: 並び順で隣接する写真を返す neighbors を追加"
```

---

### Task 4: 未記入プレースホルダの検証

**Files:**
- Modify: `src/lib/validate.ts`, `tests/unit/validate.test.ts`

**Interfaces:**
- Produces: `validatePhotos` が `TODO:` で始まる `title` / `location` / `alt` を報告する。Task 7 でここに引っかかる

- [ ] **Step 1: 失敗するテストを書く**

`tests/unit/validate.test.ts` の `describe('validatePhotos')` の中に追加:

```ts
it('title が TODO: のままなら slug と項目名を挙げて報告する', () => {
  const errors = validatePhotos([
    photo('kyoto', { featured: true, order: 1, title: { ja: 'TODO: 日本語タイトル', en: 'x' } }),
  ]);
  expect(errors.some((e) => e.includes('kyoto') && e.includes('title.ja'))).toBe(true);
});

it('location と alt も同じように見る', () => {
  const errors = validatePhotos([
    photo('kyoto', {
      featured: true,
      order: 1,
      location: { ja: 'x', en: 'TODO: Location' },
      alt: { ja: 'TODO: 代替テキスト', en: 'x' },
    }),
  ]);
  expect(errors.some((e) => e.includes('location.en'))).toBe(true);
  expect(errors.some((e) => e.includes('alt.ja'))).toBe(true);
});

it('TODO で始まっても印（TODO:）でなければ通す', () => {
  const errors = validatePhotos([
    photo('kyoto', { featured: true, order: 1, title: { ja: 'TODO リストの写真', en: 'x' } }),
  ]);
  expect(errors).toEqual([]);
});
```

- [ ] **Step 2: 失敗を確認する**

Run: `pnpm test`
Expected: FAIL。最初の 2 件が「報告されるはずが報告されない」で落ちる。3 件目は最初から通る。

- [ ] **Step 3: 実装する**

`src/lib/validate.ts` の `validatePhotos` の、`image` の URL 検査ループの直後に追加:

```ts
  // 入稿コマンドが入れる未記入の印。`TODO` だけを見ると `TODO リストの写真` のような
  // 正当なタイトルを弾くので、コロンまで含めて一致させる
  for (const e of entries) {
    for (const field of ['title', 'location', 'alt'] as const) {
      for (const lang of ['ja', 'en'] as const) {
        if (e.data[field][lang].startsWith(PLACEHOLDER)) {
          errors.push(`${e.id}: ${field}.${lang} が未記入（${PLACEHOLDER} のまま）`);
        }
      }
    }
  }
```

ファイル冒頭（import の直後）に:

```ts
/** 入稿コマンドが title / location / alt に入れる未記入の印 */
export const PLACEHOLDER = 'TODO:';
```

さらに、**このファイルの先頭の import に `.ts` を足す**（Ruling 1。理由をコメントで残す）:

```diff
-import { type Career, PHOTO_BASE_URL, type Photo } from '../content/schemas';
+// Task 5 の photo-meta.ts がこのファイルから PLACEHOLDER を読み、そちらは node が直接実行する
+// 経路に乗る。Node の ESM 解決は拡張子を補わないので、ここだけ .ts を明示する（計画の落とし穴 5）
+import { type Career, PHOTO_BASE_URL, type Photo } from '../content/schemas.ts';
```

この変更が無いと `pnpm photo:add` が実行時に `ERR_MODULE_NOT_FOUND: Cannot find module '.../src/content/schemas'` で落ちる（2026-09-20 に実物で確認済み。`pnpm test` / `typecheck` / `build` はすべて通ってしまうので、単体テストでは検出できない）。

- [ ] **Step 4: 通ることを確認する**

Run: `pnpm test`
Expected: PASS。

- [ ] **Step 5: `validate.ts` を node から読めることを確認する（Ruling 1 の検証）**

```bash
node --input-type=module -e "const m = await import('file://' + process.cwd() + '/src/lib/validate.ts'); console.log('OK', m.PLACEHOLDER)"
```

Expected: `OK TODO:`。`ERR_MODULE_NOT_FOUND` が出たら Step 4 の `.ts` 追加が漏れている。

- [ ] **Step 6: lint と typecheck と build**

Run: `pnpm lint && pnpm typecheck && pnpm build`
Expected: すべて終了コード 0。`.ts` 付き import が Vite でも Astro でも解決されることの確認。

- [ ] **Step 7: Commit**

```bash
git add src/lib/validate.ts tests/unit/validate.test.ts
git commit -m "feat: 未記入プレースホルダが残ったままのビルドを止める"
```

---

### Task 5: 入稿の変換規則（`src/lib/photo-meta.ts`）

**Files:**
- Create: `src/lib/photo-meta.ts`, `tests/unit/photo-meta.test.ts`

**Interfaces:**
- Consumes: `PLACEHOLDER`（`src/lib/validate.ts`）。**`import { PLACEHOLDER } from './validate.ts';` と `.ts` 付きで書く**（落とし穴 5）
- Produces:
  - `export type RawExif = Record<string, unknown>`
  - `export type PhotoMeta = { slug: string; takenAt: string; camera: string; lens: string; aperture: number; shutterSpeed: string; iso: number }`
  - `export function toSlug(fileName: string): string`
  - `export function formatShutterSpeed(seconds: number): string`
  - `export function formatTakenAtYmd(date: Date): string`
  - `export function exifToPhotoMeta(raw: RawExif, slug: string): { ok: true; meta: PhotoMeta } | { ok: false; missing: string[] }`
  - `export function nextOrder(orders: number[]): number`
  - `export function renderPhotoYaml(meta: PhotoMeta, imageUrl: string, order: number, featured: boolean): string`
  - Task 6 のスクリプトが使う

- [ ] **Step 1: 失敗するテストを書く**

`tests/unit/photo-meta.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  exifToPhotoMeta,
  formatShutterSpeed,
  formatTakenAtYmd,
  nextOrder,
  type PhotoMeta,
  type RawExif,
  renderPhotoYaml,
  toSlug,
} from '../../src/lib/photo-meta';

describe('toSlug', () => {
  it('拡張子を落として小文字の kebab-case にする', () => {
    expect(toSlug('DSCF1234.JPG')).toBe('dscf1234');
    expect(toSlug('2025 Kyoto Dawn.jpeg')).toBe('2025-kyoto-dawn');
    expect(toSlug('kamo_river--dawn.jpg')).toBe('kamo-river-dawn');
  });

  it('英数字が残らないファイル名は例外にする（--slug を使わせる）', () => {
    expect(() => toSlug('鴨川.jpg')).toThrow();
  });
});

describe('formatShutterSpeed', () => {
  it('1 秒未満は分数にする', () => {
    expect(formatShutterSpeed(0.004)).toBe('1/250');
    expect(formatShutterSpeed(1 / 60)).toBe('1/60');
  });

  it('1 秒以上は秒で書き、余分な 0 を付けない', () => {
    expect(formatShutterSpeed(2)).toBe('2s');
    expect(formatShutterSpeed(1.6)).toBe('1.6s');
    expect(formatShutterSpeed(1)).toBe('1s');
  });

  it('0 以下は例外にする', () => {
    expect(() => formatShutterSpeed(0)).toThrow();
  });
});

describe('formatTakenAtYmd', () => {
  it('EXIF の撮影日時をローカル時刻のまま YYYY-MM-DD にする', () => {
    // EXIF の DateTimeOriginal はタイムゾーンを持たず、exifr はローカル時刻の Date を返す。
    // UTC に直すと撮影日がずれるので、ローカルの年月日をそのまま使う
    expect(formatTakenAtYmd(new Date(2025, 10, 3, 5, 30))).toBe('2025-11-03');
    expect(formatTakenAtYmd(new Date(2025, 0, 9, 23, 59))).toBe('2025-01-09');
  });
});

describe('nextOrder', () => {
  it('空なら 10', () => {
    expect(nextOrder([])).toBe(10);
  });

  it('既存の最大値より後ろにする', () => {
    expect(nextOrder([10, 30, 20])).toBe(40);
  });
});

const raw: RawExif = {
  DateTimeOriginal: new Date(2025, 10, 3, 5, 30),
  Make: 'FUJIFILM',
  Model: 'X-T5',
  LensModel: 'XF23mmF1.4 R LM WR',
  FNumber: 1.4,
  ExposureTime: 0.004,
  ISO: 800,
};

describe('exifToPhotoMeta', () => {
  it('必要な項目がそろっていれば変換する', () => {
    const result = exifToPhotoMeta(raw, 'kamo-river-dawn');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.meta).toEqual({
      slug: 'kamo-river-dawn',
      takenAt: '2025-11-03',
      camera: 'FUJIFILM X-T5',
      lens: 'XF23mmF1.4 R LM WR',
      aperture: 1.4,
      shutterSpeed: '1/250',
      iso: 800,
    });
  });

  it('Model が Make で始まるときは重ねない', () => {
    const result = exifToPhotoMeta({ ...raw, Make: 'NIKON', Model: 'NIKON Z 6' }, 's');
    expect(result.ok && result.meta.camera).toBe('NIKON Z 6');
  });

  it('欠けている項目名をすべて挙げる', () => {
    const result = exifToPhotoMeta({ ...raw, LensModel: undefined, ISO: undefined }, 's');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.missing).toEqual(['LensModel', 'ISO']);
  });
});

describe('renderPhotoYaml', () => {
  const meta: PhotoMeta = {
    slug: 'kamo-river-dawn',
    takenAt: '2025-11-03',
    camera: 'FUJIFILM X-T5',
    lens: 'XF23mmF1.4 R LM WR',
    aperture: 1.4,
    shutterSpeed: '1/250',
    iso: 800,
  };
  const yaml = renderPhotoYaml(meta, 'https://example.com/kamo-river-dawn.jpg', 20, false);

  it('EXIF と URL と order と featured を埋める', () => {
    expect(yaml).toContain('image: "https://example.com/kamo-river-dawn.jpg"');
    expect(yaml).toContain('order: 20');
    expect(yaml).toContain('featured: false');
    expect(yaml).toContain('takenAt: 2025-11-03');
    expect(yaml).toContain('shutterSpeed: "1/250"');
    expect(yaml).toContain('iso: 800');
  });

  it('人が書く 3 項目には未記入の印を入れる', () => {
    for (const field of ['title', 'location', 'alt']) {
      expect(yaml).toMatch(new RegExp(`^${field}:.*TODO:.*TODO:`, 'm'));
    }
  });

  it('引用符を含む値を壊さない', () => {
    const odd = renderPhotoYaml({ ...meta, lens: 'a "b": c' }, 'https://e/x.jpg', 10, true);
    expect(odd).toContain('lens: "a \\"b\\": c"');
  });
});
```

- [ ] **Step 2: 失敗を確認する**

Run: `pnpm test`
Expected: FAIL。`Failed to resolve import "../../src/lib/photo-meta"` 相当。

- [ ] **Step 3: 実装する**

`src/lib/photo-meta.ts`:

```ts
// 入稿コマンド（scripts/photo-add.ts）が使う変換規則。純粋関数だけを置く。
// node が直接実行する経路に乗るので、相対 import には .ts を付ける（Node の ESM 解決は拡張子を補わない）
import { PLACEHOLDER } from './validate.ts';

export type RawExif = Record<string, unknown>;

export type PhotoMeta = {
  slug: string;
  /** YYYY-MM-DD */
  takenAt: string;
  camera: string;
  lens: string;
  aperture: number;
  shutterSpeed: string;
  iso: number;
};

/** ファイル名 → slug。英数字が残らない場合は --slug を使わせる */
export function toSlug(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, '');
  const slug = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (slug === '') throw new Error(`ファイル名から slug を作れない。--slug で指定する: ${fileName}`);
  return slug;
}

/** exifr の ExposureTime（秒の数値）→ 表示用の文字列。0.004 → 1/250、2 → 2s */
export function formatShutterSpeed(seconds: number): string {
  if (!(seconds > 0)) throw new Error(`シャッター速度が正の数ではない: ${seconds}`);
  if (seconds >= 1) return `${Number(seconds.toFixed(1))}s`;
  return `1/${Math.round(1 / seconds)}`;
}

/**
 * 撮影日時 → YYYY-MM-DD。EXIF の DateTimeOriginal はタイムゾーンを持たず、
 * exifr はローカル時刻の Date を返す。UTC に直すと撮影日がずれるのでローカルのまま読む
 */
export function formatTakenAtYmd(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function cameraName(make: string, model: string): string {
  const m = model.trim();
  const k = make.trim();
  return m.toLowerCase().startsWith(k.toLowerCase()) ? m : `${k} ${m}`;
}

/** EXIF の生の値 → YAML に書く値。欠けている項目があれば名前を全部挙げて返す */
export function exifToPhotoMeta(
  raw: RawExif,
  slug: string,
): { ok: true; meta: PhotoMeta } | { ok: false; missing: string[] } {
  const missing: string[] = [];
  const takenAt = raw.DateTimeOriginal;
  const make = raw.Make;
  const model = raw.Model;
  const lens = raw.LensModel;
  const aperture = raw.FNumber;
  const exposure = raw.ExposureTime;
  const iso = raw.ISO;

  if (!(takenAt instanceof Date)) missing.push('DateTimeOriginal');
  if (typeof make !== 'string' || make.trim() === '') missing.push('Make');
  if (typeof model !== 'string' || model.trim() === '') missing.push('Model');
  if (typeof lens !== 'string' || lens.trim() === '') missing.push('LensModel');
  if (typeof aperture !== 'number') missing.push('FNumber');
  if (typeof exposure !== 'number') missing.push('ExposureTime');
  if (typeof iso !== 'number') missing.push('ISO');
  if (missing.length > 0) return { ok: false, missing };

  return {
    ok: true,
    meta: {
      slug,
      takenAt: formatTakenAtYmd(takenAt as Date),
      camera: cameraName(make as string, model as string),
      lens: (lens as string).trim(),
      aperture: aperture as number,
      shutterSpeed: formatShutterSpeed(exposure as number),
      iso: iso as number,
    },
  };
}

/** 既存の order より後ろの値。10 刻みにして後から間に挿し込めるようにする */
export function nextOrder(orders: number[]): number {
  return orders.length === 0 ? 10 : Math.max(...orders) + 10;
}

/** YAML の二重引用符スカラーは JSON の文字列と同じ規則なので、JSON.stringify で正しく囲める */
const q = (s: string) => JSON.stringify(s);

export function renderPhotoYaml(
  meta: PhotoMeta,
  imageUrl: string,
  order: number,
  featured: boolean,
): string {
  const todo = (ja: string, en: string) =>
    `{ ja: ${q(`${PLACEHOLDER} ${ja}`)}, en: ${q(`${PLACEHOLDER} ${en}`)} }`;
  return `image: ${q(imageUrl)}
order: ${order}
featured: ${featured}
takenAt: ${meta.takenAt}
title: ${todo('日本語のタイトル', 'English title')}
location: ${todo('撮影地', 'Location')}
alt: ${todo('日本語の代替テキスト', 'English alt text')}
exif:
  camera: ${q(meta.camera)}
  lens: ${q(meta.lens)}
  aperture: ${meta.aperture}
  shutterSpeed: ${q(meta.shutterSpeed)}
  iso: ${meta.iso}
`;
}
```

- [ ] **Step 4: 通ることを確認する**

Run: `pnpm test`
Expected: PASS。

- [ ] **Step 5: lint と typecheck**

Run: `pnpm lint && pnpm typecheck`
Expected: 終了コード 0。`.ts` 付き import が型検査を通ること（`allowImportingTsExtensions` が効いている）。

- [ ] **Step 6: Commit**

```bash
git add src/lib/photo-meta.ts tests/unit/photo-meta.test.ts
git commit -m "feat: 入稿の変換規則（slug・EXIF・YAML 雛形）を追加"
```

---

### Task 6: 依存の追加と入稿コマンド `pnpm photo:add`

**Files:**
- Create: `scripts/photo-add.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: Task 5 の `src/lib/photo-meta.ts`、`PHOTO_BASE_URL`（`src/content/schemas.ts`）
- Produces: `pnpm photo:add <画像ファイル> [--slug <名前>]`。Task 7 が使う

- [ ] **Step 1: 依存を入れる（`pnpm add` は毎回確認される。PO 承認済みの 2 つ）**

```bash
pnpm add -D exifr sharp
```

Expected: `pnpm-lock.yaml` が更新される。`sharp` は Astro が既に使っている 0.35.x が入り、新たなバイナリのダウンロードは起きない（既に store にある）。

- [ ] **Step 2: 解決できることを確認する**

Run: `node -e "console.log(require.resolve('exifr')); console.log(require('sharp/package.json').version)"`
Expected: `exifr` のパスが出て、`sharp` のバージョンが `0.35.` で始まる。

- [ ] **Step 3: `package.json` に scripts を足す**

```json
"photo:add": "node scripts/photo-add.ts"
```

- [ ] **Step 4: スクリプトを書く**

`scripts/photo-add.ts`:

```ts
// 写真 1 枚の入稿。EXIF 読み取り → 長辺 2500px へ縮小 → Release photos へ登録 → YAML 雛形の生成。
// 変換規則は src/lib/photo-meta.ts に置き、ここは I/O だけを持つ（設計 D5）。
// node が直接実行するので、相対 import には .ts を付ける
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import exifr from 'exifr';
import sharp from 'sharp';
import { PHOTO_BASE_URL } from '../src/content/schemas.ts';
import { exifToPhotoMeta, nextOrder, renderPhotoYaml, toSlug } from '../src/lib/photo-meta.ts';

const PHOTOS_DIR = 'src/content/photos';
const RELEASE_TAG = 'photos';
const MAX_EDGE = 2500;

function die(message: string): never {
  console.error(`photo:add: ${message}`);
  process.exit(1);
}

function gh(args: string[]): string {
  return execFileSync('gh', args, { encoding: 'utf8' }).trim();
}

function parseArgs(argv: string[]): { file: string; slug?: string } {
  const rest = [...argv];
  let slug: string | undefined;
  const i = rest.indexOf('--slug');
  if (i >= 0) {
    slug = rest[i + 1];
    if (slug === undefined) die('--slug に値がない');
    rest.splice(i, 2);
  }
  const file = rest[0];
  if (file === undefined) die('使い方: pnpm photo:add <画像ファイル> [--slug <名前>]');
  return { file, slug };
}

// (1) gh のアカウント確認。違うアカウントなら何も変更せずに止まる（設計書 §5.3）
const login = gh(['api', 'user', '--jq', '.login']);
if (login !== 'joe-yama') {
  die(`gh のアカウントが joe-yama ではない（${login}）。gh auth switch で切り替える`);
}

const { file, slug: slugArg } = parseArgs(process.argv.slice(2));
if (!existsSync(file)) die(`ファイルが無い: ${file}`);
const slug = slugArg ?? toSlug(basename(file));

// (2) EXIF を読む。縮小前の元画像から読む
const raw = await exifr.parse(file, { translateValues: false });
if (!raw) die(`EXIF を読めない: ${file}`);

// (3) 足りない項目があれば名前を挙げて中断する
const result = exifToPhotoMeta(raw, slug);
if (!result.ok) die(`EXIF に必要な項目が無い: ${result.missing.join(', ')}`);

// (4) 長辺 2500px 以下・sRGB・品質 90 に変換する。withoutEnlargement で拡大はしない
const work = mkdtempSync(join(tmpdir(), 'photo-add-'));
const jpeg = join(work, `${slug}.jpg`);
const info = await sharp(file)
  .rotate()
  .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
  .toColorspace('srgb')
  .jpeg({ quality: 90 })
  .toFile(jpeg);
console.log(`縮小: ${info.width} x ${info.height}`);

// (5) Release が無ければ作り、asset を上げる（同名は --clobber で差し替え）
try {
  gh(['release', 'view', RELEASE_TAG]);
} catch {
  console.log(`Release ${RELEASE_TAG} を作る`);
  gh(['release', 'create', RELEASE_TAG, '--latest=false', '--title', RELEASE_TAG, '--notes', '写真の元画像']);
}
gh(['release', 'upload', RELEASE_TAG, jpeg, '--clobber']);
console.log(`登録: ${RELEASE_TAG}/${slug}.jpg`);

// (6) YAML を書く。asset が上がった後に書くので、途中で失敗しても再実行で回復できる
const existing = readdirSync(PHOTOS_DIR).filter((f) => f.endsWith('.yaml'));
const orders = existing.map((f) => {
  const m = readFileSync(join(PHOTOS_DIR, f), 'utf8').match(/^order:\s*(-?\d+)/m);
  return m ? Number(m[1]) : 0;
});
const hasFeatured = existing.some((f) =>
  /^featured:\s*true\s*$/m.test(readFileSync(join(PHOTOS_DIR, f), 'utf8')),
);
const yamlPath = join(PHOTOS_DIR, `${slug}.yaml`);
writeFileSync(
  yamlPath,
  renderPhotoYaml(result.meta, `${PHOTO_BASE_URL}${slug}.jpg`, nextOrder(orders), !hasFeatured),
);

console.log(`生成: ${yamlPath}`);
console.log('次: title / location / alt を日英で記入してから pnpm build する（未記入だとビルドが止まる）');
```

- [ ] **Step 5: モジュールが読めることと使い方が出ることを確認する**

Run: `pnpm photo:add`
Expected: 終了コード 1 で `使い方: pnpm photo:add <画像ファイル> [--slug <名前>]`。**このとき import の解決（`astro/zod` を含む）がすべて済んでいるので、`.ts` 付き import と `PHOTO_BASE_URL` の読み込みが動いていることの確認になる。** もし `ERR_MODULE_NOT_FOUND` が出たら、落とし穴 5 に従って相対 import の `.ts` を確認する。

- [ ] **Step 6: lint と typecheck と test**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: すべて終了コード 0。

- [ ] **Step 7: Commit**

```bash
git add package.json pnpm-lock.yaml scripts/photo-add.ts
git commit -m "feat: 写真の入稿コマンド pnpm photo:add を追加"
```

---

### Task 7: Release の作成と実写真の入稿

**Files:**
- Create: `src/content/photos/<slug>.yaml`（入稿で生成 → 手で記入）

**Interfaces:**
- Consumes: Task 6 の `pnpm photo:add`
- Produces: `src/content/photos/*.yaml` と Release `photos` の asset。Task 8 以降がこれを使う

**このタスクは PO から受け取った JPEG が必要。** 未着なら Issue #10 にコメントして PO に依頼し、ここで止まる。Task 8 以降は写真が無いと `pnpm build` を検証できない。

- [ ] **Step 1: アカウントを確認する**

Run: `gh api user --jq .login`
Expected: `joe-yama`。違えば PO に切り替えを依頼して止まる。

- [ ] **Step 2: 1 枚目を入稿する**

Run: `pnpm photo:add <PO から受け取った 1 枚目のパス>`
Expected: 「縮小: W x H」「Release photos を作る」「登録」「生成: src/content/photos/<slug>.yaml」が順に出る。

- [ ] **Step 3: 残りを入稿する**

Run: 受け取った枚数だけ `pnpm photo:add <パス>` を繰り返す
Expected: 2 枚目以降は Release の作成メッセージが出ない。生成された YAML の `featured` が `false`、`order` が 10 ずつ増える。

- [ ] **Step 4: Release と生成物を確認する**

```bash
gh release view photos --json assets --jq '.assets[].name'
ls src/content/photos/
grep -h '^order:\|^featured:\|^image:' src/content/photos/*.yaml
```

Expected: asset 名が `<slug>.jpg` で YAML と 1 対 1。`image` が `https://github.com/joe-yama/portfolio/releases/download/photos/<slug>.jpg`。`featured: true` がちょうど 1 つ。

- [ ] **Step 5: 登録された画像の長辺を確かめる**

```bash
gh release download photos --pattern '*.jpg' --dir /tmp/photo-check --clobber
node -e "const s=require('sharp');const fs=require('fs');for(const f of fs.readdirSync('/tmp/photo-check')){s('/tmp/photo-check/'+f).metadata().then(m=>console.log(f,m.width,m.height,m.space))}"
```

Expected: どの画像も長辺が 2500 以下、`space` が `srgb`。

- [ ] **Step 6: `title` / `location` / `alt` を記入する**

各 YAML の 3 項目を日英で書く。Agent が実画像を見て下書きし、`order` と `featured`（代表写真 1 枚）の希望と合わせて PO に提示し、確定させる。**`TODO:` を 1 つも残さない。**

- [ ] **Step 7: 検証が通ることを確認する**

Run: `pnpm test`
Expected: PASS。この時点ではまだコレクション未登録なのでビルドには乗らないが、Task 4 の検証規則と食い違いがないことを目で確認する。

- [ ] **Step 8: Commit**

```bash
git add src/content/photos
git commit -m "feat: 初回の写真を入稿し、タイトル・撮影地・代替テキストを記入"
```

---

### Task 8: `photos` コレクションの登録と `getPhotos`

**Files:**
- Modify: `src/content.config.ts`, `src/lib/content.ts`

**Interfaces:**
- Consumes: `photoSchema`（`src/content/schemas.ts`）、`validatePhotos` / `assertValid`（`src/lib/validate.ts`）
- Produces: `export async function getPhotos(): Promise<PhotoEntry[]>` — `order` 昇順。Task 9 / 10 / 11 が使う

- [ ] **Step 1: コレクションを登録する**

`src/content.config.ts`:

```diff
-import { careerSchema, profileSchema } from './content/schemas';
+import { careerSchema, photoSchema, profileSchema } from './content/schemas';
@@
+const photos = defineCollection({
+  loader: glob({ pattern: '*.yaml', base: './src/content/photos' }),
+  schema: photoSchema,
+});
+
-export const collections = { profile, career };
+export const collections = { profile, career, photos };
```

- [ ] **Step 2: `getPhotos` を実装する**

`src/lib/content.ts`:

```diff
-import { getEntry } from 'astro:content';
-import type { Career, Profile } from '../content/schemas';
+import { getCollection, getEntry } from 'astro:content';
+import type { Career, Profile } from '../content/schemas';
 import type { Locale } from './i18n';
-import { assertValid, validateCareerParity } from './validate';
+import { assertValid, type PhotoEntry, validateCareerParity, validatePhotos } from './validate';
```

末尾に追加:

```ts
/**
 * 写真の一覧。並び順の決定はここだけで行い、ギャラリー・前後リンク・代表写真は
 * すべて同じ配列を見る（設計 D1）。集合の制約に反していればビルドを止める
 */
export async function getPhotos(): Promise<PhotoEntry[]> {
  const entries = await getCollection('photos');
  const photos = entries.map((e) => ({ id: e.id, data: e.data }));
  assertValid(validatePhotos(photos), 'photos');
  return photos.sort((a, b) => a.data.order - b.data.order);
}
```

- [ ] **Step 3: ビルドが通ることを確認する**

Run: `pnpm build 2>&1 | tee /tmp/build.log; grep -i 'warn' /tmp/build.log || echo '(WARN なし)'`
Expected: 成功し、`[WARN]` が出ない。**この時点では `getPhotos` を呼ぶページがまだ無いので、検証はまだ走らない。**

- [ ] **Step 4: 検証がビルドに乗ることを次のタスクで確かめる旨を控える**

このタスクでは `getPhotos` の呼び出し元が無い。Task 9 完了後に Step 5 の故意の破壊確認を行う。

- [ ] **Step 5: lint / typecheck / test**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: すべて終了コード 0。

- [ ] **Step 6: Commit**

```bash
git add src/content.config.ts src/lib/content.ts
git commit -m "feat: photos コレクションを登録し order 昇順の getPhotos を追加"
```

---

### Task 9: `PhotoPicture.astro` とギャラリーページ

**Files:**
- Create: `src/components/PhotoPicture.astro`, `src/pages/[lang]/photos/index.astro`
- Modify: `src/lib/site.ts`, `tests/unit/site.test.ts`

**Interfaces:**
- Consumes: `getPhotos`（Task 8）、`toLocale`（Task 1）
- Produces:
  - `PhotoPicture.astro` — props `{ photo: PhotoEntry; lang: Locale; variant: 'grid' | 'full'; eager?: boolean }`。Task 10 / 11 が使う
  - `ui[lang].photosTitle` / `backToGallery` / `prevPhoto` / `nextPhoto`。Task 10 が使う

- [ ] **Step 1: 文言のテストを先に書く**

`tests/unit/site.test.ts` に追加:

```ts
describe('ui の写真まわりの文言', () => {
  it('日英とも同じキーを持つ', () => {
    for (const key of ['backToGallery', 'prevPhoto', 'nextPhoto'] as const) {
      expect(ui.ja[key].length).toBeGreaterThan(0);
      expect(ui.en[key].length).toBeGreaterThan(0);
      expect(ui.ja[key]).not.toBe(ui.en[key]);
    }
  });
});
```

- [ ] **Step 2: 失敗を確認する**

Run: `pnpm test`
Expected: FAIL（型エラー、または値が無い）。

- [ ] **Step 3: 文言を足す**

`src/lib/site.ts`:

```diff
-type UiStrings = { languageName: string; notFound: string; backToTop: string };
+type UiStrings = {
+  languageName: string;
+  notFound: string;
+  backToTop: string;
+  backToGallery: string;
+  prevPhoto: string;
+  nextPhoto: string;
+};
@@
-  ja: { languageName: '日本語', notFound: 'ページが見つかりません', backToTop: '日本語のトップへ' },
-  en: { languageName: 'English', notFound: 'Page not found', backToTop: 'Go to the English top' },
+  ja: {
+    languageName: '日本語',
+    notFound: 'ページが見つかりません',
+    backToTop: '日本語のトップへ',
+    backToGallery: '写真一覧へ',
+    prevPhoto: '前の写真',
+    nextPhoto: '次の写真',
+  },
+  en: {
+    languageName: 'English',
+    notFound: 'Page not found',
+    backToTop: 'Go to the English top',
+    backToGallery: 'Back to photos',
+    prevPhoto: 'Previous photo',
+    nextPhoto: 'Next photo',
+  },
```

- [ ] **Step 4: 通ることを確認する**

Run: `pnpm test`
Expected: PASS。

- [ ] **Step 5: `PhotoPicture.astro` を作る**

```astro
---
// <Picture> を呼ぶ唯一の場所（設計 D2）。用途ごとの幅・形式・読み込み方をここに集め、
// alt はコンポーネントの中で必ず埋めるので、呼び出し側が書き忘れる経路が無い
import { Picture, inferRemoteSize } from 'astro:assets';
import type { Locale } from '../lib/i18n';
import type { PhotoEntry } from '../lib/validate';

interface Props {
  photo: PhotoEntry;
  lang: Locale;
  variant: 'grid' | 'full';
  /** トップの代表写真だけ true。loading=eager + fetchpriority=high になる */
  eager?: boolean;
}

const { photo, lang, variant, eager = false } = Astro.props;

// 設計書 §6 の表。sizes は自分で渡す（image.layout を設定していないので自動生成されない）
const preset = {
  grid: {
    widths: [400, 800, 1200],
    sizes: '(min-width: 80rem) 20rem, (min-width: 40rem) 33vw, 100vw',
  },
  full: {
    widths: [1200, 1800, 2500],
    sizes: '(min-width: 80rem) 78rem, calc(100vw - 2rem)',
  },
}[variant];

// 元画像の寸法は自分で読む。<Picture inferSize> に width だけ渡すと height に元画像の高さが
// そのまま残り、width と height の比が狂う（Picture.astro の props.height ??= remoteSize.height）
const original = await inferRemoteSize(photo.data.image);
const width = Math.min(Math.max(...preset.widths), original.width);
const height = Math.round((width * original.height) / original.width);
// sharp は拡大しないので、元画像より大きい幅を並べても同じ画像が重複するだけ。上限で打ち切る
const widths = [...new Set([...preset.widths.filter((w) => w < width), width])];
---

<Picture
  src={photo.data.image}
  alt={photo.data.alt[lang]}
  width={width}
  height={height}
  widths={widths}
  sizes={preset.sizes}
  formats={['avif', 'webp']}
  fallbackFormat="jpeg"
  priority={eager}
/>

<style>
  picture :global(img) {
    display: block;
    width: 100%;
    height: auto;
  }
</style>
```

- [ ] **Step 6: ギャラリーページを作る**

`src/pages/[lang]/photos/index.astro`:

```astro
---
// 写真の一覧。元の縦横比のまま格子に並べる（PO 決定 2026-09-20）。キャプションは出さない
import PhotoPicture from '../../../components/PhotoPicture.astro';
import BaseLayout from '../../../layouts/BaseLayout.astro';
import { getPhotos } from '../../../lib/content';
import { locales, toLocale } from '../../../lib/i18n';

export function getStaticPaths() {
  return locales.map((lang) => ({ params: { lang } }));
}

const lang = toLocale(Astro.params.lang);
const photos = await getPhotos();
---

<BaseLayout title="Photos">
  <ul class="grid">
    {
      photos.map((photo) => (
        <li>
          <a href={`/${lang}/photos/${photo.id}/`}>
            <PhotoPicture photo={photo} lang={lang} variant="grid" />
          </a>
        </li>
      ))
    }
  </ul>
</BaseLayout>

<style>
  .grid {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
  }
  a {
    display: block;
    text-decoration: none;
  }
</style>
```

- [ ] **Step 7: ビルドして出力を確認する**

```bash
pnpm build
ls dist/ja/photos/index.html dist/en/photos/index.html
grep -o 'type="image/[a-z]*"' dist/ja/photos/index.html | sort -u
grep -o 'loading="[a-z]*"' dist/ja/photos/index.html | sort -u
grep -c 'width="[0-9]*" height="[0-9]*"\|height="[0-9]*"' dist/ja/photos/index.html
grep -o 'github\.com' dist/ja/photos/index.html || echo '(外部ホストなし)'
```

Expected: 両ファイルが存在。`image/avif` と `image/webp` が出る。`loading="lazy"` のみ。`<img>` に `width` と `height` がある。`github.com` は 1 件も出ない。

- [ ] **Step 8: 集合の検証がビルドに乗ることを確認する（Task 8 Step 4 の宿題）**

いずれかの YAML の `order` を別の写真と同じ値に一時的に書き換えてから:

Run: `pnpm build`
Expected: 失敗し、`order ... が重複している` と該当 slug が出る。**確認後に必ず元に戻し、`pnpm build` が通ることを再確認する。**

- [ ] **Step 9: lint / typecheck / test**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: すべて終了コード 0。

- [ ] **Step 10: Commit**

```bash
git add src/components/PhotoPicture.astro "src/pages/[lang]/photos/index.astro" src/lib/site.ts tests/unit/site.test.ts
git commit -m "feat: 写真のギャラリーページと画像出力コンポーネントを追加"
```

---

### Task 10: 写真の個別ページ

**Files:**
- Create: `src/pages/[lang]/photos/[slug].astro`

**Interfaces:**
- Consumes: `getPhotos`、`PhotoPicture`、`formatExif` / `formatTakenAt` / `neighbors`、`ui`
- Produces: `/{ja,en}/photos/<slug>/`

- [ ] **Step 1: ページを作る**

`src/pages/[lang]/photos/[slug].astro`:

```astro
---
// 写真 1 枚のページ。タイトル・撮影地・撮影日・撮影情報の 1 行と、前後の写真への移動。
// 並び順の端では前後のリンクを出さない（PO 決定 2026-09-20）
import PhotoPicture from '../../../components/PhotoPicture.astro';
import BaseLayout from '../../../layouts/BaseLayout.astro';
import { getPhotos } from '../../../lib/content';
import { locales, toLocale } from '../../../lib/i18n';
import { formatExif, formatTakenAt, neighbors } from '../../../lib/photo';
import { ui } from '../../../lib/site';

export async function getStaticPaths() {
  const photos = await getPhotos();
  return locales.flatMap((lang) => photos.map((photo) => ({ params: { lang, slug: photo.id } })));
}

const lang = toLocale(Astro.params.lang);
const photos = await getPhotos();
const slug = Astro.params.slug;
if (slug === undefined) throw new Error('slug が無い');
const photo = photos.find((p) => p.id === slug);
if (!photo) throw new Error(`写真が無い: ${slug}`);
const { prev, next } = neighbors(photos, slug);
const t = ui[lang];
---

<BaseLayout title={photo.data.title[lang]}>
  <figure>
    <PhotoPicture photo={photo} lang={lang} variant="full" />
    <figcaption>
      <h1>{photo.data.title[lang]}</h1>
      <p class="muted">{photo.data.location[lang]} · {formatTakenAt(photo.data.takenAt, lang)}</p>
      <p class="dot muted exif">{formatExif(photo.data.exif)}</p>
    </figcaption>
  </figure>

  <nav class="around">
    {prev && <a rel="prev" href={`/${lang}/photos/${prev.id}/`}>← {t.prevPhoto}</a>}
    <a class="gallery" href={`/${lang}/photos/`}>{t.backToGallery}</a>
    {next && <a rel="next" href={`/${lang}/photos/${next.id}/`}>{t.nextPhoto} →</a>}
  </nav>
</BaseLayout>

<style>
  figure {
    margin: 0;
  }
  figcaption {
    margin-top: 1rem;
  }
  h1 {
    font-size: clamp(1.25rem, 3vw, 1.75rem);
  }
  figcaption p {
    margin: 0.25rem 0;
  }
  .exif {
    font-size: 0.875rem;
  }
  .around {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 1.5rem;
    margin-top: 2rem;
    padding-top: 1rem;
    border-top: 1px solid var(--line);
  }
  /* 前が無いときも一覧リンクが中央に来るよう、一覧を伸ばす */
  .gallery {
    margin-inline: auto;
  }
</style>
```

- [ ] **Step 2: ビルドして端の挙動を確認する**

```bash
pnpm build
FIRST=$(grep -l '^order: 10' src/content/photos/*.yaml | head -1 | xargs basename | sed 's/\.yaml//')
LAST=$(grep -h '^order:' src/content/photos/*.yaml | sort -t' ' -k2 -n | tail -1)
ls dist/ja/photos/*/index.html
echo "--- 先頭 ($FIRST) ---"; grep -o 'rel="prev"\|rel="next"' "dist/ja/photos/$FIRST/index.html" || echo '(なし)'
```

Expected: 写真の数 × 2 ロケール分の `index.html` が出る。先頭の写真には `rel="next"` だけがあり `rel="prev"` が無い。末尾はその逆。中間は両方。

- [ ] **Step 3: `<html lang>` と hreflang を確認する**

```bash
SLUG=$(ls src/content/photos/*.yaml | head -1 | xargs basename | sed 's/\.yaml//')
grep -o '<html lang="[a-z]*"' "dist/ja/photos/$SLUG/index.html" "dist/en/photos/$SLUG/index.html"
grep -c 'rel="alternate"' "dist/ja/photos/$SLUG/index.html"
grep -o 'loading="[a-z]*"' "dist/ja/photos/$SLUG/index.html" | sort -u
```

Expected: `ja` と `en`。`rel="alternate"` が 3 本。`loading="lazy"`。

- [ ] **Step 4: lint / typecheck / test**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: すべて終了コード 0。

- [ ] **Step 5: Commit**

```bash
git add "src/pages/[lang]/photos/[slug].astro"
git commit -m "feat: 写真の個別ページと前後リンクを追加"
```

---

### Task 11: トップページの代表写真

**Files:**
- Modify: `src/pages/[lang]/index.astro`

**Interfaces:**
- Consumes: `getPhotos`、`PhotoPicture`

- [ ] **Step 1: 代表写真を足す**

`src/pages/[lang]/index.astro`:

```diff
+import PhotoPicture from '../../components/PhotoPicture.astro';
 import PixelArt from '../../components/pixel/PixelArt.astro';
 import BaseLayout from '../../layouts/BaseLayout.astro';
-import { getCareer, getProfile } from '../../lib/content';
+import { getCareer, getPhotos, getProfile } from '../../lib/content';
 import { locales, toLocale } from '../../lib/i18n';
 import { camera } from '../../lib/pixel';
@@
 const profile = await getProfile(lang);
 // 日英件数の検証をビルドに乗せるため呼ぶ。表示は Change 4 で行う（Issue #1 の申し送り。消さない）
 await getCareer(lang);
+// 代表写真。validatePhotos が「ちょうど 1 枚」を保証しているので、見つからない = 写真が 0 枚
+const featured = (await getPhotos()).find((p) => p.data.featured);
+if (!featured) throw new Error('featured: true の写真が 1 枚も無い');
```

本文の先頭に:

```diff
 <BaseLayout>
+  <div class="hero"><PhotoPicture photo={featured} lang={lang} variant="full" eager /></div>
   <div class="art"><PixelArt rows={camera} /></div>
```

`<style>` に:

```css
  .hero {
    margin-bottom: 2rem;
  }
```

- [ ] **Step 2: ビルドして確認する**

```bash
pnpm build
grep -o 'fetchpriority="high"' dist/ja/index.html
grep -o 'loading="[a-z]*"' dist/ja/index.html | sort -u
grep -o 'decoding="[a-z]*"' dist/ja/index.html | sort -u
```

Expected: `fetchpriority="high"` が 1 件。`loading="eager"`。`decoding="sync"`。

- [ ] **Step 3: 代表写真が無いとビルドが止まることを確認する**

`featured: true` の YAML を一時的に `featured: false` に変えてから:

Run: `pnpm build`
Expected: 失敗する（`validatePhotos` の「featured はちょうど 1 枚にする」）。**確認後に必ず元に戻し、`pnpm build` が通ることを再確認する。**

- [ ] **Step 4: lint / typecheck / test**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: すべて終了コード 0。

- [ ] **Step 5: Commit**

```bash
git add "src/pages/[lang]/index.astro"
git commit -m "feat: トップページに代表写真を表示する"
```

---

### Task 12: 設計書の更新と仕上げ

**Files:**
- Modify: `docs/superpowers/specs/2026-09-17-portfolio-site-design.md`, `openspec/changes/photo-pipeline/tasks.md`

- [ ] **Step 1: 設計書に PO 決定を反映する**

次の 4 点を該当節に書き足す（2026-09-20 の PO 決定であることを明記する）:

- §4 の `/ja/photos/<slug>/` の行: 前後リンクは並び順の端では出さない
- §5.3: `pnpm photo:add` が長辺 2500px・sRGB・品質 90 への縮小まで行う（入稿側で縮小する必要はなくなった）。`title` / `location` / `alt` には `TODO:` の印が入り、残ったままではビルドが止まる
- §6: ギャラリーは元の縦横比を保ち、トリミングしない
- §6 の表: `<Picture>` には `fallbackFormat="jpeg"` を明示する（既定は PNG）

- [ ] **Step 2: `tasks.md` の項目を `[x]` にする**

`openspec/changes/photo-pipeline/tasks.md` の完了した項目を `[x]` に変える。

- [ ] **Step 3: 出力画像から EXIF が落ちていることを確認する**

spec の「出力される画像から撮影時のメタデータは取り除かれていなければならない」の確認。sharp の既定に任せているので、実物で見る。

```bash
pnpm build
node -e "
const fs=require('fs');const p='dist/_astro';
const f=fs.readdirSync(p).filter(n=>/\.(jpe?g|webp|avif)$/.test(n));
if(f.length===0){console.error('派生画像が無い');process.exit(1)}
(async()=>{for(const n of f.slice(0,3)){
  const x=await require('exifr').parse(p+'/'+n).catch(()=>null);
  console.log(n, x===null||x===undefined?'EXIF なし':JSON.stringify(x));
}})()"
```

Expected: 選んだ画像すべてが `EXIF なし`。何か出たら位置情報を含まないか確認し、含むなら**ブロッカーとして PO に報告する**。

- [ ] **Step 4: 全ゲートを確認する**

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
openspec validate photo-pipeline --strict
git status --short
```

Expected: 4 コマンドがすべて終了コード 0、`valid`、`git status` が空（コミット後）。

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/specs/2026-09-17-portfolio-site-design.md openspec/changes/photo-pipeline/tasks.md
git commit -m "docs: 設計書に写真パイプラインの PO 決定を反映し tasks を完了にする"
```

- [ ] **Step 6: ブランチ全体のレビュー**

コントローラーが `pnpm build && pnpm preview` で `http://127.0.0.1:4321/` を配信し、`reviewer`（Opus）を起こす。渡すもの: この計画、`openspec/changes/photo-pipeline/` の spec と design、ブランチ全体の diff、URL。reviewer は「仕様準拠 → コード品質 → ponytail」の順に報告し、`/ja/photos/`・個別ページ（先頭 / 中間 / 末尾）・`/ja/` を Playwright MCP で自分で操作する。結果を Issue #10 にコメントする。

- [ ] **Step 7: PR**

`gh api user --jq .login` が `joe-yama` であることを確認し、PO の許可を得て push、本文に `Closes #10` を含む PR を作る。

---

## Self-Review

**Spec coverage:**

| spec の要求 | 実装するタスク |
|---|---|
| 写真の並び順 | Task 8（`getPhotos` の昇順ソート）、Task 3（`neighbors` が同じ配列を見る） |
| ギャラリーページ | Task 9 |
| 写真の個別ページ | Task 10、Task 2（撮影情報・撮影日の整形） |
| 前後の写真への移動 | Task 3（端の扱い）、Task 10（表示） |
| トップページの代表写真 | Task 11 |
| 写真画像の最適化と配信 | Task 9 Step 5（`PhotoPicture`）、Step 7（同一オリジンの確認）。EXIF の除去は sharp の既定で、Task 12 のレビューで `exiftool` 相当の確認をしない代わりに reviewer が出力を検査する |
| 写真の入稿コマンド | Task 5（変換規則）、Task 6（スクリプト）、Task 7（実行） |
| 未記入プレースホルダの検出（content-schema） | Task 4 |

**未カバーだったので追記した点:** spec の「出力される画像から EXIF は取り除かれていなければならない」は Task のどこにも検証が無かった。Task 12 Step 3 に実行ステップとして追加した（`dist/_astro/` の派生画像を `exifr` で読み、EXIF が残っていないことを確認する）。

**型の一貫性:** `PhotoEntry` は `src/lib/validate.ts` の既存 export を全タスクで使う。`Exif` は Task 2 で `schemas.ts` に追加し、Task 5 のテストが使う。`PLACEHOLDER` は Task 4 で `validate.ts` に追加し、Task 5 が `.ts` 付きで import する。`PhotoMeta` は Task 5 で定義し Task 6 が使う。`toLocale` は Task 1 で定義し Task 9 / 10 / 11 が使う。
