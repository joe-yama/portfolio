# followup-minors-2 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Change 4〜13 と `followup-minors` の申し送りのうち main で有効なものを片付ける。特許の見出し 4 件を直し、壊れる入力 5 件と spec の食い違い（写真 0 枚）を直し、番人の穴を塞ぎ、挙動を変えない品質改善を行う。公開サイトの見た目は特許の見出し 4 件の文言以外は変えない。

**Architecture:** 検証は今の置き場所のまま直す。写真の id は `src/content.config.ts` の glob loader に純関数 `photoIdFromEntry`（`src/lib/photo-meta.ts`）を渡して決める。代表写真の取得は `src/lib/content.ts` の `getFeaturedPhoto()` 1 か所にまとめる。入稿コマンドの例外は既存の `die()`（1 行中断）に寄せる。経歴の検証は `getCareer` で 1 回の `assertValid` にまとめる。

**Tech Stack:** Astro 7（静的出力）、TypeScript（strict + `noUnusedLocals`）、Zod（`astro/zod`）、Vitest 5（`getViteConfig`）、Playwright 1.63 + axe、Biome 2、pnpm、Node 26（`scripts/photo-add.ts` は node が型を剥がして直接実行する）、exifr、sharp。依存の追加なし。

**Spec:** `openspec/changes/followup-minors-2/specs/content-schema/spec.md`、`openspec/changes/followup-minors-2/specs/photo-pipeline/spec.md`（要求）、`openspec/changes/followup-minors-2/design.md`（決定 D1〜D6）、`openspec/changes/followup-minors-2/tasks.md`（タスク）、`openspec/changes/followup-minors-2/proposal.md`（含める / 含めない）。Issue #52。

## Global Constraints

- **パッケージマネージャは pnpm のみ**。`npm` / `npx` は使わない。**依存を 1 つも足さない**。`pnpm install` は `--frozen-lockfile` 付きだけ
- **TDD**: 失敗するテストを先に書き、赤を見てから実装する。テストの削除・skip・期待値の書き換えで通さない（`.claude/rules/testing.md`）。例外は次の 2 つだけで、どちらもコミットメッセージに理由を書く:
  - spec delta が変えた期待値: `tests/unit/validate.test.ts` の「写真が 0 枚なら制約を評価せず問題なしとする」（Task 3）
  - design D4 が変えたエラーの体裁: `tests/unit/content.test.ts` の `career/ja` / `career/en` を含む正規表現（Task 5。新しい期待値は `ja: ` / `en: ` の接頭辞まで見るので、前より厳しくする方向に限る）
- **挙動不変のタスク（design D6）** は既存のテストが緑のまま通ることを証拠にする。テストを畳む・整理する場合は、整理の前後で同じ変異が赤になることを確かめる（Task 13 でまとめて記録する）。`.astro` を触る挙動不変のタスクは、`pnpm build` 前後の `dist/` の HTML の diff が空であること（CSS の移動は、該当ページの計算済みスタイルが変わらないこと）を示す
- **コミットは `tasks.md` の項目ごと**。日本語、先頭に種別（`feat:` / `fix:` / `test:` / `refactor:` / `docs:`）。`openspec/changes/followup-minors-2/tasks.md` の該当項目のチェックを同じコミットに含める。末尾の attribution 行はセッションの指示に従う
- **`git commit` は sandbox 外で実行する**（1Password の SSH 署名）。push はコントローラーが行う
- **触らないファイル**（`header-nav-icons` の領域。proposal「含めない」）: `src/components/Header.astro`、`src/lib/site.ts`、`tests/unit/site.test.ts`、`tests/e2e/links.spec.ts`、`src/pages/[lang]/index.astro` の導線（`<nav class="links">` と `<ul class="links">`）の JSX
- **archive は書き換えない**: `openspec/changes/archive/**`（D1 の照合表を含む）
- **`validate.ts` と `photo-meta.ts` は node が直接実行する経路に乗る**（`scripts/photo-add.ts` → `photo-meta.ts` → `validate.ts` → `schemas.ts`）。この経路の相対 import には `.ts` を付ける
- **`tsconfig.json` の `include` は `**/*`** なので、`pnpm typecheck`（astro check）は `tests/` も型検査する
- **Biome**: シングルクォート、セミコロンあり、行幅 100。崩れたら `pnpm format`
- **e2e はポート 4399 を他の worktree と共有する**。`pnpm e2e` を同時に 2 本回さない。実行前に `lsof -i :4399` で空いていることを確かめる
- **`rm -rf` は hook が拒否する**。隔離複製は毎回新しいディレクトリ名で作り、消さない
- **スコープ**: `tasks.md` の項目だけ。気づいた改善は `tasks.md` 末尾の「提案」に書き、実装しない（`.claude/rules/scope.md`）
- **検証コマンド**: `pnpm test` / `pnpm lint` / `pnpm typecheck` / `pnpm build` / `pnpm e2e`。報告には実行したコマンドと出力の抜粋を添える

## 隔離実行の手順（変異を当てる Task で使う）

`docs/harness/README.md` §7 の手順に従う。要点:

```sh
S=/private/tmp/claude-501/-Users-joe-repo-github-personal-joe-yama-portfolio/4b275586-ed73-462a-80a2-90c0f4cb40ac/scratchpad
EXP=$S/mut-<名前>/exp                     # 毎回新しい名前
mkdir -p "$EXP" && git archive HEAD | tar -x -C "$EXP"
# コミット前の変更を載せるとき（作業ツリーの root で）
git ls-files -m -o --exclude-standard | tar -c -T - | tar -x -C "$EXP"
pnpm --dir "$EXP" install --frozen-lockfile --offline
pnpm --dir "$EXP" test      # 対照: 変異なしで緑（RUN の行が $EXP を指すこと）
# $EXP の中のファイルだけに変異を当てる
pnpm --dir "$EXP" test      # 変異ありで、狙った検査が赤
```

- 変異ありで緑なら、変異を当てた状態の新しい `$EXP` を作り直して 1 度だけ再実行する。それでも緑なら番人でないので、テストを直す
- e2e は `pnpm --dir "$EXP" e2e`。globalSetup が複製の中で `pnpm build` する
- 作業ツリーそのものに変異を当てない

## 計画作成時に実測したこと

1. **exifr は画像でない入力で例外を投げる**: 中身が `hello` の `.jpg` に対して `exifr.parse(buffer)` は `Error: Unknown file format` を投げる。`scripts/photo-add.ts` はトップレベルの `await` で呼んでいるので捕まらず、Node が例外とソースの抜粋を端末に出す（Task 4 の赤）。sharp は同じ入力に `Input file contains unsupported image format` を投げる
2. **既存の 0 枚のテスト**: `tests/unit/validate.test.ts:29` の「写真が 0 枚なら制約を評価せず問題なしとする」は spec delta で期待値が変わる（Task 3）
3. **`global.css` の色はすべて 6 桁**（`--bg: #fafafa` など 8 個）。Task 6 で抽出を 6 桁に絞っても現データは通る
4. **特許の YAML の書式**: 各項目は `  - number:` で始まり、`    url: https://…`（クォートなし）、`    title: …`（クォートなし）が続く（`src/content/career/ja.yaml:82` 以降）。Task 8 の `parsePatents` はこの書式を前提にしてよい
5. **現在の見出し**（D1 の書き換え前）: ja.yaml 157 行 `並走時は閾値を下げ相対速度の反転回数超過で所定処理`、332 行 `前方車の灯火が見えにくいと車間拡大か通知の少なくとも一方を実施`。en.yaml 137 行 `Recognizing an occupant's image to restore vehicle equipment settings in any car`、157 行 `Lowering the reversal-count threshold …`、327 行 `A single button that takes a photo …`。行番号は目安で、`number` で特定する
6. **`photoSlugs` の export は `tests/e2e/paths.ts` の外で使われていない**（`viewport.spec.ts` は slug を直書き）

