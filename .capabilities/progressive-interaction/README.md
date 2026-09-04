# Progressive Interaction Capability Kit

Use this kit to enhance conventional server-rendered forms without making JavaScript a prerequisite for completing the workflow.

## Adds

- Background GET or POST submission for explicitly marked same-origin forms.
- Replacement of one declared fragment from the returned HTML document.
- URL and browser-history updates when the response URL changes.
- Focus preservation or a declared replacement focus target.
- Native resubmission when the enhancement fails.
- Playwright scenarios for the native no-JavaScript path and enhanced fragment, URL, focus, and history behavior.

## Good Fit

- The server already owns correct HTML GET/POST behavior.
- Responses contain a stable fragment id in both the current and returned document.
- The target has a typed browser-module build or is willing to add one deliberately.

## Poor Fit

- The workflow only exists as a JSON API and has no functional HTML form path.
- Replacing one returned HTML fragment cannot represent the interaction.
- The project already uses a client navigation framework with its own form, focus, and history contracts.

## Apply

1. Read `manifest.json` and inspect existing form markup, browser entrypoints, CSP, build output, history handling, and Playwright setup.
2. Confirm the target already has a typed browser build and serving path. If not, offer the separate `browser-static-assets` kit and wait for approval before adding it.
3. Copy or merge `files/src/browser/` into the existing typed client source.
4. Follow `recipes/npm.md` to serve the entry module without introducing a second client build system silently.
5. Add the markup contract only to forms whose normal action and method already work.
6. Adapt the supplied JavaScript-disabled and enhanced-path tests to a real target workflow, keeping the self-contained scenarios if they remain useful.
7. Run `checks.md` and the target repo's normal readiness gate.

This kit remains optional until repeated project use demonstrates that the pattern belongs in the template's core browser opinion.
