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
- [ ] 2.4 ponytail: `MISSING_FIELD_LABELS` + `translateMissingFields` の中間表現、冗長な JSDoc・手順番号コメントを簡素化（`src/lib/photo-meta.ts:146-159` ほか、挙動不変）

## 3. e2e（単位 3）

- [ ] 3.1 `tests/e2e/paths.ts` で `src/content/photos/*.yaml` から slug を導き、全写真の個別ページ（日英）を対象に含める。`pages.spec.ts` の `pagePaths` もそこから作る
- [ ] 3.2 `a11y.spec.ts` / `network.spec.ts` で `page.goto` の応答ステータスが 200 であることを確かめる
- [ ] 3.3 `pages.spec.ts` の整理: 未使用の `patentsByLang.en`（:59）、到達しない `canonical ?? ''`（:153）、本体に無い `formatMonth` の `'long'` 分岐（:48-54）を消す。`parsePatents`（:16-32）の走査を `patents:` 区画に限る。「同数なら新しい順」のテストでタイブレークも確かめる（:230-234）
- [ ] 3.4 `tests/e2e/global-setup.ts:47-59`: `isPreviewAlreadyRunning` の補助チェックとマーカーパス定数を簡素化（挙動不変）

## 4. 番人の確認と仕上げ

- [ ] 4.1 番人が本当に番人か確かめる: (a) 特許の `url` を 1 件消す、(b) 公報番号を 1 件重複させる、(c) `content.ts` から `validateCareerPatents` の呼び出しを消す（1.3 が効いた場合）、(d) `isCalendarDate` を元の `new Date(y, m-1, d)` に戻す、(e) `toSlug` の末尾 `.` 拒否を外す、(f) e2e の対象ページに存在しない slug を 1 つ混ぜる（3.2 のステータス検査が赤になる）を 1 つずつ当て、赤になることを報告する。手順は `docs/harness/README.md`（変異なしで緑・変異ありで赤の対照を取る。作業ツリーを直接変異させたら復元して `git status` で確認）
- [ ] 4.2 `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm e2e` がすべて緑

## 提案（本 change のスコープ外・後続への申し送り）
