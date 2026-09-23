# followup-minors 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Change 7〜11 の申し送りのうち今も有効なものを片付ける。壊れる入力と番人の穴（特許の `url` 必須化、公報番号の重複、`getCareer` の配線、入稿コマンドの 1 行中断、e2e の対象ページと応答ステータス）を塞ぎ、挙動を変えない品質改善をまとめて行う。公開サイトの見た目は変えない。

**Architecture:** 検証は今の置き場所のまま強める。スキーマ（`src/content/schemas.ts`）は 1 件の形、`src/lib/validate.ts` は言語ごと・日英の突き合わせ、`src/lib/content.ts` の `getCareer` がそれを配線する。入稿コマンドは `scripts/photo-add.ts` の `die`（1 行中断）の経路に例外を寄せ、純関数は `src/lib/photo-meta.ts` に置く。e2e の対象ページは `tests/e2e/paths.ts` に集め、写真の slug は `src/content/photos/*.yaml` から導く。

**Tech Stack:** Astro 7（静的出力）、TypeScript（`astro/tsconfigs/strict` + `noUnusedLocals`、`noUncheckedIndexedAccess` は無効）、Zod（`astro/zod`）、Vitest 5（`getViteConfig`）、Playwright 1.63 + axe、Biome 2、pnpm 12、Node 26.8.2（`scripts/photo-add.ts` は node が型を剥がして直接実行する）。依存の追加なし。

**Spec:** `openspec/changes/followup-minors/specs/content-schema/spec.md`、`openspec/changes/followup-minors/specs/profile-and-career/spec.md`、`openspec/changes/followup-minors/specs/photo-pipeline/spec.md`（要求）、`openspec/changes/followup-minors/design.md`（決定 D1〜D6）、`openspec/changes/followup-minors/tasks.md`（タスクとレビュー単位）、`openspec/changes/followup-minors/proposal.md`（含める / 含めない）。Issue #45。

## Global Constraints

- **パッケージマネージャは pnpm のみ**。`npm` / `npx` は使わない。**依存を 1 つも足さない**。`pnpm install` は `--frozen-lockfile` 付きだけ
- **TDD**: 失敗するテストを先に書き、赤を見てから実装する。テストの削除・skip・期待値の書き換えで通さない（`.claude/rules/testing.md`）。例外は spec delta が変えた期待値（Task 2 の「url は任意」）と、design D6 が認める重複テストの削除（Task 1 の 6 件のテスト）だけ
- **挙動不変のタスク（design D6）** は既存のテストが緑のまま通ることを証拠にする。`.astro` を触るタスクは `pnpm build` 前後の `dist/{ja,en}/career/index.html` の diff が空であることも示す
- **1 コミット = 1 Task**。日本語、先頭に種別（`feat:` / `fix:` / `test:` / `refactor:` / `docs:`）。`openspec/changes/followup-minors/tasks.md` の該当項目のチェックを同じコミットに含める。末尾の attribution 行はセッションの指示に従う
- **`git commit` は sandbox 外で実行する**（1Password の SSH 署名）。push はコントローラーの指示があるまでしない
- **触らないファイル**（`icon-refresh` と衝突、または写真表示の設計に関わる。design Context）: `src/pages/[lang]/index.astro`、`src/lib/pixel.ts`、`tests/unit/pixel.test.ts`、`tests/e2e/links.spec.ts`、`src/components/PhotoPicture.astro`、`src/pages/[lang]/photos/[slug].astro`、`tests/e2e/viewport.spec.ts`、`src/layouts/BaseLayout.astro`
- **`tsconfig.json` の `include` は `**/*`** なので、`pnpm typecheck`（astro check）は `tests/` も型検査する。`Patent` の型を変えるとテストのフィクスチャも型エラーになる
- **`validate.ts` と `photo-meta.ts` は node が直接実行する経路に乗る**（`scripts/photo-add.ts` → `photo-meta.ts` → `validate.ts` → `schemas.ts`）。この 3 ファイルの相対 import には `.ts` を付ける（型だけの import も同じ書き方にそろえる）
- **Biome**: シングルクォート、セミコロンあり、行幅 100。フィクスチャに項目を足して 100 を超えたら `pnpm format`
- **e2e はポート 4399 を他の worktree と共有する**。`pnpm e2e` を同時に 2 本回さない（隔離複製の中の e2e も同じ）。実行前に `lsof -i :4399` で空いていることを確かめる
- **`rm -rf` は hook が拒否する**。隔離複製は毎回新しいディレクトリ名で作り、消さない（scratchpad は session 終了で消える）
- **スコープ**: `tasks.md` の項目だけ。気づいた改善は `tasks.md` 末尾の「提案」に書き、実装しない（`.claude/rules/scope.md`）
- **検証コマンド**: `pnpm test` / `pnpm lint` / `pnpm typecheck` / `pnpm build` / `pnpm e2e`。報告には実行したコマンドと出力の抜粋を添える

## 隔離実行の手順（Task 4・8・9・12・13・15 で使う）

作業ツリーを変異させずに番人を確かめる手順。作業ツリーを直接変異させた場合は、必ず `git diff` で変異を取り消したことを確かめ、`git status --short` が空（`?? .worktrees/` 以外）であることを報告に貼る。

```bash
S=/private/tmp/claude-501/-Users-joe-repo-github-personal-joe-yama-portfolio/<session>/scratchpad
P=$S/mut-<名前>            # 毎回新しい名前にする（rm -rf は使えない）
mkdir -p $P
git -C /Users/joe/repo/github-personal/joe-yama/portfolio/.worktrees/followup-minors archive HEAD | tar -x -C $P
pnpm --dir $P install --frozen-lockfile --offline

# 1) 変異なしで緑（対照）
pnpm --dir $P exec vitest run --root $P <テストファイル>
#    出力の `RUN  v5.0.1 <$P の実パス>` の行で、複製を見ていることを確かめる

# 2) 変異を当てる（sed -i '' や Edit で $P の中のファイルだけを変える）

# 3) 変異ありで赤
pnpm --dir $P exec vitest run --root $P <テストファイル>
```

- 変異ありでも緑だった場合は、キャッシュや取り違えを疑い、**変異を当てた状態の新しい複製**（`mut-<名前>-2`）を作って最初から変異入りで install → 実行し直す。それでも緑なら番人が効いていないので、テストを直してから再度確かめる
- e2e の変異は `pnpm --dir $P e2e` で回す。`global-setup.ts` が複製の中で `pnpm build` し直すので、ビルドの手間は要らない。複製を見ていることは、変異で足したパスがテスト名に現れること（例: `ja/photos/no-such-photo/ にアクセシビリティ違反が無い`）で確かめる。**ポート 4399 を共有しているので、ほかの e2e と同時に回さない**
- 未コミットの変更を複製に載せたいとき（Task 9 など）は、`git archive HEAD` の複製に変更後のファイルだけを `cp` で上書きする

## 実装前に実物で確認した落とし穴（計画作成時に実測）

1. **`Date.UTC` も年 0〜99 を 1900 年代に読み替える**（`new Date(Date.UTC(50, 1, 28)).toISOString()` → `1950-02-28T00:00:00.000Z`）。tasks.md 1.5 の「`Date.UTC` ベース」をそのまま書くと 0050 年は直らない。UTC で組み立てたうえで `setUTCFullYear(y, m - 1, d)` を使う（`0050-02-28T00:00:00.000Z` になることを実測）。Task 5 のテストは `Date.UTC` で書いた実装を赤にする
2. **`astro:content` の `vi.mock` は効く**（design D3）。計画作成時に隔離複製で実測した: `vi.mock('astro:content', () => ({ getEntry, getCollection }))` を置いたテストで `getCareer` を呼ぶと、変異なしで 2 件緑、`content.ts` から `validateCareerPatents(en.data, 'en')` の行を消すと `AssertionError: promise resolved "{ experience: [], skills: {}, …(3) }" instead of rejecting` で赤。`astro check` も 0 errors。`vitest.config.ts` が `getViteConfig` を使うので `astro:content` は Vite のモジュールとして解決され、`vi.mock` の差し替えが効く
3. **`url` 必須化で型が壊れるテストのフィクスチャ**（`pnpm typecheck` が落ちる）: `tests/unit/validate.test.ts` の 116・229・233・245・249・263・269 行と 276-284 行の `patent()`、`tests/unit/schemas.test.ts` の 113-120 行（`validCareer.patents`、こちらは型ではなく `careerSchema.safeParse` が失敗する）と 211-216 行（`validPatent`）、`tests/unit/career.test.ts` の 86-93 行。career.test.ts は Task 1 でファクトリにしてから `url` を入れる
4. **e2e の `parsePatents` は `url` を読まない**（`number` / `filedAt` / `countries` だけ）。`url` を 1 件消す変異（4.1 (a)）は `pnpm build` がスキーマで落ちるので、e2e まで進まない（`global-setup.ts` の `pnpm build` で止まる）。e2e の「すべての見出しがリンク」（Task 2）は `PatentItem.astro` のマークアップの番人で、データの番人ではない
5. **`pnpm photo:add` はアカウント確認の後で `existsSync(file)` を見る**。未知のオプションと不正な slug の検査を GitHub への問い合わせより前に移しても、ファイルの有無の検査は今の位置（アカウント確認の後）のまま。Task 8 のテストは存在する空のファイルを渡し、今のコードで「gh が呼ばれ、`toSlug` の例外がスタックトレースで出る」経路を赤として見る。計画作成時の実測では、存在しないファイルを渡すと今のコードは `photo:add: ファイルが無い: x.jpg` の 1 行で止まる（gh は呼ばれる）
6. **`parseArgs` の例外の文言は 1 行**（実測）: `Unknown option '--sulg'. To specify a positional argument starting with a '-', place it at the end of the command after '--', as in '-- "--sulg"`（`ERR_PARSE_ARGS_UNKNOWN_OPTION`）、`Option '--slug <value>' argument missing`（`ERR_PARSE_ARGS_INVALID_OPTION_VALUE`）
7. **入稿コマンドは今 cwd に YAML を書く**（実測）。複製の外のディレクトリを cwd にして、偽の `gh` と `sharp` で作った EXIF 付き JPEG で実行すると、`<cwd>/src/content/photos/probe-cwd.yaml` ができ、リポジトリ側には何もできなかった。Task 9 の証拠はこの手順で取る（単体テストにすると作業ツリーの `src/content/photos` と `node_modules/.astro/assets` を書き換えるので置かない。下記 Task 9 の判断）
8. **`TOKEN_NAMES` は厳密には恒等写像ではない**（`fgMuted` → `fg-muted` だけ違う）。Task 6 はキー名からケバブケースを導く形にして写像の表を消す。`readTokens` の戻り値の形（`fgMuted`）は変えない（`tests/unit/theme.test.ts` が固定している）
9. **現データに公報番号の重複は無い**（`grep '^  - number:' src/content/career/{ja,en}.yaml | sort | uniq -d` が空）。Task 3 で `pnpm build` が落ちないことの裏付け

---

## Task 一覧とレビューの単位

