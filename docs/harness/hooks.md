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

## 動作確認（2026-09-17、2026-09-19 に inline 化後の全経路を再検証）

合成した stdin JSON をスクリプトに直接パイプして検証した。結果は `docs/harness/README.md` の「動作確認結果」を参照。

再検証コマンド例:

```bash
printf '{"tool_name":"Bash","tool_input":{"command":"rm -rf x"}}' | bash .claude/hooks/block-destructive.sh; echo "rc=$?"   # rc=2
printf '{"tool_name":"Bash","tool_input":{"command":"rm x"}}'     | bash .claude/hooks/block-destructive.sh; echo "rc=$?"   # rc=0
```

## 既知の制約

- hook は Claude Code のツール呼び出しにのみ効く。サブエージェントにも同じ settings が適用されるが、コンテナ内の別プロセスには効かない
- `git` 単体コマンドはサンドボックスの `excludedCommands` で除外されているが、hook はサンドボックスとは独立に動作する
- パターンは正規表現のため、極端に変則的な書き方（`r\m -rf`、変数展開経由）はすり抜ける。最後の防衛線は permissions の deny とサンドボックス
