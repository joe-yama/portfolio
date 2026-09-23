# followup-minors-3 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `header-nav-icons` と `followup-minors-2` の申し送り 27 件のうち main で有効なものを片付ける。特許の `url` と `number` の対応をビルド時に検証し、ヘッダーのロゴとナビの文字のベースラインをそろえ、e2e の cwd 依存・pid 取り逃しと入稿コマンドの壊れる入力 2 件を直し、テストの穴と整理を行う。

**Architecture:** 検証は今の置き場所（`src/lib/validate.ts` の `validateCareerPatents`）に 1 つ足す。ヘッダーは `src/components/Header.astro` の scoped CSS だけを直す。e2e のパスはすべて `fileURLToPath(new URL('../../…', import.meta.url))` から組み立てる（`paths.ts` / `links.spec.ts` と同じ）。入稿コマンドの中断は既存の `die()`（1 行）に寄せる。

**Tech Stack:** Astro 7（静的出力）、TypeScript（strict + `noUnusedLocals`）、Zod（`astro/zod`）、Vitest 5、Playwright 1.63、Biome 2、pnpm、Node 26（`scripts/photo-add.ts` は node が型を剥がして直接実行する）、sharp。依存の追加なし。

**Spec:** `openspec/changes/followup-minors-3/specs/content-schema/spec.md`、`openspec/changes/followup-minors-3/specs/layout-shell/spec.md`（要求）、`openspec/changes/followup-minors-3/design.md`（決定 D1〜D6）、`openspec/changes/followup-minors-3/tasks.md`（タスク）、`openspec/changes/followup-minors-3/proposal.md`（含める / 含めない）。Issue #57。

## Global Constraints

- **パッケージマネージャは pnpm のみ**。`npm` / `npx` は使わない。**依存を 1 つも足さない**。`pnpm install` は `--frozen-lockfile` 付きだけ
- **TDD**: 失敗するテストを先に書き、赤を見てから実装する。テストの削除・skip・期待値の書き換えで通さない（`.claude/rules/testing.md`）。例外は次だけで、コミットメッセージに理由を書く:
  - Task 1 の **fixture の `url`**（`tests/unit/validate.test.ts` / `tests/unit/content.test.ts` の `patent()` が返す `https://example.com/`）を代表公報を指す URL に直す。期待値ではなく入力の前提を spec delta に合わせる変更
  - Task 7 の 4.1（tasks.md が明示した重複テストの削除）。削除の前後で同じ変異が赤になることを Task 8 で確かめる
- **挙動不変のタスク（design D6）** は既存のテストが緑のまま通ることを証拠にする
- **コミットは `tasks.md` の項目ごと**。日本語、先頭に種別（`feat:` / `fix:` / `test:` / `refactor:` / `docs:`）。`openspec/changes/followup-minors-3/tasks.md` の該当項目のチェックを同じコミットに含める（検証だけの項目 5.x はチェックだけのコミットでよい）。末尾の attribution 行はセッションの指示に従う
- **`git commit` は sandbox 外で実行する**（1Password の SSH 署名）。push はコントローラーが行う
- **archive は書き換えない**: `openspec/changes/archive/**`
- **`validate.ts` は node が直接実行する経路に乗る**（`scripts/photo-add.ts` → `photo-meta.ts` → `validate.ts` → `schemas.ts`）。この経路の相対 import には `.ts` を付ける。`URL` はグローバルなので import 不要
- **`tsconfig.json` の `include` は `**/*`** なので、`pnpm typecheck`（astro check）は `tests/` も型検査する
- **Biome**: シングルクォート、セミコロンあり、行幅 100。崩れたら `pnpm format`
- **e2e はポート 4399 を他の worktree と共有する**。`pnpm e2e` を同時に 2 本回さない。実行前に `lsof -i :4399` で空いていることを確かめる
- **`rm -rf` は hook が拒否する**。隔離複製は毎回新しいディレクトリ名で作り、消さない
- **スコープ**: `tasks.md` の項目だけ。気づいた改善は `tasks.md` 末尾の「提案」に書き、実装しない（`.claude/rules/scope.md`）
- **検証コマンド**: `pnpm test` / `pnpm lint` / `pnpm typecheck` / `pnpm build` / `pnpm e2e`。報告には実行したコマンドと出力の抜粋を添える

## 隔離実行の手順（変異を当てる Task で使う）

`docs/harness/README.md` §7 の手順に従う。要点:

