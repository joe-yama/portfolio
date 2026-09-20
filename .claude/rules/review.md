# レビューと使用モデルのルール（PO 指示 2026-09-17。レビューの単位と Minor の扱いは PO 承認 2026-09-20）

## 原則

- 実装したコンテキストはレビューしない。レビューは必ず、実装とは別のコンテキストを持つサブエージェントが行う。実装者が自分の作業をレビューすると甘くなる、という PO の判断による。
- メインセッション（コントローラー）は計画の配布・判定・記録を行い、自分でコードを書かない・レビューしない。
- レビューは **敵対的** に行う。実装者の報告は未検証の主張として扱い、diff と実行結果だけを証拠にする。「仕様どおり」「テスト済み」の一文を信じず、壊し方を探す。
- レビューには **ponytail の観点**（過剰設計の摘出）を必ず含める。`.claude/skills/ponytail-review/SKILL.md` の形式（`delete:` / `stdlib:` / `native:` / `yagni:` / `shrink:`、末尾に `net: -N lines possible.`）で報告する。

## 使用モデル（予算の都合）

| 役割 | モデル | サブエージェント定義 |
|---|---|---|
| 実装（タスクごとの implementer） | **Sonnet** | `.claude/agents/implementer.md`（`subagent_type: implementer`） |
| レビュー（タスク単位・まとめ・ブランチ全体・再レビュー） | **Opus** | `.claude/agents/reviewer.md`（`subagent_type: reviewer`、`effort: high`、`maxTurns: 80`） |
| 立て直し実装（下記の条件を満たしたとき） | **Opus** | `subagent_type: implementer` に `model: opus` を明示して新しいコンテキストで起こす |
| コントローラー（実装フェーズ） | **Opus** | メインセッション。`/model opus` で始める。コードを書かない役なので最上位モデルは要らない（設計と brainstorming は Fable でよい） |

- Agent ツールでは常に `subagent_type` を上記のどちらかにし、モデルを省略しない。省略するとセッションのモデル（最上位・最高額）を継承する。
- 再レビューも Opus。ただし新しいコンテキストを起こさず、**同じ reviewer に `SendMessage` で続ける**（履歴とプロンプトキャッシュを保ったまま再開できる。`maxTurns` に達して partial で返ってきたときも同じ）。1 行の差し替え・文言・リネームのような機械的な修正は、コントローラーが diff と grep で反映を確かめて再レビューを省く。

## レビューの単位（2026-09-20）

- タスク単位のレビューは、共有インターフェース（型・スキーマ・URL 構造）、spec の要求、複数ファイルの整合に触るタスクだけに行う。CSS だけ、テストの補強、ドキュメント、1 ファイルの機械的な変更は、まとめて 1 回レビューする。どのタスクをどの単位でレビューするかは実装計画（writing-plans）に書く。
- ブランチ全体のレビューは必ず 1 回行う。
- UI の実測は brief に列挙された項目に絞る（reviewer の上限は 80 ターン）。
- 根拠: Change 1 は 8 タスクに Opus を 17 回起こし、layout-followups は CSS の Minor 5 件の確認に 135 回のツール呼び出しを使った（`docs/harness/README.md` §6）。

## Minor の扱い（2026-09-20）

- Minor は修正ラウンドを起こさない。reviewer は報告に残し、コントローラーは change の `tasks.md` 末尾「提案」に転記して後続に回す。Minor と ponytail だけの報告は Approved として扱う。
- 例外は 2 つ: PO が直せと指示したとき、Minor を Important に格上げする根拠（壊れる入力、spec との矛盾）が示されたとき。
- 根拠: Change 2 では保留 Minor 27 件の triage → 11 件修正 → 再レビューで回帰を検出、と修正 1 ラウンド分が Minor のために増えた。

## Opus に実装を切り替える条件（「あまりにもひどい」の定義）

次のいずれかに当たったら、その場で Sonnet の修正ループを打ち切り、**新しいコンテキスト**の implementer を `model: opus` で起こす。同じ brief を渡し、レビュー報告を添える。

1. レビューの仕様準拠が ❌ で、Critical の指摘が 1 件以上ある
2. 修正ラウンドを 2 回行っても「Approved」にならない
3. レビュアーが報告で「再実装を推奨」と明記した

切り替えたことと理由を、ledger と GitHub Issue に記録する。

## レビューの手順（サブエージェント駆動開発の各タスク）

1. 実装者（Sonnet）が TDD で実装・テスト・コミット（担当タスクの `tasks.md` のチェック込み）し、報告ファイルを書く
2. レビュー単位に達したら、コントローラーが review package（diff）を作り、reviewer（Opus）を起こす。渡すもの: task brief、Global Constraints、実装者の報告ファイル、diff ファイル。UI があるタスクでは、コントローラーが `pnpm build && pnpm preview` を起動して URL（例 `http://127.0.0.1:4321/ja/`）も渡す。reviewer は自分でビルドしない（作業ツリーを変更しないため）
3. reviewer は「仕様準拠 → コード品質 → ponytail」の順で報告する。UI があるタスクでは、コントローラーが渡した HTTP の URL に対して reviewer 自身が Playwright MCP で実際に操作し、測った値を報告に書く（`reviewer.md` の `tools` に 11 ツールを列挙済み。`browser_run_code_unsafe` は渡さない。定義を変えたらセッションを開き直す）
4. Approved なら次へ。Needs fixes なら修正ラウンド。指摘は Critical / Important を**全部そろえて 1 回**で implementer に `SendMessage` する（分割して送ると取りこぼし、layout-followups では 5 ラウンドまで伸びた）。再レビューは同じ reviewer に `SendMessage`（上記）。切り替え条件を毎回確認する
5. 全タスク完了後、ブランチ全体のレビューも reviewer（Opus）で行う
6. レビュー結果は最終レビューの後に 1 回、change の GitHub Issue にまとめてコメントする（単位ごとの判定 / 指摘数 / 切り替えの有無 / 後続に回した Minor）。タスクごとにはコメントしない（`.claude/rules/git.md`）
