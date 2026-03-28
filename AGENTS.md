> **Project:** `vibe-template` is a lightweight starter for AI-assisted experiments and small software projects. Keep setup reusable, easy to clone, and easy to prune.
>
> **Context Anchor:** ASDLC reference material is vendored in `.asdlc/SKILL.md`. Use it as the entry point for architecture, process, and methodology guidance.

## Toolchain Registry

| Intent | Command | Notes |
|---|---|---|
| Local CI | `npm run ci:local` | Runs `.github/workflows/ci.yml` through Agent CI |
| Quiet local CI | `npm run ci:local:quiet` | Preferred agent-facing local CI command |
| Workflow notes | `docs/development.md` | Setup details and prerequisites |

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
- Prefer the local Agent CI workflow before relying on remote CI.
