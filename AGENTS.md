# portfolio

The PO's personal business-card site for recruiters: a career and photo portfolio in Japanese and English, with a minimal, photo-first design.

This repository is built with a harness in which a human **PO** steers and a coding agent executes. The rules below are tool-neutral; Claude Code specifics are in `CLAUDE.md`.

## Roles

| Role | Who | Does | Does not |
|---|---|---|---|
| PO | human | decides what to build, priorities, acceptance; answers design questions | write code, dictate implementation details |
| Agent | coding agent | proposes designs, implements, tests, reviews, writes docs | implement before design approval, add features outside the spec |

## How work flows

Every change goes: idea (1-4 sentences from the PO) → design approved by the PO → OpenSpec proposal (`openspec/changes/<name>/`) plus one GitHub Issue → implementation plan → test-first implementation by a subagent → adversarial review by a separate subagent → PR → PO acceptance → archive → `docs/status.md` updated. Small changes (docs, config or styles only, or at most 5 files without a new spec requirement) skip the design step but still get an Issue.

## Stop and ask only for

1. destructive or irreversible operations;
2. security (secrets, credentials, permissions);
3. side effects outside the working copy: pushing to `main`, publishing, releases, merging;
4. a plan defect where every way forward is a guess.

For anything else during implementation, decide by the spec, record `Ruling / Reason / Cost if wrong` in the ledger and the Issue, and continue. The PO can overturn it.

## Definition of done

Tests green (show the command and output), lint passes, `tasks.md` updated, everything committed — and the **CI result** is the final evidence, not local green.

## Commands

| Purpose | Command |
|---|---|
| Lint one file (hook) | `pnpm exec biome check --error-on-warnings --no-errors-on-unmatched <file>` |
| Test | `pnpm test` |
| Changes and specs | `openspec list`, `openspec list --specs` |

The first change that introduces the stack adds its lint, typecheck, test and build commands here, to `.claude/settings.json` (`HARNESS_LINT_CMD`, `HARNESS_TEST_CMD`) and to the CI job `check`. No dependencies or scaffolding before the design is approved.

## Language

Write commits, Issues, PRs, OpenSpec artifacts and status docs in Japanese. Commit messages start with a type prefix: `feat:` `fix:` `test:` `docs:` `chore:` `refactor:` `ci:`.

## Pitfalls

- `main` is PR-only with the required status check `check` (the CI job name). Renaming that job blocks every merge until the ruleset is updated.
- Before any `gh` write (issue, PR, release), confirm `gh api user --jq .login` prints `joe-yama`. If not, stop and ask the PO to switch accounts.
- Local green is not done: defects that only CI, real data or real processes show are common. Record them in `docs/harness/lessons.md`.
- A test written to guard a behavior must be shown to fail when that behavior is broken (mutation check) before it counts.

## Index

| When | Read |
|---|---|
| Where things stand, what is next, PO to-dos | `docs/status.md` |
| Past changes and rulings | `docs/changes.md` |
| Current specs / changes in progress | `openspec/specs/`, `openspec/changes/` |
| Tests or CI failed in an unexpected way | `docs/harness/lessons.md` |

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
