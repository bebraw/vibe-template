# Specs

This directory stores living feature specs using the ASDLC spec pattern.

Specs are the durable source of truth for how a feature works and how we verify it. Keep them close to the code and update them when behavior changes.

Use a spec when work introduces:

- feature-level architecture or API contracts
- important quality rules or regression guardrails
- workflows that future contributors or agents need to preserve

Skip a spec for small fixes, trivial copy changes, or narrow tactical edits.

## Layout

- Global rules belong in [`ARCHITECTURE.md`](../ARCHITECTURE.md).
- Feature specs belong in `specs/{feature-domain}/spec.md`.

## Starting Point

- Copy [`feature-template/spec.md`](./feature-template/spec.md) into a new feature directory.
- Rename the directory to match the feature domain in kebab-case.
- Update the spec whenever the feature's contracts or architecture change.

## Search Tips

```bash
rg "^# Feature:" specs
rg "^## Contract" specs
rg "Regression Guardrails|Anti-Patterns" specs
```
