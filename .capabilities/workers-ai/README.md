# Workers AI Capability Kit

Use this kit to add one small, typed Workers AI boundary without committing the target project to an AI framework or application-specific prompt design.

## Adds

- A Wrangler AI binding and generated `Env` types.
- A configurable `AI_MODEL` variable.
- JSON Schema requests followed by application-owned runtime validation.
- A bounded request timeout and deterministic caller-provided fallback.
- Redacted structured start/finish events for model and fallback outcomes.
- A mock runner for tests without unsafe casts to the full generated binding type.

## Good Fit

- The target is a Cloudflare Worker that needs one or more structured model calls.
- Callers can define a deterministic fallback that keeps the product loop usable when AI is slow, unavailable, or malformed.
- The adopting feature owns its prompt, schema, validator, and model-quality expectations.

## Poor Fit

- The target needs streaming output; Workers AI JSON mode does not support streaming.
- An unvalidated free-form model response is acceptable and structured output adds no value.
- The application cannot define useful behavior when inference fails.

## Apply

1. Read `manifest.json` and inspect the target's existing Wrangler config, generated types, AI abstractions, and test conventions.
2. Follow `recipes/npm.md` for the binding, scripts, and generated environment types.
3. Copy or merge the files under `files/`.
4. Keep prompts, JSON Schemas, validators, and fallbacks next to the adopting feature. Do not put product content in the generic kit module.
5. Use `createWorkersAiRunner(env)` at the Worker composition root and inject the returned runner into `runStructuredAi`.
6. Keep the default JSON logger or inject an application logger. Do not add prompts, schemas, raw output, or fallback values to these events.
7. Run `checks.md` and the target repo's normal readiness gate.

The default five-second timeout is only a starting point. Set it from the user-visible latency budget of the adopting workflow.
