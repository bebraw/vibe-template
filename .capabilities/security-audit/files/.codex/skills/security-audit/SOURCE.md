# Source

- Repository: https://github.com/cloudflare/security-audit-skill
- Revision: `c1c8a8c1471069fb0e188eeaff69b8e8db6564a8`
- Imported path: `skills/security-audit/`
- License: MIT; see `LICENSE` in this directory.

The upstream skill, companion guides, schema, and validator tests are copied without changes. In `validate-findings.cjs`, one unused `catch (error)` binding was changed to `catch {` for this repository's Oxlint gate. This provenance file and the adjacent license are added by `vibe-template`. Review upstream changes before replacing the pinned copy.
