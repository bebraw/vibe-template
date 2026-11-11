# ADR-074: Vendor DTU Without Zod

**Status:** Implemented

**Date:** 2026-11-11

**Amends:** [ADR-053](./ADR-053-adopt-local-ci-canonical-interface.md)

## Context

Local CI 0.18.1 is the latest published release reviewed for this update. Its DTU package depends on Zod 3 only to validate four scalar environment variables. That dependency produces the [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5) finding even though the advisory's collection-validation failure path is not demonstrated by these scalar inputs.

A small upstream contribution replaces the schema with equivalent Node validation. Open issues and pull requests contain no duplicate fix, but upstream limits pull request creation to collaborators. A release containing this change is unavailable. The template needs a reproducible way to consume the fix through normal npm installation.

## Decision

Declare the committed DTU archive in `vendor/dtu-github-actions/` as an explicit development dependency. Scope an npm override beneath `run-local-ci@0.18.1` to that root pin using `$dtu-github-actions`. This reference supports both existing-lock migrations and fresh installs: npm 11.21.2 can resolve a relative tarball directly inside a nested override against the installed parent's directory during migration. Reconstruct the archive from the exact published `dtu-github-actions@0.18.1` package, preserve its license and all unrelated files, and apply only the reviewed changes to `dist/config.js`, `dist/config.d.ts`, and its Zod dependency declaration.

Store the patch, source provenance, original integrity, resulting checksum, regeneration instructions, and removal condition next to the archive. Regenerate in an operating-system temporary directory and check reproducibility before updating the committed artifact. Continue using plain `npm ci` and the existing Local CI commands; add no patching dependency or installation hook.

Preserve existing defaults, URL strings, numeric coercion, and startup validation. Invalid inputs now produce a plain `Error` for the first invalid field instead of aggregated `ZodError` issues. Keep configuration regression checks and the resolved dependency invariant in the existing tooling test gate.

## Consequences

- Clean installations resolve the corrected dependency metadata, so Zod is absent from DTU's dependency graph and its advisory path disappears.
- The template owns a temporary package artifact and must review it whenever Local CI changes. Downstream copies must include the archive before installation.
- Separate development-tool advisories remain visible; this decision does not authorize unrelated transitive upgrades or audit suppression.
- Remove the override, explicit DTU development dependency, vendor directory, and temporary DTU tests together once a verified upstream release provides the required behavior. Projects that remove Local CI can prune these pieces immediately.

## Alternatives Considered

- **`patch-package`:** applies runtime edits after dependency resolution, leaving Zod in the lockfile and audit report; also adds a tool and lifecycle hook.
- **Override Zod to version 4:** keeps an unnecessary dependency and changes some configuration semantics, including URL normalization and infinite-number handling.
- **Maintain a full Local CI fork:** adds release and synchronization work beyond this three-file DTU fix.
- **Wait for upstream:** keeps the affected dependency installed despite an available, tested removal.
