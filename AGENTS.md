# Repo Guidance

This file adds repo-local acceptance rules for delegated batch work. It is intentionally narrow and supplements the broader Codex / OMX guidance already in effect for this workspace.

- When delegated work reports a commit SHA, verify it against git before accepting completion.
- At batch boundaries, use `npm test`, `npx tsc -b`, and `npm run build`; `tsc --noEmit` alone is not sufficient.
- Treat `DONE_WITH_CONCERNS` as a mandatory review state.
