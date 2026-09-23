# Tasks

項目の記号（F / N / H / C / D / P / R）は、仕分けの出典（`openspec/changes/archive/*/tasks.md` の末尾）に対応する。

## 1. 特許の見出し（D1）

- [x] 1.1 `src/content/career/ja.yaml` と `en.yaml` の 5 行を design D1 の文言に書き換え、`pnpm test` と `pnpm build` が通ること（見出しの長さの検証を含む）を確かめる

## 2. 壊れる入力（先に RED を書く）

- [x] 2.1 N1 / D2: RED: `photoIdFromEntry` の unit テスト（`kamo-river-v1.2.yaml` → `kamo-river-v1.2`、`Kamo.yaml` → `Kamo`）と、`kamo-river-v1.2.yaml` を置いた状態でビルドが落ちることの実測。GREEN: `src/lib/photo-meta.ts` に関数を置き、`src/content.config.ts` の photos に `generateId` で渡す。`.` を含む slug の写真ページがビルド・配信できることを確かめ、実測に使った YAML は消す。`tests/e2e/paths.ts` の slug の作り方とコメントを合わせ、未使用の `photoSlugs` の export を消す（F15）
- [x] 2.2 D3 / H-B1: RED: `validatePhotos([])` が featured の不足を返すテスト。GREEN: 早期 return を消す。`src/lib/content.ts` に `getFeaturedPhoto()` を置き、BaseLayout と index.astro の到達しない throw を消す（H-B3）
- [x] 2.3 H-A2 + F10 / D5: RED: 拡張子 `.jpg` のテキストファイルと、レンズ情報を持たない JPEG（sharp でその場で作る）を子プロセスで入稿し、1 行の中断文言と、スタックトレース・バンドルが出ないことを確かめる。GREEN: `scripts/photo-add.ts` の exifr / sharp を try で包み `die()` する
- [x] 2.4 F11 / D5: RED: stderr が空白だけで `message` が複数行のとき、`ghFailureMessage` が 1 行を返すテスト。GREEN: 先頭行だけを使う（login も同様）
- [x] 2.5 F9: photo-add-cli のテストで PATH を偽の gh のディレクトリだけにし、`afterAll` で一時ディレクトリを消し、`--slug a/b` のケースを足す
- [x] 2.6 R2 + F6 / D4: RED: ja と en の両方にエラーがあるとき 1 つの例外に両方が出るテスト、`getCareer('ja')` の成功、検証のロケールの入れ替えで落ちるテスト（41〜90 文字の日本語 title）。GREEN: `assertValid` を 1 回にまとめる。content.test の未使用の `getCollection` モック、通らない `undefined` 分岐、自前の `Patent` 型を整理する
- [x] 2.7 H-C1: RED: 3 桁の色（`#fff` など）が抽出されたとき、輝度計算が正しく扱うか、抽出の時点で拒まれるテスト。GREEN: 正規表現を 6 桁に揃える（`global.css` の色はすべて 6 桁であることを確認してから）

## 3. 番人の穴

- [x] 3.1 F7 + H-C3: `tests/unit/schemas.test.ts` に年 0001〜0099 の存在しない日（`0050-02-29`、`0001-02-29`）の拒否と年 0000 の扱いの固定を足す。takenAt のクォート検査を単一引用符でも通るようにする
- [x] 3.2 F5 + F8 + P2 + F4: `tests/unit/validate.test.ts` で、重複エラーの先頭の `ja:` / `en:` を確かめる、`INDEXED_KEYS` のキーをまたいだエラー順を固定する、patents の parity テストで件数も確かめる、特許のリテラル 7 か所を `patent()` に集約する（`patent()` を describe の外に出す）
- [x] 3.3 F3 + P4 + H-D3 + F14: `tests/e2e/pages.spec.ts` で、特許リンクの `href` と文字列が YAML の各項目の `url` と `title` に一致することを日英で確かめる。hreflang を完全一致で確かめる。`parsePatents` を `patents:` 区画の終わりまでに限定し（行頭の YAML コメントで区画を終えない、`patentsX:` に一致しない）、`expect(hasTie)` に理由を付け、`locales` を `src/lib/i18n` から import し、`description ?? ''` を整理する
- [x] 3.4 H-D1: `tests/unit/i18n.test.ts` の describe「stripBase 経由」が `stripBase` を呼ぶようにする

