# Tasks

項目の記号（F / N / H / C / D / P / R）は、仕分けの出典（`openspec/changes/archive/*/tasks.md` の末尾）に対応する。

## 1. 特許の見出し（D1）

- [x] 1.1 `src/content/career/ja.yaml` と `en.yaml` の 5 行を design D1 の文言に書き換え、`pnpm test` と `pnpm build` が通ること（見出しの長さの検証を含む）を確かめる

## 2. 壊れる入力（先に RED を書く）

- [x] 2.1 N1 / D2: RED: `photoIdFromEntry` の unit テスト（`kamo-river-v1.2.yaml` → `kamo-river-v1.2`、`Kamo.yaml` → `Kamo`）と、`kamo-river-v1.2.yaml` を置いた状態でビルドが落ちることの実測。GREEN: `src/lib/photo-meta.ts` に関数を置き、`src/content.config.ts` の photos に `generateId` で渡す。`.` を含む slug の写真ページがビルド・配信できることを確かめ、実測に使った YAML は消す。`tests/e2e/paths.ts` の slug の作り方とコメントを合わせ、未使用の `photoSlugs` の export を消す（F15）
- [x] 2.2 D3 / H-B1: RED: `validatePhotos([])` が featured の不足を返すテスト。GREEN: 早期 return を消す。`src/lib/content.ts` に `getFeaturedPhoto()` を置き、BaseLayout と index.astro の到達しない throw を消す（H-B3）
- [ ] 2.3 H-A2 + F10 / D5: RED: 拡張子 `.jpg` のテキストファイルと、レンズ情報を持たない JPEG（sharp でその場で作る）を子プロセスで入稿し、1 行の中断文言と、スタックトレース・バンドルが出ないことを確かめる。GREEN: `scripts/photo-add.ts` の exifr / sharp を try で包み `die()` する
- [ ] 2.4 F11 / D5: RED: stderr が空白だけで `message` が複数行のとき、`ghFailureMessage` が 1 行を返すテスト。GREEN: 先頭行だけを使う（login も同様）
- [ ] 2.5 F9: photo-add-cli のテストで PATH を偽の gh のディレクトリだけにし、`afterAll` で一時ディレクトリを消し、`--slug a/b` のケースを足す
- [ ] 2.6 R2 + F6 / D4: RED: ja と en の両方にエラーがあるとき 1 つの例外に両方が出るテスト、`getCareer('ja')` の成功、検証のロケールの入れ替えで落ちるテスト（41〜90 文字の日本語 title）。GREEN: `assertValid` を 1 回にまとめる。content.test の未使用の `getCollection` モック、通らない `undefined` 分岐、自前の `Patent` 型を整理する
- [ ] 2.7 H-C1: RED: 3 桁の色（`#fff` など）が抽出されたとき、輝度計算が正しく扱うか、抽出の時点で拒まれるテスト。GREEN: 正規表現を 6 桁に揃える（`global.css` の色はすべて 6 桁であることを確認してから）

## 3. 番人の穴

- [ ] 3.1 F7 + H-C3: `tests/unit/schemas.test.ts` に年 0001〜0099 の存在しない日（`0050-02-29`、`0001-02-29`）の拒否と年 0000 の扱いの固定を足す。takenAt のクォート検査を単一引用符でも通るようにする
- [ ] 3.2 F5 + F8 + P2 + F4: `tests/unit/validate.test.ts` で、重複エラーの先頭の `ja:` / `en:` を確かめる、`INDEXED_KEYS` のキーをまたいだエラー順を固定する、patents の parity テストで件数も確かめる、特許のリテラル 7 か所を `patent()` に集約する（`patent()` を describe の外に出す）
- [ ] 3.3 F3 + P4 + H-D3 + F14: `tests/e2e/pages.spec.ts` で、特許リンクの `href` と文字列が YAML の各項目の `url` と `title` に一致することを日英で確かめる。hreflang を完全一致で確かめる。`parsePatents` を `patents:` 区画の終わりまでに限定し（行頭の YAML コメントで区画を終えない、`patentsX:` に一致しない）、`expect(hasTie)` に理由を付け、`locales` を `src/lib/i18n` から import し、`description ?? ''` を整理する
- [ ] 3.4 H-D1: `tests/unit/i18n.test.ts` の describe「stripBase 経由」が `stripBase` を呼ぶようにする

