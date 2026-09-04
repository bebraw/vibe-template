# ADR-056: Verify Executable Capability Kits

**Status:** Implemented

**Date:** 2026-09-04

**Amends:** [ADR-055](./ADR-055-add-optional-cloudflare-application-kits.md)

## Context

The Workers AI and Room State kits include tests, but the root Vitest configuration intentionally discovers only `src/**/*.test.ts`. Root tests therefore do not prove that either kit can be copied into an adopter with complete dependencies, generated binding types, compatible configuration, and runnable tests.

Pointing root Vitest at `.capabilities/` would mix Node and Workers test environments and would let root dependencies mask incomplete kit manifests. Isolated kit checks also miss conflicts that appear only after common capabilities share one build, test runner, coverage policy, guard, and browser path. The verification seam needs to exercise adopter shapes rather than the storage location of the recipes.

## Decision

Add `npm run capabilities:verify`. For each supported executable kit, materialize an independent example Worker under an operating-system temporary directory, install the exact development dependencies declared by that kit plus the repository-pinned Wrangler and TypeScript verification toolchain, generate binding types, type-check the copied application, and run its tests.

Also materialize one synthetic standard adopter that composes Quality Gate, Room State, Browser Static Assets, Progressive Interaction, and mocked Workers AI. Do not copy replaceable starter application files into it. Merge manifest dependencies, scripts, generated-file contracts, and Wrangler fragments; honor explicit development-dependency replacements; then run its composed build, generated-type check, TypeScript check, Worker client guard, Istanbul unit coverage, Playwright browser tests, and deploy dry run. Disable remote bindings in the Worker test plugin and point it at a derived test-only Wrangler configuration that omits the AI binding, so mocked Workers AI verification is network-free, cannot incur inference usage, and does not warn about an unused remote binding.

Keep the composition fixture shared while preserving the repository's fast/browser split: `npm run capabilities:verify` owns generated types, type checking, the guard, Istanbul coverage, and deploy packaging; `npm run capabilities:verify:browser` owns its Playwright flow and is composed into `npm run e2e`. Run the fast command from the baseline quality gate and CI fast job, and run the browser command from the browser gate and CI browser job. Keep fixture entrypoints and Wrangler configuration minimal and generic. Reject manifest paths that escape the kit or fixture and reject a kit dependency that conflicts with the pinned verification toolchain. Remove every temporary Worker after success or failure.

Declare Vitest explicitly in the Workers AI manifest because its copied test imports Vitest. Do not add the Workers test plugin to the root application dependency set; Room State declares and installs `@cloudflare/vitest-plugin` plus the Istanbul coverage provider only inside its disposable adopter. Native V8 coverage remains valid for the root Node-oriented test suite but is replaced when Worker-runtime tests are composed.

## Consequences

**Positive:**

- Kit tests, generated binding types, configuration, and dependency declarations are exercised together.
- The standard adopter catches cross-kit build, guard, coverage, browser, and test-runtime regressions.
- Independent fixtures expose undeclared dependencies that the root repository could otherwise satisfy accidentally.
- The root application remains free of optional Durable Object test infrastructure.

**Negative:**

- Baseline and CI verification require npm registry access and perform several temporary installs across the fast and browser lanes.
- The verifier maintains small isolated fixtures plus one synthetic composition fixture.

**Neutral:**

- The root Vitest include remains scoped to default application source.
- Capability verification leaves npm's normal shared download cache intact but removes its materialized Worker directories.

## Alternatives Considered

### Expand The Root Vitest Glob

This would discover the test files, but incompatible Node and Workers pools would share one configuration and root dependencies could conceal incomplete manifests.

### Add Optional Kit Dependencies To The Root Project

This would speed local execution, but every clone would install Durable Object test infrastructure for an application capability it may never adopt.

### Verify Only Manifest Shape

Parsing JSON and checking file existence cannot catch generated binding drift, TypeScript errors, test-runner incompatibility, or missing dependencies.
