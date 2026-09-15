# ADR-052: Adopt Scoped Modern Web Guidance

**Status:** Implemented

**Date:** 2026-08-10

## Context

The template is an AI-assisted, browser-facing Worker starter. Its local frontend skills cover design direction, established visual style, and measured performance, but they do not provide a focused way to discover current HTML, CSS, Web API, browser-support, and fallback patterns before implementation.

Google Chrome's Modern Web Guidance provides that retrieval layer, but its preview skill declares itself mandatory for nearly every frontend task, runs a mutable `@latest` package, enables anonymous tool telemetry by default, and treats retrieved guides as the preferred project standard. Installing it unchanged would broaden routine task latency and let external guidance drift outside this repository's reviewable architecture and spec model.

The current browser gate uses Chromium. The repository also lacks an explicit browser-support target, so adopting compatibility guidance without documenting that boundary would imply a broader verification claim than the tooling proves.

## Decision

Vendor a locally adapted `modern-web-guidance` skill under `.codex/skills/` from the `GoogleChrome/modern-web-guidance` publish snapshot at revision `684ab9d7c6b78fc2cd5677912d874397cb2e5dfa`. Treat that revision as instruction provenance only: its package metadata labels it `0.0.179`.

Independently pin search and retrieval to the reviewed npm artifact `modern-web-guidance@0.0.180`. The registry records that artifact against `GoogleChrome/modern-web-guidance-src` tag `v0.0.180` and commit `29ecd9546013e32e0a597ad5ab3a2fc26add1f1d`, with integrity `sha512-55diU2dH4nMF2DKWmvOdeLKWUvTTz32UIcSlYFSa+AN699MVC7pvqJ4mlFMmPd7qfnRJiP/FxKcSkIOP0MSDDw==`. Keep the instruction snapshot and executable package coordinates distinct during future reviews.

Narrow automatic activation to browser-facing work that needs a web-platform choice, compatibility interpretation, or fallback decision. Pin every search and retrieval command to the reviewed package version, disable telemetry on every invocation, retrieve focused guides on demand, and keep repository architecture, specs, source conventions, user instructions, and verification authoritative over guide examples.

Target Baseline Widely available for core browser behavior. Use newer features only as progressive enhancements with a usable core path unless a project explicitly documents a narrower browser target. Treat Chromium Playwright and Lighthouse output as Chromium evidence rather than cross-browser proof.

Do not vendor the upstream guide corpus or Chrome Extensions pack, add an application dependency, create an automatic updater, or add a CI gate for the guidance tool.

### Missing Browser Types (2026-09-15)

Document `modern-web-types` as an optional response when a justified browser API lacks declarations. Evaluate generated declarations as an alternative to handwritten types or suppression, while retaining dependency approval, version pinning, active TypeScript toolchain verification, and the existing browser-support policy. This recommendation concerns browser typing, not replacement of Cloudflare runtime types.

Keep it out of the default dependency graph: the starter has no demonstrated missing-browser-type requirement. This preserves a lightweight baseline while giving browser-capability adopters a concrete option. See [Philip Walton’s rationale](https://philipwalton.com/articles/modern-web-types/); consult current package installation documentation when adopting.

## Trigger

The user reviewed the fit analysis and approved the controlled integration after a pinned, telemetry-disabled pilot returned useful guidance for dialog behavior, container queries, and LCP image priority.

## Consequences

**Positive:**

- Agents gain current, focused web-platform and compatibility input before making substantive frontend implementation choices.
- Native HTML and CSS patterns can reduce unnecessary client JavaScript and dependency pressure.
- Pinned retrieval, disabled telemetry, provenance, and local-authority rules keep the workflow reviewable.
- The browser-support target makes fallback decisions explicit without expanding the browser CI matrix.

**Negative:**

- The first invocation downloads and caches a sizeable external npm package.
- The pinned guide set can become stale and requires deliberate review to upgrade.
- Agents must reconcile occasional upstream examples with local rules instead of copying them directly.
- Baseline Widely available is a feature-selection policy, not evidence that every browser has been tested.

**Neutral:**

- The skill changes agent implementation workflow, not Worker runtime behavior or the package dependency graph.
- Existing frontend design, visual style, security, Worker, and performance skills keep their current ownership.

## Alternatives Considered

### Install The Upstream Skill Unchanged

This preserves automatic updates and upstream activation, but it invokes a mutable package for routine frontend work, enables telemetry unless separately configured, and gives external guide language too much authority over local contracts.

### Vendor The Complete Guide Corpus

This improves offline availability but adds a large, fast-moving documentation and model snapshot to a template designed to stay lightweight and easy to prune.

### Consult Web Documentation Ad Hoc

This adds no local skill, but it depends on agents recognizing every relevant platform decision and finding a focused guide consistently. The pilot showed useful retrieval value beyond the existing design and performance workflows.

### Wait Until The Upstream Project Leaves Preview

This avoids near-term maintenance, but the scoped, pinned integration contains the preview risks while delivering immediate value to the template's browser-facing work.
