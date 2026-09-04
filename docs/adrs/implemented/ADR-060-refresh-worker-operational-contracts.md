# ADR-060: Refresh Worker Operational Contracts

**Status:** Implemented

**Date:** 2026-09-04

**Amends:** [ADR-004](./ADR-004-ship-a-worker-stub.md), [ADR-055](./ADR-055-add-optional-cloudflare-application-kits.md), [ADR-058](./ADR-058-add-preview-promotion-deployment-safety-kit.md), [ADR-059](./ADR-059-harden-anonymous-room-state.md)

## Context

The starter Worker still used compatibility date `2026-03-28`. Cloudflare now enables its Node.js compatibility modes by default for dates on or after `2026-08-04`, so updating the date without flags would silently broaden the deployed runtime contract. The project intends a Web-standards-only starter even though its local tooling runs on Node.

The package also lacked an explicit module type, causing Vite to warn while loading ESM syntax from `vitest.config.ts`. Capability kits exposed a generated-binding check but did not make its presence in an adopter's normal gate executable. Deployment tooling emitted redacted lifecycle logs, while AI calls and room resets did not provide equivalent minimal events.

Cold npm, browser, disposable-kit, Docker-image, and Local CI setup is too slow and failure-prone to discover during a time-sensitive session. The template needs a generic warm-up checklist without absorbing lecture-specific product behavior.

## Decision

Update the base Worker to compatibility date `2026-09-04` and set both `no_nodejs_compat` and `no_nodejs_compat_v2`. A future project may adopt Node.js runtime APIs only by removing those flags through a documented architecture decision. Keep the Room State verification fixture on `2026-08-22`, the newest date accepted by the runtime bundled with its pinned test pool; refresh it when that dependency is deliberately upgraded.

Declare the npm package as ESM with `"type": "module"`.

Require any capability manifest that generates `worker-configuration.d.ts` to list `npm run types:check` in its normal verification contract. After generating fixture bindings, run `wrangler types --check` before type checking and tests. Recipes must tell adopters to compose that check into their normal quality gate.

Emit bounded structured lifecycle events:

- Workers AI emits start and finish events. Finish identifies `model` or `fallback`, with only the bounded fallback reason when applicable.
- Room reset emits changed/unchanged outcome, removed-vote count, and resulting revision.
- Deployment operations retain their existing start/finish event, exit-code, and traffic-impact fields.

These events must not contain prompts, schemas, model output, fallback values, exception text, room or voter identifiers, credentials, or environment contents. An injected AI logger cannot change inference behavior if it throws.

Document one pre-session warm-up sequence that installs npm dependencies and the pinned browser, verifies disposable capability adopters, pulls the Local CI runner image, and completes Local CI. Keep this as reusable development guidance rather than a lecture-specific script or application feature.

## Consequences

**Positive:**

- Runtime behavior is refreshed without implicitly adopting Node globals or polyfills.
- Vite configuration loads under an explicit module contract without the CommonJS warning.
- Generated binding drift fails during ordinary adopter validation.
- Operators get consistent, low-sensitivity events around the important fallback, reset, and deployment boundaries.
- Time-sensitive sessions can pay cold-install costs in advance.

**Negative:**

- Projects that need Node.js runtime APIs must deliberately change the compatibility contract.
- The Room State fixture date temporarily trails the base Worker because its pinned runtime rejects newer dates.
- Default capability logging adds a small amount of console output unless an adopter injects its own destination.

**Neutral:**

- Local Node-based scripts, tests, and development dependencies are not part of the deployed Worker runtime contract.
- Prewarming fills tool-managed caches but does not guarantee external registries, Docker, or Cloudflare remain available later.

## Alternatives Considered

### Accept Node.js Compatibility By Date

This is convenient for npm packages, but it broadens the minimal starter's runtime surface without an application requirement.

### Keep The Old Compatibility Date

This avoids an immediate tool boundary, but leaves new projects on stale platform behavior and postpones the same decision.

### Log Inputs And Outputs For Debugging

Detailed payload logs can expose prompts, participant context, model output, and deterministic fallback content. Bounded outcome events give operational evidence without making sensitive payload retention the default.

### Add A Lecture-Specific Setup Command

That would make one event's workflow a lasting template feature. A generic warm-up checklist preserves the template boundary and remains useful for workshops and release rehearsals.
