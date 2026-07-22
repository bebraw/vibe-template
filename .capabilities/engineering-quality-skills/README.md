# Engineering Quality Skills Capability Kit

Use this kit to add focused correctness review, test review, and systematic debugging workflows to another repository without adopting the whole template.

## Adds

- `correctness-review` for logic bugs, edge cases, async failures, and broken contracts backed by concrete triggering inputs
- `test-review` for meaningful coverage gaps, fragile tests, and low-value or stale tests
- `debug` for stop-the-line reproduction, localization, minimization, root-cause fixes, regression tests, and end-to-end verification
- Source revision metadata and the upstream MIT license for each vendored skill

The skills were reviewed from [`cniska/skills`](https://github.com/cniska/skills) at revision `7d79c7754f2b9d656f7db7b9ecefcb7532b6d256`. The debug skill is adapted to return to explicit planning when the design is wrong instead of assuming a `/plan` skill exists.

## Good Fit

- The target repo uses Codex or another agent that supports `SKILL.md` capabilities.
- Existing review guidance is broad but lacks focused correctness or test-adequacy lenses.
- Contributors want a disciplined debugging workflow that requires reproduction and regression coverage.
- The target repo can keep project-specific severity labels and verification commands in its own guidance.

## Poor Fit

- The target repo already has equivalent focused review and debugging skills.
- The agent harness does not discover repository-local `SKILL.md` files.
- The project wants automated static analysis or test tooling rather than agent workflow guidance.

## Apply

1. Read `manifest.json` and inspect the target repo's existing agent skills and instruction files.
2. Copy or merge the selected files from `files/` into the target paths.
3. Preserve an existing skill when it already provides stronger project-specific guidance; merge only the missing evidence thresholds or workflow steps.
4. Register the installed skills in the target repo's `AGENTS.md` or equivalent capability registry without duplicating existing rules.
5. Preserve each copied `LICENSE` file and the `source` and `revision` metadata in each `SKILL.md`.
6. Run the checks in `checks.md` and the target repo's normal documentation or quality checks.

No package-manager recipe is required because this kit adds no dependencies, scripts, generated outputs, or runtime behavior.
