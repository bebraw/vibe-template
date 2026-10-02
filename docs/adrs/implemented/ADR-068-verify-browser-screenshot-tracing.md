# ADR-068: Verify Browser Screenshot Tracing

**Status:** Implemented

**Date:** 2026-10-02

## Context

The dependency refresh distributed Playwright `1.63.0` and its matching Noble image after ordinary browser tests passed. A downstream report identified a crash during Lighthouse screenshot tracing on the supported macOS ARM64 host's Linux ARM64 Local CI container.

The minimal reproduction fails on both Chromium `153.0.8010.12` executables: the default headless shell and the full Chromium used by Lighthouse. GPU processes exit with signal 4 when `disabled-by-default-devtools.screenshot` tracing is enabled. An in-memory HTML page also triggers the crash, independent of application code, network access, or Lighthouse. Removing only the screenshot category lets tracing finish.

## Decision

Restore Playwright `1.62.1` and the matching `v1.62.1-noble` image across the root project and current capability manifests and recipes. Retain Lighthouse `13.5.0` and the other compatible dependency refreshes.

Add screenshot-tracing regression coverage to the existing browser gate. Both bundled Chromium executables must finish a DevTools trace containing screenshot image events. Keep the test page and trace in memory, using existing Playwright failure outputs.

Require this regression and full mobile/desktop Lighthouse audits with screenshots enabled in the matching Linux ARM64 image before distributing a future browser refresh. This is a browser maintenance check; Lighthouse remains an explicit audit command rather than an unconditional application CI budget.

Publish a focused correction pack for existing adopters and flag the original refresh guide's browser coordinates as historical.

## Trigger

The downstream report's reproduction also crashes the template's refreshed browser. Playwright `1.62.1`'s Chromium `151.0.7922.34` passes the regression and completes full Lighthouse audits on the same environment.

## Consequences

- **Positive:** browser pins support screenshot tracing used by performance audits, and the browser gate detects this failure before future refreshes.
- **Negative:** Playwright stays on the preceding release, and the browser gate takes about ten extra seconds for the two tracing cases.
- **Neutral:** no dependency, application behavior, report directory, or separate CI job is added; full Lighthouse verification remains explicit during browser maintenance.

## Alternatives Considered

### Keep Playwright 1.63.0 Because Ordinary Browser Tests Pass

Those tests miss the DevTools screenshot category that crashes Chromium and closes Lighthouse's Chrome session.

### Disable Screenshot Tracing

That avoids the observed trigger but removes data needed by the full performance audit. It provides diagnostic evidence, not a verified browser refresh.

### Maintain Separate Browsers For Lighthouse And Playwright

This would introduce a second browser installation and version contract. A coordinated rollback preserves the existing single pinned browser toolchain while an upstream fix is awaited.
