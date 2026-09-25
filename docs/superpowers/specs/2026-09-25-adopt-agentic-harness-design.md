# portfolio のハーネスを agentic-harness に移す — 設計

PO 承認 2026-09-25（brainstorming で方式 A と節 1〜3 を承認）。ブランチ `fix/adopt-agentic-harness`（ハーネスだけの変更なので change と Issue は作らない。`.claude/rules/git.md`）。

## 1. 目的と完了条件

portfolio が自前で持つハーネス（`.claude/hooks/`・`.claude/agents/`・superpowers スキルのコピー・日本語の CLAUDE.md と rules・settings・CI）を、配布版 `joe-yama/agentic-harness` v0.2.0（プラグイン `harness@agentic-harness` + Copier テンプレート）に置き換える。以後は `claude plugin update` と `copier update` で配布版の改善を受け取れるようにする。現行 hook の穴（`/bin/rm -rf`、`sh -c 'rm -rf …'`、`git -P push -f` の素通し、別リポジトリのファイルへの lint、`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=""` のスキーマ違反、`excludedCommands` が引数付きの git に一致しない）はこの置き換えで塞がる。

完了条件:

- `harness:adopt` §8 の確認がすべて通る（`rm -rf ./harness-guard-probe` が `BLOCKED by harness guard (rm-rf)`、`git push origin main` が `harness ask-gate (protected-push)` の確認になる、`/plugin` に `harness` と `superpowers`、`/agents` に `harness:implementer` と `harness:reviewer`、`gh skill list` に OpenSpec 6 個、ruleset `main` が残っている）
- CI の job `check` が緑
- `docs/status.md` の「Harness versions」が埋まっている

## 2. 決定事項（PO 2026-09-25）

| 論点 | 決定 |
|---|---|
| 移行の範囲 | Copier テンプレート + プラグインの両方（プラグインだけにはしない） |
| テンプレート由来の文書の言語 | 英語のまま。portfolio 固有の節だけ日本語で足す（`copier update` の 3-way マージを当たりやすくするため）。コミット・Issue・PR・OpenSpec・status は日本語（`work_language: ja`） |
| `.claude/skills/` | superpowers 12 個は削除し、プラグインの依存 `superpowers@claude-plugins-official` に任せる。OpenSpec 6 個と ponytail 2 個は `gh skill` 管理のまま残す |
| 進め方 | 方式 A: テンプレートを出力して既存ツリーに上書きし、`git diff` を見ながらファイルごとに portfolio 固有の内容を戻す |

採らなかった方式: 既存ファイルを残して無いものだけ足す（B）は、日本語の CLAUDE.md と rules がテンプレートと丸ごと食い違ったまま残り、次の `copier update` で全体が利用者の変更として扱われるので、テンプレートの改善がほぼ当たらない。scratch で手組み（C）は仕上がりが A と同じで、テンプレートとの差分が diff に残らない。

## 3. ファイルごとの扱い

### 3.1 テンプレート版に置き換え、portfolio 固有を足す

| ファイル | 足す portfolio 固有 |
|---|---|
| `AGENTS.md`（新規） | 製品要約（`project_summary`）、スタック（Astro + TypeScript、GitHub Pages + Actions、pnpm。写真は GitHub Releases のタグ `photos`）、コマンド表（`pnpm test` / `lint`（修正は `pnpm format`）/ `typecheck` / `build` / `e2e`。e2e は数十秒かかるので hook に入れず CI と reviewer が回す）、落とし穴（npm / npx は使わない）、索引（設計書 `docs/superpowers/specs/2026-09-17-portfolio-site-design.md`、`docs/content-authoring.md`、`docs/harness/README.md`、未決事項の場所） |
| `CLAUDE.md` | 環境固有の注意は `docs/harness/README.md` §3 を見るよう 1 行 |
| `.claude/rules/git.md` / `scope.md` / `security.md` / `testing.md` | テンプレートに無く、portfolio で効いている行だけ（例: `.env.example` は `.env.*` の deny のため PO が作る、依存追加時は用途・ライセンス・メンテ状況を添える）。テンプレートに同じ趣旨があれば足さない |
| `.claude/settings.json` | §4.2 |
| `.github/workflows/ci.yml` | §4.3 |
| `.mcp.json` | テンプレート版（`@playwright/mcp@0.0.82` 固定、現状は `@latest`）をそのまま |
| `.gitignore` | テンプレート版に portfolio の行（`node_modules/` `dist/` `build/` `coverage/` `.astro/` `.venv/` `__pycache__/` `*.log` `test-results/` `playwright-report/` `*.pem` `*.key` `secrets/` `.worktrees/`）を足す |
| `openspec/config.yaml` | テンプレート版（本文は同じ。コメント例が消えるだけ） |

