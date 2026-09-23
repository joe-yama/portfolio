# change の履歴

Change 1〜11 と `fix-misc`・`icon-refresh`・`followup-minors`・`header-nav-icons` はすべてマージ・アーカイブ済み。**正本は `openspec/changes/archive/<name>/` と GitHub の Issue / PR** で、この表はその索引。経緯・裁定・後続への提案を追うときは、まず下の「経緯の在り処」を見る。

| # | change | Issue | PR | 日付 | 要点 |
|---|---|---|---|---|---|
| 1 | `project-foundation` | — | #2 | 2026-09-18 | Astro + pnpm + Biome + Vitest の土台 |
| 2 | `layout-shell` | #3 | #4 | 2026-09-20 | レイアウトとヘッダー。日英の骨格 |
| 2a | `harness-ui-review` | #6 | #7 | 2026-09-20 | reviewer の `tools` に Playwright MCP 11 個。UI は reviewer 自身が実操作する |
| 2b | `layout-followups` | #5 | #9 | 2026-09-20 | Change 2 の後追い修正 |
| 3 | `photo-pipeline` | #10 | #12 | 2026-09-21 | 写真の取り込み・最適化・個別ページ |
| 4 | `profile-and-career` | #13 | #14 | 2026-09-21 | トップの連絡先リンクと導線、`/career/`。main spec `profile-and-career` を新規作成 |
| 5 | `deploy-and-e2e` | #15 | #16 | 2026-09-21 | `base` 対応、Playwright e2e 27 件、`deploy.yml`。main spec `deployment` を新規作成し `i18n-routing` / `layout-shell` / `quality-gates` に delta を統合 |
| 6 | `real-profile-data` | #18 | #19 | 2026-09-21 | プロフィールと経歴を実データに。`validateCareerParity` に `skills` の日英検証を追加 |
| 7 | `date-precision-and-seo` | #22 | #24 | 2026-09-21 | 資格・実績の日付に `YYYY-MM` を許す。`sitemap.xml` / `canonical` / `description`。main spec `sitemap` を新規作成 |
| 8 | `patents-section` | #21 | #26 | 2026-09-21 | 経歴ページに「特許 / Patents」区画。実データ 51 件。先頭 5 件は常時表示、6 件目以降は `<details>`（JavaScript は使わない） |
| 9 | `photo-height-cap` | #23 | #28 | 2026-09-21 | 写真の表示高さの上限を CSS だけで設け、第一画面に名前・肩書・連絡先・導線を収めた。e2e 27 → 45 件 |
| 10 | `followup-hardening` | #29 | #35 | 2026-09-22 | 写真入稿の冪等化と引数解析、OGP/Twitter カード、色コントラストの検算、暦の検査と日英パリティの強化、`base`/弱い assert の整理、e2e の拡充と CI（deploy.yml）の permissions を job 単位に、404/ヘッダーの細部修正 |
| 11 | `patents-full-retrieval` | #34 | #37 | 2026-09-22 | 特許を**公報単位 51 件から同族単位 65 発明**に作り直し、代表を JP 公報番号に、`countries` を最大 6 か国まで、`filedAt` を同族の優先日に。**掲載名称を公報の正式名称から請求項 1 から起こした短い見出しへ**（PO 指示）。`validateCareerPatents` で `countries[0]` と見出しの長さをビルド検証、`PatentItem.astro` で `<li>` の重複を解消、英語ページのリンクを `/en` に。main spec `content-schema` / `profile-and-career` に delta を統合 |
| 12 | `fix-misc` | #39 | #40 | 2026-09-22 | ヘッダーの名前の下線除去、トップページ本文の並び替えとドット絵アイコン、経歴の文言とスキルの更新。main spec `profile-and-career` に delta を統合 |
| 13 | `icon-refresh` | #43 | #46 | 2026-09-23 | 鞄と地球儀のドット絵を描き直し、アイコン取り違えの番人を座標の完全一致に強化、アイコンの対応づけを表示ラベル非依存に（spec 変更なし） |
| 14 | `followup-minors` | #45 | #48 | 2026-09-23 | Change 7〜11 の申し送りの束。特許の `url` 必須化と公報番号の重複検出、`getCareer` の配線テスト、暦日の年 0001〜0099、入稿コマンドの 1 行中断とスクリプト基準のパス、e2e の対象を写真データから導きステータスも検査（69 → 75 件）。main spec `content-schema` / `profile-and-career` / `photo-pipeline` に delta を統合 |
| 15 | `header-nav-icons` | #51 | #53 | 2026-09-23 | ヘッダーの Photos / Career / 言語切り替えにトップ本文と同じ 16px のドット絵。アイコンは導線のデータ（`navLinks()` / `languageSwitch()`）が持ち `pairByIndex` を削除。**幅 30rem 未満ではヘッダーのアイコンを隠して 1 行を保つ**（実装中の PO 決定）。e2e のアイコン検査を行き先で選ぶ形に（75 → 107 件）。main spec `layout-shell` に delta を統合 |

