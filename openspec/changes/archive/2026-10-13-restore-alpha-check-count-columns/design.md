## Context

Both Alpha routes already receive persisted check counts and the complete target-specific diagnosis. The shared AlphaDiagnoseCell currently accepts check counts and incorrectly uses them as its diagnosis summary.

## Decision

The list at `/dashboard/wqb/alpha` and related-entry table at `/dashboard/wqb/alpha/analysis` will each display RA Count and PPA Count beside Diagnose. Check-count cells read the existing persisted fields and preserve explicit zeros; missing values display a dash. The list columns retain their numeric sorting capability.

AlphaDiagnoseCell owns the complete diagnosis summary and dialog. Remove check-count props, calculate badges directly from each diagnosis array length, and keep all REJECT, BLOCKED, and PENDING entries. Missing diagnosis displays an unavailable summary and retains the existing unavailable dialog state. The dialog description explains the separate count meanings.

This uses only data already in each row. Fetching, navigation, filters, lineage ordering, page shells, and dialog behavior otherwise stay unchanged. There is no backend dependency or breaking API contract.

## Verification

Render the actual shared component against diagnosis with more issues than platform checks, zero issues, and missing diagnosis. Verify both tables expose their separate check columns. Run focused ESLint, TypeScript, dashboard standards, API casing, and strict OpenSpec validation.
