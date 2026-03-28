# ADR-010: Adopt pnpm for Package Management

**Status:** Accepted

**Date:** 2026-03-28

## Context

The template already pins its JavaScript toolchain tightly so local development, CI, and cloned projects share the same baseline. That approach worked with npm, but package installation remained one of the slower recurring steps in both local iteration and CI.

The repo now has a broader verification baseline, a split CI workflow, and a local Agent CI wrapper that already knows about pnpm store cleanup edge cases. At that point, keeping npm as the package manager no longer has a strong advantage over a package manager with a shared content-addressable store and better cache behavior.

The repo should still stay lightweight. The chosen package manager needs to work cleanly with pinned versions, lockfile-based installs, `actions/setup-node`, Corepack, and local contributors using `nvm`.

## Decision

We will adopt pnpm as the repo's pinned package manager.

The template now uses:

- `pnpm@10.33.0` in `package.json#packageManager`
- pnpm version enforcement through `engines` and `devEngines`
- a committed `pnpm-lock.yaml` instead of `package-lock.json`
- Corepack-enabled CI jobs that run `pnpm install --frozen-lockfile`
- pnpm-based repo scripts and documentation for routine development and verification

This keeps the existing Node pin, but replaces npm as the package manager contract for local development and CI.

## Trigger

After the verification workflow was split and optimized, dependency installation became a clearer remaining place to reduce recurring overhead. The repo had also accumulated enough package-manager-specific documentation and policy that leaving npm in place would keep future work tied to a slower baseline without a compensating simplification benefit.

## Consequences

**Positive:**

- Installs and repeated dependency resolution should benefit from pnpm's store and cache model.
- The repo now carries a single explicit package-manager contract instead of depending on whichever global tool happens to be installed.
- CI can use pnpm's lockfile and cache integration directly.

**Negative:**

- Contributors need Corepack enabled, or a matching pnpm installation, before repo commands work.
- Some command examples and helper scripts need to use `pnpm` or `pnpm exec` instead of npm-oriented defaults.

**Neutral:**

- The repo still depends on Node through `.nvmrc`; this decision changes the package manager, not the runtime family.
- Existing devDependency pins and repo scripts remain the main way contributors interact with the toolchain.

## Alternatives Considered

### Keep npm

This was rejected because the repo already depends on an exact package-manager contract, and npm no longer offered a strong enough advantage to offset slower installs and weaker cache/store behavior.

### Switch to a broader runtime toolchain such as Bun

This was rejected because it would change more than the package manager. The template already has a stable Node-based baseline, and the goal here is to improve package management without broadening the migration scope.
