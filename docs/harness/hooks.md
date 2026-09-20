# Hooks の設定と理由

- 設定ファイル: `.claude/settings.json`（プロジェクト共有、コミット対象）
- スクリプト: `.claude/hooks/*.sh`（`bash` 経由で起動するため実行ビット不要）
- 公式仕様: https://code.claude.com/docs/en/hooks
- 最終更新: 2026-09-19

## なぜ hooks が必要か

CLAUDE.md や `.claude/rules/` は「文脈」であり、モデルが従わない可能性がある。
hooks は Claude Code 本体がライフサイクルの固定点で実行するシェルコマンドで、モデルの判断に関係なく強制できる。
HANDOFF の原則「ハーネスの各部品はモデルにできないことの仮定」に従い、以下 3 点だけを強制する。

## 1. PreToolUse — 破壊的操作のブロック

| 項目 | 内容 |
|---|---|
| matcher | `Bash` と `Read\|Edit\|Write\|MultiEdit\|NotebookEdit` |
| スクリプト | `.claude/hooks/block-destructive.sh` |
| 動作 | 該当パターンに一致したら `exit 2` で無条件ブロック。stderr の理由が Claude に返る |

ブロックするもの（各行がスクリプト内の番号に対応）:

1. `rm` の再帰 + 強制削除（`-rf`, `-fr`, `-r -f`, `--recursive --force`）。`rm file` や `rm -r dir` 単独は通す
2. `git push --force` / `-f` / `--force-with-lease` / `--force-if-includes`
3. 作業ツリー・履歴の破棄: `git reset --hard|--merge`, `git clean -f/-d/-x`, `git checkout -- .`, `git restore .`, `git branch -D`
4. 検証回避: `--no-verify`, `--no-gpg-sign`
5. `.env` 系ファイルへのアクセス（Bash での参照、および Read/Edit/Write のパス）。`.env.example` は許可
6. `~/.ssh`, `~/.aws`, `~/.gnupg`, `~/.config/op` へのアクセス
7. `curl ... | sh` / `wget ... | bash` 形式のスクリプト直接実行

理由: これらは取り消しが困難、または秘密情報の漏洩につながる。permissions の `deny` ルールと二重にしているのは、
permissions がプレフィックス一致しか見ないのに対し、hook はコマンド全体（`cd a && rm -rf b` など）を正規表現で検査できるため。

## 2. PostToolUse — 編集後の lint

| 項目 | 内容 |
|---|---|
| matcher | `Edit\|Write\|MultiEdit` |
| スクリプト | `.claude/hooks/lint-on-edit.sh` |
| 動作 | lint が失敗したら `exit 2` で stderr を Claude に返し、その場で修正させる。成功時は無出力 |

- ドキュメント・設定ファイル（`.md`, `.json`, `.yaml`, `.toml`, `.claude/`, `openspec/`, `docs/`）は対象外。判定は `root` からの相対パスで行う（絶対パスで判定すると `.claude/worktrees/` 配下の worktree では全ファイルが誤って除外対象になる）
- lint は Biome 固定: 編集ファイル 1 つに対して `pnpm exec biome check --error-on-warnings --no-errors-on-unmatched "$file"` を実行する。`error-on-warnings` で警告も失敗扱いにし、`no-errors-on-unmatched` で Biome の対象外ファイル（`LICENSE` など）でも exit 1 にならないようにする
- `root` はファイルが属する git worktree の toplevel（`git -C "$(dirname "$file")" rev-parse --show-toplevel`）から求める。取得できない場合のみ `CLAUDE_PROJECT_DIR`（無ければ `pwd`）にフォールバックする。`CLAUDE_PROJECT_DIR` が main リポジトリの root を指す環境では、worktree 内のファイルに対してこれをそのまま `root` にすると相対パス判定と Biome の実行ディレクトリの両方を誤るため

理由: 「完了の定義」に lint 通過が含まれる。編集直後に失敗を返すことで、最後にまとめて直すより修正コストが小さい。

## 3. Stop — 完了前のテスト実行

| 項目 | 内容 |
|---|---|
| matcher | なし（すべての Stop） |
| スクリプト | `.claude/hooks/test-on-stop.sh` |
| 動作 | テスト失敗時に `{"decision":"block","reason":"..."}` を stdout に出し、Claude の停止を差し止めて続行させる |

安全装置:

- `stop_hook_active: true`（この hook が原因で続行した直後）のときは何もしない → 無限ループ防止
- ソースコードに未コミット変更が無いときはテストを走らせない → ドキュメントだけのターンを遅くしない
- テストは Vitest 固定: `pnpm test` を実行する
- タイムアウト 600 秒

理由: 「テストが緑」は完了の定義の第一条件。Agent の自己申告ではなく、hook が実際に走らせて確認する。

## 4. PreToolUse — 確認に回す操作（2026-09-20）

| 項目 | 内容 |
|---|---|
| matcher | `Bash`（`block-destructive.sh` の後に実行） |
| スクリプト | `.claude/hooks/ask-gate.sh` |
| 動作 | 該当したら `{"hookSpecificOutput":{"permissionDecision":"ask",...}}` を stdout に出して PO の確認に回す。該当しなければ無出力で exit 0（permissions の allow と auto mode の判定に委ねる） |

確認に回すもの（各番号がスクリプト内の番号に対応）:

1. `git push` で main を対象にするもの（`main`、`x:main`、`refs/heads/main`）、リモートブランチの削除（`--delete` / `-d` / `:branch`）、`--all` / `--mirror`。refspec が無い（または `HEAD`）push は、hook 入力の `cwd` で現在のブランチが main のとき
2. `git worktree remove` の `--force` / `-f`
3. `--frozen-lockfile` の無い `pnpm install` / `pnpm i`