## 4. 品質改善（挙動不変）: 実装

- [x] 4.1 F1: `career.astro` の `ui[lang].morePatents` を他と同じく派生変数にする。`.org` を `<b>` にする（Change 4 の ponytail、任意。見た目が変わらないことを確かめられた場合だけ）
- [x] 4.2 F2 + D5 + H-D2: `src/lib/career.ts` の降順比較 3 か所を `desc()` に、`formatDate` の条件付きスプレッドを 1 行に、`splitPatents` の型を短く。career.test の自前の `Patent` 型を schemas.ts の export に、`hasDay` テストの重複と TZ ブロックに紛れた 2 テストを整理する
- [x] 4.3 F18: `src/lib/validate.ts` 冒頭の古いコメントを現状に合わせる
- [x] 4.4 H-C4: `src/content/schemas.ts` の `isoDate` と `datePrecision` の refine の重複を 1 つに、theme.test の `name` 列を消す。schemas.test の enum の言い換え（H-D2）を整理する

## 5. 品質改善（挙動不変）: e2e の基盤

- [x] 5.1 F13: `tests/e2e/global-setup.ts` に「`preview status` は起動の有無によらず exit 0 なので message を見る」理由のコメントを戻す
- [x] 5.2 F17 + H-D5: teardown の `currentPreviewPid` と setup の `parsePreviewPid` を 1 本にし、マーカー定数を共有する
- [x] 5.3 H-D4: global-setup の `pnpm build` / `astro preview` に `cwd` をリポジトリの root として明示する

## 6. 品質改善（挙動不変）: 写真表示まわり

- [x] 6.1 F16 + C4: `tests/e2e/viewport.spec.ts` の写真の slug の直書きと `locales` の重複を、`paths.ts` と `src/lib/i18n` から導く
- [x] 6.2 C3: 縦横比の検査を両ロケール・主要ビューポートに広げる
- [x] 6.3 C6: `floorPx = 192` が 1280×400 で等号ぎりぎりになる件。root の font-size から導いた値で比較する
- [x] 6.4 C7: ponytail（`waitForImageLoaded` を `expect.poll` に、`assertNoHorizontalScroll` を畳む、失敗メッセージを 1 行に）
- [x] 6.5 C5: `index.astro` と `[slug].astro` の高さ上限の式、`global.css` の `100dvh` に、svh と dvh を使い分ける意図のコメントを足す
- [x] 6.6 H1: `PhotoPicture` の pictureSizing と `eager` → `priority`、`[slug].astro` の `neighbors` の戻り値、`photo.ts` の `Set` のラップと `inferRemoteSize` の重複を整理する（pictureSizing は見送り。「提案」の裁定（単位 6）を参照）
- [x] 6.7 H2: `.art` の CSS が index と 404 に重複している件を `global.css` に寄せる

## 7. 番人の確認と仕上げ

- [x] 7.1 変異を当てて 2 章・3 章の新しいテストが落ちることを確かめる（`docs/harness/README.md` の隔離実行の手順）。少なくとも: (a) `generateId` を外す、(b) `validatePhotos` の早期 return を戻す、(c) photo-add の try を外す、(d) `ghFailureMessage` を `message` 全体に戻す、(e) `assertValid` を ja → en の 2 回に戻す、(f) 検証に渡すロケールを入れ替える、(g) 特許 1 件の `url` を別の項目のものに入れ替える、(h) hreflang を `ja-JP` にする
- [x] 7.2 畳んだ・整理したテスト（3.2、4.2、4.4、6.1〜6.4）が、整理前と同じ変異で落ちることを確かめる
- [x] 7.3 `docs/status.md` の「PO 判断として残っている件」から Change 9（375×667、PO 決定: 直さない）と Change 11（見出し 4 件、本 change で対応）の段落を片付ける
- [x] 7.4 `pnpm lint` / `pnpm typecheck` / `pnpm test` / `pnpm build` / `pnpm e2e` をすべて実行し、コマンドと出力を報告に添える

