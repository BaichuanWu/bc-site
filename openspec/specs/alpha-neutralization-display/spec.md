# alpha-neutralization-display Specification

## Purpose
Keep Alpha neutralization settings readable in a compact frontend table column
while preserving the complete original setting for inspection and filtering.

## Requirements

### Requirement: Alpha neutralization cells use compact labels

The Alpha list SHALL display compact neutralization labels in a 110px column
headed Neutral while retaining the complete original value for hover inspection.
The display mapping SHALL affect only presentation.

#### Scenario: Display a long neutralization value

- **WHEN** a row uses REVERSION_AND_MOMENTUM
- **THEN** its neutralization cell displays Rev+Mom
- **AND** hovering the cell exposes REVERSION_AND_MOMENTUM
- **AND** settings values and filtering continue to use the original API value

#### Scenario: Display other long supported values

- **WHEN** a row uses SLOW_AND_FAST, STATISTICAL, SUBINDUSTRY or CROWDING
- **THEN** it displays Slow+Fast, Stat, Subind or Crowd respectively

#### Scenario: Display short, missing or future values

- **WHEN** a value is already short
- **THEN** it is displayed unchanged
- **WHEN** a value is missing
- **THEN** the cell displays an em dash
- **WHEN** a future value exceeds the column width
- **THEN** it is truncated with ellipsis and its original value is available on hover