| Task | 名前 | tasks.md | レビュー単位 |
|---|---|---|---|
| 1 | 経歴の純関数とページの整理（挙動不変） | 1.7、1.8 | 単位 1（この Task だけでレビュー） |
| 2 | 特許の `url` を必須にし、すべての見出しをリンクにする | 1.1 | 単位 1（この Task だけでレビュー） |
| 3 | 公報番号の重複検出と `lang` の `Locale` 型 | 1.2 | 単位 1（この Task だけでレビュー） |
| 4 | `getCareer` の検証の配線を守る単体テスト | 1.3 | 単位 1（この Task だけでレビュー） |
| 5 | 暦日の検証の年 0001〜0099 の誤判定を直す | 1.5 | 単位 1（この Task だけでレビュー） |
| 6 | 日英比較の表への一本化・`theme.ts`・`ogLocale`（挙動不変） | 1.4、1.6 | 単位 1（この Task だけでレビュー） |
| 7 | `toSlug` が末尾 `.` の slug を拒否する | 2.2 | 単位 2（Task 7〜10 をまとめて 1 回） |
| 8 | 入稿コマンドの引数と slug の誤りを 1 行で中断する | 2.1 | 単位 2 |
| 9 | 入稿コマンドのパスをスクリプト基準にする | 2.3 | 単位 2 |
| 10 | 入稿まわりの ponytail（挙動不変） | 2.4 | 単位 2 |
| 11 | e2e の対象ページを写真データから導く | 3.1 | 単位 3（Task 11〜14 をまとめて 1 回） |
| 12 | a11y / network で応答ステータスを確かめる | 3.2 | 単位 3 |
| 13 | `pages.spec.ts` の整理とタイブレークの検査 | 3.3 | 単位 3 |
| 14 | `global-setup.ts` の簡素化（挙動不変） | 3.4 | 単位 3 |
| 15 | 番人の変異確認と最終検証 | 4.1、4.2 | ブランチ全体のレビュー（1 回）に含める |

実行順は表の順。Task 1 を Task 2 より先に置くのは、career.test.ts のフィクスチャをファクトリにしてから `url` を入れるため（落とし穴 3）。Task 4 は Task 3 の重複検出を使う。Task 8 のテストの `kamo-river.` は Task 7 に依存する。Task 12 は Task 11 の `paths.ts` を使う。

---

### Task 1: 経歴の純関数とページの整理（tasks.md の 1.7・1.8。単位 1、この Task だけでレビュー）

挙動不変（design D6）。既存のテストが緑のまま通り、`dist/{ja,en}/career/index.html` が変わらないことを証拠にする。

**Files:**
- Modify: `src/lib/career.ts`（28-31 行の `sortPatents` の JSDoc、43-46 行の `splitPatents`）
- Modify: `src/pages/[lang]/career.astro`（22-30 行の派生変数、42 行の `ui[lang].present`、108 行の `career.patents.length`）
- Test: `tests/unit/career.test.ts`（1-11 行の import、86-142 行の `patents` フィクスチャ・`sortPatents`・`splitPatents`）
- Modify: `openspec/changes/followup-minors/tasks.md`（1.7・1.8 を `[x]`）

**Interfaces:**
- Consumes: `type Career`（`src/content/schemas.ts`）
- Produces: `splitPatents(patents: Career['patents']): { head: Career['patents']; rest: Career['patents'] }`（ジェネリックを外す。呼び出しは `career.astro` の 1 か所だけ）。`sortPatents` のシグネチャは変えない

- [ ] **Step 1: 変更前の出力を控える**

```bash
S=<scratchpad>
pnpm build
cp dist/ja/career/index.html $S/task1-before-ja.html
cp dist/en/career/index.html $S/task1-before-en.html
```

- [ ] **Step 2: テストのフィクスチャをファクトリにする（テストだけ先に変える）**

`tests/unit/career.test.ts` の import に `import type { Career } from '../../src/content/schemas';` を足し、86-93 行の共有可変配列 `patents` を次に置き換える。`title` と `url` は並び替えに使わないのでファクトリの 1 か所だけに置く（`url` は現時点では任意だが、Task 2 で必須になるので先に入れておく）:

```ts
type Patent = Career['patents'][number];

function patent(number: string, filedAt: string, countries: string[]): Patent {
  return { number, filedAt, countries, title: 't', url: 'https://example.com/' };
}

/** 呼ぶたびに新しい配列を返す（テストどうしで状態を共有しない） */
function patents(): Patent[] {
  return [
    patent('A', '2019-10', ['JP']),
    patent('B', '2021-03', ['JP', 'CN', 'TW']),
    patent('C', '2020-01', ['JP', 'CN']),
    patent('D', '2021-03', ['JP', 'CN']),
    patent('E', '2021-03', ['JP', 'CN']),
    patent('F', '2021-03', ['JP', 'CN']),
  ];
}
```

`describe('sortPatents')` の 4 本は `patents()` を呼ぶ形にする（期待値は変えない）:

```ts
describe('sortPatents', () => {
  it('countries の件数の降順に並べる', () => {
    const [a, b] = patents();
    expect(sortPatents([a, b]).map((p) => p.number)).toEqual(['B', 'A']);
  });

  it('countries の件数が同じなら filedAt の降順に並べる', () => {
    const [, , c, d] = patents();
    expect(sortPatents([c, d]).map((p) => p.number)).toEqual(['D', 'C']);
  });

  it('countries と filedAt が同じなら記述順を保つ（安定ソート）', () => {
    const tied = patents().slice(3);
    expect(sortPatents(tied).map((p) => p.number)).toEqual(['D', 'E', 'F']);
  });

  it('元の配列を破壊しない', () => {
    const input = patents();
    const before = input.map((p) => p.number);
    sortPatents(input);
    expect(input.map((p) => p.number)).toEqual(before);
  });
});
```

`describe('splitPatents')` は数値の配列ではなく特許の配列で呼ぶ。**6 件のテスト（129-133 行）は 12 件のテストと同じ経路（head 5 件・rest が非空）を通る重複なので消す**（design D6。境界の 5 件と、rest の中身まで見る 12 件が残る）:

```ts
describe('splitPatents', () => {
  const items = (n: number) =>
    Array.from({ length: n }, (_, i) => patent(String(i), '2021-03', ['JP']));

  it('4 件なら head に 4 件、rest は空', () => {
    expect(splitPatents(items(4))).toEqual({ head: items(4), rest: [] });
  });

  it('5 件なら head に 5 件、rest は空', () => {
    expect(splitPatents(items(5))).toEqual({ head: items(5), rest: [] });
  });

  it('12 件なら head に先頭 5 件、rest に残り 7 件', () => {
    const result = splitPatents(items(12));
    expect(result.head).toEqual(items(5));
    expect(result.rest).toEqual(items(12).slice(5));
  });
});
```

- [ ] **Step 3: 既存の実装のままテストが緑であることを確かめる**

Run: `pnpm exec vitest run tests/unit/career.test.ts`
Expected: PASS（フィクスチャの形を変えただけなので緑。ここで赤なら書き換えを誤っている）

- [ ] **Step 4: 実装を整理する**

`src/lib/career.ts` の 28-31 行の JSDoc を 1 行にする:

```ts
/** 出願国数の降順、同数なら filedAt の新しい順（どちらも同じなら記述順）に並べた新しい配列を返す */
export function sortPatents(patents: Career['patents']): Career['patents'] {
```

43-46 行のジェネリックを外す:

```ts
/** 先頭 5 件（head）とそれ以降（rest）に分ける。並び替えは呼び出し側の責務 */
export function splitPatents(patents: Career['patents']): {
  head: Career['patents'];
  rest: Career['patents'];
} {
  return { head: patents.slice(0, PATENTS_HEAD_COUNT), rest: patents.slice(PATENTS_HEAD_COUNT) };
}
```

`src/pages/[lang]/career.astro` の frontmatter（22-30 行）で、`present` と並び替えた特許を他の区画と同じ派生変数にする:

```ts
const lang = toLocale(Astro.params.lang);
const career = await getCareer(lang);
const t = ui[lang].careerSections;
const kinds = ui[lang].achievementKind;
const present = ui[lang].present;
const experience = sortExperience(career.experience);
const skillEntries = Object.entries(career.skills);
const certifications = sortByDateDesc(career.certifications);
const achievements = sortByDateDesc(career.achievements);
const patents = sortPatents(career.patents);
const { head: patentsHead, rest: patentsRest } = splitPatents(patents);
```

42 行は `formatPeriod(job.from, job.to, lang, present)`、108 行は `patents.length > 0 && (` にする。それ以外（`ui[lang].morePatents` など）は tasks.md に無いので触らない。

- [ ] **Step 5: 緑と出力の不変を確かめる**

```bash
pnpm lint && pnpm typecheck && pnpm test
pnpm build
diff $S/task1-before-ja.html dist/ja/career/index.html && diff $S/task1-before-en.html dist/en/career/index.html && echo same
```

Expected: すべて緑、`same` が出る

- [ ] **Step 6: コミット**

`tasks.md` の 1.7・1.8 を `[x]` にして:

```bash
git add src/lib/career.ts src/pages/[lang]/career.astro tests/unit/career.test.ts openspec/changes/followup-minors/tasks.md
git commit -m "refactor: 特許の並び替えと分割の型・テストのフィクスチャ・経歴ページの派生変数を整理する"
```

---

### Task 2: 特許の `url` を必須にし、すべての見出しをリンクにする（tasks.md の 1.1。単位 1、この Task だけでレビュー）

spec delta: content-schema「url が欠けている」、profile-and-career「リンクの有無」。design D1。

**Files:**
- Modify: `src/content/schemas.ts:87`（`url: z.url().optional()` → `url: z.url()`）
- Modify: `src/components/PatentItem.astro:21`（三項分岐をやめて常に `<a>`）
- Test: `tests/unit/schemas.test.ts`（113-120 行の `validCareer.patents`、211-216 行の `validPatent`、242-248 行の「url は任意」）
- Test: `tests/unit/validate.test.ts`（116・229・233・245・249・263・269 行、276-284 行の `patent()`）
- Test: `tests/e2e/pages.spec.ts:280-289`（「url を持つ項目の名称だけが…」を置き換える）
- Modify: `docs/content-authoring.md:18`
- Modify: `openspec/changes/followup-minors/tasks.md`（1.1 を `[x]`）

**Interfaces:**
- Consumes: `patentSchema`、`careerSchema`（`src/content/schemas.ts`）
- Produces: `type Patent = { filedAt: string; title: string; number: string; countries: string[]; url: string }`（`url` が必須になる。`Career['patents'][number]` も同じ）

- [ ] **Step 1: 変更前の出力を控える**

```bash
pnpm build
cp dist/ja/career/index.html $S/task2-before-ja.html
cp dist/en/career/index.html $S/task2-before-en.html
```

- [ ] **Step 2: 失敗するテストを書く（スキーマ）**

`tests/unit/schemas.test.ts` の 211-216 行の `validPatent` と 113-120 行の `validCareer.patents[0]` に `url` を足す:

```ts
const validPatent = {
  filedAt: '2021-03',
  title: '発明の名称',
  number: 'JP2021-123456A',
  countries: ['JP', 'CN'],
  url: 'https://patents.google.com/patent/JP2021123456A/ja',
};
```

```ts
  patents: [
    {
      filedAt: '2021-03',
      title: '発明の名称',
      number: 'JP2021-123456A',
      countries: ['JP'],
      url: 'https://patents.google.com/patent/JP2021123456A/ja',
    },
  ],
```

242-248 行の「url は任意」は spec delta（content-schema の「url が欠けている」）で期待値が反転したので、次の 2 本に置き換える:

```ts
  it('url が無ければ失敗する', () => {
    const { url: _omit, ...rest } = validPatent;
    expect(patentSchema.safeParse(rest).success).toBe(false);
  });

  it('url が URL の形でなければ失敗する', () => {
    expect(patentSchema.safeParse({ ...validPatent, url: 'JP2021-123456A' }).success).toBe(false);
  });
```

- [ ] **Step 3: 赤を確かめる**

Run: `pnpm exec vitest run tests/unit/schemas.test.ts`
Expected: FAIL 1 件（`patentSchema > url が無ければ失敗する` が `expected true to be false`）。`url が URL の形でなければ失敗する` は今の `z.url().optional()` でも緑

- [ ] **Step 4: 最小の実装**

`src/content/schemas.ts:82-88`:

