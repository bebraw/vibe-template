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
- A participant snapshot and rendered form expose that voter's current selection without exposing another voter identifier.
- Two room ids remain isolated.
- Reset preserves choices and clears votes; seed replaces both choices and votes.
- Every reset emits a structured changed/unchanged event without room or voter identifiers.
- Revisions increase only when seeded choices, status, or votes change; a repeated identical vote leaves the revision stable.
- Locked rooms retain their frozen counts and selection while rejecting new or changed votes.
- The HTML form works through a normal POST and `303` redirect without JavaScript.
- Vote POSTs reject missing or untrusted `Origin` headers before changing state.
- New voter cookies default to eight hours and use the configured bounded `Max-Age` when the application supplies one.
- Seed, reset, and status changes cannot be reached without an explicit application-owned authorization check.
- Event-specific room ids, choices, URLs, and seed data remain outside the kit.
- The target's normal quality gate runs `npm run types:check` so committed binding declarations cannot drift silently.
- Worker-runtime tests use `@cloudflare/vitest-plugin` and Istanbul coverage rather than the retired pool package or native V8 coverage.

If `progressive-interaction` is also applied, run its JavaScript-disabled Playwright scenario as a separate guardrail.
