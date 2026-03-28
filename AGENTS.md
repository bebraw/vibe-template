> **Project:** `vibe-template` is a lightweight starter for AI-assisted experiments and small software projects. Keep setup reusable, easy to clone, and easy to prune.
>
> **Context Anchor:** ASDLC reference material is vendored in `.asdlc/SKILL.md`. Use it as the entry point for architecture, process, and methodology guidance.

## Toolchain Registry

| Intent         | Command                   | Notes                                            |
| -------------- | ------------------------- | ------------------------------------------------ |
| Local CI       | `pnpm run ci:local`       | Runs `.github/workflows/ci.yml` through Agent CI |
| Quiet local CI | `pnpm run ci:local:quiet` | Preferred agent-facing local CI command          |
| Workflow notes | `docs/development.md`     | Setup details and prerequisites                  |

## Judgment Boundaries

**NEVER**

- Invent tooling or project structure that is not present in the repo.
- Replace lightweight setup with heavyweight scaffolding without discussion.
- Delete or overwrite user-authored files without checking impact first.
- Commit secrets, tokens, or local env files such as `.dev.vars`.

**ASK**

- Before adding dependencies, CI, or generated boilerplate.
- Before making irreversible structural changes.

**ALWAYS**

- Consult `.asdlc/SKILL.md` before giving ASDLC-specific guidance.
- Prefer small, reviewable changes that preserve the template nature of the repo.
- Document reusable conventions instead of one-off preferences.
- Treat every lasting architectural decision as explicit documentation work, not implied context.
- Add or update an ADR in `docs/adrs/` in the same change set whenever a decision introduces or changes a lasting architectural constraint, selects between credible alternatives, or supersedes an earlier architecture decision.
- Record global architecture rules in `ARCHITECTURE.md` and feature-level contracts in `specs/{feature-domain}/spec.md`.
- Treat completed feature work as spec work: create a new `specs/{feature-domain}/spec.md` or update the relevant existing spec in the same change set whenever feature behavior, contracts, workflows, or quality guardrails change.
- Prefer the local Agent CI workflow before relying on remote CI.
- Treat a change as ready only after the quality gate and local CI both pass.
- Treat `package.json` as the source of truth for pinned Node and pnpm versions.
- Use `pnpm run quality:gate:fast` for quick local iteration, `pnpm run quality:gate` for the full baseline gate, and `pnpm run ci:local:quiet` for the local workflow check.
- Treat `pnpm run typecheck` as part of the baseline gate whenever TypeScript files or typed tooling config are involved.
- Treat high automated test coverage as part of done work for `src/` code. The baseline gate should fail when `src/` code exists without matching unit coverage.

## Frontend Design

- Use the project-local [`frontend-design`](./.codex/skills/frontend-design/SKILL.md) skill for substantial UI work such as page redesigns, component styling, app shells, and frontend experiments.
- Treat the skill as guidance for producing distinctive frontend work without compromising the template's lightweight and reusable nature unless the user explicitly asks for a more opinionated direction.

## Brainstorming

- Use the project-local [`brainstorming`](./.codex/skills/brainstorming/SKILL.md) skill when the user is exploring options, shaping a feature, or comparing approaches before implementation.
- Treat the skill as guidance for producing concrete, lightweight options that can turn cleanly into specs, ADRs, or code.

## Review

- Use the project-local [`review`](./.codex/skills/review/SKILL.md) skill when the user asks for review, risk analysis, or a merge-readiness pass.
- Treat the skill as guidance for prioritizing bugs, regressions, and quality-gate gaps over style commentary.

## Security

- Use the project-local [`security`](./.codex/skills/security/SKILL.md) skill when the user is working on auth, secrets, access control, sensitive data handling, or security hardening.
- Treat the skill as guidance for prioritizing concrete security risks and proportionate mitigations over generic checklists.
