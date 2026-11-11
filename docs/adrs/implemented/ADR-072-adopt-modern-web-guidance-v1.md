# ADR-072: Adopt Modern Web Guidance 1.0

**Status:** Implemented

**Date:** 2026-11-11

## Context

The user requested an upgrade after the [Modern Web Guidance 1.0 release](https://developer.chrome.com/blog/modern-web-guidance-v1), including useful additions. The existing integration pins `0.0.191` and deliberately adapts upstream instructions to the template's scoped activation, browser policy, and repository authority.

Version 1.0 adds a deterministic legacy-pattern scanner. Its matches need contextual review, its coverage is limited, and findings do not produce a failing exit status. Upstream instructions still use a moving package version, broad frontend activation, and type casts that conflict with local conventions.

## Decision

Review the published instruction snapshot at [`GoogleChrome/modern-web-guidance` revision `4dd968349e54ca45a05dd5c818fb035c9054b022`](https://github.com/GoogleChrome/modern-web-guidance/blob/4dd968349e54ca45a05dd5c818fb035c9054b022/skills/modern-web-guidance/SKILL.md). Its instructions match the `1.0.0` artifact, whose embedded skill version is `2026_11_09-5bcc021b`.

Pin all local commands to `modern-web-guidance@1.0.0`. The npm artifact records `GoogleChrome/modern-web-guidance-src` tag `v1.0.0` and source commit `544c250575f7811d87fef8b1c064bc9571cbfb80`, with integrity `sha512-vafIZwC8AS6QjM2yyoflZbnc7n3/TVOMLbEMRdPTwcFy0f9/Tq8s5rJQ8UIqRt2KPl9ixravyaMR4nTGuUrcmg==`. The tag resolves to that commit, and the downloaded tarball matches the integrity. Node `>=22` fits the existing Node 24 baseline.

Keep the local adaptation and adjacent Apache-2.0 license. Adopt focused action-oriented queries, one retry for weak results, and complete reading of guides returned through temporary-file paths.

Add `legacy-scan <path> --json` only for explicit broad modernization or legacy-pattern audits. Review each candidate against its `keepWhen` / `dropWhen` rubric, discard false positives and intentional fallbacks, and report verified opportunities with the scanner's limited coverage. Audit-only requests stop at the report. Authorized modernization retrieves the relevant guide with the local pinned command, preserves required browser fallbacks, and reruns the scan and relevant checks. The JSON's unpinned `retrieveCommand` is not an approved invocation. Component-specific work continues to use focused retrieval.

Set `DISABLE_TELEMETRY=1` and `ENABLE_FILE_LOGGING=false` on every command. The reviewed telemetry code returns before creating its client when disabled; optional file logging is independently controlled. Scanning writes stdout and does not modify source. Normal use retains npm's existing cache; large guide output may use operating-system temporary files. Upgrade verification uses a disposable npm cache. Do not introduce repository reports, `.mwgrc`, installer-generated skills, an automatic updater, or a CI gate.

This supersedes ADR-067's reviewed coordinates and preserves ADR-052's integration boundaries, browser-support policy, and optional browser-types guidance, with the scoped audit extension above.

## Verification

- Verified package integrity, source tag/commit, published instruction equality, and telemetry/file-write behavior.
- Exercised pinned search and retrieval with telemetry disabled in a disposable npm cache; retrieval returned a complete temporary guide file.
- A disposable HTML fixture with premature `input:invalid` error styling returned the expected guide and contextual verification rubric.
- Scanning `src` returned zero findings across 35 rules covering 33 guides, with five docs/test files skipped. This establishes scanner operation, not comprehensive browser or accessibility coverage.

## Consequences

- **Positive:** existing retrieval gains the stable guide catalog, and explicit audits gain a focused way to identify modernization opportunities.
- **Negative:** scanner matches require review, large guide output requires a second read, and upgrades still require artifact and instruction review.
- **Neutral:** no application dependency, runtime change, new persistent tool output, or browser CI expansion is introduced.

## Alternatives Considered

### Only Update The Retrieval Pin

This preserves the old workflow but omits a useful opt-in audit capability that fits existing repository boundaries.

### Run The Upstream Installer Or Update Command

This would replace the local adaptation with broader routing and moving-version commands. A reviewed manual update preserves the template's contracts.

### Add Scanning To Every Browser Task Or CI

The scanner covers only deterministic legacy patterns, skips documentation and tests by default, and can retain valid fallback matches. Focused retrieval and the existing quality gates remain the appropriate default.
