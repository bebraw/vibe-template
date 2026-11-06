# Checks

Run these after applying the pre-push quality-gate kit.

```bash
npm install
git config --get core.hooksPath
npm run quality:gate:fast
```

Expected:

- With no pre-existing different hook path, `git config --get core.hooksPath` resolves to `.githooks` and `.githooks/pre-push` is executable.
- With a different existing hook path, installation preserves that path and warns that the kit's hook needs integration.
- `npm run quality:gate:fast` passes
