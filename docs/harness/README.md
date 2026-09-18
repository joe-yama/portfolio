# ハーネス構築の記録

- 構築日: 2026-09-17
- 実施者: Claude Code（Fable 5.1）。手順は `docs/HANDOFF.md` セクション 3
- 環境: macOS (Darwin 25.5.0), Node v26.8.2, npm 11.19.1, git 2.55.0

## 1. 導入したもの

| 層 | 部品 | バージョン | 導入場所 / 方法 |
|---|---|---|---|
| 実行規律 | Superpowers | 6.3.0（`superpowers@claude-plugins-official`） | ユーザースコープのプラグイン。公式マーケットプレイス経由で既に導入済みだったため再導入なし |
| 仕様・変更管理 | OpenSpec CLI | 1.13.1（`@fission-ai/openspec`） | `npm install -g` → `openspec init --tools claude --language ja`。`openspec/` と `/opsx:*` コマンド 6 個を生成 |
| 仕様・変更管理 | OpenSpec スキル 6 個 | v1.13.1 にピン留め（`Fission-AI/OpenSpec` の `skills/`） | PO 指示により `gh skill install Fission-AI/OpenSpec skills/<name> --agent claude-code --scope project --pin v1.13.1` で導入（init 生成物を置き換え）。`gh skill list` で管理 |
| UI 検証 | Playwright MCP | @playwright/mcp 0.0.81（Playwright 1.64.0-alpha-2026-09-14） | `.mcp.json`（プロジェクトスコープ）。`--headless --isolated --output-dir .playwright-mcp` |
| ブラウザ | Chromium | build 1228（`~/Library/Caches/ms-playwright`） | 既存のキャッシュを利用。追加インストールなし |
| 運用ルール | CLAUDE.md + `.claude/rules/` | — | rules 5 ファイル（testing / git / security / scope / review） |
| 強制 | Hooks | — | `.claude/settings.json` + `.claude/hooks/*.sh`。詳細は `hooks.md` |
| 権限・隔離 | permissions + sandbox | — | `.claude/settings.json`（下記「4. 権限設定」） |
| 作業記憶（任意） | Beads | 未導入 | PO 判断待ち（HANDOFF 6.） |
| 役割別サブエージェント | `.claude/agents/implementer.md`（Sonnet）、`.claude/agents/reviewer.md`（Opus） | — | 2026-09-17 PO 指示。実装と別コンテキストで敵対的 + ponytail 観点のレビュー。モデルの使い分けと Opus 実装への切り替え条件は `.claude/rules/review.md` |

### openspec/ の構成

`openspec/config.yaml` がプロジェクト設定（スキーマ `spec-driven`、成果物は日本語で書き、SHALL/MUST などの構造キーワードは英語のまま）。
`openspec/specs/` が「現在の仕様」の正本で、機能ごとの requirements と scenarios を置く。
`openspec/changes/<change-name>/` が進行中の変更で、`proposal.md`（何を・なぜ）、`design.md`（どう作るか）、`specs/`（既存仕様に対するデルタ: ADDED / MODIFIED / REMOVED）、`tasks.md`（実装タスク）を持つ。
PO 受け入れ後に `/opsx:archive` すると、デルタが `specs/` に統合され、change 一式が `openspec/changes/archive/` に移って判断履歴として残る。

Claude Code 向けコマンド（デフォルトプロファイル）: `/opsx:explore`, `/opsx:propose`, `/opsx:apply`, `/opsx:update`, `/opsx:sync`, `/opsx:archive`。
拡張プロファイル（`new`, `continue`, `ff`, `verify`, `bulk-archive`, `onboard`）は `openspec config profile` で追加可能。

### スキルの更新ルール