```sh
S=/private/tmp/claude-501/-Users-joe-repo-github-personal-joe-yama-portfolio/5c71da21-0b97-4ea4-bb9f-1c4b64237a30/scratchpad
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
- e2e は `pnpm --dir "$EXP" e2e`（globalSetup が複製の中で `pnpm build` する）。1 本だけ見たいときは `pnpm --dir "$EXP" e2e tests/e2e/links.spec.ts -g '<名前の一部>'`
- 作業ツリーそのものに変異を当てない

## 計画作成時に実測したこと

1. **特許の fixture は `url: 'https://example.com/'`**: `tests/unit/validate.test.ts:28` の `patent(over)`（既定の `number` は `JP6549500B2`、`over.number` で上書きされる）と `tests/unit/content.test.ts:17` の `patent(number)`。Task 1 の検査を足すとこれらを使う既存テストが赤になるので、`url` を `https://patents.google.com/patent/${number}/ja` にする（`validate.test.ts` は `over` を展開した後の `number` から作る）。`tests/unit/career.test.ts:88` の fixture は `sortPatents` 用で検証を通らないので触らない（Task 1 で `grep -n validate tests/unit/career.test.ts` が空であることを確かめる）
2. **`src/lib/site.ts:22` の `CareerSection` の JSDoc は既に「ui.careerSections のキー（順は pages.spec が見出しの順と比べる）」**。H7 の趣旨は「型のユニオンの並びに意味は無く、pages.spec が比べるのは `ui.careerSections` のキーの順」をはっきりさせること。例: `/** 経歴ページの区画の名前。表示の順を決めるのは ui.careerSections のキーの順で、pages.spec が見出しの順と比べる（このユニオンの並びに意味は無い） */`
3. **`src/content/schemas.ts:19` の `existsOnCalendar` の JSDoc** は「`YYYY-MM` は月の範囲を正規表現が保証済みなので常に true」。関数そのものは日が無ければ（`d === undefined`）月を見ずに true を返すので、「日が無ければ（`YYYY-MM`）常に true。月の範囲は呼び出し側の正規表現が見る」の趣旨にする
4. **`tests/unit/site.test.ts:60-70` の describe「導線のアイコン（design D1）」**: `navLinks` の `toEqual`（47-58 行、ja と en の両方で `icon: camera` / `icon: briefcase` を含む）と `languageSwitch` の `toEqual`（72-90 行、ja と en の両方で `icon: globe`）が同じ主張を含む。重複なので describe ごと消してよい（`camera` / `briefcase` / `globe` の import は他の describe が使うので残る）
5. **`tests/unit/photo-add-cli.test.ts:103` に「EXIF は読めても画素が壊れた JPEG」の既存テストと fixture がある**。Task 3 の 1.4 はこの fixture を使い、`runPhotoAdd` の第 2 引数に `env?: Record<string, string>` を足して spawn の `env` に展開する（`{ ...process.env, PATH: dir, ...env }`）
6. **`scripts/photo-add.ts:86`** は `gh(['api', 'user', '--jq', '.login']).split('\n')[0]` を `'joe-yama'` と比べる。作業ディレクトリは 109 行の `mkdtempSync(join(tmpdir(), 'photo-add-'))`、sharp の catch は 119 行
7. **`careerSchema` は `z.object`（非 strict）**なので、`ja.yaml` にトップレベルの `patentsX:` を足しても未知のキーとして捨てられ、ビルドは通る（Task 8 の 5.2 の対照実験が e2e で回せる）
8. **`global-setup.ts` の `isPreviewAlreadyRunning` と `currentPreviewPid` の違い**: 前者は `parsePreviewMessage(...) !== null`、後者はさらに `pid (\d+)` が取れたときだけ非 null。寄せると「message はあるが pid が無い」出力のとき判定が変わる。Task 3 で `pnpm exec astro preview status --json` の実際の出力（起動中・停止中）を確かめ、起動中の message が常に `pid N` を含むなら寄せる。含まない形がありうるなら寄せず、理由を報告に書く
9. **cwd 依存は 2 か所だけ**: `tests/e2e/pages.spec.ts:75-76` の `parsePatents('src/content/career/…')` と `tests/e2e/sitemap.spec.ts:18` の `join('dist', lang)`（`grep -rn "readFileSync\|'dist'\|'src/" tests/e2e` で確認）

## 計画段階の裁定（コントローラー）

- **R-a: fixture の `url` を直すのはテストの期待値の書き換えにあたらない**。理由: spec delta が「url は代表公報を指す」を足したので、`example.com` の fixture は新しい spec の下で不正な入力になる。期待値（エラーの有無・文言）は変えない。代償: fixture を直し損ねると既存テストが別の理由で赤/緑になりうる → Task 1 で「fixture を直した後、検査を足す前に全テストが緑」を 1 度確かめる
- **R-b: 2.2 の RED は修正前の CSS で測る**。design D2 の「修正前の main で 1280px の差が 1.8px 前後」は、Task 5 の中で CSS を直す前にテストだけ足して赤を見ることで満たす（別の隔離複製は要らない）

---

## Task 一覧とレビューの単位

| Task | 名前 | tasks.md | レビュー単位 |
|---|---|---|---|
| 1 | 特許の `url` が代表公報を指すことの検証 | 1.1 | 単位 A（この Task だけ。spec） |
| 2 | 入稿コマンドの login と一時ディレクトリ | 1.3、1.4 | 単位 C |
| 3 | e2e のセットアップの pid | 1.2 | 単位 C |
| 4 | e2e の cwd 依存とドットファイル | 1.5 | 単位 C |
| 5 | ヘッダー（隠す条件・ベースライン・並び） | 2.1、2.2、2.3 | 単位 B（この Task だけ。spec と UI。preview の URL を渡す） |
| 6 | テストの穴 | 3.1、3.2 | 単位 C |
| 7 | 整理（挙動不変） | 4.1〜4.7 | 単位 C |
| 8 | 変異と対照実験 | 5.1〜5.4 | 単位 C |
| 9 | 全コマンド | 5.5 | ブランチ全体のレビュー |

