# HANDOFF — 開発ハーネス構築の引き継ぎ

- 作成日: 2026-09-17
- 作成元: claude.ai での事前調査セッション（ハーネス比較調査の結論を集約）
- 読み手: Claude Code（初回セッション）と PO
- 状態: ハーネス未構築・プロダクト未定義

## 0. このファイルの使い方（Claude Code へ）

1. セッション開始時にこのファイル全体を読む。
2. 「3. セットアップ手順」を上から順に実行する。**セットアップ完了までアプリケーションコードは一切書かない。**
3. 判断が必要な箇所は勝手に決めず、「6. 未決事項」を PO に質問する。
4. 完了したら「3-9. 完了報告」の形式で報告し、その後 Superpowers の brainstorming に入る。

## 1. 役割分担と原則

| 役割 | 担当 | やること | やらないこと |
|---|---|---|---|
| PO | 人間 | 何を作るか・優先順位・受け入れ判断・brainstorming の質問への回答 | コードを書く・実装詳細の指定 |
| Agent | Claude Code | 設計提案・実装・テスト・レビュー・ドキュメント | 設計承認前の実装・仕様外の機能追加 |

原則:
- Humans steer, agents execute。Agent = Model + Harness。
- 「完了」は常に検証可能な形で定義する（テスト合格、Playwright で操作できる、lint 通過）。
- 作った側の自己評価を信用しない。レビュー/QA は別コンテキストのサブエージェントが行う。
- ハーネスの各部品は「モデルにできないこと」の仮定。新しいモデルが出たら不要になった部品を剥がす。
- 1タスクは 2〜5 分粒度。小さく作り、小さくコミットする。

## 2. 採用ハーネス（決定事項）

| 層 | 採用 | 役割 |
|---|---|---|
| 実行規律 | **Superpowers**（obra/superpowers, MIT） | brainstorming → git worktree → writing-plans → subagent-driven-development（TDD 強制、仕様準拠→コード品質の2段階レビュー） |
| 仕様・変更管理 | **OpenSpec** | proposal / spec / design / tasks の生成、デルタ仕様（ADDED/MODIFIED/REMOVED）、判断履歴のアーカイブ |
| 自律実行 | **Claude Code ネイティブ**（/goal, /loop, Agent Teams） | 長時間・夜間の自律実行。完了条件＝テスト合格。反復上限とサンドボックス必須 |
| 作業記憶（任意） | **Beads**（steveyegge/beads） | タスクの依存グラフと「実装中に見つかった作業」の記録。タスク数が増えてから導入判断 |
| 参照アーキテクチャ | Anthropic の Planner / Generator / Evaluator | 設計原理。Evaluator は Playwright MCP で実際に操作して検証する |

結合の考え方: OpenSpec が **what / why**（仕様と判断履歴）、Superpowers が **how**（実装規律）。結合点は OpenSpec が生成する tasks。

不採用と理由:
- BMAD Method — 個人開発には重すぎる（12〜21 ペルソナ、監査証跡前提）
- GSD — 元リポジトリがアーカイブされガバナンスに問題。採用する場合は Open GSD の GSD Core のみ
- GitHub Spec Kit — 小変更に弱く、アップグレードでカスタマイズが上書きされる既知の問題
- 自作ハーネス — 評判の良い既存物の組み合わせで足りる

## 3. セットアップ手順（Claude Code が実行）

各手順で、コマンドやディレクトリ構成は**必ず各ツールの公式 README / ドキュメントを取得して最新に従う**（この文書のコマンド例は古くなっている可能性がある）。

### 3-1. リポジトリ初期化
- `git init`、`.gitignore`（secrets / node_modules / .env など）、最小の README.md
- `docs/` を作り、このファイルを `docs/HANDOFF.md` に置く（ルートにある場合は移動）

### 3-2. Superpowers の導入
- https://github.com/obra/superpowers の README「Installation」を取得し、Claude Code 向け手順（公式プラグインマーケットプレイス経由）に従う
- インストール後、brainstorming / writing-plans / subagent-driven-development / test-driven-development の各スキルが認識されることを確認

### 3-3. OpenSpec の導入
- OpenSpec 公式リポジトリの手順に従い `openspec init` を実行し、Claude Code 用のスラッシュコマンド（/opsx: 系）が使えることを確認
- `openspec/` ディレクトリの構成を PO に1段落で説明する

### 3-4. CLAUDE.md の作成
- 「4. CLAUDE.md に含める内容」に沿って作成。技術スタック節は PO 決定後に追記
- 200 行を超えない。詳細ルールは `.claude/rules/` に分割

