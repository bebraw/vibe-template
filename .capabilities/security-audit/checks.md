# Checks

Run these after copying the kit to an adopter.

## Required

1. Confirm `SKILL.md`, every companion guide, `report-schema.json`, both validators, both validator tests, `SOURCE.md`, and `LICENSE` exist in the same `security-audit` directory.
2. Confirm `SOURCE.md` records revision `c1c8a8c1471069fb0e188eeaff69b8e8db6564a8` and the adopter's skill registry distinguishes full audits from focused security reviews.
3. Run `node --test .codex/skills/security-audit/validate-coverage-ledger.test.cjs .codex/skills/security-audit/validate-findings.test.cjs` from the adopter root.
4. Run the adopter's skill validator, if available, and its normal documentation or quality check.
5. Review the operator's output path and actual sandbox controls before requesting a full audit. This is an environment check, not a claim that the test suite supplies those controls.

## Expected Result

The two validator test files pass without installing dependencies. The skill is discoverable as a separate, opt-in audit workflow, while existing security guidance remains available for focused work. No audit-output directory or default CI gate is created by installation.
