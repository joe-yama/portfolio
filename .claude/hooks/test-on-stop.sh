#!/usr/bin/env bash
# Stop hook: Claude がターンを終える前にテストを実行し、失敗していれば停止をブロックして続行させる。
# - stop_hook_active が true のとき（この hook が原因で続行した直後）は無限ループ防止のため何もしない
# - ソースコードに未コミットの変更が無ければテストは走らせない（ドキュメント作業のみのターンを遅くしない）
# - テストは Vitest（`pnpm test`）
set -u
input=$(cat)
active=$(printf '%s' "$input" | jq -r '.stop_hook_active // false')
[ "$active" = "true" ] && exit 0

root=$(git rev-parse --show-toplevel 2>/dev/null) || root="${CLAUDE_PROJECT_DIR:-$(pwd)}"
cd "$root" || exit 0

# 変更されたファイルのうち、ドキュメント・設定以外があるか
changed=$(git status --porcelain 2>/dev/null | awk '{print $NF}' \
  | grep -Ev '(\.md|\.txt|\.json|\.ya?ml|\.toml|\.lock)$|^\.claude/|^openspec/|^docs/' || true)
[ -n "$changed" ] || exit 0

test_cmd="pnpm test"
out=$(pnpm test 2>&1)
status=$?
if [ $status -ne 0 ]; then
  reason=$(printf 'Tests failed (%s, exit %d). Fix the failures before finishing; do not skip or delete tests.\n%s' \
    "$test_cmd" "$status" "$(printf '%s\n' "$out" | tail -30)")
  jq -n --arg r "$reason" '{"decision":"block","reason":$r}'
  exit 0
fi
exit 0
