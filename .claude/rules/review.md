# レビューと使用モデルのルール（PO 指示 2026-09-17）

## 原則

- 実装したコンテキストはレビューしない。レビューは必ず、実装とは別のコンテキストを持つサブエージェントが行う。実装者が自分の作業をレビューすると甘くなる、という PO の判断による。
- メインセッション（コントローラー）は計画の配布・判定・記録を行い、自分でコードを書かない・レビューしない。
- レビューは **敵対的** に行う。実装者の報告は未検証の主張として扱い、diff と実行結果だけを証拠にする。「仕様どおり」「テスト済み」の一文を信じず、壊し方を探す。
- レビューには **ponytail の観点**（過剰設計の摘出）を必ず含める。`.claude/skills/ponytail-review/SKILL.md` の形式（`delete:` / `stdlib:` / `native:` / `yagni:` / `shrink:`、末尾に `net: -N lines possible.`）で報告する。

## 使用モデル（予算の都合）

| 役割 | モデル | サブエージェント定義 |
|---|---|---|
| 実装（タスクごとの implementer） | **Sonnet** | `.claude/agents/implementer.md`（`subagent_type: implementer`） |
| レビュー（タスク単位・ブランチ全体・再レビュー） | **Opus** | `.claude/agents/reviewer.md`（`subagent_type: reviewer`） |
| 立て直し実装（下記の条件を満たしたとき） | **Opus** | `subagent_type: implementer` に `model: opus` を明示して新しいコンテキストで起こす |

- Agent ツールでは常に `subagent_type` を上記のどちらかにし、モデルを省略しない。省略するとセッションのモデル（最上位・最高額）を継承する。
- 再レビューも Opus。小さな修正 diff でも下げない（PO の指示はレビュー = Opus）。

## Opus に実装を切り替える条件（「あまりにもひどい」の定義）

次のいずれかに当たったら、その場で Sonnet の修正ループを打ち切り、**新しいコンテキスト**の implementer を `model: opus` で起こす。同じ brief を渡し、レビュー報告を添える。

1. レビューの仕様準拠が ❌ で、Critical の指摘が 1 件以上ある
2. 修正ラウンドを 2 回行っても「Approved」にならない
3. レビュアーが報告で「再実装を推奨」と明記した

切り替えたことと理由を、ledger と GitHub Issue に記録する。

## レビューの手順（サブエージェント駆動開発の各タスク）

1. 実装者（Sonnet）が TDD で実装・テスト・コミットし、報告ファイルを書く
2. コントローラーが review package（diff）を作り、reviewer（Opus）を起こす。渡すもの: task brief、Global Constraints、実装者の報告ファイル、diff ファイル
3. reviewer は「仕様準拠 → コード品質 → ponytail」の順で報告する。UI があるタスクでは、コントローラーが渡した HTTP の URL に対して reviewer 自身が Playwright MCP で実際に操作し、測った値を報告に書く（`reviewer.md` の `tools` に 11 ツールを列挙済み。`browser_run_code_unsafe` は渡さない。定義を変えたらセッションを開き直す）
4. Approved なら次のタスク。そうでなければ修正ラウンド（上記の切り替え条件を毎回確認する）
5. 全タスク完了後、ブランチ全体のレビューも reviewer（Opus）で行う
6. 各レビューの結果（Approved / 指摘数 / 切り替えの有無）を change の GitHub Issue にコメントする
