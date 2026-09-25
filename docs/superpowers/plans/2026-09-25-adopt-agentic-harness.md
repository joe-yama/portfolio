# portfolio のハーネスを agentic-harness に移す 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** portfolio の自前ハーネスを agentic-harness v0.2.0（プラグイン + Copier テンプレート）に置き換え、`claude plugin update` / `copier update` で追従できる状態にする。

**Architecture:** テンプレートを scratchpad に出力して worktree に上書きし、portfolio 固有の内容は各ファイルの**末尾に追記する 1 ブロック**として戻す（テンプレートの本文は書き換えない。次の `copier update` の 3-way マージで衝突を最小にするため）。旧 hook・agents・superpowers スキルのコピーは削除し、プラグインに任せる。保護パス（`.claude/settings.json`・`.claude/hooks/`・`settings.local.json`）は PO が配置スクリプトで置く。

**Tech Stack:** Copier 9.18.2（`uvx`）、check-jsonschema 0.38.2（`uvx`）、Claude Code 2.1.282、pnpm / Biome / Vitest / Playwright（既存）、GitHub Actions。

**Spec:** `docs/superpowers/specs/2026-09-25-adopt-agentic-harness-design.md`

## Global Constraints

- 作業場所: worktree `/Users/joe/repo/github-personal/joe-yama/portfolio/.claude/worktrees/fix+adopt-agentic-harness`、ブランチ `fix/adopt-agentic-harness`（upstream なし）。以下 `$WT`
- scratchpad: `/private/tmp/claude-501/-Users-joe-repo-github-personal-joe-yama-agentic-harness/50c1224f-80c0-4b83-b0f4-85418e68e98a/scratchpad`。以下 `$S`。テンプレート出力は `$S/render`、回答は `$S/answers.yml`
- 版: agentic-harness `v0.2.0`、Copier `9.18.2`、check-jsonschema `0.38.2`、SchemaStore commit `3b2dae966d5e93b94b83cf649d5e1ad583a19ddb`、`@playwright/mcp@0.0.82`
- Actions の SHA: actions/checkout `3d3c42e5aac5ba805825da76410c181273ba90b1`（v7.0.1）、pnpm/action-setup `ea17c68df8912ef543352723c149a84f56e3d413`（v6.1.0）、actions/setup-node `820762786026740c76f36085b0efc47a31fe5020`（v7.0.0）
- テンプレート由来のファイルは本文を書き換えず、portfolio 固有は末尾の `## Portfolio specifics` 節（日本語）に追記する。例外は §4.2 の settings.json と CI（テンプレートのリストに要素を足す。**既存行の整形は変えない**。`jq` で整形し直さない）
- context budget: `cat AGENTS.md CLAUDE.md .claude/rules/*.md | wc -c` が 16,000 以下
- コミット: 日本語、種別プレフィックス、末尾に `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` と `Claude-Session: https://claude.ai/code/session_019f2cxJkJ9LvbGGPDBC34M7`
- `gh` で書き込む前に `gh api user --jq .login` が `joe-yama`
- アプリのコード（`src/`、`scripts/`、`tests/` の `context-budget.test.ts` 以外）は触らない

## Review Focus

1. **テンプレート本文の書き換え** — 次の `copier update` で衝突する。`diff $S/render/<f> $WT/<f>` の差分が末尾の追記ブロック（と settings / CI の要素追加）だけであること
2. **削除したファイルへの参照が残る** — `git grep` で `hooks.md`、`rules/review.md`、`block-destructive`、`context-budget.test`、`main-ruleset`、`.claude/agents/`、`.claude/hooks/`、`ponytail-review/SKILL.md` が、記録（`docs/changes.md`、`docs/runs/`、`docs/superpowers/`、`openspec/changes/archive/`、`docs/HANDOFF.md`、`docs/harness/README.md` の実測節）以外に出ないこと
3. **hook が 1 つも効かない窓** — 旧 hook を消したコミットの時点でプラグインが未導入だと guard が無い。Task 5 の実機確認（`BLOCKED by harness guard (rm-rf)`）を PR 前に通すこと
4. **worktree に `node_modules` が無い** — lint-on-edit と test-on-stop が `pnpm exec biome` / `pnpm test` の失敗でブロックし続ける。Task 1 の最初に `pnpm install --frozen-lockfile`
5. **settings の整形崩れや不正 JSON** — 配置スクリプトは置く前に `check-jsonschema` と `diff` で render 版との差分が §4.2 の要素だけであることを示す

