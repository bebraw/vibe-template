# Development

This document collects development-facing setup and workflow notes for the template.

## Agent Context

The template vendors the ASDLC knowledge base in `.asdlc/`.

- Start with `.asdlc/SKILL.md` for ASDLC concepts, patterns, and practices.
- Use `AGENTS.md` as the Codex-native context anchor for this repo.

## Local CI

This template is set up for the local Agent CI runner from `agent-ci.dev`.

### Prerequisites

- Use the project Node.js version with `nvm use`.
- Install dependencies with `npm install`.
- Copy `.dev.vars.example` to `.dev.vars` and replace placeholder values when a project needs local secrets.
- Start a Docker runtime before running Agent CI.

The repo pins CLI tooling in `devDependencies`, including Wrangler for Cloudflare-based experiments. Prefer invoking those tools through `npx` so the project version is used instead of a global install.

### Commands

- Run the local workflow with `npx agent-ci run --workflow .github/workflows/ci.yml`.
- Run all relevant workflows with `npx agent-ci run --all`.
- Run the baseline quality gate with `npm run quality:gate`.
- Run the shipped runtime dependency audit with `npm run security:audit`.
- Install the Playwright browser with `npx playwright install chromium`.
- Run end-to-end tests with `npm run e2e`.
- Run unit and integration tests with `npm test`.
- Run TypeScript checks with `npm run typecheck`.
- Run Lighthouse with `LIGHTHOUSE_URL=http://127.0.0.1:3000 npm run lighthouse`.
- Capture README screenshots with `npm run screenshots:readme`.
- Format the repo with `npm run format`.
- Check formatting with `npm run format:check`.
- If a run pauses on failure, fix the issue and resume with `npx agent-ci retry --name <runner-name>`.

The template includes a generic `playwright.config.ts` and `tests/e2e/` directory, but it does not assume a specific local app command. Add your project's `baseURL` and `webServer` settings once the app surface exists.

The Lighthouse setup is also generic. Point it at an existing URL through `LIGHTHOUSE_URL`, or provide `LIGHTHOUSE_SERVER_COMMAND` as well if the script should start the app before auditing. Reports are written to `reports/lighthouse/`.

The Vitest setup is generic as well. `vitest.config.ts` targets `tests/**/*.test.ts` while excluding `tests/e2e/**`. The default `npm test` command uses `--passWithNoTests` so the template remains usable before a project adds its first test file.

The TypeScript setup is generic too. `tsconfig.json` covers repo-level `.ts` files and `tests/**/*.ts`, and `npm run typecheck` runs `tsc --noEmit`.

The screenshot utility is generic too. `npm run screenshots:readme` captures one or more pages into `docs/screenshots/` using Playwright. Override `SCREENSHOT_BASE_URL`, `SCREENSHOT_OUTPUT_DIR`, or `SCREENSHOT_PAGES` when a project needs different routes or filenames.

## Security Baseline

The template keeps secret handling lightweight and explicit:

- Keep local secrets in untracked files such as `.dev.vars`.
- Commit example files such as `.dev.vars.example` with placeholder values only.
- Treat `npm run security:audit` as part of the baseline gate for shipped runtime dependencies.

## Quality Gate

Use this expectation for routine changes:

- `npm run quality:gate` must pass before a change is considered ready.
- `npm run ci:local:quiet` should also pass before proposing or landing the change.

The quality gate currently runs formatting checks, TypeScript checking, the runtime dependency audit, Vitest, and the Playwright baseline. The local CI workflow runs the same gate after the repository shape checks.
