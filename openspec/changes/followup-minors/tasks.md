# Tasks

レビュー単位（`.claude/rules/review.md`）: 単位 1（共有インターフェース: スキーマと検証）はタスク単位でレビュー。単位 2（入稿スクリプト）と単位 3（e2e）はそれぞれまとめて 1 回。最後にブランチ全体を 1 回。各項目の出典は仕分け（2026-09-23）で、行番号は main 43a0e86 時点。

## 1. スキーマと検証（単位 1）

- [x] 1.1 特許の `url` を必須にする（`src/content/schemas.ts` の特許スキーマ）。`PatentItem.astro` の `patent.url ? … : …` を常にリンクに。関係する単体テスト・e2e（`tests/e2e/pages.spec.ts` の「url を持つ項目だけがリンク」は日英リンク比較テストと重複しているので、「すべての見出しがリンク」の 1 本に置き換える）を spec delta（content-schema / profile-and-career）に合わせる。`docs/content-authoring.md:18` に `url` が必須であることを書き足す
- [x] 1.2 `validateCareerPatents` に言語ごとの `number` 重複検出を足す（エラーに `number` を含める）。`lang` 引数を `Locale` 型にする（`src/lib/validate.ts:126-147`）
- [x] 1.3 `getCareer`（`src/lib/content.ts`）の検証の配線を守る単体テスト: `astro:content` を `vi.mock` し、公報番号が重複したデータで例外になることを確かめる（design D3。効かなければ「提案」に記録）
- [x] 1.4 `validate.ts` の比較ループ（`:59-116`、certifications / achievements / patents / skills）を `[key, keyOf]` の表に一本化する（挙動不変）
- [x] 1.5 `isCalendarDate`（`src/content/schemas.ts:12-15`）を `Date.UTC` ベースにして年 0001〜0099 の誤判定を直す（テストを先に）
- [x] 1.6 `src/lib/theme.ts` の `TOKEN_NAMES` 恒等写像と未使用の `export type Tokens` を削る。`ogLocale`（`src/lib/site.ts:124-126`）を `locales` から導く
- [x] 1.7 `src/lib/career.ts`: `splitPatents<T>` の不要なジェネリックを外し、`sortPatents` の JSDoc を整理。`tests/unit/career.test.ts:86-138` の共有可変フィクスチャ・`title:'t'`・6 件 / 12 件の重複テストを整理する
- [x] 1.8 `src/pages/[lang]/career.astro:42,108`: `ui[lang].present` と `career.patents.length` の参照を他区画と同じ派生変数の書き方に揃える（挙動不変）

## 2. 入稿スクリプト（単位 2）

- [x] 2.1 `scripts/photo-add.ts`: `parseCliArgs` と `toSlug` の呼び出しを 1 行中断の経路に入れる。`parseArgs` の例外は原因を 1 行に含めて使い方を出す（`:56-70`）。GitHub への問い合わせより前に止まること（spec delta photo-pipeline の 2 Scenario）
- [x] 2.2 `toSlug`（`src/lib/photo-meta.ts:21-39`）で末尾が `.` の slug を拒否する
- [x] 2.3 `src/content/photos` と `node_modules/.astro/assets` の削除・参照を cwd 相対からスクリプト基準の絶対パスにする（`scripts/photo-add.ts:33,136`）
- [x] 2.4 ponytail: `MISSING_FIELD_LABELS` + `translateMissingFields` の中間表現、冗長な JSDoc・手順番号コメントを簡素化（`src/lib/photo-meta.ts:146-159` ほか、挙動不変）

## 3. e2e（単位 3）

- [x] 3.1 `tests/e2e/paths.ts` で `src/content/photos/*.yaml` から slug を導き、全写真の個別ページ（日英）を対象に含める。`pages.spec.ts` の `pagePaths` もそこから作る
- [x] 3.2 `a11y.spec.ts` / `network.spec.ts` で `page.goto` の応答ステータスが 200 であることを確かめる
- [x] 3.3 `pages.spec.ts` の整理: 未使用の `patentsByLang.en`（:59）、到達しない `canonical ?? ''`（:153）、本体に無い `formatMonth` の `'long'` 分岐（:48-54）を消す。`parsePatents`（:16-32）の走査を `patents:` 区画に限る。「同数なら新しい順」のテストでタイブレークも確かめる（:230-234）
- [x] 3.4 `tests/e2e/global-setup.ts:47-59`: `isPreviewAlreadyRunning` の補助チェックとマーカーパス定数を簡素化（挙動不変）

## 4. 番人の確認と仕上げ

