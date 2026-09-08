# Add Non-Destructive Room Initialization

Use this update for projects that adopted the Room State kit and need safe routine setup or retries.

## Apply

1. Inspect the target's room implementation, tests, and administration authorization. Read ADR-063 and the Room State kit's initialization contract.
2. Try `git apply --check` with this pack's `patch.diff`. Its paths address the kit inside a template checkout. Apply only if the target matches; direct adopters should use the manual fallback below.
3. Use `initializeRoom` for routine setup through the existing application-owned authorization callback. Keep `seedRoom` for deliberate replacement and vote clearing, and `resetRoom` for clearing votes while retaining choices and status.
4. Document that existing rooms ignore replacement initialization input, including invalid unused choices. Empty rooms validate before mutation. Room-id knowledge grants no administrative access.
5. Run the relevant checks and record this update id in the target's existing provenance record.

## Manual Fallback

Merge `initializeChoices` and the initialization/reseeding tests from `.capabilities/room-state/files/src/room-state.ts` and `room-state.test.ts` into the target's corresponding files. Preserve the synchronous snapshot check and synchronous seed body without yielding between them. Do not implement the check as a separate Worker-side RPC.

Merge `initializeRoom` and its authorization tests from `room-http.ts` and `room-http.test.ts`, adapting names to the existing administration boundary. Authorization must run even when the room is already initialized. Preserve application routes, content, and permissions; do not copy lecture-specific setup. No dependency, binding, migration, or public endpoint change is needed.

## Verify

- First initialization seeds choices; invalid initial choices leave the complete empty snapshot unchanged.
- Repeat initialization preserves open/locked state, choices, votes, participant selection, and revision, including rooms populated by seed or cleared by reset.
- Concurrent initialization cannot reseed or erase intervening votes.
- Explicit reseeding still replaces choices, clears votes, and advances revision.
- Denied initialization cannot change an empty or initialized room.
- Run the target's Worker-runtime tests and typecheck, then its normal quality gate. In the template, run `npm run capabilities:verify` and `npm run quality:gate`.