`.claude/skills/openspec-*` は `gh skill` 管理下にある。更新は `gh skill update --all`（または `--pin` を新タグに変えて再 install）で行う。
`openspec update` を実行すると CLI が同じディレクトリを init 版で上書きし、`gh skill` のメタデータ（`github-*`）が消えて `gh skill list` の出所が `-` に戻る。
CLI を上げるときは「`npm install -g @fission-ai/openspec@<ver>` → `openspec update`（コマンド更新）→ `gh skill install ... --pin v<ver> --force`（スキル再導入）」の順に行う。
拡張プロファイルのスキル（`openspec-new-change`, `openspec-continue-change`, `openspec-ff-change`, `openspec-verify-change`, `openspec-bulk-archive-change`, `openspec-onboard`）も同じリポジトリの `skills/` から個別に導入できる。

## 2. 動作確認結果

| 対象 | 実行したこと | 結果 |
|---|---|---|
| Superpowers | セッションのスキル一覧を確認 | brainstorming / writing-plans / subagent-driven-development / test-driven-development を含む 14 スキルを認識 |
| OpenSpec CLI | `openspec --version` | `1.13.1` |
| OpenSpec 連携 | `openspec init --tools claude --language ja --no-animation` | `OpenSpec Setup Complete — 6 skills and 6 commands in .claude/`。同セッション内で `opsx:propose` 等 6 コマンド + `openspec-*` 6 スキルが認識された |
| OpenSpec スキル（gh skill） | core 6 スキルを `gh skill install ... --pin v1.13.1 --force` で再導入 → `gh skill list` | 6 件とも `claude-code / project / Fission-AI/OpenSpec` として一覧に出た。SKILL.md の frontmatter に `github-repo` / `github-pinned: v1.13.1` / `github-tree-sha` が記録される。本文は init 生成物と同一（末尾の案内が `/opsx:apply` から `/openspec-apply-change` に変わるのみ） |
| Playwright MCP | stdio で MCP クライアントを自作し `initialize` → `tools/list` → `browser_navigate` → `browser_take_screenshot` | serverInfo `{"name":"Playwright","version":"1.64.0-alpha-2026-09-14"}`。ツール 26 個。ローカル HTTP サーバー上のテストページに遷移し `Page Title: Playwright MCP smoke test` を取得、`smoke.png`（14,505 bytes）を保存。画像を開いて見出しテキストの描画を確認 |
| Playwright MCP 制約 | `file://` URL へ遷移 | `Access to "file:" protocol is blocked` → UI 検証は必ず HTTP で配信する（メモ） |
| Hooks: PreToolUse | 合成 JSON を `block-destructive.sh` にパイプ | ブロック対象 22 ケース全て rc=2、許可対象 16 ケース全て rc=0 |
| Hooks: PostToolUse / Stop | 合成 JSON をパイプ | スタック未決定のため lint / test コマンド未検出 → rc=0（想定どおり無害に通過）。`stop_hook_active: true` でも rc=0 |
| Hooks: 設定構文 | `jq -e` で `.hooks.PreToolUse/PostToolUse/Stop` のコマンドを抽出 | 3 イベントすべて抽出成功 |
| Hooks: 実発火 | settings 反映後に `cat .env` を実行 | hook によりブロックされることを確認（`hooks.md` 参照） |
| git | 署名付きコミット（1Password SSH） | 2 コミット成功。ただしサンドボックス内からは 1Password のソケットに接続できないため、git を含む複合コマンドはサンドボックス外で実行する必要がある |

## 3. セットアップ中に判明した環境固有の注意点

