# CLAUDE.md — Agent 向け運用ルール

「人間 = PO、Claude Code = Agent」の開発ハーネス上で進める。経緯と未決事項は `docs/HANDOFF.md`、導入したハーネス部品と動作確認の記録は `docs/harness/README.md`（hooks の理由は `docs/harness/hooks.md`）。testing / git / security / scope / review の詳細ルールは `.claude/rules/` にあり、毎セッション自動ロードされる。

現在のフェーズ: **v1 公開済み（2026-09-21）**。公開 URL は `https://joe-yama.github.io/portfolio/`（`astro.config.ts` の `site: 'https://joe-yama.github.io'` + `base: '/portfolio'`。独自ドメインは使わず `public/CNAME` も作らない。PO 決定 2026-09-21）。**プロフィール・経歴・写真はサンプルデータのまま公開している**（実データへの差し替えは PO 待ち。写真は 2 枚）。`main` への push で `.github/workflows/deploy.yml` が GitHub Pages へ公開する（Pages は `build_type=workflow` で有効化済み）。`main` には ruleset（PR 必須 + CI 必須、required status check は CI の job 名 `check`）があるので、**`main` への直接 push はできない。変更は必ず PR で行う**（CI の job 名 `check` を変えると以後どの PR もマージできなくなる）。

ハーネス構築完了（2026-09-17）、設計書 `docs/superpowers/specs/2026-09-17-portfolio-site-design.md` を PO 承認・レビュー反映済み（2026-09-17、Change 2 の決定を 2026-09-18 に反映、公開先の決定を 2026-09-21 に反映）。`docs/HANDOFF.md` §3 のセットアップ手順は再実行しない。**Change 1〜5 はすべてマージ・アーカイブ済み**（`openspec/changes/archive/`、main spec は `openspec/specs/{content-schema,deployment,i18n-routing,layout-shell,photo-pipeline,profile-and-career,quality-gates}` の 7 つ）:

- Change 1 `project-foundation` = PR #2、Change 2 `layout-shell` = PR #4（経緯・裁定・申し送りは Issue #3）
- Change 2 派生の `harness-ui-review`（Issue #6）= PR #7（reviewer の `tools` に Playwright MCP 11 個。UI は reviewer 自身が実操作する）、`layout-followups`（Issue #5）= PR #9（後続への提案 10 件は `openspec/changes/archive/2026-09-20-layout-followups/tasks.md` の末尾）
- Change 3 `photo-pipeline`（Issue #10）= PR #12。**経緯・レビュー結果・裁定 8 件は Issue #10 のコメント**、後続への提案 40 件超は `openspec/changes/archive/2026-09-21-photo-pipeline/tasks.md` の末尾
- Change 4 `profile-and-career`（Issue #13）= PR #14（2026-09-21。トップの連絡先リンクと導線、`/career/`。main spec `profile-and-career` を新規作成）
- Change 5 `deploy-and-e2e`（Issue #15）= PR #16（2026-09-21。`base` 対応、Playwright e2e 27 件、`deploy.yml`。main spec `deployment` を新規作成し、`i18n-routing` / `layout-shell` / `quality-gates` に delta を統合）

**v1 リリースの計画・裁定 17 件・実測は `docs/runs/2026-09-21-v1-release.md` と `docs/runs/2026-09-21-v1-release-ledger.md` にある。** Change 4・5 の後続への提案と申し送りは各 `openspec/changes/archive/2026-09-21-*/tasks.md` の末尾。

実物で初めて見つかった欠陥は**単体テストでは原理的に検出できなかった**ものが多い。Change 3 の 4 件（`exifr` のファイルパス経路が Node 26 で壊れる、`image.domains` がリダイレクト先を許可していない、`--slug` の無検証、UTC 固定のテストが CI で番人にならない）に加え、Change 5 では **CI でだけ壊れる 2 件**が出た: (1) `astro preview` は対話端末では自動デーモン化するが CI では前景実行になり `execSync` がブロックする（`--background` を明示し `fetch` で 200 を待つ）、(2) 既定バインド先の `localhost` は ubuntu runner では IPv6 `::1` に解決され `127.0.0.1` 宛が拒否される（`--host 127.0.0.1` を明示する）。**ローカルの緑を完了の根拠にせず、CI の実行結果を最終証拠にする。**

**写真を差し替える（同じ slug で `pnpm photo:add` を再実行する）ときは 2 点に注意する**: (1) 温かいキャッシュでは古い画像がビルド出力に残る（Astro のバグ。`node_modules/.astro/assets` を消してからビルドする）、(2) 既存の YAML が無条件に上書きされ、手で書いた `title` / `location` / `alt` が `TODO:` に戻る（ビルドは止まるので気づける。`git checkout -- <yaml>` で復旧）。

