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
| UI 検証 | Playwright MCP | @playwright/mcp 0.0.81（Playwright 1.64.0-alpha-2026-09-14）。`.mcp.json` は `@latest` 指定なので実行時のバージョンは変動する（2026-09-20 時点の実体は 0.0.82） | `.mcp.json`（プロジェクトスコープ）。`--headless --isolated --output-dir .playwright-mcp` |
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
- **Playwright MCP**: `file:` プロトコル不可。スクリーンショットは `filename` を渡すとサーバーの cwd 基準で保存される（`--output-dir` は自動命名時のみ）。UI 検証は `pnpm build && pnpm preview` で HTTP 配信する（`http://127.0.0.1:4321/`。停止は `pnpm exec astro preview stop`）。preview の疎通確認は `curl`（ask 対象）ではなく `browser_navigate` で行う
- **gh の複数アカウント**: `gh auth status` には github.com の joe-yama と職場アカウント、および社内 GitHub Enterprise が登録されている。2026-09-17 時点で有効だったのは職場アカウントで、joe-yama のトークンは失効していた（PO が `gh auth login -h github.com -w` で再認証し `gh auth switch -h github.com -u joe-yama` で切り替え済み）。Agent は `gh` で書き込む前に `gh api user --jq .login` を確認する（`.claude/rules/git.md`）
- **サブエージェントへの MCP ツールの受け渡し**（2026-09-20、change `harness-ui-review` で実測）: `.claude/agents/*.md` の `tools:` に `mcp__<server>__<tool>` を列挙すれば MCP ツールはサブエージェントに渡る。ただし **agent 定義の変更は実行中のセッションには反映されない**。同一セッションで編集して dispatch すると、セッション開始時の定義で起動し `No such tool available: mcp__playwright__browser_navigate` になる（Change 2 の失敗の原因はこれ）。定義を変えたらセッションを開き直す。検証は 4 回の dispatch で行った: 同一セッション ❌ 2 回 / 新しいセッション（`claude -p`）✅ 2 回（1 回目は `browser_navigate` だけを列挙した試験、2 回目は 11 個の最終形で navigate / snapshot / evaluate / emulate_media / console_messages を実呼び出しし、ヘッダー 4 リンクの href とダーク時の body 背景色を取得）。内訳は Issue #6 の 1.2 と 3.1。公式ドキュメント（code.claude.com/docs/en/sub-agents）によれば `tools:` を省略すると MCP 込みで全継承になる（これは未実測）。reviewer には MCP ツールを 11 個だけ列挙する方針で、列挙の実体は `.claude/agents/reviewer.md` の `tools:` を正とする。なお `tools:` に書いても渡らないツールがある。`claude -p` で起こしたセッションの `Glob` / `Grep` がそうで（`Glob is not available in this session` と返る）、セッションの構成しだいで使えるツールは変わる。`.mcp.json` は `@playwright/mcp@latest` を指しているので、`reviewer.md` に列挙したツール名は上流のリネームで使えなくなることがある。reviewer が `No such tool available` を報告したら、まず `@playwright/mcp` の README で現行のツール名を確認する
- **Playwright MCP の保存先**: `browser_run_code_unsafe` で（Change 2 の実測。`browser_take_screenshot` も同じ挙動と見られる）相対パスを指定すると、worktree で作業していてもファイルは**メインリポジトリの root** に落ちる。保存先は絶対パスで指定する
- **worktree セッションの Bash ガード**: `EnterWorktree` で worktree に分離されたセッションでは、**git を含むコマンドのうち「worktree の中に留まると検証できない形」が拒否される**。2026-09-20 の実測: `for f in a b; do echo $f; done; git log --oneline -1 | sed -n '1p'` は `This session is isolated in the worktree ..., but this command names git in a form too complex to verify that it stays inside the worktree. Refusing to run it` で拒否。一方 `git status --short && echo ok`、`git log --oneline -1 | cat`、git を含まない `for` ループ、`sed ... && grep ...` は通った。Change 2 では `sed ... && git ...` と git という語を含む heredoc が拒否されている。同じ worktree を cwd とするサブエージェントのセッションには、この制限はかからない（レビュアーが同じ形を実行できた）。迷ったら git は 1 コマンドずつ実行する
- **`.claude/` 配下の書き分け**: `.claude/agents/` `.claude/rules/` と `CLAUDE.md` は Write / Edit ツールで編集できる。`.claude/settings.json` と `.claude/hooks/` は auto mode の分類器が拒否する（§4 の注意）。サンドボックス内の Bash からはさらに `.claude/skills/` と `.mcp.json` も書き込めない
- **コミット署名の現状**: このマシンでは `.claude/settings.local.json` がサンドボックスを無効にしているため、1Password SSH 署名付きの `git commit` はそのまま通る（2026-09-20 確認）。サンドボックスを戻すときは §5 の未検証項目を先に確かめる