単位 C は Task 2〜4・6〜8 をまとめて 1 回。最後にブランチ全体のレビューを 1 回行う。実装者は worktree に 1 体だけ（並行させない）。

---

### Task 1: 特許の `url` が代表公報を指すことの検証（tasks.md 1.1、design D1）

**Files:**
- Modify: `src/lib/validate.ts`（`validateCareerPatents` とその JSDoc の検査一覧）
- Test: `tests/unit/validate.test.ts`（`patent()` fixture と `describe('validateCareerPatents')`）、`tests/unit/content.test.ts`（`patent()` fixture のみ）

**Interfaces:**
- Produces: `validateCareerPatents(career: Career, lang: Locale): string[]` の返すエラーに `${lang}: url が代表公報を指していない（number: ${number}, url: ${url}）` が加わる。シグネチャは不変

- [ ] **Step 1: fixture を直し、全テストが緑のままであることを確かめる（R-a）**

`tests/unit/validate.test.ts`:

```ts
function patent(over: Partial<Patent> = {}): Patent {
  const number = over.number ?? 'JP6549500B2';
  return {
    filedAt: '2021-03',
    title: 't',
    number,
    countries: ['JP', 'CN', 'US'],
    url: `https://patents.google.com/patent/${number}/ja`,
    ...over,
  };
}
```

`tests/unit/content.test.ts` の `patent(number)` の `url` を `` `https://patents.google.com/patent/${number}/ja` `` にする。`grep -n validate tests/unit/career.test.ts` が空なら career.test は触らない。

Run: `pnpm test` → 全件 PASS

- [ ] **Step 2: 失敗するテストを書く**

`describe('validateCareerPatents', …)` の末尾に:

```ts
  it('url が代表公報を指していればエラーにしない', () => {
    const p = patent({
      number: 'JP7200645B2',
      url: 'https://patents.google.com/patent/JP7200645B2/ja',
    });
    expect(validateCareerPatents(career([p]), 'ja')).toEqual([]);
  });

  it('url が別の公報を指していれば、number と url を含むエラーを返す', () => {
    const url = 'https://patents.google.com/patent/JP7354888B2/ja';
    const errors = validateCareerPatents(career([patent({ number: 'JP7200645B2', url })]), 'ja');
    expect(errors).toEqual([
      `ja: url が代表公報を指していない（number: JP7200645B2, url: ${url}）`,
    ]);
  });

  it('url の公報番号が前方一致するだけならエラーにする', () => {
    const url = 'https://patents.google.com/patent/JP7200645B22/ja';
    const errors = validateCareerPatents(career([patent({ number: 'JP7200645B2', url })]), 'ja');
    expect(errors).toEqual([
      `ja: url が代表公報を指していない（number: JP7200645B2, url: ${url}）`,
    ]);
  });

  it('英語のデータだけ url が別の公報を指していても捕まえる', () => {
    const ja = career([patent({ number: 'JP7200645B2' })]);
    const url = 'https://patents.google.com/patent/JP7354888B2/en';
    const en = career([patent({ number: 'JP7200645B2', url })]);
    expect(validateCareerPatents(ja, 'ja')).toEqual([]);
    expect(validateCareerPatents(en, 'en')).toEqual([
      `en: url が代表公報を指していない（number: JP7200645B2, url: ${url}）`,
    ]);
  });
```

`career()` ヘルパーの名前と形は既存のものに合わせる（`tests/unit/validate.test.ts` の上部を確認）。

- [ ] **Step 3: 赤を見る**

Run: `pnpm test tests/unit/validate.test.ts`
Expected: 新しい 3 件（別の公報・前方一致・英語）が FAIL（`[]` が返る）、「指していればエラーにしない」は PASS

- [ ] **Step 4: 実装する**

`src/lib/validate.ts` の `validateCareerPatents` のループの末尾（title の検査の後）に:

```ts
    // 区切りの完全一致で見る。includes だと JP7200645B22 のような前方一致も通してしまう（design D1）
    if (!new URL(patent.url).pathname.split('/').includes(patent.number)) {
      errors.push(
        `${lang}: url が代表公報を指していない（number: ${patent.number}, url: ${patent.url}）`,
      );
    }
```

（`Array.prototype.includes` は要素の完全一致。文字列の `includes` ではない。）JSDoc の検査一覧に `- url のパスを / で区切った要素のどれかが number と完全に一致すること（代表公報を指すこと）` を足す。

- [ ] **Step 5: 緑と実データを確かめる**

Run: `pnpm test` → 全件 PASS。Run: `pnpm build` → 成功（実データ ja・en 各 65 件が新しい検査を通る）

- [ ] **Step 6: コミット**

```bash
git add src/lib/validate.ts tests/unit/validate.test.ts tests/unit/content.test.ts openspec/changes/followup-minors-3/tasks.md
git commit -m "feat: 特許の url が代表公報を指さなければビルドを落とす"
```

本文に「fixture の url を代表公報の URL に直したのは spec delta に入力を合わせるため（期待値は不変）」と書く。

---

### Task 2: 入稿コマンドの login と一時ディレクトリ（tasks.md 1.3、1.4、design D5）

