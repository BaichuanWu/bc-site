## Why

The Alpha tables hide their RA/PPA platform-check counts inside Diagnose, where the badges incorrectly omit additional margin, simulation, and correlation issues. Users need both check-only counts and complete diagnosis counts.

## What Changes

- Restore separate RA Count and PPA Count columns in the Alpha list and analysis tables.
- Keep check-only columns bound to `raBlockCount` and `ppaBlockCount`, with sorting supported in the list.
- Derive Diagnose badges from the lengths of `diagnostics.RA` and `diagnostics.PPA`, including all issue states and categories.
- Show unavailable diagnosis explicitly instead of reporting a zero issue count.

## Impact

Only bc-site changes. Existing camelCase API fields, backend count semantics, persistence, filters, and analysis ordering are unchanged. No migration or new API request is required.
