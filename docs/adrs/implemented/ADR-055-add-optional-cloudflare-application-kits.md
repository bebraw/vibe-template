# ADR-055: Add Optional Cloudflare Application Kits

**Status:** Implemented

**Date:** 2026-09-04

## Context

A downstream lecture project needs a repeatable Workers AI boundary, room-scoped voting state, and a progressively enhanced form flow. Those patterns could help later projects, but placing them in the starter Worker would preselect product behavior, state, model use, and client interaction for every clone.

The request also exposed a separate operational gap: the normal quality gate does not prove that the active runtime matches the package contract, Wrangler is authenticated, declared bindings can generate types, or the Worker can produce a deployment bundle.

The unresolved design question is whether progressive interaction should become a core browser opinion or remain independently selectable until practical use demonstrates that it generalizes.

## Decision

Add three independently selectable capability kits:

1. `workers-ai` provides a generated-type binding adapter, configurable model variable, JSON Schema request, mandatory runtime validation, bounded timeout, deterministic fallback, and network-free mock runner.
2. `room-state` provides one SQLite-backed Durable Object per deterministic room id, predefined choices, pseudonymous replaceable votes, aggregate counts, reset/seed RPC operations, conventional HTML GET/POST behavior, and Workers-runtime tests. Seed and reset composition requires an application-owned authorization callback.
3. `progressive-interaction` provides typed browser code that intercepts only explicitly marked conventional forms, fetches returned HTML, replaces a declared fragment, preserves URL/history/focus coherence, falls back to native submission, and includes a JavaScript-disabled Playwright scenario.

Keep all three out of the default Worker runtime. In particular, keep progressive interaction separate from room state and from the core template until repeated use supports a narrower follow-up decision.

Add a dependency-free `npm run preflight` command to the default template because it validates operational readiness rather than choosing application behavior. It checks Node/npm, the repo-pinned Wrangler binary, authentication, binding-type generation, and a non-provisioning deploy dry run. Preflight captures child output and uses only a disposable operating-system temporary directory for its own artifacts.

Keep lecture-specific data outside the template and kits: no event names, voting choices, ticket URLs, AI prompts, output schemas, seed values, or prompt-composition rules are included.

## Trigger

A downstream request recommended a small default template plus optional Workers AI and room-state kits, with progressive interaction remaining optional through the first practice run and a generic deployment preflight considered for the baseline.

## Consequences

**Positive:**

- Lecture scaffolding can be applied live without making every future clone inherit its product architecture.
- Workers AI failure behavior and output validation become explicit and independently testable.
- Room consistency has one clear state authority and coordination key.
- The browser enhancement preserves a standards-based no-JavaScript path.
- Deployment readiness failures become visible before a real deployment attempt.

**Negative:**

- Capability-kit maintenance now includes Cloudflare binding, model, Durable Object, browser, and test-runner contracts that must be reviewed as platform versions change.
- Applying room state adds a Durable Object migration and Workers-runtime test dependency to the target project.
- The preflight invokes network-dependent authentication and configured build hooks, so it cannot become an unconditional quality-gate phase.

**Neutral:**

- The default application remains the same Worker stub.
- The kits provide generic implementation seams, not a complete lecture application.
- Projects with an established client framework should keep that framework's interaction model instead of applying the progressive kit.

## Alternatives Considered

### Put All Three Patterns In The Starter Worker

This would make the lecture clone immediately feature-complete, but it would add AI, persistence, voting semantics, and browser code to every experiment. It conflicts with the template's lightweight, easy-to-prune purpose.

### Combine Room State And Progressive Interaction

The demonstration uses them together, but the server-side voting contract is complete without JavaScript and progressive fragment replacement is useful beyond voting. Combining them would make an adjacent client build an implicit requirement of the state kit.

### Document The Patterns Without Copyable Code

This keeps repository weight smallest but leaves binding types, timeout cleanup, replaceable-vote semantics, authorization, and no-JavaScript verification to be reconstructed during the lecture. Reviewable copyable files make those seams recoverable without hidden automation.

### Keep Preflight Outside The Baseline

This avoids one package script, but every Cloudflare project still faces the same runtime, authentication, binding, and bundling uncertainty. A read-only, dependency-free command earns its place without prebuilding application behavior.