`AGENTS.md` + `CLAUDE.md` + `.claude/rules/*.md` の合計は 16,000 B 以下（CI の context budget）。

### 3.2 テンプレートから新規

`.copier-answers.yml`、`.github/dependabot.yml`、`.github/pull_request_template.md`、`docs/harness/ruleset.json`（`docs/runs/main-ruleset.json` と名前以外同一なので置き換える。GitHub の ruleset `main` は貼り直さない）。

### 3.3 Copier が上書きしても portfolio 版に戻す

`docs/status.md`（テンプレートの「Harness versions」の表だけ足す）、`docs/changes.md`、`docs/harness/lessons.md`。

### 3.4 削除

| 対象 | 代わり |
|---|---|
| `.claude/hooks/block-destructive.sh` `ask-gate.sh` `lint-on-edit.sh` `test-on-stop.sh` | プラグインの `guard` / `ask-gate` / `lint-on-edit` / `test-on-stop` |
| `.claude/agents/implementer.md` `reviewer.md` | `harness:implementer` / `harness:reviewer` |
| `.claude/rules/review.md` | `harness:review-loop`（レビュー単位・Minor の扱い・立て直し条件・コントローラーの手順が同内容） |
| `.claude/skills/` の superpowers 12 個（brainstorming、dispatching-parallel-agents、executing-plans、finishing-a-development-branch、requesting-code-review、subagent-driven-development、systematic-debugging、test-driven-development、using-git-worktrees、using-superpowers、verification-before-completion、writing-plans） | `superpowers@claude-plugins-official` |
| `docs/harness/hooks.md` | 旧 hook の説明。プラグインの挙動は agentic-harness の README |
| `tests/unit/context-budget.test.ts` | CI の context budget 手順（上限は 20,000 B → 16,000 B、AGENTS.md も数える）。この test は rules が 5 本であることを前提にしているので移行後は落ちる |
| `docs/runs/main-ruleset.json` | `docs/harness/ruleset.json` |

### 3.5 書き換え

- `docs/harness/README.md`: §1「導入したもの」と §4「権限設定」を新構成（プラグイン + テンプレート、`HARNESS_*`、版の固定）に書き換える。§3 環境固有の注意、§6・§7 の実測は残す。旧 hook を前提にした記述（`rm -f a b c` が拒否される、等）は直す
- `.claude/settings.local.json`（git 管理外）: `skillOverrides` から superpowers 由来の 12 件を外す。OpenSpec 6 件の `off` は残す

### 3.6 触らない

`deploy.yml`、`docs/HANDOFF.md`（当時の記録）、OpenSpec スキル 6 個・ponytail 2 個・`.claude/commands/opsx/`、アプリのコードと既存テスト（`context-budget.test.ts` を除く）。

## 4. 設定値

### 4.1 Copier の回答

| 項目 | 値 |
|---|---|
| `project_name` | `portfolio` |
| `project_summary` | 英語 1 段落: the PO's personal business-card site for recruiters — career and photo portfolio, bilingual (ja / en), photo-first minimal design |
| `github_owner` | `joe-yama` |
| `default_branch` | `main` |
| `work_language` | `ja` |
| `lint_cmd` | `pnpm exec biome check --error-on-warnings --no-errors-on-unmatched` |
| `lint_pattern` | 空（docs 以外すべて。Biome が非対応ファイルを `--no-errors-on-unmatched` で読み飛ばす） |
| `test_cmd` | `pnpm test` |
| `ui_review` | `true` |

### 4.2 `.claude/settings.json`

テンプレート版に次を足す・変える。

- `env`: テンプレートの値（`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: "0"`、`HARNESS_PROTECTED_BRANCHES: "main"`、`HARNESS_LINT_CMD`、`HARNESS_TEST_CMD`）+ portfolio の `MCP_TIMEOUT: "120000"`
- `permissions.allow` に追加: `pnpm test|lint|typecheck|build|preview|e2e` と `pnpm run` の同形、`pnpm exec biome`、`pnpm exec playwright test`、`pnpm install --frozen-lockfile`、`git worktree remove`（`--force` は ask-gate が確認に回す）、`gh release view`、`gh release list`
- `permissions.ask`: テンプレートの `gh release:*` を `gh release create|upload|delete-asset` に置き換える（写真の参照を毎回確認にしないため）。`pnpm publish` を足す。portfolio にあった `pnpm add` は足さない（lockfile を変える install は ask-gate が確認に回す）
- `permissions.deny`: テンプレート版（portfolio の全項目を含む）
- `sandbox`: テンプレート版 + `allowedDomains` に `fonts.googleapis.com` `fonts.gstatic.com` `raw.githubusercontent.com`。このマシンでは `settings.local.json` が sandbox を無効にしているので実挙動は変わらない
- `extraKnownMarketplaces`（`v0.2.0` 固定）・`enabledPlugins`・`enabledMcpjsonServers`: テンプレート版
- `hooks`: 無し（節ごと削除）

