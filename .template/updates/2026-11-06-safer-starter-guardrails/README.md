# Preserve Local Hooks and Protect Environment Files

Apply this pack to projects that adopted the template's affected guardrails or hook setup. Review the patch before applying it; adapt it to the target's existing Git hooks and environment-file conventions.

## Apply

1. Ignore `.dev.vars*` and `.env*` local files, retaining explicit exceptions for example files the target intentionally commits. Existing tracked files remain tracked; inspect them separately for secrets.
2. Update the hook installer to preserve any different effective `core.hooksPath`, including inherited configuration, and warn that the repo-managed hook needs integration. Do not overwrite or automatically chain another hook manager. Apply the capability-kit copy only if that kit is maintained in the target.
3. If the target uses the template's affected-file helper, make a first push to a new remote branch consider the tracked files in the pushed tree rather than only the tip commit. Reject a different checked-out commit or missing tracked workspace files that cannot be safely checked. Preserve special characters in Git paths and retain the normal remote-to-local diff for existing branches.
4. Update the target's documentation and applicable specs to describe the conditional hook setup. The source template's [ADR-070](../../../docs/adrs/implemented/ADR-070-preserve-existing-git-hook-configuration.md) records the trade-off; use the target's own decision process and numbering.
5. Bring over or adapt the source repository's `scripts/affected-file-utils.test.mjs`, `scripts/affected-file-paths.test.mjs`, and `scripts/setup-git-hooks.test.mjs` where their fixtures match the target. The hook test covers both the root installer and the optional kit copy; omit or adapt the latter when the kit is absent.

## Fallback

Port the applicable changes manually if the patch does not apply, preserving target-specific examples, hook managers, and verification commands. No new hook manager or dependency is required.

## Verify

- Confirm local environment secret variants are ignored and intended examples remain addable.
- Exercise hook setup with both unset and different existing `core.hooksPath` values.
- Test a first push containing at least two commits and confirm files from both are considered.
- Run the target's quality gate and installation-sensitive local CI.
