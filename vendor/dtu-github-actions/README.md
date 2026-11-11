# Patched DTU package

`dtu-github-actions-0.18.1-no-zod.tgz` is a temporary replacement for the DTU dependency of `run-local-ci@0.18.1`. The package keeps its upstream name and version; the filename and lockfile integrity identify the local patch. A root development dependency anchors the relative tarball path, and a scoped override makes Local CI use that same package:

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

The reference avoids an npm 11.21.2 path-resolution issue when a nested `file:` override replaces an existing registry dependency. Local CI and the root pin resolve to one installed DTU package; downstream projects can use ordinary installs without manually editing lockfile entries.

[patch.diff](./patch.diff) changes exactly three published files:

- `dist/config.js`: replace Zod with scalar environment checks, preserving defaults, URL validation, and numeric coercion. Invalid values now throw ordinary field-specific errors.
- `dist/config.d.ts`: describe the same configuration fields without Zod types.
- `package.json`: remove the Zod dependency.

All other published files, including `LICENSE`, remain byte-identical. This removes the Local CI → DTU → Zod dependency path reported by [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5). DTU uses Zod only for scalar startup configuration, not collection validation. This patch does not address the separate Minimatch advisory or change DTU's network behavior.

## Provenance

Prepared on 2026-11-11 from the published package, not a rebuild of upstream main:

- Original: [npm tarball for `dtu-github-actions@0.18.1`](https://registry.npmjs.org/dtu-github-actions/-/dtu-github-actions-0.18.1.tgz).
- Published release tag: [`dtu-github-actions@0.18.1`](https://github.com/redwoodjs/local-ci/releases/tag/dtu-github-actions%400.18.1), resolving to [`a8db59493b883d642c07c89be537c7572d3ff965`](https://github.com/redwoodjs/local-ci/tree/a8db59493b883d642c07c89be537c7572d3ff965/packages/dtu-github-actions).
- Reviewed upstream source base: [`c8597bb695a4cab84002f5977dd22ec56156cbab`](https://github.com/redwoodjs/local-ci/tree/c8597bb695a4cab84002f5977dd22ec56156cbab/packages/dtu-github-actions). The source contribution was prepared and tested but remains unsubmitted; the included patch is authoritative for this artifact.
- Original npm integrity: `sha512-BoK1sWdcOMKq58aGaChMbEMhrOJ+2ZPvlvASFXFkduq++6k/ZYi5c9RXaeLXcuTRZDOj/5lvJR4+j93+BXepSw==`.
- Original SHA-256: `c7f47336e6c7caf4411699df4d7f42f8a3806b0770b51178499bdf3a30328928`.
- Patched SHA-256: `2fbeca1fac1432b0a1d1e314521cdf4456a398a084e43b939c1f70a1cdf9f97b`.
- Patched npm integrity: `sha512-pC77pO6nw0n6wsTScZoDLW2fm1H/urLQKmSs8rEFTNJYIlwDlgiBf8cJHiiNraIdYEen5c4tGgjEmERtvXMgxg==`.
- License: upstream `FSL-1.1-MIT`; the complete published `LICENSE` remains inside the tarball.

## Reproduce

Use Node **24.22.2** and npm **11.21.2**, and run from the repository root. The commands download the original package, verify its checksum, apply the reviewable patch, and compare the regenerated archive with the committed artifact. All generated files and the npm cache stay in the temporary directory printed at the end. No lifecycle scripts run.

```sh
set -eu
dtu_vendor_dir="$PWD/vendor/dtu-github-actions"
dtu_build_dir="$(rtk proxy mktemp -d "${TMPDIR:-/tmp}/dtu-no-zod.XXXXXX")"
rtk proxy mkdir "$dtu_build_dir/download" "$dtu_build_dir/package" "$dtu_build_dir/output"

rtk proxy npm pack dtu-github-actions@0.18.1 --ignore-scripts \
  --pack-destination "$dtu_build_dir/download" --cache "$dtu_build_dir/npm-cache"
rtk proxy shasum -a 256 -c <<EOF
c7f47336e6c7caf4411699df4d7f42f8a3806b0770b51178499bdf3a30328928  $dtu_build_dir/download/dtu-github-actions-0.18.1.tgz
EOF
rtk proxy tar -xzf "$dtu_build_dir/download/dtu-github-actions-0.18.1.tgz" \
  -C "$dtu_build_dir/package" --strip-components=1
rtk proxy git -C "$dtu_build_dir/package" apply --check "$dtu_vendor_dir/patch.diff"
rtk proxy git -C "$dtu_build_dir/package" apply "$dtu_vendor_dir/patch.diff"
(
  cd "$dtu_build_dir/package"
  rtk proxy npm pack --ignore-scripts --pack-destination "$dtu_build_dir/output" \
    --cache "$dtu_build_dir/npm-cache"
)
rtk proxy cmp "$dtu_build_dir/output/dtu-github-actions-0.18.1.tgz" \
  "$dtu_vendor_dir/dtu-github-actions-0.18.1-no-zod.tgz"
rtk proxy shasum -a 256 "$dtu_build_dir/output/dtu-github-actions-0.18.1.tgz"
rtk proxy printf '%s\n' "$dtu_build_dir"
```

Regeneration is byte-identical with that toolchain. Both archives contain the same 31 files; only the three files listed above differ in content. The patched runtime passed an isolated production install and public ephemeral-server smoke check without Zod. The root tarball pin and scoped reference passed existing-install migration, repeated `npm install`, and `npm ci`, including relocation to a different directory.

## Adopt or refresh

When changing the artifact, review its patch and provenance, use a new descriptive archive filename, and update the root development dependency to that path. This gives npm a fresh cache identity. Run `npm install` to update the committed lockfile and its tarball integrity before testing `npm ci`; do not replace the bytes of an existing archive while keeping a stale lockfile.

```sh
rtk proxy npm install
rtk proxy npm ci
rtk proxy node --test scripts/vendor-dtu.test.mjs
rtk proxy npm run quality:gate
rtk proxy npm run ci:local
```

Use the repository's [Local CI skill](../../.codex/skills/local-ci/SKILL.md) for workflow execution and paused-runner retries. Keep the tarball, patch, provenance, dependency declarations, and lockfile in the same change.

## Remove when upstream catches up

Once a released Local CI/DTU combination removes the Zod dependency while preserving compatible configuration behavior, upgrade to it and remove the root DTU pin, scoped override, this directory, and temporary patch-specific verification. Regenerate the lockfile, verify a clean `npm ci` and the Local CI workflow, and confirm the DTU → Zod audit path remains absent. Do not carry this patch forward to another upstream version without reviewing that release.
