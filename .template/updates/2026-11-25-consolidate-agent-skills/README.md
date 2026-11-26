# Consolidate local skill routing

Use this pack if your project adopted the template's `simplify` or `minimal-visual-style` skill. After the migration you can ask for a behavior-preserving simplification directly. Use `$frontend-design` for both starter UI extensions and a requested redesign. [Decision and evidence](../../../docs/adrs/implemented/ADR-075-consolidate-local-skill-routing.yaml)

## Apply

1. Check whether your project customized either retired skill or references its name in prompts, scripts, or documentation. Preserve any project-specific rules you still use.
2. Inspect `patch.diff` and run `git apply --check <path-to-pack>/patch.diff` from the target repository. Apply it if the affected files match. The patch updates the two surviving skill entries, the README catalog and agent routing, and removes the two retired entry files.
3. If the target has diverged, move its visual conventions into its existing frontend skill. Point to the target's actual view, stylesheet, and screenshot instructions. Replace references to `$minimal-visual-style` with that skill and references to `$simplify` with a direct request. Remove the obsolete entry files once their callers and any local customizations are accounted for.
4. Update the target's skill spec and decision record where applicable. Record `2026-11-25-consolidate-agent-skills` in its template update history after verification.

## Verify

- Validate both changed skills. In this template, run `npm run skill:validate -- .codex/skills/frontend-design` and `npm run skill:validate -- .codex/skills/modern-web-guidance`.
- Check that each catalog link resolves, the active instructions route to installed skills, and the visual skill points to the target's own files. Check a starter extension, an explicit rebrand, and a standalone screenshot request against its documented routing.
- Run `npm run quality:gate` or the target's equivalent checks. The template's tooling tests check update patch syntax.
