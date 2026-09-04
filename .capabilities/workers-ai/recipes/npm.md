# npm Recipe

This kit adds no application dependency. Its network-free tests require Vitest `4.1.11`; reconcile that exact version with the target's test stack before installing it. The kit also assumes Wrangler is already pinned in the target project; ask before installing or upgrading either tool.

If the target does not already provide the compatible Vitest version, install it after approval:

```bash
npm install --save-dev --save-exact vitest@4.1.11
```

## Wrangler Configuration

Merge these fields into the existing `wrangler.jsonc` rather than replacing the file:

```jsonc
{
  "ai": {
    "binding": "AI",
  },
  "vars": {
    "AI_MODEL": "replace-with-a-current-structured-output-model",
  },
}
```

Choose `AI_MODEL` from Cloudflare's current JSON Mode supported-model list when applying the kit. Keeping it in `vars` makes the generated `Env["AI_MODEL"]` type and deployment configuration agree. It is not a secret.

## Package Scripts

Merge these scripts into `package.json`:

```json
{
  "scripts": {
    "types": "wrangler types",
    "types:check": "wrangler types --check"
  }
}
```

Generate and commit `worker-configuration.d.ts`:

```bash
npm run types
```

Ensure the target `tsconfig.json` includes that declaration file. Regenerate it whenever bindings, variables, migrations, compatibility flags, or the compatibility date changes.

Prefix the target project's existing normal quality-gate command with `npm run types:check`. Do not leave generated binding drift as a deploy-only or manual check.

## Files

Copy or merge:

- `files/src/lib/workers-ai.ts` to `src/lib/workers-ai.ts`
- `files/src/test-support/mock-workers-ai.ts` to `src/test-support/mock-workers-ai.ts`
- `files/src/lib/workers-ai.test.ts` to `src/lib/workers-ai.test.ts`

Adjust directories to the target repo's established source layout. Keep the generated `Env` type at the binding adapter; inject `WorkersAiRunner` into feature code and tests.

`runStructuredAi` logs redacted lifecycle objects as JSON by default. Inject `log` to route those objects through an established application logger. Preserve the bounded event fields; prompts, schemas, raw output, deterministic fallback values, and exception messages do not belong in these logs.

The adapter races the runner against its own rejection deadline and aborts the supplied signal at the same time. Keep both behaviors: the race bounds runners that ignore aborts, while the signal lets cooperative runners stop unnecessary work. Configure only positive finite `timeoutMs` values.
