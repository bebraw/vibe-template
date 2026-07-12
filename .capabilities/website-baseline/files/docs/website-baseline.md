# Website Baseline

This project uses a curated baseline derived from the [Website Specification](https://specification.website/), a standards-sourced reference maintained for humans and agents. The checklist is intentionally smaller than the upstream specification. Consult upstream for current standards links and implementation details.

Source reviewed: 2026-07-12. Upstream content is licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

## Applicability

Record `yes`, `no`, or `later` before treating a conditional section as required.

| Condition                                    | Applies | Reason or owner |
| -------------------------------------------- | ------- | --------------- |
| Publicly indexed site                        |         |                 |
| User accounts or authentication              |         |                 |
| Personal data, cookies, or analytics         |         |                 |
| User-generated content or uploads            |         |                 |
| Multiple languages or regions                |         |                 |
| Installable or offline web app               |         |                 |
| Public documentation or agent-facing content |         |                 |

## Every Browser Surface

- [ ] HTML uses a doctype, UTF-8 charset, valid document language, mobile viewport, one useful title, and a useful description.
- [ ] Primary content is present in the initial HTML and uses semantic landmarks and a logical heading hierarchy.
- [ ] Interactive controls use native elements, accessible names, visible focus, keyboard operation, and adequate target sizes.
- [ ] Repeated navigation has a skip mechanism; zoom, forced colours, and reduced motion remain usable.
- [ ] Images have purposeful alternative text and explicit dimensions; decorative images have empty alternative text.
- [ ] Forms have programmatic labels and errors that are identified, associated, and announced.
- [ ] HTML responses set a deliberate CSP, MIME-sniffing protection, referrer policy, framing policy, and a permissions policy appropriate to used features.
- [ ] Custom error pages return the correct status, explain recovery without leaking internals, and preserve a useful route forward.
- [ ] Core content and navigation still work when optional client JavaScript fails.
- [ ] Performance checks cover loading, responsiveness, and layout stability on representative mobile and desktop conditions.

## Publicly Indexed Sites

- [ ] Canonical URLs, crawler policy, redirects, and indexing behavior are deliberate and tested.
- [ ] `robots.txt` and sitemaps represent the routes that should be discoverable.
- [ ] Sharing metadata and structured data accurately describe the visible page.
- [ ] Published URLs are treated as stable public contracts; retired routes redirect without unnecessary chains.
- [ ] `/.well-known/security.txt` provides a maintained reporting route when the project can respond to reports.

## Feature-Dependent Requirements

- [ ] Authentication works with password managers, paste, and accessible verification methods.
- [ ] Cookies use explicit `Secure`, `HttpOnly` where possible, and `SameSite` attributes.
- [ ] Privacy notices, consent, retention, and browser privacy signals match actual data processing.
- [ ] User content and uploads have documented validation, sanitisation, storage, and abuse boundaries.
- [ ] Language alternatives, direction, metadata, and locale-sensitive values are correct for every supported locale.
- [ ] Installable or offline behavior has a deliberate manifest, update strategy, and failure path.

## Agent Readiness (Opt In)

Agent-facing conventions are useful only when the project has public content, documentation, data, or tools worth exposing.

- [ ] Important content has stable URLs, clean semantics, and a machine-readable representation where useful.
- [ ] AI crawler access is an explicit product decision reflected in `robots.txt`.
- [ ] `/llms.txt`, per-page Markdown, HTTP discovery links, or Agent Skills are added only for a concrete consumer.
- [ ] Emerging protocols such as MCP, A2A, WebMCP, or AI catalogs are not exposed without useful capabilities and an owned security boundary.

## Verification Record

Record the audit date, environment, automated evidence, manual checks, exclusions, and follow-up owner. A passing automated score is evidence, not a compliance claim.
