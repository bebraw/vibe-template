# Room State Capability Kit

Use this kit to add one Durable Object per room for small, strongly consistent voting workflows.

## Adds

- Deterministic `ROOM_STATE.getByName(roomId)` routing.
- SQLite-backed predefined choices and aggregate counts.
- One replaceable vote per opaque anonymous voter key.
- Participant-specific current selection in room snapshots and rendered forms.
- Monotonic room revisions plus authorized open/locked status changes.
- Seed, reset, and status RPC operations.
- Conventional `GET /rooms/:roomId` and bounded form `POST /rooms/:roomId` behavior with a `303` redirect.
- Same-origin or explicitly allowlisted vote origins and a configurable voter-cookie lifetime that defaults to eight hours.
- Worker-runtime tests for replacement, validation, isolation, reset, origin, cookie, selection, revision, and lock behavior, with Istanbul coverage when coverage is enabled.
- A redacted structured reset event with mutation outcome, removed count, and resulting revision.

## Good Fit

- A room is the natural atom of coordination.
- Each voter chooses one predefined option and may replace that choice later.
- Aggregate counts, not a global cross-room query, are the primary read model.
- Server-rendered HTML is the reliable baseline.

## Poor Fit

- The application needs global transactions or queries spanning many rooms.
- Voters must be authenticated, audited, or limited across devices; replace the anonymous cookie boundary with the application's identity model.
- Ballot secrecy against operators is required. This kit stores pseudonymous per-room voter keys so replacement works; it is not a cryptographic secret-ballot system.

## Apply

1. Read `manifest.json` and inspect the target's Worker entrypoint, Wrangler config, generated types, routes, rendering, identity, and test setup.
2. Follow `recipes/npm.md`; adding the test dependency and Durable Object migration requires explicit approval in the target project.
3. Copy or merge files under `files/` into the target's established layout.
4. Export `RoomState` from the Worker entrypoint and compose `handleRoomRequest` into the existing router.
5. Define event-specific choices in the adopting project. The kit intentionally includes none.
6. Put `seedRoom` and `resetRoom` behind an explicit authorization callback. Do not add an open administration endpoint.
7. Use the same authorization boundary for `setRoomStatus`. Lock the room before consuming a specific revision in model or presentation work.
8. Configure `handleRoomRequest` with the target's allowed origins and cookie lifetime. The strict default accepts only an `Origin` matching the request URL.
9. Apply `progressive-interaction` only if separately approved.
10. Run `checks.md` and the target repo's normal readiness gate.

The included document renderer is deliberately plain. Merge the fragment contract into the target project's existing layout rather than adopting it as a visual system.

The anonymous cookie deters casual duplicate voting in one browser; it does not provide authenticated identity or prevent deliberate ballot stuffing across clients.
