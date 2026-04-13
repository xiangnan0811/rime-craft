# Post-Batch Roadmap Plan Index

This index fans the approved roadmap spec into milestone-sized implementation plans.

Source design:
- `docs/superpowers/specs/2026-04-11-post-batch-roadmap-design.md`

Execution order:
1. `docs/superpowers/plans/2026-04-11-m1-product-contract-alignment.md`
2. `docs/superpowers/plans/2026-04-11-m2-workspace-persistence-and-yaml-fidelity.md`
3. `docs/superpowers/plans/2026-04-11-m3-safety-net-and-batch-hardening.md`
4. `docs/superpowers/plans/2026-04-11-m4-content-accuracy-and-process-hardening.md`

Rules:
- Do not skip `M1`. `M2` depends on the contract decisions being explicit first.
- Do not start `M3` until `M2` behavior is stable enough to freeze with tests and CI checks.
- Do not externalize `M4` process rules to home-level superpowers until the repo-local rules have survived one full batch.
- Historical batch docs under `docs/superpowers/batches/2026-04-11-deep-content-final/` are review artifacts, not the live source of truth. Do not rewrite them to represent the current product contract.

Expected artifact progression:
- `M1`: live product contract and copy align with current support reality
- `M2`: workspace auto-save + YAML high-fidelity editing land
- `M3`: regression guards freeze the new behavior
- `M4`: high-risk content is corrected and repo-local batch process is hardened

Repo-local process hardening output:
- `docs/process/agent-batch-acceptance.md`
- `scripts/verify-claimed-commit.sh`
