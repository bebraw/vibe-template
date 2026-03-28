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
- Enable Corepack with `corepack enable`.
- Install dependencies with `pnpm install`.
- Copy `.dev.vars.example` to `.dev.vars` and replace placeholder values when a project needs local secrets.
- Start a Docker runtime before running Agent CI.
- Install the GitHub Actions runner image once with `docker pull ghcr.io/actions/actions-runner:latest`.

The repo pins CLI tooling in `devDependencies`, including Wrangler for Cloudflare-based experiments. Prefer invoking those tools through `pnpm exec` or repo scripts so the project version is used instead of a global install.

If local CI fails with `No such image: ghcr.io/actions/actions-runner:latest`, pull that image manually and re-run the workflow.

The local wrapper also tolerates known Agent CI cache-cleanup false negatives after successful job steps, including cleanup errors on `.pnpm-store` and `.bun/install/cache`. If one of those specific cleanup errors appears at the end of an otherwise green run, the wrapper treats the workflow as passed.

### Commands

- Run the local workflow with `pnpm exec agent-ci run --workflow .github/workflows/ci.yml`.
- Run all relevant workflows with `pnpm exec agent-ci run --all`.
- Rebuild the generated stylesheet manually with `pnpm run build:css`.
- Run the fast local gate with `pnpm run quality:gate:fast`.
- Run the baseline quality gate with `pnpm run quality:gate`.
- Run the shipped runtime dependency audit with `pnpm run security:audit`.
- Start the local Worker with `pnpm run dev`.
- Install the Playwright browser with `pnpm exec playwright install chromium`.
- Run end-to-end tests with `pnpm run e2e`.
- Run unit and integration tests with `pnpm test`.
- Run the unit coverage gate with `pnpm run test:coverage`.
- Run TypeScript checks with `pnpm run typecheck`.
- Run Lighthouse with `LIGHTHOUSE_URL=http://127.0.0.1:8787 LIGHTHOUSE_SERVER_COMMAND="pnpm run dev" pnpm run lighthouse`.
- Format the repo with `pnpm run format`.
- Check formatting with `pnpm run format:check`.
- If a run pauses on failure, fix the issue and resume with `pnpm exec agent-ci retry --name <runner-name>`.

The template now ships with a minimal Worker stub in `src/worker.ts`. `pnpm run dev` starts it on `http://127.0.0.1:8787`, and Playwright uses `pnpm run e2e:server` on `http://127.0.0.1:8788` so browser tests can run without extra setup. API modules live under `src/api/`, view modules live under `src/views/`, and tests are colocated under `src/`.

The GitHub Actions CI workflow splits fast checks from browser checks into separate jobs, runs repository-shape validation as part of the fast job, runs the browser job in the version-pinned Playwright container image `mcr.microsoft.com/playwright:v1.58.2-noble`, and cancels superseded runs on the same ref. That keeps the browser job from reinstalling Chromium on every run while still matching the repo's pinned Playwright version.

The starter UI now follows the same Tailwind v4 baseline shape as `thesis-journey-tracker`: Tailwind input lives in `src/tailwind-input.css`, generated CSS is written to `.generated/styles.css`, and Wrangler runs `pnpm run build:css` automatically before local development.

The Lighthouse setup is also generic, but the Worker stub gives it a concrete local target. Use `LIGHTHOUSE_URL=http://127.0.0.1:8787 LIGHTHOUSE_SERVER_COMMAND="pnpm run dev" pnpm run lighthouse`. Reports are written to `reports/lighthouse/`.

The Vitest setup is generic as well. `vitest.config.ts` targets colocated `src/**/*.test.ts` files while excluding `src/**/*.e2e.ts`. The default `pnpm test` command uses `--passWithNoTests` so the template remains usable before a project adds its first test file.

The coverage gate is stricter than the basic test run. `pnpm run test:coverage` measures runtime `src/**` code with the V8 provider, writes reports to `reports/coverage/`, and enforces high thresholds once a project actually has `src/` code. Colocated unit tests, end-to-end tests, and test-support files do not count as source files for the gate's skip-or-fail logic.

The TypeScript setup is generic too. `tsconfig.json` covers repo-level `.ts` files and `src/**/*.ts`, and `pnpm run typecheck` runs `tsc --noEmit`.

The README includes a committed application screenshot at `docs/screenshots/home.png`. Refresh that asset manually when the starter UI changes materially, but keep screenshot tooling and screenshot automation out of the template baseline.

## Security Baseline

The template keeps secret handling lightweight and explicit:

- Keep local secrets in untracked files such as `.dev.vars`.
- Commit example files such as `.dev.vars.example` with placeholder values only.
- Treat `pnpm run security:audit` as part of the baseline gate for shipped runtime dependencies.

## Quality Gate

Use this expectation for routine changes:

- `pnpm run quality:gate` must pass before a change is considered ready.
- Use `pnpm run quality:gate:fast` for quicker local iteration when browser coverage is not the immediate focus.
- `pnpm run ci:local:quiet` should also pass before proposing or landing the change.

The quality gate currently runs the fast gate first, then the Playwright browser gate. The local and remote CI workflow runs separate fast and browser jobs, with repository-shape validation included in the fast job.
