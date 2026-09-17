#!/usr/bin/env bash
# PostToolUse hook (Edit|Write): 編集されたファイルに対して lint を実行する。
# lint が失敗した場合は exit 2 で stderr を Claude に返し、その場で修正させる。
# 技術スタックが未決定のため、プロジェクトの構成ファイルから lint コマンドを自動検出する。
# スタック決定後は detect_lint() を確定したコマンドに置き換える（docs/harness/hooks.md 参照）。
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
  if [ -f "$root/package.json" ] && jq -e '.scripts.lint' "$root/package.json" >/dev/null 2>&1; then
    echo "npm run --silent lint --prefix \"$root\""
  elif [ -f "$root/biome.json" ] || [ -f "$root/biome.jsonc" ]; then
    echo "npx --no-install biome check \"$file\""
  elif [ -f "$root/pyproject.toml" ] || [ -f "$root/ruff.toml" ]; then
    command -v ruff >/dev/null 2>&1 && echo "ruff check \"$file\""
  elif [ -f "$root/Cargo.toml" ]; then
    echo "cargo clippy --quiet --manifest-path \"$root/Cargo.toml\""
  elif [ -f "$root/go.mod" ]; then
    echo "go vet ./..."
  fi
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
