# 現在の状態

最終更新: 2026-09-25（change `recruiter-and-photo-polish` のマージとアーカイブ時点）。`CLAUDE.md` の索引から参照される。

## フェーズ

**v1 公開済み**（2026-09-21）。change `recruiter-and-photo-polish`（Issue #60、PR #61）をマージ・アーカイブ済み（2026-09-25）。**進行中の change は無い。**

2026-09-23 から implementer も Opus で動かす（PO 指示、PR #44。`.claude/rules/review.md`）。

## 公開先（PO 決定 2026-09-21）

- 公開 URL: `https://joe-yama.github.io/portfolio/`
- `astro.config.ts` の `site: 'https://joe-yama.github.io'` + `base: '/portfolio'`
- 独自ドメインは使わず `public/CNAME` も作らない
- GitHub Pages は `build_type=workflow` で有効化済み。`main` への push で `.github/workflows/deploy.yml` が公開する
- `main` には ruleset（PR 必須 + CI 必須、required status check は CI の job 名 `check`）がある

## 掲載データの状態

- **プロフィールと経歴は PO 本人の実データ**（2026-09-21、Change 6 で差し替え）。出典は本人の公開 LinkedIn で、掲載範囲は PO が項目ごとに決定済み。実名・勤務先・職歴・資格・論文が公開 URL に載っている
- **特許は PO 本人の実データ 65 発明**（2026-09-22、Change 11 で公報単位 51 件から同族単位に作り直し）。代表は JP 公報番号、出願国は最大 6 か国、US を含むものが 47 件。**掲載する名称は公報の正式名称ではなく、請求項 1 から起こした短い見出し**（裁定 D12）。日本語の名称が暫定なのは JP 代表公報が無い 2 件だけ。掲載する全 65 件の照合表（見出し / 正式名称 / 請求項 1 の全文）は `openspec/changes/archive/2026-09-22-patents-full-retrieval/research/publications.md`。見出し 4 件を 2026-09-23 に直した（`followup-minors-2`。新しい見出しの出典は `openspec/changes/archive/2026-09-23-followup-minors-2/design.md` D1。archive の照合表 `publications.md` は旧い見出しのまま）
- **Change 8 が載せていた `JP7151181B2` は PO の発明ではなかった**ので Change 11 で落とした（発明者に PO が含まれず、名前は説明文中の引用文献の著者として現れるだけだった）。戻す判断をする場合の根拠は同じ `publications.md` の「落とした公報」
- **写真はサンプルのまま 2 枚**（差し替えは PO 待ち）。375×667 では写真の高さ上限が発動して本文の幅より狭くなるが、直さない（PO 決定 2026-09-23、Change 9 の件）。写真が 0 枚だと代表写真が無いのでビルドが落ちる（2026-09-23、`followup-minors-2`）
- **経歴の一部文言・スキルを更新**（2026-09-22、`fix-misc`）。experience 先頭項目の role から「（全社横断）」を削除、bullets を「…開発標準活動を立ち上げリーディング」に変更。skills「クラウド」に「プラットフォームエンジニアリング」追加、「プログラミング言語」を `[Python, Java, Scala, C++, TypeScript]` に置き換え（SQL を除外）、新カテゴリ「言語」（英語を第一言語とするチームのリーディング）を追加。特許の区画見出しを「特許」→「代表的な特許」に変更（区画の構成・折りたたみの挙動は変更なし）
- **AWS 認定資格 12 件へのバッジロゴ表示は一度実装したが、PO の判断（見た目が良くない）で取り消した**（2026-09-22、`fix-misc`）。詳細と再挑戦時の考慮点は `openspec/changes/archive/2026-09-22-fix-misc/tasks.md` の「提案」
- **特許の `url` は必須**（2026-09-23、`followup-minors`）。欠けていたり、同じ言語の中で公報番号が重複したりするとビルドが落ちる。`url` のパスに `number` が区切りとして入っていない（別の公報を指す）ときもビルドが落ちる（2026-09-23、`followup-minors-3`）。特許の見出しはすべてリンクになる（全 65 件が元から `url` を持っていたので見た目は変わらない）
- **ヘッダーの Photos / Career / 言語切り替えにトップ本文と同じドット絵**（2026-09-23、`header-nav-icons`）。幅 30rem（480px）未満ではヘッダーのアイコンを隠し、ヘッダーを 1 行に保つ（PO 決定。アイコンを付けたままだと 390〜443px でヘッダーが 2 行になる）。アイコンは `navLinks()` / `languageSwitch()` のデータが持ち、トップとヘッダーが同じ対応を使う。1 行のときロゴとナビの文字のベースラインは 0.5px 以内にそろう（PO 決定。`followup-minors-3` で 1.9px のずれを直した）
- トップページのドット絵のうち鞄（Career）と地球儀（言語切り替え）を描き直し、アイコン取り違えの番人を座標の完全一致に強化（2026-09-23、`icon-refresh`）
- トップページ本文最下部を「サイト内導線（Photos/Career/言語切り替え） → 連絡先リンク（GitHub/LinkedIn）」の順に入れ替え、5 リンクにドット絵アイコンを追加（2026-09-22、`fix-misc`。`profile-and-career` spec 改定済み）
- **経歴のスキルに「コーヒー」を追加**（2026-09-23、PR #42）。スキル表の最終行に `コーヒー: [ハンドドリップ, モカポット, たいてい1日に5杯]` / `Coffee: [Hand drip, Moka pot, Usually five cups a day]` を置き、トップの肩書 "Builder, photographer, coffee lover" のコーヒーを経歴ページで回収した

