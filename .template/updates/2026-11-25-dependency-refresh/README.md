# Refresh the development toolchain

Apply this pack to the tools and capability kits your project already uses. It includes the Node 24.22.3 security release and updates the browser package and CI image together. [Node release notes](https://nodejs.org/en/blog/release/v24.22.3)

## Apply

1. Inspect `update.json` and try `git apply --check <path-to-pack>/patch.diff` in the target repository. If the patch fits, apply it. For a diverged project, use the pins below in its existing manifests, recipes and CI configuration.
2. Use Node `24.22.3` in `package.json` and `.nvmrc` where applicable. Update the npm hint to `11.21.3` and keep the supported npm 11 range.
3. Align `@playwright/test@1.65.1` with `mcr.microsoft.com/playwright:v1.65.1-noble`. Install the matching Chromium binaries for local tests.
4. Align Vitest and its V8 and Istanbul coverage providers at `5.1.2`. The Room State kit uses `@cloudflare/vitest-plugin@1.9.2` and Istanbul. Use the coverage provider for each target's test runtime.
5. Update the other adopted pins to `@types/node@24.19.4`, `fallow@3.48.0`, `oxlint@1.95.0`, `prettier@3.10.1` and `wrangler@4.168.0`. Regenerate the target's lockfile with its package manager and verify a clean install. Local CI `0.18.1` still requires the vendored DTU archive and scoped override described in [ADR-074](../../../docs/adrs/implemented/ADR-074-vendor-dtu-without-zod.md).
6. If the target uses the Modern Web Guidance skill, pin its search, retrieval and scan commands to `modern-web-guidance@1.0.2`. Keep telemetry and file logging disabled. Use English terms for searches. Copy the reviewed source revision and integrity into the target's existing skill provenance record. [Reviewed artifact](../../../specs/agent-skills/spec.md) · [Verification and instruction snapshot](../../../docs/adrs/implemented/ADR-072-adopt-modern-web-guidance-v1.md)
7. Record `2026-11-25-dependency-refresh` in the target's template update history after verification.

## Verify

- Run `npm run quality:gate`, `npm run ci:local` and `npm run diagnostics:codebase` where adopted.
- For the updated skill, run its validator and exercise search, retrieval, and a positive scanner fixture using a disposable npm cache as described in ADR-072.
- Run the screenshot tracing regression and full mobile and desktop Lighthouse audits in the matching Linux ARM64 image. Check that both reports contain screenshots. The template verified both Chromium executables and eight filmstrip frames in each audit. [Browser verification contract](../../../docs/adrs/implemented/ADR-068-verify-browser-screenshot-tracing.md)
- Run `npm audit` including development tooling. At publication the template reported six moderate development findings stemming from one minimatch advisory through Stryker and Local CI. The production audit was clean. [minimatch advisory](https://github.com/advisories/GHSA-g3hv-75wg-m249)
