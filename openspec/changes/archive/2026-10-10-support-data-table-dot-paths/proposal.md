# Support DataTable dot paths

## Why

DataTable reads column keys as literal properties, so nested Alpha settings and
performance metrics are blank or incorrectly shown as zero.

## What Changes

Resolve dotted keys in the shared table for default cells and custom render
callbacks. Correct the Alpha drawdown spelling and show unavailable new metrics
as `-`.

## Impact

This affects bc-site only. Backend API contracts and sorting/filter keys remain
unchanged. Existing literal properties, including dotted property names, take
precedence over nested paths; no migration is required.