## 計画段階の裁定（コントローラー）

tasks.md の項目どうしの食い違いを、実装中に止まらないよう先に裁定する。PR 前に ledger と Issue に転記する。

- **R-a: content.test の `getCollection` モックは消さない**（tasks.md 2.6 の「未使用の `getCollection` モック」）。理由: Task 3 が「写真 0 枚で `getPhotos` が落ちる」配線の番人にこのモックを使うので、未使用ではなくなる。代償: なし（2.6 の該当部分は不要になっただけ）
- **R-b: `viewport.spec.ts` の縦位置の写真の slug（`kariya-ferris-wheel`）は直書きのまま残す**（tasks.md 6.1 の「写真の slug の直書き … を `paths.ts` から導く」）。理由: 縦位置かどうかは YAML に無く、slug の一覧から導けない。導くには画像の寸法を読む仕組みが要り、ponytail に反する。6.1 は `locales` の重複だけを直す。代償: 写真を改名すると viewport が 404 で落ちる（黙って通ることはない）。F15 どおり `photoSlugs` の export は消す

---

## Task 一覧とレビューの単位

| Task | 名前 | tasks.md | レビュー単位 |
|---|---|---|---|
| 1 | 特許の見出し 4 件 | 1.1 | 単位 4 |
| 2 | 写真の id をファイル名そのものにする | 2.1 | 単位 1（この Task だけ。URL 構造と spec） |
| 3 | 写真 0 枚でビルドを落とし、代表写真の取得を 1 か所に | 2.2 | 単位 2（この Task だけ。spec と複数ファイル） |
| 4 | 入稿コマンドの中断を 1 行に揃える | 2.3、2.4、2.5 | 単位 3（spec） |
| 5 | 経歴の検証を 1 回にまとめる | 2.6 | 単位 4 |
| 6 | theme の色の桁数を揃える | 2.7 | 単位 4 |
| 7 | 単体テストの番人の穴 | 3.1、3.2、3.4 | 単位 4 |
| 8 | e2e の特許・hreflang の番人 | 3.3 | 単位 4 |
| 9 | 実装の品質改善（挙動不変） | 4.1〜4.4 | 単位 5 |
| 10 | e2e の基盤の整理 | 5.1〜5.3 | 単位 5 |
| 11 | viewport.spec の整理と拡張 | 6.1〜6.4 | 単位 6 |
| 12 | 写真表示まわりの ponytail | 6.5〜6.7 | 単位 6（UI の実測あり） |
| 13 | 変異の確認 | 7.1、7.2 | ブランチ全体のレビューで確認 |
| 14 | docs と全コマンド | 7.3、7.4 | ブランチ全体のレビュー |

Task は番号順に 1 体ずつ実装する（worktree ごとに implementer は 1 体。index・dist・ポート 4399 を共有するため）。各単位の最後の Task が終わったらレビューに回す。

---

### Task 1: 特許の見出し 4 件（tasks.md 1.1）

**Files:**
- Modify: `src/content/career/ja.yaml`（`JP7310636B2`、`JP2021111156A` の `title`）
- Modify: `src/content/career/en.yaml`（`JP2025095979A`、`JP2020093622A`、`JP7310636B2` の `title`）

**Interfaces:** なし（データだけ）

- [ ] **Step 1: 5 行を書き換える**（`number` で項目を特定し、`title:` の行だけを変える）

| ファイル | number | 新しい title |
|---|---|---|
| en.yaml | JP2025095979A | `Taking a photo on a short press and recording video on a long press with an in-car camera` |
| en.yaml | JP2020093622A | `Recognizing an occupant on camera to restore their settings in the same or another car` |
| ja.yaml | JP7310636B2 | `近接する2台の相対速度が何度も正負反転したら処理を実行、並走時は早めに` |
| en.yaml | JP7310636B2 | `Acting when nearby vehicles' relative speed keeps flipping sign, sooner side by side` |
| ja.yaml | JP2021111156A | `前方車の灯火が見えにくいと判定したら車間を広げるか運転者に通知` |

ja の `、` と en の `'` は YAML のクォート無しスカラーでそのまま書ける（`: ` や `#` を含まない）。

- [ ] **Step 2: 長さと差分を確かめる**

```sh
node -e "for (const s of ['近接する2台の相対速度が何度も正負反転したら処理を実行、並走時は早めに','前方車の灯火が見えにくいと判定したら車間を広げるか運転者に通知']) console.log([...s].length)"
git diff --stat   # 2 ファイル、5 行の置き換えだけ
pnpm test && pnpm build
```

Expected: ja は 40 以下、`pnpm test` 緑、`pnpm build` 成功（`validateCareerPatents` の長さ検査を通る）。

- [ ] **Step 3: tasks.md 1.1 にチェックを入れてコミット**

```sh
git add src/content/career/ja.yaml src/content/career/en.yaml openspec/changes/followup-minors-2/tasks.md
git commit -m "feat: 特許の見出し 4 件の言い回しを直す"
```

---

### Task 2: 写真の id をファイル名そのものにする（tasks.md 2.1、design D2）

**Files:**
- Modify: `src/lib/photo-meta.ts`（`photoIdFromEntry` を追加）
- Modify: `src/content.config.ts`（photos の `glob()` に `generateId`）
- Modify: `tests/e2e/paths.ts`（slug の作り方とコメント、`photoSlugs` の export を外す）
- Test: `tests/unit/photo-meta.test.ts`、Create: `tests/unit/content-config.test.ts`

**Interfaces:**
- Produces: `export function photoIdFromEntry(entry: string): string`（`src/lib/photo-meta.ts`）

- [ ] **Step 1: 赤の実測（ビルドが落ちること）**

```sh
sed 's#photos/kariya-ferris-wheel.jpg#photos/kamo-river-v1.2.jpg#; s/^featured: true/featured: false/; s/^order: .*/order: 999/' \
  src/content/photos/kariya-ferris-wheel.yaml > src/content/photos/kamo-river-v1.2.yaml
pnpm build 2>&1 | tail -5
```

Expected: `photos の内容に問題がある` と `kamo-river-v12: image は …kamo-river-v12.jpg にする` でビルドが失敗する（既定の id 生成が `.` を消す）。出力を報告に貼る。**この YAML はまだ消さない**（Step 5 で使う）。

注意: `kamo-river-v1.2.jpg` は Release に無いので、GREEN の後もビルドは画像の取得（`inferRemoteSize` / `getImage`）で落ちる。Step 5 の確認はそれを前提に、(1) 検証（`photos の内容に問題がある`）では落ちなくなったこと、(2) `.` を含むディレクトリが静的配信で 200 を返すこと、の 2 つに分けて行う。

- [ ] **Step 2: 単体テストを書く（赤）**

`tests/unit/photo-meta.test.ts` に追加（import に `photoIdFromEntry` を足す）:

```ts
describe('photoIdFromEntry', () => {
  it.each([
    ['kamo-river-v1.2.yaml', 'kamo-river-v1.2'],
    ['Kamo.yaml', 'Kamo'],
    ['kariya-ferris-wheel.yaml', 'kariya-ferris-wheel'],
  ])('%s → %s（拡張子だけを除き、. や大文字を残す）', (entry, id) => {
    expect(photoIdFromEntry(entry)).toBe(id);
  });
});
```