## 4. 権限設定（PO 承認 2026-09-20）

方針: HANDOFF 3-8 の既定「読み取り・テスト実行は自動、push・削除・外部通信は確認」から始め、2026-09-20 に承認プロンプトの実測（§6）をもとに「個人リポジトリの feature / fix ブランチへの push、Issue / PR の作成とコメント、lockfile 固定の install、worktree の後片付け」を自動にした。
ルールは deny → ask → allow の順で評価され、出所も具体性も順序を変えない（公式 permissions）。ユーザー全体の `~/.claude/settings.json` の `ask` はプロジェクトの `allow` に勝つので、プロジェクトで自動化する操作はユーザー設定の `ask` から外し、「個人リポジトリ以外は確認」の判定はユーザー設定の hook（`~/.claude/permission-gate.sh`）が担う。hook は締める方向（ask / deny）にしか効かない。

| 区分 | 内容 |
|---|---|
| allow（自動） | Read / Glob / Grep、読み取り系 git（status, log, diff, show, branch, worktree list）、`git add` / `git commit` / **`git push`** / **`git worktree remove`**、`pnpm test` / `pnpm lint|typecheck|build|preview|e2e`、`pnpm exec biome` / `pnpm exec playwright test`、**`pnpm install --frozen-lockfile`**、`gh api user`、`gh issue list|view|**create**|comment`、**`gh pr create`**、`gh release view|list`、`openspec`、Playwright MCP の全ツール |
| deny（禁止） | `.env` / `.env.*` の Read と Edit、`~/.ssh` `~/.aws` `~/.gnupg` `~/.config/op` の Read、`git push --force` 系、`git reset --hard`、`git clean`、`sudo` |
| ask（毎回確認） | `rm`、`curl` / `wget`、`gh pr merge`、`gh repo create`、`gh issue close|edit`、`gh release create|upload|delete-asset`、`pnpm add` / `pnpm publish` |
| hook で ask（`.claude/hooks/ask-gate.sh`） | main への push、リモートブランチの削除、`--all` / `--mirror`、`git worktree remove --force`、`--frozen-lockfile` の無い `pnpm install` |
| hook で ask（`~/.claude/permission-gate.sh`、ユーザー設定） | origin が joe-yama 配下でないリポジトリでの `git push`。`gh issue create|comment` / `gh pr create` で、対象リポジトリ（`--repo` か origin）が joe-yama 配下でない、または `gh api user` の login が joe-yama でないとき |
| env | `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` を空にして agent teams を無効化する（サブエージェントは Agent ツールの通常サブエージェントとして動く。teammate の完了通知が 1 通ごとにコントローラーのターンになっていたため。§6）。`MCP_TIMEOUT` はユーザー設定と同値を再掲（プロジェクトの `env` がユーザーの `env` を丸ごと置き換える場合に備える） |
| sandbox | 設定上は有効（`autoAllowBashIfSandboxed`、`excludedCommands: git, gh`、Google Fonts を含む許可ドメイン、`allowLocalBinding`）だが、このマシンでは `.claude/settings.local.json`（gitignore 済み）が無効化している。有効に戻したときの動作は**未検証**: 1Password 署名（`git` は sandbox 外で動く想定）、ビルド時の Google Fonts 取得、Playwright MCP |
| MCP | `.mcp.json` の `playwright` を自動承認（`enabledMcpjsonServers`） |

