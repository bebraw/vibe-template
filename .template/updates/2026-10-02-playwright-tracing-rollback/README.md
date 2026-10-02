# Restore The Verified Browser For Screenshot Tracing

Apply this correction when the `2026-10-02-dependency-refresh` browser pins have been adopted or are being adopted. It changes only that refresh's browser coordinates and adds a focused regression; retain its other compatible tooling updates.

## Failure

On a macOS ARM64 host's Linux ARM64 Local CI environment, Playwright `1.63.0`'s Chromium `153.0.8010.12` crashes its GPU process during DevTools screenshot tracing. Both the headless shell and full Chromium fail on an in-memory HTML page. Tracing without the screenshot category completes, but disabling screenshots does not verify a full Lighthouse performance audit.

The preceding Playwright `1.62.1` browser, Chromium `151.0.7922.34`, collects screenshot trace events and completes full Lighthouse `13.5.0` mobile and desktop audits in the same environment.

## Apply

1. Pin the existing `@playwright/test` dependency to `1.62.1`, then regenerate the target's own lockfile. For npm, use `npm install --save-dev --save-exact @playwright/test@1.62.1`.
2. Change the existing browser CI image to `mcr.microsoft.com/playwright:v1.62.1-noble`, preserving the target's workflow and image-digest policy. Install the matching local browsers through the target's existing browser-install command.
3. If retained, update current capability manifests and recipes to the same browser version. Keep Lighthouse `13.5.0`, Chrome launcher `1.2.2`, and the other dependency refreshes.
4. Copy or adapt `src/browser-tracing.e2e.ts` into the target's existing Playwright test suite. Ensure its `testMatch` includes the test. It exercises both Chromium executables on an in-memory page and requires real screenshot trace events, without saved trace files or an external URL.
5. Document the retained browser pin and verification requirement in the target's existing development and quality-gate documentation. [ADR-068](../../../docs/adrs/implemented/ADR-068-verify-browser-screenshot-tracing.md) records the template's rationale.

## Fallback

Port these changes manually when the patch does not match the target's paths. Preserve package-manager, workflow, report, and application conventions. A target already retaining `1.62.1` only needs the applicable documentation and regression coverage. Do not downgrade a newer browser that has passed the same Linux ARM64 tracing and full-audit checks.

## Verify

- Run the new Playwright screenshot-tracing cases in the matching Linux ARM64 image. Both must pass with screenshot events present.
- Run full mobile and desktop Lighthouse audits in that image with screenshots enabled and the target's normal budgets. The template uses `LIGHTHOUSE_URL=<target-url> npm run lighthouse`; preserve the target's existing audit command and authentication setup.
- Run the full dependency audit, normal quality gate, and Local CI workflow. Do not treat ordinary browser tests alone as validation for another browser refresh.
- Record this correction's update ID alongside the dependency refresh. An adopter that recorded the refresh as partial because of this crash can mark it complete once the corrected pins and its required checks pass.
