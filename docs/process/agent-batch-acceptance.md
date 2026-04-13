# Agent Batch Acceptance Rules

## Required checks before accepting a delegated task report

1. Verify every claimed commit SHA:

   ```bash
   ./scripts/verify-claimed-commit.sh <sha> "<expected subject fragment>"
   ```

2. Re-run the relevant test command.

3. At batch boundaries, run:

   ```bash
   npm test
   npx tsc -b
   npm run build
   ```

4. Treat `DONE_WITH_CONCERNS` as "requires explicit review", not "almost done".

5. Record any scope creep or bundled fixes in the batch notes.
