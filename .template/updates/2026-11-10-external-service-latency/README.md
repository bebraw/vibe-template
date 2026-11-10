# External-Service Latency Contracts

## Applies To

Projects based on `vibe-template` that use, or plan to use, external services. This documentation update makes output quality, latency, and reliability explicit acceptance criteria and adds privacy-safe request/stage timing guidance. It also applies to projects using the optional Workers AI kit; an adapter timeout alone does not establish a complete request deadline or acceptable user-perceived latency.

No runtime code, package dependency, telemetry service, paid CI call, or new persistent output path is introduced. Existing feature budgets and implementation choices remain application owned. Model selection, token limits, streaming, caching, and a possible future shared timing helper are outside this update.

## Apply

1. Read `update.json` and inspect `patch.diff`.
2. From the target repository root, run `git apply --check <path-to-pack>/patch.diff`. If clean and appropriate for the target's documentation, run `git apply <path-to-pack>/patch.diff`.
3. Adapt the global rule and specification guidance to the target's existing architecture and spec locations. Extend the feature template with numerical latency criteria, measurement boundaries, dependency timeouts, a complete request deadline, user-visible over-budget behavior, reliability targets, and timing evidence.
4. Add the evaluation and operational guidance to the existing development or operations document. Keep total and stage timings comparable, account for overlapping calls and retries, and allowlist timing fields without content or personal data.
5. Review each applicable feature spec against the new guidance. Fill in product-specific budgets and representative evaluation evidence; do not treat template placeholders or the illustrative timing record as chosen limits. Track unmet criteria explicitly. Applying documentation alone does not implement or verify request deadlines or instrumentation in an existing application.
6. Record the decision with the target's next available ADR number and update its index and links. Record update ID `2026-11-10-external-service-latency` in the target's existing template-update record.

## Manual Fallback

If the patch does not apply cleanly, port the guidance into the equivalent existing documents instead of replacing project files. Preserve feature contracts, operational conventions, existing budgets, and ADR numbering. The new contract belongs in each applicable feature spec; copy only the relevant fields from `specs/feature-template/spec.md`, never its generic placeholders over an implemented feature.

Keep expected latency distinct from a hard deadline. Each dependency attempt and retry must fit within the remaining request deadline, and the interaction must define what happens when either the target or a hard limit is exceeded. Preserve application-specific fallback and retry safety. Measure the complete user interaction separately from server-only timing when the acceptance target covers both.

Use the application's existing diagnostic path for fixed operation names, elapsed duration, bounded outcome, and timeout status. Preserve the guidance excluding prompts, responses, credentials, personal data, and raw errors. Do not add a timing library, logging service, generated evaluation directory, or paid service call to CI as part of this migration.

## Verify

- Run `npm run format:check`, or the target's equivalent documentation formatter.
- In the template checkout, run `node --test scripts/template-update-patches.test.mjs` to validate pack syntax. That test does not prove the patch applies to a diverged downstream tree; use `git apply --check` before application.
- Confirm that links and ADR references resolve after adaptation. Check that the feature guidance covers quality, numerical latency criteria and measurement, reliability, target misses, dependency timeouts, the overall deadline, and user-visible completion/failure behavior.
- For an adopting feature, record an early representative evaluation before building the full interaction, then verify the complete interaction before accepting it. Report slow and failed attempts as well as successes; keep live evaluation outside CI. Use deterministic fake-service tests for timeout, ignored cancellation, retry/deadline, and fallback paths when implementing the contract. Passing documentation or mock tests alone is not evidence of live-service latency.

This pack changes guidance only. Runtime changes made to satisfy an adopting feature's contract need that project's normal implementation and verification workflow.
