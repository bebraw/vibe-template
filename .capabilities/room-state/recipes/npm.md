# npm Recipe

Apply this recipe to an npm-based Cloudflare Worker after the user approves the Durable Object migration and test dependency.

## Test Dependencies

Install exact versions compatible with the kit snapshot:

```bash
npm uninstall @cloudflare/vitest-pool-workers @vitest/coverage-v8
npm install --save-dev --save-exact @cloudflare/vitest-plugin@1.1.4 @vitest/coverage-istanbul@4.1.11 vitest@4.1.11
```

If the target already uses Vitest, reconcile its pinned version with the plugin's peer dependency instead of installing a second test stack. When the target collects Worker-runtime coverage, set `test.coverage.provider` to `"istanbul"`; native V8 coverage is not supported in the Workers runtime. Preserve its existing include, exclude, reporter, and threshold settings.

## Wrangler Configuration

Merge these fields into the existing `wrangler.jsonc`:

```jsonc
{
  "durable_objects": {
    "bindings": [{ "name": "ROOM_STATE", "class_name": "RoomState" }],
  },
  "migrations": [{ "tag": "v1", "new_sqlite_classes": ["RoomState"] }],
}
```

Migration tags are permanent deployment history. If the target already has migrations, append a new unique tag instead of rewriting old entries.

Export the class from the Worker entrypoint:

```ts
export { RoomState } from "./room-state";
```

Generate and commit environment types after the config change:

```bash
npx wrangler types
```

Add `types` and `types:check` package scripts if the target does not already have equivalent commands.

Prefix the target project's existing normal quality-gate command with `npm run types:check`. Do not leave generated binding drift as a deploy-only or manual check.

## Test Configuration

Merge `files/vitest.config.ts` into the target's current Vitest config and include `"@cloudflare/vitest-plugin/types"` in the test TypeScript configuration's `compilerOptions.types`. The Workers plugin uses the `cloudflareTest()` Vite plugin; do not restore `@cloudflare/vitest-pool-workers`, use native V8 coverage, or discard existing include, coverage, or alias settings.

## Composition

Call `handleRoomRequest(request, env)` from the existing Worker router and return its response when defined. Use the existing response and layout helpers if the target already has stronger conventions.

Keep seed, reset, and status changes behind application-owned authorization:

```ts
await seedRoom(request, env, roomId, choices, authorizeRoomAdministration);
await setRoomStatus(request, env, roomId, "locked", authorizeRoomAdministration);
```

Do not derive authorization from knowledge of a room id. Use an authenticated session, protected internal route, or another explicit target-project control.

Pass application-owned HTTP options at the routing boundary:

```ts
await handleRoomRequest(request, env, {
  allowedOrigins: ["https://presenter.example"],
  voterCookieMaxAgeSeconds: 4 * 60 * 60,
});
```

The request URL's own origin is always accepted. Additional origins must be exact origins, not URL prefixes or wildcard strings. Browsers must send an accepted `Origin` on vote POSTs; missing and opaque origins are rejected. Keep the default eight-hour cookie lifetime or choose a bounded duration that matches the event rather than restoring the old one-year default.

`resetVotes` logs a redacted `room.reset` JSON event with only the changed/unchanged outcome, removed vote count, and resulting revision. Route Worker console logs through the target's normal observability destination; do not add room or voter identifiers without a documented data-retention decision.