`check-jsonschema` で SchemaStore の `claude-code-settings.json` に対して検証する（版は agentic-harness の計画の Global Constraints と同じもの）。

### 4.3 `.github/workflows/ci.yml`

テンプレート版（checkout の SHA 固定、`persist-credentials: false`、context budget）の後ろに portfolio の手順を並べる: `pnpm/action-setup`、`actions/setup-node`（`.node-version`、pnpm キャッシュ）、`pnpm install --frozen-lockfile`、`pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm build`、`pnpm exec playwright install --with-deps chromium`、`pnpm e2e`。追加するアクションも `gh api` で現行タグの SHA を引いて固定する。job 名は `check` のまま（ruleset の required status check）。

### 4.4 挙動の変わり目

1. guard が強くなる: `/bin/rm -rf`、`rm --force -r`、`sh -c 'rm -rf …'`、行継続、`git -P push -f`、Monitor ツール経由の破壊的コマンドも止まる。逆に、旧 hook が止めていた `rm -f a b c`（再帰なし）は止まらず、`permissions.ask` の `rm:*` に回る
2. test-on-stop は YAML / JSON の変更でも `pnpm test` を走らせる（旧 hook は除外していた）。コンテンツ YAML の編集で検査が走るようになる
3. lint-on-edit は JSON も検査する（CI の `pnpm lint` と同じ範囲）。別リポジトリのファイルには走らない

## 5. 手順

1. **出力**: `uvx copier@9.18.2 copy --vcs-ref v0.2.0 --data-file <回答> gh:joe-yama/agentic-harness <scratchpad>/render` で scratchpad に出力し、`.copier-answers.yml` ごと worktree に写す。worktree に直接出力しないのは、auto mode の分類器が `.claude/settings.json` を書く Bash を拒否するため。`_src_path` と `_commit` は出力先に依存しないので answers は同じになる
2. **戻し**: §3.1・§3.3 のとおりファイルごとに portfolio 固有を戻す。context budget を計算して 16,000 B 以下を確かめる
3. **削除**: §3.4 のうち保護パス以外（agents、`review.md`、superpowers スキル、`hooks.md`、`context-budget.test.ts`、`docs/runs/main-ruleset.json`）
4. **保護パス（PO）**: `<scratchpad>/apply.sh` を PO が `! bash <scratchpad>/apply.sh` で実行する。中身は `.claude/settings.json` の配置、`.claude/hooks/` の削除、`settings.local.json` の `skillOverrides` の書き換え、`check-jsonschema` による検証。settings の切り替えと hook の削除は同じコミットに入れる（途中のコミットで settings が消えた hook を指さないため）
5. **ローカル確認**: `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm e2e`、context budget、settings のスキーマ検証
6. **プラグイン導入と実機確認（PO）**: worktree で対話の `claude` を起動して trust を承認し、`claude plugin install harness@agentic-harness --scope project`、セッションを開き直して §1 の確認（ruleset 以外）を行う。結果を `docs/status.md` の「Harness versions」（agentic-harness タグ、Superpowers 版、OpenSpec CLI / スキルのタグ、Claude Code 版、確認結果）に書く
7. **レビュー**: 小さな change の経路に倣い、ブランチ全体を 1 回、portfolio の `reviewer`（`model: opus`）でレビューする（このセッションにはまだプラグインが入っていないため）
8. **PR と CI**: PR を作り、CI `check` の緑を最終証拠にする。PO がマージする
9. **マージ後**: main の新しいセッションで §1 の確認をもう一度行う。memory の `reference-agentic-harness` の「PO 未決」を移行済みに更新する

## 6. 失敗時とスコープ外

- マージ前はブランチを捨てる。マージ後は PR を revert し、`claude plugin uninstall harness@agentic-harness --scope project` で外す
- テンプレートやプラグインの欠陥が見つかったら、portfolio 側で回避せず agentic-harness で直してリリースし、portfolio では `copier update` / `claude plugin update` で取り込む
- スコープ外: 新しい hook やルールの追加、アプリの変更、GitHub の ruleset の貼り直し、`docs/patents-full-retrieval-wrapup` の worktree の片付け（main に無いコミットが 1 つ残る。扱いは PO 判断）