---

### Task 1: テンプレートの出力と portfolio 固有の追記

**Files:**
- Create: `AGENTS.md`、`.copier-answers.yml`、`.github/dependabot.yml`、`.github/pull_request_template.md`、`docs/harness/ruleset.json`
- Modify: `CLAUDE.md`、`.claude/rules/git.md`、`.claude/rules/scope.md`、`.claude/rules/security.md`、`.claude/rules/testing.md`、`.gitignore`、`openspec/config.yaml`、`.mcp.json`、`docs/status.md`
- Keep (上書きを戻す): `docs/changes.md`、`docs/harness/lessons.md`
- Delete: `docs/runs/main-ruleset.json`

**Interfaces:**
- Produces: `$S/render`（Task 3・4 が diff の基準に使う）、`$WT/.copier-answers.yml`

- [ ] **Step 1: 依存を入れる**

```bash
cd $WT && pnpm install --frozen-lockfile
```

- [ ] **Step 2: テンプレートを出力する**（`$S/answers.yml` は作成済み。無ければ下の内容で作る）

```yaml
project_name: portfolio
project_summary: "The PO's personal business-card site for recruiters: a career and photo portfolio in Japanese and English, with a minimal, photo-first design."
github_owner: joe-yama
default_branch: main
work_language: ja
lint_cmd: pnpm exec biome check --error-on-warnings --no-errors-on-unmatched
lint_pattern: ""
test_cmd: pnpm test
ui_review: true
```

```bash
cd $S && rm -r render; uvx copier@9.18.2 copy --vcs-ref v0.2.0 --defaults --data-file answers.yml gh:joe-yama/agentic-harness render
grep -q '^_commit: harness--v0.2.0$' render/.copier-answers.yml && echo ok
```

Expected: `ok`。`render/` に 18 ファイル。

- [ ] **Step 3: 保護パス以外を worktree に写す**（`.claude/settings.json` は Task 4 で PO が置く）

```bash
cd $S/render && for f in AGENTS.md CLAUDE.md .copier-answers.yml .gitignore .mcp.json openspec/config.yaml \
  .claude/rules/git.md .claude/rules/scope.md .claude/rules/security.md .claude/rules/testing.md \
  .github/dependabot.yml .github/pull_request_template.md docs/harness/ruleset.json; do
  mkdir -p "$WT/$(dirname "$f")"; cp "$f" "$WT/$f"; done
cd $WT && git rm -q docs/runs/main-ruleset.json && git status --short
```

`.mcp.json` は Write 可能か確かめる（分類器に拒否されたら Task 4 の配置スクリプトに移す）。`.github/workflows/ci.yml` は Task 2、`docs/status.md` `docs/changes.md` `docs/harness/lessons.md` は写さない。

- [ ] **Step 4: `AGENTS.md` の末尾に追記する**

```markdown

## Portfolio specifics（portfolio 固有）

PO 本人の名刺サイト。設計の正本は `docs/superpowers/specs/2026-09-17-portfolio-site-design.md`。

- スタック: Astro（TypeScript）+ GitHub Pages + GitHub Actions。パッケージマネージャは **pnpm**（`npm` / `npx` は使わない）。公開 URL は `https://joe-yama.github.io/portfolio/`（`main` への push で `.github/workflows/deploy.yml` が公開する）
- 写真ファイルはリポジトリに入れず GitHub Releases のタグ `photos` に置く（設計書 §5）
- `.claude/skills/` は全て `gh skill` 管理（PO 指示）。追加・更新は `gh skill install --pin <tag>` / `gh skill update` で行い、手コピーやツール独自の生成コマンドに任せない

