# Git のルール

## GitHub Issue での進行管理（PO 指示 2026-09-17）

目的: 人間が「Agent がいま何に取り組み、どこまで進み、何を変えたか」を GitHub 上で追えるようにする。

- OpenSpec の change 1 つにつき GitHub Issue を 1 つ作る。作成時点は `/opsx:propose` で change を起こしたとき。実装（コード変更）に取り掛かる前に必ず存在させる。
- タイトルは change 名。本文には目的、スコープ（含めるもの・含めないもの）、`openspec/changes/<name>/` のパス、完了条件を書く。
- 次の時点で Issue にコメントを追加する: PO の設計・proposal 承認、実装開始、方針変更（理由と変更後の方針）、ブロッカーと PO への質問、独立レビューの結果、PR 作成。
- PR 本文に `Closes #<番号>` を書き、change の Issue に紐付ける。マージで Issue が自動的に閉じる。閉じた後に `/opsx:archive` する。
- `gh issue` / `gh pr` / `gh release` で書き込む前に `gh api user --jq .login` が `joe-yama` であることを確認する。違う場合は書き込まず、PO にアカウント切り替えを依頼する（このマシンには職場アカウントも登録されている）。
- Issue の作成・クローズ・編集は毎回確認（ask）、コメントの追加と閲覧は自動許可。

## ブランチ運用

- 機能開発は `main` で直接行わず、`superpowers:using-git-worktrees` で worktree を作って作業する。
- ブランチ名は `feature/<openspec-change-name>` または `fix/<短い説明>`。
- `main` へのマージは PO の受け入れ後。PR は change の Issue に `Closes #<番号>` で紐付ける。

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
