# Quality Gate Capability Kit

Use this kit to add the template's fast verification baseline to another npm project.

## Adds

- Formatting, type checking, runtime audit, test, and coverage scripts.
- A coverage gate that fails when `src/` runtime code exists without unit tests.
- Vitest configuration for colocated `src/**/*.test.ts` files.
- Optional Playwright browser-gate guidance when the target repo has browser tests.

## Good Fit

- The target repo uses npm and TypeScript or JavaScript.
- Runtime code lives under `src/` or can be adapted to that convention.
- The repo wants a fast local signal before broader CI.

## Poor Fit

- The repo has an established test runner and coverage policy that should not be replaced.
- The repo has no meaningful `src/` runtime code.
- The repo uses a package manager other than npm and the user does not want translated scripts.

## Apply

1. Read `manifest.json`.
2. Follow `recipes/npm.md`.
3. Copy `files/scripts/run-coverage-gate.mjs` into `scripts/run-coverage-gate.mjs`.
4. Copy or merge `files/vitest.config.ts` into `vitest.config.ts`.
5. If the target repo needs browser coverage, ask before adding Playwright config:
   `Do you want this quality-gate upgrade to add a Playwright browser gate as well?`
6. Run the checks in `checks.md`.
