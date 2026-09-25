# Security Audit Capability Kit

Use this kit to add Cloudflare's source-first, multi-phase security audit workflow to a repository that wants explicit codebase audits. It is an opt-in agent workflow, not a CI gate or an automatic scan.

The kit vendors the complete [`cloudflare/security-audit-skill`](https://github.com/cloudflare/security-audit-skill) skill at revision `c1c8a8c1471069fb0e188eeaff69b8e8db6564a8`. `files/.codex/skills/security-audit/SOURCE.md` records its provenance and one Oxlint compatibility edit, and the adjacent `LICENSE` preserves its MIT terms.

## Adds

- `security-audit/SKILL.md` and its domain-specific hunting guides
- A coverage ledger, finding schema, and two dependency-free Node.js validators
- Validator tests and license/provenance files

The skill offers guidance mode for focused security questions. An explicit codebase audit or pen-test request starts its full six-phase workflow. Full audit mode records coverage, has independent agents challenge candidates and final findings, and writes machine-readable findings and reports.

## Good Fit

- The target uses an agent that discovers repository-local `SKILL.md` files and supports independent delegated agents.
- The team wants a deliberate, source-grounded audit with coverage and reviewable findings.
- The operator can provide a writable audit-output location outside the target repository and enforce the upstream execution sandbox before running target-controlled code.

## Poor Fit

- The target only needs proportional security review while implementing a change. Keep its existing focused security guidance for that work.
- The agent cannot support independent verification, or a full report would be disproportionate to the project.
- The required OS-enforced sandbox cannot be provided and the audit depends on executing target-controlled code. The skill must leave those leads as `needs_validation`.

## Apply

1. Inspect the target's existing agent instructions and security skills. Keep project-specific authorization, severity, and verification rules authoritative.
2. Read `manifest.json`, then copy the complete `files/.codex/skills/security-audit/` directory to the target's skill root. If that name already exists, review and merge deliberately; do not overwrite it blindly.
3. Keep `LICENSE` and `SOURCE.md` with the copied skill. Register `security-audit` as an **explicit full-audit** option in the target's agent guidance. Keep focused review routing with the target's existing security skill.
4. Before a full run, choose an output directory outside the target repository that the agent may write. If one is unavailable, select a version-control-ignored directory inside the target explicitly. Decide its retention policy and do not commit audit artifacts or secrets.
5. Check the upstream skill's sandbox requirements against the actual environment. A general workspace-write sandbox alone does not establish its empty environment, read-only target, resource limits, or write-isolation requirements. Do not execute target-controlled code unless every required control is enforced.
6. Run `checks.md` and the target's normal documentation or quality checks.

This kit adds no package dependency, default CI step, or runtime behavior. Node.js is needed to run the bundled validators and their tests.
