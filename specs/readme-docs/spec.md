# Feature: README Docs

## Blueprint

### Context

The template README is the first surface contributors see. It should show the current starter app clearly without reintroducing heavyweight screenshot tooling.

### Architecture

- **Primary document:** `README.md`
- **Committed screenshot asset:** `docs/screenshots/home.png`
- **Update model:** manual refresh when the starter UI changes materially
- **Non-goal:** no screenshot-specific npm scripts or screenshot-sync workflows

### Anti-Patterns

- Do not reintroduce screenshot automation just to keep the README image current.
- Do not point the README at a missing or stale placeholder screenshot path.
- Do not let the committed screenshot drift far from the current starter UI.

## Contract

### Definition of Done

- [ ] The README includes a working application screenshot reference.
- [ ] The screenshot asset is committed in the repo.
- [ ] The relevant ADR is updated in the same change set.

### Regression Guardrails

- `README.md` must reference a committed screenshot file that exists in the repo.
- The screenshot should continue to represent the current starter app surface closely enough to be useful.
- Screenshot support must remain manual and lightweight unless a later ADR changes that rule.

### Verification

- **Manual check:** verify the README image renders from `docs/screenshots/home.png`
- **Repo check:** `git diff --check`
- **Baseline gate:** `npm run quality:gate` and `npm run ci:local:quiet`

### Scenarios

**Scenario: Reader opens the README**

- Given: the repo is viewed locally or on Git hosting
- When: the reader reaches the screenshot section
- Then: they see a committed image of the current starter application

**Scenario: Starter UI changes materially**

- Given: the rendered application changes enough that the current screenshot is misleading
- When: the change is completed
- Then: the committed README screenshot is refreshed in the same change set
