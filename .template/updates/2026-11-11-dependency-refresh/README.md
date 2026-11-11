# Refresh Compatible Dependencies

Use this pack to refresh the toolchain and dependencies already adopted from the template. It retains Node 24, npm 11, the TypeScript compiler/API split, the existing browser test versions, and the current Worker compatibility date. Regenerate the target's lockfile with its own package manager instead of copying the template's lockfile.

## Apply

1. Read `update.json`, inspect `patch.diff`, and try `git apply --check <path-to-pack>/patch.diff` in the target repository. Apply the patch if it fits the target; otherwise follow the manual steps below.
2. Update the toolchain and packages already in use:

   | Package or tool                      | Version   |
   | ------------------------------------ | --------- |
   | Node                                 | `24.22.2` |
   | npm package-manager hint             | `11.21.2` |
   | `tailwindcss` and `@tailwindcss/cli` | `4.3.5`   |
   | `fallow`                             | `3.42.0`  |
   | `oxlint`                             | `1.93.0`  |
   | `wrangler`                           | `4.160.0` |
   | `@cloudflare/vitest-plugin`          | `1.7.0`   |

3. Keep the exact Node version in `package.json` and mirror `v24.22.2` in `.nvmrc`. Retain `engines.npm` as `>=11 <12`; CI may use the supported npm release bundled with Node rather than self-upgrading to the package-manager hint.
4. Change every adopted `actions/setup-node` reference to `949feb2413d6458794dcd2491c4babbbce0c15c1` (`v7.1.0`). Keep `node-version-file: package.json`, explicit cache configuration, and full commit pins. The checkout and cache actions remain unchanged.
5. For the Room State kit, update the plugin in its manifest and installation recipe. Keep `vitest`, `@vitest/coverage-v8`, and `@vitest/coverage-istanbul` aligned at `5.1.0` where used. The Worker runtime still requires Istanbul coverage. Plugin `1.7.0` supports Vitest 4.1 and 5; it also starts Containers declared in the target's Wrangler configuration and requires Docker for those tests. The template kit declares none. If a target deliberately tests without its Containers, it can set `dev.enable_containers` to `false`; do not disable behavior that its tests rely on.
6. Preserve the `typescript` alias to `@typescript/typescript6@6.0.2`, the `typescript-7` alias to `typescript@7.0.2`, and Node 24 types at `24.19.2`. Playwright `1.65.0` and its matching `v1.65.0-noble` CI image remain aligned. This update does not adopt Fallow's new mutation workflow or replace Stryker.
7. Install dependencies with the target's existing package manager, review the regenerated lockfile, run the listed checks, and record update ID `2026-11-11-dependency-refresh` in its existing template-update record.

## Rationale And Compatibility

- [Fallow 3.42.0](https://github.com/fallow-rs/fallow/releases/tag/v3.42.0) fixes writes through symlinks outside the project and improves parser robustness and diagnostic accuracy. Keep the template's advisory commands and `--no-cache` behavior.
- [Tailwind 4.3.5](https://github.com/tailwindlabs/tailwindcss/releases/tag/v4.3.5) fixes CSS parsing, color fallbacks, source scanning, and type declarations. [Oxlint 1.93.0](https://github.com/oxc-project/oxc/releases/tag/oxlint_v1.93.0) includes correctness and false-positive fixes.
- [Wrangler 4.159.0](https://github.com/cloudflare/workers-sdk/releases/tag/wrangler@4.159.0) raises its Node requirement to `>=22.12.0`, which the maintained Node 24 baseline satisfies. [Wrangler 4.160.0](https://github.com/cloudflare/workers-sdk/releases/tag/wrangler@4.160.0) includes diagnostic header redaction and updated runtime dependencies. The [Worker test plugin release](https://github.com/cloudflare/workers-sdk/releases/tag/@cloudflare%2Fvitest-plugin@1.7.0) uses the corresponding Wrangler and Miniflare releases.
- [Node 24.22.2](https://nodejs.org/en/blog/release/v24.22.2) and [npm 11.21.2](https://github.com/npm/cli/releases/tag/v11.21.2) refresh the existing supported lines. [setup-node 7.1.0](https://github.com/actions/setup-node/releases/tag/v7.1.0) improves version validation and release-manifest retries.

The audit before this update still reported seven development dependency findings: four moderate findings involving `minimatch` through Stryker and Local CI, and three high findings involving `zod` through Local CI and `dtu-github-actions`. The reviewed latest releases of those tools provide no compatible forward fix. Recheck the target after installation; do not use npm's proposed Stryker downgrade or force major transitive overrides as part of this pack.

## Manual Fallback

Preserve the target's package manager, scripts, workflow names, capability choices, and application stack. Port only the applicable pins, Room State installation note, and toolchain metadata. Existing projects with a different Node or npm support policy should review the version choices against that policy. Historical update packs retain their original coordinates and must not downgrade a newer verified target.

## Verify

- Confirm the active Node version matches `package.json`, `.nvmrc` agrees, and npm satisfies the existing npm 11 constraint.
- Run `npm audit`, including development tooling, and review remaining findings explicitly.
- Run `npm run quality:gate` and `npm run ci:local`. The quality gate verifies disposable capability adopters, including Room State and the combined Worker. Keep remote production resources out of these checks.
- Run `npm run diagnostics:codebase` to exercise the updated Fallow commands; its findings remain advisory and do not authorize unrelated cleanup.
- Run `node --test scripts/template-update-patches.test.mjs` in the template checkout and check patch applicability separately in the target tree.

No browser package or image changes in this pack. If an adopter also refreshes them, follow the existing screenshot-tracing and full Lighthouse verification requirement for that separate change.
