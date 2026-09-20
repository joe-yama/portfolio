# Git のルール

## GitHub Issue での進行管理（PO 指示 2026-09-17）

目的: 人間が「Agent がいま何に取り組み、どこまで進み、何を変えたか」を GitHub 上で追えるようにする。

- OpenSpec の change 1 つにつき GitHub Issue を 1 つ作る。作成時点は `/opsx:propose` で change を起こしたとき。実装（コード変更）に取り掛かる前に必ず存在させる。
- タイトルは change 名。本文には目的、スコープ（含めるもの・含めないもの）、`openspec/changes/<name>/` のパス、完了条件を書く。
- Issue にコメントする節目は次の 6 つだけ: PO の設計・proposal 承認、実装開始、方針変更（理由と変更後の方針）、ブロッカーと PO への質問、最終レビューの結果（タスク単位の判定もここにまとめる）、PR 作成。**タスクごとの完了報告はコメントしない**（2026-09-20。Change 1 はタスクごとに 11 回コメントし、その 1 回ごとが承認プロンプトとコントローラーのターンになった）。
- 長いコメントは `--body-file <ファイル>` で渡す。heredoc の本文が hook の正規表現や auto mode の分類器に誤検知されないため。
- PR 本文に `Closes #<番号>` を書き、change の Issue に紐付ける。マージで Issue が自動的に閉じる。閉じた後に `/opsx:archive` する。
- `gh issue` / `gh pr` / `gh release` で書き込む前に `gh api user --jq .login` が `joe-yama` であることを確認する。違う場合は書き込まず、PO にアカウント切り替えを依頼する（このマシンには職場アカウントも登録されている）。ユーザー設定の hook（`~/.claude/permission-gate.sh`）も `gh issue create|comment` と `gh pr create` の前に login と origin を検査し、joe-yama 以外なら確認に回す。
- Issue / PR の作成とコメントは自動許可（上記 hook が通したときだけ。PO 承認 2026-09-20）。Issue のクローズ・編集、PR のマージは毎回確認（ask）。
- ハーネス（`.claude/`、`docs/harness/`、CLAUDE.md）とドキュメントだけの変更は OpenSpec の change と Issue を作らず、`fix/<説明>` ブランチの PR で行う（PR #8 の前例）。

## ブランチ運用

- 機能開発は `main` で直接行わず、`superpowers:using-git-worktrees` で worktree を作って作業する。
- ブランチ名は `feature/<openspec-change-name>` または `fix/<短い説明>`。
- `main` へのマージは PO の受け入れ後。PR は change の Issue に `Closes #<番号>` で紐付ける。

## コミット

- 1 コミット = 1 つの意味のある変更（2〜5 分粒度のタスク 1 つ）。
- コミットメッセージは日本語で、先頭に種別（`feat:` / `fix:` / `test:` / `docs:` / `chore:` / `refactor:`）を付ける。
- テストが通っていない状態のコミットは禁止（`.claude/rules/testing.md`）。
- OpenSpec の `tasks.md` のチェックは、そのタスクの実装と同じコミットに含める。チェックだけのコミットは作らない（2026-09-20。Change 1 では 8 回あった）。
- コミットの署名設定（1Password SSH）はそのまま使う。署名を無効化する `--no-gpg-sign` は使わない。

## push（PO 決定 2026-09-20）

- `feature/*` と `fix/*` ブランチへの push は確認なしで行える（`.claude/settings.json` の allow。ユーザー設定の hook が origin を joe-yama の個人リポジトリと確認したときだけ）。
- main への push、リモートブランチの削除、`--all` / `--mirror` は hook（`.claude/hooks/ask-gate.sh`）が確認に回す。archive のコミットなど main へ直接 push するときは PO の確認を待つ。
- push が SSH エージェントの都合で失敗したら再試行せず、PO に `! git push ...` での実行を依頼する。

## 禁止操作

- `git push --force` / `--force-with-lease`（hooks でブロックされる）
- `git reset --hard` / `git checkout -- .` / `git clean -f` による未コミット変更の破棄。必要なら PO に確認する
- `git worktree remove --force`（未コミット変更を捨てる）は hook が確認に回す。`--force` なしは自動
- 履歴の書き換え（`rebase -i`、`commit --amend` で push 済みコミットを変更）