## 提案（本 change のスコープ外・後続への申し送り）

- 2.1（D2）: 実データで `.` を含む slug の写真を入稿したとき、`getStaticPaths` がそのページを出し、Release の画像の取得まで含めてビルドと配信が通ることを 1 度確かめる（本 change では Release に該当の画像が無く、検証を通ってページの生成に入るところと、`.` を含むディレクトリが静的配信で 200 を返すところまでを確かめた）。あわせて、大文字を含む slug のビルドと、GitHub Pages が末尾スラッシュ無しの `/photos/kamo-river-v1.2` を拡張子として扱うかも未実測なので同じときに確かめる（Task 2、レビュー単位 1）
- 4.1（Change 4 の ponytail）: `.org` を `<b>` にする件は見送った。Chromium で計算済みスタイルを測ると `<span class="org">` は `font-weight: 600`、クラスなしの `<b>` は `700` で、見た目が変わる（`<b class="org">` にすると 600 のままだが、要素を変えるだけで CSS は減らない）。`<p class="org">` はブロック要素なので `<b>` にできない。やるなら `.org` を 700 にしてよいかを PO に確かめてから
- 6.6（H1）: `inferRemoteSize` の重複は「同じ関数の中で 2 回呼ぶ」ものではなく、`PhotoPicture.astro` が呼び出しごとに 1 回呼ぶので、ギャラリー・個別ページ・トップで同じ画像の寸法を別々に読んでいるもの。ビルド時間が問題になったら、`src/lib/photo.ts` などで slug ごとに寸法を覚える仕組みを検討する（本 change ではやらない。ponytail）
- Task 2（単位 1）: `tests/e2e/paths.ts` の `readdirSync` + `endsWith('.yaml')` は Astro の glob `*.yaml`（ドットファイルを除く）と厳密に一致しない。`.draft.yaml` があると e2e だけがそのページを期待して 404 で落ちる（安全側）
- Task 3（単位 2）: `getFeaturedPhoto` が `getPhotos` を通ることを固定するテストが無い（0 枚の `getFeaturedPhoto` のケースを 1 本足す）/ `content.test.ts` の `photoEntries.list` を `beforeEach` で戻していない
- Task 4（単位 3）: `scripts/photo-add.ts` の `mkdtempSync(work)` が sharp より前にあり、sharp が失敗すると OS の tmp に `photo-add-*` が残る（既存の挙動、worktree の外）
- Task 6（単位 4）: `tests/unit/theme.test.ts` のテスト名「3 桁や 8 桁の色は抽出しない」は今の挙動（抽出の時点で拒む）と合わない
- Task 5（単位 4）: `content.test.ts` の両言語のエラーの正規表現が ja → en の並び順も固定している（design D4 は順序を決めていない）
- Task 8（単位 4）: 特許の YAML の `url` が別の公報を指す誤りを捕まえる番人が無い（`url` が `/patent/<number>/` を含むことの検査）。e2e の「YAML と一致」は期待値を同じ YAML から読むので原理的に捕まえられない（7.1 (g) で緑を確認）
- Task 9（単位 5）: `schemas.ts` の `existsOnCalendar` への統合で、形式違反のときのエラーの組み合わせが変わった（`'2024-10'` を isoDate に渡すと、形式 + 暦 → 形式のみ。改善）。`'2024-13-01'` は両方のまま。JSDoc の「YYYY-MM は常に true」は実際（日が無ければ常に true）とずれている
- Task 10（単位 5）: `global-setup.ts` で `status --json` が例外を投げると `pid: null` で進み、preview を取り残したまま緑で終わりうる（次の実行で `isPortOccupied` が検出する）。直すなら `pid === null` で throw
- Task 9・10（単位 5）: `schemas.test.ts` の enum の `it.each` で `value` と `parse` の中のリテラルが二重 / ponytail: `parsePreviewPid` の export は不要、`status --json` の execSync が 2 か所
- Task 10（単位 5、7.1 で実測）: cwd をリポジトリの外にして `playwright test -c <worktree>/playwright.config.ts` を実行すると、globalSetup のビルドと preview の起動・停止は通るが、`tests/e2e/pages.spec.ts:75` の `parsePatents('src/content/career/ja.yaml')` が cwd 相対で `ENOENT` になり全体が落ちる。`tests/e2e/sitemap.spec.ts:18` の `join('dist', lang)` も cwd 相対。直すなら `paths.ts` と同じく `import.meta.url` から組み立てる
- Task 11（単位 6）: `viewport.spec.ts` の横スクロールの検査は失敗時に scrollWidth / clientWidth が出なくなった（`scrollWidth - clientWidth` を `toBeLessThanOrEqual(0)` にすれば Received に出る）/ ponytail: 同じ検査の 2 重書き
- Task 12（単位 6）: `.art` を global.css に移したので全ページに載る。後から `class="art"` を使うコンポーネントがマージンを継承する
- 裁定（単位 6）: tasks.md 6.6 の「pictureSizing」（寸法の計算を `photo.ts` に切り出して単体テストできるようにする。出典 archive/2026-09-21-photo-pipeline の提案）は、挙動不変の整理ではなくテスト容易性のための切り出しなので本 change では見送った
- ブランチ全体のレビュー: `scripts/photo-add.ts:86` は比較に使う login そのものを先頭行に切っている。`joe-yama\n<何か>` がアカウント確認を通るようになった（実際の `--jq .login` は 1 行なので Minor）。比較は出力全体で行い、`die` の文言にだけ先頭行を当てる
- ブランチ全体のレビュー: 5.2 は挙動不変のはずが、`status --json` の失敗を握りつぶして `pid: null` で進むようになった（上の Task 10 の件と同じ）。`global-setup.ts` で `pid === null` なら throw する 1 行で元の「大きな音で落ちる」に戻せる
- ブランチ全体のレビュー: `tests/e2e/pages.spec.ts:31` の `patentsX:` に一致させない変更（`/^patents:\s*$/`）には対照実験が無い。`patentsX:` を足した YAML を入力に 1 回確かめる
- ブランチ全体のレビュー: `docs/status.md` の冒頭の「最終更新」「フェーズ」と、「PO 判断として残っている件」に残した片付け済みの Change 9 の 1 行は、archive のときに現状へ書き換える（片付け済みの行は「掲載データの状態」へ移すか消す）

