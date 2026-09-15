# Node Skill Validation

## Intent

Replace the repository’s reliance on the installed Python skill validator with a Node command and directly pinned `yaml@2.9.0`. This does not modify the installed system skill.

## Apply

Inspect `patch.diff` and try `git apply --check` before applying. Merge the `skill:validate` script and direct dev dependency into the target’s package metadata. Regenerate the lockfile through its package manager if it differs; do not overwrite unrelated dependencies. Copy the validator and CLI tests, preserve the existing tooling test glob, and update agent routing, skill-validation docs, the owning spec, architecture, and an appropriately numbered ADR.

## Manual Fallback

Port only these changes into diverged targets. Replace Python-validator instructions in current guidance and intentional mirrors, but leave historical update packs intact. Use the target’s actual skill paths. Keep YAML 1.1 scalar compatibility, explicit duplicate-key and warning rejection, the read-only CLI, and the separate UI metadata and behavioral review boundary. Do not add a new CI lane or persistent artifact directory.

## Verify

Run `node --test scripts/validate-skill.test.mjs`, validate a retained skill with `npm run skill:validate -- <skill-directory>`, and run the target’s normal baseline gate plus Local CI for the dependency change. When update-pack tooling is retained, run `node --test scripts/template-update-patches.test.mjs`. Record the update ID in the target’s existing adoption record after successful adoption.
