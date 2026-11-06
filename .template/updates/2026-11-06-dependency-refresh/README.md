# Refresh Compatible Dependencies

Use this pack to refresh tooling already adopted from the template or its capability kits. Coordinate the Vitest major version with its coverage provider and the Cloudflare Worker test plugin. Regenerate the target project's lockfile instead of copying the template lockfile.

## Apply

1. Update only packages the target already uses:

   | Package                               | Version   |
   | ------------------------------------- | --------- |
   | `@playwright/test`                    | `1.65.0`  |
   | `@stryker-mutator/core`               | `10.1.1`  |
   | `@stryker-mutator/typescript-checker` | `10.1.1`  |
   | `@stryker-mutator/vitest-runner`      | `10.1.1`  |
   | `@tailwindcss/cli` and `tailwindcss`  | `4.3.4`   |
   | `@types/node`                         | `24.19.2` |
   | `@vitest/coverage-v8` and `vitest`    | `5.1.0`   |
   | `chrome-launcher`                     | `1.2.3`   |
   | `fallow`                              | `3.40.0`  |
   | `lighthouse`                          | `13.6.0`  |
   | `oxlint`                              | `1.92.0`  |
   | `prettier`                            | `3.9.10`  |
   | `wrangler`                            | `4.158.0` |

2. For the Room State kit, update `@cloudflare/vitest-plugin` to `1.6.0`, `@vitest/coverage-istanbul` to `5.1.0`, and `vitest` to `5.1.0` together. Retain Istanbul for Worker-runtime coverage; do not reintroduce the retired Workers pool or V8 coverage there.
3. Update matching capability manifests and installation recipes, including Quality Gate, Room State, Workers AI, Mutation Testing, TypeScript Setup, and Lighthouse Performance where adopted.
4. Update the Playwright CI image to `mcr.microsoft.com/playwright:v1.65.0-noble` and install the matching browser binaries. Playwright `1.65.0` passed screenshot tracing and full mobile and desktop Lighthouse audits with screenshots enabled in a Linux ARM64 container on the template's macOS ARM64 host. Retain the existing Node, npm, Local CI, TypeScript, and YAML pins unless the target separately reviews an update.
5. Install dependencies using the target's existing package manager and review the resulting lockfile and audit findings.

The template's full audit after compatible fixes reported seven remaining development dependency findings: four moderate findings involving `minimatch` `10.2.6` through Stryker and Local CI, and three high findings involving `zod` `3.25.76` through Local CI and `dtu-github-actions`. npm reported no compatible fix available at the time of this refresh. Recheck the target's audit and upstream fixes rather than assuming the same findings or forcing a breaking update.

## Fallback

Preserve the target's package manager, scripts, workflow names, and application stack. Port the adopted pins and coordinated testing changes manually if the patch does not apply. This pack does not adopt new capabilities or authorize unrelated changes.

Historical packs record earlier pins. Do not use them to downgrade a newer verified target.

## Verify

- Run the full dependency audit, including development tooling.
- Run `npm run quality:gate` and `npm run ci:local`, adapted to the target's commands.
- Verify adopted capability kits, including Worker-runtime coverage and mutation testing where applicable.
- Confirm the Playwright package and CI image match; run screenshot-tracing checks and full mobile and desktop Lighthouse audits with screenshots enabled in the matching Linux ARM64 image.
