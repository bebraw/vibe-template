# Development

This document collects development-facing setup and workflow notes for the template.

## Agent Context

The template vendors the ASDLC knowledge base in `.asdlc/`.

- Start with `.asdlc/SKILL.md` for ASDLC concepts, patterns, and practices.
- Use `AGENTS.md` as the Codex-native context anchor for this repo.

## Local CI

This template is set up for the local Agent CI runner from `agent-ci.dev`.

### Prerequisites

- Local development in this template targets macOS. The documented commands assume a macOS shell environment and are not maintained as a cross-platform baseline.
- Run `nvm use` before `npm install` or any other development command so your shell uses the Node.js and npm versions pinned in `package.json`.
- Install dependencies with `npm install`.
- The exact Node.js version is pinned in `package.json`, and CI reads that value directly through `actions/setup-node`.
- npm comes from that pinned Node release rather than a separate repo-level npm pin.
- Copy `.dev.vars.example` to `.dev.vars` and replace placeholder values when a project needs local secrets.
- Copy `.env.agent-ci.example` to `.env.agent-ci` when you need machine-local Agent CI overrides. Agent CI loads that file automatically.
- If your clone has no `origin` remote, set `GITHUB_REPO=owner/repo` in `.env.agent-ci` to stop Agent CI from warning while inferring the repository name.
- If your Docker CLI uses a non-default socket or context, set `DOCKER_HOST=...` in `.env.agent-ci` so Agent CI reaches the same engine as `docker info`.
- Start a Docker runtime before running Agent CI.
- Install the GitHub Actions runner image once with `docker pull ghcr.io/actions/actions-runner:latest`.

The repo pins CLI tooling in `devDependencies`, including Wrangler for Cloudflare-based experiments. Prefer invoking those tools through `npx` or repo scripts so the project version is used instead of a global install.

If local CI fails with `No such image: ghcr.io/actions/actions-runner:latest`, pull that image manually and re-run the workflow.

If local CI warns with `No such remote 'origin'`, add `GITHUB_REPO=owner/repo` to `.env.agent-ci` and rerun the workflow.

### Commands

- Run the local workflow with `npm run ci:local`.
- Run the quiet local workflow with `npm run ci:local:quiet`.
- Run all relevant workflows with `npm run ci:local:all`.
- Rebuild the generated stylesheet manually with `npm run build:css`.
- Run the fast local gate with `npm run quality:gate:fast`.
- Run the baseline quality gate with `npm run quality:gate`.
- Run the shipped runtime dependency audit with `npm run security:audit`.
- Start the local Worker with `npm run dev`.
- Install the Playwright browser with `npm run playwright:install`.
- Run end-to-end tests with `npm run e2e`.
- Run unit and integration tests with `npm test`.
- Run the unit coverage gate with `npm run test:coverage`.
- Run TypeScript checks with `npm run typecheck`.
- Run Lighthouse with `LIGHTHOUSE_URL=http://127.0.0.1:8787 LIGHTHOUSE_SERVER_COMMAND="npm run dev" npm run lighthouse`.
- Format the repo with `npm run format`.
- Check formatting with `npm run format:check`.
- If a run pauses on failure, fix the issue and resume with `npm run ci:local:retry -- --name <runner-name>`.

The template now ships with a minimal Worker stub in `src/worker.ts`. `npm run dev` starts it on `http://127.0.0.1:8787`, and Playwright uses `npm run e2e:server` on `http://127.0.0.1:8788` so browser tests can run without extra setup. The e2e server forces Chokidar polling mode to avoid file-watcher exhaustion in macOS-hosted local runs while preserving the normal `npm run dev` developer loop. API modules live under `src/api/`, view modules live under `src/views/`, and tests are colocated under `src/`.

The GitHub Actions CI workflow splits fast checks from browser checks into separate jobs, reads the pinned Node version from `package.json`, runs repository-shape validation as part of the fast job, runs the browser job in the version-pinned Playwright container image `mcr.microsoft.com/playwright:v1.59.1-noble`, and cancels superseded runs on the same ref. That keeps the browser job from reinstalling Chromium on every run while still matching the repo's pinned Playwright version.

The starter UI now follows the same Tailwind v4 baseline shape as `thesis-journey-tracker`: Tailwind input lives in `src/tailwind-input.css`, generated CSS is written to `.generated/styles.css`, and Wrangler runs `npm run build:css` automatically before local development.

The Lighthouse setup is also generic, but the Worker stub gives it a concrete local target. Use `LIGHTHOUSE_URL=http://127.0.0.1:8787 LIGHTHOUSE_SERVER_COMMAND="npm run dev" npm run lighthouse`. Reports are written to `reports/lighthouse/`.

The Vitest setup is generic as well. `vitest.config.ts` targets colocated `src/**/*.test.ts` files while excluding `src/**/*.e2e.ts`. The default `npm test` command uses `--passWithNoTests` so the template remains usable before a project adds its first test file.

The coverage gate is stricter than the basic test run. `npm run test:coverage` measures runtime `src/**` code with the V8 provider, writes reports to `reports/coverage/`, and enforces high thresholds once a project actually has `src/` code. Colocated unit tests, end-to-end tests, and test-support files do not count as source files for the gate's skip-or-fail logic.

The TypeScript setup is generic too. `tsconfig.json` covers repo-level `.ts` files and `src/**/*.ts`, and `npm run typecheck` runs `tsc --noEmit`.

The README includes a committed application screenshot at `docs/screenshots/home.png`. Refresh that asset manually when the starter UI changes materially, but keep screenshot tooling and screenshot automation out of the template baseline.

## Security Baseline

The template keeps secret handling lightweight and explicit:

- Keep local secrets in untracked files such as `.dev.vars`.
- Commit example files such as `.dev.vars.example` with placeholder values only.
- Treat `npm run security:audit` as part of the baseline gate for shipped runtime dependencies.

## Quality Gate

Use this expectation for routine changes:

- `npm run quality:gate` must pass before a change is considered ready.
- Use `npm run quality:gate:fast` for quicker local iteration when browser coverage is not the immediate focus.
- `npm run ci:local:quiet` should also pass before proposing or landing the change.

The quality gate currently runs the fast gate first, then the Playwright browser gate. The local and remote CI workflow runs separate fast and browser jobs, with repository-shape validation included in the fast job. The repo's local CI scripts patch the pinned `agent-ci` install before execution to disable an upstream pnpm cache mount that breaks npm-based cleanup in local runs, and local browser installation should also go through the pinned `npm run playwright:install` script.
