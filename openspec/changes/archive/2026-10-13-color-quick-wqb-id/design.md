# Design

The Alpha list and analysis routes already receive `settings.simulationMode` from the Alpha API response. Each route uses that value when rendering the WQB ID cell, including linked and plain IDs, and removes the QUICK badge from State. The WQB ID remains a link where `wqbUrl` is present. No backend or shared table changes are needed.
