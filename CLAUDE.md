# CLAUDE.md — Agent 向け運用ルール

PO 本人の名刺サイト（採用担当向けの経歴 + 写真ポートフォリオ、日英二言語、写真主役のミニマルデザイン）を「人間 = PO、Claude Code = Agent」のハーネスで作る。testing / git / security / scope / review の詳細は `.claude/rules/`（毎セッション自動ロード）。**それ以外は下の索引から必要なときに読む。**

## 索引

| いつ | 読むファイル |
|---|---|
| 今どこまで進んだか・次に何をするか・PO 待ちの宿題 | `docs/status.md` |
| 過去の change の経緯・裁定・後続への提案 | `docs/changes.md` |
| 何を作るかの正本 | `docs/superpowers/specs/2026-09-17-portfolio-site-design.md` |
| 経歴・特許・資格・写真の YAML を編集する | `docs/content-authoring.md` |
| テストや CI が想定外の落ち方をした / 番人を書く | `docs/harness/lessons.md` |
| 権限・hook・このマシン固有の癖 | `docs/harness/README.md`（hook は同 `hooks.md`） |
| 未決事項 | `docs/HANDOFF.md` §6、`docs/harness/README.md` §5 |

## 役割分担

PO は何を作るか・優先順位・受け入れを決め、実装詳細は指定しない。Agent は設計提案・実装・テスト・レビュー・ドキュメントを担い、設計承認前の実装と仕様外の機能追加はしない。
判断が要る点は勝手に決めず PO に質問する。ただし**実装中は止まらず**、spec を正として裁定し、ledger と Issue に「裁定 / 理由 / 間違っていたときの代償」を記録して進む（PO が後から覆せる）。止まるのは 4 つだけ: 破壊的・不可逆な操作、セキュリティ、worktree 外への副作用（push・publish）、どの道も推測になる計画の欠陥。

## 標準ワークフロー（1 機能あたり）

1. PO がアイデアを 1〜4 文で出し、`superpowers:brainstorming` で設計を提示して PO が承認する。Open Questions はここで全部決めてもらう（実装中に PO を止めないため）
2. `/opsx:propose` で proposal / spec / design / tasks を生成し、同時に Issue を 1 つ作る（change 1 つ = Issue 1 つ）
3. 実装は**新しいセッション**で始め、コントローラーは `/model opus`。`superpowers:writing-plans` → `superpowers:subagent-driven-development`（TDD 強制）。実装は `implementer` を Agent ツールで起こす（agent teams は無効）
4. `reviewer` が敵対的にレビューする。UI は reviewer 自身が Playwright MCP で HTTP の URL を実操作する
5. PR を作る（本文に `Closes #<Issue 番号>`）。PO が受け入れてマージしたら `/opsx:archive` し、**`docs/status.md` を現在の状態に更新する**

同じ change でハーネス側のファイルも更新する場合は、設計書 §8.1 と `docs/harness/README.md` §5 に従う。技術スタックの導入は最初の change の中で行い、**承認前に依存の追加やスキャフォールドをしない**。

**小さな change の経路**（PO 承認 2026-09-20）: docs / `.claude/` / CSS だけ、または変更ファイル 5 以下で新しい spec 要求を含まない change は、brainstorming を省き（**Issue は作る**）、`tasks.md` をそのまま brief にして implementer を 1 回、レビューはブランチ全体 1 回だけにする。change を伴わないハーネスとドキュメントだけの変更は Issue を作らず `fix/<説明>` ブランチの PR で行う。迷う change は通常の経路を使う。

## 完了の定義

テスト緑（実行コマンドと結果を示す）・lint 通過・`tasks.md` 更新・コミット済みをすべて満たしたときだけ「完了」と報告する。hook も lint / test を走らせるが、報告時は自分でも実行コマンドと出力を示す。

## 落とし穴（毎回効く）

- **`main` には直接 push できない**（ruleset で PR 必須 + CI 必須）。変更は必ず PR で行う。required status check は CI の job 名 `check` で、**変えると以後どの PR もマージできなくなる**
- **`gh` で書き込む前に `gh api user --jq .login` が `joe-yama` か確認する。** 違えば PO に切り替えを依頼して止まる（このマシンには職場アカウントもある）
- パッケージマネージャは **pnpm**。`npm` / `npx` は使わない
- `.claude/settings.json` と `.claude/hooks/` は Write できない（auto mode の分類器が拒否）。完成版を scratchpad に置き PO に配置してもらう
- **ローカルの緑を完了の根拠にせず、CI の実行結果を最終証拠にする**
- **番人を書いたら必ず変異を当てて落ちることを確かめる**（`tasks.md` にそのタスクを 1 つ置く）
- `.claude/agents/*.md` の変更は実行中のセッションに反映されない。`tools` を変えたらセッションを開き直してから dispatch する（症状は `No such tool available`）

## 自律実行

auto mode（ユーザー設定の `defaultMode`）が前提で、`permissions.ask` に当たる操作と保護パスへの書き込みだけが PO を止める。長時間タスクは `/goal <完了条件> or stop after N turns` で回し、**ターン上限を必ず付ける**（`/loop` には回数上限が無いので停止条件をプロンプトに書く）。無人は `claude -p --permission-mode auto --permission-prompts none --max-turns N`。プロンプトになる操作は拒否されて先へ進むので、残った操作を報告に書く。

## 技術スタックとコマンド

Astro（TypeScript）+ GitHub Pages + GitHub Actions、pnpm。写真ファイルはリポジトリに入れず GitHub Releases（タグ `photos`）に置く。詳細は設計書 §2・§5・§9。
`.claude/skills/` 配下は全て `gh skill` 管理（PO 指示）。追加・更新は `gh skill install --pin <tag>` / `gh skill update` で行い、手コピーやツール独自の生成コマンドに任せない。

| コマンド | 用途 |
|---|---|
| `pnpm test` / `lint` / `typecheck` / `build` | Vitest / Biome（修正は `pnpm format`）/ astro check / ビルド |
| `pnpm e2e` | Playwright。数十秒かかるので hook には入れず、CI とレビュー用サブエージェントが実行する |
| `openspec list [--specs]` | 進行中の change / 仕様の一覧 |
| `gh skill list --agent claude-code --scope project` | 導入済みスキルの出所とピン留めの確認 |

## Compact instructions

必ず残す: 進行中の change 名と Issue 番号、worktree のパスとブランチ名、SDD ledger のパス（`.superpowers/sdd/<plan>/progress.md`）、完了済みタスクと現在のタスク番号、直近のレビュー判定と未対応の Critical / Important、PO の決定と未回答の質問、テスト・lint の実行コマンド。ツール出力の本文、探索的に読んだファイルの内容、サブエージェントの報告全文は要約に落とす。
