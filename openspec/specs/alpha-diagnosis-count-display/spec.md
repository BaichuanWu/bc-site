# alpha-diagnosis-count-display Specification

## Purpose
Show separate RA/PPA platform-check counts alongside complete diagnosis summaries in the Alpha list and analysis tables, so users can distinguish check issues from additional simulation, margin, and correlation conditions.

## Requirements

### Requirement: Separate check-only target counts

The Alpha list and analysis tables SHALL show separate RA Count and PPA Count columns sourced from `raBlockCount` and `ppaBlockCount`. These columns SHALL preserve check-only semantics independently of Diagnose. The list columns SHALL support sorting by their existing API fields.

#### Scenario: Check counts differ from diagnosis counts
- **WHEN** an Alpha has `raBlockCount = 1` and `ppaBlockCount = 0`, with two RA diagnosis entries and three PPA diagnosis entries
- **THEN** both tables display RA Count 1 and PPA Count 0
- **AND** Diagnose displays RA 2 and PPA 3

#### Scenario: Sort by check-only count
- **WHEN** a user sorts RA Count or PPA Count in the Alpha list
- **THEN** the existing `raBlockCount` or `ppaBlockCount` API field is used for sorting

### Requirement: Complete diagnosis summary

The Diagnose summary SHALL count every entry in each target's diagnosis array, including platform checks and additional simulation, margin, and correlation conditions, irrespective of REJECT, BLOCKED, or PENDING state. The dialog SHALL continue to show the corresponding complete issue arrays.

#### Scenario: Multiple categories and states
- **WHEN** RA or PPA diagnosis includes check, margin, correlation, and simulation entries across all supported states
- **THEN** the target badge displays the length of the complete array

#### Scenario: No issues
- **WHEN** both diagnosis arrays are empty
- **THEN** Diagnose displays RA 0 and PPA 0
- **AND** the dialog shows No issues for each target

#### Scenario: Diagnosis unavailable
- **WHEN** diagnosis is absent
- **THEN** the summary and dialog indicate Diagnosis unavailable
- **AND** no zero diagnosis count is inferred from check counts