2026-09-20 に承認プロンプトとターン数を減らすハーネス調整を反映した（ブランチ `fix/harness-autonomy`。実測と設定の一覧は `docs/harness/README.md` §4・§6、hook は `docs/harness/hooks.md` §4）。bypass permissions での無人実行の実測は `docs/harness/README.md` §4（**bypass では `gh pr merge` も `gh api -X POST` もプロンプトなしで通るので、歯止めは権限設定ではなく計画側の条件になる**）。Task 8〜11 を Workflow で実行した結果、従来 12〜16 ターンの範囲を 3 ターンで通せた（`docs/harness/README.md` に追記する候補）。

未着手の change は無い。次にやることは PO の指示待ち（候補: サンプルデータの実データ差し替え、写真の追加、独自ドメインへの移行 = 設計書 §9 の手順で `base` の削除が必要）。残る未決事項（HANDOFF §6、harness README §5）は影響する時点で PO に確認する。

## プロジェクト概要

PO 本人の名刺となる Web サイト。採用担当・転職エージェント向けの経歴と、アマチュアカメラマンとしての写真ポートフォリオを載せる。日英二言語、写真主役のミニマルデザイン。詳細は設計書を正とする。

## 役割分担

- PO（人間）: 何を作るか・優先順位・受け入れ判断・質問への回答。コードや実装詳細は指定しない
- Agent（Claude Code）: 設計提案・実装・テスト・レビュー・ドキュメント。設計承認前の実装と仕様外の機能追加はしない
- 判断が必要な点は勝手に決めず PO に質問する。ただし実装中は止まらず、spec を正として裁定し、ledger と Issue に「裁定 / 理由 / 間違っていたときの代償」を記録して進む（PO が後から覆せる）。止まるのは破壊的・不可逆な操作、セキュリティ、worktree 外への副作用（push・publish）、どの道も推測になる計画の欠陥、の 4 つだけ
- 作った側の自己評価を信用せず、レビュー/QA は別コンテキストのサブエージェントが行う
- 使用モデル（予算。PO 指示 2026-09-17、コントローラーは 2026-09-20 追加）: 実装は Sonnet（`subagent_type: implementer`）、レビューは Opus（`subagent_type: reviewer`）、実装フェーズのコントローラーは Opus（`/model opus`）。レビューは敵対的 + ponytail 観点。レビュー結果がひどい場合の Opus 実装への切り替え条件は `.claude/rules/review.md`

## 標準ワークフロー（1 機能あたり）

1. PO がアイデアを 1〜4 文で提示する
2. `superpowers:brainstorming` で Agent が質問し、設計を段階的に提示。PO が承認する。design の Open Questions はここで全部決めてもらう（実装中に PO を止めないため）
3. `/opsx:propose` で proposal / spec / design / tasks を生成し、同時に GitHub Issue を 1 つ作る（change 1 つ = Issue 1 つ。詳細は `.claude/rules/git.md`）。PO がレビューし承認する
4. 実装は**新しいセッション**で始め、コントローラーのモデルは Opus にする（`/model opus`。設計までのセッションのコンテキストを持ち込まない）。`superpowers:writing-plans` → `superpowers:subagent-driven-development` で実装（TDD 強制）。実装計画にはレビューの単位（タスクごとか、まとめてか。`.claude/rules/review.md`）を書く。実装は `implementer`（Sonnet）サブエージェントを Agent ツールで起こす（agent teams はこのリポジトリでは無効。`.claude/settings.json` の `env`）。ブロッカー以外で PO を呼ばない。Issue へのコメントは節目だけ（`.claude/rules/git.md`）。`tasks.md` のチェックは implementer が自分のコミットに含める
5. 独立レビュー: `reviewer`（Opus）サブエージェントが「仕様準拠 → コード品質 → ponytail」の順で敵対的にレビュー。再レビューは同じ reviewer に `SendMessage`、Minor は修正せず後続へ（`.claude/rules/review.md`）。UI は reviewer 自身が Playwright MCP で HTTP の URL を実操作して検証する（`reviewer.md` の `tools` に必要な 11 ツールを列挙済み。`browser_run_code_unsafe` は渡さない）
6. PR を作る（本文に `Closes #<Issue 番号>`）。PO が受け入れてマージすると Issue が閉じる。その後 `/opsx:archive` で change をアーカイブする

### 小さな change の経路（PO 承認 2026-09-20）

docs / `.claude/` / CSS だけの変更、または変更ファイルが 5 以下で新しい spec 要求を含まない change は短くする: 2 は省いてよい。3 はそのまま（Issue は作る）。4 は writing-plans を省き、`tasks.md` をそのまま brief にして implementer を 1 回起こす。5 はブランチ全体のレビュー 1 回だけで、修正は同じ implementer に `SendMessage` で頼む。6 は同じ。OpenSpec の change を伴わないハーネスとドキュメントだけの変更は Issue を作らず `fix/<説明>` ブランチの PR で行う（PR #8 の前例）。判定に迷う change は通常の経路を使う。根拠: `harness-ui-review`（agent 定義 1 行と文言の統一）に通常の経路で 344 メッセージ・サブエージェント 10 回を使った。

## 完了の定義

テスト緑（実行コマンドと結果を示す）・lint 通過・OpenSpec の `tasks.md` 更新・コミット済み、をすべて満たしたときのみ「完了」と報告する。
PostToolUse hook が編集ファイルに Biome を、Stop hook が `pnpm test` を実行するが、Agent は報告時にテスト緑・lint 通過を実行コマンドと出力で自分でも示す。

