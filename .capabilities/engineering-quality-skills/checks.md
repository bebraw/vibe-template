# Checks

Run these after applying the engineering quality skills kit to a target repo.

## Required

```bash
test -f .codex/skills/correctness-review/SKILL.md
test -f .codex/skills/test-review/SKILL.md
test -f .codex/skills/debug/SKILL.md
test -f .codex/skills/correctness-review/LICENSE
test -f .codex/skills/test-review/LICENSE
test -f .codex/skills/debug/LICENSE
```

Run the target repo's normal formatting or documentation checks after registering the skills.

## Sanity Checks

```bash
rg "^name: (correctness-review|test-review|debug)$" .codex/skills
rg "7d79c7754f2b9d656f7db7b9ecefcb7532b6d256" .codex/skills
rg "correctness-review|test-review|debug" AGENTS.md
```

## Expected Results

- Each skill directory contains `SKILL.md` and the upstream `LICENSE`.
- Each skill name matches its directory.
- Each skill records the reviewed upstream repository and revision.
- The target repo's agent guidance explains when to invoke the skills.
- Existing project-specific authorization and verification rules remain authoritative.