配線の番人 `tests/unit/content-config.test.ts`（`generateId` を外す変異 (a) を落とすためのもの）:

```ts
import { describe, expect, it, vi } from 'vitest';

// content.config.ts が photos の glob loader に generateId を渡していることの番人（design D2）。
// glob を差し替えて受け取ったオプションを返させ、generateId を直接呼ぶ
vi.mock('astro/loaders', () => ({ glob: (options: unknown) => options }));
vi.mock('astro:content', () => ({ defineCollection: (config: unknown) => config }));

const { collections } = await import('../../src/content.config');

describe('写真コレクションの id', () => {
  it('ファイル名（拡張子を除く）をそのまま id にする', () => {
    const loader = collections.photos.loader as unknown as {
      generateId?: (options: { entry: string }) => string;
    };
    expect(loader.generateId?.({ entry: 'kamo-river-v1.2.yaml' })).toBe('kamo-river-v1.2');
    expect(loader.generateId?.({ entry: 'Kamo.yaml' })).toBe('Kamo');
  });
});
```

`pnpm exec vitest run tests/unit/photo-meta.test.ts tests/unit/content-config.test.ts` で赤（`photoIdFromEntry` が無い / `generateId` が undefined）を確かめる。`vi.mock('astro/loaders')` が `getViteConfig` の下で効かない場合は、その出力を報告に貼り、`content.config.ts` の `glob` 呼び出しのオプションを検査する別の方法（例: photos の `glob()` のオプションを `export const photosLoaderOptions` として切り出し、テストはそれを import する）に切り替えてよい。

- [ ] **Step 3: 実装**

`src/lib/photo-meta.ts`（`toSlug` の前に置く）:

```ts
/**
 * 写真データファイルの glob の entry（`<slug>.yaml`）→ コレクションの id。
 * Astro の既定の id 生成は `.` を消し大文字を小文字にするので、spec の「ファイル名を slug とする」から
 * ずれる（`kamo-river-v1.2.yaml` → `kamo-river-v12`）。拡張子だけを除く（design D2）
 */
export function photoIdFromEntry(entry: string): string {
  return entry.replace(/\.yaml$/, '');
}
```

`src/content.config.ts`:

```ts
import { photoIdFromEntry } from './lib/photo-meta';
// …
const photos = defineCollection({
  loader: glob({
    pattern: '*.yaml',
    base: './src/content/photos',
    generateId: ({ entry }) => photoIdFromEntry(entry),
  }),
  schema: photoSchema,
});
```

- [ ] **Step 4: 単体テストが緑になることを確かめる**

`pnpm exec vitest run tests/unit/photo-meta.test.ts tests/unit/content-config.test.ts` → PASS

- [ ] **Step 5: `.` を含む slug の写真ページがビルド・配信できることを確かめ、実測の YAML を消す**

```sh
# (1) 検証では落ちない（落ちるなら画像の取得の段階であること）
pnpm build 2>&1 | grep -E '内容に問題がある|kamo-river' | head
rm src/content/photos/kamo-river-v1.2.yaml
git status --short   # 実測の YAML が残っていないこと
# (2) . を含むディレクトリの静的配信
pnpm build
mkdir -p dist/ja/photos/kamo-river-v1.2 && cp dist/ja/photos/kariya-ferris-wheel/index.html dist/ja/photos/kamo-river-v1.2/
pnpm exec astro preview --port 4398 --host 127.0.0.1 --background
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:4398/portfolio/ja/photos/kamo-river-v1.2/
pnpm exec astro preview stop
pnpm build   # 手で置いたディレクトリを dist から消す
```

Expected: (1) `photos の内容に問題がある` が出ない（出るのは画像の取得の失敗）、(2) `200`。4398 が塞がっていれば別の空きポートを使う（4399 と 4321 は使わない）。Astro が `getStaticPaths` の `.` を含む `slug` からページを出すこと自体は、Task 2 の範囲では実データに `.` を含む写真が無いので確かめない（tasks.md の「提案」に「実データで `.` を含む slug を入稿したときに 1 度確かめる」と書く）。

- [ ] **Step 6: `tests/e2e/paths.ts` を合わせる（F15）**

`photoSlugs` を `photoIdFromEntry` で作り、`export` を外す（`paths.ts` の中の `pagePaths` だけが使う）。コメントを「写真の slug（= コレクションの id = `photoIdFromEntry` でファイル名から拡張子を除いたもの）」に直す。

```ts
import { photoIdFromEntry } from '../../src/lib/photo-meta';
// …
/** 写真の slug（= コレクションの id。src/content.config.ts と同じ photoIdFromEntry で導く） */
const photoSlugs = readdirSync(photosDir)
  .filter((name) => name.endsWith('.yaml'))
  .map(photoIdFromEntry)
  .sort();
```

Playwright から `src/lib/photo-meta.ts`（→ `validate.ts` → `schemas.ts` → `astro/zod`）を import できない場合は、元の `slice` のまま残してコメントに `photoIdFromEntry` と同じ規則であることを書く。どちらにしたかを報告に書く。

- [ ] **Step 7: 全体を回してコミット**

```sh
pnpm test && pnpm lint && pnpm typecheck && pnpm build && pnpm e2e
git add src/lib/photo-meta.ts src/content.config.ts tests/unit/photo-meta.test.ts tests/unit/content-config.test.ts tests/e2e/paths.ts openspec/changes/followup-minors-2/tasks.md
git commit -m "fix: 写真の id をファイル名そのものにし、. や大文字を含む slug でもビルドを通す"
```

e2e は既存の 2 枚のページが 200 を返すこと（id が変わらないこと。design Risks）の証拠になる。

---

### Task 3: 写真 0 枚でビルドを落とし、代表写真の取得を 1 か所に（tasks.md 2.2、design D3）

**Files:**
- Modify: `src/lib/validate.ts:11`（早期 return を消す）
- Modify: `src/lib/content.ts`（`getFeaturedPhoto` を追加）
- Modify: `src/layouts/BaseLayout.astro:36-38`、`src/pages/[lang]/index.astro:20-22`（到達しない throw を消し `getFeaturedPhoto` を使う）
- Test: `tests/unit/validate.test.ts:29-31`、`tests/unit/content.test.ts`

**Interfaces:**
- Consumes: なし
- Produces: `export async function getFeaturedPhoto(): Promise<PhotoEntry>`（`src/lib/content.ts`）。Task 12 が `index.astro` の同じ場所を触るので、名前を変えない

- [ ] **Step 1: 赤のテストを書く**

`tests/unit/validate.test.ts:29` の既存テストを spec delta に合わせて置き換える（Global Constraints の例外。コミットメッセージに「spec delta（content-schema「写真が 0 枚」）で期待値が変わった」と書く）:

```ts
it('写真が 0 枚なら代表写真が無いことを報告する', () => {
  expect(validatePhotos([])).toEqual(['featured はちょうど 1 枚にする（現在 0 枚: なし）']);
});
```

`tests/unit/content.test.ts` に配線の番人を足す。`getCollection` のモックをテストから差し替えられるようにする（裁定 R-a）:

```ts
const photoEntries = vi.hoisted(() => ({ list: [] as { id: string; data: unknown }[] }));
// vi.mock の getCollection を次に変える
getCollection: vi.fn(async () => photoEntries.list),
// …
import { getCareer, getPhotos } from '../../src/lib/content';

describe('getPhotos の検証の配線', () => {
  it('写真が 0 枚ならビルドを止め、代表写真が無いことを示す', async () => {
    photoEntries.list = [];
    await expect(getPhotos()).rejects.toThrow(/photos の内容に問題がある[\s\S]*featured[\s\S]*0 枚/);
  });
});
```