ユーザー設定側で 2026-09-20 に `ask` から外したもの: `Bash(git push:*)`、`Bash(gh pr create:*)`、`Bash(gh issue create:*)`、`Bash(gh issue comment:*)`（バックアップは `~/.claude/settings.json.bak-autonomy-*`、hook のバックアップは `~/.claude/permission-gate.sh.bak-autonomy-*`）。職場リポジトリでは hook が origin と login を見て確認に回すので、従来どおりプロンプトが出る。

注意:

- `.env.*` の deny は `.env.example` にも当たる（ユーザー設定側の既存ルール）。`.env.example` の作成・更新は PO が手で行うか、ルールを `Read(.env.local)` 等の列挙に変える
- `.claude/settings.json` と `.claude/hooks/` への Write は auto mode の分類器が「Self-Modification」として拒否する（2026-09-20 実測。プロンプトではなく拒否）。Agent は完成版を scratchpad に置き、PO が `!` の `cp` で配置するか、manual mode に切り替えて承認する
- 無人実行は `claude -p --permission-mode auto --permission-prompts none --max-turns N`（プロンプトになる操作は拒否して進む）。sandbox を戻す場合は上の未検証 3 点を先に確かめる

### bypass permissions での無人実行の実測（2026-09-21、v1 リリース）

`/goal <完了条件> or stop after 500 turns` を permission mode = bypass permissions で回し、Change 4・5 の実装から公開までを 1 セッションで通したときの記録（計画・裁定・実測値は `docs/runs/2026-09-21-v1-release.md` と同 ledger）。

- **プロンプトで止まった操作は無かった。** 上の表で `ask` にしている `gh pr merge` と `gh api -X POST`（Pages の有効化）も、bypass では確認なしで通る。つまり「Agent が勝手にマージしない」担保は権限設定ではなく**計画側の条件**（CI 緑 + ブランチ全体レビュー Approved）だけになる。無人実行でこの 2 つを自動化するときは、条件を計画書に明記して ledger に実測を残す
- **`.claude/hooks/block-destructive.sh` が拒否する操作は bypass でも拒否される**（今回は該当操作を行わなかったので未実測。設定上の性質）
- **Opus 実装への切り替えは 0 回**（`.claude/rules/review.md` の 3 条件にどちらの change も当たらなかった）。レビューは Opus、実装は Sonnet のまま通った
- **長い待ちは `echo .` のループではなく、`run_in_background: true` の `sleep` / `gh run watch` で待つ**（PO 指示 2026-09-21）。`until [ -f <file> ]; do sleep 20; done` のようにファイルの出現で待つ形にすると、コントローラーのターンを消費しない
- **サブエージェントへの「報告ファイルを書いて」という指示がツール側でブロックされた**（「サブエージェントは報告ファイルではなくテキストで結果を返すべき」）。brief では報告をテキストで返させる
- **ローカルで緑でも CI で落ちる差が 2 件出た**（どちらも e2e の配信まわり）。無人実行では「ローカルの緑」を完了の根拠にせず、CI の実行結果を最終証拠にする
  1. `astro preview` は対話端末では自動でデーモン化するが、CI（非対話端末）では前景実行になり `execSync` がブロックする → `--background` を明示し、`fetch` で 200 を待つ
  2. `astro preview` の既定バインド先 `localhost` は ubuntu runner では IPv6 `::1` に解決され、`127.0.0.1` 宛の接続が拒否される → `--host 127.0.0.1` を明示する
- **CI の job に `timeout-minutes` が無いと、ハング時に既定上限（6 時間）まで回る。** 実際に 20 分で PO が手動停止した。reviewer はこれを Minor として挙げていたが、同じ CI 実行で実損化したので Important に格上げして修正した（`.claude/rules/review.md` の Minor 例外）
- **Biome は未追跡ファイルも検査する。** scratchpad 代わりに `docs/runs/` へ置いた JSON の整形漏れでローカルの `pnpm lint` が落ちた（CI は未追跡なので緑のまま）。コミット前に気づけたが、そのまま commit していれば CI が赤になっていた


## 5. 未完了・PO 判断待ち

