# 現在の状態

最終更新: 2026-09-23（PR #42 のマージと、変異テストの隔離実行の手順の修正時点）。`CLAUDE.md` の索引から参照される。

## フェーズ

**v1 公開済み**（2026-09-21）。change `fix-misc`（Issue #39、PR #40）をマージ・アーカイブ済み（2026-09-22）。未着手の change は無く、次にやることは PO の指示待ち（下記「次の作業の候補」）。

## 公開先（PO 決定 2026-09-21）

- 公開 URL: `https://joe-yama.github.io/portfolio/`
- `astro.config.ts` の `site: 'https://joe-yama.github.io'` + `base: '/portfolio'`
- 独自ドメインは使わず `public/CNAME` も作らない
- GitHub Pages は `build_type=workflow` で有効化済み。`main` への push で `.github/workflows/deploy.yml` が公開する
- `main` には ruleset（PR 必須 + CI 必須、required status check は CI の job 名 `check`）がある

## 掲載データの状態

- **プロフィールと経歴は PO 本人の実データ**（2026-09-21、Change 6 で差し替え）。出典は本人の公開 LinkedIn で、掲載範囲は PO が項目ごとに決定済み。実名・勤務先・職歴・資格・論文が公開 URL に載っている
- **特許は PO 本人の実データ 65 発明**（2026-09-22、Change 11 で公報単位 51 件から同族単位に作り直し）。代表は JP 公報番号、出願国は最大 6 か国、US を含むものが 47 件。**掲載する名称は公報の正式名称ではなく、請求項 1 から起こした短い見出し**（裁定 D12）。日本語の名称が暫定なのは JP 代表公報が無い 2 件だけ。掲載する全 65 件の照合表（見出し / 正式名称 / 請求項 1 の全文）は `openspec/changes/archive/2026-09-22-patents-full-retrieval/research/publications.md`
- **Change 8 が載せていた `JP7151181B2` は PO の発明ではなかった**ので Change 11 で落とした（発明者に PO が含まれず、名前は説明文中の引用文献の著者として現れるだけだった）。戻す判断をする場合の根拠は同じ `publications.md` の「落とした公報」
- **写真はサンプルのまま 2 枚**（差し替えは PO 待ち）
- **経歴の一部文言・スキルを更新**（2026-09-22、`fix-misc`）。experience 先頭項目の role から「（全社横断）」を削除、bullets を「…開発標準活動を立ち上げリーディング」に変更。skills「クラウド」に「プラットフォームエンジニアリング」追加、「プログラミング言語」を `[Python, Java, Scala, C++, TypeScript]` に置き換え（SQL を除外）、新カテゴリ「言語」（英語を第一言語とするチームのリーディング）を追加。特許の区画見出しを「特許」→「代表的な特許」に変更（区画の構成・折りたたみの挙動は変更なし）
- **AWS 認定資格 12 件へのバッジロゴ表示は一度実装したが、PO の判断（見た目が良くない）で取り消した**（2026-09-22、`fix-misc`）。詳細と再挑戦時の考慮点は `openspec/changes/archive/2026-09-22-fix-misc/tasks.md` の「提案」
- トップページ本文最下部を「サイト内導線（Photos/Career/言語切り替え） → 連絡先リンク（GitHub/LinkedIn）」の順に入れ替え、5 リンクにドット絵アイコンを追加（2026-09-22、`fix-misc`。`profile-and-career` spec 改定済み）
- **経歴のスキルに「コーヒー」を追加**（2026-09-22、PR #42）。スキル表の最終行に `コーヒー: [ハンドドリップ, モカポット, たいてい1日に5杯]` / `Coffee: [Hand drip, Moka pot, Usually five cups a day]` を置き、トップの肩書 "Builder, photographer, coffee lover" のコーヒーを経歴ページで回収した

編集時の細則は `docs/content-authoring.md`。

## 仕様と設計

- 設計書 `docs/superpowers/specs/2026-09-17-portfolio-site-design.md` を PO 承認・レビュー反映済み（2026-09-17、Change 2 の決定を 2026-09-18 に、公開先の決定を 2026-09-21 に反映）
- main spec は `openspec/specs/` の 8 つ: `content-schema` / `deployment` / `i18n-routing` / `layout-shell` / `photo-pipeline` / `profile-and-career` / `quality-gates` / `sitemap`
- `docs/HANDOFF.md` §3 のセットアップ手順は再実行しない

## PO の手作業が要る宿題

**サイトマップの登録**（2026-09-21、Change 7）。`/portfolio/sitemap.xml` は出力しているが、GitHub Pages のプロジェクトサイトではクローラが読む `robots.txt` はドメイン直下（`https://joe-yama.github.io/robots.txt`）だけで `/portfolio/robots.txt` は無視されるため、`robots.txt` からは知らせられない。**Google Search Console にサイトマップの URL を直接登録するまで、サイトマップは実質的に効かない。**

## 次の作業の候補

1. 写真の追加・差し替え
2. 独自ドメインへの移行（設計書 §9 の手順で `base` の削除が必要）
3. Change 7 が後続へ回した 14 件、Change 8 の 16 件、Change 9 の 8 件、Change 10 の 35 件超、Change 11 の 20 件、**`fix-misc` の 5 件（ブランチレビューの Minor 指摘）**（各 `openspec/changes/archive/*/tasks.md` の末尾）
4. Change 4・5 の後続への提案と申し送り（各 `openspec/changes/archive/2026-09-21-*/tasks.md` の末尾）
5. ヘッダーの常設ナビ（`Header.astro`）にはトップページ本文と同じドット絵アイコンを付けていない。意匠を揃えるなら別 change で検討（`fix-misc` の申し送り）
6. `fix-misc` で追加したドット絵（GitHub・LinkedIn・Career・言語切り替え）は「仮の絵」。ブランチレビューで briefcase（鞄）と globe（地球儀）の視認性が低いと指摘されている（`openspec/changes/archive/2026-09-22-fix-misc/tasks.md` 参照）
7. AWS 認定資格のバッジロゴ表示を再検討する場合は、見せ方（サイズ・配置・ドット絵化するか等）から設計し直す（一度実装し PO の判断で取り消し済み）

## PO 判断として残っている件

**Change 9**: 375×667（iPhone SE / 8）では写真の高さ上限が発動して、写真が本文の幅より 26.3% 狭くなる（写真 252.7×379 に対し本文幅 343）。spec が縛る 390×844 では全幅を満たしているので挙動は変えていない。狭い画面で写真を全幅に戻すなら新しい change が要る。

**Change 11**: 特許の見出しのうち 4 件に判断の余地がある（`JP2025095979A` の英語 "a single button"、`JP2020093622A` の英語 "in any car"、`JP7310636B2` と `JP2021111156A` の日本語が抽象的すぎる）。いずれも `en.yaml` / `ja.yaml` の 1 行で直せる。詳細は `openspec/changes/archive/2026-09-22-patents-full-retrieval/tasks.md` の「見出しの精度（PO 判断の余地）」。

**Change 10**: 写真の差し替え（同じ slug での `pnpm photo:add` 再実行）の実測は、偽の `gh` を使ってコード経路だけ通した。公開 Release の画像は入稿時に EXIF が落ちるため、それを入稿に渡すと差し替え経路へ到達しない。**PO 本人の元画像で 1 回実行すれば、spec の Scenario「差し替え後のビルドで古い版が残らない」まで確かめられる。**

## 未決事項

`docs/HANDOFF.md` §6 と `docs/harness/README.md` §5。影響する時点で PO に確認する。