`pnpm exec vitest run tests/unit/validate.test.ts tests/unit/content.test.ts` で 2 件が赤であることを確かめる。

- [ ] **Step 2: 早期 return を消す**

`src/lib/validate.ts` の `if (entries.length === 0) return [];` と直後の空行を消す。関数の JSDoc に「0 枚も featured の不足として報告する（spec content-schema）」を足す。

- [ ] **Step 3: `getFeaturedPhoto` を置き、呼び出し側の throw を消す**

`src/lib/content.ts`（`getPhotos` の後）:

```ts
/** 代表写真。getPhotos の検証が「ちょうど 1 枚」を保証するので、写真が 0 枚ならそこで止まる */
export async function getFeaturedPhoto(): Promise<PhotoEntry> {
  const featured = (await getPhotos()).find((p) => p.data.featured);
  if (!featured) throw new Error('到達しない: 検証を通った写真に featured が無い');
  return featured;
}
```

`BaseLayout.astro`: import を `getFeaturedPhoto, getProfile` にし、

```ts
if (pathLocale) {
  const featured = await getFeaturedPhoto();
  const img = await getImage({ /* 既存のまま */ });
```

`index.astro`: import を `getFeaturedPhoto, getProfile` にし、20-22 行を `const featured = await getFeaturedPhoto();` の 1 行にする（直前のコメントも消す）。導線の JSX には触らない。

- [ ] **Step 4: 緑と、見た目が変わらないことを確かめる**

```sh
pnpm exec vitest run tests/unit/validate.test.ts tests/unit/content.test.ts   # PASS
```

`git stash` は使わない（worktree 間で共有される）。見た目の比較は次の手順で行う: 変更前のコミット（Step 1 に入る前）で `pnpm build && cp -R dist $S/fm2-t3-before`（`$S` は scratchpad）、変更後に `pnpm build && diff -r $S/fm2-t3-before dist` → 差分なし（画像のファイル名がハッシュで変わる場合はその行だけであることを示す）。

- [ ] **Step 5: 全体を回してコミット**

```sh
pnpm test && pnpm lint && pnpm typecheck && pnpm build
git add src/lib/validate.ts src/lib/content.ts src/layouts/BaseLayout.astro 'src/pages/[lang]/index.astro' tests/unit/validate.test.ts tests/unit/content.test.ts openspec/changes/followup-minors-2/tasks.md
git commit -m "fix: 写真 0 枚でビルドを落とし、代表写真の取得を getFeaturedPhoto にまとめる"
```

---

### Task 4: 入稿コマンドの中断を 1 行に揃える（tasks.md 2.3、2.4、2.5、design D5）

**Files:**
- Modify: `scripts/photo-add.ts`（exifr・sharp を try で包む、login の先頭行）
- Modify: `src/lib/photo-meta.ts`（`ghFailureMessage` の `message` を先頭行に）
- Test: `tests/unit/photo-add-cli.test.ts`、`tests/unit/photo-meta.test.ts`

**Interfaces:** なし（CLI の出力だけ）

tasks.md の 3 項目を **この順に 1 コミットずつ**行う（2.5 のテスト基盤を先に入れると 2.3 の赤が取りやすいので、2.5 → 2.3 → 2.4 の順でもよい。その場合もチェックは項目ごと）。

- [ ] **Step 1（2.5 / F9）: テスト基盤を直す**

`runPhotoAdd` を次の形にする。PATH は偽の `gh` のディレクトリだけにし（本物の `gh` に落ちない）、作った一時ディレクトリは `afterAll` で消す。入稿するファイルの中身と偽の `gh` の出力を差し替えられるようにする:

```ts
import { rmSync } from 'node:fs';
import { afterAll } from 'vitest';

const dirs: string[] = [];
afterAll(() => {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true });
});

function runPhotoAdd(
  args: string[],
  { file = '', login = 'joe-yama' }: { file?: string | Buffer; login?: string } = {},
) {
  const dir = mkdtempSync(join(tmpdir(), 'photo-add-cli-'));
  dirs.push(dir);
  const ghLog = join(dir, 'gh.log');
  const gh = join(dir, 'gh');
  writeFileSync(gh, `#!/bin/sh\necho "$*" >> "${ghLog}"\nprintf '%s\\n' ${JSON.stringify(login)}\n`);
  chmodSync(gh, 0o755);
  writeFileSync(join(dir, 'x.jpg'), file);
  const result = spawnSync(process.execPath, [SCRIPT, ...args], {
    cwd: dir,
    encoding: 'utf8',
    env: { ...process.env, PATH: dir },
  });
  return {
    status: result.status,
    lines: result.stderr.trim().split('\n'),
    stderr: result.stderr,
    ghCalls: existsSync(ghLog) ? readFileSync(ghLog, 'utf8').trim().split('\n') : [],
  };
}
```

既存テストの `r.ghCalled` は `r.ghCalls` が空であること（`expect(r.ghCalls).toEqual([])`）に置き換える（意味は同じで、前より厳しい）。`it.each(['../../x', 'kamo-river.'])` に `'a/b'` を足す。`printf '%s\n' <login>` の複数行は `login` に `\n` を含めれば出る（Step 3 で使う）。`pnpm exec vitest run tests/unit/photo-add-cli.test.ts` が緑で、`ls $TMPDIR | grep photo-add-cli-` の数がテストの前後で増えないことを確かめてコミット（`test: photo-add-cli のテストを本物の gh から切り離し、一時ディレクトリを片付ける`）。

- [ ] **Step 2（2.3 / H-A2 + F10）: 画像として読めないファイル — 赤**

```ts
import sharp from 'sharp';

describe('pnpm photo:add の画像の読み取り', () => {
  it('画像でないファイルは 1 行で中断し、読み取り部品の内部情報を出さず、Release に触れない', () => {
    const r = runPhotoAdd(['x.jpg'], { file: 'hello\n' });
    expect(r.status).toBe(1);
    expect(r.lines).toEqual([expect.stringMatching(/^photo:add: 画像として読めない: x\.jpg$/)]);
    expect(r.stderr).not.toMatch(/^\s+at /m);
    expect(r.stderr).not.toMatch(/exifr|sharp|node_modules/);
    expect(r.ghCalls).toEqual(['api user --jq .login']);
  });

  it('レンズ情報を持たない JPEG は「レンズ」を挙げて 1 行で中断する', async () => {
    const jpeg = await sharp({
      create: { width: 8, height: 8, channels: 3, background: '#888888' },
    })
      .jpeg()
      .toBuffer();
    const r = runPhotoAdd(['x.jpg'], { file: jpeg });
    expect(r.status).toBe(1);
    expect(r.lines).toHaveLength(1);
    expect(r.lines[0]).toMatch(/^photo:add: 撮影情報を読み取れない項目がある: .*レンズ/);
    expect(r.ghCalls).toEqual(['api user --jq .login']);
  });
});
```

1 件目が赤（exifr の `Unknown file format` がスタックとソースの抜粋付きで出る）、2 件目は現状でも緑（spec の Scenario「撮影情報が欠けている」の固定）であることを確かめる。2 件目が赤なら、その出力を報告に貼って止まらずに原因を調べる（EXIF を 1 つも持たない JPEG で `exifr.parse` が `undefined` を返し `{}` に合流するはず）。

- [ ] **Step 3（2.3）: 緑**

`scripts/photo-add.ts` の EXIF の読み取りと縮小を包む:

```ts
const unreadable = () => die(`画像として読めない: ${file}`);