- [x] 4.1 番人が本当に番人か確かめる: (a) 特許の `url` を 1 件消す、(b) 公報番号を 1 件重複させる、(c) `content.ts` から `validateCareerPatents` の呼び出しを消す（1.3 が効いた場合）、(d) `isCalendarDate` を元の `new Date(y, m-1, d)` に戻す、(e) `toSlug` の末尾 `.` 拒否を外す、(f) e2e の対象ページに存在しない slug を 1 つ混ぜる（3.2 のステータス検査が赤になる）を 1 つずつ当て、赤になることを報告する。手順は `docs/harness/README.md`（変異なしで緑・変異ありで赤の対照を取る。作業ツリーを直接変異させたら復元して `git status` で確認）

  変異はすべて隔離複製（HEAD 906c4ad を `git archive` で scratchpad に展開し `pnpm install --frozen-lockfile --offline`）の中で、変異ごとに新しい複製を作って 1 つずつ当てた。作業ツリーは変異させていない。対照（変異なし）は単体テストが各複製で緑（`RUN  v5.0.1 <複製のパス>` で複製を見ていることを確認）、ビルドが 12 page(s) built、e2e が 75 passed。

  | 変異 | 当てた場所 | 落ちたテスト（またはビルドのエラー） | 結果 |
  |---|---|---|---|
  | a 特許の `url` を 1 件消す | `src/content/career/ja.yaml` の `patents:` 先頭（`JP7200645B2`）の `url:` の行 | `pnpm build` が `[InvalidContentEntryDataError] career → ja data does not match collection schema.` / `patents.0.url: Required` | 落ちた |
  | a2 `url` を任意に戻す | `src/content/schemas.ts` の `patentSchema` の `url: z.url()` → `z.url().optional()` | `tests/unit/schemas.test.ts` の「url が無ければ失敗する」 | 落ちた（1 件） |
  | b 公報番号を 1 件重複させる | `src/content/career/ja.yaml` の `patents:` 2 件目の `number` を 1 件目と同じ `JP7200645B2` に | `pnpm build` が `career/ja の内容に問題がある:` / `- ja: number が重複している（number: JP7200645B2）` | 落ちた |
  | c-ja `ja` の検証の呼び出しを消す | `src/lib/content.ts` の `assertValid(validateCareerPatents(ja.data, 'ja'), …)` の行 | `tests/unit/content.test.ts` の「日本語のデータで公報番号が重複していれば例外を投げる」（`promise resolved … instead of rejecting`） | 落ちた（1 件） |
  | c-en `en` の検証の呼び出しを消す | 同ファイルの `validateCareerPatents(en.data, 'en')` の行 | 同「英語のデータで公報番号が重複していれば例外を投げる」（同上） | 落ちた（1 件） |
  | d `isCalendarDate` を元に戻す | `src/content/schemas.ts` の `isCalendarDate` を `new Date(y, m - 1, d)` と `getFullYear` / `getMonth` / `getDate` の比較に | `tests/unit/schemas.test.ts` の「takenAt も年 0001〜0099 の実在する日を受け付ける」「0050-02-28…」「0099-12-31…」「0004-02-29…」 | 落ちた（4 件） |
  | e `toSlug` の末尾 `.` の拒否を外す | `src/lib/photo-meta.ts` の `\|\| slugArg.endsWith('.')` | `tests/unit/photo-meta.test.ts` の「--slug が . で終わる値は例外にする…」、`tests/unit/photo-add-cli.test.ts` の「--slug kamo-river. は GitHub に問い合わせる前に 1 行で中断し…」 | 落ちた（2 件） |
  | f e2e の対象に存在しない slug を混ぜる | `tests/e2e/paths.ts` の `photoSlugs` の後に `photoSlugs.push('no-such-photo');` | `ja/photos/no-such-photo/` と `en/photos/no-such-photo/` の a11y・network・pages（いずれも `Expected: 200` / `Received: 404`） | 落ちた（6 件、75 passed） |
  | f 対照: Task 12 の前（89621d0）に同じ変異 | 同上 | pages の 2 件だけ落ち、a11y と network の `no-such-photo` 4 件は緑のまま（2 failed / 79 passed） | ステータス検査が無かった頃は a11y / network が 404 ページを検査して緑になる穴があったことを確認 |
- [x] 4.2 `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm e2e` がすべて緑

## 提案（本 change のスコープ外・後続への申し送り）

### 実装時の裁定（計画作成時に決め、ledger に記録済み）

