# Adopt the Web Quality Baseline

Use this update when a downstream Worker project wants the template's conservative response headers and broader Lighthouse audit.

## Apply

1. Review the existing response-header policy before applying the patch.
2. Add the HTML metadata and skip link using the target project's view conventions.
3. Add or merge the CSP, Permissions Policy, Referrer Policy, framing restriction, and MIME-sniffing protection.
4. Expand Lighthouse to audit performance, accessibility, best practices, and SEO in mobile and desktop modes.
5. If the project needs a durable review contract, copy `.capabilities/website-baseline/` from the current template and classify every conditional section.
6. Update the target project's owning spec or ADR.

## Fallback

Do not overwrite an existing CSP or permissions policy. Merge directives based on the resources and browser capabilities the target actually uses. Projects with scripts, external assets, embeds, or cross-origin forms must adapt the script-free starter policy.

If the target uses a different audit tool, preserve it and add equivalent accessibility, best-practices, and SEO coverage instead of installing Lighthouse.

## Verify

- Test response headers on successful and error HTML responses.
- Manually verify the skip link with a keyboard.
- Run the target project's browser audit in mobile and desktop modes.
- Run the target project's normal quality gate and local CI.
