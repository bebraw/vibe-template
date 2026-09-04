# npm Recipe

Use the target repo's existing client build and static-asset serving path. This kit does not prescribe a bundler.

## Test Dependency

If the target does not already use Playwright and the user approves adding it:

```bash
npm install --save-dev --save-exact @playwright/test@1.62.1
```

If Playwright is already pinned, adapt the test to that compatible version rather than installing a second copy.

## Client Entry

Copy:

- `files/src/browser/progressive-form.ts` to the target's typed browser source.
- `files/src/browser/progressive-form-entry.ts` to an existing client entrypoint or import `installProgressiveForms` from the target's current entry module.

Serve the compiled module as an external script allowed by the target's Content Security Policy. Do not paste it inline into server-rendered HTML.

## Markup Contract

```html
<section id="room-results" data-progressive-fragment tabindex="-1" aria-live="polite">
  <form action="/rooms/example" method="post" data-progressive-form data-progressive-target="#room-results">
    <!-- named controls and a submit button -->
  </form>
</section>
```

The server's GET response after a successful submission must contain the same declared fragment. The form must remain complete and valid when the external module is missing, blocked, or fails.

## Browser Tests

Copy or adapt `files/src/progressive-form.e2e.ts`. Keep `test.use({ javaScriptEnabled: false })` on at least one real form workflow. Add a JavaScript-enabled scenario that asserts:

- only the declared fragment changes;
- the resulting URL is correct;
- focus is preserved or moves to `data-progressive-focus`/the fragment;
- Back/Forward loads content matching the visible URL.
