# Capability Kits

Capability kits are reviewable partial-upgrade guides for applying one template practice to another repo without copying the whole template.

## Available Kits

| Kit                                                                    | Purpose                                                            |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------ |
| [`typescript-setup`](./typescript-setup/README.md)                     | Add strict no-emit TypeScript checking for npm projects.           |
| [`local-ci`](./local-ci/README.md)                                     | Add local GitHub Actions execution through Local CI.               |
| [`quality-gate`](./quality-gate/README.md)                             | Add the fast verification baseline and optional browser gate.      |
| [`mutation-testing`](./mutation-testing/README.md)                     | Add Stryker mutation testing for TypeScript projects using Vitest. |
| [`pre-push-quality-gate`](./pre-push-quality-gate/README.md)           | Add a repo-managed pre-push hook that runs the fast quality gate.  |
| [`readme-screenshot`](./readme-screenshot/README.md)                   | Add local-only README screenshot capture through Playwright.       |
| [`lighthouse-performance`](./lighthouse-performance/README.md)         | Add local Lighthouse web-quality reports and category budgets.     |
| [`website-baseline`](./website-baseline/README.md)                     | Add an applicability-aware website quality checklist.              |
| [`engineering-quality-skills`](./engineering-quality-skills/README.md) | Add focused correctness review, test review, and debugging skills. |
| [`workers-ai`](./workers-ai/README.md)                                 | Add typed, validated Workers AI structured-output calls.           |
| [`room-state`](./room-state/README.md)                                 | Add one Durable Object per room for replaceable voting.            |
| [`progressive-interaction`](./progressive-interaction/README.md)       | Enhance conventional forms with fragment replacement.              |
| [`browser-static-assets`](./browser-static-assets/README.md)           | Add a typed browser module build and Worker static assets.         |

## Reviewed But Not Extracted

- **Cloudflare Worker starter:** reusable, but larger and more app-specific than the current kit shape. Extract it only when a target repo needs the full Worker/Tailwind/source-layout surface.
- **ASDLC documentation baseline:** useful, but it is a repo-governance model rather than a narrow tool upgrade.

## How To Use

1. Pick the smallest kit that matches the target repo's need.
2. Read the kit README and manifest.
3. Follow the target package-manager recipe.
4. Copy files from `files/` only after checking for existing target-project conventions.
5. Ask before applying any optional adjacent setup.
6. Run the kit checks and the target repo's normal quality gate.

## Negotiation Prompt

Use this prompt in a target repo when you want an agent to inspect the repo and negotiate which kits to pull before making changes:

```text
Review this repo and the capability kits from vibe-template.

Do not edit files yet.

First, inspect the target repo for:
- package manager and lockfile
- existing TypeScript config and typecheck scripts
- existing GitHub Actions workflows
- existing local quality/test scripts
- existing mutation testing setup or assertion-strength checks
- existing coding-agent skills for correctness review, test review, or debugging
- existing Git hooks or hook managers
- app/runtime surface that might need browser, screenshot, or Lighthouse checks
- Cloudflare Wrangler config, bindings, generated environment types, and Worker test setup
- server-rendered form behavior, typed browser entrypoints, CSP, and history/focus conventions
- browser TypeScript build output, generated-asset ignores, and Worker static-assets routing
- durable docs where new workflow contracts should be recorded

Then present a capability selection UI:

Capability Pull Plan

[ ] typescript-setup
    Adds strict no-emit TypeScript checking for npm projects.
    Include if the repo uses TypeScript, wants TypeScript, or needs a reusable typecheck script and tsconfig baseline.

[ ] local-ci
    Adds local GitHub Actions execution through Local CI.
    Include if the repo has or wants GitHub Actions and Docker-backed local CI.

[ ] quality-gate
    Adds formatting, type checking, audit, unit tests, and coverage checks.
    Include if the repo lacks a clear fast local verification baseline. Apply typescript-setup first unless the repo already has an equivalent typecheck contract.

[ ] mutation-testing
    Adds Stryker mutation testing for TypeScript projects using Vitest.
    Include if the repo already has meaningful unit tests and wants assertion-strength checks in the full readiness gate. Keep out of fast pre-push hooks unless explicitly approved.

[ ] pre-push-quality-gate
    Adds a repo-managed pre-push hook for the fast gate.
    Include only if the repo has a fast gate and no conflicting hook manager, or after asking how to integrate.

[ ] readme-screenshot
    Adds local-only README screenshot capture through Playwright.
    Include if the repo has a stable local UI worth showing in docs.

[ ] lighthouse-performance
    Adds local Lighthouse reports and web-quality category budgets.
    Include if the repo has a browser-visible surface and wants local performance, accessibility, best-practices, and SEO checks.

[ ] website-baseline
    Adds a durable, applicability-aware web quality checklist without runtime dependencies.
    Include if the repo serves browser-visible HTML and lacks an owned standards-based baseline.

[ ] engineering-quality-skills
    Adds focused correctness review, test review, and systematic debugging skills without runtime dependencies.
    Include if the repo uses Codex-compatible skills and lacks equivalent evidence-driven review and debugging workflows.

[ ] workers-ai
    Adds a generated-type binding adapter, configurable model, runtime structured-output validation, timeout, deterministic fallback, and mock runner.
    Include if a Cloudflare Worker needs structured inference and the adopting feature can own its prompt, schema, validator, and fallback.

[ ] room-state
    Adds one SQLite-backed Durable Object per room, predefined replaceable anonymous voting, aggregates, authorized seed/reset helpers, and conventional HTML GET/POST behavior.
    Include if a room is the coordination atom and the target accepts a Durable Object migration plus Workers-runtime test dependency.

[ ] progressive-interaction
    Adds optional background form submission, declared fragment replacement, coherent URL/history/focus behavior, and a JavaScript-disabled browser test.
    Include only after the conventional server form works and the target has or approves a typed client build path. Offer browser-static-assets when that path is absent. It is optional even when room-state is selected.

[ ] browser-static-assets
    Adds a native ES-module TypeScript build, watch command, Worker static-assets routing, CSP/cache headers, and a JavaScript-enabled browser smoke test.
    Include when a server-rendered Worker needs a small typed client path and does not already have a framework or bundler pipeline.

For each recommended capability, explain:
- why it fits this repo
- files/scripts/dependencies it would add or change
- optional adjacent setup that needs approval
- checks you would run

Ask me to approve the final capability list before editing files.
```

After approval, apply only the selected kits. If a selected kit discovers optional adjacent setup, such as creating a GitHub Actions workflow for Local CI, ask again before adding that adjacent capability.
