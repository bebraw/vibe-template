# ADR-011: Upgrade Runtime Baseline to Node 24

**Status:** Accepted

**Date:** 2026-03-28

## Context

The template pins Node exactly through `package.json`, and both local and remote CI consume that pin directly. That makes the runtime version a durable architectural constraint rather than a local preference.

The repo was still pinned to Node 22 even though the current active LTS line is Node 24. Keeping the older LTS line longer than necessary would leave new template clones on an older runtime baseline without a clear repo-level reason.

## Decision

We will move the repo runtime baseline from Node 22 to Node 24 LTS.

The template now uses:

- `24.14.1` in `package.json#engines.node`
- the existing pnpm-based workflow and lockfile model
- the same CI behavior, with `actions/setup-node` continuing to read the version from `package.json`

## Trigger

The project already removed `.nvmrc` and made `package.json` the single source of truth for the runtime pin. After that consolidation, upgrading the Node baseline became a single explicit repo change instead of a coordinated multi-file runtime migration.

## Consequences

**Positive:**

- New template clones start from the current Node LTS line instead of the previous one.
- Local development and CI stay aligned through the same pinned runtime source.
- The repo remains explicit about its toolchain contract without restoring separate runtime version files.

**Negative:**

- Contributors who still have only the previous Node 22 baseline installed need to install Node 24 before repo commands pass cleanly.
- Some upstream tools may expose new warnings or compatibility changes that only appear once verification is run under Node 24.

**Neutral:**

- pnpm remains the package manager contract.
- CI still reads the runtime version from `package.json`; only the pinned value changes.

## Alternatives Considered

### Stay on Node 22

This was rejected because the repo no longer had a compelling template-level reason to stay on the older LTS line once Node 24 was the current active LTS.

### Track Node Current Instead of LTS

This was rejected because the template aims for a stable default baseline. The LTS line is a better fit than the more frequently changing Current release for a reusable starter.
