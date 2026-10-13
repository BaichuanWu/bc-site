# Shorten Alpha neutralization display

## Why

Long neutralization values such as REVERSION_AND_MOMENTUM overflow the Alpha
table's 70px column and crowd adjacent performance values.

## What Changes

Use compact frontend labels for long neutralization values, a 110px column with
a shorter header, and a hover title containing the complete original value.
Constrain cell text with ellipsis for unknown future values.

## Impact

bc-site only. API values, stored settings, filter options and query keys stay
unchanged. No migration or backend work is required.
