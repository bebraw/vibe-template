# ADR-067: Refresh Reviewed Web Guidance

**Status:** Implemented

**Date:** 2026-10-02

## Context

ADR-052 pinned Modern Web Guidance's instruction provenance and executable artifact separately. The reviewed `0.0.180` artifact has newer guide releases, and the user authorized the dependency updates identified in the maintenance review.

The upstream `0.0.191` instructions still mandate broad frontend activation, use `@latest`, and give retrieved examples stronger authority than this template permits. The local adaptation remains necessary.

## Decision

Review the instruction snapshot from `GoogleChrome/modern-web-guidance` revision `84ae7251ee919239d5ea85aef25897983f26601e`, published as `0.0.191`, while retaining narrow local routing and repository authority.

Pin search and retrieval to `modern-web-guidance@0.0.191`. Its npm artifact records `GoogleChrome/modern-web-guidance-src` tag `v0.0.191` and source commit `7b4b980569da01d6e9f4379bd852b903fac0554d`, with integrity `sha512-BF3UZQKsA3+Xi3iSkxMn68Nx2xaf6fr+awsVDIg4F9Vqfh8wvzOTTWtHnktOJOxfrr+hzZzWmrBs5vR3MO4dBA==`.

Verify the downloaded tarball against that integrity, inspect the telemetry opt-out, and exercise search and retrieval with `DISABLE_TELEMETRY=1` in a disposable npm cache. Keep the existing license, Baseline support policy, primary-documentation fallback, and prohibition on automatic or moving-version updates.

This supersedes only ADR-052's reviewed snapshot and artifact coordinates. Its integration boundaries and optional browser-types recommendation remain active.

## Trigger

The dependency review found the newer artifact; the user requested its update alongside the project toolchain.

## Consequences

- **Positive:** browser implementation can retrieve the newer guide set through the same reviewed interface.
- **Negative:** the artifact remains a sizeable on-demand download and needs deliberate review for future upgrades.
- **Neutral:** no application dependency, guide corpus, new persistent write target, or CI gate is added.

## Alternatives Considered

### Retain 0.0.180

This avoids a download but leaves the guide set behind the reviewed release without a compatibility reason.

### Install The Upstream Instructions Unchanged

Their broad activation and mutable version bypass the repository's focused routing, reviewed pins, and local authority.