理由: 承認プロンプトの主因だった `git push` / `git worktree remove` / `pnpm install --frozen-lockfile` を permissions の allow に移した（README §6）。allow はプレフィックス一致なので「main だけ」「`--force` だけ」「lockfile を変えるときだけ」を表現できず、その部分を hook で締める。hook は ask / deny の方向にしか効かず、settings の ask を hook の allow で覆すことはできない（公式 hooks-guide「Hooks can tighten restrictions but not loosen them past what permission rules allow」）。だからユーザー設定の `ask` から該当ルールを外したうえでこの形にしている。「個人リポジトリ以外は確認」「gh の login が joe-yama 以外は確認」の判定はユーザー設定の `~/.claude/permission-gate.sh` が担う（README §4）。

## 動作確認（2026-09-17、2026-09-19 に inline 化後に再確認、2026-09-20 に ask-gate を追加）

合成した stdin JSON をスクリプトに直接パイプして検証した。結果は `docs/harness/README.md` の「動作確認結果」と、ask-gate については下記を参照。

再検証コマンド例:

```bash
printf '{"tool_name":"Bash","tool_input":{"command":"rm -rf x"}}' | bash .claude/hooks/block-destructive.sh; echo "rc=$?"   # rc=2
printf '{"tool_name":"Bash","tool_input":{"command":"rm x"}}'     | bash .claude/hooks/block-destructive.sh; echo "rc=$?"   # rc=0
printf '{"tool_name":"Bash","tool_input":{"command":"git push origin main"},"cwd":"."}' | bash .claude/hooks/ask-gate.sh   # ask の JSON
printf '{"tool_name":"Bash","tool_input":{"command":"git push -u origin feature/x 2>&1 | tail -3"},"cwd":"."}' | bash .claude/hooks/ask-gate.sh   # 無出力
```

ask-gate.sh の検証結果（2026-09-20）は下の表のとおり。`cwd` を main ブランチのチェックアウトと feature ブランチの worktree に振って、refspec 省略時の判定も確かめた。

| 対象 | ケース | 期待 | 結果 |
|---|---|---|---|
| ask-gate.sh | main への push 9 形（`origin main`、`-u ... main` + パイプ、`HEAD:main`、`refs/heads/main`、`:branch`、`--delete`、`-d`、`--all`、`--mirror`）と `pnpm test && git push origin main` | ask | 10/10 |
| ask-gate.sh | refspec なし・`HEAD` の push（cwd のブランチが main） | ask | 3/3 |
| ask-gate.sh | feature / fix ブランチ、タグ `photos`、refspec なし（cwd が feature）、`gh api user && git push` | 無出力（defer） | 6/6 |
| ask-gate.sh | `git worktree remove` の `-f` / `--force`（前置・後置） | ask | 2/2 |
| ask-gate.sh | `git worktree remove`（force なし） | defer | 1/1 |
| ask-gate.sh | `pnpm install` / `pnpm i` / パイプ付き / パッケージ名付き / 2 つ目の install に flag なし | ask | 5/5 |
| ask-gate.sh | `pnpm install --frozen-lockfile ... && pnpm test`、`pnpm exec i18n-check`、`pnpm test`、`git status`、`echo` | defer | 5/5 |
| ask-gate.sh | heredoc 本文に `git push origin main` を含む `gh issue comment` | ask（既知の誤検知。本文は `--body-file` で渡す） | 1/1 |
| permission-gate.sh | 個人 origin（ssh エイリアス `github-personal` / `git@github.com:` / https）での push | defer | 3/3 |
| permission-gate.sh | 職場 origin、origin なしでの push | ask | 2/2 |
| permission-gate.sh | 個人 origin + login joe-yama での `gh issue comment` / `gh issue create` / `gh pr create` / `gh api user && gh issue comment` / `-R joe-yama/...` | defer | 5/5 |
| permission-gate.sh | 職場 origin、`--repo acme/...`（`--repo=` 形式含む）、職場 login、`gh api user` 失敗 | ask | 5/5 |
| permission-gate.sh | 既存の分岐（`gh api` GET → allow、mutation → ask、複合 → defer、`op whoami` → allow）と `gh issue view` / `gh pr merge` / `git status`（無出力） | 変化なし | 7/7 |
| block-destructive.sh | `rm -rf` / `--force` / `-f` push → block、`rm x` / 通常 push → 通過 | 変化なし | 5/5 |

合計 60 ケース、すべて期待どおり（`pass=60 fail=0`、2026-09-20）。git と gh はシム（`FAKE_BRANCH` / `FAKE_ORIGIN` / `FAKE_LOGIN`）に差し替えて実行した。テストスクリプトは PO が `!` で実行した。Agent の Bash からは auto mode の分類器が hook のテスト実行も「Self-Modification」として拒否するため。

## 既知の制約

- hook は Claude Code のツール呼び出しにのみ効く。サブエージェントにも同じ settings が適用されるが、コンテナ内の別プロセスには効かない
- hook は締める方向にしか効かない。settings の ask / deny を hook の allow で緩めることはできず、自動化したい操作は settings 側の ask から外す必要がある（ユーザー設定の ask はプロジェクトの allow に勝つ）
- `.claude/hooks/` と `.claude/settings.json` への書き込みは auto mode の分類器が拒否する（2026-09-20 実測）。変更は Agent が scratchpad に用意し、PO が置く
- `git` / `gh` はサンドボックスの `excludedCommands` で除外される設定だが、hook はサンドボックスとは独立に動作する（このマシンでは sandbox 自体が `.claude/settings.local.json` で無効）
- パターンは正規表現のため、極端に変則的な書き方（`r\m -rf`、変数展開経由）はすり抜ける。最後の防衛線は permissions の deny とサンドボックス
