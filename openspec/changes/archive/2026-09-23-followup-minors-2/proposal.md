# Proposal

## Why

`followup-minors`（Issue #45）の申し送りと、それが束に入れなかった Change 4〜13 の申し送りを main（`ef40034`）のコードに照らして仕分け直したところ、壊れる入力が新たに 1 件見つかった。spec の Scenario どおりに `--slug kamo-river-v1.2` で入稿すると、ビルドが必ず落ちる。ほかに、壊れる入力 4 件と番人（テスト）の穴、挙動を変えない品質改善が残っている。spec とも食い違いが 1 件あり、写真が 0 枚のときに content-schema は「成功」、photo-pipeline と実装は「失敗」になっている。あわせて、特許の見出し 4 件の言い回しを PO の決定どおりに直す（PO 承認 2026-09-23）。

## What Changes

**特許の見出し（PO 決定 2026-09-23）**
- `JP2025095979A`（en）、`JP2020093622A`（en）、`JP7310636B2`（ja / en）、`JP2021111156A`（ja）の `title` を、請求項 1 の範囲で読み手に伝わる言い回しに直す（文言は `design.md` D1）

**壊れる入力**
- 写真のファイル名に `.` や大文字を含むと、コレクションの id がファイル名からずれて、`image` の一致検査でビルドが落ちる。ファイル名（拡張子を除く）をそのまま id にする（spec の「ファイル名を slug とする」に実装を合わせる）
- 画像でないファイルや壊れた画像を入稿すると、例外のバンドルが端末に吐き出される。他の中断と同じ 1 行で止める
- `gh` の失敗理由が複数行になることがある。必ず 1 行にする
- 経歴の検証が ja と en を別々に呼ぶので、ja にエラーがあると en のエラーが出ない。1 回にまとめる
- theme の色の抽出が 3〜8 桁を受けるのに、輝度計算は 6 桁しか受けない。桁数を揃える

**spec の食い違い（PO 決定 2026-09-23）**
- 写真が 0 枚のとき、ビルドは失敗する（content-schema を photo-pipeline と実装に揃える）。写真の集合の検証が 0 枚でも評価し、代表写真が無いことを理由に落とす。**BREAKING**（spec 上。現データは 2 枚なので実害なし）

**番人の穴・品質改善（挙動不変）**
- 特許リンクと YAML の `url` / `title` の対応を日英で検査する、hreflang を完全一致で検査する、年 0001〜0099 の存在しない日を拒むことを固定する、validate / content / photo-add-cli / schemas の各テストの穴を塞ぐ
- e2e の基盤（setup と teardown の重複、cwd 依存、古い説明の欠落）、テストと実装の重複・死んだ分岐・未使用の export の整理、写真表示まわり（`viewport.spec`、`PhotoPicture`、写真個別ページ、`.art` の CSS）の ponytail（一覧は `tasks.md`）

**含めない**: ヘッダーと導線のアイコンまわり（並行する `header-nav-icons` が扱う: `Header.astro`、`src/lib/site.ts`、`tests/unit/site.test.ts`、`tests/e2e/links.spec.ts`）、新機能（写真ページごとの OGP・description、印刷用 CSS、`sizes` の見直し）、素材待ち（3 枚目の写真、PO の元画像での差し替えの実測）、裁定済みの件、375×667 の写真幅（PO 決定: 直さない）。

## Capabilities

### New Capabilities

なし

### Modified Capabilities

- `content-schema`: 写真が 0 枚のときビルドを失敗させる。写真のファイル名に `.` や大文字を含んでも、ファイル名（拡張子を除く）がそのまま slug になる Scenario を足す
- `photo-pipeline`: 入稿コマンドが、画像として読めないファイルを 1 行の理由で中断する

## Impact

- `src/content.config.ts`、`src/lib/{validate,content,career,theme,photo-meta,photo}.ts`、`src/content/schemas.ts`、`scripts/photo-add.ts`
- `src/layouts/BaseLayout.astro`、`src/pages/[lang]/index.astro`、`src/pages/[lang]/photos/[slug].astro`、`src/pages/[lang]/career.astro`、`src/pages/404.astro`、`src/components/PhotoPicture.astro`
- `src/content/career/{ja,en}.yaml`（見出し 4 件）、`openspec/changes/archive/2026-09-22-patents-full-retrieval/research/publications.md` は archive のため触らない（D1）
- `tests/unit/*`（site.test.ts を除く）、`tests/e2e/{pages,viewport}.spec.ts`、`tests/e2e/{paths,global-setup,global-teardown}.ts`
- 公開サイトの見た目は、特許の見出し 4 件の文言以外は変わらない
