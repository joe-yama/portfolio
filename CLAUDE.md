# CLAUDE.md — Agent 向け運用ルール

このリポジトリは「人間 = PO、Claude Code = Agent」の開発ハーネス上で進める。
詳細な経緯と手順は `docs/HANDOFF.md`、ハーネス部品の記録は `docs/harness/` を参照。

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
- 自律ループ（/goal, /loop）は反復上限を必ず明示し、サンドボックス内で実行する
- 月あたりのトークン費用上限: <!-- PO 決定後に追記 --> 未決定
- 夜間放置・push 権限の範囲: <!-- PO 決定後に追記 --> 未決定（決定まで push は毎回確認）

## 技術スタック

<!-- 決まったら .claude/rules/testing.md のテストコマンドと hooks の lint/test 検出も更新する -->
未決定。PO 方針: Agent が提案し、PO が最終承認する（2026-09-17）。承認前に依存の追加やスキャフォールドを行わない。

## 参照

- `docs/HANDOFF.md` — 引き継ぎ文書・未決事項
- `docs/harness/README.md` — 導入したハーネス部品と動作確認結果
- `docs/harness/hooks.md` — hooks の設定内容と理由
- `openspec/` — 仕様・変更提案・アーカイブ
- `.claude/rules/` — testing / git / security / scope の詳細ルール
