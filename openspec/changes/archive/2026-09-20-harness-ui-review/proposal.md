# Proposal

## Why

`CLAUDE.md` と `.claude/rules/review.md` は「UI があるタスクは reviewer サブエージェントが Playwright MCP で実操作して検証する」と定めているが、Change 2 `layout-shell` で初めて UI をレビューした際、`.claude/agents/reviewer.md` の `tools` に `mcp__playwright__*` を書いてもサブエージェントに MCP ツールが渡らず（`No such tool available`）、実行できないことが分かった。（後日判明: MCP 側の制約ではなく、agent 定義の変更が実行中のセッションに反映されないことが原因。2026-09-20 の実測。Issue #6）reviewer は `~/Library/Caches/ms-playwright` の chrome-headless-shell を CLI で起動して代替し、PO 向けスクリーンショットは MCP を持つコントローラーが撮った。ルールと実行手段の食い違いを解消し、UI の独立レビューを再現可能な手順にする。

## What Changes

- Playwright MCP のツールをサブエージェントに渡せるか（agent 定義の `tools` の書き方、settings の MCP 許可、既知の制約）を Claude Code の公式ドキュメントで確認し、結果を `docs/harness/README.md` に記録する
- 渡せる場合: `.claude/agents/reviewer.md` に必要なツールだけを列挙し（`browser_run_code_unsafe` の要否を PO と決める）、ダミーの UI レビューを 1 回起こして動作を確認する
- 渡せない場合: ルールの文言を実行可能な手順に直す。候補は (a) reviewer が headless Chromium を CLI で使う手順を `docs/harness/README.md` に書き、`review.md` を「実ブラウザで実操作（Playwright MCP または headless Chromium）」にする、(b) `@playwright/test` の導入を Change 5 から前倒しして reviewer が Bash からスクリプトで検証する、(c) UI の実操作はコントローラーが行い reviewer は結果（スクリーンショット・計測値）を検証する。PO が選ぶ
- `CLAUDE.md`「標準ワークフロー」5 と `.claude/rules/review.md`「レビューの手順」3、`.claude/rules/testing.md` の「UI は Playwright MCP で実際に操作して確認する」を決定に合わせて更新する
- `docs/harness/README.md` §3 に Change 2 で判明した制約（MCP ツールの受け渡し、`browser_run_code_unsafe` の相対パスがメインリポジトリ root に落ちる、worktree の Bash ガードが拒否する複合コマンド）を追記する

含めないもの: サイトのコード変更（`layout-followups`）。hooks の変更。CI への e2e 追加（Change 5）。

## Capabilities

### New Capabilities

（なし。ハーネスのドキュメントと agent 定義の変更のみで、サイトの挙動は変わらない。`.openspec.yaml` に `skip_specs: true`）

### Modified Capabilities

（なし）

## Impact

- 変更候補: `.claude/agents/reviewer.md`、`.claude/rules/review.md`、`.claude/rules/testing.md`、`CLAUDE.md`、`docs/harness/README.md`
- `.claude/` 配下は Write / Edit ツールで編集する（サンドボックス内 Bash から書けない）
- 依存の追加: (b) を選んだ場合のみ `@playwright/test`（設計書 §9 の一覧内。PO 承認は必要）
- 参照: GitHub Issue #3 のコメント（2026-09-20「ハーネスの記録」「PO 判断が必要な点 2」）、revert コミット `9134f17`
