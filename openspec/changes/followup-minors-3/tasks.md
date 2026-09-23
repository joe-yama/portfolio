# Tasks

出典の記号: **H<n>** は `archive/2026-09-23-header-nav-icons/tasks.md` の「提案」の n 番目、**M<n>** は `archive/2026-09-23-followup-minors-2/tasks.md` の「提案」の n 番目（箇条書きの上から数える）。対応しない件（M1・M2・M3・M15・M16・M20）は proposal の「含めない」を参照。M11 と M18 は同じ件。

## 1. 番人と壊れる入力（先に RED を書く）

- [x] 1.1 M9 / D1: RED: `tests/unit/validate.test.ts` に、`url` が別の公報を指す・公報番号が前方一致するだけ・英語のデータだけが誤る の 3 ケースで `validateCareerPatents` がエラー（`number` と `url` を含む）を返すこと、代表公報を指す `url` では返さないことを足す。GREEN: `src/lib/validate.ts` に検査を足し、冒頭のコメントの検査一覧も更新する。`pnpm test` と `pnpm build`（実データ 130 件が通る）で確かめる
- [x] 1.2 M11 + M18 + M12 の一部 / D4: `tests/e2e/global-setup.ts` で起動後の pid が `null` なら throw する。`parsePreviewPid` の export を外し、`status --json` の `execSync` を 1 か所にまとめる（まとめられない理由があれば報告に書く）。`pnpm e2e` が緑のままであることで確かめる
- [x] 1.3 M17 / D5: RED: `tests/unit/photo-add-cli.test.ts` で偽の `gh` が `joe-yama\nother` を返すとき、1 行の理由で中断し Release に触れないことを確かめる。GREEN: `scripts/photo-add.ts` の login の比較を出力全体（`trim()` 後）で行い、`die` の文言にだけ先頭行を使う
- [x] 1.4 M6 / D5: RED: `TMPDIR` を一時ディレクトリに向け、画素が壊れた JPEG を入稿したあとその中に `photo-add-*` が残らないことを確かめる。GREEN: sharp の catch で作業ディレクトリを消してから `die` する
- [x] 1.5 M13 + M4 / D3: `tests/e2e/pages.spec.ts` の YAML の読み込みと `tests/e2e/sitemap.spec.ts` の `dist` を `import.meta.url` 起点にする。`tests/e2e/paths.ts` の写真ファイルの一覧から `.` で始まる名前を除く。cwd をリポジトリの外にして `playwright test -c <worktree>/playwright.config.ts` が通ることで確かめる（5.3）

## 2. ヘッダー

- [x] 2.1 H1 + H2 / D2: `tests/e2e/links.spec.ts` のアイコンを隠す側の幅に 479px を足す。`src/components/Header.astro` のメディアクエリを `not all and (min-width: 30rem)` にする。`pnpm e2e` で 390 / 479 / 480px の検査が緑であることを確かめる
- [ ] 2.2 H3 / D2: RED: `tests/e2e/links.spec.ts` に、1280×720 と 480×844 で ロゴとナビの 3 つのリンクの文字のベースラインの差が 0.5px 以内であることの検査を足し（測り方は design D2）、修正前は 1280px で 1.8px 前後の差で赤になることを確かめる。GREEN: `Header.astro` の CSS を直す。既存の「行が高くならない」と 2.1 の検査が緑のままであることを確かめる
- [ ] 2.3 H4: `tests/e2e/links.spec.ts` に、ja と en のページそれぞれ 1 つで `header a` の href が「ロゴ → Photos → Career → 言語切り替え」の順であることの検査を足す

## 3. テストの穴

- [ ] 3.1 M5: `tests/unit/content.test.ts` に、写真が 0 枚のとき `getFeaturedPhoto` が代表写真の不足で失敗するケースを足す（`getPhotos` の検証を通ることの番人）。`photoEntries.list` を `beforeEach` で空に戻す
- [ ] 3.2 M14: `tests/e2e/viewport.spec.ts` の横スクロールの検査を、`scrollWidth - clientWidth` を `toBeLessThanOrEqual(0)` で比べる形にして、失敗時に値が出るようにする。トップと個別ページの 2 重書きを 1 つのループにする

## 4. 整理（挙動不変）

- [ ] 4.1 H5: `tests/unit/site.test.ts` の describe「導線のアイコン（design D1）」が navLinks / languageSwitch の `toEqual` と同じ主張であることを確かめ、重複なら消す（重複していない主張があれば残し、報告に書く）
- [ ] 4.2 H6: `tests/e2e/links.spec.ts` の同じ行の判定の `getBoundingClientRect` の evaluate 2 か所を `boundingBox()` にする
- [ ] 4.3 H7: `src/lib/site.ts` の `CareerSection` の JSDoc を「ui.careerSections のキーの順は pages.spec が見出しの順と比べる」の趣旨に直す
- [ ] 4.4 M7: `tests/unit/theme.test.ts` のテスト名「3 桁や 8 桁の色は抽出しない」を、今の挙動（抽出の時点で拒む）に合わせる
- [ ] 4.5 M8: `tests/unit/content.test.ts` の「ja と en の両方にエラーがあれば…」の正規表現を、ja と en の並び順に依存しない形にする（各エラーを別々に確かめる）
- [ ] 4.6 M10: `src/content/schemas.ts` の `existsOnCalendar` の JSDoc を「日が無ければ（`YYYY-MM`）常に true」の実際に合わせる
- [ ] 4.7 M12: `tests/unit/schemas.test.ts` の enum の `it.each` で `value` と `parse` の中のリテラルが二重になっているのを 1 つにする

## 5. 番人の確認と仕上げ

- [ ] 5.1 変異を当てて 1〜3 章の新しいテストが落ちることを確かめる（`docs/harness/README.md` の隔離実行の手順）。少なくとも: (a) 1.1 の検査を外す、(b) 完全一致を `includes` にする（前方一致のケースが赤）、(c) ja だけに検査をかける、(d) 2.1 の閾値を 27rem にする（479px が赤）、(e) 2.2 の CSS を戻す、(f) ヘッダーのナビの Photos と Career を入れ替える（2.3 が赤）、(g) 1.2 の throw を外して pid を null にする、(h) 1.3 の比較を先頭行に戻す、(i) 1.4 の削除を外す、(j) 1.5 のドットファイルの除外を外して `.draft.yaml` を置く、(k) `getFeaturedPhoto` が `getPhotos` を通らないようにする
- [ ] 5.2 M19: `tests/e2e/pages.spec.ts` の `parsePatents` が `patentsX:` に一致しないことの対照実験。`ja.yaml` の patents の後に `patentsX:` の区画を足した入力で、今の実装は特許の件数が変わらず、`/^patents:/` に戻すと変わる（赤になる）ことを確かめる
- [x] 5.3 cwd をリポジトリの外にして `<worktree>/node_modules/.bin/playwright test -c <worktree>/playwright.config.ts` を実行し、全件緑になることを確かめる（修正前は `pages.spec.ts:75` の `ENOENT` で落ちることを対照として記録する）
- [ ] 5.4 書き換えたテスト（3.2、4.1、4.2、4.5、4.7）が、書き換え前と同じ変異で落ちることを確かめる
- [ ] 5.5 `pnpm lint` / `pnpm typecheck` / `pnpm test` / `pnpm build` / `pnpm e2e` をすべて実行し、コマンドと出力を報告に添える

## 提案（本 change のスコープ外・後続への申し送り）