let raw: Record<string, unknown>;
try {
  raw = (await exifr.parse(await readFile(file), { translateValues: false })) ?? {};
} catch {
  unreadable();
}
// …（exifToPhotoMeta はそのまま）
let info: sharp.OutputInfo;
try {
  info = await sharp(file)
    .rotate()
    .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
    .toColorspace('srgb')
    .jpeg({ quality: 90 })
    .toFile(jpeg);
} catch {
  unreadable();
}
```

既存のコメント（exifr@7.1.3 の fstat の件、`?? {}` の理由）は残す。`unreadable` のような 1 か所だけの補助が冗長なら `die(...)` を 2 か所に直接書いてよい。緑を確かめ、`pnpm typecheck` も通してコミット（`fix: 画像として読めないファイルの入稿を 1 行で中断する`）。

- [ ] **Step 4（2.4 / F11）: gh の失敗理由を 1 行に — 赤**

`tests/unit/photo-meta.test.ts` の `ghFailureMessage` の describe に追加:

```ts
it('stderr が空白だけで message が複数行なら、message の先頭行だけを返す', () => {
  const error = { status: 1, stderr: '  \n', message: 'Command failed: gh api user\nboom' };
  expect(ghFailureMessage(error)).toBe('Command failed: gh api user');
});
```

`tests/unit/photo-add-cli.test.ts` に追加:

```ts
it('gh のアカウント名が複数行でも、中断の理由は 1 行になる', () => {
  const r = runPhotoAdd(['x.jpg'], { login: 'someone\nextra' });
  expect(r.status).toBe(1);
  expect(r.lines).toHaveLength(1);
  expect(r.lines[0]).toMatch(/^photo:add: gh のアカウントが joe-yama ではない（someone）/);
});
```

両方が赤であることを確かめる。

- [ ] **Step 5（2.4）: 緑**

`src/lib/photo-meta.ts` の `ghFailureMessage` の最後の行を `return typeof message === 'string' ? message.split('\n')[0] : String(error);` に、JSDoc に「stderr が空なら message の先頭行」を足す。`scripts/photo-add.ts` の login を `const login = gh(['api', 'user', '--jq', '.login']).split('\n')[0];` にする。緑を確かめてコミット（`fix: gh の失敗理由とアカウント名を必ず 1 行で出す`）。

- [ ] **Step 6: 全体**

`pnpm test && pnpm lint && pnpm typecheck` の出力を報告に貼る。

---

### Task 5: 経歴の検証を 1 回にまとめる（tasks.md 2.6、design D4）

**Files:**
- Modify: `src/lib/content.ts:17-24`
- Test: `tests/unit/content.test.ts`

**Interfaces:**
- Consumes: Task 3 で変えた `tests/unit/content.test.ts` のモック（`photoEntries`）
- Produces: `getCareer` の例外の先頭は `career の内容に問題がある:` になり、各行は `ja: ` / `en: ` / 接頭辞なし（parity）で始まる

- [ ] **Step 1: 赤のテストを書く**

`tests/unit/content.test.ts` の `getCareer` の describe に追加:

```ts
it('ja と en の両方にエラーがあれば、1 つの例外に両方が出る', async () => {
  entries.ja = career([patent('JP6549500B2'), patent('JP6549500B2')]);
  entries.en = career([patent('JP7200645B2'), patent('JP7200645B2')]);
  const error = await getCareer('ja').catch((e: unknown) => e);
  expect(error).toBeInstanceOf(Error);
  expect((error as Error).message).toContain('ja: number が重複している（number: JP6549500B2）');
  expect((error as Error).message).toContain('en: number が重複している（number: JP7200645B2）');
});

it('整合したデータなら日本語のデータも返す', async () => {
  await expect(getCareer('ja')).resolves.toBe(entries.ja);
});

// 41〜90 文字の title は ja の上限（40）を超え、en の上限（90）には収まる。
// 検証に渡すロケールを入れ替えると、この 2 件の結果が逆になる
it('日本語のデータは日本語の上限で検証する', async () => {
  entries.ja = career([{ ...patent('JP6549500B2'), title: 'あ'.repeat(41) }, patent('JP7200645B2')]);
  await expect(getCareer('ja')).rejects.toThrow(/ja: title が長すぎる/);
});

it('英語のデータは英語の上限で検証する', async () => {
  entries.en = career([{ ...patent('JP6549500B2'), title: 'a'.repeat(41) }, patent('JP7200645B2')]);
  await expect(getCareer('en')).resolves.toBe(entries.en);
});
```

既存の 2 件の正規表現 `/career\/ja[\s\S]*JP6549500B2/`、`/career\/en[\s\S]*JP6549500B2/` を `/career の内容に問題がある[\s\S]*ja: number が重複している（number: JP6549500B2）/`（en も同様）に変える（Global Constraints の例外。コミットメッセージに書く）。1 件目が赤（ja の例外で止まり en が出ない）、既存 2 件が赤（subject が `career/ja`）であることを確かめる。

- [ ] **Step 2: 緑**

```ts
export async function getCareer(lang: Locale): Promise<Career> {
  const [ja, en] = await Promise.all([getEntry('career', 'ja'), getEntry('career', 'en')]);
  if (!ja || !en) throw new Error('career/ja.yaml と career/en.yaml の両方が必要');
  // 1 回にまとめて投げる。言語ごとに投げると ja のエラーが en のエラーを隠す（design D4）
  assertValid(
    [
      ...validateCareerParity(ja.data, en.data),
      ...validateCareerPatents(ja.data, 'ja'),
      ...validateCareerPatents(en.data, 'en'),
    ],
    'career',
  );
  return lang === 'ja' ? ja.data : en.data;
}
```

- [ ] **Step 3: content.test の整理（挙動不変）**

- `getEntry` のモックの `data === undefined ? undefined : { id, data }` は、`beforeEach` が両方を必ず入れるので通らない。`({ id, data: entries[id] })` にし、`entries` の型を `Record<'ja' | 'en', Career>`（`vi.hoisted(() => ({}) as Record<…>)`）にする
- 自前の `type Patent = Career['patents'][number]` を `import type { Career, Patent } from '../../src/content/schemas'` に置き換える
- `getCollection` のモックは消さない（裁定 R-a）

- [ ] **Step 4: 全体を回してコミット**

```sh
pnpm exec vitest run tests/unit/content.test.ts && pnpm test && pnpm lint && pnpm typecheck && pnpm build
git commit -m "fix: 経歴の検証を 1 回にまとめ、ja のエラーが en のエラーを隠さないようにする"
```

---

### Task 6: theme の色の桁数を揃える（tasks.md 2.7、H-C1）

**Files:**
- Modify: `src/lib/theme.ts:40`（抽出の正規表現）
- Test: `tests/unit/theme.test.ts`

- [ ] **Step 1: 赤**

```ts
it('3 桁や 8 桁の色は抽出しない（輝度計算が 6 桁だけを扱うため）', () => {
  const css = (bg: string) =>
    `:root { --bg: ${bg}; --fg: #111111; --fg-muted: #5c5c5c; --line: #8f8f8f; }
@media (prefers-color-scheme: dark) { :root { --bg: #0c0c0c; --fg: #e8e8e8; --fg-muted: #9a9a9a; --line: #606060; } }`;
  expect(() => readTokens(css('#fff'))).toThrow(/--bg が無い/);
  expect(() => readTokens(css('#fafafa80'))).toThrow(/--bg が無い/);
  expect(readTokens(css('#fafafa')).light.bg).toBe('#fafafa');
});
```

現状は `#fff` を受けて例外を投げないので赤。

- [ ] **Step 2: 緑**