```ts
export const patentSchema = z.object({
  filedAt: yearMonth,
  title: nonEmpty,
  number: nonEmpty,
  countries: z.array(nonEmpty).min(1),
  url: z.url(),
});
```

`src/components/PatentItem.astro:21`:

```astro
  <a href={patent.url}>{patent.title}</a>
```

- [ ] **Step 5: 型が壊れたフィクスチャを直す**

Run: `pnpm typecheck`
Expected: `tests/unit/validate.test.ts` の `Career` / `Patent` 型のリテラルで `Property 'url' is missing` が出る。116・229・233・245・249・263・269 行の各特許に `url: 'https://example.com/'` を足し、276-284 行の `patent()` の既定値にも `url: 'https://example.com/'` を足す。行幅 100 を超えたら `pnpm format`

- [ ] **Step 6: 失敗しうる e2e に置き換える**

`tests/e2e/pages.spec.ts:280-289` の「url を持つ項目の名称だけが Google Patents へのリンクになる」は、日英のリンク比較テスト（256-278 行）と同じことを見ている部分が大きく、`url` が必須になった今は「持つ項目だけ」が意味を持たない。「すべての見出しがリンク」の 1 本に置き換える（spec の「リンクの有無」Scenario）:

```ts
  test('すべての特許の見出しが Google Patents へのリンクになる', async ({ page }) => {
    await page.goto('./ja/career/');
    const section = patentsSection(page, 'ja');
    // <details> の中の項目も DOM にはあるので、開かずに全件を数えられる
    const hrefs = await section
      .locator('li a')
      .evaluateAll((ls) => ls.map((l) => l.getAttribute('href') ?? ''));
    expect(hrefs).toHaveLength(patentsTotal);
    for (const href of hrefs) expect(href).toMatch(/^https:\/\/patents\.google\.com\/patent\//);
  });
```

（この段階では `patentsTotal` は既存の `patentsByLang.ja.length`。Task 13 で名前を整理する）

- [ ] **Step 7: 手順書に `url` が必須であることを書く**

`docs/content-authoring.md:18` を次にする:

```markdown
- `number` / `filedAt` / `countries` は日英で同じ値にする。`url` は**必須**（無いとビルドが落ちる）で、**言語ごとに変える**（日本語は `.../ja`、英語は `.../en`。同じ URL を指すと e2e が落ちる）
```

- [ ] **Step 8: 緑と出力の不変を確かめる**

```bash
pnpm lint && pnpm typecheck && pnpm test
pnpm build
diff $S/task2-before-ja.html dist/ja/career/index.html && diff $S/task2-before-en.html dist/en/career/index.html && echo same
pnpm e2e
```

Expected: すべて緑。`same`（現データ 65 件はすべて `url` を持つので HTML は変わらない）。e2e は新しい「すべての特許の見出しが…」を含めて緑

- [ ] **Step 9: コミット**

```bash
git add src/content/schemas.ts src/components/PatentItem.astro tests/unit/schemas.test.ts tests/unit/validate.test.ts tests/e2e/pages.spec.ts docs/content-authoring.md openspec/changes/followup-minors/tasks.md
git commit -m "feat: 特許の url を必須にし、すべての見出しをリンクにする"
```

---

### Task 3: 公報番号の重複検出と `lang` の `Locale` 型（tasks.md の 1.2。単位 1、この Task だけでレビュー）

spec delta: content-schema「公報番号が重複している」。design D2。

**Files:**
- Modify: `src/lib/validate.ts`（1-3 行の import、118-147 行の `PATENT_TITLE_MAX_LENGTH` と `validateCareerPatents`）
- Test: `tests/unit/validate.test.ts`（1-8 行の import、275-347 行の `describe('validateCareerPatents')`）
- Modify: `openspec/changes/followup-minors/tasks.md`（1.2 を `[x]`）

**Interfaces:**
- Consumes: `type Locale`（`src/lib/i18n.ts`、`'ja' | 'en'`）
- Produces: `validateCareerPatents(career: Career, lang: Locale): string[]`。重複のエラーは `${lang}: number が重複している（number: ${number}）`。呼び出し元の `src/lib/content.ts:21-22` は `'ja'` / `'en'` のリテラルを渡しているので変更不要

- [ ] **Step 1: 失敗するテストを書く**

`tests/unit/validate.test.ts` の 1 行目を `import { describe, expect, expectTypeOf, it } from 'vitest';` にし、`import type { Locale } from '../../src/lib/i18n';` を足す。`describe('validateCareerPatents')` の末尾（346 行の後）に:

```ts
  it('lang は Locale だけを受ける（"JA" のような文字列で英語の上限が黙って使われない）', () => {
    expectTypeOf(validateCareerPatents).parameter(1).toEqualTypeOf<Locale>();
  });

  it('同じ言語で number が重複したら、重複した number を含めて 1 件報告する', () => {
    const errors = validateCareerPatents(
      career([patent(), patent({ filedAt: '2019-01', title: 'u' })]),
      'ja',
    );
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('JP6549500B2');
    expect(errors[0]).toContain('重複');
  });

  it('英語のデータでも number の重複を報告する', () => {
    const errors = validateCareerPatents(career([patent(), patent()]), 'en');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('JP6549500B2');
  });

  it('number が違えば重複として報告しない', () => {
    const errors = validateCareerPatents(
      career([patent(), patent({ number: 'JP7200645B2' })]),
      'ja',
    );
    expect(errors).toEqual([]);
  });
```

- [ ] **Step 2: 赤を確かめる**

Run: `pnpm exec vitest run tests/unit/validate.test.ts`
Expected: FAIL 2 件（「同じ言語で number が重複したら…」「英語のデータでも…」が `expected [] to have a length of 1`）。`expectTypeOf` は実行時には何もしない

Run: `pnpm typecheck`
Expected: FAIL（`toEqualTypeOf<Locale>()` が `string` と一致しない型エラー。`tests/unit/validate.test.ts` の該当行）

- [ ] **Step 3: 最小の実装**

`src/lib/validate.ts` の 3 行目の後に:

```ts
import type { Locale } from './i18n.ts';
```

118-147 行:

```ts
/** 見出し（title）の長さの上限（コードポイント単位）。design D12 */
const PATENT_TITLE_MAX_LENGTH: Record<Locale, number> = { ja: 40, en: 90 };

/**
 * 特許の、1 つの言語のデータの中で閉じる検証。日英を比べる validateCareerParity とは別の関数にする（design D8）。
 * - number が重複しないこと
 * - countries の先頭が number の先頭 2 文字（代表公報の国）と一致すること
 * - title の長さが言語ごとの上限（コードポイント単位）を超えないこと
 */
export function validateCareerPatents(career: Career, lang: Locale): string[] {
  const errors: string[] = [];
  const maxLength = PATENT_TITLE_MAX_LENGTH[lang];
  const seen = new Set<string>();

  for (const patent of career.patents) {
    if (seen.has(patent.number)) {
      errors.push(`${lang}: number が重複している（number: ${patent.number}）`);
    }
    seen.add(patent.number);

    const expectedCountry = patent.number.slice(0, 2);
    if (patent.countries[0] !== expectedCountry) {
      errors.push(
        `${lang}: countries の先頭が代表公報の国と違う（number: ${patent.number}, countries[0]: ${patent.countries[0]}）`,
      );
    }

    const length = [...patent.title].length;
    if (length > maxLength) {
      errors.push(
        `${lang}: title が長すぎる（number: ${patent.number}, ${length} 文字、上限 ${maxLength} 文字）`,
      );
    }
  }

  return errors;
}
```

3 件目以降の重複も 1 件ずつ報告される（2 件目で 1 件、3 件目でもう 1 件）。spec は「エラーに重複した number を含める」だけを求めるので、この形で足りる。

- [ ] **Step 4: 緑を確かめる**

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

Expected: すべて緑（現データに重複は無い。落とし穴 9）

- [ ] **Step 5: コミット**

```bash
git add src/lib/validate.ts tests/unit/validate.test.ts openspec/changes/followup-minors/tasks.md
git commit -m "feat: 同じ言語の特許で公報番号が重複したらビルドを失敗させ、lang を Locale 型にする"
```

---

### Task 4: `getCareer` の検証の配線を守る単体テスト（tasks.md の 1.3。単位 1、この Task だけでレビュー）

design D3。**`vi.mock` が効くことは計画作成時に実測済み**（落とし穴 2）。効かなかった場合の扱い（穴を「提案」に記録して進む）は要らない見込みだが、万一この worktree で効かなければ D3 のとおり tasks.md の「提案」に記録し、テストは置かずに 1.3 をチェックする。

**Files:**
- Create: `tests/unit/content.test.ts`
- Modify: `openspec/changes/followup-minors/tasks.md`（1.3 を `[x]`）

**Interfaces:**
- Consumes: `getCareer(lang: Locale): Promise<Career>`（`src/lib/content.ts:17-24`）、`astro:content` の `getEntry` / `getCollection`（`vi.mock` で差し替える）、`type Career`
- Produces: なし（テストだけ）

- [ ] **Step 1: テストを書く**

`tests/unit/content.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Career } from '../../src/content/schemas';

// getCareer がビルドの経路（getEntry → 検証）から検証を外したら落ちる番人（design D3）。
// astro:content を差し替え、日英のデータをテストごとに入れ替える
const entries = vi.hoisted(() => ({}) as Partial<Record<'ja' | 'en', Career>>);

vi.mock('astro:content', () => ({
  getEntry: vi.fn(async (_collection: string, id: 'ja' | 'en') => {
    const data = entries[id];
    return data === undefined ? undefined : { id, data };
  }),
  getCollection: vi.fn(async () => []),
}));

import { getCareer } from '../../src/lib/content';

type Patent = Career['patents'][number];

function patent(number: string): Patent {
  return {
    filedAt: '2021-03',
    title: 't',
    number,
    countries: ['JP'],
    url: 'https://example.com/',
  };
}

function career(patents: Patent[]): Career {
  return { experience: [], skills: {}, certifications: [], achievements: [], patents };
}

describe('getCareer の検証の配線', () => {
  beforeEach(() => {
    entries.ja = career([patent('JP6549500B2'), patent('JP7200645B2')]);
    entries.en = career([patent('JP6549500B2'), patent('JP7200645B2')]);
  });

  it('整合したデータなら要求した言語のデータを返す', async () => {
    await expect(getCareer('en')).resolves.toBe(entries.en);
  });

  it('日本語のデータで公報番号が重複していれば例外を投げる', async () => {
    entries.ja = career([patent('JP6549500B2'), patent('JP6549500B2')]);
    await expect(getCareer('en')).rejects.toThrow(/career\/ja[\s\S]*JP6549500B2/);
  });

  it('英語のデータで公報番号が重複していれば例外を投げる', async () => {
    entries.en = career([patent('JP6549500B2'), patent('JP6549500B2')]);
    await expect(getCareer('ja')).rejects.toThrow(/career\/en[\s\S]*JP6549500B2/);
  });

  it('日英の件数が違えば例外を投げる（validateCareerParity の配線）', async () => {
    entries.en = career([patent('JP6549500B2')]);
    await expect(getCareer('ja')).rejects.toThrow(/career の内容に問題がある[\s\S]*patents/);
  });
});
```

重複のケースで、要求する言語と壊す言語をわざと逆にしている（`getCareer('en')` で日本語側を壊す）。「要求した言語だけ検証する」退行も落とすため。

- [ ] **Step 2: 緑を確かめ、変異で赤を確かめる**

この Task は既存の配線を守るテストなので、変異なしでは最初から緑になる。赤は隔離複製（上記「隔離実行の手順」）で確かめる:

```bash
pnpm exec vitest run tests/unit/content.test.ts          # 作業ツリーで 4 件緑
# 複製 P=$S/mut-task4-ja にテストを含む作業ツリーの状態を載せる（未コミットなので cp で上書き）
cp tests/unit/content.test.ts $P/tests/unit/content.test.ts
pnpm --dir $P exec vitest run --root $P tests/unit/content.test.ts   # 対照: 4 件緑
sed -i '' "/validateCareerPatents(ja.data, 'ja')/d" $P/src/lib/content.ts
pnpm --dir $P exec vitest run --root $P tests/unit/content.test.ts   # 赤: 日本語の重複のテストだけ
```

Expected: 変異ありで「日本語のデータで公報番号が重複していれば…」が `promise resolved … instead of rejecting` で FAIL。英語側の変異（`validateCareerPatents(en.data, 'en')` の行を消す）と `validateCareerParity` の行を消す変異も、それぞれ新しい複製で同じように確かめ、該当する 1 本だけが赤になることを報告する

- [ ] **Step 3: 検証コマンド**

```bash
pnpm lint && pnpm typecheck && pnpm test
```

Expected: すべて緑（`astro check` は `vi.mock` のファクトリも型検査する。計画作成時の試行では 0 errors）

- [ ] **Step 4: コミット**

```bash
git add tests/unit/content.test.ts openspec/changes/followup-minors/tasks.md
git commit -m "test: getCareer が日英の特許の検証をビルドの経路で呼ぶことを確かめる"
```

---

### Task 5: 暦日の検証の年 0001〜0099 の誤判定を直す（tasks.md の 1.5。単位 1、この Task だけでレビュー）

**Files:**
- Modify: `src/content/schemas.ts:11-15`（`isCalendarDate`）
- Test: `tests/unit/schemas.test.ts`（251-296 行の `describe('資格と実績の日付の粒度')`、30-97 行の `describe('photoSchema')`）
- Modify: `openspec/changes/followup-minors/tasks.md`（1.5 を `[x]`）

**Interfaces:**
- Consumes / Produces: `isCalendarDate(y: number, m: number, d: number): boolean`（モジュール内の非公開関数。`isoDate` と `datePrecision` の `refine` が使う）。公開の型・スキーマは変わらない

- [ ] **Step 1: 失敗するテストを書く**

`tests/unit/schemas.test.ts` の `describe('資格と実績の日付の粒度')` の末尾（295 行の後）に:

```ts
  // new Date(y, …) も Date.UTC も 0〜99 年を 1900 年代に読み替えるため、
  // どちらで組み立てても 0050-02-28 を「暦に無い」と誤判定する
  it.each(['0050-02-28', '0099-12-31', '0004-02-29'])('%s（年 0001〜0099）は暦にある日なので受け付ける', (date) => {
    expect(certWith(date).success).toBe(true);
  });

  it('0100-02-29 は閏年ではないので受け付けない', () => {
    expect(certWith('0100-02-29').success).toBe(false);
  });
```

`describe('photoSchema')` の「takenAt は暦に存在しない日（2025-02-30）を拒否する」（57-59 行）の後に、`isoDate` の経路も 1 本:

```ts
  it('takenAt も年 0001〜0099 の実在する日を受け付ける', () => {
    expect(photoSchema.safeParse({ ...validPhoto, takenAt: '0050-02-28' }).success).toBe(true);
  });
```

- [ ] **Step 2: 赤を確かめる**

Run: `pnpm exec vitest run tests/unit/schemas.test.ts`
Expected: FAIL 4 件（`0050-02-28` / `0099-12-31` / `0004-02-29` の `it.each` 3 件と、takenAt の 1 件。いずれも `expected false to be true`）。`0100-02-29` は今の実装でも緑

- [ ] **Step 3: 最小の実装**

`src/content/schemas.ts:11-15`:

```ts
/** 暦として実在する日か（`2025-02-30` のように形式は合っていても存在しない日を弾く） */
function isCalendarDate(y: number, m: number, d: number): boolean {
  // new Date(y, …) と Date.UTC は 0〜99 年を 1900 年代に読み替えるので setUTCFullYear で組み立てる
  const date = new Date(0);
  date.setUTCFullYear(y, m - 1, d);
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}
```

tasks.md 1.5 は「`Date.UTC` ベース」と書いているが、`Date.UTC` 単体では直らない（落とし穴 1）。UTC で組み立てる意図は保ち、`setUTCFullYear` を使う。

- [ ] **Step 4: 緑を確かめる**

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

Expected: すべて緑（`2025-02-30` / `2025-11-31` の拒否と `2024-02-29` の受理も緑のまま）

- [ ] **Step 5: コミット**

```bash
git add src/content/schemas.ts tests/unit/schemas.test.ts openspec/changes/followup-minors/tasks.md
git commit -m "fix: 暦日の検証が年 0001〜0099 の実在する日を拒否する誤判定を直す"
```

---

### Task 6: 日英比較の表への一本化・`theme.ts`・`ogLocale`（tasks.md の 1.4・1.6。単位 1、この Task だけでレビュー）

挙動不変（design D6）。既存のテストが緑のまま通ることを証拠にする。エラーの文言は `tests/unit/validate.test.ts` が全文で固定しているので、1 文字も変えない。

**Files:**
- Modify: `src/lib/validate.ts:51-116`（`validateCareerParity`）
- Modify: `src/lib/theme.ts:27-43`（`Tokens`、`TOKEN_NAMES`、`parseTokens`）
- Modify: `src/lib/site.ts:123-126`（`ogLocale`）
- Modify: `openspec/changes/followup-minors/tasks.md`（1.4・1.6 を `[x]`）

**Interfaces:**
- Produces（変わらない）: `validateCareerParity(ja: Career, en: Career): string[]`、`readTokens(css: string): { light: Tokens; dark: Tokens }`（`Tokens` は `export` を外す。どこからも import されていない）、`ogLocale(lang: Locale): string`

- [ ] **Step 1: 変更前に緑を確かめる**

Run: `pnpm exec vitest run tests/unit/validate.test.ts tests/unit/theme.test.ts tests/unit/site.test.ts`
Expected: PASS

- [ ] **Step 2: `validateCareerParity` の比較ループを表にする（1.4）**

`src/lib/validate.ts` の 67-94 行（certifications / achievements のループと patents のループ）を、表 1 本とループ 1 本にする。関数の前に:

```ts
/**
 * 同じ位置の項目どうしを突き合わせる配列と、その比較キー（表示の並び替えに使う値）。
 * label はエラー文の「N 番目」の後ろに入る語（patents は複数の値をまとめて出すので空）
 */
const INDEXED_KEYS: [
  key: 'certifications' | 'achievements' | 'patents',
  label: string,
  keyOf: (career: Career, index: number) => string,
][] = [
  ['certifications', 'の date ', (c, i) => c.certifications[i].date],
  ['achievements', 'の date ', (c, i) => c.achievements[i].date],
  [
    'patents',
    '',
    (c, i) => `countries ${c.patents[i].countries.length} 件 / filedAt ${c.patents[i].filedAt}`,
  ],
];
```

`validateCareerParity` の件数のループ（61-65 行）の後を:

```ts
  // 件数が違う配列は、比較キーの突き合わせまで進まない
  for (const [key, label, keyOf] of INDEXED_KEYS) {
    if (ja[key].length !== en[key].length) continue;
    for (let index = 0; index < ja[key].length; index++) {
      const [jaKey, enKey] = [keyOf(ja, index), keyOf(en, index)];
      if (jaKey !== enKey) {
        errors.push(`${key} の ${index + 1} 番目${label}が日英で違う（ja: ${jaKey}, en: ${enKey}）`);
      }
    }
  }
```

文言が変わらないことの確認: `certifications の 2 番目の date が日英で違う（ja: 2016-03, en: 2018-06）`、`patents の 1 番目が日英で違う（ja: countries 1 件 / filedAt 2021-03, en: countries 1 件 / filedAt 2019-08）`。旧 patents の条件（`countries.length` と `filedAt` のどちらかが違う）は、両方を入れた文字列の比較と同値。

`skills`（96-113 行）は表に入れない。配列ではなく `Record` で、件数の文言（「カテゴリ数」）と項目の文言（カテゴリ名を含む）が他と違い、テストが全文で固定しているため。tasks.md 1.4 は「certifications / achievements / patents / skills」と書いているが、出典の申し送り（followup-hardening の ponytail）は「比較 3 重複」で、skills まで表に入れると文言の組み立てが表より複雑になる。この判断は報告に書く。関数冒頭の JSDoc（51-58 行）は表の説明と重なる部分を削り、`skills` の扱いだけ残す。

- [ ] **Step 3: `theme.ts` の写像の表と未使用の export を消す（1.6）**

`src/lib/theme.ts:27-43`:

```ts
const TOKEN_KEYS = ['bg', 'fg', 'fgMuted', 'line'] as const;
type Tokens = Record<(typeof TOKEN_KEYS)[number], string>;

function parseTokens(block: string, label: string): Tokens {
  const withoutComments = block.replace(/\/\*[\s\S]*?\*\//g, '');
  const out = {} as Tokens;
  for (const key of TOKEN_KEYS) {
    const cssName = key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`); // fgMuted → fg-muted
    const matches = [
      ...withoutComments.matchAll(new RegExp(`--${cssName}:\\s*(#[0-9a-fA-F]{3,8})`, 'g')),
    ];
    const last = matches.at(-1);
    if (!last) throw new Error(`${label} のブロックに --${cssName} が無い`);
    out[key] = last[1];
  }
  return out;
}
```

`export type Tokens` の `export` は外す（`grep -rn "Tokens" src tests` で `theme.ts` の外に参照が無いことを確かめてから）。`readTokens` の戻り値の形は変わらない。

- [ ] **Step 4: `ogLocale` をロケールの型から導く（1.6）**

`src/lib/site.ts:123-126`:

```ts
/** 共有カードの og:locale（design D3）。Record<Locale, …> なので、ロケールを足すと型エラーで気づける */
const OG_LOCALES: Record<Locale, string> = { ja: 'ja_JP', en: 'en_US' };

export function ogLocale(lang: Locale): string {
  return OG_LOCALES[lang];
}
```

`locales`（`src/lib/i18n.ts:1`）に 3 つ目を足すと `Locale` が広がり、`OG_LOCALES` のキーが足りないことを `pnpm typecheck` が指摘する（今の三項は黙って `en_US` を返す）。置き場所は `site.ts` のまま（proposal が「置き場所の移動」を B から外している）。

- [ ] **Step 5: 緑を確かめる**

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

Expected: すべて緑。テストの件数は Step 1 から変わらない

- [ ] **Step 6: コミット**

```bash
git add src/lib/validate.ts src/lib/theme.ts src/lib/site.ts openspec/changes/followup-minors/tasks.md
git commit -m "refactor: 日英比較を表 1 本にし、theme の写像の表と ogLocale の三項を整理する"
```

---

### Task 7: `toSlug` が末尾 `.` の slug を拒否する（tasks.md の 2.2。単位 2）

spec delta: photo-pipeline「使えない slug」の `--slug kamo-river.`。

**Files:**
- Modify: `src/lib/photo-meta.ts:21-30`（`toSlug` の `--slug` の分岐）
- Test: `tests/unit/photo-meta.test.ts:54-57` の後
- Modify: `openspec/changes/followup-minors/tasks.md`（2.2 を `[x]`）

**Interfaces:**
- Produces: `toSlug(fileName: string, slugArg?: string): string`（シグネチャは変えない。`slugArg` が `.` で終わると `Error` を投げる）

- [ ] **Step 1: 失敗するテストを書く**

`tests/unit/photo-meta.test.ts` の「--slug が . から始まる値は例外にする」（54-56 行）の後に:

```ts
  it('--slug が . で終わる値は例外にする（先頭の . と対称に拒否する）', () => {
    expect(() => toSlug('x.jpg', 'kamo-river.')).toThrow('kamo-river.');
    expect(() => toSlug('x.jpg', 'kamo-river-v1.2.')).toThrow();
  });

  it('途中の . は拒否しない', () => {
    expect(toSlug('x.jpg', 'kamo-river-v1.2')).toBe('kamo-river-v1.2');
  });
