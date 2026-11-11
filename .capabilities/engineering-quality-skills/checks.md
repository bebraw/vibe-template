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
rg "7d79c7754f2b9d656f7db7b9ecefcb7532b6d256" .codex/skills/correctness-review/SKILL.md
rg "2c83858f1d801369355a761ce3ba9b492f5c642f" .codex/skills/test-review/SKILL.md .codex/skills/debug/SKILL.md
rg "correctness-review|test-review|debug" AGENTS.md
```

## Expected Results

- Each skill directory contains `SKILL.md` and the upstream `LICENSE`.
- Each skill name matches its directory.
- Each skill records the reviewed upstream repository and revision.
- `test-review` names protection lost through weakened checks, verifies negative tests reach the intended guard, and checks isolation from real user state and services.
- `debug` checks declared runtime/toolchain versions before blaming source and proves the chosen test, lint rule, or configuration guard rejects the original failure.
- The target repo's agent guidance explains when to invoke the skills.
- Existing project-specific authorization and verification rules remain authoritative.
