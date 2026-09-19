# harness-ui-review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** reviewer サブエージェントが自分で Playwright MCP を使って UI を実操作できる状態にし、CLAUDE.md / rules / agent 定義 / harness README の記述をその実態に一致させる。

**Architecture:** アプリケーションコードは 1 行も変えない。`.claude/agents/reviewer.md` の frontmatter に PO が承認した 11 個の MCP ツールを列挙し、UI 検証について書いている 4 か所（CLAUDE.md、`.claude/rules/review.md`、`.claude/rules/testing.md`、`reviewer.md` 本文）の文言を「reviewer 自身が Playwright MCP で HTTP の URL を実操作する」に揃える。あわせて Change 2 と本 change の実測で判明した環境の制約を `docs/harness/README.md` §3 に記録する。

**Tech Stack:** Markdown のみ。Claude Code 2.1.278 の subagent 定義（frontmatter `tools:`）、Playwright MCP（@playwright/mcp、`.mcp.json` のプロジェクトスコープ）。

**Spec:** `openspec/changes/harness-ui-review/proposal.md` / `design.md` / `tasks.md`（`skip_specs: true`）。決定の経緯は GitHub Issue #6 のコメント。

## Global Constraints

- `.claude/` 配下（`reviewer.md` を含む）は **Write / Edit ツール**で編集する。サンドボックス内の Bash からは書き込めない
- サイトのコード（`src/`、`astro.config.*`、`package.json`）を変更しない。依存を追加しない（`@playwright/test` の前倒しは不採用）
- `browser_run_code_unsafe` を reviewer に渡さない（PO 決定 2026-09-20）。ワイルドカード `mcp__playwright__*` も使わない
- `git commit` はサンドボックス外で実行する（1Password 署名）。日本語メッセージ、先頭に `docs:` / `chore:`
- worktree セッションでは Bash のガードが複合コマンドを拒否するので、git は 1 コマンドずつ実行する
- テストコードの変更は無い（ドキュメントと agent 定義のみ）。ただし `pnpm lint` / `pnpm typecheck` / `pnpm test` / `pnpm build` が変更前と同じく 0 / 47 passed / 4 pages であることを最後に示す

---

### Task 1: reviewer に Playwright MCP を渡し、UI 検証の文言を 4 か所で揃える

**Files:**
- Modify: `.claude/agents/reviewer.md`（frontmatter `tools:` 行、本文「UI を含むタスクでは…」の段落）
- Modify: `CLAUDE.md`（「標準ワークフロー」5 の行、「環境の注意点（このマシン固有）」に 1 行追加）
- Modify: `.claude/rules/review.md`（「レビューの手順」3 の行）
- Modify: `.claude/rules/testing.md`（冒頭の箇条書き最終行）
- Test: なし（自動テストの対象外）。検証は grep による文言の一致確認と、コントローラーによる新セッションでの実 dispatch

**Interfaces:**
- Produces: `reviewer.md` の `tools:` に列挙された 11 個の MCP ツール名。Task 2 の README 追記はこの決定を参照する

- [ ] **Step 1: `reviewer.md` の `tools:` を 11 個の列挙に置き換える**

`.claude/agents/reviewer.md` の 5 行目を、以下の 1 行に置き換える（YAML のカンマ区切り 1 行。改行して書かない）:

```yaml
tools: Read, Glob, Grep, Bash, mcp__playwright__browser_navigate, mcp__playwright__browser_snapshot, mcp__playwright__browser_take_screenshot, mcp__playwright__browser_resize, mcp__playwright__browser_evaluate, mcp__playwright__browser_click, mcp__playwright__browser_press_key, mcp__playwright__browser_console_messages, mcp__playwright__browser_network_requests, mcp__playwright__browser_emulate_media, mcp__playwright__browser_close
```

`browser_run_code_unsafe`、`browser_file_upload`、`browser_drag`、`browser_drop`、`browser_tabs`、`browser_handle_dialog`、`browser_fill_form`、`browser_select_option`、`browser_type`、`browser_hover`、`browser_find`、`browser_wait_for`、`browser_navigate_back`、`browser_network_request` は入れない。

- [ ] **Step 2: `reviewer.md` 本文の UI 検証の段落を置き換える**