- 1.4: skills は表に含めない。skills は Record で、エラー文にカテゴリ名が入るため形が違う（比較ループが 1 本残る）
- 1.5: `Date.UTC` も年 0〜99 を 1900 年代に読み替える（実測）ため、`setUTCFullYear(y, m - 1, d)` を使った
- 2.3: 単体テストは置かず、隔離複製で別の cwd から実行して前後を実測した（単体テストだと作業ツリーの `src/content/photos` と `node_modules/.astro/assets` を書き換える）
- 3.2: 404 ページも a11y / network の対象に残し、`expectedStatus` で 404 ページだけ 404 を期待する
- 3.4: `isPreviewAlreadyRunning` の補助チェックは消さず短くした（消すと別ポートの同 root preview で 60 秒待って落ちる）
- `pnpm photo:add` 経由で出る pnpm 自身の `ELIFECYCLE` 行は、spec の「1 行で中断」に数えない（スクリプトの外の出力で、変更前から同じ）

### レビューで出た Minor と ponytail（修正ラウンドを起こさず後続に回す）

スキーマと検証（単位 1）
- `src/pages/[lang]/career.astro:120` の `ui[lang].morePatents` が派生変数になっていない
- `tests/unit/career.test.ts:2,88` の `Patent` 型エイリアスが `src/content/schemas.ts:89` の export と重複。`splitPatents` の型も `Patent[]` で書けば 1 行に収まる
- `tests/e2e/pages.spec.ts` の「すべての特許の見出しが Google Patents へのリンクになる」は URL の接頭辞だけを見ていて、項目と `url` の対応は見ていない（YAML の `url` と集合で比べれば守れる）
- `tests/unit/validate.test.ts` の特許のリテラル 7 か所を、既存の `patent()` を describe の外に出して置き換える（約 -50 行）
- `tests/unit/validate.test.ts` の重複エラーのテストが、先頭の言語（`ja:` / `en:`）を確かめていない
- `tests/unit/content.test.ts`: `getCareer('ja')` を呼んでいないので `return en.data` の変異が生き残る。`validateCareerPatents` に渡す `lang` を入れ替える変異も生き残る（ja の見出しの上限が 90 に緩む）。未使用の `getCollection` のモック、通らない `undefined` の分岐、自前の `Patent` 型を削れる
- `tests/unit/schemas.test.ts`: 年 0001〜0099 の存在しない日（`0050-02-29`、`0001-02-29`）を拒むテストが無い（`y < 100` なら true の変異が生き残る）。年 0000 は「常に拒否」から「実在すれば受理」に変わったが、テストで固定していない
- `src/lib/validate.ts` の `INDEXED_KEYS`: キーをまたいだエラーの順序（certifications → achievements → patents）を固定するテストが無い（行の入れ替えが生き残る。変更前からの穴）

入稿スクリプト（単位 2）
- `tests/unit/photo-add-cli.test.ts`: `../../x` は先頭 `.` の分岐で止まり、パス区切りの分岐を通っていない（`photo-meta.test.ts` では守れている）。作った一時ディレクトリを消さない（`afterAll` で消す）。PATH の先頭に偽の `gh` を足すだけなので、偽物が実行できないと本物の `gh` に落ちる（PATH を偽の `gh` のディレクトリだけにする）
- 撮影情報の欠損で中断するときの文言を、子プロセスで確かめるテストが無い（今回は隔離複製で前後を手で比べた）
- `ghFailureMessage`（`src/lib/photo-meta.ts`）は、gh が空白だけの stderr で失敗すると複数行になる。`scripts/photo-add.ts` のアカウント確認は、login に改行があると 2 行になる（どちらも #35 由来）
- `src/lib/photo-meta.ts` の JSDoc 2 行が 100 字を超えている

e2e（単位 3）
- `tests/e2e/global-setup.ts`: 「`astro preview status` は起動の有無にかかわらず終了コード 0 を返すので message を見る」理由のコメントが消えた
- `tests/e2e/pages.spec.ts` の `parsePatents`: 行頭の YAML コメントでも `patents:` の区画が終わり、`startsWith('patents:')` は `patentsX:` にも一致する。タイブレークの `expect(hasTie)` に失敗時の理由が無い。ローカルの `locales` を `src/lib/i18n` から import する。`description ?? ''` を `canonical` と同じ形にする
- `tests/e2e/paths.ts`: slug をファイル名そのまま作っており、Astro の glob loader の決め方（slug 化、`slug` キー）とずれうる（前提をコメントに書く）。`photoSlugs` の `export` はどこからも使われていない
- `tests/e2e/viewport.spec.ts:10` の写真の slug が直書きのまま（本 change では触らないファイル）
- `tests/e2e/global-teardown.ts` の `currentPreviewPid` は `global-setup.ts` の `parsePreviewPid` と同じ処理（export して使い回せる）
