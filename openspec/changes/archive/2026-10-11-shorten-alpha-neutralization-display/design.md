# Design

Keep the label mapping in the existing WQB platform frontend helper. Render
REVERSION_AND_MOMENTUM as Rev+Mom, SLOW_AND_FAST as Slow+Fast, STATISTICAL as Stat,
SUBINDUSTRY as Subind and CROWDING as Crowd. Keep already short values unchanged,
unknown values readable with ellipsis, and missing values displayed as an em dash.

The Alpha column retains its settings.neutralization key and center alignment.
Change its width from 70px to 110px and header to Neutral. A full-width truncated
span carries the original value in its native title attribute, avoiding a second
tooltip that repeats the abbreviation. Do not change shared DataTable behavior.

Verification: focused ESLint, TypeScript and frontend contract checks. This is a
reversible presentation-only edit; inspect rendered cell markup and column
configuration without introducing new permanent test infrastructure. Review with
the already loaded code-review-and-quality skill and validate OpenSpec strictly.
