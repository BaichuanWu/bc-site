## ADDED Requirements

### Requirement: Alpha filtering covers supported WQB regions

The Alpha list region filter SHALL offer every region currently returned by the
WQB platform setting contract.

#### Scenario: User opens the Region filter

- **WHEN** the Alpha list filter options render
- **THEN** they include USA, GLB, EUR, ASI, CHN, JPN, IND, MEA, DEU, and GBR
- **AND** each option submits the unchanged uppercase platform value
