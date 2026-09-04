# ADR-056: Verify Executable Capability Kits

**Status:** Implemented

**Date:** 2026-09-04

**Amends:** [ADR-055](./ADR-055-add-optional-cloudflare-application-kits.md)

## Context

The Workers AI and Room State kits include tests, but the root Vitest configuration intentionally discovers only `src/**/*.test.ts`. Root tests therefore do not prove that either kit can be copied into an adopter with complete dependencies, generated binding types, compatible configuration, and runnable tests.

Pointing root Vitest at `.capabilities/` would mix Node and Workers test environments and would let root dependencies mask incomplete kit manifests. The verification seam needs to exercise the adopter shape rather than the storage location of the recipes.

## Decision

Add `npm run capabilities:verify`. For each supported executable kit, materialize an independent example Worker under an operating-system temporary directory, install the exact development dependencies declared by that kit plus the repository-pinned Wrangler and TypeScript verification toolchain, generate binding types, type-check the copied application, and run its tests.

Run this command from the baseline quality gate and the CI fast job. Keep fixture entrypoints and Wrangler configuration minimal and generic. Reject manifest paths that escape the kit or fixture and reject a kit dependency that conflicts with the pinned verification toolchain. Remove every temporary Worker after success or failure.

Declare Vitest explicitly in the Workers AI manifest because its copied test imports Vitest. Do not add the Workers test pool to the root application dependency set; Room State declares and installs it only inside its disposable adopter.

## Consequences

**Positive:**

- Kit tests, generated binding types, configuration, and dependency declarations are exercised together.
- Independent fixtures expose undeclared dependencies that the root repository could otherwise satisfy accidentally.
- The root application remains free of optional Durable Object test infrastructure.

**Negative:**

- Baseline and CI verification require npm registry access and perform two temporary installs.
- The verifier maintains small composition fixtures for each supported executable kit.

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