現在の 23 行目（「UI を含むタスクでは、コントローラーが指定した HTTP の URL に対して Playwright MCP で実際に操作して確認する（`file:` URL は使えない）。」）を、次の段落に置き換える:

```markdown
UI を含むタスクでは、コントローラーが指定した HTTP の URL（`pnpm build && pnpm preview` の `http://127.0.0.1:4321/...`）に対して、**あなた自身が** Playwright MCP で実際に操作して確認する（`file:` URL は使えない）。実装者のスクリーンショットや報告値を検証の代わりにしない。

使えるツールは `browser_navigate` / `browser_snapshot` / `browser_take_screenshot` / `browser_resize` / `browser_evaluate` / `browser_click` / `browser_press_key` / `browser_console_messages` / `browser_network_requests` / `browser_emulate_media` / `browser_close` の 11 個。ダーク / ライトの切り替えは `browser_emulate_media`（`colorScheme`）で行う。`browser_run_code_unsafe` は渡していないので使えない（PO 判断 2026-09-20）。スクリーンショットを保存するときは絶対パスで指定する（相対パスは worktree ではなくメインリポジトリ root に落ちる）。

報告には、操作して**実際に測った値**（DOM の個数、computed style、遷移後の URL、コンソールエラー、ネットワークの外部ドメイン有無など）を書く。
```

- [ ] **Step 3: `CLAUDE.md`「標準ワークフロー」5 を置き換える**

現在の 24 行目を次の 1 行に置き換える:

```markdown
5. 独立レビュー: `reviewer`（Opus）サブエージェントが「仕様準拠 → コード品質 → ponytail」の順で敵対的にレビュー。UI は reviewer 自身が Playwright MCP で HTTP の URL を実操作して検証する（`reviewer.md` の `tools` に必要な 11 ツールを列挙済み。`browser_run_code_unsafe` は渡さない）。結果を Issue に記録する。詳細は `.claude/rules/review.md`
```

- [ ] **Step 4: `CLAUDE.md`「環境の注意点（このマシン固有）」に 1 行足す**

「- Playwright MCP は `file:` URL を拒否する。UI 検証は HTTP で配信する（例: `python3 -m http.server`）」の直後に、次の 1 行を挿入する:

```markdown
- `.claude/agents/*.md` の変更は実行中のセッションに反映されない（セッション開始時の定義が使われる）。`tools` を変えたらセッションを開き直してから dispatch する。worktree で編集した場合も同じ（2026-09-20 実測）
```

- [ ] **Step 5: `.claude/rules/review.md`「レビューの手順」3 を置き換える**

現在の 35 行目を次の 1 行に置き換える:

```markdown
3. reviewer は「仕様準拠 → コード品質 → ponytail」の順で報告する。UI があるタスクでは、コントローラーが渡した HTTP の URL に対して reviewer 自身が Playwright MCP で実際に操作し、測った値を報告に書く（`reviewer.md` の `tools` に 11 ツールを列挙済み。`browser_run_code_unsafe` は渡さない。定義を変えたらセッションを開き直す）
```

- [ ] **Step 6: `.claude/rules/testing.md` の UI 検証の行を置き換える**

現在の 7 行目を次の 1 行に置き換える:

```markdown
- レビュー/QA は実装したコンテキストと別のサブエージェントが行う。UI は reviewer 自身が Playwright MCP で実際に操作して確認する（HTTP の URL。`file:` は不可。詳細は `.claude/rules/review.md`）。
```

- [ ] **Step 7: 4 ファイルの文言が揃っていることを grep で確認する**

Run:

```bash
grep -rn "Playwright MCP" CLAUDE.md .claude/rules/review.md .claude/rules/testing.md .claude/agents/reviewer.md
```

Expected: 4 ファイルすべてがヒットし、どの行も「reviewer 自身が Playwright MCP で実操作する」という趣旨で書かれている（「コントローラーが撮る」「headless Chromium で代替する」等の記述が残っていない）。加えて次が 0 件であること:

```bash
grep -rn "run_code_unsafe" .claude/agents/reviewer.md | grep -v "渡していない\|渡さない"
```

- [ ] **Step 8: コミット**

`.claude/` 配下を含むのでサンドボックス外で実行する。git は 1 コマンドずつ:

```bash
git add .claude/agents/reviewer.md CLAUDE.md .claude/rules/review.md .claude/rules/testing.md
```

```bash
git commit -m "chore: reviewer に Playwright MCP の 11 ツールを渡し、UI 検証の文言を CLAUDE.md / rules / agent 定義で揃える"
```

---

### Task 2: harness README に実測で判明した制約を記録する

**Files:**
- Modify: `docs/harness/README.md`（§3「セットアップ中に判明した環境固有の注意点」に 3 項目追記）
- Test: なし。検証は記述と実測結果（Issue #6 のコメント）の一致

**Interfaces:**
- Consumes: Task 1 で決めた `reviewer.md` の `tools` の内容

- [ ] **Step 1: §3 の末尾（「gh の複数アカウント」の行の後）に 3 項目を追記する**

```markdown
- **サブエージェントへの MCP ツールの受け渡し**（2026-09-20、change `harness-ui-review` で実測）: `.claude/agents/*.md` の `tools:` に `mcp__<server>__<tool>` を列挙すれば MCP ツールはサブエージェントに渡る。ただし **agent 定義の変更は実行中のセッションには反映されない**。同一セッションで編集して dispatch すると、セッション開始時の定義で起動し `No such tool available: mcp__playwright__browser_navigate` になる（Change 2 の失敗の原因はこれ）。定義を変えたらセッションを開き直す。検証は 3 回の dispatch で行った: 同一セッション ❌ 2 回 / 新しいセッション（`claude -p`）✅ 1 回（`http://127.0.0.1:4321/ja/` のタイトル `joe-yama` を取得）。`tools:` を省略すると MCP 込みで全継承になるが、reviewer には必要な 11 個だけを列挙する方針（`browser_run_code_unsafe` を渡さない。PO 判断）。なおセッション自体で無効なツール（例: `claude -p` セッションの `Glob` / `Grep`）は `tools:` に書いても渡らない
- **Playwright MCP の保存先**: `browser_run_code_unsafe` や `browser_take_screenshot` で相対パスを指定すると、worktree で作業していてもファイルは**メインリポジトリの root** に落ちる。保存先は絶対パスで指定する
- **worktree セッションの Bash ガード**: worktree に入ったセッションでは複合コマンドが拒否される。`printf ... | bash script`、`for ... do ...; done`、`sed ... && git ...` のように git と他コマンドを `&&` でつないだもの、git という語を含む heredoc などが該当する。1 コマンドずつ実行し、合成入力が必要なときは `/tmp` にファイルを置いて `bash script < file` の形にする
```

- [ ] **Step 2: 追記が §3 の中に入っていることを確認する**

Run:

```bash
sed -n '/^## 3\./,/^## 4\./p' docs/harness/README.md
```

Expected: 追記した 3 項目が §3 の箇条書きの末尾にあり、§4 の見出しより前で終わっている。

- [ ] **Step 3: コミット**

```bash
git add docs/harness/README.md
```

```bash
git commit -m "docs: harness README §3 に MCP の受け渡し・保存先・worktree の Bash ガードの制約を追記"
```

---

## コントローラーが行う検証（implementer には任せない）

Task 1 の完了後、**新しいセッション**から reviewer を起こして 11 ツールが渡ることを実測する（tasks.md 3.1 の後半）。同一セッションでは定義変更が反映されないため、`claude -p` を worktree で実行する:

```bash
claude -p "Agent ツールで subagent_type: reviewer, model: opus を 1 つ起こし、『http://127.0.0.1:4321/ja/ を Playwright MCP で開き、ヘッダーの 4 リンクの href を返す。browser_emulate_media で colorScheme: dark にして body の背景色も返す』と依頼してください。結果だけを報告してください。"
```

Expected: reviewer が MCP で実操作し、ヘッダー 4 リンクの href（`/ja/`、`/ja/photos/` 等）とダーク時の背景色（`rgb(12, 12, 12)`）を返す。`No such tool available` が出ないこと。

事前に worktree で `pnpm build` と `pnpm preview` を起動しておく（`astro preview stop` で停止）。