- **経歴ページの冒頭に要約 4 行**（2026-09-24、`recruiter-and-photo-polish`）。`career` の必須項目 `highlights`（1〜4 件）を `Career` 見出しの直下に見出しなしで出す。日英で件数が違うとビルドが落ちる。文言は YAML に手で書く
- **AWS 認定 12 件を 1 行に束ねた**（同）。資格の任意項目 `group` が同じものを「2025年4月 – 2025年10月 · AWS 認定（12 件）」の 1 行にまとめ、次の行の頭の「▶ 全 12 件を表示」（en は「Show all 12」）で内訳を開く（JavaScript なし。行の形は PO 決定）。`group` の付き方が日英で違うとビルドが落ちる
- **幅 64rem（1024px）以上のトップは写真を左・文字を右の横並び**（同）。トップだけ本文の幅の上限（80rem）を外し、写真の左端はヘッダーのロゴにそろう（PO 決定）。写真は 1280×720 で約 730×486px、1920×1080 で約 1114×742px。代表写真の `sizes` は列の幅に合わせてある。64rem 未満は従来の縦並びのまま
- **写真の個別ページの共有カードはその写真から作る**（同）。ほかのページは代表写真
- **トップの「仕事の一行」（headline）は実装したが PO の判断で取り下げた**（同）。description と共有カードの説明は `tagline` のまま

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
3. Change 7 が後続へ回した 14 件、Change 8 の 16 件、Change 9 の 8 件、Change 10 の 35 件超、Change 11 の 19 件（20 件のうち隔離実行の手順の件は 2026-09-23 に対応済み）、`icon-refresh` の 3 件（各 `openspec/changes/archive/*/tasks.md` の末尾）。**Change 7〜11 の分は `followup-minors` で仕分け・対応済みで、束に入れなかったもの（新機能・PO 判断・写真表示まわり）が残る**。`followup-minors` 自身の申し送り（Minor・ponytail 約 25 件）は `openspec/changes/archive/2026-09-23-followup-minors/tasks.md` の末尾。`header-nav-icons` の申し送り 7 件と `followup-minors-2` の申し送り 20 件は `followup-minors-3` で仕分け・対応済み（対応しなかった件は `openspec/changes/archive/2026-09-23-followup-minors-3/proposal.md` の「含めない」）。`followup-minors-3` 自身の申し送り約 20 件（配信 CSS でメディアクエリが範囲構文に書き換わり design D2 の古い Safari 対策が効かない件の PO 判断、ベースラインの測り方の -0.112px の偏り、pid が取れず失敗したとき preview がポート 4399 に残る、ほか）は `openspec/changes/archive/2026-09-23-followup-minors-3/tasks.md` の「提案」。`recruiter-and-photo-polish` の申し送りは見た目の PO 判断 2 件（2560 幅でトップの右列の右に約 750px の空白、高さの上限が効く画面で写真と文字の間が約 78px）で、`openspec/changes/archive/2026-09-24-recruiter-and-photo-polish/tasks.md` の「提案」
4. Change 4・5 の後続への提案と申し送り（各 `openspec/changes/archive/2026-09-21-*/tasks.md` の末尾）
5. AWS 認定資格のバッジロゴ表示を再検討する場合は、見せ方（サイズ・配置・ドット絵化するか等）から設計し直す（一度実装し PO の判断で取り消し済み）

## PO 判断として残っている件

**Change 10**: 写真の差し替え（同じ slug での `pnpm photo:add` 再実行）の実測は、偽の `gh` を使ってコード経路だけ通した。公開 Release の画像は入稿時に EXIF が落ちるため、それを入稿に渡すと差し替え経路へ到達しない。**PO 本人の元画像で 1 回実行すれば、spec の Scenario「差し替え後のビルドで古い版が残らない」まで確かめられる。**

## 未決事項

`docs/HANDOFF.md` §6 と `docs/harness/README.md` §5。影響する時点で PO に確認する。