**Files:**
- Modify: `scripts/photo-add.ts:86-89`（login）、`:109-121`（sharp の catch）
- Test: `tests/unit/photo-add-cli.test.ts`

**Interfaces:**
- Produces: `runPhotoAdd(args, { file?, login?, env? })`（テスト内のヘルパー。`env?: Record<string, string>` を足す）

- [ ] **Step 1 (1.3): 失敗するテストを書く**

既存の「gh のアカウント名が複数行でも、中断の理由は 1 行になる」（84 行付近）の後に:

```ts
  it('gh の出力の先頭行だけが joe-yama でも、出力全体が一致しなければ中断し Release に触れない', () => {
    const r = runPhotoAdd(['x.jpg'], { login: 'joe-yama\nother' });
    expect(r.status).toBe(1);
    expect(r.lines).toHaveLength(1);
    expect(r.lines[0]).toMatch(/^photo:add: gh のアカウントが joe-yama ではない（joe-yama）/);
    expect(r.ghCalls).toEqual(['api user --jq .login']);
  });
```

`ghCalls` の期待値は既存テストが使う形（偽の gh が書く `$*`）に合わせる。`die` の文言に先頭行を使う（design D5）ので括弧の中は `joe-yama` になる。

- [ ] **Step 2: 赤を見る**

Run: `pnpm test tests/unit/photo-add-cli.test.ts`
Expected: 新しいテストが FAIL（先頭行の比較で通り抜け、ファイルの検査や release view に進む）

- [ ] **Step 3: 実装する**

```ts
const loginOutput = gh(['api', 'user', '--jq', '.login']).trim();
if (loginOutput !== 'joe-yama') {
  const login = loginOutput.split('\n')[0];
  die(`gh のアカウントが joe-yama ではない（${login}）。gh auth switch で切り替える`);
}
```

- [ ] **Step 4: 緑を見てコミット**

Run: `pnpm test tests/unit/photo-add-cli.test.ts` → 全件 PASS（既存の「複数行でも 1 行」も緑）

```bash
git add scripts/photo-add.ts tests/unit/photo-add-cli.test.ts openspec/changes/followup-minors-3/tasks.md
git commit -m "fix: 入稿コマンドの gh のアカウント確認を出力全体で比べる"
```

- [ ] **Step 5 (1.4): 失敗するテストを書く**

`runPhotoAdd` に `env` を足す:

```ts
function runPhotoAdd(
  args: string[],
  {
    file = '',
    login = 'joe-yama',
    env = {},
  }: { file?: string | Buffer; login?: string; env?: Record<string, string> } = {},
) {
  // …
    env: { ...process.env, PATH: dir, ...env },
```

JSDoc に `env は spawn の環境変数に上書きで足す（TMPDIR の差し替えに使う）` を 1 行足す。既存の「EXIF は読めても画素が壊れた JPEG は…」（103 行）の fixture の作り方をそのまま使い、その後に:

```ts
  it('画素が壊れた JPEG で中断しても、作業用の一時ディレクトリを残さない', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'photo-add-tmpdir-'));
    dirs.push(tmp);
    const r = runPhotoAdd(['x.jpg'], { file: /* 103 行のテストと同じ壊れた JPEG */, env: { TMPDIR: tmp } });
    expect(r.lines).toEqual(['photo:add: 画像として読めない: x.jpg']);
    expect(readdirSync(tmp).filter((name) => name.startsWith('photo-add-'))).toEqual([]);
  });
```

壊れた JPEG を作るコードが 103 行のテストの中にあるなら、`brokenPixelJpeg()` のような関数に切り出して両方から使う（コピーしない）。`readdirSync` を import に足す。

- [ ] **Step 6: 赤を見る**

Run: `pnpm test tests/unit/photo-add-cli.test.ts`
Expected: 新しいテストが FAIL（`photo-add-XXXXXX` が 1 件残る）。Node の `os.tmpdir()` が `TMPDIR` を読むことはこの赤で確かめられる（残る場所が `tmp` の中であること）

- [ ] **Step 7: 実装する**

`scripts/photo-add.ts` の sharp の catch:

```ts
} catch {
  rmSync(work, { recursive: true, force: true });
  die(`画像として読めない: ${file}`);
}
```

`rmSync` を `node:fs` の import に足す（既にあれば不要）。

- [ ] **Step 8: 緑を見てコミット**

Run: `pnpm test tests/unit/photo-add-cli.test.ts` → 全件 PASS

```bash
git add scripts/photo-add.ts tests/unit/photo-add-cli.test.ts openspec/changes/followup-minors-3/tasks.md
git commit -m "fix: 入稿コマンドが縮小に失敗したら一時ディレクトリを消してから中断する"
```

---

### Task 3: e2e のセットアップの pid（tasks.md 1.2、design D4）

**Files:**
- Modify: `tests/e2e/global-setup.ts`

- [ ] **Step 1: status の実際の出力を確かめる（実測 8）**

`lsof -i :4399` が空であることを確かめてから、`pnpm exec astro preview status --json`（停止中）を実行し、次に `pnpm build && pnpm exec astro preview --port 4399 --host 127.0.0.1 --background` の後にもう一度実行し、出力を記録する。最後に `pnpm exec astro preview stop`。