| コマンド | 用途 |
|---|---|
| `pnpm test` / `lint` / `typecheck` / `build` | Vitest / Biome（修正は `pnpm format`）/ astro check / ビルド |
| `pnpm e2e` | Playwright。数十秒かかるので hook には入れず、CI と reviewer が回す |
| `gh skill list --agent claude-code --scope project` | 導入済みスキルの出所とピン留め |

| いつ | 読む |
|---|---|
| 経歴・特許・資格・写真の YAML を編集する | `docs/content-authoring.md` |
| 権限・プラグイン・このマシン固有の癖 | `docs/harness/README.md` |
| 未決事項 | `docs/HANDOFF.md` §6、`docs/harness/README.md` §5 |
```

- [ ] **Step 5: `CLAUDE.md` の末尾に追記する**

```markdown

## Portfolio specifics（portfolio 固有）

- このマシン固有の癖（sandbox は `settings.local.json` で無効、1Password 署名、`gh` の複数アカウント、worktree セッションの git ガード、Playwright MCP の保存先）は `docs/harness/README.md` §3
- UI レビューの preview は `pnpm build && pnpm preview`（`http://127.0.0.1:4321/`）。implementer に戻す前に `pnpm exec astro preview stop`（e2e がポートを使う）
```

- [ ] **Step 6: rules の末尾に追記する**（テンプレートに同趣旨があるものは足さない。足すのは次だけ）

`.claude/rules/git.md`:

```markdown

## Portfolio specifics（portfolio 固有）

- メッセージは日本語。署名は 1Password SSH をそのまま使う
- ハーネス（`.claude/`、`docs/harness/`、AGENTS.md、CLAUDE.md）とドキュメントだけの変更は、change と Issue を作らず `fix/<説明>` ブランチの PR で行う（PR #8 の前例）
```

`.claude/rules/security.md`:

```markdown

## Portfolio specifics（portfolio 固有）

- `.env.example` は `.env.*` の deny の例外だが、ユーザー設定側の deny が当たるので作成・更新は PO が行う
- `pnpm install` は `--frozen-lockfile` 付きだけが自動。lockfile を変える install（`pnpm add` を含む）は ask-gate が PO の確認に回す
```

`scope.md` と `testing.md` は追記なし（portfolio 版の内容はテンプレートに含まれる）。

- [ ] **Step 7: `.gitignore` の末尾に追記する**

```gitignore

# portfolio: dependencies / build / tooling
*.pem
*.key
secrets/
node_modules/
dist/
build/
coverage/
.venv/
__pycache__/
.astro/
*.log
npm-debug.log*
test-results/
playwright-report/
.worktrees/
```

- [ ] **Step 8: `docs/status.md` に「Harness versions」を足す**（portfolio 版を残し、末尾に追記。値は Task 5 で埋める）

```markdown

## Harness versions

`harness:adopt` が埋め、ハーネスを更新するたびに直す。

