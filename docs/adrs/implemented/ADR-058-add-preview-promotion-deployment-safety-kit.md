# ADR-058: Add A Preview Promotion Deployment Safety Kit

**Status:** Implemented

**Date:** 2026-09-04

## Context

The template's `npm run deploy` maps directly to `wrangler deploy`, which uploads a version and immediately sends it all traffic. That is unsuitable for a presentation workflow where a background agent should prepare a candidate while the projected application stays on its last-known-good version.

Cloudflare separates `versions upload` from `versions deploy` and can attach version-specific and aliased preview URLs to undeployed versions. Those previews have important limits: they are public unless protected, do not expose Workers logs, are not generated for Workers with Durable Objects (including Containers and Sandbox), and do not constitute isolated production data bindings.

## Decision

Add an optional `deployment-safety` capability kit. When applied, the stable `deploy` script aliases preview upload rather than direct traffic mutation. The copyable wrapper invokes the pinned Wrangler binary to upload a strict undeployed version with a stable preview alias, report current deployment status as JSON, promote one explicit version ID to 100%, or roll back to one explicit version ID.

Require an application-owned review runbook to record the candidate ID and URLs, prior active version, smoke result, promotion result, and rollback target. Emit structured start/finish logs that identify whether an operation mutates traffic without logging secrets or environment contents.

Reject this version-preview workflow for Workers with Durable Objects, Containers, or Sandbox. Those projects require a separate Wrangler environment/Worker and isolated bindings; this generic kit does not invent that application-specific topology. Document that rollback changes code traffic immediately but does not restore connected resources or cross Durable Object lifecycle changes safely.

## Consequences

**Positive:**

- Candidate creation no longer changes the projected stage.
- Promotion and rollback are deterministic, non-interactive, and tied to reviewed version IDs.
- The runbook makes access, data, binding, and rollback limits visible before a lecture or release.

**Negative:**

- Preview URLs require remote version uploads and may need Cloudflare Access configuration.
- Durable Object applications need a more involved isolated-environment design rather than this workflow.

**Neutral:**

- The base template keeps its simple direct deploy until a project explicitly applies the kit.
- Gradual traffic splitting remains a separate, application-specific decision.

## Alternatives Considered

### Change The Base Deploy Script

Making every clone use version previews would impose public preview URLs and a promotion ceremony on small experiments, including Workers that cannot use preview URLs.

### Auto-Promote The Latest Candidate

An alias or latest-version lookup could select an unreviewed concurrent upload. Requiring the exact version ID preserves the human approval boundary.

### Use Gradual Deployments

Traffic splitting is useful for measured production rollouts, but it introduces version skew and does not keep a live presentation wholly on its known-good version during review.