- [ ] **Step 2: 実装する**

- `parsePreviewPid` の `export` を外す（`grep -rn parsePreviewPid tests src` で他に使われていないことを確かめる）
- 起動中の message が常に `pid N` を含むなら、`isPreviewAlreadyRunning()` を消して `globalSetup` の条件を `currentPreviewPid() !== null || (await isPortOccupied())` にし、`execSync('pnpm exec astro preview status --json', …)` を `currentPreviewPid` の 1 か所だけにする。`isPreviewAlreadyRunning` の上のコメント（別ポートで動いていると 60 秒待つ、exit 0 で終わる）は `globalSetup` の条件の上に移す。含まないなら寄せず、理由を報告に書く
- 起動後:

```ts
  const pid = currentPreviewPid();
  if (pid === null) {
    throw new Error(
      'astro preview を起動したが pid を取得できなかった。teardown が止められないので検査を始めない。' +
        '`pnpm exec astro preview stop` で停止してから再実行すること。',
    );
  }
```

を `writeFileSync(STARTED_MARKER, …)` の前に置く（マーカーを書かない）

- [ ] **Step 3: 緑を見る**

Run: `lsof -i :4399`（空）→ `pnpm e2e` → 全件 PASS。終わった後 `pnpm exec astro preview status --json` が停止中を返す（teardown が止めた）

- [ ] **Step 4: コミット**

```bash
git add tests/e2e/global-setup.ts openspec/changes/followup-minors-3/tasks.md
git commit -m "fix: e2e のセットアップが preview の pid を取れなければ失敗する"
```

変異 (g) は Task 8 で確かめる。

---

### Task 4: e2e の cwd 依存とドットファイル（tasks.md 1.5、design D3）

**Files:**
- Modify: `tests/e2e/pages.spec.ts:75-76`、`tests/e2e/sitemap.spec.ts:18`、`tests/e2e/paths.ts`

- [ ] **Step 1: 修正前の対照を記録する（5.3 の対照）**

```sh
W=$(pwd)   # worktree の root
cd "$S" && "$W/node_modules/.bin/playwright" test -c "$W/playwright.config.ts" 2>&1 | tail -20; cd "$W"
```

Expected: `pages.spec.ts:75` の `ENOENT`（`src/content/career/ja.yaml`）で落ちる。出力の該当行を報告に残す。`$S` はこの計画の「隔離実行の手順」の scratchpad

- [ ] **Step 2: 実装する**

`pages.spec.ts`:

```ts
import { fileURLToPath } from 'node:url';
// …
/** cwd に依存せず、このファイルの位置からリポジトリの経歴データを読む */
const careerYaml = (lang: Locale) =>
  fileURLToPath(new URL(`../../src/content/career/${lang}.yaml`, import.meta.url));

const patentsByLang: Record<Locale, PatentSummary[]> = {
  ja: parsePatents(careerYaml('ja')),
  en: parsePatents(careerYaml('en')),
};
```

`sitemap.spec.ts`:

```ts
import { fileURLToPath } from 'node:url';
// cwd に依存せず、このファイルの位置から dist を解決する
const dist = fileURLToPath(new URL('../../dist', import.meta.url));
// …
    .flatMap((lang) => builtPages(join(dist, lang), `${lang}/`))
```

`paths.ts`:

```ts
/** 写真の slug（…）。Astro の glob `*.yaml` はドットファイルに一致しないので、同じく除く */
const photoSlugs = readdirSync(photosDir)
  .filter((name) => name.endsWith('.yaml') && !name.startsWith('.'))
```

- [ ] **Step 3: 緑を見る（5.3）**

Run: `lsof -i :4399`（空）→ Step 1 と同じコマンド（cwd がリポジトリの外）→ 全件 PASS。出力の最後の数行を報告に残す

- [ ] **Step 4: コミット**

```bash
git add tests/e2e/pages.spec.ts tests/e2e/sitemap.spec.ts tests/e2e/paths.ts openspec/changes/followup-minors-3/tasks.md
git commit -m "fix: e2e が YAML と dist を cwd に依らず読み、写真のドットファイルを数えない"
```

tasks.md の 1.5 と 5.3 を両方チェックする（5.3 の対照と緑はこの Task で取った）。

---

### Task 5: ヘッダー（tasks.md 2.1、2.2、2.3、design D2）

**Files:**
- Modify: `src/components/Header.astro`（`<style>` だけ）
- Test: `tests/e2e/links.spec.ts`

- [ ] **Step 1 (2.1): 479px を足し、メディアクエリを直す**

`links.spec.ts` の `for (const { width, iconsVisible } of [...])` に `{ width: 479, iconsVisible: false }` を足す（390 と 480 の間）。`Header.astro`:

```css
  @media not all and (min-width: 30rem) {
```

（`(width < 30rem)` は古い Safari で規則ごと無視されるので使わない。コメントの「30rem 未満」はそのまま。）

Run: `pnpm e2e tests/e2e/links.spec.ts` → 390 / 479 / 480px の検査が全件 PASS

```bash
git add src/components/Header.astro tests/e2e/links.spec.ts openspec/changes/followup-minors-3/tasks.md
git commit -m "fix: ヘッダーのアイコンを隠す条件を 30rem 未満に厳密に合わせ、479px を検査する"
```

