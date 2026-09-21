# Git のルール

## GitHub Issue での進行管理（PO 指示 2026-09-17）

目的: 人間が「Agent がいま何に取り組み、どこまで進み、何を変えたか」を GitHub 上で追えるようにする。

- change 1 つにつき Issue を 1 つ、`/opsx:propose` のときに作る。実装に取り掛かる前に必ず存在させる。タイトルは change 名。本文には目的、スコープ（含める / 含めない）、`openspec/changes/<name>/` のパス、完了条件を書く。
- コメントする節目は次の 6 つだけ: PO の設計・proposal 承認、実装開始、方針変更（理由と変更後の方針）、ブロッカーと PO への質問、最終レビューの結果、PR 作成。**タスクごとの完了報告はコメントしない。**
- 長いコメントは `--body-file <ファイル>` で渡す（heredoc の本文が hook の正規表現や auto mode の分類器に誤検知されるため）。
- PR 本文に `Closes #<番号>` を書く。マージで Issue が閉じたら `/opsx:archive` する。
- `gh issue` / `gh pr` / `gh release` で書き込む前に `gh api user --jq .login` が `joe-yama` であることを確認する。違う場合は書き込まず、PO にアカウント切り替えを依頼する。
- ハーネス（`.claude/`、`docs/harness/`、CLAUDE.md）とドキュメントだけの変更は、change と Issue を作らず `fix/<説明>` ブランチの PR で行う（PR #8 の前例）。

## ブランチ運用

- 機能開発は `main` で直接行わず、`superpowers:using-git-worktrees` で worktree を作って作業する。
- ブランチ名は `feature/<openspec-change-name>` または `fix/<短い説明>`。
- `main` へのマージは PO の受け入れ後。

## コミット

- 1 コミット = 1 つの意味のある変更（2〜5 分粒度のタスク 1 つ）。
- メッセージは日本語で、先頭に種別（`feat:` / `fix:` / `test:` / `docs:` / `chore:` / `refactor:`）を付ける。
- テストが通っていない状態のコミットは禁止（`.claude/rules/testing.md`）。
- `tasks.md` のチェックは、そのタスクの実装と同じコミットに含める。チェックだけのコミットは作らない。
- 署名は 1Password SSH をそのまま使う。

## push と破壊的操作

- `feature/*` / `fix/*` への push は自動。`main` への push、リモートブランチの削除、`--all` / `--mirror`、`git worktree remove --force` は hook が確認に回すので、**PO の確認を待つ**（回避しようとしない）。
- force push、`git reset --hard`、`git clean -f`、`git checkout -- .`、履歴の書き換え（push 済みコミットの `rebase -i` / `--amend`）は hook と permissions がブロックする。未コミット変更を捨てる必要が出たら PO に確認する。
- push が SSH エージェントの都合で失敗したら再試行せず、PO に `! git push ...` での実行を依頼する。