## 経緯の在り処

| change | 経緯・裁定 | 後続への提案 |
|---|---|---|
| 2 | Issue #3 | — |
| 2a / 2b | Issue #6 / #5 | `openspec/changes/archive/2026-09-20-layout-followups/tasks.md` 末尾（10 件） |
| 3 | Issue #10 のコメント（裁定 8 件） | `openspec/changes/archive/2026-09-21-photo-pipeline/tasks.md` 末尾（40 件超） |
| 4 / 5 | — | 各 `openspec/changes/archive/2026-09-21-{profile-and-career,deploy-and-e2e}/tasks.md` 末尾 |
| 7 | — | `openspec/changes/archive/2026-09-21-date-precision-and-seo/tasks.md` 末尾（14 件） |
| 8 | Issue #21 のコメント（掲載内容の確認依頼と裁定） | `openspec/changes/archive/2026-09-21-patents-section/tasks.md` 末尾（16 件） |
| 9 | Issue #23 のコメント（レビュー結果と裁定） | `openspec/changes/archive/2026-09-21-photo-height-cap/tasks.md` 末尾（8 件） |
| 10 | Issue #29 のコメント（レビュー結果と裁定 8 件） | `openspec/changes/archive/2026-09-22-followup-hardening/tasks.md` 末尾（35 件超） |
| 11 | Issue #34 のコメント（レビュー 4 回の結果と裁定 25 件）。掲載する全 65 件の照合表は `openspec/changes/archive/2026-09-22-patents-full-retrieval/research/publications.md`、取得手順と HTML の落とし穴 4 つは同 `research/method.md` | `openspec/changes/archive/2026-09-22-patents-full-retrieval/tasks.md` 末尾（20 件） |
| 12 | Issue #39 | `openspec/changes/archive/2026-09-22-fix-misc/tasks.md` 末尾（Minor 1〜5 は `icon-refresh` で対応済み） |
| 13 | Issue #43 のコメント（最終レビューの結果） | `openspec/changes/archive/2026-09-23-icon-refresh/tasks.md` 末尾（3 件） |
| 14 | Issue #45 のコメント（最終レビューの結果と裁定） | `openspec/changes/archive/2026-09-23-followup-minors/tasks.md` 末尾（実装時の裁定 7 件と Minor・ponytail 約 25 件） |
| 15 | Issue #51 のコメント（実装開始時の裁定 2 件、方針変更、最終レビューの結果） | `openspec/changes/archive/2026-09-23-header-nav-icons/tasks.md` 末尾（7 件） |

## v1 リリース

計画・裁定 17 件・実測は `docs/runs/2026-09-21-v1-release.md` と `docs/runs/2026-09-21-v1-release-ledger.md`。

## ハーネスの経緯

- ハーネス構築完了: 2026-09-17（`docs/harness/README.md`）
- 2026-09-20 に承認プロンプトとターン数を減らすハーネス調整（ブランチ `fix/harness-autonomy`）。実測と設定の一覧は `docs/harness/README.md` §4・§6、hook は `docs/harness/hooks.md` §4
- bypass permissions での無人実行の実測は `docs/harness/README.md` §4（**bypass では `gh pr merge` も `gh api -X POST` もプロンプトなしで通るので、歯止めは権限設定ではなく計画側の条件になる**）
- Task 8〜11 を Workflow で実行した結果、従来 12〜16 ターンの範囲を 3 ターンで通せた
