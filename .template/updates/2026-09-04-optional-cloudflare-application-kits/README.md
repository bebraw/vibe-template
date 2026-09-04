# Add Optional Cloudflare Application Kits And Deploy Preflight

Use this update when an existing template-derived project should be able to adopt Workers AI, room-scoped Durable Object voting, or progressive form enhancement without moving those product choices into its default runtime.

The focused patch records the two durable architecture boundaries. The application kits and preflight are copied or merged manually because target Worker entrypoints, Wrangler bindings, test configs, client builds, and package scripts vary too much for a safe bulk patch.

## Apply

1. Read ADR-055 and the current `specs/capability-kits/spec.md`. Apply `patch.diff` if the target still has the matching architecture sections; otherwise record the same constraints in its durable architecture docs.
2. Present `workers-ai`, `room-state`, and `progressive-interaction` independently. Wait for approval before copying a kit, adding its dependencies, adding a Durable Object migration, or creating a client build path.
3. For each approved capability, copy the current directory from `.capabilities/` and follow its README, manifest, package-manager recipe, and checks. Preserve the target's source layout, routes, response helpers, config, and tests.
4. Keep prompts, JSON Schemas, fallbacks, room ids, voting choices, ticket URLs, seed data, and other project content in the adopting feature. Do not add them to the generic kit.
5. To adopt the core deploy preflight, copy `scripts/run-preflight.mjs` and `scripts/run-preflight.test.mjs`, merge `"preflight": "node ./scripts/run-preflight.mjs"` into `package.json`, and update the target's deployment-readiness spec and development docs.
6. Keep preflight inspection artifacts temporary, capture `wrangler whoami --json` output, and disable automatic provisioning on the deploy dry run. Existing configured build hooks may retain their documented outputs.
7. Generate environment types after applying AI or Durable Object bindings. Append a new Durable Object migration tag; never rewrite deployed migration history.
8. Record this update id in the target's template provenance after the selected checks pass.

## Fallback

If the target already has an AI client, state owner, form enhancer, preflight, or Workers test pool, merge only the missing contract. Do not introduce parallel abstractions or a second client/test build.

If the room needs authenticated identity, cross-room queries, audit history, or cryptographic ballot secrecy, stop and design that project-specific state and security boundary rather than stretching the generic anonymous-vote kit.

## Verify

- Parse every selected kit manifest and confirm each declared source file exists.
- Run the Workers AI mock tests and the target's structured-output fallback scenarios.
- Run the Room State tests in the Workers Vitest pool, including replacement, unknown choice, room isolation, and reset.
- Run the progressive form scenario with JavaScript disabled and its enhanced URL/focus/history tests.
- Run `node --test scripts/run-preflight.test.mjs` when preflight is adopted.
- Run `npm run quality:gate`.
- Run `npm run ci:local` when package metadata, dependencies, build setup, browser CI, or other workflow-sensitive surfaces changed.