## 4. 品質改善（挙動不変）: 実装

- [ ] 4.1 F1: `career.astro` の `ui[lang].morePatents` を他と同じく派生変数にする。`.org` を `<b>` にする（Change 4 の ponytail、任意。見た目が変わらないことを確かめられた場合だけ）
- [ ] 4.2 F2 + D5 + H-D2: `src/lib/career.ts` の降順比較 3 か所を `desc()` に、`formatDate` の条件付きスプレッドを 1 行に、`splitPatents` の型を短く。career.test の自前の `Patent` 型を schemas.ts の export に、`hasDay` テストの重複と TZ ブロックに紛れた 2 テストを整理する
- [ ] 4.3 F18: `src/lib/validate.ts` 冒頭の古いコメントを現状に合わせる
- [ ] 4.4 H-C4: `src/content/schemas.ts` の `isoDate` と `datePrecision` の refine の重複を 1 つに、theme.test の `name` 列を消す。schemas.test の enum の言い換え（H-D2）を整理する

## 5. 品質改善（挙動不変）: e2e の基盤

- [ ] 5.1 F13: `tests/e2e/global-setup.ts` に「`preview status` は起動の有無によらず exit 0 なので message を見る」理由のコメントを戻す
- [ ] 5.2 F17 + H-D5: teardown の `currentPreviewPid` と setup の `parsePreviewPid` を 1 本にし、マーカー定数を共有する
- [ ] 5.3 H-D4: global-setup の `pnpm build` / `astro preview` に `cwd` をリポジトリの root として明示する

## 6. 品質改善（挙動不変）: 写真表示まわり

- [ ] 6.1 F16 + C4: `tests/e2e/viewport.spec.ts` の写真の slug の直書きと `locales` の重複を、`paths.ts` と `src/lib/i18n` から導く
- [ ] 6.2 C3: 縦横比の検査を両ロケール・主要ビューポートに広げる
- [ ] 6.3 C6: `floorPx = 192` が 1280×400 で等号ぎりぎりになる件。root の font-size から導いた値で比較する
- [ ] 6.4 C7: ponytail（`waitForImageLoaded` を `expect.poll` に、`assertNoHorizontalScroll` を畳む、失敗メッセージを 1 行に）
- [ ] 6.5 C5: `index.astro` と `[slug].astro` の高さ上限の式、`global.css` の `100dvh` に、svh と dvh を使い分ける意図のコメントを足す
- [ ] 6.6 H1: `PhotoPicture` の pictureSizing と `eager` → `priority`、`[slug].astro` の `neighbors` の戻り値、`photo.ts` の `Set` のラップと `inferRemoteSize` の重複を整理する
- [ ] 6.7 H2: `.art` の CSS が index と 404 に重複している件を `global.css` に寄せる

## 7. 番人の確認と仕上げ

- [ ] 7.1 変異を当てて 2 章・3 章の新しいテストが落ちることを確かめる（`docs/harness/README.md` の隔離実行の手順）。少なくとも: (a) `generateId` を外す、(b) `validatePhotos` の早期 return を戻す、(c) photo-add の try を外す、(d) `ghFailureMessage` を `message` 全体に戻す、(e) `assertValid` を ja → en の 2 回に戻す、(f) 検証に渡すロケールを入れ替える、(g) 特許 1 件の `url` を別の項目のものに入れ替える、(h) hreflang を `ja-JP` にする
- [ ] 7.2 畳んだ・整理したテスト（3.2、4.2、4.4、6.1〜6.4）が、整理前と同じ変異で落ちることを確かめる
- [ ] 7.3 `docs/status.md` の「PO 判断として残っている件」から Change 9（375×667、PO 決定: 直さない）と Change 11（見出し 4 件、本 change で対応）の段落を片付ける
- [ ] 7.4 `pnpm lint` / `pnpm typecheck` / `pnpm test` / `pnpm build` / `pnpm e2e` をすべて実行し、コマンドと出力を報告に添える

## 提案（本 change のスコープ外・後続への申し送り）

- 2.1（D2）: 実データで `.` を含む slug の写真を入稿したとき、`getStaticPaths` がそのページを出し、Release の画像の取得まで含めてビルドと配信が通ることを 1 度確かめる（本 change では Release に該当の画像が無く、検証を通ってページの生成に入るところと、`.` を含むディレクトリが静的配信で 200 を返すところまでを確かめた）
