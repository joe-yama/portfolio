#!/usr/bin/env bash
# PreToolUse hook (Bash): リポジトリの方針で「PO の確認に回す」操作を ask にする。
# block-destructive.sh が無条件ブロック（exit 2）を担い、このスクリプトは
# permissionDecision: ask を返して確認に回す。該当しなければ何も出力せず exit 0 で、
# permissions ルール（allow）と auto mode の通常判定に委ねる。
# hook は ask / deny の方向にしか効かない（settings の ask ルールを hook の allow で
# 覆すことはできない。公式 hooks-guide）。理由と検証は docs/harness/hooks.md §4。
set -u
input=$(cat)
[ "$(printf '%s' "$input" | jq -r '.tool_name // ""')" = "Bash" ] || exit 0
cmd=$(printf '%s' "$input" | jq -r '.tool_input.command // ""')
cwd=$(printf '%s' "$input" | jq -r '.cwd // ""')
[ -n "$cwd" ] || cwd=$(pwd)

ask() {
  jq -n --arg r "$1" \
    '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"ask",permissionDecisionReason:$r}}'
  exit 0
}

# 1. git push: main を対象にするもの、リモートブランチの削除、--all / --mirror、
#    および refspec を省いた push で現在のブランチが main のとき。
#    feature/* fix/* ブランチへの push は permissions の allow に任せる（.claude/rules/git.md）。
if printf '%s' "$cmd" | grep -Eq '(^|[;&|[:space:]])git[[:space:]]+push([[:space:]]|$)'; then
  while IFS= read -r seg; do
    [ -n "$seg" ] || continue
    args=$(printf '%s' "$seg" | sed -E 's/^git[[:space:]]+push//')
    if printf '%s' "$args" | grep -Eq '(^|[[:space:]])(main|[^[:space:]]*:main|refs/heads/main|:[^[:space:]]+|--delete|-d|--mirror|--all)([[:space:]]|$)'; then
      ask "main への push、リモートブランチの削除、--all / --mirror は PO の確認が必要（.claude/rules/git.md）"
    fi
    # オプション（-x / --x）とリダイレクト（2>&1 など）を除いた位置引数の 2 つ目が refspec。
    # 無い、または HEAD なら現在のブランチへの push。
    refspec=$(printf '%s' "$args" | tr ' \t' '\n\n' | grep -vE '^(-|$|[0-9]*[<>])' | sed -n '2p')
    if [ -z "$refspec" ] || [ "$refspec" = "HEAD" ]; then
      branch=$(git -C "$cwd" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
      [ "$branch" = "main" ] && ask "main ブランチからの push は PO の確認が必要（.claude/rules/git.md）"
    fi
  done <<EOF
$(printf '%s' "$cmd" | grep -oE 'git[[:space:]]+push([^;&|]*)')
EOF
fi

# 2. git worktree remove --force / -f: 未コミット変更を捨てる。--force なしは allow に任せる
if printf '%s' "$cmd" | grep -Eq '(^|[;&|[:space:]])git[[:space:]]+worktree[[:space:]]+remove([[:space:]]+[^;&|]*)?[[:space:]](-f|--force)([[:space:]]|$)'; then
  ask "git worktree remove --force は未コミット変更を捨てる。PO の確認が必要（.claude/rules/git.md）"
fi

# 3. pnpm install / pnpm i に --frozen-lockfile が無い: lockfile を変える（依存の追加）可能性がある。
#    --frozen-lockfile 付きは allow に任せる（.claude/rules/security.md の依存追加ルール）
while IFS= read -r seg; do
  [ -n "$seg" ] || continue
  if ! printf '%s' "$seg" | grep -q -- '--frozen-lockfile'; then
    ask "pnpm install は --frozen-lockfile 付きだけ自動。lockfile を変える install は PO の確認が必要（.claude/rules/security.md）"
  fi
done <<EOF
$(printf '%s' "$cmd" | grep -oE '(^|[;&|[:space:]])pnpm[[:space:]]+(install|i)([[:space:]][^;&|]*)?')
EOF

exit 0
