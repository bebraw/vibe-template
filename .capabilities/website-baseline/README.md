# Website Baseline Capability Kit

Use this kit to add a small, applicability-aware web quality contract to a project. It is derived from the standards-sourced [Website Specification](https://specification.website/) without importing its full checklist or making emerging conventions mandatory.

## Adds

- A copyable `docs/website-baseline.md` checklist
- A review workflow that distinguishes universal, public-site, and feature-dependent requirements
- Prompts for recording intentional non-applicability

## Good Fit

- The target repo serves browser-visible HTML.
- Contributors need a durable definition of baseline accessibility, security, resilience, SEO, and performance.
- The project benefits from an audit contract without another dependency.

## Poor Fit

- The target repo exposes only a non-browser API or library.
- An existing standards-based web checklist already owns the same contract.
- The team expects a one-click compliance claim; this kit is a review aid, not certification.

## Apply

1. Copy `files/docs/website-baseline.md` into the target project's durable documentation area.
2. Adapt the applicability table to the product's deployment, data collection, authentication, and localisation.
3. Link each automated item to the target repo's existing tests or quality gate.
4. Record intentionally excluded items with a short reason.
5. Run the checks in `checks.md`.

The upstream specification evolves. Revisit its checklist during meaningful web-platform changes instead of vendoring a snapshot into the repo.
