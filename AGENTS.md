> **Project:** `vibe-template` is a lightweight starter for AI-assisted experiments and small software projects. Keep setup reusable, easy to clone, and easy to prune.
>
> **Context Anchor:** ASDLC reference material is vendored in `.asdlc/SKILL.md`. Use it as the entry point for architecture, process, and methodology guidance.

## Toolchain Registry

| Intent         | Command                  | Notes                                            |
| -------------- | ------------------------ | ------------------------------------------------ |
| Local CI       | `npm run ci:local`       | Runs `.github/workflows/ci.yml` through Agent CI |
| Quiet local CI | `npm run ci:local:quiet` | Preferred agent-facing local CI command          |
| Workflow notes | `docs/development.md`    | Setup details and prerequisites                  |

## Judgment Boundaries

**NEVER**

- Invent tooling or project structure that is not present in the repo.
- Replace lightweight setup with heavyweight scaffolding without discussion.
- Delete or overwrite user-authored files without checking impact first.

**ASK**

- Before adding dependencies, CI, or generated boilerplate.
- Before making irreversible structural changes.

**ALWAYS**

- Consult `.asdlc/SKILL.md` before giving ASDLC-specific guidance.
- Prefer small, reviewable changes that preserve the template nature of the repo.
- Document reusable conventions instead of one-off preferences.
- Record significant architectural decisions in `docs/adrs/` using the local ADR convention.
- Prefer the local Agent CI workflow before relying on remote CI.
- Treat a change as ready only after the quality gate and local CI both pass.
- Use `npm run quality:gate` for the baseline formatting and test gate, and `npm run ci:local:quiet` for the local workflow check.
- Treat `npm run typecheck` as part of the baseline gate whenever TypeScript files or typed tooling config are involved.

## Frontend Design

- Use the project-local [`frontend-design`](./.codex/skills/frontend-design/SKILL.md) skill for substantial UI work such as page redesigns, component styling, app shells, and frontend experiments.
- Treat the skill as guidance for producing distinctive frontend work without compromising the template's lightweight and reusable nature unless the user explicitly asks for a more opinionated direction.