```

- [ ] **Step 2: 赤を確かめる**

Run: `pnpm exec vitest run tests/unit/photo-meta.test.ts`
Expected: FAIL 1 件（「--slug が . で終わる値は例外にする」が `expected [Function] to throw an error`）

- [ ] **Step 3: 最小の実装**

`src/lib/photo-meta.ts:25-28`:

```ts
    // パス区切り・空白・先頭または末尾の . を含む値は、ファイルの書き込み先や asset 名を
    // ずらすのに使われ得るため、加工はせず拒否する（--slug の値はそのまま使うため）
    if (/[/\\\s]/.test(slugArg) || slugArg.startsWith('.') || slugArg.endsWith('.'))
      throw new Error(`指定された slug に使えない文字がある: ${slugArg}`);
```

ファイル名由来の slug は `[^a-z0-9]+` を `-` にして両端の `-` を落とすので、末尾が `.` になることはない（分岐は `--slug` の側だけでよい）。

- [ ] **Step 4: 緑を確かめる**

```bash
pnpm lint && pnpm typecheck && pnpm test
```

- [ ] **Step 5: コミット**

```bash
git add src/lib/photo-meta.ts tests/unit/photo-meta.test.ts openspec/changes/followup-minors/tasks.md
git commit -m "fix: 入稿コマンドの --slug で末尾が . の値を拒否する"
```

---

### Task 8: 入稿コマンドの引数と slug の誤りを 1 行で中断する（tasks.md の 2.1。単位 2）

spec delta: photo-pipeline「使えない slug」「未知のオプション」。design D4。

**Files:**
- Create: `tests/unit/photo-add-cli.test.ts`
- Modify: `scripts/photo-add.ts`（55-73 行の `parseCliArgs` と呼び出し、82 行の `toSlug` の呼び出し）
- Modify: `openspec/changes/followup-minors/tasks.md`（2.1 を `[x]`）

**Interfaces:**
- Consumes: `toSlug`（Task 7 の後の形）、`die(message: string): never`（`scripts/photo-add.ts:38-41`）
- Produces: `parseCliArgs(argv: string[]): { file: string; slug: string }`（スクリプト内の非公開関数。`slug` は `toSlug` を通した後の値になる。旧 `{ file; slug?: string }` の `slug` は生の `--slug` の値だった）

- [ ] **Step 1: 失敗するテストを書く**

スクリプトは import した時点で処理を始めるので、子プロセスで実行して stderr と終了コードを見る。PATH の先頭に「呼ばれたら記録して `joe-yama` を返す」偽の `gh` を置き、本物の GitHub に一切触れないようにする。`tests/unit/photo-add-cli.test.ts`:

```ts
import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const SCRIPT = fileURLToPath(new URL('../../scripts/photo-add.ts', import.meta.url));
const USAGE = '使い方: pnpm photo:add <画像ファイル> [--slug <名前>]';

/**
 * 一時ディレクトリを cwd にして pnpm photo:add 相当を実行する。gh は偽物で、
 * 呼ばれたら gh.log に引数を書く（= GitHub への問い合わせが起きた印）
 */
function runPhotoAdd(args: string[]) {
  const dir = mkdtempSync(join(tmpdir(), 'photo-add-cli-'));
  const ghLog = join(dir, 'gh.log');
  const gh = join(dir, 'gh');
  writeFileSync(gh, `#!/bin/sh\necho "$*" >> "${ghLog}"\necho joe-yama\n`);
  chmodSync(gh, 0o755);
  writeFileSync(join(dir, 'x.jpg'), ''); // 存在する画像ファイル（中身は読まれる前に止まる）
  const result = spawnSync(process.execPath, [SCRIPT, ...args], {
    cwd: dir,
    encoding: 'utf8',
    env: { ...process.env, PATH: `${dir}:${process.env.PATH ?? ''}` },
  });
  return {
    status: result.status,
    lines: result.stderr.trim().split('\n'),
    stderr: result.stderr,
    ghCalled: existsSync(ghLog),
  };
}

describe('pnpm photo:add の引数の誤り', () => {
  it.each(['../../x', 'kamo-river.'])(
    '--slug %s は GitHub に問い合わせる前に 1 行で中断し、スタックトレースを出さない',
    (slug) => {
      const r = runPhotoAdd(['x.jpg', '--slug', slug]);
      expect(r.status).toBe(1);
      expect(r.ghCalled).toBe(false);
      expect(r.lines).toHaveLength(1);
      expect(r.lines[0]).toMatch(/^photo:add: /);
      expect(r.lines[0]).toContain(slug);
      expect(r.stderr).not.toMatch(/^\s+at /m);
    },
  );

  it('未知のオプションは、そのことを示す 1 行と使い方を出して GitHub に問い合わせる前に中断する', () => {
    const r = runPhotoAdd(['x.jpg', '--sulg', 'kamo']);
    expect(r.status).toBe(1);
    expect(r.ghCalled).toBe(false);
    expect(r.lines).toEqual([expect.stringMatching(/^photo:add: .*--sulg/), USAGE]);
    expect(r.stderr).not.toMatch(/^\s+at /m);
  });
});
```

子プロセス 1 回あたり約 0.4〜0.9 秒（`sharp` の読み込み。計画作成時の実測）。既定のタイムアウト 5 秒に収まる。

- [ ] **Step 2: 赤を確かめる**

Run: `pnpm exec vitest run tests/unit/photo-add-cli.test.ts`
Expected: FAIL 3 件。`--slug ../../x` と `--slug kamo-river.` は `ghCalled` が `true`（今は `gh api user` の後で `toSlug` を呼ぶ）。`../../x` はさらに `toSlug` の例外がスタックトレースで出る。`--sulg` は stderr が `photo:add: 使い方: …` の 1 行だけで、`--sulg` を含まない

- [ ] **Step 3: 最小の実装**

`scripts/photo-add.ts:55-73` を次にし、82 行の `const slug = toSlug(basename(file), slugArg);` を消す:

```ts
/** 例外を die の 1 行に載せる文言にする */
const reason = (error: unknown) => (error instanceof Error ? error.message : String(error));

// gh を一度も呼ばずに判定できるよう、引数と slug の検査はアカウント確認より前に行う（spec の手順 1→2）
function parseCliArgs(argv: string[]): { file: string; slug: string } {
  let parsed: { values: { slug?: string }; positionals: string[] };
  try {
    parsed = parseArgs({
      args: argv,
      options: { slug: { type: 'string' } },
      allowPositionals: true,
    });
  } catch (error) {
    die(`${reason(error)}\n${USAGE}`);
  }
  const file = parsed.positionals[0];
  if (file === undefined) die(USAGE);
  try {
    return { file, slug: toSlug(basename(file), parsed.values.slug) };
  } catch (error) {
    die(reason(error));
  }
}

