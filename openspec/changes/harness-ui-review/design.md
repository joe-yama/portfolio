# Design

## Context

Change 2 での事実（2026-09-19〜20、Issue #3）:

- `.claude/agents/reviewer.md` の `tools:` に `mcp__playwright__browser_navigate` 等 11 個を列挙してコミット（`b45f763`）したが、その定義で起こした reviewer サブエージェントは `mcp__playwright__*` を持たなかった（`No such tool available`）。原因は未確定（agent 定義がセッション開始時に読まれる / MCP ツールをサブエージェントに渡せない / 書き方の問題）。最終レビューの指摘で revert（`9134f17`）
- reviewer は `~/Library/Caches/ms-playwright/chromium-*/chrome-headless-shell` を Bash から起動し、実 URL のスクリーンショットと `--log-net-log`、`dist` 複製の別ポート配信 + probe ページで computed style / DOM / クリック遷移を測定した。Tab の実キー入力だけは CDP が必要で代替（`a.focus()`）
- コントローラー（メインセッション）は Playwright MCP を持ち、`browser_run_code_unsafe` で `page.emulateMedia` によるダーク切り替えとスクリーンショットができた

動機は proposal.md。

## Goals / Non-Goals

**Goals:**

- 「UI の独立レビュー」を、次の change（Change 3 の写真ページ）で迷わず実行できる手順にする
- ルール（CLAUDE.md / review.md / testing.md）と agent 定義と README の記述を一致させる

**Non-Goals:**

- e2e（Playwright + axe）の CI 化（Change 5）
- reviewer の権限を広げること自体。必要最小限のツールに限る

## Decisions

### D1. まず事実を確定する（調査タスクを先頭に置く）

`claude-code-guide` サブエージェントまたは公式ドキュメント（サブエージェントの `tools` 設定、MCP サーバーとサブエージェント）で、MCP ツールをサブエージェントに渡す正しい方法と制約を確認する。試験は「reviewer 定義に 1 ツール（`mcp__playwright__browser_navigate`）だけ足し、`http://127.0.0.1:4321/ja/` を開いてタイトルを返す」だけの dispatch で行う。

### D2. 渡せる場合の方針

- `reviewer.md` の `tools` に列挙するのは navigate / snapshot / take_screenshot / resize / evaluate / click / press_key / console_messages / network_requests / close の 10 個。`browser_run_code_unsafe`（任意コード実行）は PO が明示的に許可した場合だけ足す。ダーク切り替えは `run_code_unsafe` 無しでは `page.emulateMedia` が使えないため、代替として CSS 変数を `browser_evaluate` で読む（`matchMedia` はエミュレートできないので、ダークの実表示はコントローラーが撮る）
- ルールの文言は現状維持

### D3. 渡せない場合の方針（PO が選ぶ）

| 案 | 内容 | 利点 | 欠点 |
|---|---|---|---|
| (a) headless Chromium の CLI 手順 | README に起動コマンド・net-log・probe ページの手順を書き、review.md を「実ブラウザで実操作（MCP または headless Chromium）」に | 依存追加なし。Change 2 で実績あり | 手順が長い。Tab の実キーは不可 |
| (b) `@playwright/test` を前倒し導入 | reviewer が Bash から `pnpm exec playwright` のスクリプトで検証 | 実キー入力・エミュレーションが全部できる。Change 5 でも使う | 依存追加（PO 承認）。ブラウザのダウンロードが要る |
| (c) コントローラーが実操作、reviewer は結果を検証 | コントローラーが MCP で計測値とスクリーンショットをファイルに残し、reviewer はそれを diff と突き合わせる | 追加なし | 「実装と別コンテキストが操作する」原則が弱まる（計測はコントローラー） |

推奨: (b)。Change 5 で e2e に使う依存を早めに入れるだけで、reviewer が本来の形で実操作できる。

### D4. README への制約の追記

`docs/harness/README.md` §3（環境の注意点）に Change 2 で判明した 3 点を足す: MCP ツールのサブエージェントへの受け渡し（D1 の結論）、`browser_run_code_unsafe` の相対パス保存先がメインリポジトリ root になること、worktree セッションの Bash ガードが拒否する複合コマンドの形（パイプ、for ループ、git を含む heredoc）。

## Risks / Trade-offs

- [D1 の試験で MCP が渡ると分かっても、ツール面（特に run_code_unsafe）を広げることになる] → 列挙は最小限、`run_code_unsafe` は PO 許可制
- [(b) を選ぶとブラウザのダウンロード（数百 MB）がサンドボックスのネットワーク許可に触れる] → 失敗したら出力を添えて PO に報告
- [ルールを緩めると UI レビューの質が下がる] → どの案でも「実ブラウザで計測した値を報告に書く」要件は残す

## Open Questions

1. D1 の結果が「渡せない」なら、D3 の (a) / (b) / (c) のどれにするか（PO）
2. `browser_run_code_unsafe` を reviewer に許可するか（PO）
