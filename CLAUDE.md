# CLAUDE.md — Agent 向け運用ルール

このリポジトリは「人間 = PO、Claude Code = Agent」の開発ハーネス上で進める。
詳細な経緯と手順は `docs/HANDOFF.md`、ハーネス部品の記録は `docs/harness/` を参照。

現在のフェーズ: ハーネス構築は完了（2026-09-17、記録は `docs/harness/README.md`）。`docs/HANDOFF.md` §3 のセットアップ手順は再実行しない。
次の作業は PO との brainstorming。未決事項（HANDOFF §6 と harness README §5）はその中で確定する。

## プロジェクト概要

PO 本人のプロフィールと情報発信のための Web サイト（2026-09-17 PO 決定）。
ターゲットユーザー・掲載内容・情報発信の形式は brainstorming で詰める。

## 役割分担

| 役割 | 担当 | やること | やらないこと |
|---|---|---|---|
| PO | 人間 | 何を作るか・優先順位・受け入れ判断・質問への回答 | コードを書く・実装詳細の指定 |
| Agent | Claude Code | 設計提案・実装・テスト・レビュー・ドキュメント | 設計承認前の実装・仕様外の機能追加 |

- Humans steer, agents execute。判断が必要な点は勝手に決めず PO に質問する。
- 作った側の自己評価を信用しない。レビュー/QA は別コンテキストのサブエージェントが行う。

## 標準ワークフロー（1 機能あたり）

1. PO がアイデアを 1〜4 文で提示する
2. `superpowers:brainstorming` で Agent が質問し、設計を段階的に提示。PO が承認する
3. `/opsx:propose` で proposal / spec / design / tasks を生成。PO がレビューし承認する
4. `superpowers:writing-plans` → `superpowers:subagent-driven-development` で実装（TDD 強制）。ブロッカー以外で PO を呼ばない
5. 独立レビュー: 別サブエージェントが「仕様準拠 → コード品質」の順でレビュー。UI は Playwright MCP で実操作して検証する
6. PO 受け入れ。OK なら `/opsx:archive` で change をアーカイブする
7. 長時間タスクは `/goal`（完了条件 + 反復上限）をサンドボックス内で実行する

## 完了の定義

以下をすべて満たしたときのみ「完了」と報告する:

- テストが緑（実行コマンドと結果を示す）
- lint 通過
- OpenSpec の `tasks.md` を更新済み
- コミット済み

## 禁止事項

- 設計承認（brainstorming + proposal 承認）前に実装コードを書くこと
- テストなしでコミットすること（RED → GREEN → REFACTOR を守る）
- OpenSpec の spec / tasks にない機能を追加すること。スコープ変更は proposal から
- 秘密情報（API キー・トークン・パスワード）をコードやドキュメントにハードコードすること
- `git push --force`、`rm -rf`、`.env` の読み取り（hooks でもブロックされる）

## 実行制限

- 1 タスクは 2〜5 分粒度。小さく作り、小さくコミットする
- 自律実行はサンドボックス内で行い、上限を必ず明示する。`/goal <完了条件> or stop after N turns` でターン上限を付ける
- `/loop` には回数上限の仕組みが無い（固定間隔は 7 日で自動削除のみ）。使う場合は停止条件をプロンプトに書き、回数制限が必要な作業は `/goal` を使う
- 月あたりのトークン費用上限: <!-- PO 決定後に追記 --> 未決定
- 夜間放置・push 権限の範囲: <!-- PO 決定後に追記 --> 未決定（決定まで push は毎回確認）

## 環境の注意点（このマシン固有・毎セッション該当）

- `.claude/settings.json` / `.claude/hooks/` / `.claude/skills/` / `.mcp.json` はサンドボックス内 Bash から書き込めない。Write / Edit ツールで編集する
- `git commit` は 1Password の SSH 署名を使うため、サンドボックス内では単体コマンドでも `Could not connect to socket` で失敗する（2026-09-17 確認）。サンドボックス外で実行する。ネットワークを使う `gh` 操作も同様
- Playwright MCP は `file:` URL を拒否する。UI 検証は HTTP で配信する（例: `python3 -m http.server`）
- lint / test の hooks はコマンド自動検出で、スタック未決定の現状は何も実行せず通過する。「完了の定義」のテスト緑・lint 通過は現状 hooks が保証していない
- permissions の `Read(.env.*)` deny は `.env.example` にも当たる。`.env.example` の作成・更新は PO が行う

## スキルの管理（PO 指示）

- `.claude/skills/openspec-*` は `gh skill` 管理（`Fission-AI/OpenSpec` の `skills/`、`v1.13.1` にピン留め）。スキルの追加・更新は `gh skill install` / `gh skill update` で行い、SKILL.md の手コピーやツール独自の生成コマンドに任せない
- `openspec update` は gh skill 管理のスキルを init 版で上書きする。実行後は `gh skill install ... --pin v<ver> --force` で再導入する。手順は `docs/harness/README.md`「スキルの更新ルール」

## 技術スタック

未決定。PO 方針: Agent が提案し、PO が最終承認する（2026-09-17）。承認前に依存の追加やスキャフォールドを行わない。

決定したら同じ change で以下を更新する:

1. `.claude/rules/testing.md` のテストコマンド節（test / lint / typecheck）
2. `.claude/hooks/lint-on-edit.sh` の `detect_lint()` と `.claude/hooks/test-on-stop.sh` の `detect_test()` を確定コマンド 1 行に置き換える
3. `.claude/settings.json` の `permissions.allow` にテスト・lint の実行コマンドを追加する
4. 本節と「コマンド」節、`docs/harness/README.md` の記録

## コマンド（現時点で使えるもの）

| コマンド | 用途 |
|---|---|
| `openspec list` / `openspec list --specs` | 進行中の change / 仕様の一覧 |
| `gh skill list --agent claude-code --scope project` | 導入済みスキルの出所とピン留めの確認 |
| `printf '{"tool_name":"Bash","tool_input":{"command":"rm -rf x"}}' \| bash .claude/hooks/block-destructive.sh` | hook の再検証（rc=2 が期待値）。他の例は `docs/harness/hooks.md` |

test / lint / typecheck はスタック決定後に追記する（`.claude/rules/testing.md` と同期）。

## 参照

- `docs/HANDOFF.md` — 引き継ぎ文書・未決事項
- `docs/harness/README.md` — 導入したハーネス部品と動作確認結果
- `docs/harness/hooks.md` — hooks の設定内容と理由
- `.claude/settings.json` — permissions / sandbox / hooks の設定（理由は `docs/harness/README.md` §4）
- `.claude/hooks/` — hook スクリプト 3 本（block-destructive / lint-on-edit / test-on-stop）
- `.mcp.json` — Playwright MCP（headless / isolated、出力先 `.playwright-mcp/`）
- `openspec/` — 仕様・変更提案・アーカイブ
- `.claude/rules/` — testing / git / security / scope の詳細ルール
