# Refresh Worker Operational Contracts

Use this update to refresh a template-derived Worker runtime while preserving an explicit Web-standards-only contract, enforce generated binding drift checks, and add redacted lifecycle logging to adopted application kits.

## Apply

1. Read ADR-060 and inspect the target's compatibility date, Node runtime usage, package module format, generated Worker declarations, logging policy, and normal quality gate.
2. Set a current compatibility date only after the target's pinned runtime and tests accept it. For dates on or after `2026-08-04`, add both Node.js compatibility opt-out flags when the Worker should remain Web-standards-only.
3. Add `"type": "module"` only after checking package-owned CommonJS files; rename or adapt genuine CommonJS entrypoints rather than breaking them silently.
4. Put `wrangler types --check` in the normal quality gate of every project that commits `worker-configuration.d.ts`.
5. Port the Workers AI and Room State event shapes only for capabilities the target already adopted. Route events through the target logger without adding sensitive fields.
6. Add a generic pre-session warm-up checklist for the target's package manager, browser, container, and local CI paths.
7. Apply `patch.diff` or record the equivalent global constraints in the target's architecture documentation.

## Fallback

If the target intentionally uses Node.js runtime APIs, document that decision and keep the appropriate positive/default compatibility behavior instead of applying the opt-out flags. If its test runtime rejects today's compatibility date, use the newest date the pinned runtime accepts and record the constraint before considering a dependency upgrade.

## Verify

- `npm run types:check` in adopted binding-based kits
- `npm run capabilities:verify`
- `npm run quality:gate`
- `npm run ci:local`