// 引数を解釈する。使えない引数・slug なら、GitHub に問い合わせる前に理由を示して中断する
const { file, slug } = parseCliArgs(process.argv.slice(2));
```

`die` は `console.error(\`photo:add: ${message}\`)` なので、未知のオプションのときの出力は「`photo:add: Unknown option '--sulg'. …`」と「`使い方: …`」の 2 行になる（spec: 理由の 1 行と使い方）。`existsSync(file)` の検査（81 行）はアカウント確認の後のまま（落とし穴 5）。引数が無いときの `die(USAGE)` は変えない。

- [ ] **Step 4: 緑を確かめる**

```bash
pnpm exec vitest run tests/unit/photo-add-cli.test.ts
pnpm lint && pnpm typecheck && pnpm test
```

Expected: すべて緑

- [ ] **Step 5: コミット**

```bash
git add scripts/photo-add.ts tests/unit/photo-add-cli.test.ts openspec/changes/followup-minors/tasks.md
git commit -m "fix: 入稿コマンドの未知のオプションと使えない slug を GitHub に問い合わせる前に 1 行で中断する"
```

---

### Task 9: 入稿コマンドのパスをスクリプト基準にする（tasks.md の 2.3。単位 2）

**判断（報告にも書く）**: この変更の単体テストは置かない。パスを使うのは Release への登録の後（YAML の生成と差し替え時のキャッシュ削除）で、そこまで進む子プロセスのテストは、直した後の実装では**作業ツリーの `src/content/photos` に YAML を書き、差し替え経路では `node_modules/.astro/assets` を消す**。`pnpm test` は hook からも走るので、テストのたびに作業ツリーを書き換えることになる。代わりに、隔離複製で「別の cwd から実行して、YAML がリポジトリ側にできる」ことを直す前後で実測し、出力を報告に貼る（落とし穴 7 の手順）。

**Files:**
- Modify: `scripts/photo-add.ts`（4-17 行の import、33 行の `PHOTOS_DIR`、136 行のキャッシュ削除。行番号は Task 8 の後に取り直す）
- Modify: `openspec/changes/followup-minors/tasks.md`（2.3 を `[x]`）

**Interfaces:**
- Produces: スクリプト内の定数 `ROOT`（リポジトリのルートの絶対パス）、`PHOTOS_DIR = join(ROOT, 'src/content/photos')`、`ASTRO_ASSETS_CACHE = join(ROOT, 'node_modules/.astro/assets')`

- [ ] **Step 1: 直す前の挙動を隔離複製で記録する（赤に相当）**

```bash
P=$S/mut-task9-before && mkdir -p $P
git archive HEAD | tar -x -C $P && pnpm --dir $P install --frozen-lockfile --offline
W=$S/task9-cwd-before && mkdir -p $W/bin
printf '#!/bin/sh\necho "$*" >> "%s/gh.log"\necho joe-yama\n' "$W" > $W/bin/gh && chmod +x $W/bin/gh
cat > $P/make-exif-jpeg.mjs <<'EOF'
import sharp from 'sharp';
await sharp({ create: { width: 64, height: 48, channels: 3, background: '#888' } })
  .withExif({
    IFD0: { Make: 'FUJIFILM', Model: 'X-T5' },
    IFD2: {
      LensModel: 'XF23mmF1.4 R LM WR',
      FNumber: '14/10',
      ExposureTime: '1/250',
      ISOSpeedRatings: '800',
      DateTimeOriginal: '2025:11:03 06:30:00',
    },
  })
  .jpeg()
  .toFile(process.argv[2]);
EOF
(cd $P && node make-exif-jpeg.mjs $P/probe.jpg)
(cd $W && PATH=$W/bin:$PATH node $P/scripts/photo-add.ts $P/probe.jpg --slug probe-cwd); echo "exit=$?"
ls $W/src/content/photos; ls $P/src/content/photos
```

Expected（計画作成時の実測と同じ）: `exit=0`、`$W/src/content/photos/probe-cwd.yaml` ができ、`$P/src/content/photos` には `probe-cwd.yaml` が無い。偽の `gh` なので Release には触れない（`$W/gh.log` に `api user` / `release view photos` / `release upload …` が記録されるだけ）

- [ ] **Step 2: 実装**

`scripts/photo-add.ts` の import に `import { fileURLToPath } from 'node:url';` を足し、33 行を:

```ts
/** リポジトリのルート。cwd がどこでも同じ場所を読み書きする（scripts/ の 1 つ上） */
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PHOTOS_DIR = join(ROOT, 'src/content/photos');
const ASTRO_ASSETS_CACHE = join(ROOT, 'node_modules/.astro/assets');
```

136 行を `rmSync(ASTRO_ASSETS_CACHE, { recursive: true, force: true });` にする。`console.log` の `生成:` / `差し替え:` に出るパスは絶対パスになる（spec は「データファイルを変更していないことを示す」だけで、パスの形は決めていない）。

- [ ] **Step 3: 直した後の挙動を隔離複製で確かめる（緑に相当）**

```bash
P2=$S/mut-task9-after && mkdir -p $P2
git archive HEAD | tar -x -C $P2 && pnpm --dir $P2 install --frozen-lockfile --offline
cp scripts/photo-add.ts $P2/scripts/photo-add.ts
cp $P/make-exif-jpeg.mjs $P2/ && (cd $P2 && node make-exif-jpeg.mjs $P2/probe.jpg)
W2=$S/task9-cwd-after && mkdir -p $W2/bin
printf '#!/bin/sh\necho "$*" >> "%s/gh.log"\necho joe-yama\n' "$W2" > $W2/bin/gh && chmod +x $W2/bin/gh
(cd $W2 && PATH=$W2/bin:$PATH node $P2/scripts/photo-add.ts $P2/probe.jpg --slug probe-cwd); echo "exit=$?"
ls $W2/src/content/photos 2>&1; ls $P2/src/content/photos
# 差し替え経路: 同じ slug でもう一度。キャッシュ削除が複製側に効くことを見る
mkdir -p $P2/node_modules/.astro/assets && touch $P2/node_modules/.astro/assets/marker
(cd $W2 && PATH=$W2/bin:$PATH node $P2/scripts/photo-add.ts $P2/probe.jpg --slug probe-cwd); echo "exit=$?"
ls $P2/node_modules/.astro/assets 2>&1
```

Expected: 1 回目は `exit=0` で、`$W2/src/content/photos` は `No such file or directory`、`$P2/src/content/photos/probe-cwd.yaml` ができる。2 回目は `差し替え: …/probe-cwd.yaml は変更していない` と出て、`$P2/node_modules/.astro/assets` が `No such file or directory` になる

- [ ] **Step 4: 検証コマンド**

```bash
pnpm lint && pnpm typecheck && pnpm test
```

- [ ] **Step 5: コミット**

コミットメッセージの本文に「単体テストを置かない理由」と「隔離複製での実測で確かめた」ことを 2 行で書く:

```bash
git add scripts/photo-add.ts openspec/changes/followup-minors/tasks.md
git commit -m "fix: 入稿コマンドが写真データとキャッシュをスクリプト基準のパスで扱うようにする"
```

---

### Task 10: 入稿まわりの ponytail（tasks.md の 2.4。単位 2）

挙動不変（design D6）。利用者に見える出力（中断の文言）は変えない。

**Files:**
- Modify: `src/lib/photo-meta.ts`（15-20 行の `toSlug` の JSDoc、71-104 行の `exifToPhotoMeta`、146-159 行の `MISSING_FIELD_LABELS` と `translateMissingFields`）
- Modify: `scripts/photo-add.ts`（`translateMissingFields` の import と呼び出し、`// (1)`〜`// (7)` の手順番号コメント。行番号は Task 9 の後に取り直す）
- Test: `tests/unit/photo-meta.test.ts`（169-182 行の `exifToPhotoMeta` の欠損のテスト、251-265 行の `describe('translateMissingFields')`、2-15 行の import）
- Modify: `openspec/changes/followup-minors/tasks.md`（2.4 を `[x]`）

**Interfaces:**
- Produces: `exifToPhotoMeta(raw: Record<string, unknown>): { ok: true; meta: PhotoMeta } | { ok: false; missing: string[] }` の `missing` が **EXIF のタグ名ではなく spec の語彙**（`撮影日` / `カメラ` / `レンズ` / `絞り` / `シャッター速度` / `ISO 感度`、重複なし、この順）になる。`translateMissingFields` は削除する（呼び出しは `scripts/photo-add.ts` の 1 か所だけ）

- [ ] **Step 1: 失敗するテストを書く**

`tests/unit/photo-meta.test.ts` の 169-182 行の 2 本の期待値を spec の語彙にし、`translateMissingFields` の 2 本（251-265 行）の内容を `exifToPhotoMeta` のテストに移す。**同じ利用者向けの振る舞い（中断の文言に出る項目名）を確かめるテストが、変換の場所を移して残る**ので、D6 の「重複の削除」に当たる:

```ts
  it('欠けている項目を spec の語彙ですべて挙げる', () => {
    const result = exifToPhotoMeta({ ...raw, LensModel: undefined, ISO: undefined });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.missing).toEqual(['レンズ', 'ISO 感度']);
  });

  it('数値項目が 0 / 負 / NaN のときは欠損として扱う', () => {
    const r = exifToPhotoMeta({ ...raw, ExposureTime: 0, ISO: Number.NaN, FNumber: -1 });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.missing).toEqual(['絞り', 'シャッター速度', 'ISO 感度']);
  });

  it('撮影日が欠けていれば撮影日を挙げる', () => {
    const r = exifToPhotoMeta({ ...raw, DateTimeOriginal: undefined });
    expect(r.ok === false && r.missing).toEqual(['撮影日']);
  });

  it('Make と Model がどちらも欠けていてもカメラは 1 回だけ挙げる', () => {
    const r = exifToPhotoMeta({ ...raw, Make: undefined, Model: undefined });
    expect(r.ok === false && r.missing).toEqual(['カメラ']);
  });
```

`describe('translateMissingFields')` と import の `translateMissingFields` を消す。

- [ ] **Step 2: 赤を確かめる**

Run: `pnpm exec vitest run tests/unit/photo-meta.test.ts`
Expected: FAIL 4 件（今の `missing` は `['LensModel', 'ISO']` などのタグ名）

- [ ] **Step 3: 実装**

`src/lib/photo-meta.ts` の `exifToPhotoMeta`（75-91 行）の欠損の収集を、spec の語彙を直接入れる `Set` にする:

```ts
  const missing = new Set<string>();
  // ...（取り出しの 7 行は今のまま）
  if (!(takenAt instanceof Date)) missing.add('撮影日');
  if (typeof make !== 'string' || make.trim() === '') missing.add('カメラ');
  if (typeof model !== 'string' || model.trim() === '') missing.add('カメラ');
  if (typeof lens !== 'string' || lens.trim() === '') missing.add('レンズ');
  if (!isPositiveFinite(aperture)) missing.add('絞り');
  if (!isPositiveFinite(exposure)) missing.add('シャッター速度');
  if (!isPositiveFinite(iso)) missing.add('ISO 感度');
  if (missing.size > 0) return { ok: false, missing: [...missing] };
```

関数の JSDoc（71 行）を `/** EXIF の生の値 → YAML に書く値。欠けている項目があれば spec の語彙（撮影日・カメラ…）で全部挙げて返す */` にする。146-159 行の `MISSING_FIELD_LABELS` と `translateMissingFields` を消す。

15-20 行の `toSlug` の JSDoc 6 行を 1 行にする:

```ts
/** ファイル名（拡張子を除いて kebab-case に）または --slug の値（そのまま）→ slug。使えなければ由来の分かる文言で例外 */
```

`scripts/photo-add.ts`: import から `translateMissingFields` を消し、欠損の中断を `die(\`撮影情報を読み取れない項目がある: ${result.missing.join('、')}\`);` にする（出力の文言は同じ）。`// (1) 引数を解釈する…` 〜 `// (7) 写真データファイルが…` の手順番号 `(1)`〜`(7)` を外し、コメントの本文のうち次の行のコードを読めば分かるもの（例: `// (4) 足りない項目があれば名前を挙げて中断する`）は消す。理由を書いたコメント（exifr の fstat の回避、`--host 127.0.0.1` 相当の経緯、差し替え経路でだけキャッシュを消す理由）は残す。

- [ ] **Step 4: 緑を確かめる**

```bash
pnpm lint && pnpm typecheck && pnpm test
```

Expected: すべて緑（`tests/unit/photo-add-cli.test.ts` も緑のまま）

- [ ] **Step 5: コミット**

```bash
git add src/lib/photo-meta.ts scripts/photo-add.ts tests/unit/photo-meta.test.ts openspec/changes/followup-minors/tasks.md
git commit -m "refactor: 撮影情報の欠損を spec の語彙で直接返し、入稿スクリプトのコメントを簡素化する"
```

**単位 2 のレビュー**: Task 7〜10 のコミットをまとめて 1 回。UI 実測なし。

---

### Task 11: e2e の対象ページを写真データから導く（tasks.md の 3.1。単位 3）

design D5。

**Files:**
- Modify: `tests/e2e/paths.ts`（全体。1-12 行）
- Modify: `tests/e2e/pages.spec.ts`（5-6 行の `locales` / `slug`、70-76 行の `pagePaths`）
- Modify: `openspec/changes/followup-minors/tasks.md`（3.1 を `[x]`）

**Interfaces:**
- Consumes: `locales`（`src/lib/i18n.ts:1`）、`src/content/photos/*.yaml` のファイル名
- Produces（`tests/e2e/paths.ts`）:
  - `photoSlugs: string[]` — `src/content/photos/*.yaml` のファイル名から `.yaml` を除いたもの（昇順）
  - `pagePaths: string[]` — 200 を返すべきページ。ロケールごとに `${lang}/`、`${lang}/photos/`、全写真の `${lang}/photos/${slug}/`、`${lang}/career/`。baseURL からの相対（先頭スラッシュなし）
  - `notFoundPath: 'does-not-exist/'`
  - `paths: string[]` — `[...pagePaths, notFoundPath]`（a11y / network が使う）
  - `expectedStatus(path: string): number` — `notFoundPath` なら 404、それ以外は 200（Task 12 が使う）

- [ ] **Step 1: 実装（e2e の対象の定義を変える）**

`tests/e2e/paths.ts`:

```ts
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { locales } from '../../src/lib/i18n';

// cwd に依存せず、このファイルの位置からリポジトリの写真データを読む
const photosDir = fileURLToPath(new URL('../../src/content/photos', import.meta.url));

/** 写真の slug（= src/content/photos/<slug>.yaml のファイル名） */
export const photoSlugs = readdirSync(photosDir)
  .filter((name) => name.endsWith('.yaml'))
  .map((name) => name.slice(0, -'.yaml'.length))
  .sort();
if (photoSlugs.length === 0) throw new Error(`${photosDir} に写真データが無い`);

/** 200 を返すべきページ。パスは baseURL からの相対（先頭スラッシュなし） */
export const pagePaths = locales.flatMap((lang) => [
  `${lang}/`,
  `${lang}/photos/`,
  ...photoSlugs.map((slug) => `${lang}/photos/${slug}/`),
  `${lang}/career/`,
]);

/** 404 ページを確かめるための、存在しないパス */
export const notFoundPath = 'does-not-exist/';

/** アクセシビリティ検査（a11y.spec.ts）と外部要求の検査（network.spec.ts）の対象 */
export const paths = [...pagePaths, notFoundPath];

/** そのパスの応答として期待するステータス */
export function expectedStatus(path: string): number {
  return path === notFoundPath ? 404 : 200;
}
```

`tests/e2e/pages.spec.ts` の 6 行の `const slug = 'kariya-ferris-wheel';` と 70-76 行の `pagePaths` を消し、`import { pagePaths } from './paths';` を足す。5 行の `locales` は特許の区画のテストが使うので残す。`expectedStatus` はこの Task ではまだ使わない（`noUnusedLocals` は export には効かない）。

- [ ] **Step 2: 対象が増えたことを確かめる**

Run: `pnpm exec playwright test --list | grep -c "photos/sunset-dinghies/"`
Expected: 1 以上（今は 0。`ja/photos/sunset-dinghies/` と `en/photos/sunset-dinghies/` が pages / a11y / network に現れる）。これがこの Task の「赤 → 緑」に当たる（対象の定義の変更なので、失敗するテストではなく対象の一覧で見る）

- [ ] **Step 3: e2e を回す**

Run: `pnpm e2e`
Expected: 緑。**新しく対象になった `sunset-dinghies` の 2 ページで a11y などが赤になった場合は、写真個別ページ（`src/pages/[lang]/photos/[slug].astro`）を直さずに止まり、コントローラーに報告する**（そのファイルは本 change で触らない。design Context）

- [ ] **Step 4: 検証コマンドとコミット**

```bash
pnpm lint && pnpm typecheck
git add tests/e2e/paths.ts tests/e2e/pages.spec.ts openspec/changes/followup-minors/tasks.md
git commit -m "test: e2e の対象ページを写真データから導き、全写真の個別ページを含める"
```

---

### Task 12: a11y / network で応答ステータスを確かめる（tasks.md の 3.2。単位 3）

design D5。

**Files:**
- Modify: `tests/e2e/a11y.spec.ts:3,7`
- Modify: `tests/e2e/network.spec.ts:2,11`
- Modify: `openspec/changes/followup-minors/tasks.md`（3.2 を `[x]`）

**Interfaces:**
- Consumes: `paths`、`expectedStatus(path: string): number`（Task 11）

- [ ] **Step 1: 番人を書く**

`tests/e2e/a11y.spec.ts`:

```ts
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { expectedStatus, paths } from './paths';

for (const path of paths) {
  test(`${path} にアクセシビリティ違反が無い`, async ({ page }) => {
    // 404 ページを検査して緑になる（検査したつもりのページが存在しない）ことを防ぐ
    const response = await page.goto(`./${path}`);
    expect(response?.status()).toBe(expectedStatus(path));
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.length} 件`)).toEqual([]);
  });
}
```

`tests/e2e/network.spec.ts` も同じく import に `expectedStatus` を足し、11 行を:

```ts
    const response = await page.goto(`./${path}`, { waitUntil: 'networkidle' });
    expect(response?.status()).toBe(expectedStatus(path));
    expect(external).toEqual([]);