`parseTokens` の正規表現を `` `--${cssName}:\\s*(#[0-9a-fA-F]{6})(?![0-9a-fA-F])` `` にする。`relativeLuminance` の検査はそのまま残す（`contrast` は外から任意の文字列を受ける）。`pnpm test` 緑でコミット（`fix: theme の色の抽出を輝度計算と同じ 6 桁に揃える`）。

---

### Task 7: 単体テストの番人の穴（tasks.md 3.1、3.2、3.4）

**Files:**
- Test: `tests/unit/schemas.test.ts`、`tests/unit/validate.test.ts`、`tests/unit/i18n.test.ts`

実装は変えない。3 項目を 1 コミットずつ。各項目で、足した検査が狙いの変異で赤になることを隔離複製で 1 回ずつ確かめ、報告に貼る（Task 13 の一覧に載せる）。

- [ ] **Step 1（3.1 / F7 + H-C3）: schemas.test**
  - `takenAt`（`photoSchema`）と資格の `date`（`careerSchema` の `certifications[0].date`。`datePrecision`）の両方で、`0050-02-29` と `0001-02-29` を拒否する `it.each` を足す（年 0050 と 0001 は閏年でない）。変異: `isCalendarDate` を `new Date(Date.UTC(y, m - 1, d))` で組み立てる形に戻す → 0050 が 1950 年扱いになり、…と実際に赤になるかを確かめる。赤にならなければ、赤になる日付（例: `0100-02-29` は対象外なので使わない。`0004-02-30` など）を探して報告する
  - 年 `0000` の扱いを固定する: 現状は正規表現 `\d{4}` が受け、先発グレゴリオ暦で 0 年は閏年なので `0000-02-29` は受け付ける。「`0000-02-29` は受け付け、`0000-02-30` は拒否する」を 1 テストにし、コメントに「年 0000 を拒むかは spec に無い。現状の挙動を固定する」と書く
  - 「実データの takenAt」のクォート検査を `/^["']/.test(match?.[1].trim() ?? '')` にし、単一引用符でも通るようにする
- [ ] **Step 2（3.2 / F5 + F8 + P2 + F4）: validate.test**
  - `patent()`（333 行付近の describe の中）を describe の外（ファイルの上の方）に出し、`validateCareerParity` の describe にある特許のリテラル 7 か所（116 行付近の `base.patents`、235〜330 行の各テスト）を `patent({ … })` で書き直す。書き直し後もテストの件数と期待値が同じであること
  - 公報番号の重複のエラーが `ja: ` / `en: ` で始まることを確かめる（既存の重複テストの `toContain` を `toMatch(/^ja: number が重複/)` 相当に強める。421 行付近）
  - `INDEXED_KEYS` のキーをまたいだエラーの順（certifications → achievements → patents）を固定する: 3 つすべての比較キーが日英で違う入力で `toEqual([...3 行])` を見る
  - patents の件数差のテスト（146 行付近）の `e.includes('1') && e.includes('0')` を、完全な文言 `'patents の件数が日英で違う（ja: 1, en: 0）'` との一致に強める
- [ ] **Step 3（3.4 / H-D1）: i18n.test**
  - describe「normalizeBase（stripBase 経由で観測する両端トリム）」の中身が `withBase` を呼んでいる。describe 名どおり `stripBase('/portfolio/en/', base)` が `'/en/'` を返すことを、`['portfolio', '/portfolio', 'portfolio/', '/portfolio/']` の各 base で確かめる形にする。`withBase` の検査が別の describe に無くなるなら、`withBase` の側は残して describe を 2 つに分ける（検査を減らさない）

---

### Task 8: e2e の特許・hreflang の番人（tasks.md 3.3、F3 + P4 + H-D3 + F14）

**Files:**
- Test: `tests/e2e/pages.spec.ts`

- [ ] **Step 1: `parsePatents` を直し、`url` と `title` も読む**
  - `PatentSummary` に `url: string; title: string` を足し、`    url: (.+)$` と `    title: (.+)$` を読む（計画作成時の実測 4: クォートなし）
  - 区画の終わりの判定を「行頭が空白でない、かつ `#` で始まらない行」にする（行頭の YAML コメントで区画を終えない）。`line.startsWith('patents:')` を `/^patents:\s*$/.test(line)` にする（`patentsX:` に一致しない）
  - 言語ごとに読む: `const patentsByLang = { ja: parsePatents('src/content/career/ja.yaml'), en: parsePatents(…/en.yaml) }`。既存の `patents` は `patentsByLang.ja` を指すようにする
- [ ] **Step 2: 特許リンクの `href` と文字列が YAML と一致することを日英で確かめる**

```ts
for (const lang of locales) {
  test(`/${lang}/career/ の特許リンクの href と文字列が YAML の url と title に一致する`, async ({ page }) => {
    await page.goto(`./${lang}/career/`);
    const links = await patentsSection(page, lang)
      .locator('li')
      .evaluateAll((lis) =>
        lis.map((li) => ({
          number: li.querySelectorAll('span')[1]?.textContent?.trim() ?? '',
          href: li.querySelector('a')?.getAttribute('href') ?? '',
          title: li.querySelector('a')?.textContent?.trim() ?? '',
        })),
      );
    const expected = patentsByLang[lang].map(({ number, url, title }) => ({ number, href: url, title }));
    expect(links.toSorted((a, b) => a.number.localeCompare(b.number))).toEqual(
      expected.toSorted((a, b) => a.number.localeCompare(b.number)),
    );
  });
}
```

変異 (g)（`ja.yaml` の特許 1 件の `url` を別の項目の `url` に入れ替える）で赤になることを隔離複製の e2e で確かめる。

- [ ] **Step 3: hreflang を完全一致で確かめる**

`${path} が表示され lang と hreflang が正しい` の `toMatch(/^https:…\/ja\//)` 2 行を、期待する URL の完全一致にする。`path` は `ja/...` または `en/...` なので:

