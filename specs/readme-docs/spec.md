# Feature: README Docs

## Blueprint

### Context

The template README is the first surface contributors see. It should show the current starter app clearly, point contributors at the current runtime and verification commands, and do that without reintroducing heavyweight screenshot tooling.

### Architecture

- **Primary document:** `README.md`
- **Committed screenshot asset:** `docs/screenshots/home.png`
- **Current workflow summary:** runtime, verification, and source layout notes in `README.md`
- **Update model:** manual refresh when the starter UI changes materially
- **Non-goal:** no screenshot-specific package scripts or screenshot-sync workflows

### Anti-Patterns

- Do not reintroduce screenshot automation just to keep the README image current.
- Do not point the README at a missing or stale placeholder screenshot path.
- Do not let the committed screenshot drift far from the current starter UI.
- Do not let the README drift away from the actual commands, ports, or source layout used by the current template.

## Contract

### Definition of Done

- [ ] The README includes a working application screenshot reference.
- [ ] The README reflects the current runtime and verification commands.
- [ ] The screenshot asset is committed in the repo.

### Regression Guardrails

- `README.md` must reference a committed screenshot file that exists in the repo.
- `README.md` should continue to describe the current starter source layout and verification flow accurately.
- The screenshot should continue to represent the current starter app surface closely enough to be useful.
- Screenshot support must remain manual and lightweight unless a later ADR changes that rule.

### Verification

- **Manual check:** verify the README image renders from `docs/screenshots/home.png`
- **Repo check:** `git diff --check`
- **Baseline gate:** `pnpm run quality:gate` and `pnpm run ci:local:quiet`

### Scenarios

**Scenario: Reader opens the README**

- Given: the repo is viewed locally or on Git hosting
- When: the reader reaches the screenshot section
- Then: they see a committed image of the current starter application

**Scenario: Contributor follows the README**

- Given: the current template baseline
- When: the contributor reads the runtime, verification, and source layout sections
- Then: the commands, ports, and file locations match the current repo behavior

**Scenario: Starter UI changes materially**

- Given: the rendered application changes enough that the current screenshot is misleading
- When: the change is completed
- Then: the committed README screenshot is refreshed in the same change set
