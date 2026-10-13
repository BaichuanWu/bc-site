## ADDED Requirements

### Requirement: QUICK mode appears on the WQB ID

The Alpha list and Alpha analysis table SHALL render the WQB ID text in yellow when the saved simulation mode is QUICK. They SHALL render the WQB ID with its usual styling for other simulation modes, without adding a dedicated simulation-mode column or a QUICK badge beside State.

#### Scenario: A QUICK Alpha has a platform URL

- **WHEN** a QUICK Alpha with `wqbUrl` appears in either table
- **THEN** its yellow WQB ID remains a working link to that URL

#### Scenario: A QUICK Alpha has no platform URL

- **WHEN** a QUICK Alpha without `wqbUrl` appears in either table
- **THEN** its WQB ID still appears in yellow

#### Scenario: A FULL Alpha appears

- **WHEN** an Alpha whose saved simulation mode is FULL appears in either table
- **THEN** its WQB ID uses the usual link or plain-text styling