### 3-5. `.claude/rules/` の作成
- `testing.md` — テストなしコミット禁止、RED-GREEN-REFACTOR、テストコマンド
- `git.md` — ブランチ運用（worktree 前提）、コミット粒度、force push 禁止
- `security.md` — 秘密情報は環境変数、`.env` をコミットしない、外部送信の禁止範囲
- `scope.md` — OpenSpec にない機能を追加しない、スコープ変更は proposal から

### 3-6. Hooks の設定
公式ドキュメントで hooks の設定方法を確認したうえで、最低限:
- **PreToolUse**: 破壊的操作のブロック（`rm -rf`、force push、`.env` の読み取りなど）
- **PostToolUse / Stop**: ファイル編集後の lint、タスク完了前のテスト実行
- 設定内容と「なぜ必要か」を `docs/harness/hooks.md` に記録

### 3-7. Playwright MCP の設定
- レビュアー/QA 用サブエージェントが実際に UI を操作できるよう Playwright MCP を設定
- 動作確認として、簡単なページを開いてスクリーンショットを取れることを確認

### 3-8. サンドボックスと権限
- 自律実行（/goal, /loop, 長時間の subagent-driven-development）はコンテナ内、または Claude Code のサンドボックス設定下で行う
- 権限設定（allow / deny）を PO に提示し、承認を得る。デフォルトは「読み取り・テスト実行は自動、push・削除・外部通信は確認」

### 3-9. 完了報告
以下の形式で報告する:
1. 導入したもの一覧（バージョン含む）
2. 動作確認結果（何を実行して何が返ったか）
3. `docs/harness/README.md` に上記を記録した旨
4. PO が確認・決定すべき点（6. 未決事項のうち未回答のもの）

## 4. CLAUDE.md に含める内容

- プロジェクト概要（1段落、PO 決定後）
- 役割分担（1. の要約）
- 標準ワークフロー（5. の要約）
- 完了の定義: テスト緑・lint 通過・OpenSpec の tasks 更新・コミット済み
- 禁止事項: 設計承認前の実装、テストなしコミット、仕様外の機能追加、秘密情報のハードコード
- 実行制限: 自律ループは反復上限を明示、1タスク 2〜5 分粒度、コスト上限（PO 決定後）
- 技術スタック（PO 決定後）
- 参照: `docs/HANDOFF.md`、`docs/harness/`、`openspec/`

注: コンパクション後も確実に残るのは CLAUDE.md。重要ルールは会話ではなくここに置く。

## 5. 標準ワークフロー（1機能あたり）

1. **PO** がアイデアを 1〜4 文で提示
2. **brainstorming**（Superpowers）— Agent が質問、PO が回答。設計を段階的に提示し、PO が承認
3. **/opsx:propose**（OpenSpec）— proposal / spec / design / tasks を生成。PO がレビューし承認
4. **writing-plans → subagent-driven-development**（Superpowers）— 実装は連続実行。ブロッカー以外で PO を呼ばない
5. **独立レビュー** — 別サブエージェントが仕様準拠 → コード品質の順でレビュー。UI は Playwright で実操作
6. **PO 受け入れ** — 動くものを PO が触って判断。OK なら OpenSpec の change を archive
7. 長時間タスクは **/goal**（完了条件 + 反復上限）をサンドボックス内で。ログは翌朝 PO が確認

## 6. 未決事項（初回セッションで PO に確認すること）

- プロダクトの一文説明とターゲットユーザー
- 技術スタックの希望（言語 / フレームワーク / DB / ホスティング）、または Agent の提案に任せるか
- 月あたりのトークン費用の上限
- 自律実行の許容範囲（夜間放置の可否、Agent に push 権限を与えるか）
- リポジトリの公開範囲とライセンス
- Beads を初日から入れるか、タスクが増えてからにするか
- Agent Teams（並列ワーカー）を使うか、まずは単一セッション + サブエージェントで始めるか

## 7. 参照

- Superpowers: https://github.com/obra/superpowers
- Beads: https://github.com/steveyegge/beads
- Anthropic — Harness design for long-running application development: https://www.anthropic.com/engineering/harness-design-long-running-apps
- Anthropic — Effective harnesses for long-running agents: https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents
- OpenAI — Harness Engineering: https://openai.com/index/harness-engineering/
- Martin Fowler — Harness engineering for coding agent users: https://martinfowler.com/articles/harness-engineering.html
- Awesome Harness Engineering: https://github.com/ai-boost/awesome-harness-engineering
- SDD ツール比較（spec-compare）: https://github.com/cameronsjo/spec-compare
- Claude Code 公式ドキュメント: https://docs.claude.com/en/docs/claude-code/overview

