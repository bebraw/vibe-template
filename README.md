# vibe-template

This is a template for my vibecoding projects and it captures what I consider my best practices so I don't have to repeat them for each experiment.

## Documentation

- Development setup and local CI: `docs/development.md`
- Architecture decisions: `docs/adrs/README.md`
- Feature and architecture specs: `specs/README.md`
- Agent behavior and project rules: `AGENTS.md`

## Runtime

- Use the project Node.js version with `nvm use`.
- Enable Corepack with `corepack enable`, then install dependencies with `pnpm install`.
- Copy `.dev.vars.example` to `.dev.vars` before running projects that need local secrets.
- Use repo-pinned CLI tools through `pnpm exec`, including `pnpm exec wrangler` for Cloudflare-based experiments.
- Start the stub Worker with `pnpm run dev`, then open `http://127.0.0.1:8787`.
- Rebuild the generated Tailwind stylesheet manually with `pnpm run build:css` when needed.

## Verification

- Run the fast local gate with `pnpm run quality:gate:fast` during normal iteration.
- Run the baseline repo gate with `pnpm run quality:gate`.
- Run the containerized local workflow with `pnpm run ci:local:quiet`.
- Run unit tests from colocated `src/**/*.test.ts` files with `pnpm test`.
- Run browser tests from colocated `src/**/*.e2e.ts` files with `pnpm run e2e`.

## Starter App

- `GET /` serves a minimal HTML Worker stub.
- `GET /styles.css` serves the generated Tailwind stylesheet.
- `GET /api/health` serves a JSON health response for smoke tests and tooling.

## Source Layout

- `src/worker.ts` is the Worker entry point and top-level router.
- `src/api/` holds API response modules such as the health endpoint.
- `src/views/` holds HTML rendering modules for the starter UI.
- Tests live next to the code they exercise under `src/`.

## Application Screenshot

![Starter app screenshot](docs/screenshots/home.png)
