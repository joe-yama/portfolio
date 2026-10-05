# Models and effort

Which model and effort each role uses. This is the only place that names them: `CLAUDE.md`, `AGENTS.md`, `.claude/rules/` and the skills refer here instead of writing a model name.

| Role | Model | Effort | Why |
|---|---|---|---|
| Decision: the design session, including writing `design.md` and `tasks.md` as the plan | Opus | high | A wrong decision costs every later step. The session that decides also breaks the work into tasks, so the split is written once. |
| Final review of the whole branch | Opus | high | It catches what the batched reviews missed, and it is the last check before the PR. |
| Implementation | Opus | medium | PO 指示（2026-09-23）: すべてのタスクで implementer は Opus。effort は frontmatter の medium のまま。 |
| Intermediate review | Opus | high | PO 指示（2026-09-17）: reviewer は Opus で、敵対的に（報告を信用せず diff で裏を取る）かつ過剰設計の観点（ponytail-review）でも見る。 |

No role uses Haiku.

## How the model and effort are set

- The `model` of an Agent call is set per role on every dispatch. An omitted `model` inherits the session's, so always pass it.
- Effort is not an Agent parameter. It comes from the session or from the agent's frontmatter. The `harness:implementer` frontmatter is `sonnet` / `medium`. The `harness:reviewer` frontmatter is `opus` / `high`. In this repository every dispatch of `harness:implementer` and `harness:reviewer` passes `model: "opus"`.
