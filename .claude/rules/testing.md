# テストのルール

- テストなしのコミットは禁止。実装コードの変更には対応するテストの追加・更新を必ず含める。
- RED → GREEN → REFACTOR の順を守る。先に失敗するテストを書き、失敗を確認してから実装する。
- テストが失敗した状態で「完了」と報告しない。テスト結果は実行コマンドと出力を添えて示す。
- テストの削除・skip・期待値の書き換えでテストを通すことは禁止。仕様が変わった場合は OpenSpec の spec を先に更新する。
- レビュー/QA は実装したコンテキストと別のサブエージェントが行う。UI は reviewer 自身が Playwright MCP で実際に操作して確認する（HTTP の URL。`file:` は不可。詳細は `.claude/rules/review.md`）。

## テストコマンド

| 目的 | コマンド |
|---|---|
| 単体テスト（Vitest） | `pnpm test` |
| lint と整形の検査（Biome） | `pnpm lint`（修正は `pnpm format`） |
| 型チェック（astro check） | `pnpm typecheck` |
| ビルド | `pnpm build` |
| e2e（Playwright。Change 5 で追加） | `pnpm e2e` |

hooks: 編集ごとに `pnpm exec biome check --error-on-warnings --no-errors-on-unmatched <file>`、ターン終了時に `pnpm test`（`.claude/hooks/`）。e2e は数十秒かかるので hooks に入れず、CI とレビュー用サブエージェントが実行する。