- **サンドボックス保護パス**: `.claude/settings.json`, `.claude/hooks/`, `.claude/skills/`, `.mcp.json` はサンドボックス内の Bash から書き込めない（Claude Code が保護）。`openspec init` の Claude 連携もこれで一度失敗した。編集は Write/Edit ツールか、サンドボックス外実行で行う
- **npm グローバル**: `/opt/homebrew` と `~/.npm/_cacache` は書き込み不可。npm は「root 所有ファイル」と誤報するが実際はサンドボックス起因（所有者は全て joe）
- **git 署名**: `commit.gpgsign=true` + 1Password `op-ssh-sign`。エージェントソケットへの接続がサンドボックスで拒否されるため、`git commit` は単体コマンド（`excludedCommands` 対象）として実行するか、サンドボックス外で行う
- **Playwright MCP**: `file:` プロトコル不可。スクリーンショットは `filename` を渡すとサーバーの cwd 基準で保存される（`--output-dir` は自動命名時のみ）
- **gh の複数アカウント**: `gh auth status` には github.com の joe-yama と職場アカウント、および社内 GitHub Enterprise が登録されている。2026-09-17 時点で有効だったのは職場アカウントで、joe-yama のトークンは失効していた（PO が `gh auth login -h github.com -w` で再認証し `gh auth switch -h github.com -u joe-yama` で切り替え済み）。Agent は `gh` で書き込む前に `gh api user --jq .login` を確認する（`.claude/rules/git.md`）

## 4. 権限設定（PO 承認待ち）

方針: HANDOFF 3-8 の既定「読み取り・テスト実行は自動、push・削除・外部通信は確認」を `.claude/settings.json` に実装した。
ユーザー全体の `~/.claude/settings.json` にも同趣旨のルールがあり、両方が効く（deny は片方にあれば効く）。

| 区分 | 内容 |
|---|---|
| allow（自動） | Read / Glob / Grep、読み取り系 git（status, log, diff, show, branch, worktree list）、`git add` / `git commit`、`pnpm test` / `pnpm lint|typecheck|build|preview|e2e`、`pnpm exec biome` / `pnpm exec playwright test`、`gh api user`、`gh issue list|view|comment`、`gh release view|list`、`openspec`、Playwright MCP の全ツール |
| deny（禁止） | `.env` / `.env.*` の Read と Edit、`~/.ssh` `~/.aws` `~/.gnupg` `~/.config/op` の Read、`git push --force` 系、`git reset --hard`、`git clean`、`sudo` |
| ask（毎回確認） | `git push`、`git worktree remove`、`rm`、`curl` / `wget`、`gh pr create|merge`、`gh repo create`、`gh issue create|close|edit`、`gh release create|upload|delete-asset`、`pnpm install` / `pnpm add` / `pnpm publish` |

2026-09-17 の設計レビュー反映で npm → pnpm に置き換え、GitHub Issue 運用と Release への写真保管に必要な `gh` コマンドを追加した。
| sandbox | 有効。ネットワーク許可先は npm / GitHub / PyPI のみ。`allowLocalBinding: true`（dev サーバーと Playwright 用） |
| MCP | `.mcp.json` の `playwright` を自動承認（`enabledMcpjsonServers`） |

注意: `.env.*` の deny は `.env.example` にも当たる（ユーザー設定側の既存ルール）。`.env.example` の作成・更新は PO が手で行うか、ルールを `Read(.env.local)` 等の列挙に変える。

自律実行（/goal, /loop）を行う場合は、上記に加えて `sandbox.allowUnsandboxedCommands: false`（サンドボックス外実行の無効化）と反復上限の明示を条件とする。ただしこの設定下では 1Password 署名付きコミットができないため、自律実行時のコミット方針（署名なし専用ブランチにするか、コミットは PO が行うか）を決める必要がある。

## 5. 未完了・PO 判断待ち

`docs/HANDOFF.md` セクション 6 の全項目が未回答。加えて本セットアップで新たに生じた判断点:

1. 権限設定（上記 4.）の承認
2. 自律実行時のコミット署名の扱い
3. OpenSpec の成果物言語を日本語にした（`--language ja`）ことの確認。英語に変えるなら `openspec/config.yaml` の `context` を編集
4. OpenSpec プロファイルをデフォルト（core）にした。拡張ワークフロー（`/opsx:ff` 等）が必要になったら追加
5. 技術スタック導入時のハーネス更新は change `project-foundation` で実施済み（2026-09-18）: testing.md のコマンド節、hooks の `detect_lint()` → `pnpm exec biome check --error-on-warnings <file>`、`detect_test()` → `pnpm test`、CLAUDE.md のコマンド表