## 変異の記録（7.1・7.2、HEAD `be6cbd7`）

手順は `docs/harness/README.md` §7。変異ごとに `git archive <rev>` で新しい複製（scratchpad の `m13/<名前>/exp`）を作り、`pnpm install --frozen-lockfile --offline` の後、対照（変異なし）→ 変異あり の順に同じ複製で回した。対照はすべて緑（unit は `RUN v5.0.1 …/m13/<名前>/exp` と `Tests 313 passed (313)`、e2e は `[build] directory: …/m13/<名前>/exp/dist/` と `114 passed`）。作業ツリーには変異を当てていない。e2e は毎回 `lsof -i :4399` が空であることを確かめて 1 本ずつ回した。

### 7.1（HEAD の複製）

| 変異 | 当てたファイルと変更 | 赤になったテスト名 | 出力の 1 行 |
|---|---|---|---|
| (a) | `src/content.config.ts`: photos の `generateId: ({ entry }) => photoIdFromEntry(entry),` の行を消す（キャストを移した今の `content-config.test.ts` の形で） | content-config.test「写真コレクションの id > ファイル名（拡張子を除く）をそのまま id にする」 | `AssertionError: expected undefined to be 'kamo-river-v1.2'` / `Tests 1 failed \| 312 passed (313)` |
| (b) | `src/lib/validate.ts`: `validatePhotos` の冒頭に `if (entries.length === 0) return [];` | validate.test「写真が 0 枚なら代表写真が無いことを報告する」、content.test「getPhotos の検証の配線 > 写真が 0 枚ならビルドを止め、代表写真が無いことを示す」 | `AssertionError: promise resolved "[]" instead of rejecting` / `Tests 2 failed` |
| (c) | `scripts/photo-add.ts`: exifr の `try { raw = … } catch { die(…) }` を `raw = …` だけにする | photo-add-cli「画像でないファイルは 1 行で中断し、読み取り部品の内部情報を出さず、Release に触れない」 | `AssertionError: expected [ …(2) ] to deeply equal [ StringMatching{…} ]` / `Tests 1 failed` |
| (c2) | `scripts/photo-add.ts`: sharp の縮小の try / catch を外す | photo-add-cli「EXIF は読めても画素が壊れた JPEG は、縮小の失敗を 1 行で中断し、sharp の内部情報を出さない」 | `AssertionError: expected [ …(13) ] to deeply equal [ 'photo:add: 画像として読めない: x.jpg' ]` / `Tests 1 failed` |
| (d) | `src/lib/photo-meta.ts`: `ghFailureMessage` の最後を `message.split('\n')[0]` → `message` | photo-meta.test「ghFailureMessage > stderr が空白だけで message が複数行なら、message の先頭行だけを返す」 | `expected 'Command failed: gh api user\nboom' to be 'Command failed: gh api user'` / `Tests 1 failed` |
| (d2) | `scripts/photo-add.ts`: login の `.split('\n')[0]` を外す | photo-add-cli「アカウント確認 > gh のアカウント名が複数行でも、中断の理由は 1 行になる」 | `expected [ …(2) ] to have a length of 1 but got 2` / `Tests 1 failed` |
| (e) | `src/lib/content.ts`: `getCareer` を `assertValid([...parity, ...ja], 'career'); assertValid(en, 'career');` の 2 回に | content.test「ja と en の両方にエラーがあれば、1 つの例外に両方が出る」 | `expected [Function] to throw error matching /ja: number が重複している…/ but got 'career の内容に問題がある:\n- ja: …'` / `Tests 1 failed` |
| (f) | `src/lib/content.ts`: `validateCareerPatents(ja.data, 'en')` / `(en.data, 'ja')` に入れ替え | content.test「日本語のデータは日本語の上限で検証する」「英語のデータは英語の上限で検証する」ほか重複の 3 件 | `Tests 5 failed \| 308 passed (313)` |
| (g) | 置き換え。元の変異（`ja.yaml` の JP7200645B2 の `url` を JP7354888B2 のものに）は緑: `114 passed`。e2e が期待値を同じ YAML から読むので、YAML を変えるとページと期待値が一緒に変わり、原理的に赤にならない | — | `114 passed (9.3s)`（変異あり） |
| (g') | `src/pages/[lang]/career.astro`: `sortPatents(career.patents).map((p, i, all) => (i === 0 && lang === 'ja' ? { ...p, url: all[1].url } : p))` | pages.spec「特許の区画 > /ja/career/ の特許リンクの href と文字列が YAML の url と title に一致する」 | `Error: expect(received).toEqual(expected)` / `1 failed, 113 passed` |
| (g'') | `src/components/PatentItem.astro`: `{patent.title}` → `{patent.title.slice(0, 20)}` | 同じテストの ja・en の 2 本 | `2 failed, 112 passed` |
| (h) | `src/lib/site.ts`: `alternateLinks` で ja の hreflang を `ja-JP` に | pages.spec「<10 ページ> が表示され lang と hreflang が正しい」 | `10 failed, 104 passed` |
| (h2) | `src/lib/site.ts`: en の hreflang の href を en のトップ（`/en/` 以降を切る）に | 同じテストのトップ以外の 8 ページ | `8 failed, 106 passed` |
| 2.5 | `scripts/photo-add.ts`: `if (!result.ok) die(…)` を消す | photo-add-cli「レンズ情報を持たない JPEG は「レンズ」を挙げて 1 行で中断する」 | `expected 'photo:add: Command failed: gh release…' to match /…レンズ/`（偽の gh は `api` 以外で失敗するので `release view` で止まり、複製の `src/content/photos/` は 2 ファイルのまま） |
| 2.7-a | `src/lib/theme.ts`: 6 桁の検査 `/^#[0-9a-f]{6}$/i` を `{3,8}` に（抽出を `{3,8}` に戻すのと同じ効果を今の形で） | theme.test「3 桁や 8 桁の色は抽出しない（…）」「6 桁の宣言の後に 3 桁で再宣言されていれば、前の値に戻らず例外にする」 | `expected [Function] to throw an error` / `Tests 2 failed` |
| 2.7-b | `src/lib/theme.ts`: 値の拾い方を 6 桁だけの `(#[0-9a-fA-F]{6})(?![0-9a-fA-F])` に戻す（a9a7c1c の前） | 同じ 2 件 | `expected … /--bg が 6 桁の 16 進でない: #fff/ but got 'ライト のブロックに --bg が無い'` / `Tests 2 failed` |
| 3.1 P2 | `src/content/schemas.ts`: `isCalendarDate` の先頭に `if (y < 100) return true;` | schemas.test「takenAt の 0050-02-29 / 0001-02-29 は暦に存在しないので拒否する」「0050-02-29 / 0001-02-29 は暦に存在しないので受け付けない」「年 0000 は 0000-02-29 を受け付け、0000-02-30 は拒否する」 | `expected true to be false` / `Tests 5 failed` |
| 3.1 引用符 | `src/content/photos/kariya-ferris-wheel.yaml`: `takenAt: "2025-12-06"` → クォートなし | schemas.test「実データの takenAt > … クォートされた文字列で書かれている」 | `kariya-ferris-wheel.yaml の takenAt がクォートされていない: 2025-12-06` |
| 3.2 順 | `src/lib/validate.ts`: `of INDEXED_KEYS` → `of [...INDEXED_KEYS].reverse()` | validate.test「比較キーが 3 つとも日英で違えば、certifications → achievements → patents の順に報告する」 | `expected [ …(3) ] to deeply equal [ …(3) ]` / `Tests 1 failed` |
| 3.2 接頭辞 | `src/lib/validate.ts`: `` `${lang}: number が重複` `` → `` `number が重複` `` | validate.test の重複 2 件、content.test の重複 3 件 | `Tests 5 failed` |
| 3.2 件数 | `src/lib/validate.ts`: 件数差の文言の ja / en の値を入れ替え | validate.test「patents の件数差を報告する」 | `expected [ 'patents の件数が日英で違う（ja: 0, en: 1）' ] to include '…（ja: 1, en: 0）'` |
| 3.4 | `src/lib/i18n.ts`: `stripBase` の `normalizeBase(base)` → `base` | i18n.test「normalizeBase（stripBase 経由で観測する両端トリム） > base が portfolio / /portfolio / portfolio/ でも同じ base として剥がす」 | `expected '/portfolio/en/' to be '/en/'` / `Tests 3 failed` |
| 3.3 区画 | 入力の確認（変異ではない）: `ja.yaml` の patents の途中に行頭の `# 区画の途中のコメント` | HEAD では緑（`33 passed`、pages.spec だけ）。3.3 の前（`30def38`）では特許の区画の 8 件が赤（`8 failed, 23 passed`） | 旧パーサーはコメント行で区画を終える |

### 7.2（整理の前後の複製に同じ変異）

| 整理 | 前 → 後のコミット | 変異 | 前 | 後 |
|---|---|---|---|---|
| 3.2 `patent()` 集約 | `e4864cc` → HEAD | `validate.ts` の patents の keyOf から filedAt を落とす（`filedAt -`） | 赤 2 件（filedAt 違い・countries 違い） | 赤 3 件（同じ 2 件 + 順の新テスト） |
| 3.2 | 同上 | keyOf から countries の件数を落とす（`countries - 件`） | 赤 2 件 | 赤 3 件 |
| 4.2 `hasDay` の畳み | `d78734a` → HEAD | `career.ts` の `hasDay` を常に true | 赤 5 件（`YYYY-MM-DD と YYYY-MM の両方で判定と表示が一致する` を含む） | 赤 5 件（`YYYY-MM-DD なら true、YYYY-MM なら false` を含む） |
| 4.2 | 同上 | `formatDate` の日を常に `'numeric'`（前: `...(hasDay(date) ? { day: 'numeric' } : {})`、後: `day: hasDay(date) ? 'numeric' : undefined` を `day: 'numeric'` に） | 赤 4 件 | 赤 3 件（畳んだ hasDay のテストが見ていた `formatDate` の 2 つの assertion の分が減った。残る `年月までの日付は ja で 年月` などが同じ形を捕まえる） |
| 4.2 `desc()` | 同上 | `sortPatents` の filedAt の比較の向きを逆に | 赤 1 件「countries の件数が同じなら filedAt の降順に並べる」 | 赤 1 件（同じ） |
| 4.2 `desc()` | 同上 | `sortExperience` の向きを逆に | 赤 1 件「from の新しい順に並べる」 | 赤 1 件（同じ） |
| 4.4 `existsOnCalendar` | `83051bb` → HEAD | `isCalendarDate` の先頭で `return true;` | 赤 9 件 | 赤 9 件（同じ 9 件） |
| 4.4 | 同上 | YYYY-MM の素通しを外す（前: `if (parts.length === 2) return true;` を消す、後: `d === undefined \|\|` を消す） | 赤 3 件 | 赤 3 件（同じ） |
| 4.4 enum の言い換え | 同上 | achievements の `kind` を `z.string()` | 赤「careerSchema > achievements の kind は talk / article / award / other のみ」 | 赤「kind の列挙 > careerSchema の achievements[].kind は列挙に無い blog を拒否する」 |
| 4.4 | 同上 | profile の links の `kind` を `z.string()` | 赤「profileSchema > links は空配列も許すが、kind は列挙のみ」 | 赤「kind の列挙 > profileSchema の links[].kind は列挙に無い mastodon を拒否する」 |
| 4.4 theme.test の `name` 列 | 同上 | `global.css` の light の `--fg-muted` を `#bbbbbb` | 赤「ライト --fg-muted/--bg は 4.5 以上」 | 赤「light の fgMuted / bg は 4.5 以上」 |
| 6.3 下限 | `485a9b3` → HEAD（viewport.spec だけ） | `index.astro` の `max(12rem, 100svh - 27rem)` → `calc(100svh - 27rem)` | 赤「極端に低い画面でも写真の表示高さは0にならない」（`height=0.0`） | 赤（同じ） |
| 6.2 表示比 | 同上 | `global.css` の末尾に `main picture img { width: 100% !important; height: 150px !important; }` | 赤「写真の表示比は元画像の縦横比と一致する」1 本 + 下限 | 赤: 表示比の 6 本（ja・en × 3 画面）+ 下限 |
| 6.1 + 6.2 ロケール | 同上 | 同じ規則を `html:lang(en)` にだけ当てる | **緑**（14 passed。整理前は ja しか見ていない） | 赤: en の表示比の 3 本 |
| 6.4 横スクロール | 同上 | `global.css` の末尾に `@media (max-width: 500px) { main { min-width: 600px; } }` | 赤「390×844 で横スクロールが発生しない」+ 幅いっぱい | 赤（同じ 2 件。後は失敗メッセージに scrollWidth / clientWidth が出ない） |

注:
- 4.4（`a94dbeb`）で形式違反の日付のエラーの組み合わせが変わった（`'2024-10'` を isoDate に渡すと、形式 + 暦 → 形式のみ）。改善で、上の 4.4 の変異の赤の件数は前後で同じ
- 6.2 で最初に当てた `height: 150px !important` だけの変異は、幅が縦横比から決まって比が保たれる（225×150）ので表示比の検査は前後とも緑、下限と幅いっぱいの検査が赤だった。表示比の番人が弱いのではなく変異が比を崩していなかったので、`width: 100%` を足して当て直した（上の表）
- 5.3 の確認: cwd をリポジトリの外（scratchpad）にして `<worktree>/node_modules/.bin/playwright test -c <worktree>/playwright.config.ts` を実行した。globalSetup は worktree の `dist/` にビルドし（`[build] directory: <worktree>/dist/`）、preview を起動して teardown が止めた（`Stopped preview server`）が、`tests/e2e/pages.spec.ts:75` の `parsePatents('src/content/career/ja.yaml')` が cwd 相対で `ENOENT` になり、テストは 1 本も走らずに失敗した（exit 1）。Playwright の config / cwd の解決ではなく、テストファイルの相対パスが原因。コードは変えていない（「提案」に記載）
