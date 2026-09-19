#!/usr/bin/env bash
# PostToolUse hook (Edit|Write): 編集されたファイルに対して lint を実行する。
# lint が失敗した場合は exit 2 で stderr を Claude に返し、その場で修正させる。
# lint は Biome。編集されたファイル 1 つだけを検査する。
set -u
input=$(cat)
file=$(printf '%s' "$input" | jq -r '.tool_response.filePath // .tool_input.file_path // ""')

[ -n "$file" ] && [ -f "$file" ] || exit 0

# root はファイルが属する git worktree の toplevel から求める（CLAUDE_PROJECT_DIR が
# main リポジトリの root を指す環境では、worktree 内のファイルの root として誤るため）
root=$(git -C "$(dirname "$file")" rev-parse --show-toplevel 2>/dev/null) || root="${CLAUDE_PROJECT_DIR:-$(pwd)}"

# ドキュメント・設定類は対象外（root からの相対パスで判定。絶対パスで */.claude/* を見ると
# .claude/worktrees/ 配下の worktree では全ファイルが一致してしまう）
rel="${file#"$root"/}"
case "$rel" in
  *.md|*.txt|*.json|*.yaml|*.yml|*.toml|*.lock|.claude/*|openspec/*|docs/*) exit 0 ;;
esac

cd "$root" || exit 0
out=$(pnpm exec biome check --error-on-warnings --no-errors-on-unmatched "$file" 2>&1)
status=$?
if [ $status -ne 0 ]; then
  {
    echo "lint failed after editing $file (exit $status). Fix before continuing:"
    printf '%s\n' "$out" | tail -40
  } >&2
  exit 2
fi
exit 0
