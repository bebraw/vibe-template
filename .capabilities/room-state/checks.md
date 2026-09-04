# Checks

Run these after applying the Room State kit.

## Required

```bash
npm run types
npm run types:check
npm test
npm run typecheck
npx wrangler deploy --dry-run --experimental-provision=false --experimental-auto-create=false
npm run quality:gate
```

## Expected Results

- `ROOM_STATE.getByName(roomId)` selects one Durable Object per room.
- Wrangler includes a new SQLite-class migration without rewriting deployed migration tags.
- Generated `Env` types include `ROOM_STATE` and the Worker entrypoint exports `RoomState`.
- Only seeded choice ids can receive votes.
- A repeated voter key moves one vote rather than increasing the total.
- Two room ids remain isolated.
- Reset preserves choices and clears votes; seed replaces both choices and votes.
- The HTML form works through a normal POST and `303` redirect without JavaScript.
- Seed and reset cannot be reached without an explicit application-owned authorization check.
- Event-specific room ids, choices, URLs, and seed data remain outside the kit.

If `progressive-interaction` is also applied, run its JavaScript-disabled Playwright scenario as a separate guardrail.
