---
name: modern-web-guidance
description: Retrieve pinned, Baseline-aware browser guidance for platform choices and fallbacks, or scan for legacy patterns during an explicit modernization audit.
---

# Modern Web Guidance

Use focused web-platform guidance as implementation input while keeping repository architecture, specs, source conventions, and verification authoritative.

## Retrieve

Search for one browser capability with a short action-oriented query (for example, "light dismiss dialog"). Omit framework and application names; split distinct concerns into separate queries. If results are weak, rephrase once with the concrete UI or platform term.

```bash
DISABLE_TELEMETRY=1 ENABLE_FILE_LOGGING=false npx -y modern-web-guidance@1.0.0 search "<query>"
```

Retrieve only the most relevant guide IDs:

```bash
DISABLE_TELEMETRY=1 ENABLE_FILE_LOGGING=false npx -y modern-web-guidance@1.0.0 retrieve "<id>"
```

Multiple IDs are appropriate only when the task crosses distinct concerns. Do not retrieve unrelated guides to fill a search gap. When retrieval returns an operating-system temporary file path, read the complete guide there before applying it.

If the pinned package is unavailable or the topic is uncovered, use current primary web-platform documentation and state the fallback; never substitute a moving version or enable telemetry. Keep file logging disabled. Do not run upstream installation, update, or configuration commands over this adapted skill. Normal invocations use npm's existing cache and may create temporary guide files; use a disposable npm cache for upgrade verification, with no repository reports or configuration files.

## Modernization Audit

Use the scanner only for an explicit broad modernization or legacy-pattern audit of a repository or directory. For a specific feature or component, use focused retrieval instead.

```bash
DISABLE_TELEMETRY=1 ENABLE_FILE_LOGGING=false npx -y modern-web-guidance@1.0.0 legacy-scan "<path>" --json
```

Inspect each candidate in context against its `keepWhen` / `dropWhen` rubric. Drop false positives, vendor code, and intentional fallbacks. Report verified findings and the intended changes; an audit-only request stops at the report. When modernization is authorized, retrieve the finding's guide with the pinned command above (not the unpinned `retrieveCommand` emitted in JSON), preserve browser fallbacks, implement within scope, and rerun the scan plus relevant project checks.

The scanner covers only a subset of guides and skips docs and tests by default. No findings is not a comprehensive audit, and exit status 0 does not mean no findings. Do not add it as a CI gate or change safe code merely to clear retained matches.

## Missing Browser Types

When a justified browser API lacks TypeScript declarations, consider [modern-web-types](https://philipwalton.com/articles/modern-web-types/) as an opt-in alternative to handwritten declarations or type suppression. It is not a default template dependency. Before adoption, read its current installation documentation, obtain dependency approval, pin the reviewed version, and verify library replacement with the project’s active TypeScript toolchains. Keep adoption scoped to browser typing; do not replace Cloudflare runtime types. Available declarations do not establish browser support: preserve feature detection and the usable fallback required below.

## Apply

- Use Baseline Widely available features for core behavior unless the project records a narrower target.
- Treat newer features as progressive enhancements with a usable core path.
- Prefer feature detection and small local fallbacks; ask before adding a polyfill or dependency.
- Adapt retrieved examples to the typed-client boundary in `ARCHITECTURE.md`; never restore inline handlers or scripts.
- Treat Chromium Playwright or Lighthouse output as Chromium evidence, not cross-browser proof.
- Use `frontend-design` for visual direction, `minimal-visual-style` for the starter's visual language, and `web-perf` for measured performance diagnosis.

Skip this skill for copy-only work, routine changes that apply established repository patterns, backend-only Worker code, CI, and general tooling.

Provenance and current package coordinates are recorded in `docs/adrs/implemented/ADR-072-adopt-modern-web-guidance-v1.md` and `specs/agent-skills/spec.md`; `ADR-052` records the original scoped integration.
