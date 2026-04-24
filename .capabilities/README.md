# Capability Kits

Capability kits are reviewable partial-upgrade guides for applying one template practice to another repo without copying the whole template.

## Available Kits

| Kit                                                            | Purpose                                                            |
| -------------------------------------------------------------- | ------------------------------------------------------------------ |
| [`agent-ci`](./agent-ci/README.md)                             | Add local GitHub Actions execution through Agent CI.               |
| [`quality-gate`](./quality-gate/README.md)                     | Add the fast verification baseline and optional browser gate.      |
| [`pre-push-quality-gate`](./pre-push-quality-gate/README.md)   | Add a repo-managed pre-push hook that runs the fast quality gate.  |
| [`readme-screenshot`](./readme-screenshot/README.md)           | Add local-only README screenshot capture through Playwright.       |
| [`lighthouse-performance`](./lighthouse-performance/README.md) | Add local Lighthouse performance reports and a performance budget. |

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
