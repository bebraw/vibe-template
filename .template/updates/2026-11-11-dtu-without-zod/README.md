# Remove DTU's Zod Dependency

Use this pack in npm-based projects using `run-local-ci@0.18.1`. It replaces that tool's `dtu-github-actions` dependency with the reviewed local archive, removing Zod from DTU's dependency graph. It does not suppress audit findings or resolve the separate `minimatch` advisory. Projects without Local CI should skip this pack; projects on a newer release should first check whether it already includes a compatible fix.

## Apply

1. Read `update.json`, [ADR-074](../../../docs/adrs/implemented/ADR-074-vendor-dtu-without-zod.md), and the [artifact provenance and rebuild instructions](../../../vendor/dtu-github-actions/README.md). Review the three-file vendor patch and verify the archive checksum.
2. Try `git apply --check <path-to-pack>/patch.diff` in the target checkout. Apply it if compatible; otherwise use the manual steps below. The patch includes the archive as a Git binary patch and deliberately omits the project-specific lockfile.
3. Copy the complete `vendor/dtu-github-actions/` directory before installing dependencies. Preserve its archive, patch, provenance, and license inside the archive. Merge this root dependency and scoped override into the target's package metadata, preserving other entries:

   ```json
   {
     "devDependencies": {
       "dtu-github-actions": "file:vendor/dtu-github-actions/dtu-github-actions-0.18.1-no-zod.tgz"
     },
     "overrides": {
       "run-local-ci@0.18.1": {
         "dtu-github-actions": "$dtu-github-actions"
       }
     }
   }
   ```

4. Copy `scripts/vendor-dtu.test.mjs` and include it in the target's existing tooling test gate. The template's `node --test scripts/*.test.mjs` already discovers it. Adapt the installed-package lookup if the target uses a different layout.
5. Record the temporary artifact target and removal condition in the target's architecture, quality spec, and operational docs. Preserve normal `npm ci` and Local CI commands; no postinstall patching hook is required.
6. Run `npm install` with the target's supported npm version to regenerate its lockfile, inspect the dependency changes, then run a clean `npm ci` and the listed checks. Record update ID `2026-11-11-dtu-without-zod` in the target's durable template-update record.

## Behavior And Scope

The archive starts from published DTU 0.18.1 and changes only `dist/config.js`, `dist/config.d.ts`, and the Zod dependency in `package.json`. It retains the published license and unrelated package files. Defaults, original URL strings, empty cache paths, and numeric coercion remain unchanged. Invalid configuration still fails during initialization, using a plain error for the first invalid field instead of aggregated Zod issues.

Keep the archive available in Docker build contexts and other clean-install inputs. Installations resolve the replacement through npm before executing the tool; `patch-package` would apply edits after resolution and leave the Zod dependency in the lockfile.

Keep the `$dtu-github-actions` root reference. With npm 11.21.2, putting the relative tarball path directly in the nested override can fail during migration from an existing registry-resolved lockfile because npm resolves it from the installed parent directory. The explicit root pin avoids manual lockfile editing and supports both migration and clean installation.

## Manual Fallback And Removal

Port the explicit DTU development dependency, scoped override, complete vendor directory, regression checks, and applicable documentation without replacing downstream package metadata or architecture wholesale. Do not downgrade a newer verified Local CI release to make this historical pack apply. Existing projects using another package manager must adapt dependency replacement deliberately rather than copying npm-only configuration.

When an upstream release removes the affected dependency with compatible behavior, verify that release through a clean install, the configuration cases, the full quality gate, and Local CI. Then remove the override, explicit DTU development dependency, vendor directory, and temporary DTU tests together, regenerate the lockfile, and update current documentation. Projects that remove Local CI should prune those pieces together. Keep historical ADRs and update packs as records.

## Verify

- Rebuild the archive using its documented recipe and compare its checksum before distributing a changed artifact.
- Run `node --test scripts/vendor-dtu.test.mjs`; the installed DTU and its lockfile entry must no longer declare Zod, and configuration cases must pass.
- Review `npm audit` with development dependencies included. Separate tool findings may remain and require their own assessment.
- Run `npm run quality:gate` and `npm run ci:local` using disposable fixtures.
- In the template checkout, run `node --test scripts/template-update-patches.test.mjs` and verify this pack applies to its pre-change base.