## 自律実行

- 長時間タスクは `/goal <完了条件> or stop after N turns` で回す。ターン上限は必ず付ける。auto mode（ユーザー設定の `defaultMode`）が前提で、`permissions.ask` に当たる操作と保護パス（`.claude/` など）への書き込みだけが PO を止める
- 無人で回すときは `claude -p --permission-mode auto --permission-prompts none --max-turns N` にする。プロンプトになる操作は拒否されて先へ進む（止まらないが、その操作は残るので報告に書かせる）
- `/loop` には回数上限が無い。停止条件をプロンプトに書き、回数制限が必要な作業は `/goal` を使う
- sandbox はこのマシンでは `.claude/settings.local.json` で無効。有効に戻すときの設定と未検証の点は `docs/harness/README.md` §4

## Compact instructions

コンパクション時は次を必ず残す: 進行中の change 名と Issue 番号、worktree のパスとブランチ名、SDD ledger のパス（`.superpowers/sdd/<plan>/progress.md`）、完了済みタスクと現在のタスク番号、直近のレビュー判定と未対応の Critical / Important、PO の決定と未回答の質問、テスト・lint の実行コマンド。ツール出力の本文、探索的に読んだファイルの内容、サブエージェントの報告全文は要約に落とす。

## 環境の注意点（このマシン固有）

- `.claude/settings.json` と `.claude/hooks/` への書き込みは、auto mode の分類器が Self-Modification として拒否する（2026-09-20 実測。プロンプトではなく拒否）。Agent は完成版を scratchpad に置き、PO が `! cp <scratchpad の完成版> <配置先>` で置くか、manual mode に切り替えて承認する。`.claude/agents/` `.claude/rules/` `CLAUDE.md` は Write / Edit ツールで編集できる。sandbox 内の Bash からは `.claude/skills/` `.mcp.json` も書き込めない
- `git commit` は 1Password の SSH 署名を使う。sandbox が有効な環境では sandbox 外で実行する。このマシンでは `.claude/settings.local.json` が sandbox を無効にしているので、そのまま通る（2026-09-20 確認）
- 権限ルールは deny → ask → allow の順で評価され、出所（ユーザー設定かプロジェクト設定か）も具体性も順序を変えない。`~/.claude/settings.json` の `ask` に残っている操作はプロジェクトの `allow` では自動化できない。予期しないプロンプトが出たら最初にここを疑う（2026-09-20 まで `gh issue comment` がこれで毎回止まっていた）
- `gh` には職場アカウントを含む複数のログインがある。Issue / PR / Release に書き込む前に `gh api user --jq .login` が `joe-yama` であることを確認し、違えば PO に切り替え（`gh auth switch -h github.com -u joe-yama`）を依頼して止まる。ユーザー設定の hook（`~/.claude/permission-gate.sh`）も同じ検査をして、joe-yama 以外なら確認に回す
- Playwright MCP は `file:` URL を拒否する。UI 検証は `pnpm build && pnpm preview` で HTTP 配信する（`http://127.0.0.1:4321/`。停止は `pnpm exec astro preview stop`）。preview の疎通確認は `curl`（ask）ではなく `browser_navigate` で行う
- `.claude/agents/*.md` の変更は実行中のセッションに反映されない（セッション開始時の定義が使われる）。`tools` を変えたらセッションを開き直してから dispatch する。worktree で編集した場合も同じ（2026-09-20 実測）
- permissions の `Read(.env.*)` deny は `.env.example` にも当たる。`.env.example` の作成・更新は PO が行う

## スキルの管理（PO 指示）

`.claude/skills/` 配下は全て `gh skill` 管理（出所とバージョンは `gh skill list` で確認）。追加・更新は `gh skill install --pin <tag>` / `gh skill update` で行い、SKILL.md の手コピーやツール独自の生成コマンドに任せない。`openspec update` は gh skill 管理のスキルを上書きするので、実行後は `docs/harness/README.md`「スキルの更新ルール」の手順で再導入する。

## 技術スタック

Astro（TypeScript）+ GitHub Pages + GitHub Actions、パッケージマネージャは pnpm（npm / npx は使わない）。写真ファイルは git に入れず GitHub Releases（タグ `photos`）に置く。詳細は設計書 §2・§5・§9。導入は最初の change の中で行い、承認前に依存の追加やスキャフォールドを行わない。同じ change で更新するハーネス側のファイルは設計書 §8.1 と `docs/harness/README.md` §5 に従う。

## コマンド

| コマンド | 用途 |
|---|---|
| `openspec list` / `openspec list --specs` | 進行中の change / 仕様の一覧 |
| `gh skill list --agent claude-code --scope project` | 導入済みスキルの出所とピン留めの確認 |
| `gh api user --jq .login` | `gh` の書き込み前にアカウントが `joe-yama` か確認 |
| `gh issue list` / `gh issue view <n>` | 進行中の change の Issue と経過を確認 |
