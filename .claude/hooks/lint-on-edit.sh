#!/usr/bin/env bash
# PostToolUse hook (Edit|Write): 編集されたファイルに対して lint を実行する。
# lint が失敗した場合は exit 2 で stderr を Claude に返し、その場で修正させる。
# lint は Biome。編集されたファイル 1 つだけを検査する。
set -u
input=$(cat)
file=$(printf '%s' "$input" | jq -r '.tool_response.filePath // .tool_input.file_path // ""')
root="${CLAUDE_PROJECT_DIR:-$(pwd)}"

[ -n "$file" ] && [ -f "$file" ] || exit 0

# ドキュメント・設定類は対象外
case "$file" in
  *.md|*.txt|*.json|*.yaml|*.yml|*.toml|*.lock|*/.claude/*|*/openspec/*|*/docs/*) exit 0 ;;
esac

detect_lint() {
  [ -f "$root/biome.json" ] || return 0
  echo "pnpm exec biome check --error-on-warnings \"$file\""
}

lint_cmd=$(detect_lint)
[ -n "$lint_cmd" ] || exit 0   # lint 設定がまだ無いプロジェクトでは何もしない

cd "$root" || exit 0
out=$(eval "$lint_cmd" 2>&1)
status=$?
if [ $status -ne 0 ]; then
  {
    echo "lint failed after editing $file (exit $status). Fix before continuing:"
    printf '%s\n' "$out" | tail -40
  } >&2
  exit 2
fi
exit 0
