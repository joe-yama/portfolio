# 現在の状態

最終更新: 2026-09-22（Change 10 `followup-hardening` のマージとアーカイブ時点）。`CLAUDE.md` の索引から参照される。

## フェーズ

**v1 公開済み**（2026-09-21）。Change 10 `followup-hardening`（Issue #29、PR #35）をマージ・アーカイブ済み（2026-09-22）。未着手の change は無く、次にやることは PO の指示待ち（下記「次の作業の候補」）。

## 公開先（PO 決定 2026-09-21）

- 公開 URL: `https://joe-yama.github.io/portfolio/`
- `astro.config.ts` の `site: 'https://joe-yama.github.io'` + `base: '/portfolio'`
- 独自ドメインは使わず `public/CNAME` も作らない
- GitHub Pages は `build_type=workflow` で有効化済み。`main` への push で `.github/workflows/deploy.yml` が公開する
- `main` には ruleset（PR 必須 + CI 必須、required status check は CI の job 名 `check`）がある

## 掲載データの状態

- **プロフィールと経歴は PO 本人の実データ**（2026-09-21、Change 6 で差し替え）。出典は本人の公開 LinkedIn で、掲載範囲は PO が項目ごとに決定済み。実名・勤務先・職歴・資格・論文が公開 URL に載っている
- **特許は PO 本人の実データ 51 件**（2026-09-21、Change 8）。日本語の名称は暫定（英語の定型名称から起こしたもの。裁定 D7b）で、US / EP / WO の出願はまだ載っていない
- **写真はサンプルのまま 2 枚**（差し替えは PO 待ち）

編集時の細則は `docs/content-authoring.md`。

## 仕様と設計

- 設計書 `docs/superpowers/specs/2026-09-17-portfolio-site-design.md` を PO 承認・レビュー反映済み（2026-09-17、Change 2 の決定を 2026-09-18 に、公開先の決定を 2026-09-21 に反映）
- main spec は `openspec/specs/` の 8 つ: `content-schema` / `deployment` / `i18n-routing` / `layout-shell` / `photo-pipeline` / `profile-and-career` / `quality-gates` / `sitemap`
- `docs/HANDOFF.md` §3 のセットアップ手順は再実行しない

## PO の手作業が要る宿題

**サイトマップの登録**（2026-09-21、Change 7）。`/portfolio/sitemap.xml` は出力しているが、GitHub Pages のプロジェクトサイトではクローラが読む `robots.txt` はドメイン直下（`https://joe-yama.github.io/robots.txt`）だけで `/portfolio/robots.txt` は無視されるため、`robots.txt` からは知らせられない。**Google Search Console にサイトマップの URL を直接登録するまで、サイトマップは実質的に効かない。**

## 次の作業の候補

1. **特許の全件取得**（Change 8 が後日に回した分）。ローマ字表記 `Josuke Yamane` での発明者検索で US / EP / WO を拾い、同族を解決して JP 公報番号を代表にし `countries` を埋め、日本語の名称を公報の正式名称に置き換える。詳細は `openspec/changes/archive/2026-09-21-patents-section/tasks.md` の末尾
2. 写真の追加・差し替え
3. 独自ドメインへの移行（設計書 §9 の手順で `base` の削除が必要）
4. Change 7 が後続へ回した 14 件、Change 8 の 16 件、Change 9 の 8 件、**Change 10 の 35 件超**（各 `openspec/changes/archive/*/tasks.md` の末尾）
5. Change 4・5 の後続への提案と申し送り（各 `openspec/changes/archive/2026-09-21-*/tasks.md` の末尾）

## PO 判断として残っている件

**Change 9**: 375×667（iPhone SE / 8）では写真の高さ上限が発動して、写真が本文の幅より 26.3% 狭くなる（写真 252.7×379 に対し本文幅 343）。spec が縛る 390×844 では全幅を満たしているので挙動は変えていない。狭い画面で写真を全幅に戻すなら新しい change が要る。

**Change 10**: 写真の差し替え（同じ slug での `pnpm photo:add` 再実行）の実測は、偽の `gh` を使ってコード経路だけ通した。公開 Release の画像は入稿時に EXIF が落ちるため、それを入稿に渡すと差し替え経路へ到達しない。**PO 本人の元画像で 1 回実行すれば、spec の Scenario「差し替え後のビルドで古い版が残らない」まで確かめられる。**

## 未決事項

`docs/HANDOFF.md` §6 と `docs/harness/README.md` §5。影響する時点で PO に確認する。
