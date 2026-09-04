# ADR-057: Add A Browser Static Assets Kit

**Status:** Implemented

**Date:** 2026-09-04

**Amends:** [ADR-055](./ADR-055-add-optional-cloudflare-application-kits.md)

## Context

The Progressive Interaction kit supplies typed client behavior but assumes an adopter already owns browser compilation and static serving. The base Worker has neither, so demonstrating progressive enhancement still requires an unrecorded build-system and asset-routing decision.

The template should provide a small default option without placing client JavaScript in every clone or competing with an adopter's existing framework. Stable emitted filenames also need a cache policy that does not trap users on old code.

## Decision

Add an independently selectable `browser-static-assets` capability kit. Compile `src/browser/` with the repository's pinned TypeScript compiler to native ES modules under generated `public/assets/`. Use an external `type="module"` entrypoint, a Wrangler custom build with watch roots, and static-assets routing that keeps Worker application routes authoritative while `/assets/*` bypasses the Worker.

Use authored `public/_headers` for static-response CSP and security headers. Keep the stable, unhashed JavaScript names on explicit revalidation rather than immutable caching. Require Worker-generated HTML to attach its own equivalent security policy because static `_headers` do not affect Worker responses.

Keep this build kit separate from Progressive Interaction. An adopter may select it alone, and the progressive kit may offer it only when no client pipeline exists. Add a JavaScript-enabled progressive regression scenario for fragment replacement, URL, focus, and history, while retaining the no-JavaScript scenario.

## Consequences

**Positive:**

- A server-rendered Worker can gain typed browser code without choosing a framework or bundler.
- Local Wrangler development rebuilds browser source and deploy dry runs prove asset inclusion.
- Progressive enhancement now has executable JavaScript-on and JavaScript-off browser coverage.

**Negative:**

- Native emitted modules require explicit `.js` suffixes for relative imports and do not bundle package dependencies.
- Stable module names must revalidate on each navigation; aggressive immutable caching requires a later fingerprinting build.

**Neutral:**

- The default Worker runtime and root asset path do not change.
- Projects with Vite or a framework adapter keep their existing pipeline and apply only relevant interaction code.

## Alternatives Considered

### Add Vite To The Base Template

Vite would provide bundling and hashing, but it would add a client build opinion and dependency to every clone when many experiments remain server-only.

### Fold The Build Into Progressive Interaction

That would make a reusable infrastructure seam inseparable from one form behavior and would duplicate client tooling in projects that already have it.

### Cache Stable Module Names Immutably

Long immutable caching improves repeat loads but can serve obsolete code indefinitely because this minimal compiler does not fingerprint filenames.
