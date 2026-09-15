# Optional Modern Browser Types

## Intent

Give agents an opt-in response to missing browser API declarations without installing a default dependency or changing browser-support requirements.

## Apply

Try `git apply --check` with this pack’s `patch.diff`, then apply the patch if it fits. The patch updates Modern Web Guidance, its agent-skill contract, and ADR-052’s rationale.

## Manual Fallback

Port the Missing Browser Types paragraph into the target’s existing browser guidance and update its owning spec and ADR. Preserve local paths and any intentional skill mirrors. Recommend `modern-web-types` only for a justified API with missing declarations; require current installation documentation, dependency approval, a reviewed version pin, and verification with active TypeScript toolchains. Keep browser support, feature detection, fallbacks, and Cloudflare runtime typing boundaries intact. Do not install the package as part of this update or restore a removed skill solely for this note.

## Verify

Run `npm run format:check` and, if retained, `node --test scripts/template-update-patches.test.mjs`. Review the guidance for opt-in scope and unchanged compatibility policy. Record the update ID in the target’s existing adoption record after applying it.