`docs/HANDOFF.md` セクション 6 のうち「Agent に push 権限を与えるか」は 2026-09-20 に決定（feature / fix ブランチは自動、main は確認）。残りは未回答。加えて本セットアップで新たに生じた判断点:

1. 権限設定（上記 4.）: 2026-09-20 に承認・反映済み
2. 自律実行時のコミット署名の扱い: sandbox が無効の間は署名付きコミットがそのまま通る。sandbox を戻すときに `excludedCommands: git` で足りるかを検証する
3. OpenSpec の成果物言語を日本語にした（`--language ja`）ことの確認。英語に変えるなら `openspec/config.yaml` の `context` を編集
4. OpenSpec プロファイルをデフォルト（core）にした。拡張ワークフロー（`/opsx:ff` 等）が必要になったら追加
5. 技術スタック導入時のハーネス更新は change `project-foundation` で実施済み（2026-09-18）: testing.md のコマンド節（2026-09-22 に CLAUDE.md へ統合）、hooks の `detect_lint()` → `pnpm exec biome check --error-on-warnings --no-errors-on-unmatched <file>`、`detect_test()` → `pnpm test`、CLAUDE.md のコマンド表
6. agent teams 無効化（`env`）が次のセッションで効いているか: `ListAgents` の表示が Teammates ではなく Subagents になり、`~/.claude/projects/.../<session>/subagents/*.meta.json` の `taskKind` が `in_process_teammate` でなければ効いている

## 6. 承認プロンプトとターン数の実測（2026-09-20）

transcript（`~/.claude/projects/-Users-joe-repo-github-personal-joe-yama-portfolio/*.jsonl`）の `PermissionRequest` hook イベントとツール呼び出しを集計した。

| change | 承認プロンプト | うち Issue コメント | うち git push | コントローラー msg | Agent 起動 | サブエージェントのツール呼び出し | 平均コンテキスト / リクエスト |
|---|---|---|---|---|---|---|---|
| 1 project-foundation（Change 2 の設計含む） | 34 | 11 | 7 | 591 | 25 | 793 | 59 万トークン |
| 2 layout-shell | 43 | 6 | 3 | 411 | 17 | 653 | 66 万トークン |
| harness-ui-review | 14 | 5 | 3 | 344 | 10 | 209 | 37 万トークン |
| layout-followups | 19 | 6 | 3 | 415 | 17 | 1,121 | 52 万トークン |

読み取り:

- Issue コメント 28 回はユーザー設定の `ask` がプロジェクトの `allow` に勝っていたため（`.claude/rules/git.md` の「コメントは自動許可」は一度も効いていなかった）。Change 1・2 の残りの多くは sandbox 外実行（`dangerouslyDisableSandbox`）の確認で、現在は sandbox 無効のため発生しない
- ターン数は change の大きさに比例しない。harness-ui-review は agent 定義 1 行と文言の統一で 344 メッセージ。主因はタスク単位の Opus レビュー + 再レビュー（Change 1 は 8 タスクに 17 回）、Minor の後追い修正（Change 2 は 27 件の triage → 11 件修正 → 再レビューで回帰）、タスクごとの Issue コメントと `tasks.md` だけのコミット（Change 1 は各 11 回・8 回）、agent teams の teammate 通知（1 セッション 56〜65 通）
- コストの大半は出力ではなく、コントローラーの巨大なコンテキストの再読込（1 リクエスト 37〜66 万トークン）。対策は CLAUDE.md「標準ワークフロー」（実装は新しいセッション、コントローラーは Opus）、「小さな change の経路」、`.claude/rules/review.md`「レビューの単位」「Minor の扱い」、`.claude/rules/git.md`
- `.claude/rules/review.md` の個別ルールが立っている実測: 「レビューの単位」は layout-followups が **CSS の Minor 5 件の確認に 135 回のツール呼び出し**を使ったこと、「指摘は全部そろえて 1 回で送る」は **分割送付で layout-followups が 5 ラウンドまで伸びた**こと

集計スクリプトはその場限り（scratchpad）で、リポジトリには置いていない。再集計が必要なら同じ jsonl から `type: assistant` の `tool_use` と `attachment.hookEvent == "PermissionRequest"` を数える。
