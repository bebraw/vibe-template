# Add an Oxlint Correctness Gate

Use this update when a downstream project wants fast JavaScript and TypeScript
correctness linting without replacing Prettier, TypeScript checking, or the
project's existing test gates.

## Apply

1. Add `oxlint` as a pinned development dependency and regenerate the lockfile
   with the target project's package manager.
2. Add `lint`: `oxlint --max-warnings 0` to the package scripts.
3. Add `npm run lint` to the fast quality gate.
4. Run Oxlint only for affected JavaScript and TypeScript files in any
   affected-file guardrail.
5. Keep Oxlint on its default correctness rules for the initial adoption.
6. Keep the existing formatter and TypeScript project checker as separate
   required checks.

## Fallback

If the target project already has ESLint, compare rule coverage before
replacing it. Oxlint can run alongside ESLint during a staged migration, but
avoid leaving permanently duplicated checks. If the current code fails the
default rules, review each finding rather than adding broad suppressions.

## Verify

- `npm run lint`
- The target project's normal quality gate
- The target project's local CI workflow