- [ ] **Step 2 (2.2): ベースラインの検査を書く（RED）**

`links.spec.ts` に:

```ts
/**
 * 要素の最初の空でないテキストノードの文字のベースライン（viewport 基準の y）。
 * Range の矩形の上端は行の内容領域の上端（= ベースライン − ascent）なので、
 * その要素の計算済みフォントで測った fontBoundingBoxAscent を足す（design D2）
 */
function textBaseline(link: Locator): Promise<number> {
  return link.evaluate((el) => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node && !node.textContent?.trim()) node = walker.nextNode();
    if (!node) throw new Error('テキストが無い');
    const range = document.createRange();
    range.selectNodeContents(node);
    const top = range.getBoundingClientRect().top;
    const context = document.createElement('canvas').getContext('2d');
    if (!context) throw new Error('canvas が使えない');
    context.font = getComputedStyle(node.parentElement ?? el).font;
    return top + context.measureText('x').fontBoundingBoxAscent;
  });
}

for (const viewport of [
  { width: 1280, height: 720 },
  { width: 480, height: 844 },
]) {
  for (const path of ['ja/', 'en/']) {
    test(`${viewport.width}×${viewport.height} の ${path} でロゴとナビの文字のベースラインがそろう`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto(path);
      await page.evaluate(() => document.fonts.ready);
      const logo = await textBaseline(page.locator('header .logo'));
      const links = page.locator('header nav a');
      await expect(links).toHaveCount(3);
      for (const link of await links.all()) {
        const name = await link.textContent();
        expect(Math.abs((await textBaseline(link)) - logo), name ?? '').toBeLessThanOrEqual(0.5);
      }
    });
  }
}
```

spec の Scenario は「`/ja/` と `/en/` の下のページ」なので、トップ 2 つで代表させる（ヘッダーは全ページ同じ部品）。

Run: `pnpm e2e tests/e2e/links.spec.ts -g ベースライン`
Expected: **1280px が FAIL で差が 1.8px 前後**（失敗メッセージの Received を報告に残す）。赤にならない、または差が大きく外れる（例: 5px 以上）なら測り方の誤りなので、Range・font の取り方を直してから進む（design D2）。480px の結果も記録する

- [ ] **Step 3 (2.2): CSS を直す（GREEN）**

第一候補（design D2。未検証）:

```css
  nav a {
    display: inline-flex;
    align-items: baseline;
    gap: 0.35em;
  }
  nav a :global(svg) {
    align-self: center;
  }
```

0.5px 以内にならなければ別の書き方を探してよい。保つもの: 「アイコン付きリンクが文字の行より高くならない」（480 / 1280px）、390 / 479 / 480px の表示と同じ行の検査。

Run: `pnpm e2e tests/e2e/links.spec.ts` → 全件 PASS

```bash
git add src/components/Header.astro tests/e2e/links.spec.ts openspec/changes/followup-minors-3/tasks.md
git commit -m "fix: ヘッダーのロゴとナビの文字のベースラインをそろえる"
```

- [ ] **Step 4 (2.3): リンクの並びの検査**

```ts
for (const { path, expected } of [
  {
    path: 'ja/career/',
    expected: ['/portfolio/ja/', '/portfolio/ja/photos/', '/portfolio/ja/career/', '/portfolio/en/career/'],
  },
  {
    path: 'en/',
    expected: ['/portfolio/en/', '/portfolio/en/photos/', '/portfolio/en/career/', '/portfolio/ja/'],
  },
]) {
  test(`${path} のヘッダーのリンクはロゴ → Photos → Career → 言語切り替えの順`, async ({ page }) => {
    await page.goto(path);
    const hrefs = await page
      .locator('header a')
      .evaluateAll((links) => links.map((a) => a.getAttribute('href')));
    expect(hrefs).toEqual(expected);
  });
}
```

期待値は `site.ts` から導かず直書きする（実装と同じ関数から作ると並びの誤りを捕まえられない）。

Run: `pnpm e2e tests/e2e/links.spec.ts -g 順` → PASS

```bash
git add tests/e2e/links.spec.ts openspec/changes/followup-minors-3/tasks.md
git commit -m "test: ヘッダーのリンクの並びを確かめる"
```

---

### Task 6: テストの穴（tasks.md 3.1、3.2）

**Files:**
- Test: `tests/unit/content.test.ts`、`tests/e2e/viewport.spec.ts`

- [ ] **Step 1 (3.1): `getFeaturedPhoto` の 0 枚**

`import { getCareer, getFeaturedPhoto, getPhotos } from '../../src/lib/content';` にし、`describe('getPhotos の検証の配線')` を次にする:

```ts
describe('getPhotos の検証の配線', () => {
  beforeEach(() => {
    photoEntries.list = [];
  });

  it('写真が 0 枚ならビルドを止め、代表写真が無いことを示す', async () => {
    await expect(getPhotos()).rejects.toThrow(
      /photos の内容に問題がある[\s\S]*featured[\s\S]*0 枚/,
    );
  });

  // getFeaturedPhoto が getPhotos（検証）を通らず getCollection を直接読むと、
  // 別の文言で落ちるか undefined を返す
  it('getFeaturedPhoto も写真が 0 枚なら同じ検証で止まる', async () => {
    await expect(getFeaturedPhoto()).rejects.toThrow(
      /photos の内容に問題がある[\s\S]*featured[\s\S]*0 枚/,
    );
  });
});
```

