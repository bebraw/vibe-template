# Refresh Compatible Dependencies

Use this pack for a project that already adopted the template's tooling or capability kits. The patch coordinates exact pins and the Playwright CI image; regenerate the adopter's own lockfile instead of copying the template lockfile.

## Apply

1. Pin Node to `24.21.0` in `package.json` and mirror `v24.21.0` in `.nvmrc`. Update the package-manager hint to `npm@11.21.0` while retaining the supported npm 11 range; CI can continue using a compatible bundled npm release.
2. Update only tooling already adopted by the target:

   | Package                                                  | Version   |
   | -------------------------------------------------------- | --------- |
   | `@playwright/test`                                       | `1.63.0`  |
   | `@types/node`                                            | `24.19.1` |
   | `chrome-launcher`                                        | `1.2.2`   |
   | `fallow`                                                 | `3.31.0`  |
   | `lighthouse`                                             | `13.5.0`  |
   | `oxlint`                                                 | `1.86.0`  |
   | `prettier`                                               | `3.9.9`   |
   | `wrangler`                                               | `4.146.0` |
   | `yaml`                                                   | `2.9.1`   |
   | `@cloudflare/vitest-plugin`, if using the Room State kit | `1.3.5`   |

3. Keep Vitest and its coverage providers at `4.1.11`. The reviewed Cloudflare testing plugin requires `^4.1.0`; do not mechanically adopt Vitest 5. Retain the TypeScript 6 compiler-API compatibility package and TypeScript 7 typecheck alias.
4. Update existing capability manifests and installation recipes. Change the browser CI image to `mcr.microsoft.com/playwright:v1.63.0-noble` and install the corresponding browser binaries with `npm run playwright:install`.
5. Run the target package manager's dependency installation and review compatible transitive fixes. The npm template uses `npm audit fix --ignore-scripts` without `--force` or dependency overrides. Patched paths include `@grpc/grpc-js` `1.14.5`, `brace-expansion` `5.0.12`, `fast-uri` `3.1.8`, and `qs` `6.16.0`; Wrangler resolves patched Sharp and Undici versions through Miniflare.
6. If Modern Web Guidance is adopted, review [ADR-067](../../../docs/adrs/implemented/ADR-067-refresh-reviewed-web-guidance.md), pin both telemetry-disabled commands to `0.0.191`, and copy the current instruction revision, source tag/commit, and npm integrity into the target's owned provenance record. Preserve narrow routing, local authority, and Baseline fallback policy.

## Fallback

Preserve the target's package manager, scripts, workflow names, and application stack. Port adopted pins manually when the patch does not apply. Dependency approvals remain necessary when a target has not authorized maintenance; this pack does not adopt new capabilities.

The repository is the authority for current pins. Historical update packs retain their original coordinates and should not downgrade a newer verified target.

## Verify

- Run the full dependency audit, including development tooling.
- Validate the changed web-guidance skill and review its UI metadata if copied.
- Run `npm run quality:gate` and `npm run ci:local`, adapted to the adopter's commands.
- Confirm the browser image matches the Playwright package and Worker capability tests still use compatible Vitest and coverage versions.
