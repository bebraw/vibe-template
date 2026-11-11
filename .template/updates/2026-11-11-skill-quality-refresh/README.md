# Skill Quality Refresh

## Applies To

Projects using the template's focused `test-review`, `debug`, or `wrangler` skills, including adopters of the Engineering Quality Skills kit. This update changes agent guidance only; it adds no dependencies, CI steps, persistent output, or account operations.

## Apply

1. Read `update.json` and inspect `patch.diff`. Try `git apply --check <path-to-pack>/patch.diff` in the target repository, then apply it when it fits.
2. Merge test-review guidance for unexplained weakened checks, negative tests that stop at the wrong guard, and isolation from real user state and services. Review the rationale and replacement evidence before reporting lost protection as `Restore`; preserve target-specific severity conventions.
3. Merge debug guidance to check the declared runtime and toolchain before blaming source. Prove the regression guard rejects the original failure and accepts the fix; allow a lint or configuration guard when it is the appropriate boundary.
4. For Wrangler adopters, document that `secret put/delete` deploy immediately while `versions secret put/delete` stage a version. Confirm current Cloudflare semantics and the environment before acting; retain the target's authorization and promotion workflow. Applying this pack does not change any secret.
5. Update `test-review` and `debug` provenance to `cniska/skills` revision `2c83858f1d801369355a761ce3ba9b492f5c642f`. Leave `correctness-review` at `7d79c7754f2b9d656f7db7b9ecefcb7532b6d256`; preserve all adjacent MIT licenses. Keep intentional distribution copies synchronized.
6. Record the workflow changes in the target's skill contract and ADR structure. Adapt [ADR-073](../../../docs/adrs/implemented/ADR-073-refresh-review-and-debug-guidance.md) to the next available ADR number and update its links. Record `2026-11-11-skill-quality-refresh` in the existing template-update record.

## Manual Fallback

Port only the selected skill changes and their existing copies when target files have diverged. Preserve stronger local guidance, established labels, verification commands, and durable documentation structure. Do not install upstream companion skills or replace the complete target skill specification.

## Verify

- Run the target's skill validator for each changed skill and its formatter. In this template use `npm run skill:validate -- .codex/skills/<name>` for `test-review`, `debug`, and `wrangler`.
- Compare canonical skills with any intentional GitHub or capability-kit copies. Check each skill's own source revision and license instead of assuming all three engineering skills share one revision.
- Review scenarios where a check was weakened, a negative fixture hits an earlier guard, a test reads real user state, or the active runtime differs from the project pin. Confirm the instructions demand evidence rather than automatic findings or arbitrary source changes.
- Verify the immediate-versus-staged secret distinction against [current Cloudflare documentation](https://developers.cloudflare.com/workers/configuration/secrets/) without running an account mutation.
- In the template checkout, run `node --test scripts/template-update-patches.test.mjs` and `npm run quality:gate`. Check applicability separately with `git apply --check` in the target. Local CI is required only when the adaptation also changes a workflow-sensitive boundary.
