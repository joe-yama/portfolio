# Proposal

## Why

`header-nav-icons`（7 件）と `followup-minors-2`（20 件）の申し送り計 27 件を main（`df7be75`）のコードに照らして仕分けた（PO 承認 2026-09-23）。特許の `url` が別の公報を指していても捕まえる番人が無く、e2e が cwd 次第で落ちる。ほかにも壊れる入力と番人の穴が残っている。見た目では、1280px でヘッダーのナビの文字のベースラインがロゴより 1.8px 上にずれている。

## What Changes

**番人と壊れる入力**
- 特許の `url` のパスに `number` と完全に一致する区切りが無ければビルドを落とす（`content-schema` に要求を足す）
- e2e のセットアップが preview の pid を取れなかったら、黙って進まずに失敗する
- 入稿コマンドのアカウント確認は `gh` の出力全体を `joe-yama` と比べる。縮小に失敗したら一時ディレクトリを消してから中断する
- e2e が YAML と `dist` を cwd 相対で読むのをやめ、ファイルの位置から組み立てる。e2e が数える写真ファイルを Astro の glob と同じくドットファイル抜きにそろえる

**ヘッダー（PO 決定 2026-09-23: ベースラインを直す）**
- アイコンを隠す条件を spec の「30rem 未満」と厳密に一致させ、隠す側の e2e に 479px を足す
- 1 行に並ぶロゴとナビの文字のベースラインをそろえる（`layout-shell` に要求を足す）
- ヘッダーのリンクの並びを e2e で確かめる

**テストの穴と整理（挙動不変）**
- `getFeaturedPhoto` の写真 0 枚のケース、content.test のモックの後片付け、`patentsX:` の対照実験、viewport の失敗時に scrollWidth / clientWidth が出るようにする
- テスト名・正規表現・JSDoc の実態とのずれ、重複したテストと evaluate、不要な export、`execSync` の重複を整理する（一覧は `tasks.md`）

**含めない**: `.` や大文字を含む slug の実データでの確認（写真の入稿待ち）、`.org` の太さ（PO 決定: 600 のまま、`<b>` にしない）、`inferRemoteSize` の寸法のキャッシュと pictureSizing の切り出し（裁定済みの見送り）、`.art` を global.css に置いたことの影響（記録のみ）、`docs/status.md` 冒頭の書き換え（#56 で対応済み）。

## Capabilities

### New Capabilities

なし

### Modified Capabilities

- `content-schema`: 特許の `url` は代表公報の `number` を指さなければならない
- `layout-shell`: 1 行に並ぶロゴとナビの文字のベースラインがそろう。アイコンを隠す幅の検査に 479px を足す

## Impact

- `src/lib/validate.ts`、`src/components/Header.astro`、`src/lib/site.ts`（JSDoc）、`src/content/schemas.ts`（JSDoc）、`scripts/photo-add.ts`
- `tests/unit/{validate,content,site,theme,schemas}.test.ts`、`tests/e2e/{links,pages,sitemap,viewport}.spec.ts`、`tests/e2e/{paths,global-setup}.ts`
- 公開サイトの見た目の変化は、1280px などヘッダーが 1 行のときのナビの文字の 1.8px 程度の上下位置だけ
