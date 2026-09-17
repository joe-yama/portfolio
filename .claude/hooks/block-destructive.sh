#!/usr/bin/env bash
# PreToolUse hook: 破壊的操作と秘密情報アクセスをブロックする。
# stdin に Claude Code から JSON が渡される。exit 2 で無条件ブロック（stderr が理由として Claude に返る）。
# 設計理由は docs/harness/hooks.md を参照。
set -u
input=$(cat)
tool=$(printf '%s' "$input" | jq -r '.tool_name // ""')

deny() {
  printf 'BLOCKED by .claude/hooks/block-destructive.sh: %s\n' "$1" >&2
  exit 2
}

case "$tool" in
  Bash)
    cmd=$(printf '%s' "$input" | jq -r '.tool_input.command // ""')
    # 1. rm の再帰+強制削除（rm -rf / rm -fr / rm -r -f / rm --recursive --force）
    if printf '%s' "$cmd" | grep -Eq '(^|[;&|[:space:]])rm[[:space:]]+(-[a-zA-Z]*[rR][a-zA-Z]*[[:space:]]+.*-[a-zA-Z]*f|-[a-zA-Z]*f[a-zA-Z]*[[:space:]]+.*-[a-zA-Z]*[rR]|-[a-zA-Z]*([rR][a-zA-Z]*f|f[a-zA-Z]*[rR])[a-zA-Z]*([[:space:]]|$)|--recursive.*--force|--force.*--recursive)'; then
      deny "rm の再帰+強制削除は禁止。削除が必要なら PO に確認する（.claude/rules/git.md, security.md）"
    fi
    # 2. force push
    if printf '%s' "$cmd" | grep -Eq '(^|[;&|[:space:]])git[[:space:]]+push([[:space:]]+[^;&|]*)?[[:space:]](-f|--force|--force-with-lease|--force-if-includes)([[:space:]]|=|$)'; then
      deny "git push --force 系は禁止（.claude/rules/git.md）"
    fi
    # 3. 履歴・作業ツリーの破棄
    if printf '%s' "$cmd" | grep -Eq '(^|[;&|[:space:]])git[[:space:]]+(reset[[:space:]]+(--hard|--merge)|clean[[:space:]]+[^;&|]*-[a-zA-Z]*[fdx]|checkout[[:space:]]+--[[:space:]]+\.|restore[[:space:]]+\.([[:space:]]|$)|branch[[:space:]]+-D)'; then
      deny "未コミット変更や履歴を破棄する git 操作は禁止。必要なら PO に確認する（.claude/rules/git.md）"
    fi
    # 4. フックや署名の回避
    if printf '%s' "$cmd" | grep -Eq '(^|[;&|[:space:]])git[[:space:]]+[^;&|]*(--no-verify|--no-gpg-sign)'; then
      deny "--no-verify / --no-gpg-sign による検証回避は禁止（.claude/rules/git.md）"
    fi
    # 5. .env 系ファイルの読み取り・出力（.env.example は除く）
    if printf '%s' "$cmd" | grep -Eq '(^|[[:space:]/])\.env(\.[A-Za-z0-9_-]+)?([[:space:]]|$|["'"'"'])' && ! printf '%s' "$cmd" | grep -Eq '\.env\.example'; then
      deny ".env ファイルへのアクセスは禁止。値は環境変数から読む（.claude/rules/security.md）"
    fi
    # 6. 秘密ディレクトリへのアクセス
    if printf '%s' "$cmd" | grep -Eq '(~|\$HOME|/Users/[^/ ]+)/\.(ssh|aws|gnupg|config/op)(/|[[:space:]]|$)'; then
      deny "~/.ssh, ~/.aws, ~/.gnupg, ~/.config/op へのアクセスは禁止（.claude/rules/security.md）"
    fi
    # 7. 任意 URL からのスクリプト直接実行
    if printf '%s' "$cmd" | grep -Eq '(curl|wget)[^|]*\|[[:space:]]*(sudo[[:space:]]+)?(ba|z|da)?sh([[:space:]]|$)'; then
      deny "curl | sh 形式のスクリプト実行は禁止（.claude/rules/security.md）"
    fi
    ;;
  Read|Edit|Write|MultiEdit|NotebookEdit)
    path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // .tool_input.notebook_path // ""')
    base=$(basename -- "$path")
    case "$base" in
      .env.example) ;;
      .env|.env.*) deny ".env ファイルの読み書きは禁止（.claude/rules/security.md）: $path" ;;
    esac
    case "$path" in
      */.ssh/*|*/.aws/*|*/.gnupg/*|*/.config/op/*) deny "秘密ディレクトリ配下のファイル操作は禁止: $path" ;;
    esac
    ;;
esac
exit 0
