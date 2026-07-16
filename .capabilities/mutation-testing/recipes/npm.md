# npm Recipe

Apply this recipe when the target repo uses npm.

Apply `.capabilities/typescript-setup/` and `.capabilities/quality-gate/` first unless the target repo already has equivalent TypeScript, Vitest, and quality-gate contracts.

## Package Changes

Add the mutation testing dependencies:

```bash
npm install --save-dev @stryker-mutator/core@9.6.1 @stryker-mutator/typescript-checker@9.6.1 @stryker-mutator/vitest-runner@9.6.1
```

Add or merge this script:

```json
{
  "scripts": {
    "mutation": "stryker run",
    "mutation:incremental": "stryker run --incremental"
  }
}
```

If the target repo wants explicit local mutation feedback, add a deep gate without making mutation testing part of the default readiness path:

```json
{
  "scripts": {
    "quality:gate:deep": "npm run quality:gate && npm run mutation:incremental"
  }
}
```

Adapt the quality-gate command to the target repo's existing browser or integration checks.

## Files

Copy or merge:

- `files/stryker.config.mjs` to `stryker.config.mjs`

Adapt these config fields when needed:

- `mutate` if runtime source does not live under `src/`
- `tsconfigFile` if the repo uses another TypeScript config for tests
- `vitest.configFile` if the repo uses another Vitest config path
- `thresholds` if the target repo already has a stricter mutation score policy

## Ignore And Docs

Ensure the target repo ignores Stryker's temporary sandbox:

```gitignore
.stryker-tmp/
```

Document these write targets wherever the target repo tracks development workflow outputs:

- `reports/mutation/`
- `.stryker-tmp/`
