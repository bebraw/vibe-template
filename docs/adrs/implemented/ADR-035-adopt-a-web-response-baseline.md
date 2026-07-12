# ADR-035: Adopt a Web Response Baseline

**Status:** Implemented

**Date:** 2026-07-12

## Context

The starter Worker returns valid server-rendered HTML, but cloned projects should not have to rediscover inexpensive browser security and accessibility defaults. A generic template cannot choose deployment-specific policies such as HSTS, crawler access, analytics consent, or canonical production URLs.

## Decision

The starter will enforce a small, broadly applicable web response baseline:

- HTML responses use a restrictive Content Security Policy suitable for the script-free starter.
- HTML responses disable unused camera, geolocation, and microphone capabilities, limit referrer detail, and prevent MIME sniffing.
- CSS responses prevent MIME sniffing.
- The home page includes a description, an explicit colour scheme, and a keyboard skip link.
- Error pages remain non-indexable and include basic mobile metadata.

Projects must deliberately revise the CSP when they add scripts, third-party resources, framing, or cross-origin form targets. Deployment-specific controls remain outside the template baseline.

## Consequences

**Positive:**

- Clones begin with useful security and accessibility defaults.
- Tests make the response contract visible and resistant to accidental removal.
- The policy remains small enough to understand and prune.

**Negative:**

- Projects that add client scripts or external assets must update the CSP intentionally.
- The baseline does not replace a project-specific security, accessibility, privacy, or SEO review.

## Alternatives Considered

### Adopt the complete Website Specification checklist

Rejected because many checklist items depend on whether a project is public, indexed, authenticated, multilingual, or collecting personal data.

### Document headers without setting them

Rejected because safe defaults are deterministic and inexpensive to enforce in the shared response helper.
