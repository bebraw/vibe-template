# ADR-064: Use Node Skill Validation

**Status:** Implemented

**Date:** 2026-09-15

## Context

The installed system skill’s Python validator failed because PyYAML was missing. This repository already pins Node and installs `yaml` transitively, but transitive availability is not a reliable interface for project-owned tooling.

## Decision

Own `scripts/validate-skill.mjs` and expose `npm run skill:validate -- <skill-directory>`. Declare `yaml@2.9.0` directly as a development dependency and retain the existing structural and placeholder checks through CLI regression tests in the current tooling suite. Use YAML 1.1 scalar resolution for compatibility; reject duplicate keys and parser warnings explicitly. Accept CRLF and an exact closing frontmatter delimiter at EOF. The agent-skill spec owns the precise contract.

Route repository skill work to this command without changing the installed system skill or adding a new CI lane. Keep UI metadata and behavioral review separate. The validator is read-only; tests use cleaned-up OS temporary directories.

## Alternatives

- Install PyYAML: retains an additional Python environment prerequisite unrelated to the template’s runtime.
- Patch the installed system skill: creates machine-local behavior outside repository versioning and may be overwritten by updates.
- Parse YAML manually: adds avoidable parsing edge cases for folded strings, metadata, and typed scalars.
- Import a transitive package without declaring it: allows unrelated dependency updates to break validation.

## Consequences

Validation is reproducible after npm installation and portable through a template update pack. The repository owns a small validator and its tests; future upstream validation changes require deliberate review. No claim is made that structural validation establishes skill quality or validates UI metadata.

## References

- [yaml API and parsing options](https://eemeli.org/yaml/)
- [Agent-skill contract](../../../specs/agent-skills/spec.md)