既存テストの本文の `photoEntries.list = [];` は `beforeEach` に移したので消す。これは新しい番人なので赤は Task 8 の変異 (k) で見る（今の実装では最初から緑）。

Run: `pnpm test tests/unit/content.test.ts` → PASS

```bash
git add tests/unit/content.test.ts openspec/changes/followup-minors-3/tasks.md
git commit -m "test: 写真が 0 枚なら getFeaturedPhoto も検証で止まることを確かめる"
```

- [ ] **Step 2 (3.2): 横スクロールの検査**

`viewport.spec.ts` の「回帰: 390×844 で横スクロールが発生しない」を:

```ts
test('回帰: 390×844 で横スクロールが発生しない（トップと個別ページ）', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [label, path] of [
    ['トップページ', './ja/'],
    ['個別ページ', `./ja/photos/${verticalSlug}/`],
  ] as const) {
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `${label}: 横スクロールが発生している（scrollWidth − clientWidth）`).toBeLessThanOrEqual(0);
  }
});
```

Run: `pnpm e2e tests/e2e/viewport.spec.ts -g 横スクロール` → PASS

```bash
git add tests/e2e/viewport.spec.ts openspec/changes/followup-minors-3/tasks.md
git commit -m "test: 横スクロールの検査が失敗時にはみ出し幅を出すようにする"
```

---

### Task 7: 整理（tasks.md 4.1〜4.7、挙動不変）

各項目を 1 コミットずつ。どれも `pnpm test`（e2e を触る 4.2 は `pnpm e2e tests/e2e/links.spec.ts`）が緑であることを確かめてからコミットする。

- [ ] **4.1**: `tests/unit/site.test.ts` の describe「導線のアイコン（design D1）」（60-70 行）を消す。実測 4 のとおり `navLinks` / `languageSwitch` の `toEqual` が ja・en の両方でアイコンを含むので主張は全部重複する。消す前に両方の `toEqual` に `icon` があることを目で確かめ、報告に書く。`test: 導線のアイコンの重複したテストを消す`
- [ ] **4.2**: `tests/e2e/links.spec.ts` の同じ行の判定（`logo` と各 `box`）の `evaluate(getBoundingClientRect)` 2 か所を `boundingBox()` にする:

```ts
      const logo = await page.locator('header .logo').boundingBox();
      if (!logo) throw new Error('ロゴが表示されていない');
      for (const link of await links.all()) {
        const box = await link.boundingBox();
        if (!box) throw new Error('リンクが表示されていない');
        expect(box.y).toBeLessThan(logo.y + logo.height);
        expect(box.y + box.height).toBeGreaterThan(logo.y);
      }
```

（`boundingBox()` はページ基準、`getBoundingClientRect` は viewport 基準だが、同じページの 2 要素の比較なので差は消える。）`refactor: ヘッダーの同じ行の判定を boundingBox で書く`
- [ ] **4.3**: `src/lib/site.ts:22` の JSDoc を実測 2 の例の趣旨に。`docs: CareerSection の JSDoc を実態に合わせる`
- [ ] **4.4**: `tests/unit/theme.test.ts:69` のテスト名を `'3 桁や 8 桁の色は抽出の時点で例外にする（輝度計算が 6 桁だけを扱うため）'` にする。`test: theme のテスト名を今の挙動に合わせる`
- [ ] **4.5**: `tests/unit/content.test.ts` の「ja と en の両方にエラーがあれば…」を:

```ts
    const error = await getCareer('ja').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(Error);
    const { message } = error as Error;
    expect(message).toMatch(/^career の内容に問題がある/);
    expect(message).toContain('ja: number が重複している（number: JP6549500B2）');
    expect(message).toContain('en: number が重複している（number: JP7200645B2）');
```

`test: ja と en の両方のエラーを並び順に依らず確かめる`
- [ ] **4.6**: `src/content/schemas.ts:19` の JSDoc を実測 3 の趣旨に。`docs: existsOnCalendar の JSDoc を実態に合わせる`
- [ ] **4.7**: `tests/unit/schemas.test.ts:215` の `it.each` を、`parse` が `value` を受け取る形にする:

```ts
  it.each([
    {
      field: 'careerSchema の achievements[].kind',
      value: 'blog',
      parse: (kind: string) =>
        careerSchema.safeParse({
          ...validCareer,
          achievements: [{ ...validCareer.achievements[0], kind }],
        }),
    },
    {
      field: 'profileSchema の links[].kind',
      value: 'mastodon',
      parse: (kind: string) =>
        profileSchema.safeParse({ ...validProfile, links: [{ ...validProfile.links[0], kind }] }),
    },
  ])('$field は列挙に無い $value を拒否する', ({ value, parse }) => {
    expect(parse(value).success).toBe(false);
  });
```

`refactor: kind の列挙のテストでリテラルを 1 か所にする`

---

### Task 8: 変異と対照実験（tasks.md 5.1、5.2、5.4）

