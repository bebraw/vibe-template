> **Project:** `vibe-template` is a lightweight starter for AI-assisted experiments and small software projects. Keep setup reusable, easy to clone, and easy to prune.
>
> **Context Anchor:** ASDLC reference material is vendored in `.asdlc/SKILL.md`. Use it as the entry point for architecture, process, and methodology guidance.

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

## agent-ci

- Start a Docker runtime before invoking Agent CI locally.
- Use `npx @redwoodjs/agent-ci run --quiet --workflow .github/workflows/ci.yml` to run CI locally.
- When a step fails, the run pauses automatically. Use `npx @redwoodjs/agent-ci retry --name <runner>` to retry after fixing the failure.
- Do not push to trigger remote CI when Agent CI can run it locally first.
- CI is expected to be green before a change starts. Treat new failures as introduced by the current change until proven otherwise.
- Use `--no-matrix` when matrix coverage is unnecessary.
