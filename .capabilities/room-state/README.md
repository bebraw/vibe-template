# Room State Capability Kit

Use this kit to add one Durable Object per room for small, strongly consistent voting workflows.

## Adds

- Deterministic `ROOM_STATE.getByName(roomId)` routing.
- SQLite-backed predefined choices and aggregate counts.
- One replaceable vote per opaque anonymous voter key.
- Participant-specific current selection in room snapshots and rendered forms.
- Monotonic room revisions plus authorized open/locked status changes.
- Non-destructive initialization, explicit destructive seed, vote reset, and status RPC operations.
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
6. Put `initializeRoom`, `seedRoom`, and `resetRoom` behind an explicit authorization callback. Do not add an open administration endpoint.
7. Use the same authorization boundary for `setRoomStatus`. Lock the room before consuming a specific revision in model or presentation work.
8. Configure `handleRoomRequest` with the target's allowed origins and cookie lifetime. The strict default accepts only an `Origin` matching the request URL.
9. Apply `progressive-interaction` only if separately approved.
10. Run `checks.md` and the target repo's normal readiness gate.

The included document renderer is deliberately plain. Merge the fragment contract into the target project's existing layout rather than adopting it as a visual system.

The anonymous cookie deters casual duplicate voting in one browser; it does not provide authenticated identity or prevent deliberate ballot stuffing across clients.

## Initialization And Administration

Use `initializeRoom` for routine setup and retries. Its `initializeChoices(choices)` RPC validates and seeds only when the room has no choices, opens it, and advances its revision once. Existing choices mean the room is initialized, including rooms originally populated by `seedChoices` or emptied of votes by `resetVotes`.

For an initialized room, initialization returns the current aggregate snapshot (`currentSelection: null`) without validating the unused input or changing choices, votes, status, or revision. Different or invalid replacement choices are ignored. Invalid choices on an empty room reject before any mutation.

The check and seed execute synchronously in the Durable Object, with no `await` between them; seed writes use a synchronous SQLite transaction. Keep that sequence intact so concurrent initialization cannot reseed a room or erase a vote.

| Operation                                       | Choices                          | Votes                         | Status and revision                                                           |
| ----------------------------------------------- | -------------------------------- | ----------------------------- | ----------------------------------------------------------------------------- |
| `initializeChoices(choices)` / `initializeRoom` | Seeds only when no choices exist | Preserves an existing session | First initialization opens and advances once; retries preserve both           |
| `seedChoices(choices, status?)` / `seedRoom`    | Replaces choices deliberately    | Clears all votes              | Opens by default and always advances once; the RPC accepts an explicit status |
| `resetVotes()` / `resetRoom`                    | Preserves choices                | Clears votes                  | Preserves status; advances only when votes were removed                       |

All administration, including initialization of an existing room, requires application-owned authorization. The RPC binding is a trusted server boundary; use the authorized helpers when composing application routes. Knowing a room id grants no administrative access, and the participant GET/POST handler does not initialize rooms.
