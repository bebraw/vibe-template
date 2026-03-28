# vibe-template

This is a template for my vibecoding projects and it captures what I consider my best practices so I don't have to repeat them for each experiment.

## Documentation

- Development setup and local CI: `docs/development.md`
- Architecture decisions: `docs/adrs/README.md`
- Feature and architecture specs: `specs/README.md`
- Agent behavior and project rules: `AGENTS.md`

## Runtime

- Use the project Node.js version with `nvm use`.
- Copy `.dev.vars.example` to `.dev.vars` before running projects that need local secrets.
- Use repo-pinned CLI tools through `npx`, including `npx wrangler` for Cloudflare-based experiments.
