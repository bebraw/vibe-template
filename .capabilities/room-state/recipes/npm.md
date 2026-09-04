# npm Recipe

Apply this recipe to an npm-based Cloudflare Worker after the user approves the Durable Object migration and test dependency.

## Test Dependencies

Install exact versions compatible with the kit snapshot:

```bash
npm install --save-dev --save-exact @cloudflare/vitest-pool-workers@0.22.0 vitest@4.1.11
```

If the target already uses Vitest, reconcile its pinned version with the pool's peer dependency instead of installing a second test stack.

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

## Test Configuration

Merge `files/vitest.config.ts` into the target's current Vitest config. The current Workers pool uses the `cloudflareTest()` Vite plugin; do not restore the removed `@cloudflare/vitest-pool-workers/config` entrypoint or discard existing include, coverage, or alias settings.

## Composition

Call `handleRoomRequest(request, env)` from the existing Worker router and return its response when defined. Use the existing response and layout helpers if the target already has stronger conventions.

Keep seed and reset behind application-owned authorization:

```ts
await seedRoom(request, env, roomId, choices, authorizeRoomAdministration);
```

Do not derive authorization from knowledge of a room id. Use an authenticated session, protected internal route, or another explicit target-project control.
