# ADR-059: Harden Anonymous Room State

**Status:** Implemented

**Date:** 2026-09-04

**Amends:** [ADR-055](./ADR-055-add-optional-cloudflare-application-kits.md)

## Context

The Room State kit bounds form input, restricts votes to predefined choices, hashes an opaque first-party voter cookie per room, and replaces that browser's prior vote. It did not validate the source of POST requests, kept new voter cookies for one year, or return the participant's current choice.

A presentation also needs to stop voting at one identifiable result before passing aggregates to a model. Aggregate counts without a room status or revision cannot distinguish a frozen result from one that changed between reads.

## Decision

Require a vote POST `Origin` that exactly matches the request URL origin or an application-owned explicit allowlist. Reject missing, opaque, malformed, or untrusted origins before reading the body, creating a voter cookie, or calling the Durable Object.

Default new voter cookies to eight hours and allow the HTTP composition root to configure an integer lifetime from one minute through one year. Preserve `HttpOnly`, `SameSite=Lax`, path scoping, and HTTPS-only `Secure` behavior.

Store room status and a monotonic revision in the room's SQLite database. Seeding opens the room by default and advances the revision. Choice/status/vote mutations advance it once; an identical repeated vote, repeated status, empty reset, validation failure, or locked vote does not. Add an authorized status helper so applications can lock and reopen rooms without exposing administration routes from the kit.

Allow snapshots to accept an optional pseudonymous voter key and return only that participant's current choice. Render that choice as checked, expose status and revision as fragment data, and disable the voting controls while locked.

Continue describing the cookie as casual duplicate-vote resistance, not identity or ballot-stuffing prevention.

## Consequences

**Positive:**

- Cross-site requests cannot spend a browser's voter cookie through the default POST handler.
- Event-length cookies reduce unnecessary identifier retention.
- A presenter can freeze and name an exact room revision while participants still see their own selection.

**Negative:**

- Non-browser clients and unusual privacy contexts must provide an accepted `Origin` or use a separately designed API boundary.
- Adopters must update exact snapshot expectations and include the new metadata table initialization.

**Neutral:**

- Cookies remain pseudonymous and easy for a determined participant to replace or multiply.
- Existing SQLite Durable Object namespaces initialize the metadata row lazily without a new namespace migration tag.

## Alternatives Considered

### Synchronizer CSRF Tokens

Per-session tokens can protect POSTs, but they require issuing additional server state or signed values. Exact Origin validation is smaller for this same-origin anonymous form and fails closed.

### Use The Cookie As Authenticated Identity

The client controls cookie deletion and can use multiple clients. Treating it as identity would overstate the protection and mislead adopters about ballot integrity.

### Derive Revisions From Vote Totals

Totals do not change when a participant moves between choices and cannot identify status or seed changes. A stored monotonic revision represents every relevant room mutation.