```

tasks.md 3.2 は「200 であること」と書いているが、`paths` には 404 ページの検査（`does-not-exist/`）が含まれ、そのページの a11y と外部要求も検査の対象として残す必要がある。404 ページだけは 404 を期待する（報告に書く）。

- [ ] **Step 2: 緑を確かめる**

Run: `pnpm e2e`
Expected: 緑

- [ ] **Step 3: 赤は変異で確かめる**

この番人の赤（存在しない slug を対象に混ぜると a11y / network が落ちる）は Task 15 の変異 (f) で確かめる。e2e の実行 1 回ごとにビルドが走るので、ここでは重ねて回さない。

- [ ] **Step 4: 検証コマンドとコミット**

```bash
pnpm lint && pnpm typecheck
git add tests/e2e/a11y.spec.ts tests/e2e/network.spec.ts openspec/changes/followup-minors/tasks.md
git commit -m "test: a11y と外部要求の検査で応答ステータスを確かめ、404 を見落とさない"
```

---

### Task 13: `pages.spec.ts` の整理とタイブレークの検査（tasks.md の 3.3。単位 3）

**Files:**
- Modify: `tests/e2e/pages.spec.ts`（16-35 行の `parsePatents`、37-46 行の `firstBySortOrder`、48-56 行の `formatMonth`、58-68 行の `patentsByLang` と派生定数、147-154 行の `canonical ?? ''`、230-234 行の並び順のテスト。行番号は Task 11 の後に取り直す）
- Modify: `openspec/changes/followup-minors/tasks.md`（3.3 を `[x]`）

**Interfaces:**
- Produces（ファイル内）: `parsePatents(yamlPath: string): PatentSummary[]`（`patents:` 区画だけを読む）、`sortBySortOrder(patents: PatentSummary[]): PatentSummary[]`（`firstBySortOrder` を置き換え、全件を並べて返す）、`formatMonth(value: string, lang: 'ja' | 'en'): string`（`month: 'short'` 固定）

- [ ] **Step 1: 並び順のテストを全件の順序で確かめる形にする（失敗しうる番人を先に）**

`firstBySortOrder`（37-46 行）を全件を返す関数にする:

```ts
/** src/lib/career.ts の sortPatents と同じ規則を、e2e から独立に計算する（design 5.1 (b)） */
function sortBySortOrder(patents: PatentSummary[]): PatentSummary[] {
  return [...patents].sort((a, b) => {
    const byCountryCount = b.countries.length - a.countries.length;
    if (byCountryCount !== 0) return byCountryCount;
    return b.filedAt.localeCompare(a.filedAt);
  });
}
```

58-68 行（`patentsByLang` は `en` がどこからも読まれていない）:

```ts
const patents = parsePatents('src/content/career/ja.yaml');
/** 特許の一覧で、操作なしに見せる先頭の件数（spec。src/lib/career.ts の PATENTS_HEAD_COUNT と同じ値） */
const PATENTS_HEAD_COUNT = 5;
const patentsTotal = patents.length;
const patentsRestCount = patentsTotal - PATENTS_HEAD_COUNT;
const expectedOrder = sortBySortOrder(patents);
const expectedFirst = expectedOrder[0];
if (!expectedFirst) throw new Error('patents が空');
```

`expectedFirstNumber` / `expectedFirstFiledAt` / `expectedFirstCountries` の参照（233・242・243・252・253 行）は `expectedFirst.number` / `expectedFirst.filedAt` / `expectedFirst.countries` にする。

230-234 行のテストを、先頭 1 件ではなく全件の順序で比べる形にする（今は先頭が 6 か国で唯一のため、同数のときの並びを壊しても落ちない）:

```ts
  test('特許は出願国数が多い順、同数なら出願年月が新しい順に並ぶ', async ({ page }) => {
    // タイブレークを確かめられるデータであること（国数が同じで出願年月が違う組がある）
    const hasTie = patents.some((a) =>
      patents.some((b) => a.countries.length === b.countries.length && a.filedAt !== b.filedAt),
    );
    expect(hasTie).toBe(true);

    await page.goto('./ja/career/');
    const section = patentsSection(page, 'ja');
    // PatentItem の <span> は 出願年月 / 公報番号 / 出願国 の順。2 つ目が公報番号
    const numbers = await section
      .locator('li')
      .evaluateAll((lis) => lis.map((li) => li.querySelectorAll('span')[1]?.textContent?.trim()));
    expect(numbers).toEqual(expectedOrder.map((p) => p.number));
  });
```

- [ ] **Step 2: 死んだ分岐と走査範囲を直す**

`formatMonth`（48-56 行）の `month: lang === 'ja' ? 'long' : 'short'` を `month: 'short'` にする（本体の `src/lib/career.ts:59-65` と同じ。ja は `long` と `short` の出力が同じ）。

`parsePatents`（16-35 行）を `patents:` 区画だけ読む形にする:

```ts
function parsePatents(yamlPath: string): PatentSummary[] {
  const text = readFileSync(yamlPath, 'utf8');
  const patents: PatentSummary[] = [];
  let current: Partial<PatentSummary> | null = null;
  let inPatents = false;
  for (const line of text.split('\n')) {
    // 行頭が空白でない行はトップレベルのキー。patents: の区画の中だけを読む
    if (/^\S/.test(line)) {
      inPatents = line.startsWith('patents:');
      continue;
    }
    if (!inPatents) continue;
    const numberMatch = line.match(/^ {2}- number: (.+)$/);
    if (numberMatch) {
      if (current) patents.push(current as PatentSummary);
      current = { number: numberMatch[1] };
      continue;
    }
    if (!current) continue;
    const filedAtMatch = line.match(/^ {4}filedAt: "?([0-9-]+)"?$/);
    if (filedAtMatch) current.filedAt = filedAtMatch[1];
    const countriesMatch = line.match(/^ {4}countries: \[(.+)\]$/);
    if (countriesMatch) current.countries = countriesMatch[1].split(',').map((s) => s.trim());
  }
  if (current) patents.push(current as PatentSummary);
  return patents;
}
```

JSDoc（10-15 行）の「patents: ブロックから」は実装と一致するようになるので文言は残す。

147-154 行の `canonical ?? ''` を、無ければ理由を示して落ちる形にする（`toHaveCount(1)` を見ていない SNS 共有カードのテストでは、`null` のとき `''` と比べて黙って通りうる）:

```ts
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      if (canonical === null) throw new Error(`${path} に canonical が無い`);
      // ...
      await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', canonical);
