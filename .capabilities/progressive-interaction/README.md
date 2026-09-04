# Progressive Interaction Capability Kit

Use this kit to enhance conventional server-rendered forms without making JavaScript a prerequisite for completing the workflow.

## Adds

- Background GET or POST submission for explicitly marked same-origin forms.
- Replacement of one declared fragment from the returned HTML document.
- URL and browser-history updates when the response URL changes.
- Focus preservation or a declared replacement focus target.
- Native resubmission when the enhancement fails.
- A Playwright scenario that proves form submission with JavaScript disabled.

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
2. Copy or merge `files/src/browser/` into the existing typed client source.
3. Follow `recipes/npm.md` to serve the entry module without introducing a second client build system silently.
4. Add the markup contract only to forms whose normal action and method already work.
5. Adapt the JavaScript-disabled test to one real target workflow, keeping the supplied self-contained scenario if it remains useful.
6. Add an enhanced-path browser test for fragment replacement, URL, and focus behavior in the target application.
7. Run `checks.md` and the target repo's normal readiness gate.

This kit remains optional until repeated project use demonstrates that the pattern belongs in the template's core browser opinion.
