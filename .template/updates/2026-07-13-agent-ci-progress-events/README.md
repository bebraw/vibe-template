# Emit Agent CI Progress Events

Use this when a project runs Agent CI with `--quiet` and an agent cannot reliably distinguish a long-running step from a hung workflow.

## Apply

1. Confirm the pinned Agent CI release supports `--json` NDJSON output.
2. Add `--json` alongside `--quiet` in the canonical local CI command.
3. Update any vendored Agent CI skill or agent instructions to request JSON output as well.
4. Keep `--pause-on-failure` so `run.paused` events include the runner and retry command.
5. Update local workflow docs to describe structured lifecycle progress rather than a silent quiet run.

## Fallback

If the target project uses a wrapper around Agent CI, pass `AGENT_CI_JSON=1` through the wrapper instead of changing its command shape. Use the wrapper's raw passthrough mode when its normal output filtering buffers the NDJSON stream. Preserve the target project's workflow path and package-manager conventions.

## Verify

- `npm run quality:gate`
- `npm run ci:local`

During local CI, confirm stdout includes newline-delimited `run.start`, job or step events, and `run.finish` or `run.paused`.
