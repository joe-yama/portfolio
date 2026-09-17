# CLAUDE.md — Agent 向け運用ルール

「人間 = PO、Claude Code = Agent」の開発ハーネス上で進める。経緯と未決事項は `docs/HANDOFF.md`、導入したハーネス部品と動作確認の記録は `docs/harness/README.md`（hooks の理由は `docs/harness/hooks.md`）。testing / git / security / scope の詳細ルールは `.claude/rules/` にあり、毎セッション自動ロードされる。

現在のフェーズ: ハーネス構築は完了（2026-09-17）。`docs/HANDOFF.md` §3 のセットアップ手順は再実行しない。次の作業は PO との brainstorming。未決事項（HANDOFF §6、harness README §5）はその中で確定する。

## プロジェクト概要

PO 本人のプロフィールと情報発信のための Web サイト（2026-09-17 PO 決定）。ターゲットユーザー・掲載内容・発信形式は brainstorming で詰める。

## 役割分担

- PO（人間）: 何を作るか・優先順位・受け入れ判断・質問への回答。コードや実装詳細は指定しない
- Agent（Claude Code）: 設計提案・実装・テスト・レビュー・ドキュメント。設計承認前の実装と仕様外の機能追加はしない
- 判断が必要な点は勝手に決めず PO に質問する。作った側の自己評価を信用せず、レビュー/QA は別コンテキストのサブエージェントが行う

## 標準ワークフロー（1 機能あたり）

1. PO がアイデアを 1〜4 文で提示する
2. `superpowers:brainstorming` で Agent が質問し、設計を段階的に提示。PO が承認する
3. `/opsx:propose` で proposal / spec / design / tasks を生成。PO がレビューし承認する
4. `superpowers:writing-plans` → `superpowers:subagent-driven-development` で実装（TDD 強制）。ブロッカー以外で PO を呼ばない
5. 独立レビュー: 別サブエージェントが「仕様準拠 → コード品質」の順でレビュー。UI は Playwright MCP で実操作して検証する
6. PO 受け入れ。OK なら `/opsx:archive` で change をアーカイブする

## 完了の定義

テスト緑（実行コマンドと結果を示す）・lint 通過・OpenSpec の `tasks.md` 更新・コミット済み、をすべて満たしたときのみ「完了」と報告する。
lint / test の hooks はスタック未決定のため何も実行せず通過する。テスト緑・lint 通過は hooks ではなく Agent が自分で実行して示す。

## 自律実行

- 長時間タスクは `/goal <完了条件> or stop after N turns` をサンドボックス内で実行する。ターン上限は必ず付ける
- `/loop` には回数上限が無い。停止条件をプロンプトに書き、回数制限が必要な作業は `/goal` を使う
- コンパクション時は、進行中の change 名・変更したファイル一覧・テスト実行コマンドを保持する

## 環境の注意点（このマシン固有）

- `.claude/settings.json` / `.claude/hooks/` / `.claude/skills/` / `.mcp.json` はサンドボックス内 Bash から書き込めない。Write / Edit ツールで編集する
- `git commit` は 1Password の SSH 署名を使うため、サンドボックス内では `Could not connect to socket` で失敗する。サンドボックス外で実行する。ネットワークを使う `gh` 操作も同様
- Playwright MCP は `file:` URL を拒否する。UI 検証は HTTP で配信する（例: `python3 -m http.server`）
- permissions の `Read(.env.*)` deny は `.env.example` にも当たる。`.env.example` の作成・更新は PO が行う

## スキルの管理（PO 指示）

`.claude/skills/` 配下は全て `gh skill` 管理（出所とバージョンは `gh skill list` で確認）。追加・更新は `gh skill install --pin <tag>` / `gh skill update` で行い、SKILL.md の手コピーやツール独自の生成コマンドに任せない。`openspec update` は gh skill 管理のスキルを上書きするので、実行後は `docs/harness/README.md`「スキルの更新ルール」の手順で再導入する。

## 技術スタック

未決定。Agent が提案し、PO が最終承認する（2026-09-17）。承認前に依存の追加やスキャフォールドを行わない。決定時に同じ change で更新するファイルは `docs/harness/README.md` §5 の一覧に従う。

## コマンド

| コマンド | 用途 |
|---|---|
| `openspec list` / `openspec list --specs` | 進行中の change / 仕様の一覧 |
| `gh skill list --agent claude-code --scope project` | 導入済みスキルの出所とピン留めの確認 |

test / lint / typecheck はスタック決定後に追記する。
