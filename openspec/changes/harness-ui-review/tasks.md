# Tasks

ハーネスの変更のみ（`skip_specs: true`）。`.claude/` 配下は Write / Edit ツールで編集する。実装コードのテストは無いが、agent 定義の変更は実際に reviewer を 1 回起こして動作を確認する。

## 1. 事実の確定

- [x] 1.1 Claude Code の公式ドキュメント（サブエージェントの `tools`、MCP サーバー）で、MCP ツールをサブエージェントに渡す方法と制約を確認し、結果（可否・書き方・出典 URL）を GitHub Issue にコメントする
- [x] 1.2 `reviewer.md` の `tools` に `mcp__playwright__browser_navigate` だけを足し、`pnpm build && pnpm preview` の `http://127.0.0.1:4321/ja/` を開いてタイトルを返すだけの reviewer を起こして、ツールが渡るか実測する。結果を Issue にコメントし、試験用の変更は元に戻す

## 2. 方針決定（PO）

- [x] 2.1 1.2 の結果を PO に提示し、渡せる場合は design D2（`run_code_unsafe` の要否を含む）、渡せない場合は D3 の (a) / (b) / (c) を PO が選ぶ。決定を Issue にコメントする

## 3. 反映

- [x] 3.1 渡せる場合: `reviewer.md` の `tools` に D2 の 11 個（+ PO 許可時 `run_code_unsafe`）を列挙し、`http://127.0.0.1:4321/ja/` に対して「ヘッダー 4 リンクの href を返す」reviewer を起こして動作を確認する
- [x] 3.2 **該当なし（D1 の実測で「渡せる」ため）**: (b) の場合: PO に `@playwright/test` の用途・ライセンス（Apache-2.0）・メンテ状況を提示して承認を得てから `pnpm add -D @playwright/test` と `pnpm exec playwright install chromium` を行い、`scripts/` か `tests/e2e/` の雛形なしで、reviewer が Bash から `pnpm exec playwright screenshot` 等を使える手順を `docs/harness/README.md` に書く。lockfile をコミットする
- [x] 3.3 **該当なし（D1 の実測で「渡せる」ため）**: (a) の場合: Change 2 で reviewer が使った headless Chromium の手順（起動コマンド、`--log-net-log`、dist 複製 + probe ページ、ダークは `--blink-settings=preferredColorScheme=0`）を `docs/harness/README.md` に書く
- [x] 3.4 **該当なし（D1 の実測で「渡せる」ため）**: (c) の場合: コントローラーが計測値とスクリーンショットを `.superpowers/sdd/<plan>/` に残し reviewer がそれを検証する手順を `.claude/rules/review.md` に書く
- [x] 3.5 決定に合わせて `CLAUDE.md`「標準ワークフロー」5、`.claude/rules/review.md`「レビューの手順」3、`.claude/rules/testing.md` の UI 検証の記述を更新し、3 ファイルの文言が一致することを grep で確認する
- [x] 3.6 `docs/harness/README.md` §3 に design D4 の 3 点（MCP の受け渡し、`run_code_unsafe` の相対パス、worktree の Bash ガード）を追記する

## 4. 仕上げ

- [x] 4.1 `pnpm lint && pnpm typecheck && pnpm test && pnpm build` が 0 のまま（ハーネス変更で壊れていない）で、`openspec validate harness-ui-review --strict` が valid、`git status --short` が空であることを確認し、本ファイルを更新してコミットする
- [x] 4.2 `gh api user --jq .login` が `joe-yama` であることを確認してから push（PO に確認）し、`Closes #6` を本文に含む PR を作り、CI 緑を確認して Issue にコメントする