| Component | Version |
|---|---|
| agentic-harness | |
| Superpowers | |
| OpenSpec CLI / skills | |
| Claude Code | |
| adopt §8 の確認 | |
```

- [ ] **Step 9: 検証する**

```bash
cd $WT
for f in AGENTS.md CLAUDE.md .claude/rules/git.md .claude/rules/security.md .gitignore; do echo "== $f"; diff "$S/render/$f" "$f" | grep -v '^>' ; done   # 何も出ない = 追記だけ
for f in .claude/rules/scope.md .claude/rules/testing.md .mcp.json openspec/config.yaml .copier-answers.yml .github/dependabot.yml .github/pull_request_template.md docs/harness/ruleset.json; do cmp "$S/render/$f" "$f"; done
cat AGENTS.md CLAUDE.md .claude/rules/*.md | wc -c    # この時点では旧 review.md を含む。Task 3 の後に 16,000 以下を確かめる
pnpm lint
```

Expected: 1 つ目のループは `== <file>` と `1a…` / `NNaNN,MM` の行だけ（`<` と `c` / `d` が無い）。`cmp` は無出力。`pnpm lint` 緑。

- [ ] **Step 10: コミット**

```bash
git add -A && git commit -m "chore: agentic-harness v0.2.0 のテンプレートを出力し portfolio 固有を追記する"
```

### Task 2: CI をテンプレート版に揃える

**Files:**
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: `$S/render/.github/workflows/ci.yml`

- [ ] **Step 1: テンプレート版を写し、最終行のコメントを portfolio の手順に置き換える**

`$S/render/.github/workflows/ci.yml` を `$WT/.github/workflows/ci.yml` に写し、最後の行 `      # The first change adds the stack's setup, lint, typecheck, test and build steps here.` の**後ろに**次を足す（コメント行はテンプレートの本文なので残す）:

```yaml
      - uses: pnpm/action-setup@ea17c68df8912ef543352723c149a84f56e3d413 # v6.1.0 (reads packageManager in package.json)
      - uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0
        with:
          node-version-file: .node-version
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm build
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm e2e
```

- [ ] **Step 2: 検証する**

```bash
cd $WT
diff "$S/render/.github/workflows/ci.yml" .github/workflows/ci.yml | grep -v '^>'   # 追記だけ
uvx check-jsonschema@0.38.2 --builtin-schema vendor.github-workflows .github/workflows/ci.yml
grep -n 'check:' .github/workflows/ci.yml    # job 名 check が残っている
```

Expected: `ok -- validation done`、`check:` が 1 行。

- [ ] **Step 3: コミット**

```bash
git add .github/workflows/ci.yml && git commit -m "ci: CI をテンプレート版に揃え、Actions を SHA で固定する"
```

### Task 3: 旧ハーネスの部品を削除し、参照を直す

**Files:**
- Delete: `.claude/agents/implementer.md`、`.claude/agents/reviewer.md`、`.claude/rules/review.md`、`.claude/skills/{brainstorming,dispatching-parallel-agents,executing-plans,finishing-a-development-branch,requesting-code-review,subagent-driven-development,systematic-debugging,test-driven-development,using-git-worktrees,using-superpowers,verification-before-completion,writing-plans}/`、`docs/harness/hooks.md`、`tests/unit/context-budget.test.ts`
- Modify: `docs/harness/README.md`（§1・§2 の冒頭・§3 の該当行・§4）、`docs/status.md:9`

- [ ] **Step 1: 削除する**

```bash
cd $WT && git rm -rq .claude/agents .claude/rules/review.md docs/harness/hooks.md tests/unit/context-budget.test.ts \
  .claude/skills/{brainstorming,dispatching-parallel-agents,executing-plans,finishing-a-development-branch,requesting-code-review,subagent-driven-development,systematic-debugging,test-driven-development,using-git-worktrees,using-superpowers,verification-before-completion,writing-plans}
ls .claude/skills    # openspec-* 6 個と ponytail、ponytail-review だけ
```

（`.claude/skills/` の削除が分類器に拒否されたら Task 4 の配置スクリプトに移す。）

- [ ] **Step 2: `docs/harness/README.md` §1 の表を書き換える**

先頭に 1 行 `2026-09-25 から、ハーネスは配布版 agentic-harness に移した（ブランチ fix/adopt-agentic-harness、設計 docs/superpowers/specs/2026-09-25-adopt-agentic-harness-design.md）。§2 と §6 以降は移行前の実測記録。` を足し、§1 の表のうち次の行を置き換える（Superpowers・OpenSpec・Chromium の行は残し、Playwright MCP の行はバージョンを `0.0.82` 固定に直す）:

```markdown
| 配布版ハーネス | agentic-harness | v0.2.0（`.copier-answers.yml` と `.claude/settings.json` の `extraKnownMarketplaces` で固定） | Copier テンプレート（AGENTS.md・CLAUDE.md・`.claude/rules/`・settings・CI・Dependabot・PR テンプレート）+ プロジェクトスコープのプラグイン `harness@agentic-harness`。更新は `harness:adopt`「Updating」 |
| 運用ルール | AGENTS.md + CLAUDE.md + `.claude/rules/` | — | テンプレート本文（英語）+ 末尾の「Portfolio specifics」（日本語）。rules は 4 ファイル（git / scope / security / testing）。レビューの手順は `harness:review-loop` |
| 強制 | Hooks | — | プラグインの `guard` / `ask-gate` / `lint-on-edit` / `test-on-stop`。`HARNESS_LINT_CMD` / `HARNESS_TEST_CMD` を `.claude/settings.json` の `env` から読む。挙動は agentic-harness の README |
| 強制 | コンテキスト予算の番人 | — | CI の job `check` の手順。`AGENTS.md` + `CLAUDE.md` + `.claude/rules/*.md` の合計を **16,000 B** に制限する（2026-09-22〜09-25 は `tests/unit/context-budget.test.ts` で 20,000 B） |
| 役割別サブエージェント | `harness:implementer`、`harness:reviewer`（どちらも Opus） | — | プラグインが提供。dispatch は `model: "opus"` を明示する |
```

§1「スキルの更新ルール」の段落には `superpowers のスキルはプロジェクトに置かず、プラグインの依存 superpowers@claude-plugins-official から使う。` を 1 行足す。

- [ ] **Step 3: §3・§4 の旧 hook 前提の記述を直す**

- §3「サブエージェントへの MCP ツールの受け渡し」の `.claude/agents/reviewer.md` の `tools:` を正とする → `harness:reviewer`（プラグインの `agents/reviewer.md`）の `tools:` を正とする。`.mcp.json` は `@playwright/mcp@latest` を指している → `@playwright/mcp@0.0.82` に固定している
- §3「`.claude/` 配下の書き分け」: `.claude/agents/` を外し、`.claude/settings.json` と `.claude/hooks/` → `.claude/settings.json`
- §4 の表: `hook で ask（.claude/hooks/ask-gate.sh）` → `hook で ask（プラグインの ask-gate）` とし、内容に lockfile を変える install（pnpm / npm / yarn / bun / uv / pip / cargo）を足す。allow と ask の行を Task 4 の settings.json（`gh api user --jq .login`、`git fetch`、`gh pr view|checks`、`gh run list|view|watch`、ask の `gh repo delete` と `gh workflow run`、`pnpm add` を外す）に合わせる。deny の行に `~/.config/gh` と `.env.example` の例外を足す。env の行を `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: "0"`、`HARNESS_*`、`MCP_TIMEOUT` に直す。sandbox の行の `excludedCommands: git, gh` → `git`, `git *`, `gh`, `gh *`、`filesystem.denyRead` を足す
- §4 の注意の最初の項目（`.env.example` の deny）はプロジェクト側では例外が入ったこと、ユーザー設定側は変わらないことに直す

- [ ] **Step 4: `docs/status.md:9` を直す**

`（PO 指示、PR #44。`.claude/rules/review.md`）` → `（PO 指示、PR #44。2026-09-25 からは harness:implementer / harness:reviewer）`

- [ ] **Step 5: 検証する**

```bash
cd $WT
git grep -n -E 'hooks\.md|rules/review\.md|block-destructive|context-budget\.test|main-ruleset|\.claude/agents|\.claude/hooks|ponytail-review/SKILL' -- \
  ':!openspec/changes/archive' ':!docs/superpowers' ':!docs/runs' ':!docs/HANDOFF.md' ':!docs/changes.md' ':!.claude/settings.json' ':!.claude/hooks'
cat AGENTS.md CLAUDE.md .claude/rules/*.md | wc -c
pnpm lint && pnpm typecheck && pnpm test
```

Expected: `git grep` の出力は `docs/harness/README.md` の §2・§4「bypass」・§6 の実測記録の行だけ（それぞれ移行前の記録と読める）。バイト数は 16,000 以下。3 コマンド緑。

- [ ] **Step 6: コミット**

```bash
git add -A && git commit -m "chore: プラグインに移した旧 agents・review ルール・superpowers スキル・hook の説明を削除する"
```

### Task 4: 保護パスの配置（PO が実行）

**Files:**
- Modify: `.claude/settings.json`（`$S/settings.json` を置く）、`.claude/settings.local.json`（git 管理外）
- Delete: `.claude/hooks/`
- Create: `$S/apply.sh`

**Interfaces:**
- Consumes: `$S/render/.claude/settings.json`

- [ ] **Step 1: `$S/settings.json` を作る**

`$S/render/.claude/settings.json` を `$S/settings.json` に複製し（計画作成時の `jq` 整形の下書きがあれば上書きする）、**テキストのまま**（整形を変えずに）次を足す:
- `env` の 1 行 JSON の末尾に `, "MCP_TIMEOUT": "120000"`
- `allow`: `"Bash(git worktree list:*)",` の後に `"Bash(git worktree remove:*)",`。`"Bash(openspec:*)"` の前に `pnpm test|lint|typecheck|build|preview|e2e`、`pnpm run` の同 6 つ、`pnpm exec biome`、`pnpm exec playwright test`、`pnpm install --frozen-lockfile`、`gh release view`、`gh release list`（いずれも `Bash(<cmd>:*)` の形、1 行 1 要素）
- `ask`: `"Bash(gh release:*)",` を `"Bash(gh release create:*)",` `"Bash(gh release upload:*)",` `"Bash(gh release delete-asset:*)",` の 3 行に置き換え、末尾に `"Bash(pnpm publish:*)"`
- `allowedDomains`: 末尾に `"raw.githubusercontent.com",` `"fonts.googleapis.com",` `"fonts.gstatic.com"`

- [ ] **Step 2: `$S/apply.sh` を作る**

```bash
#!/usr/bin/env bash
# PO が `! bash <scratchpad>/apply.sh` で実行する。保護パスを置き換え、検証結果を出す。
set -euo pipefail
S=/private/tmp/claude-501/-Users-joe-repo-github-personal-joe-yama-agentic-harness/50c1224f-80c0-4b83-b0f4-85418e68e98a/scratchpad
WT=/Users/joe/repo/github-personal/joe-yama/portfolio/.claude/worktrees/fix+adopt-agentic-harness
MAIN=/Users/joe/repo/github-personal/joe-yama/portfolio
SCHEMA=https://raw.githubusercontent.com/SchemaStore/schemastore/3b2dae966d5e93b94b83cf649d5e1ad583a19ddb/src/schemas/json/claude-code-settings.json

uvx check-jsonschema@0.38.2 --schemafile "$SCHEMA" "$S/settings.json"
echo "== render との差分（追加だけのはず）"; diff "$S/render/.claude/settings.json" "$S/settings.json" || true

cp "$S/settings.json" "$WT/.claude/settings.json"
git -C "$WT" rm -rq .claude/hooks

# skillOverrides から superpowers 由来の 12 件を外す（OpenSpec の 6 件は残す）。
f="$MAIN/.claude/settings.local.json"
cp "$f" "$f.bak-adopt-harness"
jq '.skillOverrides |= with_entries(select(.key | startswith("openspec-")))' "$f.bak-adopt-harness" > "$f"
echo "== $f"; jq -c .skillOverrides "$f"
# settings.local.json は git 管理外で worktree には無い。無いと Task 5 の worktree セッションで
# sandbox が有効になり、1Password 署名の commit などが変わるので、main の分を写す。
cp "$f" "$WT/.claude/settings.local.json"
git -C "$WT" status --short
```

- [ ] **Step 3: PO に依頼して実行してもらう**

PO へのメッセージ: 「`! bash $S/apply.sh` を実行してください（`.claude/settings.json` の配置、`.claude/hooks/` の削除、`settings.local.json` の superpowers の skillOverrides 除去。バックアップは `*.bak-adopt-harness`）」。

Expected: `ok -- validation done`、diff は `>` の行と `env` の 1 行の `<`/`>` だけ、skillOverrides は `openspec-*` 6 件、status（`settings.local.json` は gitignore なので出ない） に `M .claude/settings.json` と `D .claude/hooks/*.sh` 4 件。

- [ ] **Step 4: コミット**（settings の切り替えと hook の削除を同じコミットに）

```bash
cd $WT && git add .claude/settings.json && git commit -m "chore: hook をプラグインに切り替え、settings をテンプレート版に揃える"
git show --stat HEAD | grep -E 'settings.json|hooks/'   # settings.json と hooks 4 本が同じコミット
```

### Task 5: ローカル確認とプラグインの実機確認

**Files:**
- Modify: `docs/status.md`（「Harness versions」）

- [ ] **Step 1: 全コマンドを流す**

```bash
cd $WT && pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm e2e
cat AGENTS.md CLAUDE.md .claude/rules/*.md | wc -c
```

Expected: すべて緑、バイト数 16,000 以下。

- [ ] **Step 2: PO にプラグインの導入を依頼する**（PO が別ターミナルで実行）

```sh
cd /Users/joe/repo/github-personal/joe-yama/portfolio/.claude/worktrees/fix+adopt-agentic-harness
claude                     # trust を承認 → marketplace agentic-harness が v0.2.0 で登録される。/exit
claude plugin install harness@agentic-harness --scope project
claude                     # 新しいセッションで下の確認
```

新しいセッションでの確認（PO が Claude に頼むか自分で打つ）:
- `rm -rf ./harness-guard-probe` → `BLOCKED by harness guard (rm-rf)`
- `git push origin main` → `harness ask-gate (protected-push)` の確認。**拒否する**
- `/plugin` に `harness` と `superpowers` が有効
- `/agents` に `harness:implementer` と `harness:reviewer`
- `gh skill list --agent claude-code --scope project` に OpenSpec 6 個（`v1.13.1`）と ponytail 2 個

`claude plugin marketplace add` は実行しない（固定されていない既定ブランチが同じ名前で登録される）。

- [ ] **Step 3: 版と結果を記録する**

`docs/status.md` の「Harness versions」表を埋める: agentic-harness `v0.2.0`、Superpowers（`/plugin` に出た版）、OpenSpec CLI `1.13.1` / skills `v1.13.1`、Claude Code（`claude --version`）、adopt §8 の確認（日付と 5 項目の結果）。

- [ ] **Step 4: コミット**

```bash
git add docs/status.md && git commit -m "docs: ハーネスの版と導入確認の結果を status に記録する"
```

### Task 6: ブランチ全体のレビュー、PR、マージ後の確認

- [ ] **Step 1: review package を作り、reviewer を起こす**

```bash
cd $WT && { git log --oneline origin/main..HEAD; git diff --stat origin/main..HEAD; git diff origin/main..HEAD -- . ':!.claude/skills'; } > $S/review-package.diff
```

reviewer（`model: "opus"`）に渡すもの: spec、この計画、`$S/review-package.diff`、`$S/render`（テンプレートの出力。Review Focus 1 の基準）、Review Focus の 5 項目。UI の変更は無いので preview は起動しない。Critical / Important は全部そろえて 1 回で修正に回す。Minor は PR 本文に残す。

- [ ] **Step 2: push して PR を作る**

```bash
gh api user --jq .login      # joe-yama
git push -u origin fix/adopt-agentic-harness
gh pr create --base main --title "fix: ハーネスを agentic-harness v0.2.0 に移す" --body-file $S/pr-body.md
```

`$S/pr-body.md` はテンプレートの `.github/pull_request_template.md` の形（Closes 行は Issue が無いので削る）で、変更の要約、spec §4.4 の挙動の変わり目 4 点、Task 5 の確認結果、レビュー判定を書く。

- [ ] **Step 3: CI を待つ**

```bash
gh pr checks --watch
```

Expected: `check` が pass。PO がマージする。

- [ ] **Step 4: マージ後の確認（main の新しいセッション）**

main のチェックアウトで `git pull` 後に新しい対話セッションを開き、Task 5 Step 2 の 5 項目と `gh api repos/joe-yama/portfolio/rulesets --jq '.[].name'`（`main` が出る）を確かめる。memory `reference-agentic-harness.md` の「PO 未決」を「2026-09-25 に移行（PR #<番号>）」に更新する。worktree は PO の確認後に `git worktree remove` で片付ける。
