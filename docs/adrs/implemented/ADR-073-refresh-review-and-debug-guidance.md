# ADR-073: Refresh Review And Debug Guidance

**Status:** Implemented

**Date:** 2026-11-11

## Context

The skill update audit found useful upstream refinements for detecting weakened tests, checking whether negative tests reach their intended guard, isolating tests from machine state, and distinguishing toolchain failures from source defects. The compact local skills can adopt these refinements without importing upstream companion workflows or replacing repository conventions.

Wrangler's secret commands also have a consequential distinction: ordinary secret changes deploy immediately, while version-secret changes can be staged for later promotion.

## Decision

Selectively refresh `test-review` and `debug` from `cniska/skills` revision `2c83858f1d801369355a761ce3ba9b492f5c642f`, using the reviewed [test-review](https://github.com/cniska/skills/blob/2c83858f1d801369355a761ce3ba9b492f5c642f/skills/expertise/test-review/SKILL.md) and [debug](https://github.com/cniska/skills/blob/2c83858f1d801369355a761ce3ba9b492f5c642f/skills/workflow/debug/SKILL.md) definitions. Preserve their MIT licenses and compact local adaptation. `correctness-review` retains revision `7d79c7754f2b9d656f7db7b9ecefcb7532b6d256`; this refresh supersedes only the test-review and debug coordinates from [ADR-044](./ADR-044-vendor-engineering-quality-skills.md).

- Test review checks unexplained reductions in existing protection, including skipped tests, assertion removal, measurement exclusions, lowered thresholds, and nonblocking checks. Use `Restore` for lost protection after considering the stated rationale and replacement evidence; keep repository severity conventions authoritative.
- Test review checks that negative fixtures reach the intended guard and that ordinary tests use isolated synthetic data instead of real user state, credentials, or services. Explicit integration tests retain their scoped environment requirements.
- Debugging checks the active runtime and toolchain against project declarations before attributing a failure to source. A regression test remains the default; a lint or configuration check is appropriate when it can be shown to reject the original problem and accept the fix.
- Wrangler guidance names the immediate deployment effect of `secret put` and `secret delete` and uses `versions secret put` or `delete` when the authorized workflow requires staging. Confirm current behavior through [Cloudflare's secrets documentation](https://developers.cloudflare.com/workers/configuration/secrets/) and preserve the project's promotion boundary.

Keep the engineering-quality capability copies and the GitHub Wrangler copy byte-equivalent to their canonical skills. Record mixed provenance in the capability kit and distribute the changes through the `2026-11-11-skill-quality-refresh` update pack.

## Trigger

The user requested a dependency and skill audit, then authorized the useful updates identified by it.

## Consequences

- **Positive:** a green suite is assessed for preserved protection, debugging starts from the intended toolchain, and staged secret changes avoid accidental deployment.
- **Negative:** maintainers must retain per-skill source revisions and review future upstream changes individually.
- **Neutral:** the change adds no dependency, CI step, test harness, persistent output, or account mutation. Existing authorization, architecture, and required quality gates remain authoritative.

## Alternatives Considered

### Replace The Skills With Current Upstream Files

Upstream definitions depend on companion skills and include broader routing, model selection, reporting, and workflow conventions. Selective adaptation preserves the template's compact, repository-owned interfaces.

### Only Bump Provenance

Changing source coordinates without adopting reviewed behavior would misrepresent the update. Each refreshed skill records the source actually used; the unchanged correctness skill retains its original revision.
