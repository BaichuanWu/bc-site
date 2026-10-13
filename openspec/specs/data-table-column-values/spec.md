# data-table-column-values Specification

## Purpose
Define consistent column value resolution for shared dashboard tables so nested
API fields display correctly in default cells and custom renderers, while
preserving literal properties and distinguishing missing Alpha metrics from zero.

## Requirements

### Requirement: DataTable resolves nested column values

DataTable SHALL resolve dot-separated column keys for both default cells and the
first argument of custom render callbacks, while preserving the row and refresh
callback arguments.

#### Scenario: Nested settings and metrics are displayed
- **WHEN** columns use `settings.neutralization` and `wqbData.is.returns`
- **THEN** the cells display their nested values, including numeric zero
- **AND** custom render callbacks receive those same resolved values

#### Scenario: A path is absent or interrupted
- **WHEN** a path contains a missing, null, or primitive intermediate value
- **THEN** resolution returns undefined without throwing
- **AND** null leaves and falsy values remain unchanged

#### Scenario: Literal properties remain compatible
- **WHEN** a row has an exact own property matching a column key
- **THEN** that property takes precedence even if its name contains dots
- **AND** its null or undefined value does not fall through to a nested value

#### Scenario: Nested arrays are displayed
- **WHEN** a column key includes a numeric array index such as `checks.0.name`
- **THEN** the cell displays the corresponding nested array entry

### Requirement: Alpha performance columns use the actual metric names

The Alpha list SHALL read `wqbData.is.returns` and `wqbData.is.drawdown` and display
unavailable values as `-`.

#### Scenario: Alpha metrics are available or absent
- **WHEN** an Alpha has returns or drawdown values
- **THEN** those columns display the metric multiplied by 100 with two decimals
- **AND** the drawdown column is titled `Drawdown`
- **WHEN** a metric is null or absent
- **THEN** its cell displays `-`, preserving the distinction from zero
