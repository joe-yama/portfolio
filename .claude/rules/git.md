# Git のルール

## ブランチ運用

- 機能開発は `main` で直接行わず、`superpowers:using-git-worktrees` で worktree を作って作業する。
- ブランチ名は `feature/<openspec-change-name>` または `fix/<短い説明>`。
- `main` へのマージは PO の受け入れ後。

## コミット

- 1 コミット = 1 つの意味のある変更（2〜5 分粒度のタスク 1 つ）。
- コミットメッセージは日本語で、先頭に種別（`feat:` / `fix:` / `test:` / `docs:` / `chore:` / `refactor:`）を付ける。
- テストが通っていない状態のコミットは禁止（`.claude/rules/testing.md`）。
- コミットの署名設定（1Password SSH）はそのまま使う。署名を無効化する `--no-gpg-sign` は使わない。

## 禁止操作

- `git push --force` / `--force-with-lease`（hooks でブロックされる）
- `git reset --hard` / `git checkout -- .` / `git clean -f` による未コミット変更の破棄。必要なら PO に確認する
- `git push` は PO が push 権限を決定するまで毎回確認する
- 履歴の書き換え（`rebase -i`、`commit --amend` で push 済みコミットを変更）