```ts
const rest = path.slice(3); // 'ja/career/' → 'career/'
expect(hreflangHrefs).toEqual({
  ja: `https://joe-yama.github.io/portfolio/ja/${rest}`,
  en: `https://joe-yama.github.io/portfolio/en/${rest}`,
  'x-default': `https://joe-yama.github.io/portfolio/ja/${rest}`,
});
```

（`toHaveCount(3)` は残す。）変異 (h)（`src/lib/site.ts` の `alternateLinks` が出す hreflang の `ja` を `ja-JP` にする）で赤になることを隔離複製で確かめる。`site.ts` は触らないファイルだが、隔離複製の中の変異は対象外。

- [ ] **Step 4: 細部**
  - `expect(hasTie).toBe(true)` に理由を付ける: `expect(hasTie, '国数が同じで出願年月が違う組が無いと、タイブレークを確かめられない').toBe(true)`
  - `const locales = ['ja', 'en'] as const;` を消し、`import { locales } from '../../src/lib/i18n';` にする（`(typeof locales)[number]` の型注釈は `Locale` の import に置き換えてよい）
  - `description ?? ''` を整理する: 直前で `description` が `null` なら `throw new Error(`${path} に description が無い`)` にして、`toHaveAttribute('content', description)` にする
- [ ] **Step 5**: `pnpm e2e` が緑（件数が増えたことを示す）、`pnpm lint && pnpm typecheck` を通してコミット

---

### Task 9: 実装の品質改善（tasks.md 4.1〜4.4、挙動不変）

**Files:**
- Modify: `src/pages/[lang]/career.astro`、`src/lib/career.ts`、`src/lib/validate.ts`（冒頭コメント）、`src/content/schemas.ts`
- Test: `tests/unit/career.test.ts`、`tests/unit/theme.test.ts`、`tests/unit/schemas.test.ts`

項目ごとに 1 コミット。各コミットの前に `pnpm test && pnpm typecheck` を、`.astro` を触る 4.1 は `dist/{ja,en}/career/index.html` の変更前後の diff（空であること）を示す。

- [ ] **4.1（F1）**: `career.astro` で `const morePatents = ui[lang].morePatents;` を `present` の隣に置き、`{morePatents(patentsRest.length)}` にする。`.org` を `<b>` にする件は任意: `<p class="org">` / `<span class="org">` を `<b>` に変えると、`p` が `b` になり**ブロック要素でなくなる**ので、`<p class="org">` の側は変えない。`<span class="org">` だけを `<b>` にし、`.org` の CSS が `p.org` 用に残ることを確かめる。計算済みスタイル（`font-weight: 600` vs `<b>` の既定 `bold` = 700）が変わるので、**`font-weight` が同じにならないなら 4.1 のこの部分はやらず、tasks.md の「提案」に理由を書く**
- [ ] **4.2（F2 + D5 + H-D2）**: `src/lib/career.ts` に `const desc = (a: string, b: string) => (b > a ? 1 : b < a ? -1 : 0);` を置き、`sortExperience`・`sortByDateDesc`・`sortPatents` の 3 か所の三項演算を `desc(a.from, b.from)` などにする。`formatDate` の `...(hasDay(date) ? { day: 'numeric' } : {})` を `day: hasDay(date) ? 'numeric' : undefined` にする（`Intl.DateTimeFormat` は `undefined` を指定なしと扱う。ja と en の既存テストが通ること）。`splitPatents` の戻り値の型を `Record<'head' | 'rest', Career['patents']>` にする。`career.test.ts` の自前の `Patent` 型を `import type { Patent }` に、`hasDay` の describe で `formatDate` の検査と重複している部分（182〜188 行付近）を `hasDay` の真偽だけにし、TZ の describe（217 行以降）に TZ と関係ないテストが紛れていれば元の describe に戻す
- [ ] **4.3（F18）**: `src/lib/validate.ts` 冒頭の「Task 5 の photo-meta.ts が…（計画の落とし穴 5）」のコメントを、「photo-meta.ts（入稿コマンドが node で直接実行する経路）がこのファイルを import する。Node の ESM 解決は拡張子を補わないので、相対 import に .ts を付ける」に直す
- [ ] **4.4（H-C4）**: `schemas.ts` の `isoDate` と `datePrecision` の refine を 1 つにする:

```ts
/** `YYYY-MM-DD` なら暦に実在する日か。`YYYY-MM` は月の範囲を正規表現が保証済みなので常に true */
const existsOnCalendar = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return d === undefined || isCalendarDate(y, m, d);
};
```

両方の `.refine(existsOnCalendar, '暦に存在しない日')` にする。`theme.test.ts` の `cases` の `name` 列を消し、`it.each` のタイトルを `'$theme の $key / bg は $min 以上'` にする。`schemas.test.ts` で enum（`kind`）の拒否を言い換えただけの重複テスト（160 行と 204 行付近）があれば 1 つの `it.each` にまとめる。どれも畳む前後で同じ変異が赤になることを Task 13 で確かめるので、畳んだテストの名前を報告に列挙する

---

### Task 10: e2e の基盤の整理（tasks.md 5.1〜5.3、挙動不変）

**Files:**
- Modify: `tests/e2e/global-setup.ts`、`tests/e2e/global-teardown.ts`

項目ごとに 1 コミット。各コミットの後で `pnpm e2e` が緑で、終了後に `pnpm exec astro preview status --json` が「動いていない」を返す（teardown が止めた）ことを示す。

- [ ] **5.1（F13）**: `isPreviewAlreadyRunning` の上に「`astro preview status` は起動の有無によらず exit 0 で終わるので、終了コードではなく `--json` の `message` を見る」を戻す
- [ ] **5.2（F17 + H-D5）**: `global-setup.ts` の `parsePreviewPid` を `export` し、`global-setup.ts` に `export function currentPreviewPid(): number | null`（`status --json` を実行して `parsePreviewPid` に渡す。例外は `null`）を置く。setup の `const pid = parsePreviewPid(statusOutput)` と teardown の自前の `currentPreviewPid` をこれに置き換える。マーカー定数（`STARTED_MARKER`、`RUN_ID_ENV`）は既に setup から export されているので、teardown の import に `currentPreviewPid` を足すだけ
- [ ] **5.3（H-D4）**: `const ROOT = fileURLToPath(new URL('../..', import.meta.url));` を置き、`global-setup.ts` の `pnpm build` と `astro preview …` の `execSync` に `cwd: ROOT` を渡す（`status` / `logs` / teardown の `stop` も同じ `cwd` にする。preview はプロジェクト root ごとのロックなので揃える）。確認: `pnpm --dir <worktree> e2e` を worktree の外の cwd から実行して緑になる（例: `cd /tmp` ではなく `(cd .. && pnpm --dir <worktree の絶対パス> e2e)`）

---

### Task 11: viewport.spec の整理と拡張（tasks.md 6.1〜6.4）

**Files:**
- Test: `tests/e2e/viewport.spec.ts`

項目ごとに 1 コミット。各コミットの後で `pnpm e2e` 緑。

- [ ] **6.1（F16 + C4）**: `const locales = ['ja', 'en'] as const;` を消し `import { locales } from '../../src/lib/i18n';`。`verticalSlug` は直書きのまま残し（裁定 R-b）、コメントに「縦位置かどうかは YAML に無いので slug の一覧から導けない」を足す
- [ ] **6.2（C3）**: 「回帰: 写真の表示比は元画像の縦横比と一致する」を `for (const lang of locales) for (const viewport of [...viewports, { width: 390, height: 844 }])` に広げる（テスト名に lang と寸法を入れる）
- [ ] **6.3（C6）**: `assertPhotoHeightAtLeastFloor` の `floorPx = 192` を、ページの root の font-size から導く: `const floorPx = await locator.evaluate(() => 12 * Number.parseFloat(getComputedStyle(document.documentElement).fontSize));`。比較は `toBeGreaterThanOrEqual(floorPx - 0.5)`（サブピクセル丸めの分）にし、コメントに「1280×400 では下限がちょうど発動するので等号ぎりぎりになる」を書く。変異: `index.astro` の `max(12rem, …)` を `calc(100svh - 27rem)` にすると赤になることを隔離複製で確かめる（Task 13 に載せる）
- [ ] **6.4（C7）**: `waitForImageLoaded` を `await expect.poll(() => locator.evaluate((img) => (img as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);` に、`assertNoHorizontalScroll` を呼び出し側 2 か所の `expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), '…').toBe(true)` に畳む（関数が 1 つの evaluate と 1 つの expect だけなら、畳まずに残してもよい。残す場合は理由を報告に書く）。失敗メッセージのうち複数行の文字列連結（`assertDisplayRatioMatchesNatural`）を 1 行のテンプレート文字列にする

---

### Task 12: 写真表示まわりの ponytail（tasks.md 6.5〜6.7、挙動不変）

**Files:**
- Modify: `src/pages/[lang]/index.astro`（`<style>` の `.hero` / `.art`）、`src/pages/[lang]/photos/[slug].astro`、`src/pages/404.astro`、`src/styles/global.css`、`src/components/PhotoPicture.astro`、`src/lib/photo.ts`
- Test: 既存の `tests/unit/photo.test.ts`、`tests/e2e/viewport.spec.ts`

項目ごとに 1 コミット。各コミットの前後で `pnpm build` の `dist/` の HTML を比べ、CSS の移動（6.7）は該当ページの `.art` の計算済みスタイルが変わらないこと（`margin-bottom: 16px`）を Playwright で示す。

- [ ] **6.5（C5）**: `index.astro` の `--photo-max-height: max(12rem, 100svh - 27rem)` と `[slug].astro` の `max(12rem, 100svh - 18rem)` の上に「写真の高さ上限は svh（アドレスバーが出ている最小の高さ）で決める。dvh にするとスクロールでバーが隠れるたびに写真の高さが変わる」、`global.css` の `min-height: 100dvh` の上に「ページの最低の高さは dvh（今見えている高さ）。フッターを画面の下端に置くためで、再計算されても写真の大きさは変わらない」を足す（コメントだけ）
- [ ] **6.6（H1）**:
  - `PhotoPicture.astro` の prop `eager` を `priority` に改名する（`<Picture priority={priority}>` と一致させる）。呼び出し側は `index.astro` の `<PhotoPicture … eager />` だけ（`grep -rn "eager" src` で確かめる）
  - `widths` の計算の `[...new Set([...preset.widths.filter((w) => w < width), width])]` は、`filter((w) => w < width)` が `width` を含まないので `Set` は不要。`[...preset.widths.filter((w) => w < width), width]` にする
  - `[slug].astro` の `neighbors` の戻り値: `photo.ts` の `neighbors` は `{ prev?: PhotoEntry; next?: PhotoEntry }` を返し、`[slug].astro` はその前に `photos.find` で `photo` を探している。`neighbors` を `{ photo, prev, next }` を返す形にし、`[slug].astro` の `find` と `if (!photo) throw` を消す（`neighbors` は既に見つからなければ throw する）。`tests/unit/photo.test.ts` の `neighbors` のテストは、戻り値に `photo` が加わった分を `toEqual` の期待値に足す（これは期待値の書き換えではなく、戻り値を増やしたことに伴う追加。既存の prev/next の期待値は変えない）
  - `inferRemoteSize` の重複: `PhotoPicture.astro` がコンポーネントの呼び出しごとに `inferRemoteSize(photo.data.image)` を呼ぶ。ギャラリーと個別ページで同じ画像を 2 回読むので、`src/lib/photo.ts` に `export const photoSize = memoize…` のような仕組みを足すのは**やらない**（ponytail に反する）。重複が「同じ関数の中で 2 回呼んでいる」ものでなければ、tasks.md の「提案」に「ビルド時間が問題になったら」として書く。どちらだったかを報告に書く
- [ ] **6.7（H2）**: `index.astro` と `404.astro` の `.art { margin-bottom: 1rem; }` を消し、`global.css` に `.art { margin-bottom: 1rem; }` を 1 つ置く（`404.astro` の `:global(main)` の注意書きのコメントは残す）。`grep -rn '\.art\b\|class="art"' src` で他に使っている所が無いことを確かめる

レビュー単位 6 では UI の実測がある。コントローラーが `pnpm build && pnpm preview` を起動して reviewer に URL を渡す。

---

### Task 13: 変異の確認（tasks.md 7.1、7.2）

**Files:**
- Modify: `openspec/changes/followup-minors-2/tasks.md`（7.1・7.2 のチェックと、結果の表を末尾の「変異の記録」に書く）

隔離複製（上の手順）で、次の変異をそれぞれ新しい `$EXP` に当て、**対照（変異なしで緑）と変異ありで赤の 2 回**を記録する。表の列: 変異 / 当てたファイルと変更 / 赤になったテスト名 / 出力の 1 行。

7.1:
- (a) `src/content.config.ts` の `generateId` の行を消す → `content-config.test.ts`
- (b) `validatePhotos` の冒頭に `if (entries.length === 0) return [];` を戻す → validate.test と content.test の 0 枚
- (c) `scripts/photo-add.ts` の exifr の try/catch を外す → photo-add-cli の「画像でないファイル」
- (d) `ghFailureMessage` の最後を `message` 全体に戻す → photo-meta.test
- (e) `getCareer` を `assertValid` 2 回（ja → en）に戻す → content.test の「両方が出る」
- (f) `getCareer` で `validateCareerPatents(ja.data, 'en')` / `(en.data, 'ja')` に入れ替える → content.test の上限 2 件
- (g) `src/content/career/ja.yaml` の特許 2 件の `url` を入れ替える → pages.spec の「href と文字列が YAML に一致」（e2e）
- (h) `src/lib/site.ts` の hreflang の `ja` を `ja-JP` にする → pages.spec の hreflang（e2e）
- 加えて Task 6 の抽出を `{3,8}` に戻す、Task 7 の各強化の狙いの変異（Task 7 の報告にあるもの）

7.2: Task 9（4.2・4.4）、Task 7（3.2）、Task 11（6.1〜6.4）で畳んだ・整理したテストについて、**整理前のコミット**と**整理後のコミット**の 2 つの複製に同じ変異を当て、どちらも赤になることを記録する。変異は整理したテストが守っている実装の 1 行（例: 4.2 は `sortPatents` の比較の向き、4.4 は `existsOnCalendar` を常に true、6.3 は `max(12rem, …)` を `calc(…)` に）。

e2e の変異はポート 4399 を使うので、作業ツリーで e2e を回していないときに 1 本ずつ行う。最後に `git status --short` が空であることを貼り、tasks.md のチェックだけのコミットにする（`.claude/rules/git.md` の例外）。

---

### Task 14: docs と全コマンド（tasks.md 7.3、7.4）

**Files:**
- Modify: `docs/status.md`（「PO 判断として残っている件」）、`openspec/changes/followup-minors-2/tasks.md`

- [ ] **7.3**: `docs/status.md` の「PO 判断として残っている件」から、Change 9（375×667）の段落を「PO 決定 2026-09-23: 直さない」の 1 行の記録に置き換えて片付け、Change 11（見出し 4 件）の段落を消す。「掲載データの状態」の特許の項に「見出し 4 件を 2026-09-23 に直した（`followup-minors-2`。新しい見出しの出典は `openspec/changes/followup-minors-2/design.md` D1。archive の照合表 `publications.md` は旧い見出しのまま）」を 1 文足す。写真 0 枚でビルドが落ちるようになったことを「掲載データの状態」の写真の項に 1 文足す
- [ ] **7.4**: `pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm build`、`pnpm e2e` を順に実行し、各コマンドの末尾の出力（件数・結果）を報告に貼る。tasks.md の 7.3 と 7.4 にチェックを入れてコミット（`docs: status.md の PO 判断の件を片付ける`）

---

## Self-Review（計画作成時）

- spec coverage: content-schema の「ファイル名に `.` や大文字」→ Task 2、「写真が 0 枚」→ Task 3、photo-pipeline の「画像として読めないファイル」→ Task 4、「撮影情報が欠けている」の固定 → Task 4 Step 2、`gh` の失敗の 1 行 → Task 4 Step 4〜5。design D1〜D6 → Task 1〜5、9〜12。tasks.md の全項目（1.1〜7.4）が Task 一覧の表にある
- 型の一貫性: `photoIdFromEntry(entry: string): string`（Task 2 で定義、Task 2 の paths.ts と content.config.ts が使う）、`getFeaturedPhoto(): Promise<PhotoEntry>`（Task 3 で定義、BaseLayout と index.astro が使う）、`currentPreviewPid(): number | null`（Task 10 で setup に定義、teardown が使う）
- 裁定 R-a・R-b は ledger と Issue に転記する
