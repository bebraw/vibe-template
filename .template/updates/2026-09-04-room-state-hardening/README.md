# Harden Anonymous Room State

Use this update when a downstream project adopted the Room State kit before origin validation, event-length voter cookies, participant selection, and lockable revisions were added.

## Apply

1. Read ADR-059 and the current capability-kit spec.
2. Port the current Room State kit source and tests while preserving application-specific routes, rendering, choices, and authorization.
3. Pass allowed origins and the voter-cookie lifetime from the HTTP composition root. The request URL's same origin is accepted automatically.
4. Route room status changes through the same application authorization boundary as seed and reset.
5. Update snapshot consumers for `currentSelection`, `status`, and `revision`. Lock and record a revision before handing a result to model or presentation workflows.
6. Preserve the documented limitation: an opaque cookie is not authenticated identity and does not prevent deliberate multi-client ballot stuffing.

## Fallback

If the target already uses authenticated sessions and CSRF tokens, retain that stronger boundary and adapt only the status, revision, selection, and retention contracts. Do not add a second anonymous identity mechanism.

## Verify

- Run the Room State Workers-pool tests.
- Confirm foreign and missing origins return `403` without changing revision or totals.
- Confirm lock/reopen, identical votes, participant selection, and configured cookie lifetime.
- `npm run capabilities:verify`
- `npm run quality:gate`