```

`description ?? ''`（158 行）は tasks.md 3.3 に無いので触らない（報告の「提案」に書く）。

- [ ] **Step 3: 緑を確かめる**

Run: `pnpm e2e`
Expected: 緑（`parsePatents` は現データで 65 件を返す。`patents:` 区画は YAML の末尾なので件数は変わらない）

- [ ] **Step 4: タイブレークの番人を変異で確かめる（`docs/harness/lessons.md` の「番人を書いたら変異を当てる」）**

隔離複製で、変異なしの e2e が緑であることを見てから、`src/lib/career.ts` の `sortPatents` の `filedAt` の比較を逆にする（`b.filedAt > a.filedAt ? 1 : …` → `b.filedAt > a.filedAt ? -1 : b.filedAt < a.filedAt ? 1 : 0`）。

```bash
pnpm --dir $P exec playwright test tests/e2e/pages.spec.ts -g "特許は出願国数が多い順"
```

Expected: 変異ありで FAIL（`expect(numbers).toEqual(…)` の差分が出る）。先頭の 1 件は 6 か国で唯一なので、旧テスト（先頭の `number` だけを見る）ならこの変異で緑のままだったことも、旧テストのままの複製で確かめて報告に書く。`-g` で 1 本だけ回しても `global-setup.ts` がビルドする。ポート 4399 を同時に使わない

- [ ] **Step 5: 検証コマンドとコミット**

```bash
pnpm lint && pnpm typecheck
git add tests/e2e/pages.spec.ts openspec/changes/followup-minors/tasks.md
git commit -m "test: 特許の並び順を全件で確かめ、pages.spec の未使用変数と死んだ分岐を整理する"
```

---

### Task 14: `global-setup.ts` の簡素化（tasks.md の 3.4。単位 3）

挙動不変（design D6）。

**Files:**
- Modify: `tests/e2e/global-setup.ts`（12-17 行の `STARTED_MARKER`、46-60 行の `isPreviewAlreadyRunning`）
- Modify: `tests/e2e/global-teardown.ts`（4 行の import、6-9 行の `STARTED_MARKER`）
- Modify: `openspec/changes/followup-minors/tasks.md`（3.4 を `[x]`）

**Interfaces:**
- Produces: `global-setup.ts` から `export const STARTED_MARKER: string`（teardown が既に `RUN_ID_ENV` を import しているのと同じ経路で共有する）。`isPreviewAlreadyRunning(): boolean` はファイル内のまま

- [ ] **Step 1: マーカーのパス定数を 1 か所にする**

`tests/e2e/global-setup.ts:12-17` の `const STARTED_MARKER` を `export const STARTED_MARKER` にする（コメントは残す）。`tests/e2e/global-teardown.ts` の 6-9 行を消し、4 行を `import { RUN_ID_ENV, STARTED_MARKER } from './global-setup';` にする。`fileURLToPath` の import が teardown で使われなくなるので消す。

- [ ] **Step 2: 補助チェックを簡素化する**

`tests/e2e/global-setup.ts:46-60` を:

```ts
// 同じプロジェクト root の preview が別ポートで動いていると --port が無視されて 60 秒待つので、
// 先に落とす補助チェック。別 root・別プロセスの占有は isPortOccupied が見る（レビュー C1）
function isPreviewAlreadyRunning(): boolean {
  try {
    const output = execSync('pnpm exec astro preview status --json', { encoding: 'utf-8' });
    return parsePreviewMessage(output) !== null;
  } catch {
    return false;
  }
}
```

**補助チェック自体は消さない**。出典の ponytail は「消す」を提案していたが、消すと「同じ root の preview が別ポートで動いている」ときに即座に落ちず 60 秒のタイムアウトになり、挙動が変わる。tasks.md 3.4 は「簡素化（挙動不変）」なので、コメントと本体を短くするだけにする（報告に書く）。

- [ ] **Step 3: 緑を確かめる**

```bash
pnpm lint && pnpm typecheck
pnpm e2e
ls .astro/e2e-preview-started-by-setup 2>&1   # teardown がマーカーを消したこと
pnpm exec astro preview status --json          # preview が止まっていること
```

Expected: e2e 緑、マーカーは `No such file or directory`、status の message に `No preview server is running`

- [ ] **Step 4: コミット**

```bash
git add tests/e2e/global-setup.ts tests/e2e/global-teardown.ts openspec/changes/followup-minors/tasks.md
git commit -m "refactor: e2e のマーカーのパスを 1 か所にし、preview の補助チェックを短くする"
```

**単位 3 のレビュー**: Task 11〜14 のコミットをまとめて 1 回。UI 実測なし（e2e の実行結果を証拠にする）。

---

### Task 15: 番人の変異確認と最終検証（tasks.md の 4.1・4.2。ブランチ全体のレビューに含める）

**Files:**
- Modify: `openspec/changes/followup-minors/tasks.md`（4.1 の下に結果の表を足し、4.1・4.2 を `[x]`）

- [ ] **Step 1: 変異を 1 つずつ当てる**

すべて「隔離実行の手順」で、変異ごとに新しい複製を作る（`$S/mut-4-1-a` など）。まず変異なしの対照を取り、`RUN  v5.0.1 <複製のパス>` の行を報告に貼る。

| 変異 | 当てる場所と内容 | 回すもの | 赤になるはずのもの |
|---|---|---|---|
| (a) 特許の `url` を 1 件消す | `$P/src/content/career/ja.yaml` の `patents:` の先頭の項目の `url:` の行を消す | `pnpm --dir $P build` | ビルドが `url` のスキーマエラーで失敗する（Zod の `career` コレクションのエラー）。あわせて `$P/src/content/schemas.ts` の `url: z.url()` を `z.url().optional()` に戻した別の複製で `tests/unit/schemas.test.ts` の「url が無ければ失敗する」が赤 |
| (b) 公報番号を 1 件重複させる | `$P/src/content/career/ja.yaml` の `patents:` の 2 件目の `number` を 1 件目と同じ値にする（どちらも `JP…` なので `countries` の先頭の検査には掛からない） | `pnpm --dir $P build` | ビルドが `career/ja の内容に問題がある` と `number が重複している（number: <値>）` で失敗する |
| (c) `validateCareerPatents` の呼び出しを消す | `$P/src/lib/content.ts` の `validateCareerPatents(ja.data, 'ja')` の行を消す（別の複製で `en` の行も） | `vitest run --root $P tests/unit/content.test.ts` | 「日本語のデータで公報番号が重複していれば…」（`en` の変異では「英語の…」）が `promise resolved … instead of rejecting` |
| (d) `isCalendarDate` を元に戻す | `$P/src/content/schemas.ts` の `isCalendarDate` を `const date = new Date(y, m - 1, d); return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;` に戻す | `vitest run --root $P tests/unit/schemas.test.ts` | 年 0001〜0099 の 4 本 |
| (e) `toSlug` の末尾 `.` の拒否を外す | `$P/src/lib/photo-meta.ts` の `\|\| slugArg.endsWith('.')` を消す | `vitest run --root $P tests/unit/photo-meta.test.ts tests/unit/photo-add-cli.test.ts` | photo-meta の「. で終わる値は例外にする」と、photo-add-cli の `--slug kamo-river.` |
| (f) e2e の対象に存在しない slug を混ぜる | `$P/tests/e2e/paths.ts` の `photoSlugs` の後に `photoSlugs.push('no-such-photo');` を足す | `pnpm --dir $P e2e` | `ja/photos/no-such-photo/` と `en/photos/no-such-photo/` の a11y・network・pages（`expected 200, received 404`）。テスト名に `no-such-photo` が出ることで複製を見ていることを確かめる |

(f) では、Task 12 の前の状態（a11y / network にステータス検査が無い）の複製でも同じ変異を当て、a11y と network が**緑のまま**だったこと（穴があったこと）を対照として記録する。e2e の変異は 1 本ずつ順に回し、ポート 4399 を同時に使わない。

- [ ] **Step 2: 結果を tasks.md に記録する**

4.1 の下に、前例（`openspec/changes/archive/2026-09-22-patents-full-retrieval/tasks.md` の 5.1）と同じ形の表を足す: `| 変異 | 当てた場所 | 落ちたテスト（またはビルドのエラー） | 結果 |`。落ちなかった変異があれば、テストを直してから再度確かめ、直したことも書く。

- [ ] **Step 3: 最終検証（4.2）**

```bash
git status --short
pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm e2e
```

Expected: `git status --short` は `?? .worktrees/` 以外が空（作業ツリーに変異が残っていない）。すべて緑

- [ ] **Step 4: コミット**

```bash
git add openspec/changes/followup-minors/tasks.md
git commit -m "docs: followup-minors の番人に変異を当てた結果を記録する"
```

---

## レビューの単位

`.claude/rules/review.md` に従い、`reviewer`（Opus）が別コンテキストでレビューする。

- **単位 1 = Task 1〜6、Task ごとに 1 回ずつ**（共有インターフェース: スキーマ、`Patent` の型、`validateCareerPatents` のシグネチャ、spec の要求）。reviewer には該当 Task のコミットの diff を渡す。Task 1・2 は `dist` の HTML の diff が空であることの出力も渡す
- **単位 2 = Task 7〜10 をまとめて 1 回**（入稿スクリプト）。Task 9 の隔離複製での実測の出力を渡す
- **単位 3 = Task 11〜14 をまとめて 1 回**（e2e）
- **ブランチ全体 1 回**（Task 15 を含む。4.1 の変異の結果表と、`pnpm e2e` を含む最終検証の出力を渡す）

UI 実測は行わない（見た目は変えない。`dist` の diff と e2e を証拠にする）。Minor は修正せず `openspec/changes/followup-minors/tasks.md` 末尾の「提案」に転記する。

---

## Self-review

**spec の Scenario と Task の対応**

content-schema「特許のデータ構造と公報番号の一意性」:

| Scenario | 対応 |
|---|---|
| 必須項目が揃った特許 | Task 2（`validPatent` に `url` を足した「必須項目が揃えば成功する」） |
| 出願年月の形式が違う | 既存（`schemas.test.ts` の「filedAt が YYYY-MM でなければ失敗する」） |
| 出願国が空 | 既存（「countries が空配列なら失敗する」） |
| 公報番号が欠けている | 既存（「number が無ければ失敗する」） |
| url が欠けている | **Task 2**（「url が無ければ失敗する」）、Task 15 (a) |
| 公報番号が重複している | **Task 3**（`validateCareerPatents` の単体）、**Task 4**（ビルドの経路 = `getCareer`）、Task 15 (b)(c) |
| 出願国の先頭が代表公報の国と一致する / 違う | 既存（`validate.test.ts`） |
| 英語のデータだけが食い違う | 既存（`validate.test.ts`）、Task 4 で `en` の配線も守る |
| 見出しが 1 行に収まる長さ / 日本語・英語の見出しが長すぎる | 既存（`validate.test.ts`）。Task 3 で上限の表を `Record<Locale, number>` にする |

profile-and-career「特許の表示」:

| Scenario | 対応 |
|---|---|
| 出願国の数が多い順に並ぶ | 既存（`career.test.ts`）、Task 13 の全件順序 |
| 出願国の数が同じなら新しい順 | 既存（`career.test.ts`）、**Task 13**（e2e でもタイブレークを見る）と Task 13 Step 4 の変異 |
| 項目の表示内容（日本語 / 英語） | 既存（`pages.spec.ts` の「先頭の項目は…」）。Task 13 で `formatMonth` の死んだ分岐を消す |
| 正式名称は出さない | 既存（Change 11 の e2e と `validate` の上限）。本 change では触らない |
| リンクの有無 | **Task 2**（「すべての特許の見出しが Google Patents へのリンクになる」と `PatentItem.astro`） |
| 6 件目以降が折りたたまれる / 折りたたみを開く / 5 件以下なら折りたたまない / JavaScript なしで全件が出力される | 既存（`pages.spec.ts`、`career.test.ts` の `splitPatents`）。Task 1 で `splitPatents` の型を固定 |

photo-pipeline「写真の入稿コマンド」:

| Scenario | 対応 |
|---|---|
| 使えない slug | **Task 7**（`toSlug` の末尾 `.`）、**Task 8**（`--slug ../../x` / `--slug kamo-river.` の子プロセスのテスト）、Task 15 (e) |
| 未知のオプション | **Task 8**（`--sulg kamo`） |
| 認証アカウントが違う / 引数が無い / カメラ出力の JPEG / 小さい画像 / 2 枚目以降 / 差し替え / 差し替え後のビルド / slug を明示する / 撮影情報が欠けている | 変更なしの要求。「撮影情報が欠けている」の語彙は Task 10 で変換の場所を移し、`exifToPhotoMeta` のテストで守る。「差し替え後のビルド」のキャッシュ削除のパスは Task 9（隔離複製で実測） |

**型名と関数名の一致**

- `Patent` / `Career['patents'][number]`: Task 1（career.test.ts のファクトリ）、Task 2（`url: string` 必須）、Task 4（content.test.ts のファクトリ）で同じ形 `{ filedAt, title, number, countries, url }`
- `validateCareerPatents(career: Career, lang: Locale)`: Task 3 で定義、Task 4 が `getCareer` 経由で使う、Task 15 (c) が呼び出しを消す
- `Locale`: `src/lib/i18n.ts` の `'ja' | 'en'`。Task 3（`validate.ts` は `./i18n.ts` から型 import）、Task 6（`OG_LOCALES: Record<Locale, string>`）
- `toSlug(fileName, slugArg?)`: Task 7 で拒否条件を足し、Task 8 の `parseCliArgs` が呼ぶ
- `exifToPhotoMeta` の `missing`: Task 10 で spec の語彙になり、`scripts/photo-add.ts` はそのまま `join('、')` する
- `paths` / `pagePaths` / `photoSlugs` / `notFoundPath` / `expectedStatus`: Task 11 で定義、Task 12（a11y / network）と Task 11（pages.spec の `pagePaths`）、Task 15 (f)（`photoSlugs.push`）が使う
- `sortBySortOrder` / `expectedOrder` / `expectedFirst` / `patents` / `patentsTotal`: Task 13 で `pages.spec.ts` の中で定義。Task 2 の新しい e2e は `patentsTotal` を使う（Task 13 の後も同じ名前）
- `STARTED_MARKER`: Task 14 で `global-setup.ts` から export、`global-teardown.ts` が import

**tasks.md との食い違い（実装時に報告へ書く判断）**

1. 1.5 の「`Date.UTC` ベース」は `Date.UTC` 単体では直らない。`setUTCFullYear` を使う（Task 5、落とし穴 1）
2. 1.4 の「skills」は表に入れない（Task 6 Step 2）
3. 2.3 は単体テストを置かず、隔離複製で実測する（Task 9）
4. 3.2 の「200」は、404 ページの検査だけ 404 を期待する（Task 12）
5. 3.4 は補助チェックを消さず短くするだけ（Task 14）
6. 1.1 の e2e の置き換えは ja だけの 1 本（tasks.md の「1 本に置き換える」に合わせる。en のリンクは既存の日英比較テストが件数一致で守る）