すべて「隔離実行の手順」で行う。変異ごとに新しい `$EXP`。結果は表（変異 / 対象ファイルと書き換え / 赤になったテスト名 / 対照の緑）にして報告と ledger に残す。

- [ ] **5.1**: 次の変異で、狙ったテストが赤になることを確かめる
  - (a) `validate.ts` の url の検査を丸ごと外す → Task 1 の 3 件が赤
  - (b) `pathname.split('/').includes(patent.number)` を `patent.url.includes(patent.number)` にする → 前方一致のケースだけが赤
  - (c) url の検査を `if (lang === 'ja' && …)` にする → 英語のケースが赤
  - (d) `Header.astro` の `30rem` を `27rem` にする → 479px の検査が赤（e2e）
  - (e) Task 5 の 2.2 の CSS を修正前に戻す → 1280px のベースラインの検査が赤（e2e）
  - (f) `Header.astro` の `navLinks(lang, base).map` を `navLinks(lang, base).toReversed().map` にする → 並びの検査が赤（e2e）
  - (g) `global-setup.ts` の `if (pid === null) throw` を外し、`const pid = currentPreviewPid();` を `const pid = null as number | null;` にする → `pnpm e2e` が teardown で preview を止めない（実行後に `pnpm --dir "$EXP" exec astro preview status --json` が起動中を返す）ことを確かめ、throw を戻すと e2e 全体が setup で失敗することを確かめる。最後に `pnpm --dir "$EXP" exec astro preview stop`
  - (h) `photo-add.ts` の比較を `.split('\n')[0]` に戻す → 1.3 のテストが赤
  - (i) `photo-add.ts` の `rmSync(work, …)` を外す → 1.4 のテストが赤
  - (j) `paths.ts` の `!name.startsWith('.')` を外し、`$EXP/src/content/photos/.draft.yaml` に既存の写真 YAML の複製を置く → pages.spec の `.draft` のページが 404 で赤。対照: 除外があれば `.draft.yaml` を置いても緑
  - (k) `content.ts` の `getFeaturedPhoto` を `(await getCollection('photos')).find((p) => p.data.featured)` にする（`getPhotos` を通らない）→ 3.1 のテストが赤
- [ ] **5.2**: `$EXP/src/content/career/ja.yaml` の末尾（patents の後）に、patents の最初の 1 件を複製した `patentsX:` の区画を足す。今の `parsePatents` では pages.spec の特許の検査が緑（件数が変わらない）、`$EXP/tests/e2e/pages.spec.ts` の `/^patents:\s*$/` を `/^patents:/` に変えると特許の件数の検査が赤になる
- [ ] **5.4**: 書き換えたテストが書き換え前と同じ変異で落ちることを確かめる
  - 3.2: `$EXP` の `src/styles/global.css` か該当ページに横にはみ出す要素を足す変異（例: `main` に `width: 200vw`）→ 書き換え前（`git show HEAD~N:tests/e2e/viewport.spec.ts` を置いた複製）と書き換え後の両方で赤。書き換え後はメッセージにはみ出し幅が出る
  - 4.1: `site.ts` の `navLinks` の Career の `icon` を `camera` にする → 残った `navLinks` の `toEqual` が赤（消す前は D1 の describe も赤だったことを、消す前のコミットの複製で確かめる）
  - 4.2: `Header.astro` の `nav` に `flex-basis: 100%` を当てて 2 行にする → 同じ行の検査が書き換え前後の両方で赤
  - 4.5: `content.ts` で en の検証を外す（`validateCareerPatents(en, 'en')` を呼ばない）→ 書き換え前後の両方で赤
  - 4.7: `schemas.ts` の `achievementKindSchema` に `'blog'` を足す → 書き換え前後の両方で赤
- [ ] コミット: 検証だけなので tasks.md のチェックだけのコミットでよい。`test: followup-minors-3 の番人に変異を当てて確かめる`

---

### Task 9: 全コマンド（tasks.md 5.5）

- [ ] `pnpm lint` / `pnpm typecheck` / `pnpm test` / `pnpm build` / `lsof -i :4399`（空）→ `pnpm e2e` をすべて実行し、各コマンドと出力の末尾を報告に添える
- [ ] tasks.md の 5.5 をチェックしてコミット: `test: followup-minors-3 の全コマンドを通す`

---

## Self-Review（計画作成時）

- **spec の網羅**: content-schema の新しい 4 Scenario（指す / 別の公報 / 前方一致 / 英語だけ）→ Task 1。layout-shell の「479px を隠す」→ Task 5 Step 1、「ベースライン」→ Step 2〜3、ヘッダーの並び（既存要求の番人）→ Step 4
- **tasks.md の網羅**: 1.1 → T1、1.2 → T3、1.3・1.4 → T2、1.5・5.3 → T4、2.1〜2.3 → T5、3.1・3.2 → T6、4.1〜4.7 → T7、5.1・5.2・5.4 → T8、5.5 → T9
- **名前の一貫**: `validateCareerPatents` のエラー文 `${lang}: url が代表公報を指していない（number: …, url: …）` は Task 1 のテストと実装で同じ。`runPhotoAdd` の `env` は Task 2 の中だけ
