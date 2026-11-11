# Modern Web Guidance 1.0

## Applies To

Projects that adopted the template's scoped Modern Web Guidance skill. This pack upgrades its reviewed CLI from `0.0.191` to `1.0.0`, improves focused retrieval, and adds explicit broad modernization audits. It adds no application dependency, CI gate, repository reports, or tool configuration. Node `>=22` is required.

This replaces only the Modern Web Guidance coordinates from `2026-10-02-dependency-refresh`; that pack's unrelated dependency changes remain separate. Preserve the original integration's adjacent Apache-2.0 license.

## Apply

1. Read `update.json` and inspect `patch.diff`. Try `git apply --check <path-to-pack>/patch.diff` in the target repository, then apply it if it fits. Do not run upstream `install` or `update` over the adapted skill.
2. Pin search, retrieval, and scanning to `modern-web-guidance@1.0.0`, with `DISABLE_TELEMETRY=1` and `ENABLE_FILE_LOGGING=false` on every invocation. Keep repository contracts and the existing browser policy authoritative.
3. Adopt focused capability queries, one rephrasing attempt for weak results, and complete reading of temporary guide output. Continue to skip unrelated guides and use primary documentation when needed.
4. Route explicit broad modernization or legacy-pattern audits to `legacy-scan <path> --json`. Check `keepWhen` / `dropWhen` before reporting candidates. Audit-only requests do not authorize code edits. Authorized modernization uses the pinned retrieval command, preserves fallbacks, and runs relevant checks plus a rescan. Ignore the unpinned `retrieveCommand` emitted in JSON.
5. Keep component-specific work on focused retrieval. Document that scan coverage is limited, docs and tests are skipped by default, and exit code zero is not a clean-audit result. Do not change safe fallback code just to clear findings.
6. Record the new artifact and instruction coordinates from [ADR-072](../../../docs/adrs/implemented/ADR-072-adopt-modern-web-guidance-v1.md) in the target's existing spec and ADR structure. Use its next available ADR number and update links. Record update ID `2026-11-11-modern-web-guidance-v1` in its existing template-update record.

## Manual Fallback

If the target has diverged, port the skill, routing, browser-policy boundaries, and provenance into its equivalent existing documents. Preserve target-specific conventions and ADR history. Do not replace the target's complete `AGENTS.md`, architecture, README, or skill spec with the template files.

Normal commands reuse npm's existing cache; large retrieved guides may be written to operating-system temporary files. Keep file logging disabled and avoid repository reports or `.mwgrc`. Use a disposable npm cache for upgrade verification. Temporary smoke fixtures are not a new repository write target.

## Verify

- Run the skill validator, review `agents/openai.yaml` separately, and run the target's formatter. Confirm all three commands carry the reviewed pin and both environment controls.
- Compare registry metadata and the downloaded artifact with the recorded source commit and npm integrity. Keep the published instruction revision distinct from the executable source revision.
- With a disposable npm cache, exercise search, retrieval, and `legacy-scan` using the skill's commands. A disposable HTML fixture containing `input:invalid { border: 2px solid red; }` should return the `validate-input-after-interaction` guide and its verification rubric. Read complete retrieved guides when returned via temporary paths.
- Scan the intended browser source directory and review findings in context. Verify that the commands leave repository files unchanged. The template's own `src` scan returned zero findings; this is not a comprehensive audit and does not predict an adopter's result.
- Run `node --test scripts/template-update-patches.test.mjs` in the template checkout. Confirm patch applicability separately with `git apply --check` in the target. Run `npm run quality:gate` for the workflow update, or the target's equivalent checks. Local CI is needed only if adaptation also changes a workflow-sensitive boundary.

This pack changes agent guidance. Application refactors discovered during an audit retain the target's normal implementation, spec, and verification requirements.
