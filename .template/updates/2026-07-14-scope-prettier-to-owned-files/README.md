# Scope Prettier to Project-Owned Files

Use this update when a downstream project carries duplicated or vendored skill
documentation that should not consume its formatting budget.

## Apply

1. Identify skill trees copied for multiple agent surfaces and reference
   material vendored from external documentation.
2. Add those paths to `.prettierignore`. For the template layout, use:
   - `.github/skills`
   - `.codex/skills/**/references`
3. Keep project-owned skill entry points, specs, ADRs, and documentation in the
   Prettier baseline.
4. Run the normal format and quality checks.

## Fallback

Adapt the ignore paths to the target project's ownership boundaries. Do not
ignore an entire skills directory when the target project authors and maintains
the files inside it directly.

## Verify

- `npm run format:check`
- The target project's normal quality gate
- The target project's local CI workflow
