# Validation

## Root cause and scope

The reported deployed detail page returns the route parameter as an encoded
`batch%3A...%40...` value in its RSC payload. Its compiled detail component encodes
that value again. Read-only HTTP checks against the user's deployment confirmed
the original encoded API reference returns 200 with title "GLB qualification bar
and level-signal null", while the twice-encoded reference returns 404 with
"Knowledge not found". The record exists; identity/version routing is the cause.

Only the frontend route boundary was changed. Existing working-tree changes were
retained. No backend, database, API shape or deployment was modified.

## Checks

- `node --test scripts/test-wqb-knowledge-routing.mjs`: baseline failed 3 of 4
  cases on actual detail-page API request construction; fixed implementation
  passes all 4. Coverage includes the reported batch reference, canonical tab
  paths, file slashes, Unicode, authored percent escapes, embedded @ characters,
  numeric IDs with leading zeros, database version references and malformed escapes.
- Focused `pnpm exec eslint` on the helper, detail page and test script: passed.
- `pnpm exec tsc --noEmit`: passed.
- `pnpm run check:frontend-contracts`: dashboard and API casing checks passed.
- `pnpm build`: Next.js 16.1.6 production build passed with the detail route present.
- `git diff --check`: passed.
- `openspec validate fix-wqb-knowledge-route-decoding --strict`: passed before and after implementation.

## Review

Reviewed the incremental fix using code-review-and-quality. One decoding pass at
the route boundary restores the existing original reference; API encoding and
version pinning remain in their existing owner. Tab URLs use the existing link
helper. Malformed escapes cannot crash rendering. Tests execute the actual detail
component and inspect the request and tab route. No dependency, shared component,
extra network call or unbounded work was introduced. No unresolved findings.

Browser UI verification was unavailable because the computer-use browser entry
points timed out. Read-only deployed HTTP evidence, actual component regression
tests and the production build were used for verification. The fix still needs
the normal frontend deployment to take effect on 10.242.85.240:8012.
